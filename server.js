require("dotenv").config();
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();

app.use(cors({
  origin: [
    "https://shivaganga6264.github.io",
    "https://sheshield-umu1.onrender.com"
  ],
  methods: ["POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const CHILD_EMERGENCY_NUMBER = "+919133042642"; // Twilio-verified

/* ============================
   UNSAFE BUTTON API
============================ */
app.post("/api/emergency", async (req, res) => {
  const { path, phoneNumbers } = req.body;

  if (!Array.isArray(path) || path.length === 0)
    return res.status(400).send("Location path missing");

  const last = path[path.length - 1];
  const map = `https://www.google.com/maps?q=${last.latitude},${last.longitude}`;

  const sms = `🚨 EMERGENCY ALERT
Location:
${last.latitude}, ${last.longitude}
${map}`;

  for (const num of phoneNumbers) {
    await client.messages.create({
      from: TWILIO_NUMBER,
      to: num,
      body: sms
    });

    await client.calls.create({
      from: TWILIO_NUMBER,
      to: num,
      twiml: `<Response><Say>Emergency alert. Please check your SMS.</Say></Response>`
    });
  }

  res.send("Emergency contacts alerted successfully");
});

/* ============================
   CHILD HELP API
============================ */
app.post("/api/childhelp", async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude)
    return res.status(400).send("Location missing");

  const map = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const msg = `🚨 CHILD HELP ALERT
Location:
${latitude}, ${longitude}
${map}`;

  await client.messages.create({
    from: TWILIO_NUMBER,
    to: CHILD_EMERGENCY_NUMBER,
    body: msg
  });

  await client.calls.create({
    from: TWILIO_NUMBER,
    to: CHILD_EMERGENCY_NUMBER,
    twiml: `<Response><Say>Child emergency alert. Location sent.</Say></Response>`
  });

  res.send("Child emergency contact alerted");
});

/* ============================
   START SERVER
============================ */
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);



















