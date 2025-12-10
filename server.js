 require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(express.json());
console.log("SERVICE ACCOUNT RAW:", process.env.FIREBASE_SERVICE_ACCOUNT);
console.log("TYPE:", typeof process.env.FIREBASE_SERVICE_ACCOUNT);

// FIREBASE ADMIN INITIALIZATION
 const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// TWILIO SETUP
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// HAVERSINE DISTANCE FORMULA
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (x) => x * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// EMERGENCY ENDPOINT
app.post("/api/emergency", async (req, res) => {
  try {
    const { latitude, longitude, uid } = req.body;

    if (!latitude || !longitude || !uid) {
      return res.status(400).send("Invalid request: missing fields");
    }

    console.log("Received:", latitude, longitude, uid);

    // FETCH ALL USER LOCATIONS (FIXED COLLECTION NAME)
    const usersSnapshot = await db.collection("usersLocation").get();

    const nearbyUsers = [];

    usersSnapshot.forEach((doc) => {
      if (doc.id === uid) return; // skip unsafe user

      const data = doc.data();
      if (!data.latitude || !data.longitude) return;

      const dist = haversineKm(
        latitude,
        longitude,
        data.latitude,
        data.longitude
      );

      if (dist <= 1) {
        // Only push numbers that exist (after Step-4)
        if (data.phoneNumber) {
          nearbyUsers.push(data.phoneNumber);
        }
      }
    });

    console.log("Nearby users:", nearbyUsers);

    if (nearbyUsers.length === 0) {
      return res.send("No users within 1km.");
    }

    // CALL ALL NEARBY USERS
    for (const number of nearbyUsers) {
      await client.calls.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: number,
        twiml: `<Response><Say>Emergency alert! A nearby user needs help.</Say></Response>`
      });
    }

    res.send(`Alert sent to ${nearbyUsers.length} users.`);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error: " + err.message);
  }
});

// START SERVER
app.listen(process.env.PORT || 5000, () =>
  console.log("Server running")
);












