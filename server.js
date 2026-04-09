require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// ✅ CORS (VERY IMPORTANT)
app.use(cors({
  origin: [
    "http://127.0.0.1:5500", // local testing
    "http://localhost:5500",
    "https://shivaganga6264.github.io"
  ],
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const port = process.env.PORT || 5000;

// ✅ Twilio Config
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

const client = require("twilio")(accountSid, authToken);

// 🚨 EMERGENCY API
app.post("/api/emergency", async (req, res) => {
  try {
    console.log("BODY RECEIVED:", req.body);

    const { path, phoneNumbers } = req.body;

    // ✅ Validate input
    if (!path || path.length === 0 || !phoneNumbers || phoneNumbers.length === 0) {
      return res.status(400).send("Missing location or phone numbers");
    }

    // ✅ Get last location
    const last = path[path.length - 1];

    // 🔥 FIX: support both lat/lng and latitude/longitude
    const lat = last.lat || last.latitude;
    const lng = last.lng || last.longitude;

    if (!lat || !lng) {
      return res.status(400).send("Invalid location data");
    }

    // ✅ Google Maps link
    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

    // ✅ Message
    const message = `🚨 Emergency Alert!
Location: ${lat},${lng}
Map: ${mapsLink}
Points tracked: ${path.length}`;

    console.log("Sending message:", message);

    // 📩 SEND SMS
    for (const num of phoneNumbers) {
      await client.messages.create({
        from: twilioFrom,
        to: num,
        body: message
      });
    }

    // 📞 MAKE CALL
    for (const num of phoneNumbers) {
      await client.calls.create({
        from: twilioFrom,
        to: num,
        twiml: `<Response><Say>Emergency alert. Please check your message.</Say></Response>`
      });
    }

    res.send("✅ Emergency alert sent successfully");

  } catch (err) {
    console.error("❌ Backend Error:", err);
    res.status(500).send("Backend failed: " + err.message);
  }
});

// 🚀 START SERVER
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});