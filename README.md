# AlignOps / GoalOps Enterprise - In-House Goal Setting & Tracking Portal

> **Optimizing Goal Alignment, Performance Intelligence, and HR Governance**
> 
> A secure, enterprise-grade Goal Governance & Performance Intelligence platform designed for Hindustan Petroleum Corporation Limited (HPCL) to solve the **AtomQuest Hackathon 1.0: In-House Goal Setting & Tracking Portal** challenge.

[![Next.js 15](https://img.shields.io/badge/Next.js-15+-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind--CSS-3.4+-38BDF8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)

---

## Table of Contents

| # | Section |
|---|---------|
| 1 | [Overview](#overview) |
| 2 | [Problem Statement](#problem-statement) |
| 3 | [Key Features](#key-features) |
| 4 | [System Architecture](#system-architecture) |
| 5 | [Technology Stack](#technology-stack) |
| 6 | [Quick Start Guide](#quick-start-guide) |
| 7 | [Project Structure](#project-structure) |
| 8 | [Role Persona Authentication](#role-persona-authentication) |
| 9 | [Reporting & Governance](#reporting--governance) |
| 10 | [Performance & Cost Optimization](#performance--cost-optimization) |
| 11 | [Development & Testing](#development--testing) |
| 12 | [License & Acknowledgments](#license--acknowledgments) |

---

## Overview

**GoalOps Enterprise** is a high-fidelity digital Goal Governance & Performance Intelligence platform custom-built to eliminate the friction, security vulnerabilities, and blind spots of manual, spreadsheet-based goal tracking. The platform aligns organizational objectives, simplifies quarterly review cycles, protects operational data via granular Row Level Security (RLS), and provides human resource officers with an instant compliance cockpit.

### The Problem it Solves
Traditional organizational planning methods suffer from three severe operational issues:
- **Fragmentation:** Spreadsheets and email chains lose tracking data and lead to reporting gaps during annual appraisal reviews.
- **Vague Alignment:** Direct reports lack real-time visibility into how their goals feed into organizational and departmental KPIs.
- **Governance Gaps:** Manual updates allow post-appraisal target modifications without verification, ruining the audit trail.

### The GoalOps Solution
- **Speed:** Instant goal creation, submission, and manager approval cycles.
- **Accuracy:** Enforced visual validation rules ensuring that weights, goal limits, and thrust areas conform to policies before locking.
- **Security:** Immutable database ledger and Row Level Security blocking unauthorized modifications.
- **Analytics:** Real-time completion rates, department performance trends, and dynamic progress trackers.

---

## Problem Statement

### AtomQuest Hackathon 1.0: In-House Goal Setting & Tracking Portal

#### Phase 1 — Goal Creation & Approval (Must-Have)
- **Employee Goals Sheet:** Define goals under specific Thrust Areas (Operational Excellence, Revenue Growth, etc.) with custom Titles and Descriptions.
- **Unit of Measurement (UoM):** Mapped dynamically to Numeric, Percentage (%), Timeline (Days), and Zero-based (0 = Success).
- **Strict Business Validation Rules:**
  - Total weightage across all goals must equal exactly **100%**.
  - Minimum individual goal weightage: **10%**.
  - Maximum goals per employee: **8 goals**.
- **L1 Manager Workflow:** Approve or return sheets for rework, with dynamic inline editing of weights and targets.
- **Departmental Shared KPIs:** Push read-only global goals directly to the team (reports can edit weightage only).

#### Phase 2 — Achievement Tracking & Quarterly Check-ins (Must-Have)
- **Quarterly Achievement Logging:** Update Actual vs. Planned Targets, marking status (Not Started / On Track / Completed).
- **Manager Feedback Logs:** Record notes and discussion comments during reviews.
- **Dynamic Score Computations:**
  - *Min (Higher is better):* `Achievement / Target`
  - *Max (Lower is better):* `Target / Achievement`
  - *Zero-based:* `If Achievement == 0 -> 100%, else 0%`

---

## Key Features

- **Dynamic Goal Validation Engine:** Enforces policy limits at both form entry and database submittal.
- **Interactive Check-in Schedule:** Enforces quarterly capture windows (Goal Setting, Q1, Q2, Q3, Annual).
- **Shared KPI Push Channel:** Pushes read-only global goals instantly to the sheets of all reports under the manager.
- **Exception Lock Overrides:** HR and Admins can override cycle locks, return sheets to `draft`, and authorize off-cycle edits.
- **Immutable Audit Trail:** Track target or weightage adjustments made after the lock date, capturing who, what, when, old, and new values.
- **Rule-Based SLA Escalations:** Admin panel highlighting direct reports overdue on submittals or managers overdue on reviews.
- **Live CSV Export Engine:** Download a formatted CSV summary sheet showing planned targets vs. achievements for all employees.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Frontend View Layer (Next.js)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Employee   │  │  Manager L1  │  │  Admin / HR  │     │
│  │  Dashboard   │  │  Dashboard   │  │   Cockpit    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                         ↕ Server Actions                    │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│             Secure Data Actions (Next.js / Node)            │
│  ┌────────────────────────────────────────────────────┐    │
│  │             Business Logic & Math Layer            │    │
│  │  • Target vs Achievement Score Math Formulas      │    │
│  │  • Weightage Validation (Exactly 100%)             │    │
│  │  • SLA Cycle Tracker & Escalation Processor        │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     CSV      │  │  Audit Log   │  │  Escalation  │     │
│  │    Stream    │  │   Recorder   │  │   Triggers   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                   Secure Database (Supabase)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Profiles    │  │  Goals /     │  │  Approvals / │     │
│  │  (Postgres)  │  │  Shared      │  │  Check-ins   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         🔒 Enforced Row Level Security (RLS) policies       │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15+ | High-performance React framework (App Router) |
| **Supabase** | Latest | Backend-as-a-service (Database + Auth) |
| **PostgreSQL** | 15+ | Relational data layer with secure RLS policies |
| **TypeScript** | 5.0+ | Strict type-safety across client and server |
| **Tailwind CSS** | 3.4+ | Core layout styling and aesthetic variables |
| **Lucide React** | Latest | Modern icon system |
| **Recharts** | Latest | Responsive data charts for analytics |

---

## Quick Start Guide

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Supabase CLI** (optional)

### Setup & Run

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Aadesh1106/Goal-Ops.git
   cd Goal-Ops/goalops-enterprise
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Initialize Database Schema:**
   Apply the migrations provided in the `/supabase/schema.sql` file directly to your Supabase SQL editor to create all tables, helper functions, and Row Level Security (RLS) policies.

5. **Start Local Server:**
   ```bash
   npm run dev
   ```
   Open **http://localhost:3000** in your browser.

---

## Project Structure

```
goalops-enterprise/
├── src/
│   ├── app/                    # Next.js App Router Pages
│   │   ├── api/                # Secure API route handlers
│   │   │   ├── export/         # CSV Export Engine
│   │   │   └── auth/           # SSO registration helpers
│   │   ├── auth/               # Auth UI (Login, Register, Recovery)
│   │   ├── dashboard/          # Role-based dashboards
│   │   │   ├── employee/       # Employee Workspace
│   │   │   ├── manager/        # L1 Manager Approval Center
│   │   │   └── admin/          # Cycle Governance Controls & Logs
│   │   └── layout.tsx          # Root Layout with custom Theme vars
│   ├── components/             # Reusable UI Components
│   │   ├── ui/                 # Core design system inputs
│   │   └── layout/             # Sidebar and Page Header wrappers
│   ├── lib/                    # Shared integrations
│   │   └── supabase/           # Server/Client database connectors
│   └── utils/                  # Core math formulas and formatters
├── supabase/                   # Schema configuration
│   └── schema.sql              # Database migrations and RLS
├── COMPLIANCE.md               # Hackathon 1.0 audit log
├── package.json                # Project dependencies
└── README.md                   # This file
```

---

## Role Persona Authentication

For ease of evaluation, use these pre-loaded accounts to test all user journeys:

#### 👤 Employee Persona
*   **Option 1 (Pre-loaded direct reports):**
    *   *Email:* `employee@hpcl.com`
    *   *Password:* `password123`
*   **Option 2 (Newly Registered Employee Sandbox):**
    *   *Email:* `google@google.com`
    *   *Password:* `password123` *(or your custom password)*

#### 👥 Manager (L1) Persona
*   **Responsibilities:** Approve reports' goal sheets, log feed-back comments, push shared departmental KPIs.
*   **Email:** `manager@hpcl.com`
*   **Password:** `password123`

#### 👑 Admin / HR Persona
*   **Responsibilities:** Lock bypass controls, cycle tracking, export CSV sheets, check SLA escalation alerts.
*   **Email:** `admin@hpcl.com`
*   **Password:** `password123`

---

## Reporting & Governance

- **Live Export (CSV/Excel):** Admin dashboard triggers the export engine to download real-time reports of all planned targets vs. actual progress.
- **Governance Override Actions:** Allows HR admins to reopen approved goal sheets and unassign locked KPIs for operational flexibility.
- **Immutable Log Ledger:** Track target or weightage adjustments made after the lock date, capturing who, what, when, old, and new values.

---

## Performance & Cost Optimization

- **Server Actions:** leverages secure Next.js Server Actions to minimize round-trip latencies.
- **Database Indexing:** Optimizes PostgreSQL foreign keys and queries to stay within free-tier resource bounds.
- **A11y Visuals:** Styled with curated deep-dark glassmorphism, dynamic weightage sliders, and clear feedback alerts.

---

## License & Acknowledgments

- **Atomberg Technologies** for the Hackathon 1.0 specification.
- **Supabase** for providing instant, secure RLS backend tools.
- **Next.js & React** communities for high-performance framework foundations.
