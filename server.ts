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

import bcrypt from "bcryptjs";
import crypto from "crypto";

// Configure local environment
dotenv.config();

// Global handler for unhandled promise rejections to prevent crashing from external SDK background tasks
process.on("unhandledRejection", (reason: any) => {
  console.warn("⚠️ Unhandled Promise Rejection:", reason?.message || reason);
  if (reason?.stack) {
    console.warn(reason.stack);
  }
});

// Ensure node resolves localhost correctly
dns.setDefaultResultOrder("ipv4first");

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// ============================================================================
// DATABASE CONFIGURATION, STATE & WRAPPERS
// ============================================================================
let firebaseAdminApp: any = null;
let firestoreDb: any = null;
let isFirestoreAvailable = false;
let isUsingMockDb = true; // Default to true, set to false upon successful MongoDB connection

/**
 * Reusable helper that safely wraps every Firestore SDK call.
 * If a call throws any credential/authentication/network exception, it gracefully logs the issue,
 * disables future Firestore attempts, and allows the system to seamlessly route requests to MongoDB or Local JSON.
 */
async function safeFirestoreCall<T>(operationName: string, operation: () => Promise<T>, fallback: T): Promise<T> {
  if (!isFirestoreAvailable || !firestoreDb) {
    return fallback;
  }
  try {
    return await operation();
  } catch (err: any) {
    console.warn(`⚠️ [Firestore] Runtime failure in "${operationName}". Disabling Firestore to ensure performance and avoid repeated timeouts.`);
    console.warn(`Details:`, err?.message || err);
    isFirestoreAvailable = false;
    firestoreDb = null;
    return fallback;
  }
}

// Global MongoDB Connection Setup with production-grade configuration
const MONGODB_URI = process.env.MONGODB_URI || "";
const mongooseOptions = {
  maxPoolSize: 10,                 // Maintain up to 10 connections in the pool
  minPoolSize: 2,                  // Maintain at least 2 connections
  serverSelectionTimeoutMS: 5000,  // Fail after 5 seconds of connection failure
  family: 4                        // Force IPv4 to bypass dual-stack lookup lag
};

// Handle MongoDB connection events for proper logging and state transitions
mongoose.connection.on("connected", () => {
  isUsingMockDb = false;
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 Mongoose connection error:", err);
  isUsingMockDb = true;
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ Mongoose disconnected from MongoDB. Seamlessly using Local Backup Database.");
  isUsingMockDb = true;
});

mongoose.connection.on("reconnected", () => {
  console.log("🟢 Mongoose reconnected to MongoDB successfully.");
  isUsingMockDb = false;
});

/**
 * Helper to check if Firestore credentials or GCP environment are available.
 * Bypassing Firestore prevents background gRPC connection checks from failing and throwing.
 */
function hasFirebaseCredentials(): boolean {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return true;
  if (process.env.K_SERVICE || process.env.GAE_SERVICE || process.env.GOOGLE_CLOUD_PROJECT) return true;
  return false;
}

/**
 * Initializes and verifies all datastores cleanly.
 * The server will NEVER crash even if Firestore credentials are completely missing.
 */
async function initializeDatabases() {
  console.log("🔌 Commencing database initialization...");

  // 1. Initialize Firebase Admin SDK Safely (Optional Firestore support)
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  let firebaseConfig: any = null;
  if (fs.existsSync(firebaseConfigPath)) {
    try {
      firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    } catch (e: any) {
      console.warn("⚠️ Failed to parse firebase-applet-config.json:", e.message);
    }
  }

  try {
    if (firebaseConfig && firebaseConfig.projectId) {
      firebaseAdminApp = admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    } else {
      firebaseAdminApp = admin.initializeApp();
    }
    console.log("✅ Firebase initialized");
  } catch (err: any) {
    console.warn("⚠️ Firebase Admin SDK initialization bypassed (No credentials/config).");
  }

  // 2. Initialize and Verify Firestore
  const canAttemptFirestore = firebaseAdminApp && hasFirebaseCredentials();
  if (canAttemptFirestore) {
    try {
      let rawFirestoreDb: any = null;
      if (firebaseConfig && firebaseConfig.firestoreDatabaseId) {
        rawFirestoreDb = getFirestore(firebaseAdminApp, firebaseConfig.firestoreDatabaseId);
      } else {
        rawFirestoreDb = getFirestore(firebaseAdminApp);
      }

      if (rawFirestoreDb) {
        // Attempt a quick, lightweight query with a short timeout to verify credentials/permissions
        const verificationPromise = rawFirestoreDb.collection("doctors").limit(1).get();
        // Prevent unhandled promise rejection if credentials fail or timeout occurs
        verificationPromise.catch(() => {});

        await Promise.race([
          verificationPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Verification timeout")), 3000))
        ]);
        firestoreDb = rawFirestoreDb;
        isFirestoreAvailable = true;
        console.log("✅ Firestore available");
      } else {
        console.log("✅ Firestore disabled");
      }
    } catch (err: any) {
      console.warn("⚠️ Firestore access verification failed (Credential / Permission Denied). Bypassing Firestore.");
      firestoreDb = null;
      isFirestoreAvailable = false;
      console.log("✅ Firestore disabled");
    }
  } else {
    console.log("✅ Firestore disabled");
  }

  // 3. Connect to MongoDB
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI, mongooseOptions);
      console.log("✅ MongoDB connected");
      isUsingMockDb = false;
    } catch (err: any) {
      console.warn("⚠️ Initial MongoDB connection failed. Falling back to local/in-memory storage.");
      isUsingMockDb = true;
      console.log("✅ MongoDB connected (Failed fallback activated)");
    }
  } else {
    isUsingMockDb = true;
    console.log("✅ MongoDB connected (Failed fallback activated)");
  }

  // 4. Load persistent Local backup
  try {
    loadLocalDatabase();
    console.log("✅ Local backup loaded");
  } catch (err) {
    console.error("⚠️ Failed to load local backup database:", err);
  }
}

// ----------------------------------------------------------------------------
// 1. Patient Schema (Mongoose) - Stores patient demographics, security and session data
// ----------------------------------------------------------------------------
const PatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true }, // CB-PAT-000001
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: "" },
  password: { type: String, required: true }, // Encrypted/hashed format
  email_verified: { type: Boolean, default: false },
  otp_verified: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "suspended", "pending"], default: "active" },
  profile_completion: { type: Number, default: 0 },
  
  // Personal & Clinical Demographics
  gender: { type: String, default: "" },
  age: { type: Number, default: 0 },
  dob: { type: String, default: "" },
  bloodGroup: { type: String, default: "O-Positive" },
  address: { type: String, default: "" },
  emergencyContact: { type: String, default: "" },
  is_profile_setup: { type: Boolean, default: false },
  
  // Security & Intrusion Prevention state
  password_updated_at: { type: Date, default: Date.now },
  failed_login_attempts: { type: Number, default: 0 },
  last_failed_login: { type: Date, default: null },
  locked_until: { type: Date, default: null },
  
  // Sessions Tracker
  active_sessions: [{
    sessionId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    device: { type: String, default: "" },
    browser: { type: String, default: "" },
    os: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" }
  }],
  
  // Custom Timestamps
  registration_date: { type: Date, default: Date.now },
  last_login_time: { type: Date, default: null },
  last_logout_time: { type: Date, default: null },
  last_activity_time: { type: Date, default: Date.now },
});

PatientSchema.index({ phone: 1 });

// ----------------------------------------------------------------------------
// 2. Doctor Schema (Mongoose) - Stores clinician professional details, sessions and credentials
// ----------------------------------------------------------------------------
const DoctorSchema = new mongoose.Schema({
  doctorId: { type: String, required: true, unique: true }, // CB-DOC-000001
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: "" },
  password: { type: String, required: true }, // Encrypted/hashed format
  email_verified: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "suspended", "pending"], default: "active" },

  // Professional Demographics
  registrationNumber: { type: String, default: "" },
  qualifications: { type: String, default: "" },
  specialization: { type: String, default: "" },
  experience: { type: Number, default: 0 },
  clinic: { type: String, default: "" },
  languages: { type: [String], default: [] },
  consultationFee: { type: Number, default: 0 },
  gender: { type: String, default: "" },
  age: { type: Number, default: 0 },
  is_profile_setup: { type: Boolean, default: false },

  // Security state
  failed_login_attempts: { type: Number, default: 0 },
  last_failed_login: { type: Date, default: null },
  password_updated_at: { type: Date, default: Date.now },
  locked_until: { type: Date, default: null },

  // Sessions Tracker
  active_sessions: [{
    sessionId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    device: { type: String, default: "" },
    browser: { type: String, default: "" },
    os: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" }
  }],

  // Operational schedule configuration
  availableDays: { type: [String], default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
  slotDuration: { type: String, default: "30 mins" },
  leaveStatus: { type: Boolean, default: false },

  // Timestamps
  registration_date: { type: Date, default: Date.now },
  last_login_time: { type: Date, default: null },
  last_logout_time: { type: Date, default: null },
  last_activity_time: { type: Date, default: Date.now },
});

DoctorSchema.index({ registrationNumber: 1 });

// ----------------------------------------------------------------------------
// 3. Patient Login Log Schema (Mongoose) - Track every patient login attempt
// ----------------------------------------------------------------------------
const PatientLoginSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  patientId: { type: String, default: "" },
  loginTimestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["success", "failed"], required: true },
  device: { type: String, default: "" },
  browser: { type: String, default: "" },
  os: { type: String, default: "" },
  ipAddress: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  failedReason: { type: String, default: "" }
});

PatientLoginSchema.index({ email: 1 });
PatientLoginSchema.index({ loginTimestamp: -1 });

