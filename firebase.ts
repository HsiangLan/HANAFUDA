
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Log raw environment variables as seen by this module at the very top
console.log(
  "Firebase Init Log (Vercel Build Check): Raw NEXT_PUBLIC_FIREBASE_API_KEY:",
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY
);
console.log(
  "Firebase Init Log (Vercel Build Check): Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:",
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
);
console.log(
  "Firebase Init Log (Vercel Build Check): Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID:",
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);
console.log(
  "Firebase Init Log (Vercel Build Check): Raw NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:",
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
);
console.log(
  "Firebase Init Log (Vercel Build Check): Raw NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:",
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
);
console.log(
  "Firebase Init Log (Vercel Build Check): Raw NEXT_PUBLIC_FIREBASE_APP_ID:",
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);
console.log(
  "Firebase Init Log (Vercel Build Check): Raw NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:",
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log(
  "Firebase Init Log (Vercel Build Check): Constructed firebaseConfig object:",
  JSON.stringify(firebaseConfig, null, 2)
);

// Explicit checks for critical config values before attempting initialization
if (!firebaseConfig.apiKey) {
  console.error(
    "Firebase Init Error (Vercel Build Check): Critical - apiKey is missing or empty in the constructed firebaseConfig. Check Vercel environment variable NEXT_PUBLIC_FIREBASE_API_KEY."
  );
}
if (!firebaseConfig.projectId) {
  console.error(
    "Firebase Init Error (Vercel Build Check): Critical - projectId is missing or empty in the constructed firebaseConfig. Check Vercel environment variable NEXT_PUBLIC_FIREBASE_PROJECT_ID."
  );
}

let app;
if (getApps().length === 0) {
  // Only attempt to initialize if critical config values are present
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    console.log("Firebase Init Log (Vercel Build Check): Attempting to initialize Firebase app with the constructed config...");
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase Init Log (Vercel Build Check): Firebase app initialized successfully via initializeApp().");
    } catch (initError: any) { // Catch specific initialization errors
      console.error(
        "Firebase Init Log (Vercel Build Check): Error directly from initializeApp():",
        // Stringify the error object to get more details, including name, message, code, stack
        JSON.stringify(initError, Object.getOwnPropertyNames(initError))
      );
      app = null; // Ensure app is null if initialization fails
    }
  } else {
    console.error(
      "Firebase Init Error (Vercel Build Check): Aborting Firebase app initialization due to missing critical config (apiKey or projectId)."
    );
    app = null; // Ensure app is null
  }
} else {
  app = getApp();
  console.log("Firebase Init Log (Vercel Build Check): Firebase app was already initialized (getApp() succeeded).");
}

const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

// Log status of auth and db instances
if (app && !auth) {
  console.error(
    "Firebase Init Check (Vercel Build Check): Auth instance is null, even though Firebase app object exists. This indicates a problem with getAuth()."
  );
} else if (app && auth) {
  console.log("Firebase Init Check (Vercel Build Check): Auth instance obtained successfully.");
}

if (app && !db) {
  console.error(
    "Firebase Init Check (Vercel Build Check): Firestore instance (db) is null, even though Firebase app object exists. This indicates a problem with getFirestore()."
  );
} else if (app && db) {
  console.log("Firebase Init Check (Vercel Build Check): Firestore instance (db) obtained successfully.");
}

export { app, auth, db };
