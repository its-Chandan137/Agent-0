# Budget Assistant Chat App

A full-stack budget assistant built with:

- Vite + React
- Plain CSS
- Vercel serverless functions
- Groq SDK
- MongoDB Atlas
- Invite-only email auth with Brevo SMTP OTP via Nodemailer

The frontend never talks to Groq, MongoDB, SMTP, or admin APIs directly outside `/api/*`.

## Features

- Streaming budget chat with MongoDB-backed history
- Budget profile and wishlist persistence
- Invite-only access requests
- Email OTP login for approved users
- Device-limited sessions with admin revocation
- Admin approval and blocking workflow

## Stack

- Frontend: Vite + React
- Backend: Vercel serverless functions
- Database: MongoDB Atlas
- LLM: Groq
- Auth OTP: Nodemailer + Brevo SMTP

## Project Structure

```text
.
|-- api
|   |-- admin
|   |-- auth
|   |-- chat.js
|   |-- chats.js
|   |-- profile.js
|   `-- wishlist.js
|-- lib
|   |-- auth.js
|   |-- budgetContext.js
|   |-- http.js
|   `-- mongodb.js
|-- src
|   |-- components
|   |-- lib
|   |-- pages
|   |-- App.jsx
|   `-- main.jsx
|-- .env.example
|-- package.json
|-- vercel.json
`-- vite.config.js
```

## 1. Install Dependencies

```bash
npm install
```

## 2. Create a MongoDB Atlas Free Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create a free account.
3. Create an `M0` free cluster.
4. In `Database Access`, create a database user.
5. In `Network Access`, add your IP.
   For quick testing, `0.0.0.0/0` works, though a tighter rule is safer.
6. Click `Connect` > `Drivers` and copy the connection string.
7. Replace `<password>` with your database user's password.

The app uses a database named `budget_assistant`.

## 3. Create a Groq API Key

1. Open [Groq Console](https://console.groq.com/keys).
2. Create an API key.
3. Copy it for your `.env`.

## 4. Create a Brevo SMTP Sender

1. Create a [Brevo](https://www.brevo.com/) account.
2. Open the SMTP settings for transactional email.
3. Copy:
   - `BREVO_SMTP_HOST`
   - `BREVO_SMTP_PORT`
   - `BREVO_SMTP_USER`
   - `BREVO_SMTP_PASS`
   - `BREVO_FROM_EMAIL`
4. Verify the sender email if Brevo asks for it.

## 5. Create Your `.env` File

Create `.env` in the project root:

```env
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=your_mongodb_atlas_connection_string
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_brevo_smtp_user
BREVO_SMTP_PASS=your_brevo_smtp_password
BREVO_FROM_EMAIL=your_verified_sender_email
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=your_random_jwt_secret
```

Never hardcode secrets in source files.

## 6. Run Locally

```bash
npm run dev
```

This starts:

- Vite on `http://localhost:5173`
- Local Vercel functions on `http://localhost:3000`

Vite proxies `/api/*` to the local Vercel runtime, so auth and chat work together during development.

## 7. Auth Flow

### User flow

1. User opens `/request-access`
2. User submits name and email address
3. Admin reviews pending users in `/admin`
4. Admin approves the user
5. User opens `/login`
6. User requests an OTP
7. Brevo sends a 6-digit code by email
8. User verifies the OTP
9. A session cookie is created for 7 days

### Session rules

- Only approved users can receive OTPs
- Blocked users cannot log in
- Each user is limited to 3 devices
- Admins can revoke any session

## 8. Admin Flow

Open `/admin`.

- Enter the admin password from `ADMIN_PASSWORD`
- `Users` tab shows all users, emails, and device counts
- Approve or block pending users
- `Sessions` tab shows device sessions per user
- Revoke one session or revoke all sessions for a selected user

The admin password is stored in `sessionStorage` only on the client.

## 9. MongoDB Collections

The app uses these collections:

- `users`
- `sessions`
- `otps`
- `profiles`
- `wishlist`
- `chats`

## 10. Deploy to Vercel

### Option A: Vercel dashboard

1. Push the repo to GitHub.
2. Import the project into [Vercel](https://vercel.com/).
3. Add these environment variables in the project settings:
   - `GROQ_API_KEY`
   - `MONGODB_URI`
   - `BREVO_SMTP_HOST`
   - `BREVO_SMTP_PORT`
   - `BREVO_SMTP_USER`
   - `BREVO_SMTP_PASS`
   - `BREVO_FROM_EMAIL`
   - `ADMIN_PASSWORD`
   - `JWT_SECRET`
4. Deploy.

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

Add the same environment variables when prompted.

## Environment Variables

- `GROQ_API_KEY`
- `MONGODB_URI`
- `BREVO_SMTP_HOST`
- `BREVO_SMTP_PORT`
- `BREVO_SMTP_USER`
- `BREVO_SMTP_PASS`
- `BREVO_FROM_EMAIL`
- `ADMIN_PASSWORD`
- `JWT_SECRET`

## Notes

- Existing chat, profile, and wishlist APIs now require a valid session cookie.
- Chat streaming still happens through the serverless `/api/chat` route.
- Budget context is still injected server-side before each Groq request.
- The app uses only services that offer free tiers or trial usage for development:
  - MongoDB Atlas free tier
  - Vercel hobby tier
  - Groq developer access
  - Brevo free SMTP sending