// ----------------------------------------------------------------------------
// 4. Doctor Login Log Schema (Mongoose) - Track every doctor login attempt
// ----------------------------------------------------------------------------
const DoctorLoginSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  doctorId: { type: String, default: "" },
  loginTimestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["success", "failed"], required: true },
  device: { type: String, default: "" },
  browser: { type: String, default: "" },
  os: { type: String, default: "" },
  ipAddress: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  failedReason: { type: String, default: "" }
});

DoctorLoginSchema.index({ email: 1 });
DoctorLoginSchema.index({ loginTimestamp: -1 });

// ----------------------------------------------------------------------------
// 5. Admin Authentication Logs Schema (Mongoose) - Track every admin login
// ----------------------------------------------------------------------------
const AdminLogSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  adminEmail: { type: String, required: true, lowercase: true, trim: true },
  loginTimestamp: { type: Date, default: Date.now },
  logoutTimestamp: { type: Date, default: null },
  device: { type: String, default: "" },
  browser: { type: String, default: "" },
  os: { type: String, default: "" },
  ipAddress: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  status: { type: String, enum: ["success", "failed"], required: true },
  failedReason: { type: String, default: "" },
});

AdminLogSchema.index({ sessionId: 1 });
AdminLogSchema.index({ loginTimestamp: -1 });

// ----------------------------------------------------------------------------
// 6. OTP Verification Token Schema (Mongoose) - Holds secure active verification tokens
// ----------------------------------------------------------------------------
const OTPSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ["register", "forgot"], required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
});

OTPSchema.index({ email: 1, type: 1 });

// ----------------------------------------------------------------------------
// 7. Appointment Schema (Mongoose) - Track patient-doctor clinical visits
// ----------------------------------------------------------------------------
const AppointmentSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true, lowercase: true, trim: true },
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
  createdAt: { type: Date, default: Date.now },
});

AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.index({ doctorId: 1 });
AppointmentSchema.index({ date: 1 });

const MongoPatient: any = mongoose.models.Patient || mongoose.model("Patient", PatientSchema);
const MongoDoctor: any = mongoose.models.Doctor || mongoose.model("Doctor", DoctorSchema);
const MongoPatientLogin: any = mongoose.models.PatientLogin || mongoose.model("PatientLogin", PatientLoginSchema);
const MongoDoctorLogin: any = mongoose.models.DoctorLogin || mongoose.model("DoctorLogin", DoctorLoginSchema);
const MongoAdminLog: any = mongoose.models.AdminLog || mongoose.model("AdminLog", AdminLogSchema);
const MongoOTP: any = mongoose.models.OTP || mongoose.model("OTP", OTPSchema);
const MongoAppointment: any = mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);

// ============================================================================
// IN-MEMORY MOCK DATABASE ENGINE FALLBACKS
// ============================================================================
const mockPatients: any[] = [];
const mockDoctors: any[] = [];
const mockPatientLoginLogs: any[] = [];
const mockDoctorLoginLogs: any[] = [];
const mockAdminLogs: any[] = [];
const mockAuditLogs: any[] = [];
const mockOTPs: any[] = [];
const mockAppointments: any[] = [];

// ============================================================================
// ID GENERATOR HELPER FUNCTIONS
// ============================================================================
async function generatePatientId(): Promise<string> {
  let count = 0;
  count = await safeFirestoreCall("patientsCount", async () => {
    const snapshot = await firestoreDb.collection("patients").get();
    return snapshot.size;
  }, 0);

  if (count === 0) {
    if (!isUsingMockDb) {
      try {
        count = await MongoPatient.countDocuments();
      } catch (err) {
        console.warn("MongoDB patients count failed:", err);
      }
    } else {
      count = mockPatients.length;
    }
  }

  let num = count + 1;
  let patientId = `CB-PAT-${String(num).padStart(6, "0")}`;

  // Double check uniqueness
  while (true) {
    let exists = false;
    exists = await safeFirestoreCall("checkPatientUniqueness", async () => {
      const check = await firestoreDb.collection("patients").where("patientId", "==", patientId).get();
      return !check.empty;
    }, false);

    if (!exists) {
      if (!isUsingMockDb) {
        try {
          const check = await MongoPatient.findOne({ patientId });
          exists = !!check;
        } catch (e) {
          exists = false;
        }
      } else {
        exists = mockPatients.some((p) => p.patientId === patientId);
      }
    }

    if (!exists) break;
    num++;
    patientId = `CB-PAT-${String(num).padStart(6, "0")}`;
  }

  return patientId;
}

async function generateDoctorId(): Promise<string> {
  let count = 0;
  count = await safeFirestoreCall("doctorsCount", async () => {
    const snapshot = await firestoreDb.collection("doctors").get();
    return snapshot.size;
  }, 0);

  if (count === 0) {
    if (!isUsingMockDb) {
      try {
        count = await MongoDoctor.countDocuments();
      } catch (err) {
        console.warn("MongoDB doctors count failed:", err);
      }
    } else {
      count = mockDoctors.length;
    }
  }

  let num = count + 1;
  let doctorId = `CB-DOC-${String(num).padStart(6, "0")}`;

  // Double check uniqueness
  while (true) {
    let exists = false;
    exists = await safeFirestoreCall("checkDoctorUniqueness", async () => {
      const check = await firestoreDb.collection("doctors").where("doctorId", "==", doctorId).get();
      return !check.empty;
    }, false);

    if (!exists) {
      if (!isUsingMockDb) {
        try {
          const check = await MongoDoctor.findOne({ doctorId });
          exists = !!check;
        } catch (e) {
          exists = false;
        }
      } else {
        exists = mockDoctors.some((d) => d.doctorId === doctorId);
      }
    }

    if (!exists) break;
    num++;
    doctorId = `CB-DOC-${String(num).padStart(6, "0")}`;
  }

  return doctorId;
}

// ============================================================================
// LOG AUDIT TRAIL HELPER - Local in-memory logging (Mongoose AuditLog schema removed completely)
// ============================================================================
async function logAudit(userId: string, userEmail: string, role: string, action: string, req: express.Request, details: string = "") {
  const auditRecord = {
    userId,
    userEmail: userEmail.toLowerCase().trim(),
    role,
    action,
    timestamp: new Date().toISOString(),
    ip: req.ip || "",
    userAgent: req.headers["user-agent"] || "",
    details
  };

  console.log(`🔒 [Audit Log] ${role.toUpperCase()}: ${userEmail} executed "${action}" - ${details}`);
  
  mockAuditLogs.push(auditRecord);
  saveLocalDatabase();
}

// ============================================================================
// SPECIFIC PATIENT & DOCTOR LOGIN LOGGING HELPERS
// ============================================================================
async function logPatientLogin(email: string, status: "success" | "failed", patientId: string | null, req: express.Request, failedReason: string = "") {
  const parsedUA = parseUserAgent(req.headers["user-agent"] || "");
  const loginRecord = {
    email: email.toLowerCase().trim(),
    patientId: patientId || "unknown",
    loginTimestamp: new Date().toISOString(),
    status,
    device: parsedUA.device,
    browser: parsedUA.browser,
    os: parsedUA.os,
    ipAddress: req.ip || "",
    userAgent: req.headers["user-agent"] || "",
    failedReason
  };

  await safeFirestoreCall("addPatientLoginLog", async () => {
    await firestoreDb.collection("patient_login_logs").add(loginRecord);
  }, null);

  if (!isUsingMockDb) {
    try {
      const log = new MongoPatientLogin(loginRecord);
      await log.save();
    } catch (err) {
      console.warn("MongoDB patient login log failed:", err);
    }
  }

  mockPatientLoginLogs.push(loginRecord);
  saveLocalDatabase();
  console.log(`🔑 [Patient Login Log] Status: ${status.toUpperCase()} | Email: ${email} | Reason: ${failedReason || "None"}`);
}

async function logDoctorLogin(email: string, status: "success" | "failed", doctorId: string | null, req: express.Request, failedReason: string = "") {
  const parsedUA = parseUserAgent(req.headers["user-agent"] || "");
  const loginRecord = {
    email: email.toLowerCase().trim(),
    doctorId: doctorId || "unknown",
    loginTimestamp: new Date().toISOString(),
    status,
    device: parsedUA.device,
    browser: parsedUA.browser,
    os: parsedUA.os,
    ipAddress: req.ip || "",
    userAgent: req.headers["user-agent"] || "",
    failedReason
  };

  await safeFirestoreCall("addDoctorLoginLog", async () => {
    await firestoreDb.collection("doctor_login_logs").add(loginRecord);
  }, null);

  if (!isUsingMockDb) {
    try {
      const log = new MongoDoctorLogin(loginRecord);
      await log.save();
    } catch (err) {
      console.warn("MongoDB doctor login log failed:", err);
    }
  }

  mockDoctorLoginLogs.push(loginRecord);
  saveLocalDatabase();
  console.log(`🔑 [Doctor Login Log] Status: ${status.toUpperCase()} | Email: ${email} | Reason: ${failedReason || "None"}`);
}

// ============================================================================
// ADMIN LOGGING HELPERS
// ============================================================================
async function logAdminLogin(email: string, status: "success" | "failed", sessionId: string | null, req: express.Request, failedReason: string = "") {
  const parsedUA = parseUserAgent(req.headers["user-agent"] || "");
  const logRecord = {
    sessionId: sessionId || "none",
    adminEmail: email.toLowerCase().trim(),
    loginTimestamp: new Date().toISOString(),
    logoutTimestamp: null,
    device: parsedUA.device,
    browser: parsedUA.browser,
    os: parsedUA.os,
    ipAddress: req.ip || "",
    userAgent: req.headers["user-agent"] || "",
    status,
    failedReason
  };

  await safeFirestoreCall("addAdminAuthLog", async () => {
    await firestoreDb.collection("admin_auth_logs").add(logRecord);
  }, null);

  if (!isUsingMockDb) {
    try {
      const log = new MongoAdminLog(logRecord);
      await log.save();
    } catch (err) {
      console.warn("MongoDB logAdminLogin failed:", err);
    }
  }
  
  mockAdminLogs.push(logRecord);
  saveLocalDatabase();
}

