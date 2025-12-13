const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
    economy: {
        baseAmount: { type: Number, required: true, default: 20 },
        divisor: { type: Number, required: true, default: 5000 },
        rate: { type: Number, required: true, default: 1.2 },
        eta: { type: String, default: '1-4 days' }
    },
    express: {
        baseAmount: { type: Number, required: true, default: 40 },
        divisor: { type: Number, required: true, default: 4000 },
        rate: { type: Number, required: true, default: 1.2 },
        eta: { type: String, default: '1-2 days' }
    },
    satchel: {
        a4: { type: Number, required: true, default: 90 },
        a3: { type: Number, required: true, default: 110 }
    },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pricing', pricingSchema);
