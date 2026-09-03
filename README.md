# SecureBank - Simulated Indian Internet Banking Portal

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/akshayabhi0005-web/NetBanking)

> **Tagline**: *"Secure Banking. Simplified."*
> **Disclaimer**: This is a simulated banking application created for educational and portfolio demonstration purposes. All money is virtual INR maintained in an internal isolated database. It does not connect to real banks, payment gateways, card networks, RBI, NPCI, UPI, NEFT, RTGS, or IMPS networks.

---

## 🏛️ Project Overview

**SecureBank** is a production-quality, full-stack Internet Banking web application inspired by traditional Indian net-banking portals (such as Bank of Baroda, SBI, and HDFC).

Unlike modern fintech dashboards or single-user toys:
- **Zero Dummy Data**: The application starts with an empty customer database. Real users register themselves.
- **Genuine Account Generation**: Each registered customer receives a 6-digit Customer ID (`SBK...`), a 12-digit Savings Account Number (`1089...`), an IFSC code (`SECB0001089`), and a simulated Virtual Debit Card (`4829...`).
- **Real Multi-User Interaction**: Registered users can discover each other via **Pay & Request** using public `@username` handles to send and request virtual money.
- **ACID Transaction Engine**: All balance modifications (peer transfers, request payments, bill settlements, fixed deposits) execute within strict database-level transactions (`BEGIN IMMEDIATE TRANSACTION` / `COMMIT` / `ROLLBACK`). Balances can never become negative or duplicated.
- **Traditional Corporate Banking Aesthetic**: Top orange navigation bar, cascading hover dropdowns, breadcrumbs, compact banking tables, notice tickers, security advisory panels, subtle bank building watermark, and **NO left sidebar**.

---

## 🏗️ Architecture & Technology Stack

### Backend
- **Runtime**: Node.js v24 (ES Modules)
- **Framework**: Express.js
- **Database**: Built-in `node:sqlite` (`DatabaseSync` in WAL mode with foreign key enforcement and immediate transactions)
- **Authentication**: Cryptographic password and PIN hashing via `bcryptjs`, session authorization via stateless `jsonwebtoken` (JWT)
- **Validation & Safety**: Server-side request validation with `zod`, rate limiting, and structured audit logs

### Frontend
- **Framework**: React 19 + TypeScript (built with Vite)
- **Routing**: React Router v7
- **Design System**: Vanilla CSS tailored to traditional Indian Internet Banking aesthetics (Warm Banking Orange `#D84315` / `#E65100`, crisp borders, tabular figures, and responsive layout)
- **Icons**: Lucide React

---

## 📋 Core Modules & Pages

1. **Authentication & Onboarding**:
   - `/register`: 2-step account opening with personal information and credential creation
   - `/login`: Customer ID or Username login with brute-force locking protection
   - `/onboarding`: 4-step wizard to set 4-6 digit Transaction PIN and activate Virtual Debit Card with 4-digit ATM PIN

2. **Dashboard & Accounts**:
   - `/`: "What would you like to do today?" command center with quick actions, recent activity, pending requests, and notices
   - `/accounts/summary`: Total savings balance, active deposits, and net worth
   - `/accounts/details`: Official branch parameters, KYC standing, nomination, MICR & IFSC
   - `/accounts/transactions`: Searchable, filterable, and paginated ledger table with printable receipt popups
   - `/accounts/statement`: Periodic statement generator with print layout and CSV export

3. **Pay & Request (Peer-to-Peer Intra-Bank)**:
   - `/pay-request`: Hub overview
   - `/pay-request/send`: Search registered customers by `@username` and transfer funds with Transaction PIN
   - `/pay-request/request`: Create money requests to other registered customers
   - `/pay-request/pending`: Approve/pay inbound requests or manage outbound requests

4. **Funds Transfer**:
   - `/transfer/direct`: Transfer within SecureBank using 12-digit Account Number and IFSC
   - `/transfer/own`: Transfer between self-owned accounts
   - `/transfer/beneficiaries`: Manage registered payees

5. **Utility Bills & Cards**:
   - `/bills`: Simulated Bharat Bill Payment (Electricity, Water, Gas, Mobile, DTH, Municipal Tax)
   - `/bills/history`: Payment logs and reference IDs
   - `/cards`: Virtual Debit Card with limit slider, domestic/international switches, temporary block/unblock, and PIN change

6. **Investments & Services**:
   - `/invest/deposits`: Fixed Deposit calculator and account opening with automatic quarterly compounding interest
   - `/services`: Cheque Book requests, Stop Cheque instructions, and TDS/Interest certificates

7. **Security, Profile & Legal**:
   - `/profile`: Contact information updates
   - `/profile/security`: Password and Transaction PIN change
   - `/profile/security/login-history`: Audit logs of IP, timestamp, and device
   - `/notifications`: Real-time transaction and security alerts
   - `/help`: FAQs and toll-free helpline
   - `/help/security`: Security golden rules and fraud awareness
   - `/legal/terms`, `/legal/privacy`, `/legal/disclaimer`: Official simulation terms

---

## 🚀 Running Locally

### Prerequisites
- Node.js v20+ or v24+
- npm v10+

### Installation & Starting
```bash
# Clone or open the project folder
cd netbanking

# Install all dependencies (root, server, client)
npm run install:all

# Start both backend (port 5000) and frontend (port 5173) concurrently
npm run dev
```

Visit **`http://localhost:5173`** in your browser to start using SecureBank.

---

## 🧪 Running Automated Acceptance Tests

SecureBank includes an end-to-end multi-user integration test suite verifying all 12 key scenarios:

```bash
node server/src/test_suite.js
```

**Test Coverage**:
1. User A self-registration & credential generation (`SBK...` Customer ID + 12-digit Account No.)
2. User A 4-step onboarding (Transaction PIN + Debit Card)
3. User B registration & onboarding
4. Privacy-safe user search (zero exposure of phone/account numbers/emails)
5. Simulated test fund deposits
6. Atomic transfer from User A to User B (sender -₹1,000, recipient +₹1,000, balance verification)
7. User B creating a ₹500 money request to User A
8. User A paying the request (status turns `PAID`, balances updated to ₹13,500 and ₹1,500)
9. Unauthorized access prevention (User A forbidden from accessing User B data)
10. Overdraft & insufficient balance rejection
11. Fixed Deposit opening with automated interest calculation
12. Utility bill payment execution
13. Re-login and session history update

---

## 🔒 Security Best Practices

- **Bcrypt Hashing**: All login passwords, transaction PINs, and card PINs are hashed before storage.
- **Zero Plaintext Storage**: Plaintext secrets are never stored or logged.
- **Stateless Authorization**: JWT verification on every protected route.
- **Resource Ownership Authorization**: Users can only access accounts and data belonging to their verified identity.
- **Database Transactions**: All financial movements utilize `BEGIN IMMEDIATE TRANSACTION` with strict rollbacks upon any error.

---

## 📄 License
Created for educational and demonstration purposes. All rights reserved.
