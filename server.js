require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

// Twilio Config
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
const client = require("twilio")(accountSid, authToken);

app.post("/api/emergency", async (req, res) => {
  try {
    console.log("BODY RECEIVED:", req.body);

    const { path, phoneNumbers } = req.body;

    if (!path || path.length === 0 || !phoneNumbers || phoneNumbers.length === 0) {
      return res.status(400).send("Missing location or phone numbers");
    }

    const last = path[path.length - 1];
    const mapsLink = `https://www.google.com/maps?q=${last.latitude},${last.longitude}`;

    const message = `🚨 Emergency Alert!
Last location: ${last.latitude},${last.longitude}
Map: ${mapsLink}
Total path points: ${path.length}`;

    // Send SMS
    for (const num of phoneNumbers) {
      await client.messages.create({
        from: twilioFrom,
        to: num,
        body: message
      });
    }

    // Call
    for (const num of phoneNumbers) {
      await client.calls.create({
        from: twilioFrom,
        to: num,
        twiml: `<Response><Say>${message}</Say></Response>`
      });
    }

    res.send("Emergency alert sent successfully.");
  } catch (err) {
    console.error("Backend Error:", err);
    res.status(500).send("Backend failed: " + err.message);
  }
});

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));


