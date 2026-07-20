# Complete Banking Backend Ledger System

A backend service for a banking application built using Node.js, Express.js, and MongoDB. The project implements a double-entry ledger system where every transaction is recorded as both a debit and a credit entry, ensuring consistency and accurate balance calculation.

## Features

- User registration and JWT authentication
- Cookie-based authentication
- Account creation and management
- Secure fund transfers
- Double-entry ledger architecture
- Dynamic balance calculation using MongoDB Aggregation
- MongoDB transactions with sessions (ACID)
- Idempotent transaction handling
- Email notifications using Gmail API (OAuth 2.0) and Nodemailer
- JWT blacklisting for secure logout
- MongoDB Atlas integration
- Deployment on Render

---

## Tech Stack

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

### Authentication & Security
- JWT
- bcrypt
- Cookie Parser

### Email
- Nodemailer
- Gmail API (OAuth 2.0)

### Deployment
- Render

### Utilities
- dotenv

---

## Project Structure

```
src
│
├── config
├── controllers
├── middleware
├── models
├── routes
├── services

server.js
```

---

## Ledger Architecture

Instead of storing an account balance directly, every transfer generates two ledger entries.

```
Debit  → Sender Account
Credit → Receiver Account
```

The current balance is calculated using:

```
Balance = Total Credits − Total Debits
```

This approach ensures an immutable transaction history and makes it possible to reconstruct balances from ledger records.

---

## API Endpoints

### Authentication

| Method | Endpoint |
|---------|----------|
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |
| POST | `/api/auth/logout` |

### Accounts

| Method | Endpoint |
|---------|----------|
| POST | `/api/account/` |
| GET | `/api/account/balance` |

### Transactions

| Method | Endpoint |
|---------|----------|
| POST | `/api/transaction` |
| POST | `/api/account/initial-fund-transfer` |

---

## Transaction Flow

```
Create Transaction
        │
        ▼
Debit Sender Ledger
        │
        ▼
Credit Receiver Ledger
        │
        ▼
Mark Transaction as Completed
        │
        ▼
Send Transaction Email
```
## Email Notifications

The application sends transactional emails using the Gmail API with OAuth 2.0 authentication through Nodemailer.

Notifications are sent for:

- Successful account registration
- Successful fund transfers

---

All database operations are executed within a MongoDB session to maintain ACID properties.

---

## Installation

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

Start the server

```bash
npm run dev
```

or

```bash
node server.js
```

---

## Live Deployment

```
https://complete-banking-backend.onrender.com
```

---

## Future Improvements

- Refresh token authentication
- Password reset via email
- Transaction history with pagination
- Account statements
- Swagger/OpenAPI documentation
- Unit and integration tests
- Docker support
- CI/CD pipeline

---

## Author

Shashank Mishra

GitHub: https://github.com/Calm-Devta
