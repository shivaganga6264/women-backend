 require("dotenv").config();
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();

// CORS
app.use(cors({
  origin: [
    "https://shivaganga6264.github.io",
    "https://sheshield-umu1.onrender.com"
  ],
  methods: ["POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// PORT
const PORT = process.env.PORT || 5000;

// TWILIO CONFIG
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// ============================
// EMERGENCY ENDPOINT
// ============================
app.post("/api/emergency", async (req, res) => {
  try {
    console.log("REQUEST:", req.body);

    const { path, phoneNumbers } = req.body;

    if (!Array.isArray(path) || path.length === 0) {
      return res.status(400).send("Location path missing");
    }

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).send("Emergency contacts missing");
    }

    const last = path[path.length - 1];
    const mapsLink = `https://www.google.com/maps?q=${last.latitude},${last.longitude}`;

    const smsText = `🚨 EMERGENCY ALERT
Last location:
${last.latitude}, ${last.longitude}
Map:
${mapsLink}`;

    // SEND SMS
    for (const number of phoneNumbers) {
      await client.messages.create({
        from: TWILIO_NUMBER,
        to: number,
        body: smsText
      });
    }

    // MAKE CALL (SHORT MESSAGE ONLY)
    for (const number of phoneNumbers) {
      await client.calls.create({
        from: TWILIO_NUMBER,
        to: number,
        twiml: `
          <Response>
            <Say voice="alice">
              Emergency alert. Please check your SMS for live location.
            </Say>
          </Response>
        `
      });
    }

    res.send("Emergency SMS and calls sent successfully");

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).send("Emergency service failed");
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

















