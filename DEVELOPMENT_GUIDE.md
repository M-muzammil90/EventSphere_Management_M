# EventSphere Management — Developer Guide

## 1. Architecture Overview

EventSphere is a full-stack MERN application separated into:
- **Frontend (`src/`)**: React 19, Vite, TypeScript, Tailwind CSS 4, React Router DOM 7, Axios (`src/lib/api.ts`), Socket.IO Client (`src/lib/socket.ts`), and Vitest + React Testing Library (`src/test/`).
- **Backend (`server/`)**: Node.js, Express 4, MongoDB + Mongoose, JWT HttpOnly Cookie + Double-Submit CSRF Authentication, Socket.IO, PDFKit, and Jest + Supertest (`server/src/tests/`).

## 2. Local Development Setup

### Prerequisites
- Node.js >= 18.x (20 LTS recommended)
- MongoDB 7.x running locally on port `27017` (or Docker)

### Environment Setup
1. Copy root `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Copy `server/.env.example` to `server/.env`:
   ```bash
   cp server/.env.example server/.env
   ```
3. Install dependencies:
   ```bash
   npm install
   npm --prefix server install
   ```
4. Seed initial database (Admin, sample expos, booths, pricing, sessions, attendees):
   ```bash
   npm run seed
   ```
5. Start both frontend & backend concurrently:
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000/api/v1`
   - Health Check: `http://localhost:5000/api/health`

## 3. Security Architecture

- **JWT Authentication**: Issued in `HttpOnly`, `SameSite=lax` cookies (`es_token`) and optionally via `Authorization: Bearer`.
- **Double-Submit CSRF Protection**: `server/src/middleware/csrfMiddleware.js` issues an `es_csrf` cookie on auth and validates `X-CSRF-Token` + `Origin` on mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).
- **Token Revocation**: `POST /api/v1/auth/logout` hashes and stores the JWT in the MongoDB `RevokedToken` collection with a TTL index so logged-out tokens cannot be reused.
- **Role-Based Access Control**: `restrictTo("admin")`, `restrictTo("exhibitor")`, `restrictTo("attendee")` enforced server-side on every route, plus resource ownership checks.

## 4. Testing Commands

- **Frontend (Vitest + React Testing Library)**:
  ```bash
  npm test
  ```
- **Backend (Jest + Supertest + MongoDB)**:
  ```bash
  npm --prefix server test
  ```
- **TypeScript & Production Build**:
  ```bash
  npx tsc --noEmit
  npm run build
  ```

## 5. Docker & Production Deployment

Build and start the full stack (MongoDB, Express Backend, Nginx Frontend):
```bash
JWT_SECRET=your_strong_32_plus_char_secret docker compose up --build -d
```
- Frontend served on `http://localhost:8080`
- Backend API served on `http://localhost:5000`
