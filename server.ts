import express from "express";
import path from "path";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dns from "dns";
import dotenv from "dotenv";
import fs from "fs";
import admin from "firebase-admin";

// Configure local environment
dotenv.config();

// Ensure node resolves localhost correctly
dns.setDefaultResultOrder("ipv4first");

const app = express();
app.use(express.json());

const PORT = 3000;

// ============================================================================
// FIREBASE ADMIN SDK SETUP
// ============================================================================
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseAdminApp: any = null;
try {
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    firebaseAdminApp = admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log("🟢 Initialized firebase-admin successfully with project:", firebaseConfig.projectId);
  } else {
    firebaseAdminApp = admin.initializeApp();
    console.log("🟢 Initialized firebase-admin with Application Default Credentials (ADC).");
  }
} catch (err) {
  console.error("⚠️ Failed to initialize firebase-admin:", err);
}
const firestoreDb = firebaseAdminApp ? firebaseAdminApp.firestore() : null;

// ============================================================================
// DATABASE & MODELS SETUP
// ============================================================================
let isUsingMockDb = false;

// Attempt to connect to real MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "";
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("🟢 Connected to real MongoDB database successfully."))
    .catch((err) => {
      console.warn("⚠️ Mongoose connection failed. Falling back to Mock Database.");
      console.error(err);
      isUsingMockDb = true;
    });
} else {
  console.log("ℹ️ No MONGODB_URI found in environment. Booting in Mock Database mode.");
  isUsingMockDb = true;
}

// User Schema (Mongoose)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["patient", "doctor", "admin"], default: "patient" },
  name: { type: String, required: true },
  phone: { type: String, default: "" },
  verified: { type: Boolean, default: false },
  bloodGroup: { type: String, default: "O-Positive" },
  insurance: { type: String, default: "Blue Cross Platinum Shield" },
  emergencyContact: { type: String, default: "Sarah Mercer (555) 019-2834" },
  googleAccessToken: { type: String, default: "" },
  googleRefreshToken: { type: String, default: "" },
  specialty: { type: String, default: "" },
  scheduleHours: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

// OTP Schema (Mongoose)
const OTPSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ["register", "forgot"], required: true },
  expiresAt: { type: Date, required: true },
});

// Appointment Schema (Mongoose)
const AppointmentSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ["booked", "confirmed", "completed"], default: "booked" },
  complaint: { type: String, default: "" },
  painScale: { type: Number, default: 5 },
  allergies: { type: String, default: "None known" },
  currentMeds: { type: String, default: "" },
  duration: { type: String, default: "3 days" },
  googleEventId: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const MongoUser = mongoose.models.User || mongoose.model("User", UserSchema);
const MongoOTP = mongoose.models.OTP || mongoose.model("OTP", OTPSchema);
const MongoAppointment = mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);

// ============================================================================
// IN-MEMORY MOCK DATABASE ENGINE
// ============================================================================
// Fallback stores for local preview when MongoDB is not connected
const mockUsers: any[] = [
  {
    _id: "mock-patient-1",
    email: "patient@carebridge.com",
    password: "password123",
    role: "patient",
    name: "Alex Mercer",
    phone: "(555) 019-2834",
    verified: true,
    bloodGroup: "O-Positive",
    insurance: "Blue Cross Platinum Shield",
    emergencyContact: "Sarah Mercer (555) 019-2834",
    googleAccessToken: "",
    googleRefreshToken: "",
    createdAt: new Date(),
  },
  {
    _id: "mock-doctor-1",
    email: "doctor@carebridge.com",
    password: "password123",
    role: "doctor",
    name: "Dr. Sarah Jenkins",
    phone: "(555) 902-3921",
    verified: true,
    specialty: "Cardiology",
    scheduleHours: "Mon-Fri: 9:00 AM - 5:00 PM",
    createdAt: new Date(),
  },
  {
    _id: "mock-admin-1",
    email: "admin@carebridge.com",
    password: "password123",
    role: "admin",
    name: "Clinic Administrator",
    phone: "(555) 999-1111",
    verified: true,
    createdAt: new Date(),
  },
];

