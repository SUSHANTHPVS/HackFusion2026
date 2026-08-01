# IEEE Hackathon Management System

Production-style full-stack platform for IEEE RAS x IEEE CS hackathons.

## Stack
- Frontend: React 19, Vite, Tailwind CSS, Framer Motion, React Router, TanStack Query, React Hook Form, Zod, Axios
- Backend: Node.js, Express.js, MongoDB Atlas, JWT, Razorpay Payment Gateway, Nodemailer, Multer
- Deployment: Vercel (client), Render (server), MongoDB Atlas (database)

## Structure
- `client/`: React app with public, participant, admin, and judge routes
- `server/`: Express API with auth, registration, payment verification, scoring, analytics, certificate, and check-in modules

## Quick Start
1. Copy `server/.env.example` to `server/.env` and fill values.
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `server/.env`, and set `VITE_RAZORPAY_KEY_ID` in `client/.env`.
3. Install dependencies:
   - `cd client && npm install`
   - `cd ../server && npm install`
4. Run apps:
   - Client: `cd client && npm run dev`
   - Server: `cd server && npm run dev`

## Docker Deployment
1. Ensure `server/.env` exists and contains production-ready values.
2. Build and start both services:
   - `docker compose up --build -d`
3. Open the app:
   - Client: `http://localhost`
   - Server health: `http://localhost:8080/health`
4. Stop services:
   - `docker compose down`

### Docker Notes
- Client is served by Nginx and proxies `/api/*` to the backend container.
- `docker-compose.yml` forces `CLIENT_ORIGIN=http://localhost` for browser access.
- Backend still uses all secrets from `server/.env`.

### Local Runbook
- See `LOCAL_DOCKER.md` for a quick local Docker workflow and troubleshooting guide.

## Core API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/create-order`
- `POST /api/verify-payment`
- `POST /api/registration/team`
- `POST /api/payments/callback`
- `GET /api/payments/status/:transactionId`
- `GET /api/participant/dashboard`
- `POST /api/participant/submission`
- `GET /api/admin/stats`
- `GET /api/admin/timeline`
- `GET /api/admin/payments/recovery-queue`
- `GET /api/admin/payments/:orderId/audit`
- `POST /api/admin/payments/:paymentId/recovery-order`
- `POST /api/admin/certificates/winner`
- `GET /api/judge/teams`
- `POST /api/judge/scores`
- `GET /api/judge/leaderboard`
- `POST /api/checkin/scan`

## Security + Performance Implemented
- Helmet, CORS, compression
- API rate limiting
- JWT auth + role guards
- Input validation via Zod
- bcrypt password hashing
- PhonePe callback signature verification (X-VERIFY HMAC-SHA256)
- PhonePe status polling and redirect-based payment flow
- Idempotent payment verification and duplicate transaction protection
- Payment audit trail for verify/webhook/recovery events
- MongoDB indexes on critical fields

## Roadmap
- Real-time leaderboard via WebSocket
- Push notifications + reminders
- Multi-event support
- Volunteer and sponsor management
- AI plagiarism checks