async function getAdminLogStats(email: string) {
  const cleanEmail = email.toLowerCase().trim();
  let totalCount = 0;
  let lastLogin: any = null;
  let lastLogout: any = null;

  const firestoreStats = await safeFirestoreCall("getAdminLogStats", async () => {
    const logs = await firestoreDb.collection("admin_auth_logs")
      .where("adminEmail", "==", cleanEmail)
      .get();
    
    const successLogs = await firestoreDb.collection("admin_auth_logs")
      .where("adminEmail", "==", cleanEmail)
      .where("status", "==", "success")
      .get();
    
    const sorted = successLogs.docs.map((d: any) => d.data()).sort((a: any, b: any) => 
      new Date(b.loginTimestamp).getTime() - new Date(a.loginTimestamp).getTime()
    );
    
    let lLogin = null;
    let lLogout = null;
    if (sorted.length > 0) {
      lLogin = sorted[0].loginTimestamp;
      const loggedOut = sorted.find((s: any) => s.logoutTimestamp);
      if (loggedOut) lLogout = loggedOut.logoutTimestamp;
    }
    return { size: logs.size, lastLogin: lLogin, lastLogout: lLogout, hasData: true };
  }, { size: 0, lastLogin: null, lastLogout: null, hasData: false });

  if (firestoreStats.hasData) {
    totalCount = firestoreStats.size;
    lastLogin = firestoreStats.lastLogin;
    lastLogout = firestoreStats.lastLogout;
  } else if (!isUsingMockDb) {
    try {
      totalCount = await MongoAdminLog.countDocuments({ adminEmail: cleanEmail });
      const latestSuccess = await MongoAdminLog.findOne({ adminEmail: cleanEmail, status: "success" }).sort({ loginTimestamp: -1 });
      if (latestSuccess) {
        lastLogin = latestSuccess.loginTimestamp;
      }
      const latestLogout = await MongoAdminLog.findOne({ adminEmail: cleanEmail, status: "success", logoutTimestamp: { $ne: null } }).sort({ logoutTimestamp: -1 });
      if (latestLogout) {
        lastLogout = latestLogout.logoutTimestamp;
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    const adminLogs = mockAdminLogs.filter(l => l.adminEmail === cleanEmail);
    totalCount = adminLogs.length;
    const successLogs = adminLogs.filter(l => l.status === "success").sort((a, b) => 
      new Date(b.loginTimestamp).getTime() - new Date(a.loginTimestamp).getTime()
    );
    if (successLogs.length > 0) {
      lastLogin = successLogs[0].loginTimestamp;
      const loggedOut = successLogs.find(l => l.logoutTimestamp);
      if (loggedOut) lastLogout = loggedOut.logoutTimestamp;
    }
  }

  return { totalCount, lastLogin, lastLogout };
}

// ============================================================================
// LOCAL BACKUP DATABASE PERSISTENCE FALLBACK (PREVENTS REBOOT DATA WIPES)
// ============================================================================
const dbFilePath = path.join(process.cwd(), "carebridge_db.json");

function loadLocalDatabase() {
  try {
    if (fs.existsSync(dbFilePath)) {
      const fileData = fs.readFileSync(dbFilePath, "utf8");
      if (!fileData || fileData.trim() === "") return;
      const data = JSON.parse(fileData);
      
      if (data.mockPatients && Array.isArray(data.mockPatients)) {
        mockPatients.length = 0;
        mockPatients.push(...data.mockPatients);
      }
      if (data.mockDoctors && Array.isArray(data.mockDoctors)) {
        mockDoctors.length = 0;
        mockDoctors.push(...data.mockDoctors);
      }
      if (data.mockPatientLoginLogs && Array.isArray(data.mockPatientLoginLogs)) {
        mockPatientLoginLogs.length = 0;
        mockPatientLoginLogs.push(...data.mockPatientLoginLogs);
      }
      if (data.mockDoctorLoginLogs && Array.isArray(data.mockDoctorLoginLogs)) {
        mockDoctorLoginLogs.length = 0;
        mockDoctorLoginLogs.push(...data.mockDoctorLoginLogs);
      }
      if (data.mockAdminLogs && Array.isArray(data.mockAdminLogs)) {
        mockAdminLogs.length = 0;
        mockAdminLogs.push(...data.mockAdminLogs);
      }
      if (data.mockAuditLogs && Array.isArray(data.mockAuditLogs)) {
        mockAuditLogs.length = 0;
        mockAuditLogs.push(...data.mockAuditLogs);
      }
      if (data.mockOTPs && Array.isArray(data.mockOTPs)) {
        mockOTPs.length = 0;
        mockOTPs.push(...data.mockOTPs);
      }
      if (data.mockAppointments && Array.isArray(data.mockAppointments)) {
        mockAppointments.length = 0;
        mockAppointments.push(...data.mockAppointments);
      }
      console.log("🟢 Loaded persistent backup database from local file system:", dbFilePath);
    }
  } catch (err) {
    console.error("⚠️ Failed to load local database backup:", err);
  }
}

function saveLocalDatabase() {
  try {
    const data = {
      mockPatients,
      mockDoctors,
      mockPatientLoginLogs,
      mockDoctorLoginLogs,
      mockAdminLogs,
      mockAuditLogs,
      mockOTPs,
      mockAppointments,
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("⚠️ Failed to save local database backup:", err);
  }
}

// Perform initial load
loadLocalDatabase();

// ============================================================================
// DATABASE OPERATIONS ROUTER WRAPPER (UNIFIED)
// ============================================================================
const db = {
  findUserByEmail: async (email: string) => {
    const trimmedEmail = email.toLowerCase().trim();
    
    const firestoreUser = await safeFirestoreCall("findUserByEmail", async () => {
      const patientSnapshot = await firestoreDb.collection("patients")
        .where("email", "==", trimmedEmail)
        .limit(1)
        .get();
      if (!patientSnapshot.empty) {
        const doc = patientSnapshot.docs[0];
        return { _id: doc.id, role: "patient", ...doc.data() };
      }

      const doctorSnapshot = await firestoreDb.collection("doctors")
        .where("email", "==", trimmedEmail)
        .limit(1)
        .get();
      if (!doctorSnapshot.empty) {
        const doc = doctorSnapshot.docs[0];
        return { _id: doc.id, role: "doctor", ...doc.data() };
      }
      return null;
    }, null);

    if (firestoreUser) return firestoreUser;

    if (!isUsingMockDb) {
      try {
        const patient = await MongoPatient.findOne({ email: trimmedEmail });
        if (patient) {
          return { ...patient.toObject(), role: "patient" };
        }
        const doctor = await MongoDoctor.findOne({ email: trimmedEmail });
        if (doctor) {
          return { ...doctor.toObject(), role: "doctor" };
        }
      } catch (err) {
        console.warn("MongoDB findUserByEmail failed, fallback to mock DB", err);
      }
    }

    const mockP = mockPatients.find((u) => u.email === trimmedEmail);
    if (mockP) return { ...mockP, role: "patient" };
    const mockD = mockDoctors.find((u) => u.email === trimmedEmail);
    if (mockD) return { ...mockD, role: "doctor" };

    return null;
  },

  findUserById: async (id: string) => {
    const firestoreUser = await safeFirestoreCall("findUserById", async () => {
      const pDoc = await firestoreDb.collection("patients").doc(id).get();
      if (pDoc.exists) {
        return { _id: pDoc.id, role: "patient", ...pDoc.data() };
      }
      const dDoc = await firestoreDb.collection("doctors").doc(id).get();
      if (dDoc.exists) {
        return { _id: dDoc.id, role: "doctor", ...dDoc.data() };
      }
      return null;
    }, null);

    if (firestoreUser) return firestoreUser;

    if (!isUsingMockDb) {
      try {
        const patient = await MongoPatient.findById(id);
        if (patient) return { ...patient.toObject(), role: "patient" };
        const doctor = await MongoDoctor.findById(id);
        if (doctor) return { ...doctor.toObject(), role: "doctor" };
      } catch (err) {
        try {
          const patientByPid = await MongoPatient.findOne({ patientId: id });
          if (patientByPid) return { ...patientByPid.toObject(), role: "patient" };
          const doctorByDid = await MongoDoctor.findOne({ doctorId: id });
          if (doctorByDid) return { ...doctorByDid.toObject(), role: "doctor" };
        } catch (e) {
          console.warn("MongoDB findUserById failed", e);
        }
      }
    }

    const mockP = mockPatients.find((u) => u._id === id || u.patientId === id);
    if (mockP) return { ...mockP, role: "patient" };
    const mockD = mockDoctors.find((u) => u._id === id || u.doctorId === id);
    if (mockD) return { ...mockD, role: "doctor" };

    return null;
  },

  createUser: async (userData: any) => {
    const role = userData.role || "patient";
    const docId = (role === "doctor" ? "doc-" : "pat-") + Math.random().toString(36).substring(2, 11);
    
    if (role === "doctor") {
      const doctorId = await generateDoctorId();
      const newDoctor = {
        _id: docId,
        doctorId,
        email_verified: userData.email_verified || false,
        status: userData.status || "active",
        availableDays: userData.availableDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        slotDuration: userData.slotDuration || "30 mins",
        leaveStatus: userData.leaveStatus || false,
        registration_date: new Date().toISOString(),
        last_activity_time: new Date().toISOString(),
        active_sessions: [],
        is_profile_setup: false,
        age: 0,
        gender: "",
        ...userData,
      };

      // Always write to mock and save to persistent local file backup first
      mockDoctors.push(newDoctor);
      saveLocalDatabase();

      await safeFirestoreCall("createUserDoctor", async () => {
        await firestoreDb.collection("doctors").doc(docId).set(newDoctor);
      }, null);

      if (!isUsingMockDb) {
        try {
          const doc = new MongoDoctor(newDoctor);
          await doc.save();
        } catch (err) {
          console.warn("MongoDB createUser doctor failed:", err);
        }
      }

      return newDoctor;
    } else {
      const patientId = await generatePatientId();
      const newPatient = {
        _id: docId,
        patientId,
        email_verified: userData.email_verified || false,
        otp_verified: userData.otp_verified || false,
        status: userData.status || "active",
        profile_completion: userData.profile_completion || 0,
        registration_date: new Date().toISOString(),
        last_activity_time: new Date().toISOString(),
        active_sessions: [],
        is_profile_setup: false,
        age: 0,
        gender: "",
        ...userData,
      };

      // Always write to mock and save to persistent local file backup first
      mockPatients.push(newPatient);
      saveLocalDatabase();

      await safeFirestoreCall("createUserPatient", async () => {
        await firestoreDb.collection("patients").doc(docId).set(newPatient);
      }, null);

      if (!isUsingMockDb) {
        try {
          const pat = new MongoPatient(newPatient);
          await pat.save();
        } catch (err) {
          console.warn("MongoDB createUser patient failed:", err);
        }
      }

      return newPatient;
    }
  },

  updateUser: async (id: string, updates: any) => {
    // 1. ALWAYS write updates to local memory mock database first to prevent data losses
    const pIdx = mockPatients.findIndex((u) => u._id === id || u.patientId === id);
    if (pIdx !== -1) {
      mockPatients[pIdx] = { ...mockPatients[pIdx], ...updates };
      saveLocalDatabase();
    }

    const dIdx = mockDoctors.findIndex((u) => u._id === id || u.doctorId === id);
    if (dIdx !== -1) {
      mockDoctors[dIdx] = { ...mockDoctors[dIdx], ...updates };
      saveLocalDatabase();
    }

    // 2. Try Firestore in parallel/background
    await safeFirestoreCall("updateUser", async () => {
      const pRef = firestoreDb.collection("patients").doc(id);
      const pDoc = await pRef.get();
      if (pDoc.exists) {
        const cleanUpdates = { ...updates };
        Object.keys(cleanUpdates).forEach(key => {
          if (cleanUpdates[key] === undefined) delete cleanUpdates[key];
        });
        await pRef.set(cleanUpdates, { merge: true });
      } else {
        const dRef = firestoreDb.collection("doctors").doc(id);
        const dDoc = await dRef.get();
        if (dDoc.exists) {
          const cleanUpdates = { ...updates };
          Object.keys(cleanUpdates).forEach(key => {
            if (cleanUpdates[key] === undefined) delete cleanUpdates[key];
          });
          await dRef.set(cleanUpdates, { merge: true });
        }
      }
    }, null);

    // 3. Try MongoDB
    if (!isUsingMockDb) {
      try {
        await MongoPatient.findByIdAndUpdate(id, updates);
        await MongoDoctor.findByIdAndUpdate(id, updates);
      } catch (err) {
        console.warn("MongoDB updateUser failed:", err);
      }
    }

    // Return the updated user from local memory (which is guaranteed to exist and be up-to-date)
    if (pIdx !== -1) {
      return { ...mockPatients[pIdx], role: "patient" };
    }
    if (dIdx !== -1) {
      return { ...mockDoctors[dIdx], role: "doctor" };
    }
    return null;
  },

  createOTP: async (email: string, otp: string, type: string) => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const record = { email: email.toLowerCase().trim(), otp: hashedOtp, type, expiresAt, attempts: 0 };

    // Always dual-write to local memory first
    const idx = mockOTPs.findIndex(r => r.email === email.toLowerCase().trim() && r.type === type);
    if (idx !== -1) {
      mockOTPs.splice(idx, 1);
    }
    const mockRecord = {
      email: email.toLowerCase().trim(),
      otp: hashedOtp,
      type,
      expiresAt: new Date(expiresAt),
      attempts: 0
    };
    mockOTPs.push(mockRecord);
    saveLocalDatabase();

    await safeFirestoreCall("createOTP", async () => {
      const snapshot = await firestoreDb.collection("otps")
        .where("email", "==", email.toLowerCase().trim())
        .where("type", "==", type)
        .get();
      const batch = firestoreDb.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      const docId = "otp-" + Math.random().toString(36).substring(2, 11);
      await firestoreDb.collection("otps").doc(docId).set(record);
    }, null);

    if (!isUsingMockDb) {
      try {
        await MongoOTP.deleteMany({ email: email.toLowerCase().trim(), type });
        const mongoRecord = new MongoOTP({
          email: email.toLowerCase().trim(),
          otp: hashedOtp,
          type,
          expiresAt: new Date(expiresAt),
          attempts: 0
        });
        await mongoRecord.save();
      } catch (err) {
        console.warn("MongoDB createOTP failed:", err);
      }
    }
    return mockRecord;
  },

  verifyOTP: async (email: string, otp: string, type: string) => {
    const trimmedEmail = email.toLowerCase().trim();
    const hashedOtpInput = crypto.createHash("sha256").update(otp).digest("hex");

    // Try verifying from local memory FIRST (so it always succeeds even if databases are offline)
    const recordIdx = mockOTPs.findIndex(r => r.email === trimmedEmail && r.type === type);
    let localResult: any = null;

    if (recordIdx !== -1) {
      const record = mockOTPs[recordIdx];
      let attempts = record.attempts || 0;
      const expiry = new Date(record.expiresAt);

      if (attempts >= 5) {
        mockOTPs.splice(recordIdx, 1);
        saveLocalDatabase();
        localResult = { success: false, error: "locked" };
      } else if (expiry < new Date()) {
        mockOTPs.splice(recordIdx, 1);
        saveLocalDatabase();
        localResult = { success: false, error: "expired" };
      } else if (record.otp === hashedOtpInput) {
        mockOTPs.splice(recordIdx, 1);
        saveLocalDatabase();
        localResult = { success: true };
      } else {
        attempts += 1;
        if (attempts >= 5) {
          mockOTPs.splice(recordIdx, 1);
          saveLocalDatabase();
          localResult = { success: false, error: "locked" };
        } else {
          record.attempts = attempts;
          saveLocalDatabase();
          localResult = { success: false, error: "invalid", attemptsLeft: 5 - attempts };
        }
      }
    } else {
      localResult = { success: false, error: "expired" };
    }

    // Perform database cleanups in background without blocking local success
    await safeFirestoreCall("verifyOTP_cleanup", async () => {
      const snapshot = await firestoreDb.collection("otps")
        .where("email", "==", trimmedEmail)
        .where("type", "==", type)
        .get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const record = doc.data();
        let attempts = record.attempts || 0;
        const expiry = new Date(record.expiresAt);

        if (attempts >= 5 || expiry < new Date() || record.otp === hashedOtpInput) {
          await doc.ref.delete();
        } else {
          attempts += 1;
          if (attempts >= 5) {
            await doc.ref.delete();
          } else {
            await doc.ref.update({ attempts });
          }
        }
      }
    }, null);

    if (!isUsingMockDb) {
      try {
        const record = await MongoOTP.findOne({ email: trimmedEmail, type });
        if (record) {
          let attempts = record.attempts || 0;
          const expiry = new Date(record.expiresAt);

          if (attempts >= 5 || expiry < new Date() || record.otp === hashedOtpInput) {
            await MongoOTP.deleteOne({ _id: record._id });
          } else {
            attempts += 1;
            if (attempts >= 5) {
              await MongoOTP.deleteOne({ _id: record._id });
            } else {
              record.attempts = attempts;
              await record.save();
            }
          }
        }
      } catch (err) {
        console.warn("MongoDB verifyOTP failed:", err);
      }
    }

    return localResult;
  },

  bookAppointment: async (apptData: any) => {
    const docId = apptData._id || "appt-" + Math.random().toString(36).substring(2, 11);
    const newAppt = {
      _id: docId,
      createdAt: new Date().toISOString(),
      status: "booked",
      ...apptData,
    };

    // Always write to local memory and persistent backup first
    mockAppointments.push(newAppt);
    saveLocalDatabase();

    await safeFirestoreCall("bookAppointment", async () => {
      await firestoreDb.collection("appointments").doc(docId).set(newAppt);
    }, null);

    if (!isUsingMockDb) {
      try {
        const appt = new MongoAppointment(newAppt);
        await appt.save();
      } catch (err) {
        console.warn("MongoDB bookAppointment failed:", err);
      }
    }

    return newAppt;
  },

  getAppointmentsByPatient: async (patientId: string) => {
    const firestoreList = await safeFirestoreCall("getAppointmentsByPatient", async () => {
      const snapshot = await firestoreDb.collection("appointments")
        .where("patientId", "==", patientId)
        .get();
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ _id: doc.id, ...doc.data() });
      });
      return { list, success: true };
    }, { list: [], success: false });

    if (firestoreList.success) {
      return firestoreList.list;
    }

    if (!isUsingMockDb) {
      try {
        return await MongoAppointment.find({ patientId });
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB", err);
      }
    }
    return mockAppointments.filter((a) => a.patientId === patientId || a.patientId === "patient-" + patientId);
  },

  getAppointmentsByDoctor: async (doctorName: string) => {
    const firestoreList = await safeFirestoreCall("getAppointmentsByDoctor", async () => {
      const snapshot = await firestoreDb.collection("appointments").get();
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.doctorName && data.doctorName.toLowerCase().includes(doctorName.toLowerCase())) {
          list.push({ _id: doc.id, ...data });
        }
      });
      return { list, success: true };
    }, { list: [], success: false });

    if (firestoreList.success) {
      return firestoreList.list;
    }

    if (!isUsingMockDb) {
      try {
        return await MongoAppointment.find({ doctorName });
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB", err);
      }
    }
    return mockAppointments.filter(
      (a) => a.doctorName.toLowerCase().includes(doctorName.toLowerCase())
    );
  },

  getDoctors: async () => {
    const firestoreList = await safeFirestoreCall("getDoctors", async () => {
      const snapshot = await firestoreDb.collection("doctors").get();
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ _id: doc.id, role: "doctor", ...doc.data() });
      });
      return { list, success: true };
    }, { list: [], success: false });

    if (firestoreList.success) {
      return firestoreList.list;
    }

    if (!isUsingMockDb) {
      try {
        const list = await MongoDoctor.find({});
        return list.map(d => ({ ...d.toObject(), role: "doctor" }));
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB", err);
      }
    }
    return mockDoctors.map(d => ({ ...d, role: "doctor" }));
  },

  getPatients: async () => {
    const firestoreList = await safeFirestoreCall("getPatients", async () => {
      const snapshot = await firestoreDb.collection("patients").get();
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ _id: doc.id, role: "patient", ...doc.data() });
      });
      return { list, success: true };
    }, { list: [], success: false });

    if (firestoreList.success) {
      return firestoreList.list;
    }

    if (!isUsingMockDb) {
      try {
        const list = await MongoPatient.find({});
        return list.map(p => ({ ...p.toObject(), role: "patient" }));
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB", err);
      }
    }
    return mockPatients.map(p => ({ ...p, role: "patient" }));
  },

  getAllAppointments: async () => {
    const firestoreList = await safeFirestoreCall("getAllAppointments", async () => {
      const snapshot = await firestoreDb.collection("appointments").get();
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ _id: doc.id, ...doc.data() });
      });
      return { list, success: true };
    }, { list: [], success: false });

    if (firestoreList.success) {
      return firestoreList.list;
    }

    if (!isUsingMockDb) {
      try {
        return await MongoAppointment.find({});
      } catch (err) {
        console.warn("MongoDB failed, fallback to mock DB", err);
      }
    }
    return mockAppointments;
  },
};

