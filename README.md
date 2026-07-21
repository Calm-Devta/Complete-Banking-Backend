# Complete Banking Backend Ledger System

A backend banking service built using **Node.js, Express.js, MongoDB, and Redis**. The project implements a **double-entry ledger architecture** where every transaction is recorded as both a debit and credit entry, ensuring consistency, auditability, and accurate balance computation.

---

## Features

- User registration, login, and logout
- JWT authentication with secure cookie-based sessions
- Account creation and balance retrieval
- Secure fund transfers
- Double-entry ledger architecture
- Dynamic balance calculation using MongoDB Aggregation Pipelines
- MongoDB Sessions and Transactions (ACID)
- Idempotent transaction handling
- Transaction history with pagination
- Redis cache-aside caching for balance retrieval
- Email notifications using Gmail OAuth 2.0 and Nodemailer
- JWT token blacklisting with TTL indexes
- MongoDB Atlas integration
- Deployment on Render

---

# Tech Stack

## Backend

- Node.js
- Express.js

## Database

- MongoDB Atlas
- Mongoose
- Redis

## Authentication & Security

- JWT
- bcrypt
- Cookie Parser

## Email

- Nodemailer
- Gmail OAuth 2.0

## Deployment

- Render

## Utilities

- dotenv

---

# Project Structure

```text
src
│
├── config
├── controllers
├── middleware
├── models
├── routes
├── services
│
server.js
```

---

# Ledger Architecture

Instead of storing account balances directly, every transfer generates two immutable ledger entries.

```text
Debit  → Sender Account

Credit → Receiver Account
```

Current balance is computed dynamically as:

```text
Balance = Total Credits − Total Debits
```

This design:

- Preserves complete transaction history
- Ensures auditability
- Prevents balance inconsistencies
- Allows balances to be reconstructed from ledger records at any time

---

# Redis Cache

The application implements the **Cache-Aside Pattern** for account balance retrieval.

```text
Client
   │
   ▼
Redis Cache
   │
Cache Miss
   ▼
MongoDB Aggregation
   │
Update Redis
   ▼
Return Balance
```

Frequently accessed balances are served directly from Redis, reducing average balance retrieval latency by **~69%** while avoiding repeated aggregation queries.

---

# API Endpoints

## Authentication

| Method | Endpoint |
|---------|----------|
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |
| POST | `/api/auth/logout` |

---

## Accounts

| Method | Endpoint |
|---------|----------|
| POST | `/api/account` |
| GET | `/api/account/balance` |

---

## Transactions

| Method | Endpoint |
|---------|----------|
| POST | `/api/transaction` |
| POST | `/api/transaction/system/initial-funds` |
| GET | `/api/transaction/history?page=1&limit=10` |

---

# Transaction Flow

```text
Create Transaction
        │
        ▼
Create Transaction Record (Pending)
        │
        ▼
Debit Sender Ledger
        │
        ▼
Credit Receiver Ledger
        │
        ▼
Update Transaction Status
        │
        ▼
Update Redis Cache
        │
        ▼
Send Transaction Email
```

All operations are executed within a **MongoDB Session**, ensuring **ACID-compliant** transactions. If any step fails, the entire transaction is rolled back automatically.

---

# Email Notifications

The application sends transactional emails using **Nodemailer** with **Gmail OAuth 2.0** authentication.

Notifications are sent for:

- Successful account registration
- Successful fund transfers

---

# Installation

Clone the repository

```bash
git clone https://github.com/Calm-Devta/Complete-Banking-Backend.git
```

Move into the project

```bash
cd Complete-Banking-Backend
```

Install dependencies

```bash
npm install
```

Create a `.env` file in the project root.

```env
PORT=

MONGO_URI=

JWT_SECRET=

EMAIL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=

REDIS_URL=
```

Run the development server

```bash
npm run dev
```

or

```bash
node server.js
```

---

# Live Deployment

```
https://complete-banking-backend.onrender.com
```

---

**Shashank Mishra**

GitHub: https://github.com/Calm-Devta
