const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    }

    const updatedCar = await prisma.car.update({
      where: { id },
      data: updateData,
    });
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
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) return res.status(404).json({ error: "Car not found" });

    if (car.businessId !== businessId) {
      return res.status(403).json({ error: "Unauthorized: Car does not belong to your business." });
    }

    const publicUrl = `/photos/${req.file.filename}`;
    
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