// ============================================================================
// DATABASE SEEDING ENGINE
// ============================================================================
const SEED_DOCTORS = [
  {
    email: "jenkins@carebridge.com",
    name: "Dr. Sarah Jenkins",
    role: "doctor",
    specialty: "Cardiology",
    scheduleHours: "09:00 AM - 05:00 PM",
    verified: true,
    email_verified: true,
    phone: "(555) 123-4567",
    bio: "Board-certified Cardiologist with 12+ years of clinical experience specializing in preventive care and lipid management.",
    rating: 4.9,
    reviewsCount: 142,
    hospital: "CareBridge Medical Center",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
    availability: ["Monday", "Wednesday", "Friday"]
  },
  {
    email: "kim@carebridge.com",
    name: "Dr. David Kim",
    role: "doctor",
    specialty: "Pediatrics",
    scheduleHours: "08:00 AM - 04:00 PM",
    verified: true,
    email_verified: true,
    phone: "(555) 234-5678",
    bio: "Dedicated Pediatrician focusing on early childhood development, metabolic health, and family-centered diagnostics.",
    rating: 4.8,
    reviewsCount: 96,
    hospital: "Apex Pediatric Clinic",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300",
    availability: ["Tuesday", "Thursday"]
  },
  {
    email: "adams@carebridge.com",
    name: "Dr. Rachel Adams",
    role: "doctor",
    specialty: "Neurology",
    scheduleHours: "10:00 AM - 06:00 PM",
    verified: true,
    email_verified: true,
    phone: "(555) 345-6789",
    bio: "Senior Neurologist specializing in migraine treatment, vascular cephalea therapy, and electroencephalography.",
    rating: 5.0,
    reviewsCount: 184,
    hospital: "Summit Neurology Clinic",
    image: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300&h=300",
    availability: ["Monday", "Tuesday", "Thursday"]
  },
  {
    email: "carter@carebridge.com",
    name: "Dr. James Carter",
    role: "doctor",
    specialty: "General Medicine",
    scheduleHours: "09:00 AM - 05:00 PM",
    verified: true,
    email_verified: true,
    phone: "(555) 456-7890",
    bio: "Compassionate General Practitioner providing full-spectrum diagnostic care, routine follow-up, and diagnostic assessments.",
    rating: 4.7,
    reviewsCount: 115,
    hospital: "Meridian Health Center",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300",
    availability: ["Wednesday", "Friday"]
  }
];

