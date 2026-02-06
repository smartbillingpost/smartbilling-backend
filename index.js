import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ dbTime: result.rows[0] });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: "DB connection failed" });
  }
});


/* ---------------- LEAD API ---------------- */

app.post("/api/leads", async (req, res) => {
  const { business, name, phone, email, plan } = req.body;

  if (!name || !phone || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"SmartBilling Lead" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_TO,
    subject: `📩 New SmartBilling Enquiry – ${plan}`,
    html: `
      <h2>New SmartBilling Enquiry</h2>
      <table cellpadding="6">
        <tr><td><b>Business</b></td><td>${business}</td></tr>
        <tr><td><b>Name</b></td><td>${name}</td></tr>
        <tr><td><b>Phone</b></td><td>${phone}</td></tr>
        <tr><td><b>Email</b></td><td>${email}</td></tr>
        <tr><td><b>Plan</b></td><td>${plan}</td></tr>
      </table>
      <br/>
      <p>Please contact this lead.</p>
    `,
  };

 try {
  console.log("📩 NEW LEAD RECEIVED");
  console.log({
    business,
    name,
    phone,
    email,
    plan,
    time: new Date().toISOString(),
  });

  res.json({ success: true });
} catch (error) {
  console.error("Lead handling error:", error);
  res.status(500).json({ error: "Lead capture failed" });
}

});

/* ---------------- START SERVER ---------------- */

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
