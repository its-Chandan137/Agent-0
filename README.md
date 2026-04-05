# Budget Assistant Chat App

A full-stack budget assistant built with:

- Vite + React
- Plain CSS
- Vercel serverless functions
- Groq SDK with `llama-3.1-70b-versatile`
- MongoDB Atlas with the `mongodb` package

The frontend never calls Groq or MongoDB directly. All reads and writes flow through `/api/*` Vercel functions.

## Features

- Claude-inspired chat layout with sidebar history
- Dark and light mode toggle
- Streaming AI responses in the chat UI
- Budget profile screen for income, fixed expenses, and savings goal
- Wishlist screen with add and delete actions
- MongoDB persistence for profile, wishlist items, and chat history
- System prompt injection on every message using saved budget context

## Project Structure

```text
.
|-- api
|   |-- chat.js
|   |-- chats.js
|   |-- profile.js
|   `-- wishlist.js
|-- lib
|   |-- budgetContext.js
|   |-- http.js
|   `-- mongodb.js
|-- src
|   |-- components
|   |-- lib
|   |-- pages
|   |-- App.jsx
|   |-- index.css
|   `-- main.jsx
|-- .env.example
|-- index.html
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
3. Create a new `M0` free cluster.
4. In `Database Access`, create a database user and save the username/password.
5. In `Network Access`, add an IP access rule.
   For quick testing, `0.0.0.0/0` works, though a tighter rule is safer.
6. Click `Connect`, choose `Drivers`, and copy the connection string.
7. Replace `<password>` in the string with your database user's password.

Example:

```env
MONGODB_URI=mongodb+srv://your-user:your-password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

The app uses a database named `budget_assistant` automatically.

## 3. Create a Groq API Key

1. Sign in at [Groq Console](https://console.groq.com/keys).
2. Create a new API key.
3. Copy the key.

## 4. Create Your `.env` File

Create a local `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=your_mongodb_atlas_connection_string
```

Never hardcode these secrets in source files.

## 5. Run Locally

```bash
npm run dev
```

This starts both:

- Vite on `http://localhost:5173`
- Vercel functions locally on `http://localhost:3000`

The frontend proxies `/api/*` requests from Vite to the local Vercel runtime automatically, so chat works during development.

## 6. Deploy to Vercel

### Option A: Import the repo in the Vercel dashboard

1. Push this project to GitHub.
2. Go to [Vercel](https://vercel.com/).
3. Click `Add New Project`.
4. Import the repository.
5. In the project's environment variables, add:
   - `GROQ_API_KEY`
   - `MONGODB_URI`
6. Deploy.

### Option B: Deploy with the Vercel CLI

```bash
npm i -g vercel
vercel
```

When prompted:

1. Link the project.
2. Add the same environment variables in Vercel.
3. Run:

```bash
vercel --prod
```

## Notes

- This app is intentionally single-user and uses a fixed demo user id in the backend because there is no auth layer in scope.
- Chat history is stored in MongoDB and shown in the left sidebar.
- The server injects profile data, discretionary amount, and wishlist context into every Groq request.
- Purchase questions are guided by the system prompt to return `buy now`, `wait 1 month`, or `wait 2+ months`.

## Environment Variables

- `GROQ_API_KEY`
- `MONGODB_URI`

## Free Services Only

- MongoDB Atlas free tier
- Groq API key
- Vercel hobby deployment