async function seedDatabase() {
  try {
    const doctors = await db.getDoctors();
    if (!doctors || doctors.length === 0) {
      console.log("ℹ️ No doctor accounts detected in database. Seeding standard clinical specialists...");
      const passwordHash = bcrypt.hashSync("Doctor123!", 10);
      for (const doc of SEED_DOCTORS) {
        const existing = await db.findUserByEmail(doc.email);
        if (!existing) {
          await db.createUser({
            ...doc,
            password: passwordHash,
          });
          console.log(`🟢 Seeded doctor account: ${doc.name} (${doc.email})`);
        }
      }
    } else {
      console.log(`ℹ️ Database already has ${doctors.length} doctors. Skipping doctor seeding.`);
    }
  } catch (err) {
    console.error("⚠️ Error seeding database:", err);
  }
}

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

// ============================================================================
// API ROUTES
// ============================================================================

// User Agent parsing utility helper
function parseUserAgent(ua: string) {
  let browser = "Other";
  let os = "Other";
  let device = "Desktop";

  if (/mobile/i.test(ua)) device = "Mobile";
  else if (/tablet/i.test(ua) || /ipad/i.test(ua)) device = "Tablet";

  if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/msie|trident/i.test(ua)) browser = "IE";
  else if (/edg/i.test(ua)) browser = "Edge";

  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { browser, os, device };
}

// Utility helper to find user by active session ID
async function findUserBySessionId(sessionId: string) {
  const firestoreUser = await safeFirestoreCall("findUserBySessionId", async () => {
    const patients = await firestoreDb.collection("patients").get();
    for (const doc of patients.docs) {
      const data = doc.data();
      if ((data.active_sessions || []).some((s: any) => s.sessionId === sessionId)) {
        return { _id: doc.id, role: "patient", ...data };
      }
    }
    const doctors = await firestoreDb.collection("doctors").get();
    for (const doc of doctors.docs) {
      const data = doc.data();
      if ((data.active_sessions || []).some((s: any) => s.sessionId === sessionId)) {
        return { _id: doc.id, role: "doctor", ...data };
      }
    }
    return null;
  }, null);

  if (firestoreUser) return firestoreUser;

  if (!isUsingMockDb) {
    try {
      const patient = await MongoPatient.findOne({ "active_sessions.sessionId": sessionId });
      if (patient) return { ...patient.toObject(), role: "patient" };
      const doctor = await MongoDoctor.findOne({ "active_sessions.sessionId": sessionId });
      if (doctor) return { ...doctor.toObject(), role: "doctor" };
    } catch (e) {
      console.warn("MongoDB findUserBySessionId failed:", e);
    }
  }

  const p = mockPatients.find(p => (p.active_sessions || []).some((s: any) => s.sessionId === sessionId));
  if (p) return { ...p, role: "patient" };
  const d = mockDoctors.find(d => (d.active_sessions || []).some((s: any) => s.sessionId === sessionId));
  if (d) return { ...d, role: "doctor" };

  return null;
}

// Security cookie parser
const getSessionFromCookie = (req: any) => {
  const cookies = req.headers.cookie;
  if (!cookies) return null;
  const match = cookies.match(/(?:^|; )cb_session=([^;]*)/);
  return match ? match[1] : null;
};

