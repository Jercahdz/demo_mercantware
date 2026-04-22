# Mercantware

A mobile business management application built with React Native and Expo, designed to help small businesses manage clients, products, invoices, and basic sales statistics.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment & Configuration](#environment--configuration)
- [Available Scripts](#available-scripts)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Mercantware is a cross-platform mobile app (Android & iOS) that provides small business owners with tools to track customers, manage product inventory, generate invoices in PDF format, and view sales analytics. All data is stored locally on the device using SQLite via `expo-sqlite`.

---

## Features

- **Authentication** — Register, login, forgot password, and password reset via email link
- **Client Management** — Create, edit, delete, and search clients; view their last 3 invoices inline
- **Product Management** — CRUD operations on products with categories, pricing, and stock tracking; low-stock and out-of-stock alerts
- **Invoice Management** — Multi-product invoices with cart system, payment type (cash/credit), status tracking, and PDF export with company branding
- **Statistics** — Sales breakdown by payment type, invoice status summary, monthly revenue chart, top products, and top clients
- **Settings** — User profile display, terms and conditions, and logout

---

## Tech Stack

| Layer           | Technology                                       |
| --------------- | ------------------------------------------------ |
| Framework       | [Expo](https://expo.dev) ~54.0                   |
| Language        | TypeScript                                       |
| UI              | React Native 0.81                                |
| Navigation      | React Navigation v7 (bottom tabs + native stack) |
| Local Database  | expo-sqlite 16                                   |
| Session Storage | AsyncStorage                                     |
| PDF Export      | expo-print + expo-sharing                        |
| Email           | EmailJS (password recovery)                      |
| Icons           | @expo/vector-icons (Feather)                     |
| Charts          | react-native-gifted-charts                       |
| Auth Hashing    | expo-crypto (SHA-256)                            |

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- [Expo Go](https://expo.dev/go) (for running on a physical device) **or** an Android/iOS simulator

---

## Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/your-org/mercantware.git
cd mercantware
```

**2. Install dependencies**

```bash
npm install
```

**3. Start the development server**

```bash
npx expo start
```

Then press:

- `a` to open on an Android emulator
- `i` to open on an iOS simulator
- `s` to switch to Expo Go

---

## Project Structure

```
mercantware/
├── App.tsx                        # Root component, navigation setup, session management
├── index.ts                       # App entry point
├── app.json                       # Expo configuration
├── assets/
│   └── images/
├── components/
│   └── ui/                        # Shared UI components (icons, collapsible, etc.)
├── constants/
│   └── theme.ts                   # Colors and fonts
├── hooks/                         # Custom React hooks
├── src/
│   ├── components/
│   │   └── Toast.tsx              # Custom animated toast notifications
│   ├── database/
│   │   ├── database.ts            # SQLite connection singleton
│   │   └── initDatabase.ts        # Table creation migrations
│   ├── screens/
│   │   ├── HomeScreen.tsx         # Client management
│   │   ├── InvoicesScreen.tsx     # Invoice management & PDF export
│   │   ├── ProductScreen.tsx      # Product & inventory management
│   │   ├── StatsScreen.tsx        # Sales statistics (premium preview)
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   └── ResetPasswordScreen.tsx
│   │   └── settings/
│   │       └── SettingsScreen.tsx
│   ├── services/
│   │   ├── clienteService.ts      # Client CRUD operations
│   │   ├── productService.ts      # Product CRUD + category helpers
│   │   ├── invoicesService.ts     # Invoice creation, retrieval, stats
│   │   ├── invoiceExport.ts       # HTML/PDF generation + config persistence
│   │   ├── usuarioService.ts      # User registration, login, password reset
│   │   └── emailService.ts        # EmailJS integration
│   └── utils/
│       └── session.ts             # AsyncStorage session helpers
└── scripts/
    └── reset-project.js
```

---

## Environment & Configuration

**EmailJS** is used for the password recovery flow. Update the following constants in `src/services/emailService.ts` with your own EmailJS credentials:

```typescript
const SERVICE_ID = "your_service_id";
const TEMPLATE_ID = "your_template_id";
const PUBLIC_KEY = "your_public_key";
```

The email template must expose the variables `to_name`, `to_email`, and `reset_link`.

No `.env` file is required for local development beyond these service constants.

---

## Available Scripts

| Command                         | Description                  |
| ------------------------------- | ---------------------------- |
| `npm start`                     | Start the Expo dev server    |
| `npm run android`               | Start and open on Android    |
| `npm run ios`                   | Start and open on iOS        |
| `npm run web`                   | Start and open in browser    |
| `npm run lint`                  | Run ESLint via Expo          |
| `node scripts/reset-project.js` | Reset project to blank state |

---

## Database Schema

All tables are created automatically on first launch by `src/database/initDatabase.ts`.

```
usuarios         — app users (id, name, email, hashed password)
recuperaciones   — password reset tokens with expiry timestamps
clientes         — customers linked to a user
productos        — products with category, price, and stock quantity
facturas         — invoice header (date, total, type, status, client, user)
facturas_detalle — invoice line items (product, quantity, unit price, subtotal)
```

Every record in `clientes`, `productos`, and `facturas` is scoped to its owner via `IdUsuario`, so multiple accounts can coexist on the same device.

---

## Authentication

- Passwords are hashed with **SHA-256** (`expo-crypto`) before storage.
- Sessions are persisted in `AsyncStorage` as JSON.
- Password reset uses a time-limited token (15 minutes) delivered via an EmailJS-powered email containing a deep link: `mercantware://reset-password?token=<token>`.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a pull request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## License

This project is private. All rights reserved.
