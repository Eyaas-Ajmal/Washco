# WashCO — Car Wash Booking Platform

A multi-tenant SaaS platform for car wash booking management. Customers can browse car washes, book services, and leave reviews. Managers can manage their car wash, services, and time slots. Super admins oversee the entire platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Framer Motion |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT + Refresh Tokens (argon2) |
| Images | Cloudinary (prod) / Local (dev) |

## Local Development

### Prerequisites
- Node.js ≥ 18
- PostgreSQL database
- npm

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd WashCO

# Backend
cd backend
cp .env.example .env   # Edit with your DB credentials and JWT secrets
npm install

# Frontend
cd ../frontend
cp .env.example .env   # Leave VITE_API_URL empty for local dev
npm install
```

### 2. Set Up Database

Create a PostgreSQL database, then run migrations:

```bash
cd backend
npm run migrate
```

### 3. Start Development Servers

```bash
# Terminal 1 — Backend (port 3000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Visit **http://localhost:5173**

### Default Admin Account
After running migrations and seed, log in with:
- Email: `admin@washco.com`
- Password: `admin123`

> ⚠️ Change the admin password immediately in production!

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` or `production` (default: development) |
| `PORT` | No | Server port (default: 3000) |
| `DATABASE_URL` | Yes* | PostgreSQL connection string (for cloud DBs) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Yes* | Individual DB fields (for local dev) |
| `DB_SSL` | No | Set to `true` for cloud DBs |
| `JWT_SECRET` | Yes | Min 32 chars, generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `REFRESH_TOKEN_SECRET` | Yes | Same as above, different value |
| `CORS_ORIGIN` | No | Frontend URL (default: http://localhost:5173) |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name (for image uploads) |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |

*Either `DATABASE_URL` or the individual `DB_*` fields are required.

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API URL. Leave empty for local dev. Set to `https://your-backend.onrender.com/api` for production. |

## Production Deployment

### Recommended Stack (Free Tier)

| Service | Provider |
|---------|----------|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) |
| Database | [Neon](https://neon.tech) or [Supabase](https://supabase.com) |
| Images | [Cloudinary](https://cloudinary.com) |

### Deploy Steps

1. **Database**: Create a PostgreSQL instance on Neon/Supabase. Copy the connection string.

2. **Backend** (Render):
   - Connect your GitHub repo
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Set environment variables (DATABASE_URL, JWT secrets, CORS_ORIGIN, Cloudinary keys)

3. **Frontend** (Vercel):
   - Connect your GitHub repo
   - Root Directory: `frontend`
   - Framework Preset: Vite
   - Set `VITE_API_URL` to your Render backend URL + `/api`

4. **Run Migrations** on production DB:
   ```bash
   DATABASE_URL=your_connection_string npm run migrate
   ```

5. **Create Admin** — use the seed script or register via API.

## Project Structure

```
WashCO/
├── backend/
│   ├── src/
│   │   ├── config/       # Environment, database config
│   │   ├── middleware/    # Auth, RBAC, rate limiting, error handling
│   │   ├── modules/       # Feature modules (auth, tenants, bookings, etc.)
│   │   ├── database/      # Migrations and seeds
│   │   └── utils/         # Helpers, logger, audit
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/           # API client and service functions
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # Auth context
│   │   ├── pages/         # Route pages (admin, manager, customer, public)
│   │   └── App.jsx        # Router setup
│   └── package.json
└── README.md
```

## Roles

| Role | Capabilities |
|------|-------------|
| **Super Admin** | Create managers, approve/suspend car washes, manage all users, view audit logs |
| **Manager** | Register car wash, manage services & time slots, handle bookings, upload images |
| **Customer** | Browse car washes, book services, view bookings, leave reviews |