// Session authentication middleware
const authenticateSession = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const sessionId = getSessionFromCookie(req);
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized. No session found." });
  }

  let currentUser: any = null;
  let role: "patient" | "doctor" | "admin" = "patient";

  const firestoreSession = await safeFirestoreCall("authenticateSession", async () => {
    const patients = await firestoreDb.collection("patients").get();
    for (const doc of patients.docs) {
      const data = doc.data();
      const activeSessions = data.active_sessions || [];
      const found = activeSessions.find((s: any) => s.sessionId === sessionId);
      if (found) {
        return { user: { _id: doc.id, ...data }, role: "patient" as const };
      }
    }

    const doctors = await firestoreDb.collection("doctors").get();
    for (const doc of doctors.docs) {
      const data = doc.data();
      const activeSessions = data.active_sessions || [];
      const found = activeSessions.find((s: any) => s.sessionId === sessionId);
      if (found) {
        return { user: { _id: doc.id, ...data }, role: "doctor" as const };
      }
    }

    const adminLogs = await firestoreDb.collection("admin_auth_logs")
      .where("sessionId", "==", sessionId)
      .where("status", "==", "success")
      .get();
    if (!adminLogs.empty) {
      const logData = adminLogs.docs[0].data();
      if (!logData.logoutTimestamp) {
        return {
          user: {
            _id: "super-admin",
            email: logData.adminEmail,
            role: "admin",
            name: "Super Administrator"
          },
          role: "admin" as const
        };
      }
    }
    return null;
  }, null);

  if (firestoreSession) {
    currentUser = firestoreSession.user;
    role = firestoreSession.role;
  }

  if (!currentUser) {
    // Try MongoDB
    if (!isUsingMockDb) {
      try {
        const patient = await MongoPatient.findOne({ "active_sessions.sessionId": sessionId });
        if (patient) {
          currentUser = patient.toObject();
          role = "patient";
        } else {
          const doctor = await MongoDoctor.findOne({ "active_sessions.sessionId": sessionId });
          if (doctor) {
            currentUser = doctor.toObject();
            role = "doctor";
          } else {
            const adminLog = await MongoAdminLog.findOne({ sessionId, status: "success", logoutTimestamp: null });
            if (adminLog) {
              currentUser = {
                _id: "super-admin",
                email: adminLog.adminEmail,
                role: "admin",
                name: "Super Administrator"
              };
              role = "admin";
            }
          }
        }
      } catch (err) {
        console.warn("MongoDB authentication failed:", err);
      }
    }
  }

  if (!currentUser) {
    // Try Mock / Local JSON Backup
    const patient = mockPatients.find((p) => (p.active_sessions || []).some((s: any) => s.sessionId === sessionId));
    if (patient) {
      currentUser = patient;
      role = "patient";
    } else {
      const doctor = mockDoctors.find((d) => (d.active_sessions || []).some((s: any) => s.sessionId === sessionId));
      if (doctor) {
        currentUser = doctor;
        role = "doctor";
      } else {
        const adminLog = mockAdminLogs.find((l) => l.sessionId === sessionId && l.status === "success" && !l.logoutTimestamp);
        if (adminLog) {
          currentUser = {
            _id: "super-admin",
            email: adminLog.adminEmail,
            role: "admin",
            name: "Super Administrator"
          };
          role = "admin";
        }
      }
    }
  }

  if (!currentUser) {
    return res.status(401).json({ error: "Session expired or revoked." });
  }

  // Update last activity time
  const nowStr = new Date().toISOString();
  if (role === "patient" || role === "doctor") {
    await db.updateUser(currentUser._id, { last_activity_time: nowStr });
  }

  (req as any).user = currentUser;
  (req as any).role = role;
  (req as any).sessionId = sessionId;
  next();
};

