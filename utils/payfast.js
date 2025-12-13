const crypto = require('crypto');

const pfValidSignature = (data, passPhrase = null) => {
    // Config
    let pfOutput = "";
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            if (data[key] !== "") {
                pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, "+")}&`
            }
        }
    }

    // Remove last ampersand
    let getString = pfOutput.slice(0, -1);
    if (passPhrase !== null) {
        getString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, "+")}`;
    }

    return crypto.createHash("md5").update(getString).digest("hex");
};

const generatePaymentData = (shipment) => {
    // Determine mode from Environment Variables
    const isSandbox = process.env.PAYFAST_MODE === 'sandbox';

    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const passPhrase = process.env.PAYFAST_PASSPHRASE;

    if (!merchantId || !merchantKey) {
        // Fallback for dev if env not set, but warn in production
        console.warn("PayFast Environment Variables missing! using PayFast Sandbox credentials");
    }

    // Use Env vars or Sandbox defaults (Safety fallback)
    const finalMerchantId = merchantId || '10044381';
    const finalMerchantKey = merchantKey || 'rdpy6ewl5duej';
    const finalPassPhrase = passPhrase || null;

    // Base URLs
    // Support both BASE_URL (New Standard) and PRODUCTION_FRONTEND_URL (Legacy/User's Env)
    const frontendUrl = process.env.BASE_URL || process.env.PRODUCTION_FRONTEND_URL || 'http://localhost:5173';

    // Support API_URL or Fallback to hardcoded Azure Production URL if missing
    // This allows the code to work with the user's current minimal .env
    const backendUrl = process.env.API_URL || 'https://swiftship-be-bxcwgcbzauhuekas.canadacentral-01.azurewebsites.net';

    const data = {
        merchant_id: finalMerchantId,
        merchant_key: finalMerchantKey,
        return_url: `${frontendUrl}/payment/success`,
        cancel_url: `${frontendUrl}/payment/cancel`,
        notify_url: `${backendUrl}/api/payment/notify`,

        // Buyer Details
        name_first: shipment.senderDetails.fullName.split(' ')[0],
        name_last: shipment.senderDetails.fullName.split(' ').slice(1).join(' ') || 'Sender',
        email_address: shipment.senderDetails.email,
        // PayFast optional fields
        // cell_number: shipment.senderDetails.mobile, 

        // Transaction Details
        m_payment_id: shipment.shipmentId,
        amount: shipment.payment.amount.toFixed(2),
        item_name: `Shipment ${shipment.shipmentId}`,
        item_description: `${shipment.parcelDetails.serviceType} delivery`
    };

    if (finalPassPhrase) {
        data.passphrase = finalPassPhrase;
    }

    // Generate Signature
    const signature = pfValidSignature(data, finalPassPhrase);
    data.signature = signature;

    const payfastUrl = isSandbox
        ? 'https://sandbox.payfast.co.za/eng/process'
        : 'https://www.payfast.co.za/eng/process';

    return {
        url: payfastUrl,
        data
    };
};

module.exports = {
    pfValidSignature,
    generatePaymentData
};
