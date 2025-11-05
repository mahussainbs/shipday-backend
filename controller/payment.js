// controllers/paymentController.js
const Notification = require('../models/Notification');

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Ensure this is defined in your .env

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount,userId } = req.body;

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
