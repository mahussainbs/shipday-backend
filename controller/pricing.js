const Pricing = require('../models/Pricing');

// Get current pricing configuration (Initialize if not exists)
exports.getPricingConfig = async (req, res) => {
    try {
        let pricing = await Pricing.findOne();

        // If no pricing exists, create default
        if (!pricing) {
            pricing = new Pricing();
            await pricing.save();
            console.log('Initialized default pricing configuration');
        }

        res.status(200).json(pricing);
    } catch (err) {
        console.error('Error fetching pricing config:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update pricing configuration
exports.updatePricingConfig = async (req, res) => {
    try {
        const { economy, express, satchel } = req.body;

        // Upsert: update existing or create new
        // We strictly want only ONE pricing document.
        let pricing = await Pricing.findOne();
        if (!pricing) {
            pricing = new Pricing();
        }

        if (economy) pricing.economy = { ...pricing.economy, ...economy };
        if (express) pricing.express = { ...pricing.express, ...express };
        if (satchel) pricing.satchel = { ...pricing.satchel, ...satchel };

        pricing.updatedAt = Date.now();
        await pricing.save();

        res.status(200).json({ message: 'Pricing updated successfully', pricing });
    } catch (err) {
        console.error('Error updating pricing config:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