const mockOTPs: any[] = [];
const mockAppointments: any[] = [
  {
    _id: "appt-1",
    patientId: "mock-patient-1",
    patientName: "Alex Mercer",
    patientEmail: "patient@carebridge.com",
    doctorId: "doctor-1",
    doctorName: "Dr. Sarah Jenkins",
    date: "2026-07-02",
    time: "02:30 PM",
    status: "confirmed",
    complaint: "Routine chronic cardiovascular check-up and follow-up dosage adjustments.",
    painScale: 2,
    allergies: "Penicillin",
    currentMeds: "Lisinopril 10mg",
    duration: "6 months",
    createdAt: new Date(),
  },
];

// Database operations router wrapper
const db = {
  findUserByEmail: async (email: string) => {
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection("users")
          .where("email", "==", email.toLowerCase().trim())
          .limit(1)
          .get();
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { _id: doc.id, ...doc.data() };
        }
      } catch (err) {
        console.error("Firestore findUserByEmail failed:", err);
      }
    }
    // Fallback if Firestore is not connected
    if (!isUsingMockDb) {
      try {
        return await (MongoUser as any).findOne({ email: email.toLowerCase().trim() });
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB");
      }
    }
    return mockUsers.find((u) => u.email === email.toLowerCase().trim());
  },

  findUserById: async (id: string) => {
    if (firestoreDb) {
      try {
        const doc = await firestoreDb.collection("users").doc(id).get();
        if (doc.exists) {
          return { _id: doc.id, ...doc.data() };
        }
      } catch (err) {
        console.error("Firestore findUserById failed:", err);
      }
    }
    if (!isUsingMockDb && mongoose.Types.ObjectId.isValid(id)) {
      try {
        return await (MongoUser as any).findById(id);
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB");
      }
    }
    return mockUsers.find((u) => u._id === id);
  },

  createUser: async (userData: any) => {
    const docId = "user-" + Math.random().toString(36).substring(2, 11);
    const newUser = {
      _id: docId,
      verified: false,
      bloodGroup: "O-Positive",
      insurance: "Blue Cross Platinum Shield",
      emergencyContact: "Sarah Mercer (555) 019-2834",
      createdAt: new Date().toISOString(),
      ...userData,
    };
    if (firestoreDb) {
      try {
        await firestoreDb.collection("users").doc(docId).set(newUser);
        console.log("🟢 Created user in Firestore:", docId);
        return newUser;
      } catch (err) {
        console.error("Firestore createUser failed:", err);
      }
    }
    if (!isUsingMockDb) {
      try {
        const user = new (MongoUser as any)(userData);
        return await user.save();
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB");
      }
    }
    mockUsers.push(newUser);
    return newUser;
  },

  updateUser: async (id: string, updates: any) => {
    if (firestoreDb) {
      try {
        const cleanUpdates = { ...updates };
        Object.keys(cleanUpdates).forEach(key => {
          if (cleanUpdates[key] === undefined) delete cleanUpdates[key];
        });
        await firestoreDb.collection("users").doc(id).set(cleanUpdates, { merge: true });
        const doc = await firestoreDb.collection("users").doc(id).get();
        return { _id: doc.id, ...doc.data() };
      } catch (err) {
        console.error("Firestore updateUser failed:", err);
      }
    }
    if (!isUsingMockDb && mongoose.Types.ObjectId.isValid(id)) {
      try {
        return await (MongoUser as any).findByIdAndUpdate(id, updates, { new: true });
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB");
      }
    }
    const idx = mockUsers.findIndex((u) => u._id === id);
    if (idx !== -1) {
      mockUsers[idx] = { ...mockUsers[idx], ...updates };
      return mockUsers[idx];
    }
    return null;
  },

  createOTP: async (email: string, otp: string, type: string) => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const record = { email, otp, type, expiresAt };
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection("otps")
          .where("email", "==", email)
          .where("type", "==", type)
          .get();
        const batch = firestoreDb.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        const docId = "otp-" + Math.random().toString(36).substring(2, 11);
        await firestoreDb.collection("otps").doc(docId).set(record);
        return record;
      } catch (err) {
        console.error("Firestore createOTP failed:", err);
      }
    }
    if (!isUsingMockDb) {
      try {
        await (MongoOTP as any).deleteMany({ email, type });
        const mongoRecord = new (MongoOTP as any)({ email, otp, type, expiresAt: new Date(expiresAt) });
        return await mongoRecord.save();
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB");
      }
    }
    const mockRecord = { email, otp, type, expiresAt: new Date(expiresAt) };
    mockOTPs.push(mockRecord);
    return mockRecord;
  },

  verifyOTP: async (email: string, otp: string, type: string) => {
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection("otps")
          .where("email", "==", email)
          .where("otp", "==", otp)
          .where("type", "==", type)
          .get();
        if (!snapshot.empty) {
          const record = snapshot.docs[0].data();
          const expiry = new Date(record.expiresAt);
          if (expiry > new Date()) {
            const delSnapshot = await firestoreDb.collection("otps")
              .where("email", "==", email)
              .where("type", "==", type)
              .get();
            const batch = firestoreDb.batch();
            delSnapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error("Firestore verifyOTP failed:", err);
      }
    }
    if (!isUsingMockDb) {
      try {
        const record = await (MongoOTP as any).findOne({ email, otp, type });
        if (record && record.expiresAt > new Date()) {
          await (MongoOTP as any).deleteMany({ email, type });
          return true;
        }
        return false;
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB");
      }
    }
    const idx = mockOTPs.findIndex(
      (r) => r.email === email && r.otp === otp && r.type === type && r.expiresAt > new Date()
    );
    if (idx !== -1) {
      mockOTPs.splice(idx, 1);
      return true;
    }
    return false;
  },

  bookAppointment: async (apptData: any) => {
    const docId = "appt-" + Math.random().toString(36).substring(2, 11);
    const newAppt = {
      _id: docId,
      createdAt: new Date().toISOString(),
      status: "booked",
      ...apptData,
    };
    if (firestoreDb) {
      try {
        await firestoreDb.collection("appointments").doc(docId).set(newAppt);
        console.log("🟢 Booked appointment in Firestore:", docId);
        return newAppt;
      } catch (err) {
        console.error("Firestore bookAppointment failed:", err);
      }
    }
    if (!isUsingMockDb) {
      try {
        const appt = new (MongoAppointment as any)(apptData);
        return await appt.save();
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB");
      }
    }
    mockAppointments.push(newAppt);
    return newAppt;
  },

  getAppointmentsByPatient: async (patientId: string) => {
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection("appointments")
          .where("patientId", "==", patientId)
          .get();
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ _id: doc.id, ...doc.data() });
        });
        return list;
      } catch (err) {
        console.error("Firestore getAppointmentsByPatient failed:", err);
      }
    }
    if (!isUsingMockDb) {
      try {
        return await (MongoAppointment as any).find({ patientId });
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB");
      }
    }
    return mockAppointments.filter((a) => a.patientId === patientId);
  },

  getAppointmentsByDoctor: async (doctorName: string) => {
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection("appointments").get();
        const list: any[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.doctorName && data.doctorName.toLowerCase().includes(doctorName.toLowerCase())) {
            list.push({ _id: doc.id, ...data });
          }
        });
        return list;
      } catch (err) {
        console.error("Firestore getAppointmentsByDoctor failed:", err);
      }
    }
    if (!isUsingMockDb) {
      try {
        return await (MongoAppointment as any).find({ doctorName });
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB");
      }
    }
    return mockAppointments.filter(
      (a) => a.doctorName.toLowerCase().includes(doctorName.toLowerCase())
    );
  },
};

