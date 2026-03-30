# Biopassion HMS — Hospital Management System

A full-stack Level 4 Hospital Management System built with:
- **Frontend**: React 18 + Vite + Tailwind CSS + Material UI
- **Backend**: Node.js + Express + Supabase (PostgreSQL)
- **Database**: Supabase (PostgreSQL with Row Level Security)

---

## Project Structure

```
HMS/
├── src/                        # React frontend (Vite root)
│   ├── pages/
│   │   ├── admin/              # Admin-only: price list, system overview
│   │   ├── auth/               # Login
│   │   ├── billing/            # Billing & payments
│   │   ├── dashboard/          # Main dashboard
│   │   ├── hr/                 # Staff & HR management
│   │   ├── inventory/          # Hospital inventory
│   │   ├── ipd/                # Inpatient: wards, admissions, nursing
│   │   ├── lab/                # Laboratory
│   │   ├── opd/                # OPD: triage, queue, consultation
│   │   ├── pharmacy/           # Pharmacy dispensing
│   │   ├── patients/           # Patient registration & profiles
│   │   └── reports/            # Clinical & financial reports
│   ├── services/               # Supabase service layer (one file per domain)
│   ├── context/                # AuthContext + PermissionsContext
│   └── components/
│       ├── guards/             # RoleGuard — RBAC route protection
│       └── Layout.jsx          # App shell with role-filtered sidebar
│
├── backend/                    # Express API server
│   ├── server.js
│   ├── config/supabase.js      # Service-role Supabase client
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   └── rbac.js             # Role-based access control
│   ├── routes/                 # One route file per module
│   ├── controllers/            # Business logic per module
│   └── scripts/
│       └── create_user.js      # Create initial admin user
│
└── database/
    └── schema.sql              # Full PostgreSQL schema
```

---

## Getting Started

### 1. Install frontend dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env     # (create .env if not exists)
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### 3. Run the database schema
Run `database/schema.sql` in your Supabase SQL Editor.

### 4. Create admin user
```bash
node backend/scripts/create_user.js
```

### 5. Start the frontend
```bash
npm run dev
```

### 6. Start the backend (optional — frontend uses direct Supabase for now)
```bash
cd backend && npm install && npm run dev
```

---

## Default Login
- **Email**: `admin@hospital.com`
- **Password**: `password123`

---

## Role-Based Access Control

| Role        | Sections Accessible                                      |
|-------------|----------------------------------------------------------|
| `admin`     | Everything + Admin Dashboard + Price List                |
| `reception` | Dashboard, Patient Center, OPD Triage & Queue           |
| `doctor`    | Dashboard, Patients, OPD, IPD, Lab                      |
| `nurse`     | Dashboard, OPD Triage, IPD (Wards, Nursing)             |
| `lab_staff` | Dashboard, Laboratory                                    |
| `pharmacy`  | Dashboard, Pharmacy                                      |
| `billing`   | Dashboard, Billing, Patients                             |
| `hr`        | Dashboard, HR                                            |

---

## Modules

| Module        | Status | Description                              |
|---------------|--------|------------------------------------------|
| Reception     | ✅ Live | Patient registration, search, profiles   |
| OPD           | ✅ Live | Triage, Doctor Queue, Consultation/EMR  |
| Inpatient     | ✅ Live | Ward Map, Admissions, Nursing Rounds     |
| Laboratory    | ✅ Live | Lab orders, results, status tracking     |
| Pharmacy      | ✅ Live | Prescription dispensing, drug stock      |
| Inventory     | ✅ Live | Receive/issue stock, transactions        |
| Billing       | ✅ Live | Invoicing, payments (Cash/MPesa/Card)    |
| HR            | ✅ Live | Staff directory, departments             |
| Reports       | ✅ Live | Clinical & financial metrics             |
| Admin         | ✅ Live | System overview, price list management   |
