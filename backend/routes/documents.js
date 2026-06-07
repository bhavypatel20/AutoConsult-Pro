const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup multer for document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), '..', 'frontend', 'private_documents');
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

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { carId, businessId } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "businessId body parameter is required" });
    }
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    if (car.businessId !== businessId) {
      return res.status(403).json({ error: "Unauthorized: Car does not belong to your business." });
    }

    const documentUrl = `/api/documents/${req.file.filename}`;

    const updatedCar = await prisma.car.update({
      where: { id: carId },
      data: { documents: documentUrl },
    });
    res.json(updatedCar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
