<div align="center">

# 🏥 AuraHealth

**A full-stack telemedicine platform built with a microservice architecture**

[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![Agora](https://img.shields.io/badge/Video-Agora-099DFD?logo=agora&logoColor=white)](https://www.agora.io/)

*Patients · Doctors · Admins — all in one platform*

</div>

---

## ✨ Overview

AuraHealth connects patients with verified doctors through a modern web interface. Patients can discover specialists, book appointments, pay online, attend video consultations, and manage their medical history — all without leaving the browser. Doctors manage their availability, conduct telemedicine sessions, and issue digital prescriptions. Admins oversee the entire platform from a dedicated dashboard.

---

## 🏗️ Architecture

```
                        ┌─────────────┐
                        │   Frontend  │  React + Vite (Nginx)
                        │  :5173      │
                        └──────┬──────┘
                               │ HTTP
                        ┌──────▼──────┐
                        │ API Gateway │  Express  :5000
                        └──────┬──────┘
          ┌──────────┬─────────┼──────────┬──────────┬──────────┐
          │          │         │          │          │          │
    ┌─────▼──┐ ┌─────▼──┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐
    │  Auth  │ │ Doctor │ │Patient │ │ Appt.  │ │Payment │ │Telemed.│
    │ :5001  │ │ :5002  │ │ :5003  │ │ :5004  │ │ :5005  │ │ :5007  │
    └─────┬──┘ └─────┬──┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
          │          │         │          │          │          │
    ┌─────▼──┐ ┌─────▼──┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐
    │auth-db │ │doc-db  │ │pat-db  │ │appt-db │ │pay-db  │ │tele-db │
    └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘

                    Notification Service  :5006
                    (SMS · Email via 3rd-party)
```

Each service owns its own **PostgreSQL** database — fully isolated, independently deployable.

---

## 🚀 Services

| Service | Port | Responsibilities |
|---|---|---|
| **api-gateway** | 5000 | Request routing, auth header forwarding, multipart streaming |
| **auth-service** | 5001 | JWT auth, user registration/login, role management (Patient · Doctor · Admin) |
| **doctor-service** | 5002 | Doctor profiles, specialty, availability slots, verification, ratings |
| **patient-service** | 5003 | Patient profiles, medical reports, prescriptions (doctor-issued + patient-uploaded) |
| **appointment-service** | 5004 | Booking, status tracking, doctor confirmation, cancellation |
| **payment-service** | 5005 | Stripe checkout sessions, webhook handling, payment status |
| **notification-service** | 5006 | SMS & email notifications on booking / payment events |
| **telemedicine-service** | 5007 | Agora token generation, session scheduling, video room management |
| **frontend** | 5173 | React SPA served via Nginx |

---

## 👤 Roles & Features

### 🧑‍⚕️ Patient
- Register, create and manage profile
- Browse doctors by specialty — dynamic filter matches real data
- Rate doctors (1–5 stars, logged-in only)
- Book appointments and select from doctor's weekly availability
- Pay consultation fees via **Stripe** sandbox
- Join **Agora** video consultation after payment is confirmed
- Upload medical reports (image / PDF)
- View doctor-issued prescriptions and uploaded prescription documents
- Track appointment history and payment status

### 🩺 Doctor
- Manage full profile (specialty, bio, fees, languages, hospital)
- Set weekly availability slots (add / edit / delete)
- Accept or reject appointment requests
- Conduct telemedicine sessions via **Agora RTC**
- Add digital prescriptions per appointment (diagnosis + medications + notes)
- View patient medical records, reports, and prescriptions inline

### 🛡️ Admin
- Overview dashboard — total users, active doctors, verified doctors
- Two-step doctor verification: *Account Active* → *Details Verified*
- Manage all users (activate / deactivate)
- Monitor notification logs
- Oversee payment transactions

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js 20, Express |
| Database | PostgreSQL 16 (one DB per service) |
| Auth | JWT (RS256), bcrypt |
| Payments | Stripe (sandbox) |
| Video | Agora RTC SDK NG |
| Notifications | SMS + Email via third-party service |
| Infrastructure | Docker, Docker Compose, Nginx |

---

## ⚡ Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A `.env` file configured for each service (see below)

### 1. Clone the repository
```bash
git clone https://github.com/your-org/aurahealth.git
cd aurahealth
```

### 2. Configure environment variables

Each service has its own `.env`. Minimum required values:

**`auth-service/.env`**
```env
POSTGRES_DB=auth_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
JWT_SECRET=your_jwt_secret
```

**`payment-service/.env`**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
INTERNAL_SERVICE_TOKEN=your_internal_token
```

**`telemedicine-service/.env`**
```env
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
```

**`frontend/.env`** (or set in `docker-compose.yml`)
```env
VITE_AGORA_APP_ID=your_agora_app_id
```

### 3. Start the entire stack
```bash
docker compose up --build
```

The first run initialises all databases automatically via the `sql/init.sql` files in each service.

### 4. Open the app
```
http://localhost:5173
```

### Default seed accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@aurahealth.lk | 123456 |
| Doctor | doctor@aurahealth.lk | 123456 |
| Patient | patient@aurahealth.lk | 123456 |

---

## 📁 Project Structure

```
aurahealth/
├── api-gateway/              # Central request router
├── auth-service/             # Auth + user management
│   └── sql/init.sql
├── doctor-service/           # Doctor profiles & availability
│   └── sql/init.sql
├── patient-service/          # Patient data, reports, prescriptions
│   └── sql/init.sql
├── appointment-service/      # Booking & status management
│   └── sql/init.sql
├── payment-service/          # Stripe integration
├── notification-service/     # SMS & email dispatch
├── telemedicine-service/     # Agora session management
│   └── src/
├── frontend/                 # React + Vite SPA
│   └── src/
│       ├── api/              # Axios API clients per service
│       ├── context/          # AuthContext
│       ├── pages/
│       │   ├── admin/        # Admin dashboard pages
│       │   ├── doctor/       # Doctor dashboard pages
│       │   ├── patient/      # Patient dashboard pages
│       │   └── shared/       # TelemedicineRoom, etc.
│       └── components/       # Shared UI components
└── docker-compose.yml
```

---

## 🔑 Key Design Decisions

- **One database per service** — no shared database, services communicate via HTTP through the API Gateway
- **Internal service token** — backend-to-backend calls (e.g. payment → appointment confirmation) use a shared `INTERNAL_SERVICE_TOKEN` header, bypassing user JWT checks
- **Agora token endpoint** — a dedicated `/telemedicine/schedules/token` endpoint generates Agora tokens on demand for appointment-based calls (no pre-created schedule required)
- **Multipart streaming** — the API Gateway detects `multipart/form-data` and pipes the raw stream directly to the target service, preserving file uploads

---

## 📄 License

This project was developed as a campus group project. All rights reserved by the respective contributors.

---

<div align="center">
  <sub>Built with ❤️ as a campus microservice project</sub>
</div>
