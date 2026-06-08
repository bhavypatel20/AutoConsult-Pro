const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

async function generateTxnNum(businessId) {
  let attempts = 0;
  let nextNum = 10001;
  
  while (attempts < 10) {
    const lastTxn = await prisma.transaction.findFirst({
      orderBy: { transactionNum: 'desc' }
    });
    
    if (lastTxn && lastTxn.transactionNum.startsWith('TXN-')) {
      const numPart = parseInt(lastTxn.transactionNum.replace('TXN-', ''));
      if (!isNaN(numPart)) {
        nextNum = Math.max(nextNum, numPart + 1);
      }
    }
    
    const proposedTxnNum = `TXN-${nextNum}`;
    
    // Check if proposed TxnNum already exists
    const exists = await prisma.transaction.findUnique({
      where: { transactionNum: proposedTxnNum }
    });
    
    if (!exists) {
      return proposedTxnNum;
    }
    
    // If it exists, increment and try again
    nextNum++;
    attempts++;
  }
  
  return `TXN-${Date.now()}`;
}

router.get('/summary', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) {
      return res.status(400).json({ error: "businessId query parameter is required" });
    }
    const deals = await prisma.deal.findMany({
      where: { businessId },
      include: { car: { include: { expenses: true } }, customer: true },
      orderBy: { createdAt: "desc" }
    });

    const ledgers = await prisma.customerLedger.findMany({
      where: { businessId }
    });

    const dealsWithLedger = deals.map(deal => {
      const ledger = ledgers.find(l => l.dealId === deal.id);
      return {
        ...deal,
        advanceReceived: ledger ? ledger.advanceReceived : 0
      };
    });

    const expenses = await prisma.expense.findMany({
      where: { car: { businessId } },
      include: { car: true },
      orderBy: { date: "desc" }
    });

    res.json({ deals: dealsWithLedger, expenses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/expense', async (req, res) => {
  try {
    const { carId, amount, description, expenseType, paidBy, businessId, date } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "businessId body parameter is required" });
    }
    if (!carId) return res.status(400).json({ error: "Car must be selected" });

    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }
    if (car.businessId !== businessId) {
      return res.status(403).json({ error: "Unauthorized: Car does not belong to your business." });
    }

    const parsedAmount = parseFloat(amount);
    const customDate = date ? new Date(date) : undefined;

    // 1. Create the legacy Expense record
    const expense = await prisma.expense.create({
      data: {
        carId,
        amount: parsedAmount,
        description,
        expenseType,
        paidBy,
        date: customDate,
      },
    });

    // 2. Adjust cash/bank balance OR partner ledger and create a Master Transaction
    let cashAccount = await prisma.bankAccount.findFirst({
      where: { businessId, name: "Cash" }
    });
    if (!cashAccount) {
      cashAccount = await prisma.bankAccount.create({
        data: { businessId, name: "Cash", balance: 0 }
      });
    }

    const txnNum = await generateTxnNum(businessId);

    if (paidBy === 'Company') {
      // Deduct from Cash account balance
      await prisma.bankAccount.update({
        where: { id: cashAccount.id },
        data: { balance: cashAccount.balance - parsedAmount }
      });

      // Create Transaction
      await prisma.transaction.create({
        data: {
          transactionNum: txnNum,
          businessId,
          type: 'EXPENSE',
          amount: parsedAmount,
          paymentMode: 'CASH',
          fromAccountId: cashAccount.id,
          relatedEntityId: carId,
          date: customDate,
          notes: `Vehicle Expense (${expenseType}) for ${car.brand} ${car.model}: ${description || ''}`
        }
      });
    } else {
      // Find the partner matching the paidBy name
      const partner = await prisma.partner.findFirst({
        where: { businessId, name: paidBy }
      });
      if (partner) {
        // Increase partner liability
        await prisma.partnerLedger.create({
          data: {
            businessId,
            partnerId: partner.id,
            type: 'EXPENSE_PAID_BY_PARTNER',
            amount: parsedAmount,
            notes: `Vehicle Expense (${expenseType}) for ${car.brand} ${car.model} paid by partner. Notes: ${description || ''}`,
            carId: carId,
            date: customDate,
          }
        });

        // Create Transaction
        await prisma.transaction.create({
          data: {
            transactionNum: txnNum,
            businessId,
            type: 'EXPENSE',
            amount: parsedAmount,
            paymentMode: 'CASH',
            relatedEntityId: partner.id,
            date: customDate,
            notes: `Vehicle Expense (${expenseType}) paid personally by partner ${paidBy}`
          }
        });
      }
    }

    // 3. Also create an ExpenseEntry so it's logged in the ERP expenses tab
    await prisma.expenseEntry.create({
      data: {
        businessId,
        amount: parsedAmount,
        category: expenseType === 'Repair' ? 'REPAIR' : expenseType === 'Service' ? 'SERVICE' : 'MISCELLANEOUS',
        paidBy: paidBy === 'Company' ? 'Company' : 'Partner',
        partnerId: paidBy !== 'Company' ? (await prisma.partner.findFirst({ where: { businessId, name: paidBy } }))?.id || null : null,
        carId,
        date: customDate,
        notes: `Vehicle Expense: ${description || ''}`
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/deal', async (req, res) => {
  try {
    const { customerId, carId, finalPrice, paymentStatus, businessId, dealDate, receivedAmount, paymentDate, paymentMode, bankAccountId } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "businessId body parameter is required" });
    }
    if (!customerId || !carId) return res.status(400).json({ error: "Customer and Car must be selected" });

    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }
    if (car.businessId !== businessId) {
      return res.status(403).json({ error: "Unauthorized: Car does not belong to your business." });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    if (customer.businessId !== businessId) {
      return res.status(403).json({ error: "Unauthorized: Customer does not belong to your business." });
    }

    const parsedPrice = parseFloat(finalPrice);
    const parsedReceived = receivedAmount !== undefined && receivedAmount !== "" ? parseFloat(receivedAmount) : 0;
    const remaining = Math.max(0, parsedPrice - parsedReceived);

    const deal = await prisma.deal.create({
      data: {
        customerId,
        carId,
        finalPrice: parsedPrice,
        paymentStatus,
        businessId: businessId,
        dealDate: dealDate ? new Date(dealDate) : new Date(),
      },
    });

    await prisma.car.update({
      where: { id: carId },
      data: { status: "Sold", finalSellPrice: parsedPrice },
    });

    await prisma.customer.update({
      where: { id: customerId },
      data: { stage: "Deal Closed" },
    });

    // 1. Immediately create a CustomerLedger
    let ledgerStatus = 'Pending';
    if (paymentStatus === 'Paid' || remaining <= 0) {
      ledgerStatus = 'Completed';
    } else if (parsedReceived > 0) {
      ledgerStatus = 'Partial';
    }

    const ledger = await prisma.customerLedger.create({
      data: {
        businessId,
        customerId,
        dealId: deal.id,
        totalAmount: parsedPrice,
        advanceReceived: parsedReceived,
        remainingAmount: remaining,
        status: ledgerStatus,
      }
    });

    // 2. If receivedAmount > 0, log a master transaction and update bank balance
    if (parsedReceived > 0) {
      let targetAccountId = bankAccountId || null;
      if (!targetAccountId) {
        // Fallback: Default Cash Account
        let cashAccount = await prisma.bankAccount.findFirst({
          where: { businessId, name: "Cash" }
        });
        if (!cashAccount) {
          cashAccount = await prisma.bankAccount.create({
            data: { businessId, name: "Cash", balance: 0 }
          });
        }
        targetAccountId = cashAccount.id;
      }

      // Update BankAccount balance
      const account = await prisma.bankAccount.findUnique({ where: { id: targetAccountId } });
      if (account && account.businessId === businessId) {
        await prisma.bankAccount.update({
          where: { id: targetAccountId },
          data: { balance: account.balance + parsedReceived }
        });
      }

      // Create transaction
      const txnNum = await generateTxnNum(businessId);
      await prisma.transaction.create({
        data: {
          transactionNum: txnNum,
          businessId,
          type: 'CUSTOMER_PAYMENT',
          amount: parsedReceived,
          paymentMode: paymentMode || 'CASH',
          toAccountId: targetAccountId,
          relatedEntityId: customerId,
          date: paymentDate ? new Date(paymentDate) : (dealDate ? new Date(dealDate) : new Date()),
          notes: `Down payment / installment received upon closing deal for ${car.brand} ${car.model}.`
        }
      });
    }

    res.status(201).json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/expense/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, expenseType, paidBy, businessId } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "businessId body parameter is required" });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { car: true }
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    if (expense.car.businessId !== businessId) {
      return res.status(403).json({ error: "Unauthorized: Expense does not belong to your business." });
    }

    const oldAmount = expense.amount;
    const oldPaidBy = expense.paidBy;
    const newAmount = parseFloat(amount);

    // 1. Reverse old impact
    let cashAccount = await prisma.bankAccount.findFirst({ where: { businessId, name: "Cash" } });
    if (!cashAccount) {
      cashAccount = await prisma.bankAccount.create({ data: { businessId, name: "Cash", balance: 0 } });
    }

    if (oldPaidBy === 'Company') {
      // Refund cash balance
      await prisma.bankAccount.update({
        where: { id: cashAccount.id },
        data: { balance: cashAccount.balance + oldAmount }
      });
    } else {
      const oldPartner = await prisma.partner.findFirst({ where: { businessId, name: oldPaidBy } });
      if (oldPartner) {
        const entry = await prisma.partnerLedger.findFirst({
          where: { partnerId: oldPartner.id, type: 'EXPENSE_PAID_BY_PARTNER', amount: oldAmount, carId: expense.carId }
        });
        if (entry) {
          await prisma.partnerLedger.delete({ where: { id: entry.id } });
        }
      }
    }

    // 2. Apply new impact
    if (paidBy === 'Company') {
      await prisma.bankAccount.update({
        where: { id: cashAccount.id },
        data: { balance: cashAccount.balance - newAmount }
      });

      const txnNum = await generateTxnNum(businessId);
      await prisma.transaction.create({
        data: {
          transactionNum: txnNum,
          businessId,
          type: 'EXPENSE',
          amount: newAmount,
          paymentMode: 'CASH',
          fromAccountId: cashAccount.id,
          relatedEntityId: expense.carId,
          notes: `Updated Vehicle Expense: ${description || ''}`
        }
      });
    } else {
      const newPartner = await prisma.partner.findFirst({ where: { businessId, name: paidBy } });
      if (newPartner) {
        await prisma.partnerLedger.create({
          data: {
            businessId,
            partnerId: newPartner.id,
            type: 'EXPENSE_PAID_BY_PARTNER',
            amount: newAmount,
            notes: `Updated Vehicle Expense paid by partner: ${description || ''}`,
            carId: expense.carId
          }
        });

        const txnNum = await generateTxnNum(businessId);
        await prisma.transaction.create({
          data: {
            transactionNum: txnNum,
            businessId,
            type: 'EXPENSE',
            amount: newAmount,
            paymentMode: 'CASH',
            relatedEntityId: newPartner.id,
            notes: `Updated Vehicle Expense paid personally by partner ${paidBy}`
          }
        });
      }
    }

    // Update the legacy expense record
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        amount: newAmount,
        description,
        expenseType,
        paidBy,
      },
    });

    // Sync corresponding ExpenseEntry in the ERP
    const erpEntry = await prisma.expenseEntry.findFirst({
      where: { carId: expense.carId, amount: oldAmount }
    });
    if (erpEntry) {
      await prisma.expenseEntry.update({
        where: { id: erpEntry.id },
        data: {
          amount: newAmount,
          paidBy: paidBy === 'Company' ? 'Company' : 'Partner',
          partnerId: paidBy !== 'Company' ? (await prisma.partner.findFirst({ where: { businessId, name: paidBy } }))?.id || null : null,
          notes: `Vehicle Expense: ${description || ''}`
        }
      });
    }

    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/expense/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { businessId } = req.query;
    if (!businessId) {
      return res.status(400).json({ error: "businessId query parameter is required" });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { car: true }
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    if (expense.car.businessId !== businessId) {
      return res.status(403).json({ error: "Unauthorized: Expense does not belong to your business." });
    }

    const oldAmount = expense.amount;
    const oldPaidBy = expense.paidBy;

    // 1. Reverse old impact
    let cashAccount = await prisma.bankAccount.findFirst({ where: { businessId, name: "Cash" } });
    if (cashAccount) {
      if (oldPaidBy === 'Company') {
        await prisma.bankAccount.update({
          where: { id: cashAccount.id },
          data: { balance: cashAccount.balance + oldAmount }
        });
      } else {
        const oldPartner = await prisma.partner.findFirst({ where: { businessId, name: oldPaidBy } });
        if (oldPartner) {
          const entry = await prisma.partnerLedger.findFirst({
            where: { partnerId: oldPartner.id, type: 'EXPENSE_PAID_BY_PARTNER', amount: oldAmount, carId: expense.carId }
          });
          if (entry) {
            await prisma.partnerLedger.delete({ where: { id: entry.id } });
          }
        }
      }
    }

    // 2. Delete corresponding ExpenseEntry in the ERP
    const erpEntry = await prisma.expenseEntry.findFirst({
      where: { carId: expense.carId, amount: oldAmount }
    });
    if (erpEntry) {
      await prisma.expenseEntry.delete({ where: { id: erpEntry.id } });
    }

    // 3. Delete the legacy expense
    await prisma.expense.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/deal/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { finalPrice, paymentStatus, businessId, dealDate } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "businessId body parameter is required" });
    }

    const deal = await prisma.deal.findUnique({
      where: { id }
    });

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    if (deal.businessId !== businessId) {
      return res.status(403).json({ error: "Unauthorized: Deal does not belong to your business." });
    }

    const parsedPrice = parseFloat(finalPrice);
    let parsedReceived = 0;
    if (paymentStatus === 'Paid') {
      parsedReceived = parsedPrice;
    } else if (paymentStatus === 'Partial') {
      parsedReceived = parseFloat(req.body.receivedAmount) || 0;
    }

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: {
        finalPrice: parsedPrice,
        paymentStatus,
        dealDate: dealDate ? new Date(dealDate) : undefined,
      },
    });

    // Sync finalSellPrice on associated Car
    await prisma.car.update({
      where: { id: deal.carId },
      data: { finalSellPrice: parsedPrice }
    });

    // Update CustomerLedger
    const remaining = Math.max(0, parsedPrice - parsedReceived);
    let ledgerStatus = 'Pending';
    if (paymentStatus === 'Paid' || remaining <= 0) {
      ledgerStatus = 'Completed';
    } else if (parsedReceived > 0) {
      ledgerStatus = 'Partial';
    }

    const ledger = await prisma.customerLedger.findFirst({
      where: { dealId: id }
    });

    const oldReceived = ledger ? ledger.advanceReceived : 0;
    const increment = parsedReceived - oldReceived;

    if (ledger) {
      await prisma.customerLedger.update({
        where: { id: ledger.id },
        data: {
          totalAmount: parsedPrice,
          advanceReceived: parsedReceived,
          remainingAmount: remaining,
          status: ledgerStatus,
          customerId: deal.customerId
        }
      });
    } else {
      await prisma.customerLedger.create({
        data: {
          businessId,
          customerId: deal.customerId,
          dealId: id,
          totalAmount: parsedPrice,
          advanceReceived: parsedReceived,
          remainingAmount: remaining,
          status: ledgerStatus,
        }
      });
    }

    // Process bank account updates and transaction logs if payment amount has changed
    if (increment > 0) {
      const { paymentDate, paymentMode, bankAccountId } = req.body;
      let targetAccountId = bankAccountId || null;
      if (!targetAccountId) {
        // Fallback: Default Cash Account
        let cashAccount = await prisma.bankAccount.findFirst({
          where: { businessId, name: "Cash" }
        });
        if (!cashAccount) {
          cashAccount = await prisma.bankAccount.create({
            data: { businessId, name: "Cash", balance: 0 }
          });
        }
        targetAccountId = cashAccount.id;
      }

      // Update BankAccount balance
      const account = await prisma.bankAccount.findUnique({ where: { id: targetAccountId } });
      if (account && account.businessId === businessId) {
        await prisma.bankAccount.update({
          where: { id: targetAccountId },
          data: { balance: account.balance + increment }
        });
      }

      // Create transaction
      const txnNum = await generateTxnNum(businessId);
      const car = await prisma.car.findUnique({ where: { id: deal.carId } });
      await prisma.transaction.create({
        data: {
          transactionNum: txnNum,
          businessId,
          type: 'CUSTOMER_PAYMENT',
          amount: increment,
          paymentMode: paymentMode || 'CASH',
          toAccountId: targetAccountId,
          relatedEntityId: deal.customerId,
          date: paymentDate ? new Date(paymentDate) : new Date(),
          notes: `Installment received for ${car ? (car.brand + ' ' + car.model) : 'vehicle'}.`
        }
      });
    } else if (increment < 0) {
      const decrement = Math.abs(increment);
      let cashAccount = await prisma.bankAccount.findFirst({
        where: { businessId, name: "Cash" }
      });
      if (cashAccount) {
        await prisma.bankAccount.update({
          where: { id: cashAccount.id },
          data: { balance: cashAccount.balance - decrement }
        });
      }

      const txnNum = await generateTxnNum(businessId);
      await prisma.transaction.create({
        data: {
          transactionNum: txnNum,
          businessId,
          type: 'CUSTOMER_PAYMENT',
          amount: -decrement,
          paymentMode: 'CASH',
          relatedEntityId: deal.customerId,
          date: new Date(),
          notes: `Adjustment correction for deal payment change.`
        }
      });
    }

    res.json(updatedDeal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/deal/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { businessId } = req.query;
    if (!businessId) {
      return res.status(400).json({ error: "businessId query parameter is required" });
    }

    const deal = await prisma.deal.findUnique({
      where: { id }
    });

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    if (deal.businessId !== businessId) {
      return res.status(403).json({ error: "Unauthorized: Deal does not belong to your business." });
    }

    // Delete the deal
    await prisma.deal.delete({
      where: { id }
    });

    // Reset associated Car status to Available and clear finalSellPrice
    await prisma.car.update({
      where: { id: deal.carId },
      data: { status: "Available", finalSellPrice: null }
    });

    // Revert associated Customer stage to Negotiation
    await prisma.customer.update({
      where: { id: deal.customerId },
      data: { stage: "Negotiation" }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

