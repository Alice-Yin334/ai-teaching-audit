# Deployment Guide

## Backend: Render

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment Variables: configure them according to `backend/.env.example`

Do not upload `backend/.env` to Git or Render. Add the same values in Render's Environment Variables panel.

## Frontend: Vercel

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Set this Vercel environment variable to your deployed Render backend URL:

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```
