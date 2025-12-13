// controllers/paymentController.js
const Notification = require('../models/Notification');

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Ensure this is defined in your .env

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, userId } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Amount is required and must be a number' });
    }

    const customer = await stripe.customers.create();

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2022-11-15' } // or latest Stripe version you're using
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects amount in paise (INR)
      currency: 'inr',
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
    });

    console.log("🔁 Stripe Payment Init:", {
      customerId: customer.id,
      clientSecret: paymentIntent.client_secret,
      ephemeralKeySecret: ephemeralKey.secret,
    });
    await Notification.create({
      userId: userId || null,
      title: 'Payment Successful',
      message: `Your payment of ₹${amount} has been processed successfully.`,
      type: 'transactiom', // spelling fixed from 'transactiom'
    });

    res.status(200).json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    console.error('Stripe Payment Error:', err);
    res.status(500).json({ error: 'Payment intent creation failed' });
  }
};

const Shipment = require('../models/Shipment');
const { generatePaymentData } = require('../utils/payfast');

exports.initiatePayFastPayment = async (req, res) => {
  try {
    const { shipmentId } = req.body;

    if (!shipmentId) {
      return res.status(400).json({ message: 'Shipment ID is required' });
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    const paymentInfo = generatePaymentData(shipment);

    // Construct Query String for GET redirect
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(paymentInfo.data)) {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    }

    const redirectUrl = `${paymentInfo.url}?${queryParams.toString()}`;

    res.status(200).json({
      redirectUrl,
      paymentData: paymentInfo.data // Sending data just in case frontend wants to use form POST later
    });

  } catch (error) {
    console.error('PayFast Init Error:', error);
    res.status(500).json({ message: 'Failed to initiate PayFast payment', error: error.message });
  }
};
