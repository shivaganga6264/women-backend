require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// ✅ FIXED CORS (IMPORTANT)
app.use(cors({
  origin: "*",   // allow all devices (mobile + laptop)
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const port = process.env.PORT || 5000;

// ✅ Twilio Config
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
console.log("SID:", accountSid);
console.log("TOKEN:", authToken);
const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

const client = require("twilio")(accountSid, authToken);

// 🚀 Emergency API
app.post("/api/emergency", async (req, res) => {
  try {
    console.log("📥 BODY RECEIVED:", req.body);

    const { path, phoneNumbers } = req.body;

    // ✅ Validation
    if (!path || path.length === 0) {
      return res.status(400).send("❌ Location path missing");
    }

    if (!phoneNumbers || phoneNumbers.length === 0) {
      return res.status(400).send("❌ Phone numbers missing");
    }

    const last = path[path.length - 1];

    // ✅ FIX: support both formats (lat/lng OR latitude/longitude)
    const lat = last.lat || last.latitude;
    const lng = last.lng || last.longitude;

    if (!lat || !lng) {
      return res.status(400).send("❌ Invalid location format");
    }

    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

    const message = `🚨 Emergency Alert!
Location: ${lat},${lng}
Map: ${mapsLink}
Path points: ${path.length}`;

    console.log("📍 Final Location:", lat, lng);

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
        twiml: `<Response><Say>Emergency! Please check your phone for location.</Say></Response>`
      });
    }

    console.log("✅ Emergency alert sent successfully");
    res.send("✅ Emergency alert sent successfully");

  } catch (err) {
    console.error("❌ Backend Error:", err);
    res.status(500).send("❌ Backend failed: " + err.message);
  }
});

// 🚀 Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});