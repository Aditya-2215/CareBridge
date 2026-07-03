# 🏥 CareBridge – AI Powered Healthcare Appointment & Follow-up Manager

<div align="center">

![CareBridge Banner](https://img.shields.io/badge/CareBridge-AI%20Healthcare-2E8B57?style=for-the-badge)

### **Care That Keeps You Connected.**

An AI-powered healthcare platform that bridges the gap between **Patients**, **Doctors**, and **Healthcare Administrators** through intelligent appointment management, AI-assisted consultations, automated follow-ups, medication reminders, and seamless healthcare communication.

![License](https://img.shields.io/badge/License-MIT-blue)
![Node](https://img.shields.io/badge/Node.js-20+-green)
![React](https://img.shields.io/badge/React-18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Gemini](https://img.shields.io/badge/Gemini-AI-purple)
![Express](https://img.shields.io/badge/Express.js-Backend-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

</div>

---

# 📖 Overview

CareBridge is a full-stack AI-powered healthcare management platform designed to simplify healthcare interactions between patients, doctors, and healthcare administrators.

The platform leverages **Google Gemini AI** to generate intelligent pre-consultation summaries, post-visit reports, medication guidance, and follow-up recommendations while providing a secure and seamless appointment management system.

Unlike traditional appointment booking platforms, CareBridge focuses on improving communication, reducing administrative workload, and enhancing the overall healthcare experience.

---

# 🎯 Problem Statement

Traditional healthcare appointment systems often suffer from:

- Manual appointment scheduling
- Poor communication
- Missed appointments
- Lack of patient follow-up
- No intelligent symptom analysis
- No centralized health records
- Difficult doctor management
- No AI assistance
- No automated medication reminders

CareBridge solves these problems using Artificial Intelligence and intelligent workflow automation.

---

# 🚀 Key Features

## 👨‍⚕️ Patient Portal

- Secure Registration
- Login Authentication
- Email Verification
- OTP Verification
- AI Symptom Submission
- Doctor Search
- Filter by Specialization
- Appointment Booking
- Appointment Rescheduling
- Appointment Cancellation
- Medical History
- Prescription History
- Medication Reminder
- Profile Management
- AI Healthcare Assistant
- Download Appointment Details
- Google Calendar Integration
- Responsive Dashboard

---

## 🩺 Doctor Portal

- Secure Login
- Professional Dashboard
- Today's Appointments
- Upcoming Appointments
- Patient Medical History
- AI Generated Symptom Summary
- Consultation Notes
- Digital Prescription
- Follow-up Recommendation
- Appointment Management
- Leave Management
- Working Hours Configuration
- Slot Management
- AI Assisted Consultation

---

## 👨‍💼 Admin Portal

- Secure Admin Authentication
- Dashboard Analytics
- Patient Management
- Doctor Management
- Appointment Monitoring
- System Logs
- Security Monitoring
- Login Audit
- Session Tracking
- Database Monitoring
- User Verification
- Email Management
- AI Usage Monitoring

---

# 🤖 Artificial Intelligence Features

Powered by **Google Gemini API**

### Pre-Consultation AI

- Symptom Analysis
- Urgency Detection
- Chief Complaint Extraction
- Suggested Questions
- Consultation Preparation

---

### Post Consultation AI

- Patient Friendly Summary
- Medication Instructions
- Follow-up Steps
- Lifestyle Suggestions
- Health Tips

---

### AI Healthcare Assistant

- Healthcare FAQ
- Medicine Explanation
- Prescription Interpretation
- Appointment Guidance
- Medical Report Explanation

---

# 🗓 Appointment Management

- Smart Slot Booking
- Conflict Detection
- Double Booking Prevention
- Working Hours Validation
- Doctor Leave Management
- Real-Time Availability
- Appointment Reminder
- Follow-up Scheduling

---

# 💊 Medication Management

- Prescription Storage
- Medication Schedule
- Daily Reminder
- Reminder Notifications
- Follow-up Alerts
- Medication History

---

# 📧 Notification System

Automatic Email Notifications

- Registration
- OTP
- Email Verification
- Appointment Confirmation
- Appointment Reminder
- Appointment Cancellation
- Rescheduling
- Prescription Notification
- Follow-up Reminder

---

# 🔐 Authentication & Security

- JWT Authentication
- Role-Based Authentication
- Secure Sessions
- Password Hashing (bcrypt/Argon2)
- Email Verification
- OTP Verification
- Session Tracking
- Login History
- Device Tracking
- Rate Limiting
- Helmet Security
- Mongo Sanitization
- XSS Protection
- Secure Cookies
- Environment Variables
- Role Middleware
- Admin Protected Routes

---

# 📊 Analytics Dashboard

- Total Patients
- Total Doctors
- Total Appointments
- Active Sessions
- Today's Bookings
- Revenue Overview
- Consultation Statistics
- Appointment Trends
- Specialization Analytics

---

# 🏗 System Architecture

```text
                CareBridge

                    │

        React + TypeScript Frontend

                    │

          Express.js REST API Backend

                    │

        Authentication Middleware

                    │

       Business Logic & AI Services

       ├──────────────┐─────────────┐
       │              │             │
   Gemini AI     Nodemailer    Google Calendar

                    │

              MongoDB Atlas
```

---

# 🛠 Tech Stack

## Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Axios
- Framer Motion
- Lucide Icons

---

## Backend

- Node.js
- Express.js
- TypeScript
- JWT
- bcrypt
- Nodemailer
- Google Gemini API
- Google OAuth
- Google Calendar Integration
- Cron Jobs

---

## Database

- MongoDB Atlas
- Mongoose ODM

---

## AI

- Google Gemini API

Features:

- Symptom Analysis
- Clinical Summary
- Follow-up Summary
- Medical Explanation

---

## Cloud Services

- MongoDB Atlas
- Google OAuth
- Google Calendar
- Gmail SMTP
- Render
- Vercel

---

# 📁 Project Structure

```
CareBridge

client/
server/

models/

controllers/

routes/

middlewares/

services/

utils/

config/

public/

assets/

README.md

.env.example
```

---

# 🔄 Application Workflow

## Patient

```
Register

↓

Verify Email

↓

Login

↓

Search Doctor

↓

Book Appointment

↓

Submit Symptoms

↓

AI Summary Generated

↓

Doctor Consultation

↓

Prescription

↓

AI Patient Summary

↓

Medication Reminder

↓

Follow-up
```

---

## Doctor

```
Login

↓

Dashboard

↓

Today's Appointments

↓

AI Symptom Summary

↓

Consultation

↓

Prescription

↓

Follow-up

↓

Patient Summary
```

---

## Admin

```
Login

↓

Dashboard

↓

Manage Doctors

↓

Manage Patients

↓

Appointments

↓

Analytics

↓

System Monitoring
```

---

# 🔒 Security Features

- JWT Authentication
- Password Hashing
- Secure OTP
- Email Verification
- Session Management
- Role Authorization
- Rate Limiting
- Secure Headers
- Mongo Sanitization
- XSS Protection
- CSRF Ready
- Secure Environment Variables
- Audit Logging

---

# 🌟 Highlights

- AI Powered Healthcare
- Modern Glassmorphism UI
- Fully Responsive
- Premium User Experience
- Enterprise Grade Authentication
- Google Gemini Integration
- Google Calendar Integration
- Secure Backend Architecture
- Automated Email System
- Appointment Analytics
- Medication Reminder
- AI Generated Clinical Summaries

---

# 📦 Installation

```bash
git clone https://github.com/yourusername/carebridge.git
```

```bash
cd carebridge
```

```bash
npm install
```

Create a `.env` file based on `.env.example`.

Start the development server:

```bash
npm run dev
```

---

# 🌐 Deployment

Supported Platforms

- Render
- Railway
- Vercel
- Docker
- Ubuntu VPS

---

# 👨‍💻 Developer

**Aditya Raj Pandey**

B.Tech Computer Science Engineering (AI & ML)

Full Stack Developer | AI Developer

---

# 📜 License

This project is licensed under the MIT License.

---

# ❤️ Acknowledgements

Special thanks to:

- Google Gemini API
- MongoDB Atlas
- React
- Express.js
- Node.js
- Tailwind CSS
- Google Cloud Platform

---

<div align="center">

## 🌿 CareBridge

### **Care That Keeps You Connected.**

**Building the future of intelligent healthcare, one appointment at a time.**

⭐ If you like this project, don't forget to star the repository.

</div>
