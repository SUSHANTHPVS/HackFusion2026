# IEEE Hackathon Management System

Production-style full-stack platform for IEEE RAS x IEEE CS hackathons.

## Stack
- Frontend: React 19, Vite, Tailwind CSS, Framer Motion, React Router, TanStack Query, React Hook Form, Zod, Axios
- Backend: Node.js, Express.js, MongoDB Atlas, JWT, Razorpay, Nodemailer, Multer
- Deployment: Vercel (client), Render (server), MongoDB Atlas (database)

## Structure
- `client/`: React app with public, participant, admin, and judge routes
- `server/`: Express API with auth, registration, payment verification, scoring, analytics, certificate, and check-in modules

## Quick Start
1. Copy `server/.env.example` to `server/.env` and fill values.
2. In Razorpay Dashboard, configure webhook URL as `/api/payments/webhook` and set the same secret value in `RAZORPAY_WEBHOOK_SECRET`.
3. Install dependencies:
   - `cd client && npm install`
   - `cd ../server && npm install`
4. Run apps:
   - Client: `cd client && npm run dev`
   - Server: `cd server && npm run dev`

## Core API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/registration/team`
- `POST /api/payments/webhook`
- `POST /api/payments/verify`
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
- Razorpay signature verification
- Razorpay webhook reconciliation for delayed/failed client callbacks
- Idempotent payment verification and duplicate transaction protection
- Payment audit trail for verify/webhook/recovery events
- MongoDB indexes on critical fields

## Roadmap
- Real-time leaderboard via WebSocket
- Push notifications + reminders
- Multi-event support
- Volunteer and sponsor management
- AI plagiarism checks
