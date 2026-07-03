# 🏥 CareBridge – System Design

# Overview

CareBridge is an AI-powered Healthcare Appointment & Follow-up Management System that connects Patients, Doctors, and Administrators on a secure platform.

The application follows a layered architecture with separate frontend, backend, AI services, notification services, and database.

---

# High Level Architecture

```
                          ┌─────────────────────────────┐
                          │         Client Layer        │
                          │ React + TypeScript + Vite   │
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          HTTPS REST API / JWT
                                         │
                          ┌──────────────┴──────────────┐
                          │      Express.js Server      │
                          └──────────────┬──────────────┘
                                         │
          ┌──────────────┬───────────────┼──────────────┬──────────────┐
          │              │               │              │              │
          ▼              ▼               ▼              ▼              ▼
 Authentication      Appointment      AI Service     Email       Calendar
    Service            Service         (Gemini)      Service     Integration
          │              │               │              │              │
          └──────────────┴───────────────┴──────────────┴──────────────┘
                                         │
                                         ▼
                          MongoDB Atlas Database
```

---

# System Components

## Frontend

- React
- TypeScript
- Tailwind CSS
- React Router
- Axios
- Framer Motion

Responsibilities

- Authentication
- Dashboard
- Appointment Booking
- Profile
- Reports
- AI Summary
- Notifications

---

## Backend

Express.js

Responsibilities

- Authentication
- Authorization
- Business Logic
- Validation
- AI Integration
- Email
- Reminder Jobs
- Appointment Logic

---

## AI Layer

Google Gemini API

Responsibilities

- Symptom Analysis
- Urgency Detection
- Consultation Summary
- Prescription Explanation
- Follow-up Summary

---

## Notification Service

Nodemailer

Responsibilities

- OTP
- Verification
- Booking Confirmation
- Reminder
- Cancellation
- Follow-up

---

## Scheduler

Node Cron

Responsibilities

- Medication Reminder
- Appointment Reminder
- Follow-up Reminder
- Cleanup Expired OTP

---

## Database

MongoDB Atlas

Collections

- Patients
- Doctors
- Appointments
- Sessions
- OTP
- Notifications
- Prescriptions
- AuditLogs

---

# Authentication Flow

```
User

↓

Register

↓

Email Verification

↓

OTP Verification

↓

Password Hash

↓

MongoDB

↓

Login

↓

JWT

↓

Dashboard
```

---

# Patient Booking Flow

```
Patient

↓

Search Doctor

↓

Select Slot

↓

Enter Symptoms

↓

Gemini AI

↓

Pre-Visit Summary

↓

Appointment Created

↓

Email

↓

Calendar

↓

Reminder

↓

Consultation
```

---

# Doctor Flow

```
Doctor Login

↓

Dashboard

↓

Today's Appointments

↓

View AI Summary

↓

Consultation

↓

Prescription

↓

Gemini

↓

Patient Friendly Summary

↓

Email Patient
```

---

# Admin Flow

```
Admin Login

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

Audit Logs

↓

System Monitoring
```

---

# Security Architecture

JWT Authentication

↓

Role Middleware

↓

Protected Routes

↓

Validation

↓

Business Logic

↓

Database

Security Layers

- bcrypt Password Hashing
- JWT
- Rate Limiter
- Helmet
- XSS Protection
- Mongo Sanitization
- Secure Cookies
- Input Validation

---

# AI Workflow

Patient Symptoms

↓

Gemini Prompt

↓

Urgency

↓

Chief Complaint

↓

Doctor Questions

↓

Stored in MongoDB

↓

Doctor Dashboard

---

After Consultation

Doctor Notes

↓

Gemini

↓

Patient Summary

↓

Medication Schedule

↓

Follow-up Advice

↓

Patient Dashboard

---

# Reminder System

Appointment Created

↓

Reminder Queue

↓

Cron Scheduler

↓

Email

↓

Medication Reminder

↓

Follow-up Reminder

---

# Deployment Architecture

```
                User
                  │
                  ▼
          Render / Railway
                  │
        Express.js Backend
                  │
      ┌───────────┴───────────┐
      │                       │
MongoDB Atlas          Gemini API
      │                       │
      └───────────┬───────────┘
                  │
             Nodemailer
                  │
                Gmail
```

---

# Scalability

Supports

- Horizontal Scaling
- Multiple Doctors
- Multiple Clinics
- Thousands of Patients
- AI Requests
- Background Jobs
- Future Payment Integration

---

# Future Enhancements

- Video Consultation
- Voice AI
- Medical Report OCR
- Wearable Integration
- Insurance Module
- Multi Hospital Support
- Mobile App
- AI Health Twin