// ============================================================================
// SMTP EMAIL SENDER SETUP
// ============================================================================
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // True for 465, false for 587/25
      auth: { user, pass },
    });
  }
  return null;
};

const sendEmail = async (to: string, subject: string, text: string, html: string) => {
  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"CareBridge Security Vault" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      console.log(`✉️ Email successfully dispatched to ${to}`);
      return true;
    } catch (err) {
      console.error("❌ SMTP email dispatch failed:", err);
    }
  }
  // Print in console for easy developer visibility if SMTP details are missing or offline
  console.log(`\n============== [SMTP LOCAL LOG FALLBACK] ==============`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${text}`);
  console.log(`=======================================================\n`);
  return false;
};

// ============================================================================
// GEMINI API CLIENT SETUP
// ============================================================================
let aiClient: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log("🟢 Gemini GenAI Client initialized successfully.");
  } else {
    console.warn("⚠️ GEMINI_API_KEY not found. Gemini calls will fall back to simulated clinical advice.");
  }
} catch (err) {
  console.error("❌ Failed to initialize Gemini API Client:", err);
}

// ============================================================================
// API ROUTES
// ============================================================================

// 1. REGISTER USER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, role, name, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Required details are missing" });
    }

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User already registered under this email" });
    }

    const created = await db.createUser({
      email: email.toLowerCase().trim(),
      password, // In-production hash password with bcrypt. For preview ease, simple string.
      role: role || "patient",
      name,
      phone: phone || "",
      verified: false,
    });

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.createOTP(created.email, otp, "register");

    // Dispatch OTP email
    const subject = "CareBridge Security Access Token - Verify Account";
    const bodyText = `Your security code is: ${otp}. This code is valid for 10 minutes to verify your CareBridge account.`;
    const htmlText = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827; max-width: 500px; border: 1px solid #E5E7EB; border-radius: 12px;">
        <h2 style="color: #2E8B57; font-size: 20px; font-weight: bold; margin-bottom: 12px;">CareBridge Portal Security</h2>
        <p style="font-size: 14px; color: #4B5563;">You are registering a new clinical account. Use the secure 6-digit verification token below to authorize access:</p>
        <div style="font-size: 32px; font-weight: 800; background-color: #E9F8F1; color: #2E8B57; padding: 16px; text-align: center; border-radius: 8px; letter-spacing: 4px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="font-size: 11px; color: #9CA3AF;">This code expires in 10 minutes. If you did not request this registry, please ignore this email.</p>
      </div>
    `;
    await sendEmail(created.email, subject, bodyText, htmlText);

    res.json({ success: true, email: created.email, message: "Verification OTP dispatched" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. OTP VERIFY
app.post("/api/auth/otp-verify", async (req, res) => {
  try {
    const { email, otp, type } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Missing OTP parameters" });
    }

    const verified = await db.verifyOTP(email.toLowerCase().trim(), otp, type || "register");
    if (!verified) {
      return res.status(400).json({ error: "Invalid or expired security code" });
    }

    // Verify User in database
    const user = await db.findUserByEmail(email);
    if (user) {
      await db.updateUser(user._id.toString(), { verified: true });
      const updatedUser = await db.findUserByEmail(email);
      return res.json({ success: true, user: updatedUser });
    }

    res.status(404).json({ error: "User profile record not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. SECURE LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please insert credentials" });
    }

    const user = await db.findUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credential pairings" });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ error: `Unauthorized gateway access role mismatch.` });
    }

    if (!user.verified) {
      // Trigger a new register OTP code automatically
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await db.createOTP(user.email, otp, "register");
      await sendEmail(
        user.email,
        "CareBridge Security Access Token - Verify Account",
        `Your security code is: ${otp}`,
        `<div style="font-family: sans-serif; padding: 20px;"><p>Your security code is:</p><h2>${otp}</h2></div>`
      );
      return res.status(403).json({ error: "email_unverified", email: user.email });
    }

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. FORGOT PASSWORD REQUEST
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "No account matched with this email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.createOTP(user.email, otp, "forgot");

    const subject = "CareBridge Password Recovery Verification";
    const text = `Use the code: ${otp} to reset your secure gateway password.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827; max-width: 500px; border: 1px solid #E5E7EB; border-radius: 12px;">
        <h2 style="color: #DC2626; font-size: 20px; font-weight: bold; margin-bottom: 12px;">Password Recovery Gateway</h2>
        <p style="font-size: 14px; color: #4B5563;">You requested a recovery verification token. Use the code below to reset your password:</p>
        <div style="font-size: 32px; font-weight: 800; background-color: #FEF2F2; color: #DC2626; padding: 16px; text-align: center; border-radius: 8px; letter-spacing: 4px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="font-size: 11px; color: #9CA3AF;">If you didn't initiate password resetting, secure your inbox immediately.</p>
      </div>
    `;
    await sendEmail(user.email, subject, text, html);

    res.json({ success: true, message: "Reset OTP code dispatched" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. RESET PASSWORD ACTION
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ error: "Parameters missing for reset action" });
    }

    const verified = await db.verifyOTP(email.toLowerCase().trim(), otp, "forgot");
    if (!verified) {
      return res.status(400).json({ error: "Invalid or expired recovery security code" });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User account missing" });
    }

    await db.updateUser(user._id.toString(), { password });
    res.json({ success: true, message: "Password redefined successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. FETCH LOGGED IN DETAILS
app.get("/api/users/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized access, missing authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const user = await db.findUserById(token);
    if (!user) {
      return res.status(404).json({ error: "User profile missing" });
    }

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. UPDATE PROFILE DETAILS
app.post("/api/users/update", async (req, res) => {
  try {
    const { userId, bloodGroup, insurance, emergencyContact, specialty, scheduleHours, phone } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const updated = await db.updateUser(userId, {
      bloodGroup,
      insurance,
      emergencyContact,
      specialty,
      scheduleHours,
      phone,
    });

    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. BOOK APPOINTMENT
app.post("/api/appointments/book", async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      patientEmail,
      doctorId,
      doctorName,
      date,
      time,
      complaint,
      painScale,
      allergies,
      currentMeds,
      duration,
    } = req.body;

    if (!patientId || !doctorName || !date || !time) {
      return res.status(400).json({ error: "Missing scheduling coordinates" });
    }

    const appt = await db.bookAppointment({
      patientId,
      patientName: patientName || "Alex Mercer",
      patientEmail: patientEmail || "patient@carebridge.com",
      doctorId: doctorId || "doctor-1",
      doctorName,
      date,
      time,
      complaint: complaint || "",
      painScale: painScale || 5,
      allergies: allergies || "None known",
      currentMeds: currentMeds || "",
      duration: duration || "3 days",
      status: "confirmed",
    });

    // Google Calendar Sync is disabled to optimize resources and eliminate Google API pricing costs
    let syncedToGoogle = false;

    // Send confirmation email via SMTP
    const subject = `CareBridge Confirmed Appointment - Dr. ${doctorName}`;
    const text = `Your medical sync is booked on July 2nd ${time} with ${doctorName}. Chief complaint: ${complaint}.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827; max-width: 500px; border: 1px solid #E5E7EB; border-radius: 12px;">
        <h2 style="color: #2E8B57; font-size: 20px; font-weight: bold;">Appointment Confirmed</h2>
        <p style="font-size: 14px; color: #4B5563;">Your clinic consultation is securely synced.</p>
        <div style="background-color: #F9FAFB; padding: 14px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Specialist:</strong> ${doctorName}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Time Slot:</strong> ${time}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Complaint:</strong> ${complaint || "Routine Check-Up"}</p>
        </div>
        ${
          syncedToGoogle
            ? '<p style="color: #2E8B57; font-size: 12px; font-weight: bold;">✓ Successfully written directly to your Google Calendar</p>'
            : ""
        }
        <p style="font-size: 11px; color: #9CA3AF;">Need to make adjustments? Visit your CareBridge Patient Portal dashboard.</p>
      </div>
    `;
    await sendEmail(patientEmail || "patient@carebridge.com", subject, text, html);

    res.json({ success: true, appointment: appt, googleSynced: syncedToGoogle });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. FETCH APPOINTMENTS
app.get("/api/appointments", async (req, res) => {
  try {
    const { userId, role, doctorName } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Active userId required" });
    }

    if (role === "doctor" && doctorName) {
      const appts = await db.getAppointmentsByDoctor(doctorName as string);
      return res.json({ success: true, appointments: appts });
    }

    const appts = await db.getAppointmentsByPatient(userId as string);
    res.json({ success: true, appointments: appts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. GEMINI AI STRUCTURED ADVICE
app.post("/api/ai/advise", async (req, res) => {
  try {
    const { chiefComplaint, painScale, duration, userProfile } = req.body;
    if (!chiefComplaint) {
      return res.status(400).json({ error: "Chief complaint parameters are required" });
    }

    const userName = userProfile?.name || "Patient";
    const userAge = userProfile?.age || "32";
    const userBlood = userProfile?.bloodGroup || "O-Positive";

    const promptText = `
      Analyze the following clinical symptom presentation for a patient:
      - Patient Name: ${userName}
      - Age: ${userAge}
      - Blood Group: ${userBlood}
      - Chief Complaint: ${chiefComplaint}
      - Reported Pain Level: ${painScale}/10
      - Duration of Symptoms: ${duration || "3 days"}

      Provide a clinical response in structured JSON format EXACTLY matching the schema:
      {
        "summary": "Short professional clinical synthesis of the chief complaint and reported symptoms.",
        "riskLevel": "Low" or "Moderate" or "High",
        "recommendations": [
          "Practical clinical step 1 personalized for the patient",
          "Practical clinical step 2 personalized for the patient",
          "Practical clinical step 3 personalized for the patient"
        ],
        "suggestedSpecialty": "Cardiology" or "Pediatrics" or "Neurology" or "General Medicine" (select the single best match),
        "disclaimer": "Standard HIPAA-compliant medical research AI advisory disclaimer."
      }

      Do not include markdown tags like \`\`\`json or trailing characters. Return only raw parsable JSON.
    `;

    let generatedJSON: any;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptText,
        });

        const rawText = response.text ? response.text.trim() : "";
        // Clean markdown JSON ticks if returned
        const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        generatedJSON = JSON.parse(cleanedText);
      } catch (aiErr) {
        console.warn("⚠️ Gemini raw generation failed, parsing or API issue. Using fallback advisory.", aiErr);
      }
    }

    // Dynamic, high-quality fallback generator if Gemini API key is offline or errors
    if (!generatedJSON) {
      console.log("ℹ️ Using localized rule engine fallback for AI Advice.");
      let risk: "Low" | "Moderate" | "High" = "Low";
      let spec = "General Medicine";
      let steps: string[] = [];

      const complaintLower = chiefComplaint.toLowerCase();

      if (painScale >= 7 || complaintLower.includes("chest") || complaintLower.includes("heart") || complaintLower.includes("breath")) {
        risk = "High";
        spec = "Cardiology";
        steps = [
          "Seek emergency clinical evaluation immediately for severe discomfort.",
          "Restrict physical activity and sit in an upright position.",
          "Perform continuous tracking of your pulse rate and blood pressure until seen by a cardiologist.",
        ];
      } else if (complaintLower.includes("head") || complaintLower.includes("migraine") || complaintLower.includes("numb")) {
        risk = "Moderate";
        spec = "Neurology";
        steps = [
          "De-stimulate the workspace by turning off screens and resting in a darkened room.",
          "Maintain a precise symptom diary logging exact headache onset times and environmental triggers.",
          "Maintain proper hydration by drinking at least 2L of mineral-rich water.",
        ];
      } else if (complaintLower.includes("child") || complaintLower.includes("baby") || complaintLower.includes("fever") && painScale > 4) {
        risk = "Moderate";
        spec = "Pediatrics";
        steps = [
          "Conduct careful temporal temperature measurements every 4 hours.",
          "Prioritize dynamic pediatric electrolyte hydration fluids.",
          "Schedule a prompt virtual pediatric consult if temperature exceeds 101.5°F.",
        ];
      } else {
        risk = "Low";
        steps = [
          "Apply hot/cold local compression compresses to help mitigate general muscle tension.",
          "Prioritize high-quality restorative sleep exceeding 8 hours tonight.",
          "Observe changes over the next 48 hours and consult an general healthcare clinician.",
        ];
      }

      generatedJSON = {
        summary: `Self-reported presentation of ${chiefComplaint} over ${duration || "3 days"} with a pain scale score of ${painScale}/10.`,
        riskLevel: risk,
        recommendations: steps,
        suggestedSpecialty: spec,
        disclaimer: "Advisory analysis is processed via CareBridge clinical engines and does not constitute absolute emergency medical instruction.",
      };
    }

    res.json({ success: true, advice: generatedJSON });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// SERVER START & VITE MIDDLEWARE CONFIGURATION
// ============================================================================
async function bootstrapServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev server in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production builds static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 CareBridge Full-Stack server is operational on http://localhost:${PORT}`);
  });
}

bootstrapServer();
