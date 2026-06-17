const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    const exists = await prisma.transaction.findUnique({
      where: { transactionNum: proposedTxnNum }
    });
    if (!exists) {
      return proposedTxnNum;
    }
    nextNum++;
    attempts++;
  }
  return `TXN-${Date.now()}`;
}

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), '..', 'frontend', 'public', 'photos');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const safeFilename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "_")}`;
    cb(null, safeFilename);
  }
});
const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) {
      return res.status(400).json({ error: "businessId query parameter is required" });
    }
    const cars = await prisma.car.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" }
    });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { clerkUserId, brand, model, fuelType, registrationNum, status, sellerName, sellerAddress, businessId, purchaseDate, ownerType, variant } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "businessId body parameter is required" });
    }
    const year = parseInt(req.body.year);
    const kmDriven = parseInt(req.body.kmDriven);
    const purchasePrice = parseFloat(req.body.purchasePrice);
    const expectedSellPrice = parseFloat(req.body.expectedSellPrice);
    
    let publicUrl = null;
    if (req.file) {
      publicUrl = `/photos/${req.file.filename}`;
    } else if (req.body.image) {
      publicUrl = req.body.image;
    }

    const car = await prisma.car.create({
      data: {
        clerkUserId: clerkUserId || "default_user", 
        brand, model, year, fuelType, kmDriven, registrationNum, status, 
        purchasePrice, expectedSellPrice, sellerName, sellerAddress,
        ownerType, variant,
        images: publicUrl,
        businessId: businessId,
        createdAt: purchaseDate ? new Date(purchaseDate) : undefined,
      },
    });

    const { paidBy, partnerId, bankAccountId } = req.body;
    const cleanPartnerId = (partnerId && partnerId !== 'null' && partnerId !== 'undefined' && partnerId !== '') ? partnerId : null;
    const cleanBankAccountId = (bankAccountId && bankAccountId !== 'null' && bankAccountId !== 'undefined' && bankAccountId !== '') ? bankAccountId : null;

    const parsedPaidAmount = req.body.paidAmount !== undefined && req.body.paidAmount !== "" 
      ? parseFloat(req.body.paidAmount) 
      : purchasePrice;
    
    const pendingAmount = Math.max(0, purchasePrice - parsedPaidAmount);
    const ledgerStatus = pendingAmount <= 0 ? 'Completed' : (parsedPaidAmount > 0 ? 'Partial' : 'Pending');

    await prisma.sellerLedger.create({
      data: {
        businessId,
        carId: car.id,
        sellerName: sellerName || "Direct Seller",
        totalPurchaseAmount: purchasePrice,
        paidAmount: parsedPaidAmount,
        pendingAmount,
        status: ledgerStatus,
        createdAt: purchaseDate ? new Date(purchaseDate) : undefined,
      }
    });

    // Handle financial funding integration
    if (parsedPaidAmount > 0) {
      const pDate = purchaseDate ? new Date(purchaseDate) : new Date();
      if (paidBy === 'Partner' && cleanPartnerId) {
        // Log expense entry in erp
        await prisma.expenseEntry.create({
          data: {
            businessId,
            amount: parsedPaidAmount,
            category: 'PURCHASE',
            paidBy: 'Partner',
            partnerId: cleanPartnerId,
            carId: car.id,
            notes: `Purchase funding for vehicle: ${brand} ${model} (${registrationNum})`,
            date: pDate
          }
        });

        // Credit partner ledger
        await prisma.partnerLedger.create({
          data: {
            businessId,
            partnerId: cleanPartnerId,
            type: 'EXPENSE_PAID_BY_PARTNER',
            amount: parsedPaidAmount,
            notes: `Expense categorized as: PURCHASE. Notes: Purchase`,
            carId: car.id,
            date: pDate
          }
        });

        // Log master transaction
        const txnNum = await generateTxnNum(businessId);
        await prisma.transaction.create({
          data: {
            transactionNum: txnNum,
            businessId,
            type: 'EXPENSE',
            amount: parsedPaidAmount,
            paymentMode: 'CASH', // Non-cash ledger swap
            notes: `Expense under PURCHASE paid personally by partner`,
            date: pDate,
            relatedEntityId: cleanPartnerId
          }
        });
      } else if (paidBy === 'Company' && cleanBankAccountId) {
        // Log expense entry in erp
        await prisma.expenseEntry.create({
          data: {
            businessId,
            amount: parsedPaidAmount,
            category: 'PURCHASE',
            paidBy: 'Company',
            carId: car.id,
            notes: `Purchase funding for vehicle: ${brand} ${model} (${registrationNum})`,
            date: pDate
          }
        });

        // Debit bank account balance
        const account = await prisma.bankAccount.findUnique({ where: { id: cleanBankAccountId } });
        if (account) {
          await prisma.bankAccount.update({
            where: { id: cleanBankAccountId },
            data: { balance: account.balance - parsedPaidAmount }
          });

          // Log master transaction
          const txnNum = await generateTxnNum(businessId);
          await prisma.transaction.create({
            data: {
              transactionNum: txnNum,
              businessId,
              type: 'EXPENSE',
              amount: parsedPaidAmount,
              paymentMode: account.name === 'Cash' ? 'CASH' : 'BANK_TRANSFER',
              fromAccountId: cleanBankAccountId,
              notes: `Vehicle purchase for ${brand} ${model} paid from company account`,
              date: pDate,
              relatedEntityId: car.id
            }
          });
        }
      }
    }

    res.status(201).json(car);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { brand, model, fuelType, registrationNum, status, sellerName, sellerAddress, businessId, purchaseDate, ownerType, variant } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "businessId body parameter is required" });
    }

    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) return res.status(404).json({ error: "Car not found" });

    if (car.businessId !== businessId) {
      return res.status(403).json({ error: "Unauthorized: Car does not belong to your business." });
    }
    
    const updateData = { brand, model, fuelType, registrationNum, status, sellerName, sellerAddress, ownerType, variant };
    if (req.body.year) updateData.year = parseInt(req.body.year);
    if (req.body.kmDriven) updateData.kmDriven = parseInt(req.body.kmDriven);
    if (req.body.purchasePrice) updateData.purchasePrice = parseFloat(req.body.purchasePrice);
    if (req.body.expectedSellPrice) updateData.expectedSellPrice = parseFloat(req.body.expectedSellPrice);
    if (purchaseDate) updateData.createdAt = new Date(purchaseDate);
    updateData.businessId = businessId;

    if (req.file) {
      updateData.images = `/photos/${req.file.filename}`;
    } else if (req.body.image) {
      updateData.images = req.body.image;
    }

    const updatedCar = await prisma.car.update({
      where: { id },
      data: updateData,
    });

    // Sync Seller Ledger
    const sellerLedger = await prisma.sellerLedger.findFirst({
      where: { carId: id }
    });

    if (sellerLedger) {
      const updatedPurchasePrice = req.body.purchasePrice ? parseFloat(req.body.purchasePrice) : car.purchasePrice;
      const updatedSellerName = sellerName || car.sellerName || "Direct Seller";

      const newPendingAmount = Math.max(0, updatedPurchasePrice - sellerLedger.paidAmount);
      const newStatus = newPendingAmount <= 0 ? 'Completed' : (sellerLedger.paidAmount > 0 ? 'Partial' : 'Pending');

      await prisma.sellerLedger.update({
        where: { id: sellerLedger.id },
        data: {
          sellerName: updatedSellerName,
          totalPurchaseAmount: updatedPurchasePrice,
          pendingAmount: newPendingAmount,
          status: newStatus
        }
      });
    }

    res.json(updatedCar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/image', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { businessId } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "businessId body parameter is required" });
    }
    if (!req.file && !req.body.file) return res.status(400).json({ error: "No file uploaded" });

    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) return res.status(404).json({ error: "Car not found" });

    if (car.businessId !== businessId) {
      return res.status(403).json({ error: "Unauthorized: Car does not belong to your business." });
    }

    let publicUrl = null;
    if (req.file) {
      publicUrl = `/photos/${req.file.filename}`;
    } else if (req.body.file) {
      publicUrl = req.body.file;
    }
    
    let newImages = publicUrl;
    if (car.images && car.images.length > 0) {
      newImages = `${car.images},${publicUrl}`;
    }

    const updatedCar = await prisma.car.update({
      where: { id },
      data: { images: newImages },
    });
    res.json(updatedCar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
