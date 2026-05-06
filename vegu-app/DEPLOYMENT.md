# VEGU — Production Deployment Guide

## Architecture

```
Browser → Vercel (Next.js frontend)
             ↓ /api/* rewrites
          Railway (Express backend)
             ↓
          Neon/Supabase (PostgreSQL)
```

---

## 1. Database — Neon (Free Tier)

1. Create account at https://neon.tech
2. Create a new project → name it `vegu`
3. Copy the connection string:
   ```
   postgresql://USER:PASSWORD@ep-xxx.us-east-2.aws.neon.tech/neon?sslmode=require
   ```
4. Set `DATABASE_URL` in your backend env

**Run migrations:**
```bash
cd vegu-app/backend
DATABASE_URL="<neon-url>" npx prisma db push
DATABASE_URL="<neon-url>" npx tsx prisma/seed.ts
```

---

## 2. Backend — Railway

1. Create account at https://railway.app
2. New project → Deploy from GitHub repo
3. Select the repo, set root directory to `vegu-app/backend`
4. Add all environment variables from `.env.production`
5. Railway auto-detects Node.js and runs `npm start`

**Or via CLI:**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

**Build command:** `npm run build`  
**Start command:** `node dist/server.js`

---

## 3. Frontend — Vercel

1. Go to https://vercel.com → Import Git repository
2. Set root directory to `vegu-app/frontend`
3. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL = https://your-railway-url.up.railway.app
   ```
4. Deploy

**Or via CLI:**
```bash
npm install -g vercel
cd vegu-app/frontend
vercel --prod
```

---

## 4. CI/CD — GitHub Actions

Add these secrets to your GitHub repo (Settings → Secrets):

| Secret | Where to get |
|--------|-------------|
| `VERCEL_TOKEN` | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | .vercel/project.json after `vercel link` |
| `VERCEL_PROJECT_ID` | .vercel/project.json after `vercel link` |
| `RAILWAY_TOKEN` | railway.app/account/tokens |

---

## 5. Generate Secure JWT Secrets

```bash
# Run this twice to get two different secrets:
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

---

## 6. Post-Deployment Checklist

- [ ] `DATABASE_URL` points to production Neon DB
- [ ] `FRONTEND_URL` in backend env matches Vercel URL
- [ ] `NEXT_PUBLIC_API_URL` in frontend env matches Railway URL  
- [ ] JWT secrets are 48+ chars and unique
- [ ] Prisma migrations ran: `npx prisma db push`
- [ ] Seed data loaded: `npx tsx prisma/seed.ts`
- [ ] Health check responds: `GET /health`
- [ ] Login works: POST `/api/auth/login`
- [ ] CORS allows Vercel domain

---

## 7. Demo Accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vegu.app | VeguAdmin@2024 |
| Vendor | vendor@vegu.app | Vendor@2024 |
| Customer | customer@vegu.app | Customer@2024 |

---

## 8. Monitoring

- Backend logs: Railway dashboard → Deployments → Logs
- Frontend errors: Vercel dashboard → Functions → Logs
- Database: Neon dashboard → Monitoring
