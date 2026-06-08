const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup multer for billing documents
const billStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), '..', 'frontend', 'public', 'bills');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const safeFilename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "_")}`;
    cb(null, safeFilename);
  }
});
const uploadBill = multer({ storage: billStorage });

// Helper to generate unique transaction number
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

// 1. Partners CRUD
router.get('/partners', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: "businessId query parameter is required" });
    
    // Self-healing: Ensure OWNER is created as a Partner in the Partner table
    const ownerMember = await prisma.businessMember.findFirst({
      where: { businessId, role: 'OWNER' }
    });
    if (ownerMember) {
      const existingPartner = await prisma.partner.findFirst({
        where: { businessId, email: ownerMember.email }
      });
      if (!existingPartner) {
        await prisma.partner.create({
          data: {
            businessId,
            name: ownerMember.name,
            email: ownerMember.email || 'owner@autoconsult.com',
            phone: ownerMember.phone || '0000000000',
            ownershipPercent: 100
          }
        });
      }
    }

    const partners = await prisma.partner.findMany({
      where: { businessId },
      include: { ledgerEntries: true },
      orderBy: { name: 'asc' }
    });
    
    // Calculate current balance for each partner
    const formatted = partners.map(partner => {
      let balance = 0;
      partner.ledgerEntries.forEach(entry => {
        if (['CAPITAL_INVESTMENT', 'EXPENSE_PAID_BY_PARTNER', 'PROFIT_SHARE'].includes(entry.type)) {
          balance += entry.amount;
        } else if (['CAPITAL_RETURN', 'WITHDRAWAL'].includes(entry.type)) {
          balance -= entry.amount;
        } else if (entry.type === 'ADJUSTMENT') {
          // Adjustments can be positive or negative
          balance += entry.amount;
        }
      });
      return { ...partner, currentBalance: balance };
    });
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/partners', async (req, res) => {
  try {
    const { name, phone, email, address, ownershipPercent, businessId } = req.body;
    if (!businessId) return res.status(400).json({ error: "businessId is required" });
    
    const partner = await prisma.partner.create({
      data: {
        name,
        phone,
        email,
        address,
        ownershipPercent: ownershipPercent ? parseFloat(ownershipPercent) : null,
        businessId
      }
    });
    res.status(201).json(partner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/partners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, ownershipPercent, isActive, businessId } = req.body;
    
    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner || partner.businessId !== businessId) return res.status(404).json({ error: "Partner not found" });
    
    const updated = await prisma.partner.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        address,
        ownershipPercent: ownershipPercent ? parseFloat(ownershipPercent) : null,
        isActive: isActive === 'true' || isActive === true
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Partner Ledger Entry
router.get('/partners/:id/ledger', async (req, res) => {
  try {
    const { id } = req.params;
    const { businessId } = req.query;
    
    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner || partner.businessId !== businessId) return res.status(404).json({ error: "Partner not found" });
    
    const ledger = await prisma.partnerLedger.findMany({
      where: { partnerId: id, businessId },
      orderBy: { date: 'desc' }
    });
    res.json(ledger);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/partners/:id/ledger', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, notes, bankAccountId, businessId, date } = req.body;
    
    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner || partner.businessId !== businessId) return res.status(404).json({ error: "Partner not found" });
    
    const parsedAmount = parseFloat(amount);
    const parsedDate = date ? new Date(date) : new Date();
    
    // Create ledger entry
    const entry = await prisma.partnerLedger.create({
      data: {
        businessId,
        partnerId: id,
        type,
        amount: parsedAmount,
        notes,
        date: parsedDate
      }
    });
    
    // Double entry tracking: Update bank accounts and create Master transactions
    if (['CAPITAL_INVESTMENT', 'CAPITAL_RETURN', 'WITHDRAWAL'].includes(type) && bankAccountId) {
      const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
      if (account && account.businessId === businessId) {
        let newBalance = account.balance;
        let txnType = '';
        
        if (type === 'CAPITAL_INVESTMENT') {
          newBalance += parsedAmount;
          txnType = 'PARTNER_INVESTMENT';
        } else {
          newBalance -= parsedAmount;
          txnType = type === 'CAPITAL_RETURN' ? 'CAPITAL_RETURN' : 'WITHDRAWAL';
        }
        
        // Update Bank Balance
        await prisma.bankAccount.update({
          where: { id: bankAccountId },
          data: { balance: newBalance }
        });
        
        // Create Transaction Audit Record
        const txnNum = await generateTxnNum(businessId);
        await prisma.transaction.create({
          data: {
            transactionNum: txnNum,
            businessId,
            type: txnType,
            amount: parsedAmount,
            paymentMode: account.name === 'Cash' ? 'CASH' : 'BANK_TRANSFER',
            [type === 'CAPITAL_INVESTMENT' ? 'toAccountId' : 'fromAccountId']: bankAccountId,
            relatedEntityId: id,
            notes: `Partner Ledger: ${notes || type}`,
            date: parsedDate
          }
        });
      }
    }
    
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Bank Account CRUD & Transfers
router.get('/bank-accounts', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: "businessId query parameter is required" });
    
    // Self-healing: Initialize "Cash" account if none exist
    const count = await prisma.bankAccount.count({ where: { businessId } });
    if (count === 0) {
      await prisma.bankAccount.create({
        data: {
          businessId,
          name: "Cash",
          balance: 0
        }
      });
    }
    
    const accounts = await prisma.bankAccount.findMany({
      where: { businessId },
      orderBy: { name: 'asc' }
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bank-accounts', async (req, res) => {
  try {
    const { name, accountNumber, balance, businessId } = req.body;
    if (!businessId) return res.status(400).json({ error: "businessId is required" });
    
    const account = await prisma.bankAccount.create({
      data: {
        name,
        accountNumber,
        balance: balance ? parseFloat(balance) : 0,
        businessId
      }
    });
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bank-accounts/transfer', async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, notes, businessId } = req.body;
    if (!businessId) return res.status(400).json({ error: "businessId is required" });
    
    const parsedAmount = parseFloat(amount);
    
    const fromAcc = await prisma.bankAccount.findUnique({ where: { id: fromAccountId } });
    const toAcc = await prisma.bankAccount.findUnique({ where: { id: toAccountId } });
    
    if (!fromAcc || fromAcc.businessId !== businessId || !toAcc || toAcc.businessId !== businessId) {
      return res.status(404).json({ error: "One or both bank accounts not found" });
    }
    
    if (fromAcc.balance < parsedAmount) {
      return res.status(400).json({ error: "Insufficient balance in source account" });
    }
    
    // Process transfer
    await prisma.bankAccount.update({
      where: { id: fromAccountId },
      data: { balance: fromAcc.balance - parsedAmount }
    });
    await prisma.bankAccount.update({
      where: { id: toAccountId },
      data: { balance: toAcc.balance + parsedAmount }
    });
    
    // Create master transaction
    const txnNum = await generateTxnNum(businessId);
    const txn = await prisma.transaction.create({
      data: {
        transactionNum: txnNum,
        businessId,
        type: 'TRANSFER',
        amount: parsedAmount,
        paymentMode: fromAcc.name === 'Cash' || toAcc.name === 'Cash' ? 'CASH' : 'BANK_TRANSFER',
        fromAccountId,
        toAccountId,
        notes: notes || `Transfer from ${fromAcc.name} to ${toAcc.name}`
      }
    });
    
    res.json({ success: true, transaction: txn });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Transactions List
router.get('/transactions', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: "businessId is required" });
    
    const txns = await prisma.transaction.findMany({
      where: { businessId },
      orderBy: { date: 'desc' }
    });
    res.json(txns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Customer Ledgers & Payments
router.get('/customer-ledgers', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: "businessId is required" });
    
    // Self-healing: Ensure a CustomerLedger exists for every closed Deal
    const deals = await prisma.deal.findMany({
      where: { businessId },
      include: { customer: true }
    });
    
    for (const deal of deals) {
      const existing = await prisma.customerLedger.findFirst({
        where: { customerId: deal.customerId, dealId: deal.id }
      });
      if (!existing) {
        await prisma.customerLedger.create({
          data: {
            businessId,
            customerId: deal.customerId,
            dealId: deal.id,
            totalAmount: deal.finalPrice,
            advanceReceived: 0,
            remainingAmount: deal.finalPrice,
            status: deal.paymentStatus === 'Paid' ? 'Completed' : 'Pending'
          }
        });
      }
    }
    
    const ledgers = await prisma.customerLedger.findMany({
      where: { businessId },
      include: { customer: true },
      orderBy: { updatedAt: 'desc' }
    });
    
    res.json(ledgers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/customer-ledgers/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMode, bankAccountId, notes, businessId } = req.body;
    
    const ledger = await prisma.customerLedger.findUnique({
      where: { id },
      include: { customer: true }
    });
    
    if (!ledger || ledger.businessId !== businessId) return res.status(404).json({ error: "Ledger not found" });
    
    const parsedAmount = parseFloat(amount);
    const newPaid = ledger.advanceReceived + parsedAmount;
    const newRemaining = ledger.totalAmount - newPaid;
    let newStatus = 'Partial';
    if (newRemaining <= 0) {
      newStatus = 'Completed';
    }
    
    // 1. Update Ledger Specs
    await prisma.customerLedger.update({
      where: { id },
      data: {
        advanceReceived: newPaid,
        remainingAmount: Math.max(0, newRemaining),
        status: newStatus
      }
    });
    
    // 2. Update Bank Account Balance
    if (bankAccountId) {
      const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
      if (account && account.businessId === businessId) {
        await prisma.bankAccount.update({
          where: { id: bankAccountId },
          data: { balance: account.balance + parsedAmount }
        });
      }
    }
    
    // 3. Create Master Transaction Record
    const txnNum = await generateTxnNum(businessId);
    await prisma.transaction.create({
      data: {
        transactionNum: txnNum,
        businessId,
        type: 'CUSTOMER_PAYMENT',
        amount: parsedAmount,
        paymentMode,
        toAccountId: bankAccountId,
        relatedEntityId: ledger.customerId,
        notes: notes || `Installment payment from customer ${ledger.customer.name}`
      }
    });
    
    // 4. Update deal paymentStatus if deal completes
    if (newRemaining <= 0 && ledger.dealId) {
      await prisma.deal.update({
        where: { id: ledger.dealId },
        data: { paymentStatus: 'Paid' }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Seller Ledgers & Payments
router.get('/seller-ledgers', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: "businessId is required" });
    
    // Self-healing: Ensure a SellerLedger exists for every Car in inventory
    const cars = await prisma.car.findMany({ where: { businessId } });
    for (const car of cars) {
      const existing = await prisma.sellerLedger.findFirst({
        where: { carId: car.id }
      });
      if (!existing) {
        // Assume all legacy vehicles were fully paid at purchase price
        await prisma.sellerLedger.create({
          data: {
            businessId,
            carId: car.id,
            sellerName: car.sellerName || "Direct Seller",
            totalPurchaseAmount: car.purchasePrice,
            paidAmount: car.purchasePrice,
            pendingAmount: 0,
            status: 'Completed'
          }
        });
      }
    }
    
    const ledgers = await prisma.sellerLedger.findMany({
      where: { businessId },
      include: { car: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(ledgers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/seller-ledgers/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMode, bankAccountId, notes, businessId } = req.body;
    
    const ledger = await prisma.sellerLedger.findUnique({
      where: { id },
      include: { car: true }
    });
    if (!ledger || ledger.businessId !== businessId) return res.status(404).json({ error: "Seller ledger not found" });
    
    const parsedAmount = parseFloat(amount);
    const newPaid = ledger.paidAmount + parsedAmount;
    const newRemaining = ledger.totalPurchaseAmount - newPaid;
    let newStatus = 'Partial';
    if (newRemaining <= 0) {
      newStatus = 'Completed';
    }
    
    // Update Seller Ledger record
    await prisma.sellerLedger.update({
      where: { id },
      data: {
        paidAmount: newPaid,
        pendingAmount: Math.max(0, newRemaining),
        status: newStatus
      }
    });
    
    // Deduct dealership bank balance
    if (bankAccountId) {
      const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
      if (account && account.businessId === businessId) {
        await prisma.bankAccount.update({
          where: { id: bankAccountId },
          data: { balance: account.balance - parsedAmount }
        });
      }
    }
    
    // Log master transaction
    const txnNum = await generateTxnNum(businessId);
    await prisma.transaction.create({
      data: {
        transactionNum: txnNum,
        businessId,
        type: 'SELLER_PAYMENT',
        amount: parsedAmount,
        paymentMode,
        fromAccountId: bankAccountId,
        relatedEntityId: ledger.carId,
        notes: notes || `Payment to seller ${ledger.sellerName} for vehicle purchase`
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Income CRUD
router.get('/income', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: "businessId is required" });
    
    const entries = await prisma.incomeEntry.findMany({
      where: { businessId },
      orderBy: { date: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/income', async (req, res) => {
  try {
    const { amount, category, paymentMode, bankAccountId, notes, date, businessId } = req.body;
    if (!businessId) return res.status(400).json({ error: "businessId is required" });
    
    const parsedAmount = parseFloat(amount);
    
    // Log Income record
    const income = await prisma.incomeEntry.create({
      data: {
        businessId,
        amount: parsedAmount,
        category,
        paymentMode,
        accountId: bankAccountId,
        notes,
        date: date ? new Date(date) : new Date()
      }
    });
    
    // Add to dealership bank account balance
    if (bankAccountId) {
      const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
      if (account && account.businessId === businessId) {
        await prisma.bankAccount.update({
          where: { id: bankAccountId },
          data: { balance: account.balance + parsedAmount }
        });
      }
    }
    
    // Log master transaction
    const txnNum = await generateTxnNum(businessId);
    await prisma.transaction.create({
      data: {
        transactionNum: txnNum,
        businessId,
        type: 'INCOME',
        amount: parsedAmount,
        paymentMode,
        toAccountId: bankAccountId,
        notes: notes || `Income categorized under ${category}`
      }
    });
    
    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/income/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const income = await prisma.incomeEntry.findUnique({ where: { id } });
    if (!income) return res.status(404).json({ error: "Income entry not found" });

    // Reverse bank account balance if present
    if (income.accountId) {
      const account = await prisma.bankAccount.findUnique({ where: { id: income.accountId } });
      if (account) {
        await prisma.bankAccount.update({
          where: { id: income.accountId },
          data: { balance: Math.max(0, account.balance - income.amount) }
        });
      }
    }

    // Try deleting matching transaction
    try {
      const matchingTxn = await prisma.transaction.findFirst({
        where: {
          businessId: income.businessId,
          type: 'INCOME',
          amount: income.amount,
          toAccountId: income.accountId
        },
        orderBy: { createdAt: 'desc' }
      });
      if (matchingTxn) {
        await prisma.transaction.delete({ where: { id: matchingTxn.id } });
      }
    } catch (e) {
      console.error("Failed to delete matching transaction:", e);
    }

    await prisma.incomeEntry.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Expense CRUD (Supports bill uploads)
router.get('/expenses', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: "businessId is required" });
    
    const entries = await prisma.expenseEntry.findMany({
      where: { businessId },
      orderBy: { date: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/expenses', uploadBill.single('bill'), async (req, res) => {
  try {
    const { amount, category, paidBy, partnerId, carId, notes, date, bankAccountId, businessId } = req.body;
    if (!businessId) return res.status(400).json({ error: "businessId is required" });
    
    const parsedAmount = parseFloat(amount);
    let billUrl = null;
    if (req.file) {
      billUrl = `/bills/${req.file.filename}`;
    }
    
    // Clean stringified nulls, undefineds, or empty values from client form inputs
    const cleanCarId = (carId && carId !== 'null' && carId !== 'undefined' && carId !== '') ? carId : null;
    const cleanPartnerId = (partnerId && partnerId !== 'null' && partnerId !== 'undefined' && partnerId !== '') ? partnerId : null;
    const cleanBankAccountId = (bankAccountId && bankAccountId !== 'null' && bankAccountId !== 'undefined' && bankAccountId !== '') ? bankAccountId : null;

    // Validate and clean date input
    let parsedDate = new Date();
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }
    
    // 1. Log ExpenseEntry record
    const expense = await prisma.expenseEntry.create({
      data: {
        businessId,
        amount: parsedAmount,
        category,
        paidBy,
        partnerId: cleanPartnerId,
        carId: cleanCarId,
        billUrl,
        notes,
        date: parsedDate
      }
    });
    
    // 2. Adjust account balance OR increase partner ledger depending on paidBy
    if (paidBy === 'Company' && cleanBankAccountId) {
      const account = await prisma.bankAccount.findUnique({ where: { id: cleanBankAccountId } });
      if (account && account.businessId === businessId) {
        await prisma.bankAccount.update({
          where: { id: cleanBankAccountId },
          data: { balance: account.balance - parsedAmount }
        });
        
        // Log master transaction
        const txnNum = await generateTxnNum(businessId);
        await prisma.transaction.create({
          data: {
            transactionNum: txnNum,
            businessId,
            type: 'EXPENSE',
            amount: parsedAmount,
            paymentMode: account.name === 'Cash' ? 'CASH' : 'BANK_TRANSFER',
            fromAccountId: cleanBankAccountId,
            notes: notes || `Expense under ${category}`
          }
        });
      }
    } else if (paidBy === 'Partner' && cleanPartnerId) {
      // Increases company liability to the partner (credit balance)
      await prisma.partnerLedger.create({
        data: {
          businessId,
          partnerId: cleanPartnerId,
          type: 'EXPENSE_PAID_BY_PARTNER',
          amount: parsedAmount,
          notes: `Expense categorized as: ${category}. Notes: ${notes || ''}`,
          carId: cleanCarId
        }
      });
      
      // Log master transaction
      const txnNum = await generateTxnNum(businessId);
      await prisma.transaction.create({
        data: {
          transactionNum: txnNum,
          businessId,
          type: 'EXPENSE',
          amount: parsedAmount,
          paymentMode: 'CASH', // Non-cash ledger swap
          notes: `Expense under ${category} paid personally by partner`
        }
      });
    }
    
    if (cleanCarId && ['REPAIR', 'FUEL', 'TRAVEL', 'MISCELLANEOUS', 'RTO'].includes(category)) {
      await prisma.expense.create({
        data: {
          carId: cleanCarId,
          amount: parsedAmount,
          description: `ERP Expense: ${category} - ${notes || ''}`,
          expenseType: category === 'REPAIR' ? 'Repair' : (category === 'FUEL' ? 'Fuel' : (category === 'TRAVEL' ? 'Transport' : (category === 'RTO' ? 'RTO' : 'Service'))),
          paidBy: paidBy === 'Company' ? 'Company' : 'Partner'
        }
      });
    }
    
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await prisma.expenseEntry.findUnique({ where: { id } });
    if (!expense) return res.status(404).json({ error: "Expense entry not found" });

    // 1. Revert bank account balance if paid by Company
    if (expense.paidBy === 'Company') {
      // Find matching transaction to identify bank account
      try {
        const matchingTxn = await prisma.transaction.findFirst({
          where: {
            businessId: expense.businessId,
            type: 'EXPENSE',
            amount: expense.amount
          },
          orderBy: { createdAt: 'desc' }
        });
        if (matchingTxn && matchingTxn.fromAccountId) {
          const account = await prisma.bankAccount.findUnique({ where: { id: matchingTxn.fromAccountId } });
          if (account) {
            await prisma.bankAccount.update({
              where: { id: matchingTxn.fromAccountId },
              data: { balance: account.balance + expense.amount }
            });
          }
          await prisma.transaction.delete({ where: { id: matchingTxn.id } });
        }
      } catch (e) {
        console.error("Failed to revert company expense transaction:", e);
      }
    } else if (expense.paidBy === 'Partner' && expense.partnerId) {
      // Revert partner ledger entry and transaction
      try {
        const ledger = await prisma.partnerLedger.findFirst({
          where: {
            businessId: expense.businessId,
            partnerId: expense.partnerId,
            amount: expense.amount,
            notes: { startsWith: `Expense categorized as: ${expense.category}` }
          },
          orderBy: { createdAt: 'desc' }
        });
        if (ledger) {
          await prisma.partnerLedger.delete({ where: { id: ledger.id } });
        }

        const matchingTxn = await prisma.transaction.findFirst({
          where: {
            businessId: expense.businessId,
            type: 'EXPENSE',
            amount: expense.amount,
            notes: `Expense under ${expense.category} paid personally by partner`
          },
          orderBy: { createdAt: 'desc' }
        });
        if (matchingTxn) {
          await prisma.transaction.delete({ where: { id: matchingTxn.id } });
        }
      } catch (e) {
        console.error("Failed to revert partner ledger transaction:", e);
      }
    }

    // 2. Revert car expense record if attached
    if (expense.carId) {
      try {
        const carExpense = await prisma.expense.findFirst({
          where: {
            carId: expense.carId,
            amount: expense.amount,
            description: `ERP Expense: ${expense.category} - ${expense.notes || ''}`
          },
          orderBy: { id: 'desc' }
        });
        if (carExpense) {
          await prisma.expense.delete({ where: { id: carExpense.id } });
        }
      } catch (e) {
        console.error("Failed to revert car expense:", e);
      }
    }

    await prisma.expenseEntry.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Financial Reports API Engine
router.get('/reports', async (req, res) => {
  try {
    const { businessId, year, month } = req.query;
    if (!businessId) return res.status(400).json({ error: "businessId is required" });
    
    // Build date filters if provided
    let dateFilter = {};
    if (year) {
      const parsedYear = parseInt(year);
      if (month) {
        const parsedMonth = parseInt(month); // 1-indexed (Jan=1)
        dateFilter = {
          date: {
            gte: new Date(parsedYear, parsedMonth - 1, 1),
            lt: new Date(parsedYear, parsedMonth, 1)
          }
        };
      } else {
        dateFilter = {
          date: {
            gte: new Date(parsedYear, 0, 1),
            lt: new Date(parsedYear + 1, 0, 1)
          }
        };
      }
    }
    
    // A. Fetch all core inputs
    const deals = await prisma.deal.findMany({
      where: { businessId },
      include: { car: { include: { expenses: true } }, customer: true }
    });
    
    const income = await prisma.incomeEntry.findMany({
      where: { businessId, ...dateFilter },
      orderBy: { date: 'desc' }
    });
    
    const expenses = await prisma.expenseEntry.findMany({
      where: { businessId, ...dateFilter },
      orderBy: { date: 'desc' }
    });
    
    // Self-healing: Ensure OWNER is created as a Partner in the Partner table
    const ownerMember = await prisma.businessMember.findFirst({
      where: { businessId, role: 'OWNER' }
    });
    if (ownerMember) {
      const existingPartner = await prisma.partner.findFirst({
        where: { businessId, email: ownerMember.email }
      });
      if (!existingPartner) {
        await prisma.partner.create({
          data: {
            businessId,
            name: ownerMember.name,
            email: ownerMember.email || 'owner@autoconsult.com',
            phone: ownerMember.phone || '0000000000',
            ownershipPercent: 100
          }
        });
      }
    }

    const partners = await prisma.partner.findMany({
      where: { businessId },
      include: { ledgerEntries: true }
    });
    
    const bankAccounts = await prisma.bankAccount.findMany({ where: { businessId } });
    
    const customerLedgers = await prisma.customerLedger.findMany({
      where: { businessId },
      include: { customer: true }
    });
    
    const sellerLedgers = await prisma.sellerLedger.findMany({
      where: { businessId },
      include: { car: true }
    });

    const cars = await prisma.car.findMany({
      where: { businessId },
      include: { expenses: true }
    });
    
    // B. Calculate Profit & Loss (P&L)
    let carSaleRevenue = 0;
    let carPurchaseCost = 0;
    let carPrepExpenses = 0;
    
    deals.forEach(deal => {
      // Check if deal date fits within the reporting period
      const dealDate = new Date(deal.dealDate);
      let matchesDate = true;
      if (year) {
        const y = parseInt(year);
        if (month) {
          const m = parseInt(month);
          matchesDate = dealDate.getFullYear() === y && dealDate.getMonth() === (m - 1);
        } else {
          matchesDate = dealDate.getFullYear() === y;
        }
      }
      
      if (matchesDate) {
        carSaleRevenue += deal.finalPrice;
        carPurchaseCost += deal.car.purchasePrice;
        deal.car.expenses.forEach(e => {
          carPrepExpenses += e.amount;
        });
      }
    });
    
    const totalOtherIncome = income.reduce((sum, item) => sum + item.amount, 0);
    // Exclude vehicle-linked prep expenses since they are already counted under COGS (carPrepExpenses)
    const totalOperatingExpenses = expenses
      .filter(item => !item.carId)
      .reduce((sum, item) => sum + item.amount, 0);
    
    const grossCarProfit = carSaleRevenue - carPurchaseCost - carPrepExpenses;
    const totalRevenue = carSaleRevenue + totalOtherIncome;
    const netProfit = grossCarProfit + totalOtherIncome - totalOperatingExpenses;
    
    // C. Calculate Balance Sheet
    const bankCashBalance = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    const availableCars = await prisma.car.findMany({
      where: { businessId, status: 'Available' }
    });
    const inventoryAssetValue = availableCars.reduce((sum, car) => sum + car.purchasePrice, 0);
    const accountsReceivableValue = customerLedgers.reduce((sum, l) => sum + l.remainingAmount, 0);
    const totalAssets = bankCashBalance + inventoryAssetValue + accountsReceivableValue;
    
    const accountsPayableValue = sellerLedgers.reduce((sum, l) => sum + l.pendingAmount, 0);
    
    // Calculate total capital equity for each partner
    let totalEquity = 0;
    const partnerCapitalBreakdown = partners.map(partner => {
      let balance = 0;
      partner.ledgerEntries.forEach(entry => {
        if (['CAPITAL_INVESTMENT', 'EXPENSE_PAID_BY_PARTNER', 'PROFIT_SHARE'].includes(entry.type)) {
          balance += entry.amount;
        } else if (['CAPITAL_RETURN', 'WITHDRAWAL'].includes(entry.type)) {
          balance -= entry.amount;
        } else if (entry.type === 'ADJUSTMENT') {
          balance += entry.amount;
        }
      });
      totalEquity += balance;
      return {
        id: partner.id,
        name: partner.name,
        phone: partner.phone,
        email: partner.email,
        isActive: partner.isActive,
        equity: balance,
        ledgerEntries: partner.ledgerEntries.map(e => ({
          id: e.id,
          date: e.date,
          type: e.type,
          amount: e.amount,
          notes: e.notes,
          carId: e.carId
        }))
      };
    });
    
    const totalLiabilitiesAndEquity = accountsPayableValue + totalEquity;

    // D. Build Car Profit worksheet
    const carProfitList = cars.map(car => {
      const totalExpenses = car.expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalCost = car.purchasePrice + totalExpenses;
      const soldPrice = car.finalSellPrice || 0;
      const profit = car.status === 'Sold' ? soldPrice - totalCost : 0;
      
      return {
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        registrationNum: car.registrationNum,
        purchasePrice: car.purchasePrice,
        expenses: totalExpenses,
        totalInvestment: totalCost,
        salePrice: soldPrice,
        netProfit: profit,
        status: car.status
      };
    });
    
    res.json({
      reportingPeriod: { year: year || 'All', month: month || 'All' },
      profitAndLoss: {
        revenue: { carSaleRevenue, otherIncome: totalOtherIncome, totalRevenue },
        cogs: { carPurchaseCost, carPrepExpenses, totalCogs: carPurchaseCost + carPrepExpenses },
        operatingExpenses: totalOperatingExpenses,
        netProfit
      },
      balanceSheet: {
        assets: { bankCashBalance, inventoryAssetValue, accountsReceivableValue, totalAssets },
        liabilities: { accountsPayableValue },
        equity: { partnerCapitalBreakdown, totalEquity },
        totalLiabilitiesAndEquity
      },
      carProfitSheet: carProfitList,
      customerReceivables: customerLedgers.map(l => ({ id: l.id, customerName: l.customer.name, phone: l.customer.phone, total: l.totalAmount, remaining: l.remainingAmount, status: l.status, dueDate: l.dueDate })),
      sellerPayables: sellerLedgers.map(l => ({ id: l.id, sellerName: l.sellerName, carSpec: `${l.car.year} ${l.car.brand} ${l.car.model}`, total: l.totalPurchaseAmount, remaining: l.pendingAmount, status: l.status }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