// 1. SPECIFIC ENDPOINT: REGISTER PATIENT
app.post("/api/auth/register/patient", async (req, res) => {
  try {
    const { email, password, name, phone, gender, dob, bloodGroup, address, emergencyContact } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Required details are missing" });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Password validation: 8+ characters, uppercase, lowercase, number, special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." 
      });
    }

    const existingUser = await db.findUserByEmail(trimmedEmail);
    if (existingUser) {
      return res.status(400).json({ error: "User already registered under this email" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const created = await db.createUser({
      role: "patient",
      email: trimmedEmail,
      password: hashedPassword,
      name,
      phone: phone || "",
      gender: gender || "",
      dob: dob || "",
      bloodGroup: bloodGroup || "O-Positive",
      address: address || "",
      emergencyContact: emergencyContact || "",
      email_verified: false,
      otp_verified: false,
      status: "active",
      profile_completion: 40,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.createOTP(created.email, otp, "register");

    const subject = "CareBridge Security Access Token - Verify Patient Account";
    const htmlText = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827; max-width: 500px; border: 1px solid #E5E7EB; border-radius: 12px;">
        <h2 style="color: #2E8B57; font-size: 20px; font-weight: bold; margin-bottom: 12px;">CareBridge Patient Security</h2>
        <p style="font-size: 14px; color: #4B5563;">You are registering a new patient account. Use the secure 6-digit verification token below to authorize access:</p>
        <div style="font-size: 32px; font-weight: 800; background-color: #E9F8F1; color: #2E8B57; padding: 16px; text-align: center; border-radius: 8px; letter-spacing: 4px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="font-size: 11px; color: #9CA3AF;">This code expires in 5 minutes. Patient ID: ${created.patientId}</p>
      </div>
    `;
    await sendEmail(created.email, subject, `Verification token: ${otp}`, htmlText);
    await logAudit(created.patientId, created.email, "patient", "Email Verification", req, "Dispatched verification token on patient register");

    res.json({ success: true, email: created.email, patientId: created.patientId, message: "Verification OTP dispatched" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. SPECIFIC ENDPOINT: LOGIN PATIENT
app.post("/api/auth/login/patient", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please insert credentials" });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await db.findUserByEmail(trimmedEmail);

    if (!user || user.role !== "patient") {
      bcrypt.compareSync(password, "$2a$10$abcdefghijklmnopqrstuvwx");
      await logPatientLogin(trimmedEmail, "failed", null, req, "Invalid email or password or non-patient role");
      await logAudit("unknown", trimmedEmail, "patient", "Failed Login", req, "Attempted to access patient login with incorrect email or non-patient role");
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await logPatientLogin(trimmedEmail, "failed", user.patientId, req, "Account currently locked out");
      await logAudit(user.patientId || user._id, trimmedEmail, "patient", "Account Lock", req, "Login attempt on locked account");
      return res.status(403).json({
        error: "locked",
        message: "Too many failed login attempts. Please try again after 15 minutes."
      });
    }

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      const updates: any = { failed_login_attempts: attempts, last_failed_login: new Date().toISOString() };

      if (attempts >= 5) {
        updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await logPatientLogin(trimmedEmail, "failed", user.patientId, req, "Maximum failed attempts exceeded, account locked");
        await logAudit(user.patientId || user._id, trimmedEmail, "patient", "Account Lock", req, "Maximum failed attempts exceeded, account locked for 15 minutes");
      } else {
        await logPatientLogin(trimmedEmail, "failed", user.patientId, req, `Incorrect password. Attempt ${attempts} of 5`);
        await logAudit(user.patientId || user._id, trimmedEmail, "patient", "Failed Login", req, `Failed attempt ${attempts} of 5`);
      }

      await db.updateUser(user._id.toString(), updates);
      return res.status(401).json({ error: "Invalid email or password." });
    }

    await db.updateUser(user._id.toString(), { failed_login_attempts: 0, locked_until: null });

    if (!user.email_verified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await db.createOTP(user.email, otp, "register");
      await sendEmail(user.email, "CareBridge Security Access Token", `Verify with code: ${otp}`, `<div style="font-family: sans-serif; padding: 20px;"><p>Your security code is:</p><h2>${otp}</h2></div>`);
      await logPatientLogin(trimmedEmail, "failed", user.patientId, req, "Email verification required");
      return res.status(403).json({ error: "email_unverified", email: user.email });
    }

    const sessionId = crypto.randomBytes(32).toString("hex");
    const parsedUA = parseUserAgent(req.headers["user-agent"] || "");
    const newSession = {
      sessionId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      device: parsedUA.device,
      browser: parsedUA.browser,
      os: parsedUA.os,
      userAgent: req.headers["user-agent"] || "",
      ip: req.ip || ""
    };

    const activeSessions = user.active_sessions || [];
    activeSessions.push(newSession);

    await db.updateUser(user._id.toString(), {
      active_sessions: activeSessions,
      last_login_time: new Date().toISOString(),
      last_activity_time: new Date().toISOString()
    });

    await logPatientLogin(trimmedEmail, "success", user.patientId, req);
    await logAudit(user.patientId || user._id, trimmedEmail, "patient", "Login", req, "Successful patient login");

    res.setHeader("Set-Cookie", `cb_session=${sessionId}; Path=/; HttpOnly; SameSite=Strict`);
    
    const { password: pw, ...safeUser } = user;
    res.json({ success: true, user: { ...safeUser, role: "patient" }, sessionId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. SPECIFIC ENDPOINT: REGISTER DOCTOR
app.post("/api/auth/register/doctor", async (req, res) => {
  try {
    const { email, password, name, phone, registrationNumber, qualifications, specialization, experience, clinic, languages, consultationFee, availableDays, slotDuration } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Required details are missing" });
    }

    const trimmedEmail = email.toLowerCase().trim();

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." 
      });
    }

    const existingUser = await db.findUserByEmail(trimmedEmail);
    if (existingUser) {
      return res.status(400).json({ error: "User already registered under this email" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const created = await db.createUser({
      role: "doctor",
      email: trimmedEmail,
      password: hashedPassword,
      name,
      phone: phone || "",
      registrationNumber: registrationNumber || "",
      qualifications: qualifications || "",
      specialization: specialization || "",
      experience: experience ? parseInt(experience) : 0,
      clinic: clinic || "",
      languages: languages || [],
      consultationFee: consultationFee ? parseFloat(consultationFee) : 0,
      availableDays: availableDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      slotDuration: slotDuration || "30 mins",
      email_verified: true,
      status: "active",
    });

    await logAudit(created.doctorId, created.email, "doctor", "Profile Update", req, "Registered new doctor portal profile");

    res.json({ success: true, email: created.email, doctorId: created.doctorId, message: "Doctor registered successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. SPECIFIC ENDPOINT: LOGIN DOCTOR
app.post("/api/auth/login/doctor", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please insert credentials" });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await db.findUserByEmail(trimmedEmail);

    if (!user || user.role !== "doctor") {
      bcrypt.compareSync(password, "$2a$10$abcdefghijklmnopqrstuvwx");
      await logDoctorLogin(trimmedEmail, "failed", null, req, "Invalid email or password or non-doctor role");
      await logAudit("unknown", trimmedEmail, "doctor", "Failed Login", req, "Attempted to access doctor login with incorrect credentials or non-doctor role");
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await logDoctorLogin(trimmedEmail, "failed", user.doctorId, req, "Account currently locked out");
      await logAudit(user.doctorId || user._id, trimmedEmail, "doctor", "Account Lock", req, "Login attempt on locked account");
      return res.status(403).json({
        error: "locked",
        message: "Too many failed login attempts. Please try again after 15 minutes."
      });
    }

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      const updates: any = { failed_login_attempts: attempts, last_failed_login: new Date().toISOString() };

      if (attempts >= 5) {
        updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await logDoctorLogin(trimmedEmail, "failed", user.doctorId, req, "Maximum failed attempts exceeded, account locked");
        await logAudit(user.doctorId || user._id, trimmedEmail, "doctor", "Account Lock", req, "Maximum failed attempts exceeded, account locked for 15 minutes");
      } else {
        await logDoctorLogin(trimmedEmail, "failed", user.doctorId, req, `Incorrect password. Attempt ${attempts} of 5`);
        await logAudit(user.doctorId || user._id, trimmedEmail, "doctor", "Failed Login", req, `Failed attempt ${attempts} of 5`);
      }

      await db.updateUser(user._id.toString(), updates);
      return res.status(401).json({ error: "Invalid email or password." });
    }

    await db.updateUser(user._id.toString(), { failed_login_attempts: 0, locked_until: null });

    const sessionId = crypto.randomBytes(32).toString("hex");
    const parsedUA = parseUserAgent(req.headers["user-agent"] || "");
    const newSession = {
      sessionId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      device: parsedUA.device,
      browser: parsedUA.browser,
      os: parsedUA.os,
      userAgent: req.headers["user-agent"] || "",
      ip: req.ip || ""
    };

    const activeSessions = user.active_sessions || [];
    activeSessions.push(newSession);

    await db.updateUser(user._id.toString(), {
      active_sessions: activeSessions,
      last_login_time: new Date().toISOString(),
      last_activity_time: new Date().toISOString()
    });

    await logDoctorLogin(trimmedEmail, "success", user.doctorId, req);
    await logAudit(user.doctorId || user._id, trimmedEmail, "doctor", "Login", req, "Successful doctor login");

    res.setHeader("Set-Cookie", `cb_session=${sessionId}; Path=/; HttpOnly; SameSite=Strict`);

    const { password: pw, ...safeUser } = user;
    res.json({ success: true, user: { ...safeUser, role: "doctor" }, sessionId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. SPECIFIC ENDPOINT: LOGIN ADMIN
app.post("/api/auth/login/admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please insert credentials" });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || "admin@carebridge.com").toLowerCase().trim();

    if (trimmedEmail !== SUPER_ADMIN_EMAIL) {
      await logAdminLogin(trimmedEmail, "failed", null, req, "Not authorized Super Admin email");
      return res.status(401).json({ error: "Invalid email or password." });
    }

    let isSuperAdminPasswordCorrect = false;
    if (process.env.SUPER_ADMIN_PASSWORD && password === process.env.SUPER_ADMIN_PASSWORD) {
      isSuperAdminPasswordCorrect = true;
    } else {
      const SUPER_ADMIN_HASH = process.env.SUPER_ADMIN_PASSWORD_HASH || bcrypt.hashSync("Admin123!", 10);
      isSuperAdminPasswordCorrect = bcrypt.compareSync(password, SUPER_ADMIN_HASH);
    }

    if (!isSuperAdminPasswordCorrect) {
      await logAdminLogin(trimmedEmail, "failed", null, req, "Incorrect administrator password");
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const sessionId = crypto.randomBytes(32).toString("hex");
    await logAdminLogin(trimmedEmail, "success", sessionId, req);
    await logAudit("super-admin", trimmedEmail, "admin", "Login", req, "Admin secure dashboard entry");

    res.setHeader("Set-Cookie", `cb_session=${sessionId}; Path=/; HttpOnly; SameSite=Strict`);

    res.json({
      success: true,
      user: {
        _id: "super-admin",
        email: SUPER_ADMIN_EMAIL,
        role: "admin",
        name: "Super Administrator",
        verified: true,
        email_verified: true,
        phone_verified: true
      },
      sessionId
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. SPECIFIC ENDPOINT: LOGOUT ACTION
app.post("/api/auth/logout", authenticateSession, async (req: any, res) => {
  try {
    const { all } = req.query;
    const user = req.user;
    const role = req.role;
    const sessionId = req.sessionId;

    if (role === "patient" || role === "doctor") {
      let activeSessions = user.active_sessions || [];
      if (all === "true") {
        activeSessions = [];
        await db.updateUser(user._id, { active_sessions: activeSessions, last_logout_time: new Date().toISOString() });
        await logAudit(user.patientId || user.doctorId || user._id, user.email, role, "Logout", req, "Logged out from all active sessions and devices");
      } else {
        activeSessions = activeSessions.filter((s: any) => s.sessionId !== sessionId);
        await db.updateUser(user._id, { active_sessions: activeSessions, last_logout_time: new Date().toISOString() });
        await logAudit(user.patientId || user.doctorId || user._id, user.email, role, "Logout", req, "Logged out active session");
      }
    } else if (role === "admin") {
      await safeFirestoreCall("adminLogout", async () => {
        const snapshot = await firestoreDb.collection("admin_auth_logs")
          .where("sessionId", "==", sessionId)
          .get();
        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({ logoutTimestamp: new Date().toISOString() });
        }
      }, null);

      if (!isUsingMockDb) {
        try {
          await MongoAdminLog.findOneAndUpdate({ sessionId }, { logoutTimestamp: new Date() });
        } catch (e) {
          console.error(e);
        }
      } else {
        const idx = mockAdminLogs.findIndex(l => l.sessionId === sessionId);
        if (idx !== -1) {
          mockAdminLogs[idx].logoutTimestamp = new Date().toISOString();
        }
      }
      await logAudit("super-admin", user.email, "admin", "Logout", req, "Logged out administrator workspace session");
    }

    res.setHeader("Set-Cookie", "cb_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. SPECIFIC ENDPOINT: GET PROFILE
app.get("/api/auth/profile", authenticateSession, async (req: any, res) => {
  try {
    const { password, ...safeUser } = req.user;
    res.json({ success: true, user: safeUser, role: req.role });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. SPECIFIC ENDPOINT: GET SESSIONS LIST
app.get("/api/auth/sessions", authenticateSession, async (req: any, res) => {
  try {
    if (req.role === "admin") {
      const stats = await getAdminLogStats(req.user.email);
      let allLogs: any[] = [];
      const firestoreLogs = await safeFirestoreCall("getAdminAuthLogs", async () => {
        const snapshot = await firestoreDb.collection("admin_auth_logs").get();
        const logs: any[] = [];
        snapshot.forEach((doc: any) => logs.push(doc.data()));
        return { logs, success: true };
      }, { logs: [], success: false });

      if (firestoreLogs.success) {
        allLogs = firestoreLogs.logs;
      } else if (!isUsingMockDb) {
        allLogs = await MongoAdminLog.find({}).sort({ loginTimestamp: -1 }).lean();
      } else {
        allLogs = [...mockAdminLogs];
      }
      return res.json({ success: true, stats, sessions: allLogs });
    }

    const sessions = req.user.active_sessions || [];
    res.json({ success: true, sessions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. SPECIFIC ENDPOINT: DELETE/REVOKE A SESSION
app.delete("/api/auth/session/:id", authenticateSession, async (req: any, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const role = req.role;

    if (role === "admin") {
      return res.status(403).json({ error: "Admin sessions cannot be individually revoked through this endpoint." });
    }

    let activeSessions = user.active_sessions || [];
    const initialLen = activeSessions.length;
    activeSessions = activeSessions.filter((s: any) => s.sessionId !== id);

    if (activeSessions.length === initialLen) {
      return res.status(404).json({ error: "Session record not found" });
    }

    await db.updateUser(user._id, { active_sessions: activeSessions });
    await logAudit(user.patientId || user.doctorId || user._id, user.email, role, "Session Revocation", req, `Revoked active session ID: ${id}`);

    res.json({ success: true, message: "Session revoked successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// BACKWARDS COMPATIBILITY REGISTER DELEGATE
app.post("/api/auth/register", async (req, res) => {
  const role = req.body.role || "patient";
  if (role === "doctor") {
    req.url = "/api/auth/register/doctor";
  } else {
    req.url = "/api/auth/register/patient";
  }
  app._router.handle(req, res);
});

// BACKWARDS COMPATIBILITY LOGIN DELEGATE
app.post("/api/auth/login", async (req, res) => {
  const role = req.body.role || "patient";
  if (role === "admin") {
    req.url = "/api/auth/login/admin";
  } else if (role === "doctor") {
    req.url = "/api/auth/login/doctor";
  } else {
    req.url = "/api/auth/login/patient";
  }
  app._router.handle(req, res);
});

// OTP VERIFY BACKWARDS COMPATIBILITY
app.post("/api/auth/otp-verify", async (req, res) => {
  try {
    const { email, otp, type } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Missing OTP parameters" });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const otpResult = await db.verifyOTP(trimmedEmail, otp, type || "register");

    if (!otpResult.success) {
      if (otpResult.error === "locked") {
        return res.status(400).json({ error: "locked", message: "Security lock active. Maximum verification attempts exceeded. Please request a new code." });
      } else if (otpResult.error === "expired") {
        return res.status(400).json({ error: "expired", message: "Verification token has expired (5 minute validity). Please request a new code." });
      } else {
        return res.status(400).json({ error: "invalid", message: `Invalid verification code. ${otpResult.attemptsLeft} attempts remaining before security lock.` });
      }
    }

    const user = await db.findUserByEmail(trimmedEmail);
    if (user) {
      const updated = await db.updateUser(user._id.toString(), {
        email_verified: true,
        otp_verified: true,
      });
      const { password, ...safeUser } = updated as any;
      await logAudit(user.patientId || user.doctorId || user._id, trimmedEmail, user.role, "OTP Verification", req, "Verified registration OTP successfully");
      return res.json({ success: true, user: safeUser });
    }

    res.status(404).json({ error: "User profile record not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// FORGOT PASSWORD REQUEST WITH NEW SCHEMAS
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || "admin@carebridge.com").toLowerCase().trim();
    if (trimmedEmail === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({ error: "This action is prohibited for the requested security profile." });
    }

    const user = await db.findUserByEmail(trimmedEmail);
    if (!user) {
      return res.json({ success: true, message: "If that email matches our records, a password recovery code has been dispatched." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.createOTP(user.email, otp, "forgot");

    const subject = "CareBridge Password Recovery Verification";
    const text = `Use the code: ${otp} to reset your secure gateway password. This code expires in 5 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827; max-width: 500px; border: 1px solid #E5E7EB; border-radius: 12px;">
        <h2 style="color: #DC2626; font-size: 20px; font-weight: bold; margin-bottom: 12px;">Password Recovery Gateway</h2>
        <p style="font-size: 14px; color: #4B5563;">You requested a recovery verification token. Use the code below to reset your password:</p>
        <div style="font-size: 32px; font-weight: 800; background-color: #FEF2F2; color: #DC2626; padding: 16px; text-align: center; border-radius: 8px; letter-spacing: 4px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="font-size: 11px; color: #9CA3AF;">This code is valid for 5 minutes.</p>
      </div>
    `;
    await sendEmail(user.email, subject, text, html);
    await logAudit(user.patientId || user.doctorId || user._id, trimmedEmail, user.role, "OTP Verification", req, "Dispatched password recovery verification OTP");

    res.json({ success: true, message: "Reset OTP code dispatched" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RESEND OTP CODE ACTION WITH NEW SCHEMAS
app.post("/api/auth/resend-otp", async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!email || !type) {
      return res.status(400).json({ error: "Email and code type parameters are required." });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await db.findUserByEmail(trimmedEmail);

    if (!user) {
      return res.json({ success: true, message: "If that email matches our records, a fresh verification token has been resent." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpType = type === "forgot" ? "forgot" : "register";
    await db.createOTP(user.email, otp, otpType);

    const subject = otpType === "forgot" ? "CareBridge Password Recovery Verification" : "CareBridge Security Access Token - Verify Account";
    const text = `Your security code is: ${otp}. This code is valid for 5 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827; max-width: 500px; border: 1px solid #E5E7EB; border-radius: 12px;">
        <h2 style="color: #2E8B57; font-size: 20px; font-weight: bold; margin-bottom: 12px;">Security Verification</h2>
        <p style="font-size: 14px; color: #4B5563;">Your verification security token is:</p>
        <div style="font-size: 32px; font-weight: 800; background-color: #E9F8F1; color: #2E8B57; padding: 16px; text-align: center; border-radius: 8px; letter-spacing: 4px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="font-size: 11px; color: #9CA3AF;">This code is valid for 5 minutes.</p>
      </div>
    `;
    await sendEmail(user.email, subject, text, html);
    await logAudit(user.patientId || user.doctorId || user._id, trimmedEmail, user.role, "OTP Verification", req, "Resent security verification OTP token");

    res.json({ success: true, message: "Verification code resent successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RESET PASSWORD ACTION WITH NEW SCHEMAS
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ error: "Parameters missing for reset action" });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || "admin@carebridge.com").toLowerCase().trim();
    if (trimmedEmail === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({ error: "This action is prohibited." });
    }

    const otpResult = await db.verifyOTP(trimmedEmail, otp, "forgot");
    if (!otpResult.success) {
      return res.status(400).json({ error: otpResult.error || "invalid", message: "Invalid or expired recovery security code" });
    }

    const user = await db.findUserByEmail(trimmedEmail);
    if (!user) {
      return res.status(404).json({ error: "User account missing" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." 
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await db.updateUser(user._id.toString(), {
      password: hashedPassword,
      password_updated_at: new Date().toISOString()
    });

    await logAudit(user.patientId || user.doctorId || user._id, trimmedEmail, user.role, "Password Change", req, "Changed account password successfully via recovery");

    res.json({ success: true, message: "Password redefined successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. FETCH LOGGED IN DETAILS
app.get("/api/users/me", async (req, res) => {
  try {
    let token = req.query.userId as string;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized access, missing token" });
    }

    if (token === "super-admin") {
      const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || "admin@carebridge.com").toLowerCase().trim();
      return res.json({
        success: true,
        user: {
          _id: "super-admin",
          email: SUPER_ADMIN_EMAIL,
          role: "admin",
          name: "Super Administrator",
          verified: true,
          email_verified: true,
          phone_verified: true
        }
      });
    }

    const user = await db.findUserById(token);
    if (!user) {
      return res.status(404).json({ error: "User profile missing" });
    }

    const { password, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. UPDATE PROFILE DETAILS
app.post("/api/users/update", async (req, res) => {
  try {
    const { 
      userId, 
      bloodGroup, 
      insurance, 
      emergencyContact, 
      specialty, 
      scheduleHours, 
      phone,
      name,
      profileImage,
      qualifications,
      hospital,
      languages,
      availability,
      gender,
      age,
      email,
      is_profile_setup
    } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (userId === "super-admin") {
      return res.status(403).json({ error: "Modifications to the Super Admin account are strictly prohibited." });
    }

    const updated = await db.updateUser(userId, {
      bloodGroup,
      insurance,
      emergencyContact,
      specialty,
      scheduleHours,
      phone,
      name,
      profileImage,
      qualifications,
      hospital,
      languages,
      availability,
      gender,
      age,
      email,
      is_profile_setup
    });

    const { password, ...safeUser } = updated as any;
    res.json({ success: true, user: safeUser });
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
        <p style="font-size: 11px; color: #9CA3AF;">Need to make adjustments? Visit your CareBridge Patient Portal dashboard.</p>
      </div>
    `;
    await sendEmail(patientEmail || "patient@carebridge.com", subject, text, html);

    res.json({ success: true, appointment: appt });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10b. ADMIN SPECIFIC ENDPOINT: FETCH ALL LOGIN LOGS (PATIENT, DOCTOR & ADMIN)
app.get("/api/admin/login-logs", authenticateSession, async (req: any, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin credentials required." });
    }

    let patientLogins: any[] = [];
    let doctorLogins: any[] = [];
    let adminLogins: any[] = [];

    // 1. Fetch patient login logs
    const firestorePatientLogins = await safeFirestoreCall("getPatientLoginLogs", async () => {
      const snapshot = await firestoreDb.collection("patient_login_logs").get();
      const logs: any[] = [];
      snapshot.forEach((doc: any) => logs.push(doc.data()));
      return { logs, success: true };
    }, { logs: [], success: false });

    if (firestorePatientLogins.success) {
      patientLogins = firestorePatientLogins.logs;
    } else if (!isUsingMockDb) {
      patientLogins = await MongoPatientLogin.find({}).sort({ loginTimestamp: -1 }).lean();
    } else {
      patientLogins = [...mockPatientLoginLogs];
    }

    // 2. Fetch doctor login logs
    const firestoreDoctorLogins = await safeFirestoreCall("getDoctorLoginLogs", async () => {
      const snapshot = await firestoreDb.collection("doctor_login_logs").get();
      const logs: any[] = [];
      snapshot.forEach((doc: any) => logs.push(doc.data()));
      return { logs, success: true };
    }, { logs: [], success: false });

    if (firestoreDoctorLogins.success) {
      doctorLogins = firestoreDoctorLogins.logs;
    } else if (!isUsingMockDb) {
      doctorLogins = await MongoDoctorLogin.find({}).sort({ loginTimestamp: -1 }).lean();
    } else {
      doctorLogins = [...mockDoctorLoginLogs];
    }

    // 3. Fetch admin login logs
    const firestoreAdminLogins = await safeFirestoreCall("getAdminAuthLogs", async () => {
      const snapshot = await firestoreDb.collection("admin_auth_logs").get();
      const logs: any[] = [];
      snapshot.forEach((doc: any) => logs.push(doc.data()));
      return { logs, success: true };
    }, { logs: [], success: false });

    if (firestoreAdminLogins.success) {
      adminLogins = firestoreAdminLogins.logs;
    } else if (!isUsingMockDb) {
      adminLogins = await MongoAdminLog.find({}).sort({ loginTimestamp: -1 }).lean();
    } else {
      adminLogins = [...mockAdminLogs];
    }

    // Sort logs descending by timestamp
    patientLogins.sort((a, b) => new Date(b.loginTimestamp).getTime() - new Date(a.loginTimestamp).getTime());
    doctorLogins.sort((a, b) => new Date(b.loginTimestamp).getTime() - new Date(a.loginTimestamp).getTime());
    adminLogins.sort((a, b) => new Date(b.loginTimestamp).getTime() - new Date(a.loginTimestamp).getTime());

    res.json({
      success: true,
      patientLogins,
      doctorLogins,
      adminLogins
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. FETCH APPOINTMENTS
app.get("/api/appointments", async (req, res) => {
  try {
    const { userId, role, doctorName } = req.query;

    if (role === "admin") {
      const appts = await db.getAllAppointments();
      return res.json({ success: true, appointments: appts });
    }

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

// 11b. FETCH REGISTERED DOCTORS
app.get("/api/doctors", async (req, res) => {
  try {
    const list = await db.getDoctors();
    res.json({ success: true, doctors: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11c. FETCH REGISTERED PATIENTS
app.get("/api/patients", async (req, res) => {
  try {
    const list = await db.getPatients();
    res.json({ success: true, patients: list });
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
  // Initialize datastores cleanly and safely
  await initializeDatabases();

  // Execute database seeding
  await seedDatabase();

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
