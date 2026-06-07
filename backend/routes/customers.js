const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

router.get('/', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) {
      return res.status(400).json({ error: "businessId query parameter is required" });
    }
    const customers = await prisma.customer.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, address, type, stage, notes, nextFollowUp, businessId, ...prefData } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "businessId body parameter is required" });
    }
    
    const prefPayload = {
      budgetMin: prefData.budgetMin ? parseFloat(prefData.budgetMin) : null,
      budgetMax: prefData.budgetMax ? parseFloat(prefData.budgetMax) : null,
      carType: prefData.carType || null,
      preferredBrands: prefData.preferredBrands || null,
      fuelType: prefData.fuelType || null,
      minYear: prefData.minYear ? parseInt(prefData.minYear) : null,
      maxKmDriven: prefData.maxKmDriven ? parseInt(prefData.maxKmDriven) : null,
      purpose: prefData.purpose || null,
      usageType: prefData.usageType || null,
      familySize: prefData.familySize ? parseInt(prefData.familySize) : null,
      seatingCapacity: prefData.seatingCapacity ? parseInt(prefData.seatingCapacity) : null,
      paymentMode: prefData.paymentMode || null,
      loanRequired: prefData.loanRequired === "true" || prefData.loanRequired === true,
      downPayment: prefData.downPayment ? parseFloat(prefData.downPayment) : null,
      exchangeRequired: prefData.exchangeRequired === "true" || prefData.exchangeRequired === true,
      priority: prefData.priority || null,
    };

    const customer = await prisma.customer.create({
      data: {
        name, phone, address, type, stage, notes,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
        businessId: businessId,
        preference: {
          create: prefPayload
        }
      },
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, type, stage, notes, nextFollowUp, businessId, ...prefData } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "businessId body parameter is required" });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    if (customer.businessId !== businessId) {
      return res.status(403).json({ error: "Unauthorized: Customer does not belong to your business." });
    }
    
    const prefPayload = {
      budgetMin: prefData.budgetMin ? parseFloat(prefData.budgetMin) : null,
      budgetMax: prefData.budgetMax ? parseFloat(prefData.budgetMax) : null,
      carType: prefData.carType || null,
      preferredBrands: prefData.preferredBrands || null,
      fuelType: prefData.fuelType || null,
      minYear: prefData.minYear ? parseInt(prefData.minYear) : null,
      maxKmDriven: prefData.maxKmDriven ? parseInt(prefData.maxKmDriven) : null,
      purpose: prefData.purpose || null,
      usageType: prefData.usageType || null,
      familySize: prefData.familySize ? parseInt(prefData.familySize) : null,
      seatingCapacity: prefData.seatingCapacity ? parseInt(prefData.seatingCapacity) : null,
      paymentMode: prefData.paymentMode || null,
      loanRequired: prefData.loanRequired === "true" || prefData.loanRequired === true,
      downPayment: prefData.downPayment ? parseFloat(prefData.downPayment) : null,
      exchangeRequired: prefData.exchangeRequired === "true" || prefData.exchangeRequired === true,
      priority: prefData.priority || null,
    };

    const updateData = {
      name, phone, address, type, stage, notes,
      nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
      businessId: businessId,
      preference: {
        upsert: {
          create: prefPayload,
          update: prefPayload
        }
      }
    };

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });
    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { businessId } = req.query;
    if (!businessId) {
      return res.status(400).json({ error: "businessId query parameter is required" });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    if (customer.businessId !== businessId) {
      return res.status(403).json({ error: "Unauthorized: Customer does not belong to your business." });
    }

    await prisma.customer.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    // Ignore foreign key constraint fails to match original logic
    res.json({ success: false, error: error.message });
  }
});

router.post('/advanced-inquiry', async (req, res) => {
  try {
    const data = req.body;
    if (!data.businessId) {
      return res.status(400).json({ error: "businessId body parameter is required" });
    }
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address || null,
        type: data.type,
        stage: "Inquiry",
        nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp) : null,
        notes: data.notes,
        businessId: data.businessId,
        inquiries: {
          create: { notes: data.notes }
        },
        preference: {
          create: {
            budgetMin: parseFloat(data.budgetMin) || null,
            budgetMax: parseFloat(data.budgetMax) || null,
            carType: data.carType,
            preferredBrands: data.preferredBrands,
            fuelType: data.fuelType,
            minYear: parseInt(data.minYear) || null,
            maxKmDriven: parseInt(data.maxKmDriven) || null,
            purpose: data.purpose,
            usageType: data.usageType,
            familySize: parseInt(data.familySize) || null,
            seatingCapacity: parseInt(data.seatingCapacity) || null,
            paymentMode: data.paymentMode,
            loanRequired: data.loanRequired === "true" || data.loanRequired === true,
            downPayment: parseFloat(data.downPayment) || null,
            exchangeRequired: data.exchangeRequired === "true" || data.exchangeRequired === true,
            priority: data.priority,
          }
        },
        interactions: {
          create: { type: "VISIT" }
        }
      }
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
