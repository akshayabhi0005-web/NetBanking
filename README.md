# 🏦 SecureBank — NetBanking

### Secure Banking. Simplified.

A full-stack simulated Indian Internet Banking application built for **educational, development, and portfolio demonstration purposes**.

> ⚠️ **Disclaimer:** SecureBank is a simulated banking application. All money and transactions are virtual and maintained inside an isolated application database. This project does **not** connect to real banks, payment gateways, card networks, RBI, NPCI, UPI, NEFT, RTGS, or IMPS systems.

---

## 🌐 Live Demo

🚀 **Live Application:**
https://netbanking-ib5z.onrender.com

---

## 📌 About The Project

**SecureBank** is a modern full-stack Internet Banking web application inspired by traditional Indian banking portals.

The project provides a realistic banking experience where users can register accounts, complete onboarding, manage their profiles, transfer virtual funds, manage beneficiaries, use virtual cards, pay simulated bills, create fixed deposits, and receive transaction/security notifications.

The application is designed around a **multi-user banking model** rather than a single-user demonstration.

### What makes SecureBank different?

* 👤 Real user registration
* 🏦 Automatic simulated bank account generation
* 🔐 Secure authentication and authorization
* 💰 Virtual INR balance management
* 🔄 Multi-user fund transfers
* 👥 Beneficiary management
* 💸 Pay & Request functionality
* 💳 Virtual debit card management
* 🧾 Simulated bill payments
* 📈 Fixed deposit management
* 🔔 Transaction and security notifications
* 📊 Transaction history and statements
* 🛡️ Database-level transaction handling
* 📝 Audit and login history

---

# ✨ Key Features

## 🔐 Authentication & Onboarding

* Customer registration
* Username-based login
* Customer ID generation
* Secure password hashing
* Transaction PIN setup
* Virtual debit card activation
* ATM PIN management
* Brute-force login protection
* JWT-based authentication

---

## 🏦 Account Management

Each registered customer receives simulated banking credentials including:

* Customer ID
* Savings Account Number
* IFSC Code
* Virtual Debit Card

Users can view:

* Account summary
* Available balance
* Account details
* KYC status
* Nomination information
* MICR and IFSC details
* Transaction history
* Account statements

---

## 💸 Pay & Request

Users can interact with other registered SecureBank users through their public `@username`.

### Send Money

Users can:

* Search registered users
* Select a recipient
* Enter the transfer amount
* Authenticate using Transaction PIN
* Complete a virtual transfer

### Request Money

Users can:

* Request money from another user
* View pending requests
* Approve incoming requests
* Pay money requests
* Manage outgoing requests

---

## 🔄 Fund Transfers

SecureBank supports simulated:

### Direct Transfer

Transfer virtual funds using:

* Account Number
* IFSC Code
* Transaction PIN

### Own Account Transfer

Move funds between supported self-owned accounts.

### Beneficiary Management

Users can:

* Add beneficiaries
* View beneficiaries
* Manage registered payees

---

## 💳 Virtual Debit Card

The application includes a simulated virtual debit card with:

* Card number
* Card status
* Spending limit controls
* Domestic transaction switch
* International transaction switch
* Temporary block/unblock
* PIN management

> This is a simulated card and does not connect to any real card network.

---

## 🧾 Utility Bill Payments

SecureBank provides simulated bill payments for:

* ⚡ Electricity
* 💧 Water
* 🔥 Gas
* 📱 Mobile
* 📺 DTH
* 🏛️ Municipal Tax

Users can view payment history and generated reference IDs.

---

## 📈 Fixed Deposits

Users can:

* Calculate potential FD returns
* Select deposit amounts
* Open simulated fixed deposits
* View deposit information
* Calculate interest using the application's configured compounding logic

---

## 🏦 Banking Services

Additional banking services include:

* Cheque book requests
* Stop cheque instructions
* TDS certificates
* Interest certificates

---

## 🔔 Notifications

The notification system provides simulated:

* Transaction alerts
* Security alerts
* Payment notifications
* Banking activity notifications

---

## 👤 Profile & Security

Users can manage:

* Contact information
* Password
* Transaction PIN
* Security settings
* Login history

The application also maintains simulated audit information such as:

* IP address
* Login timestamp
* Device information

---

# 🏗️ System Architecture

SecureBank follows a full-stack architecture:

