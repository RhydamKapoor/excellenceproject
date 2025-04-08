import admin from "firebase-admin";
import { NextResponse } from "next/server";

// initialize only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    })
  });
}

export default async function handler(req, res) {
  const { token, title, body } = req.body; // client sends token + message

  try {
    const response = await admin.messaging().send({
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: {
        title: title,
        body: body,
      },
    });

    console.log("Successfully sent message:", response);
    return NextResponse.json({ success: true, response }, { status: 200 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}