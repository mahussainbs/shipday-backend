const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  if (!admin.apps.length) {
    // Option 1: Using service account file (recommended for production)
    // const serviceAccount = require('../config/firebase-service-account.json');
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount)
    // });

    // Option 2: Using environment variables (for development/deployment)
    if (false && process.env.FIREBASE_PROJECT_ID) { // DISABLED FOR DEBUGGING
      // Clean up private key: handle escaped newlines, regular newlines, and remove quotes
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
        : undefined;

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        })
      });
    } else {
      console.warn('Firebase not initialized - missing environment variables');
    }
  }
} catch (error) {
  console.error('Firebase initialization error:', error.message);
}

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    if (!fcmToken) {
      console.log('No FCM token provided');
      return;
    }

    const message = {
      notification: {
        title,
        body
      },
      data,
      token: fcmToken
    };

    const response = await admin.messaging().send(message);
    console.log('Push notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

module.exports = { sendPushNotification };