```text
┌──────────────────────────────┐
│          React UI            │
│     React + TypeScript       │
│            Vite              │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────┐
│       Express Backend        │
│     Node.js + TypeScript     │
│                              │
│ Authentication              │
│ Account Management           │
│ Transfers                    │
│ Payments                     │
│ Cards                        │
│ Notifications               │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│        SQLite Database       │
│                              │
│ Users                        │
│ Accounts                     │
│ Transactions                 │
│ Cards                        │
│ Beneficiaries                │
│ Requests                     │
│ Notifications                │
└──────────────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* **React 19**
* **TypeScript**
* **Vite**
* **React Router**
* **Lucide React**
* **Vanilla CSS**

## Backend

* **Node.js**
* **Express.js**
* **TypeScript**
* **JWT**
* **bcryptjs**
* **Zod**

## Database

* **SQLite**
* `node:sqlite`
* WAL mode
* Foreign-key enforcement
* Database transactions

## Development & Deployment

* Git
* GitHub
* npm
* Render / Vercel

---

# 📂 Project Structure

```text
NetBanking/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── db.ts
│   │   ├── env.ts
│   │   └── server.ts
│   │
│   └── package.json
│
├── render.yaml
├── package.json
├── README.md
└── .gitignore
```

---

# 📋 Main Application Modules

| Module            | Description                                 |
| ----------------- | ------------------------------------------- |
| 🔐 Authentication | Registration, login and authorization       |
| 👤 Onboarding     | Transaction PIN and virtual card activation |
| 🏦 Accounts       | Account summary and account details         |
| 💰 Transactions   | Searchable transaction ledger               |
| 📄 Statements     | Statement generation and CSV export         |
| 💸 Pay & Request  | Peer-to-peer virtual money transfers        |
| 🔄 Transfers      | Direct and own-account transfers            |
| 👥 Beneficiaries  | Registered payee management                 |
| 💳 Cards          | Virtual debit card controls                 |
| 🧾 Bills          | Simulated utility bill payments             |
| 📈 Deposits       | Fixed deposit calculation and management    |
| 🏦 Services       | Cheque and certificate services             |
| 🔔 Notifications  | Transaction and security alerts             |
| 👤 Profile        | Customer information management             |
| 🛡️ Security      | Password, PIN and login history             |
| ❓ Help            | FAQs and security information               |
| ⚖️ Legal          | Terms, privacy and disclaimer               |

---

# 🗺️ Application Routes

### Authentication

```text
/register
/login
/onboarding
```

### Dashboard & Accounts

```text
/
/accounts/summary
/accounts/details
/accounts/transactions
/accounts/statement
```

### Pay & Request

```text
/pay-request
/pay-request/send
/pay-request/request
/pay-request/pending
```

### Transfers

```text
/transfer/direct
/transfer/own
/transfer/beneficiaries
```

### Bills & Cards

```text
/bills
/bills/history
/cards
```

### Investments & Services

```text
/invest/deposits
/services
```

### Profile & Security

```text
/profile
/profile/security
/profile/security/login-history
/notifications
```

### Help & Legal

```text
/help
/help/security
/legal/terms
/legal/privacy
/legal/disclaimer
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* **Node.js 20+**
* **npm 10+**
* Git

Node.js 24 is also supported by the project configuration.

---

## 1. Clone the Repository

```bash
git clone https://github.com/akshayabhi0005-web/NetBanking.git
```

Move into the project:

```bash
cd NetBanking
```

---

## 2. Install Dependencies

Install dependencies for the root project, server, and client:

```bash
npm run install:all
```

---

## 3. Configure Environment Variables

Create the appropriate environment configuration based on the provided environment example.

Typical configuration includes:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=24h
DB_PATH=./securebank.sqlite
```

> Never commit real secrets, passwords, API keys, or production credentials to GitHub.

---

## 4. Start Development Mode

Run:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

The backend runs separately according to the project's development configuration.

---

# 🏗️ Production Build

Install all dependencies:

```bash
npm run install:all
```

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

The production server serves the compiled frontend and backend application.

---

# 🧪 Testing

SecureBank includes an automated multi-user integration test suite.

Run:

```bash
node server/src/test_suite.js
```

The test suite verifies important banking workflows including:

1. User registration
2. Customer/account generation
3. User onboarding
4. Transaction PIN setup
5. Virtual debit card activation
6. Multi-user interaction
7. Privacy-safe user search
8. Simulated fund deposits
9. Atomic fund transfers
10. Money requests
11. Request payments
12. Unauthorized access prevention
13. Insufficient balance handling
14. Fixed deposits
15. Utility bill payments
16. Re-login and session history

---

# 🔒 Security

Security is an important part of the project architecture.

### Password & PIN Protection

Passwords, transaction PINs, and card PINs are hashed before storage using `bcryptjs`.

### JWT Authentication

Protected API routes use JWT-based authorization.

### Authorization

Users are restricted from accessing resources that belong to other users.

### Input Validation

Server-side validation is implemented using `zod`.

### Rate Limiting

Rate limiting is used to reduce abuse of sensitive endpoints.

### Database Transactions

Financial operations use database transactions to ensure that related balance changes are committed together or rolled back when an operation fails.

### Audit Logging

Important security and account events are recorded through structured audit information.

---

# 💰 Transaction Safety

The application treats financial operations as database transactions.

Conceptually:

```text
BEGIN TRANSACTION
        │
        ▼
