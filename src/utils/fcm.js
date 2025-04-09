// src/utils/fcm.js

import admin from "firebase-admin";

// Initialize Firebase Admin SDK (if not already)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    })
  });
}

// This is your actual function to send notifications
export async function sendNotification(token, title, body) {
  try {
    if (!token) {
      throw new Error('FCM token is required');
    }

    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}
