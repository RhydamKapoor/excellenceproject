// Import the Firebase scripts (compat version for messaging)
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Your web app's Firebase configuration

const firebaseConfig = {
    apiKey: "AIzaSyCw6wZzK_u9wtixDpyzqSsTGnj4eE0AQYk",
    authDomain: "taskflow-20fca.firebaseapp.com",
    projectId: "taskflow-20fca",
    storageBucket: "taskflow-20fca.appspot.com",
    messagingSenderId: "389142027112",
    appId: "1:389142027112:web:a784884db1dd99d28b14dd",
    measurementId: "G-6WBPB1KKQ5"
  };
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
// }
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  // console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const { title, body, icon } = payload.notification;  // reading from payload.da

  if(title && body){
    console.log('title and body are available',
      `${title}`,
      `${body}`
    );
    
    const notificationTitle = title || 'Background Notification';
    const notificationOptions = {
      body: body || 'body available',
      icon: icon || '/notification.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});
