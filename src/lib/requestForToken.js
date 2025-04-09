import axios from "axios";
import { getFirebaseMessaging } from "./firebase"; // 🛠️ fixed import
import { getToken } from "firebase/messaging";

const requestForToken = async () => {
  const messaging = await getFirebaseMessaging(); // 🛠️ get messaging properly

  if (!messaging) {
    console.log('Firebase Messaging not supported');
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker.ready,
      });

      if (currentToken) {
        try {
          const response = await axios.post('/api/firebase/save-token', {
            fcmToken: currentToken,
          });
          console.log(response);
          console.log(`Token saved successfully: ${currentToken}`);
          if(response.status === 200){
            console.log('Token saved successfully');
          }else{
            console.log('Token not saved');
          }
        } catch (error) {
          console.error('Error saving token:', error);
        }
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('Notification permission denied.');
    }
  } catch (err) {
    console.error('An error occurred while retrieving token.', err);
  }
};

export default requestForToken;