Validate Request
        │
        ▼
Check Authorization
        │
        ▼
Check Balance
        │
        ▼
Update Sender
        │
        ▼
Update Receiver
        │
        ▼
Create Transaction Record
        │
        ▼
      COMMIT
```

If an operation fails:

```text
Error
  │
  ▼
ROLLBACK
  │
  ▼
No Partial Transaction
```

This prevents inconsistent balance updates within the application's simulated banking environment.

---

# 🎨 User Interface

The interface is intentionally inspired by traditional Indian Internet Banking portals rather than modern fintech dashboards.

The design includes:

* Banking-style navigation
* Orange banking theme
* Breadcrumb navigation
* Compact data tables
* Transaction-focused layouts
* Security advisory panels
* Notice sections
* Responsive design
* Desktop and mobile-friendly layouts

---

# 🌍 Deployment

The project includes configuration for deployment as a full-stack Node.js application.

## Render

The repository includes:

```text
render.yaml
```

The intended production build configuration uses:

```bash
npm run install:all && npm run build
```

and starts the application using:

```bash
npm start
```

### Render Deployment

1. Open your Render dashboard.
2. Connect the GitHub repository.
3. Select the `main` branch.
4. Use the existing `render.yaml`.
5. Configure required environment variables.
6. Deploy the service.
7. Monitor the build logs.
8. Open the generated production URL.

### Important

Production secrets must be configured through Render environment variables and should never be committed to GitHub.

---

# 📸 Screenshots

Add application screenshots here after deployment.

Example:

```text
docs/
└── screenshots/
    ├── login.png
    ├── dashboard.png
    ├── accounts.png
    ├── transfers.png
    └── cards.png
```

Then display them in the README:

```markdown
![Login](docs/screenshots/login.png)

![Dashboard](docs/screenshots/dashboard.png)

![Accounts](docs/screenshots/accounts.png)
```

---

# 🎯 Project Objectives

The main objectives of SecureBank are to demonstrate:

* Full-stack web application development
* REST API development
* React application architecture
* TypeScript development
* Authentication and authorization
* Secure password handling
* Database design
* Transaction processing
* Multi-user application design
* API validation
* Financial workflow simulation
* Responsive UI development
* Automated integration testing
* Production deployment

---

# 🔮 Future Enhancements

Potential future improvements include:

* 📱 Progressive Web App support
* 📧 Email notifications
* 📲 SMS notification simulation
* 📊 Advanced financial analytics
* 📈 Interactive account charts
* 🧑‍💼 Admin dashboard
* 🔍 Advanced transaction search
* 📑 PDF statement generation
* 🌐 Multi-language support
* ☁️ Production-grade external database
* 🔐 Two-factor authentication
* 🧩 More banking services

---

# ⚠️ Important Disclaimer

SecureBank is **not a real banking application**.

It is created for:

* Educational purposes
* Software development practice
* Portfolio demonstration
* Full-stack application experimentation

It does not:

* Connect to real bank accounts
* Process real money
* Process real UPI payments
* Connect to NPCI
* Connect to RBI
* Connect to NEFT
* Connect to RTGS
* Connect to IMPS
* Connect to real debit/credit card networks
* Connect to real payment gateways

All financial values displayed by the application are **simulated virtual INR values**.

---

# 📄 License

This project is created for educational and demonstration purposes.

All rights reserved.

---

# 👨‍💻 Author

**Akshay N Abhi**

GitHub:

https://github.com/akshayabhi0005-web

---

# ⭐ Support

If you find this project useful for learning or portfolio development, consider giving the repository a ⭐ on GitHub.

---

## 🔗 Project Links

| Resource             | Link                                             |
| -------------------- | ------------------------------------------------ |
| 📂 GitHub Repository | https://github.com/akshayabhi0005-web/NetBanking |
| 🌐 Live Demo         | **Add deployed URL**                             |
| 🚀 Deployment        | Render / Vercel                                  |
| 📖 Documentation     | This README                                      |

---

### 🏦 SecureBank

**Secure Banking. Simplified.**

> A simulated banking experience built to demonstrate modern full-stack development, security practices, database transactions, and realistic Internet Banking workflows.
