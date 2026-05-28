# Vercel Deployment Guide

This project is configured to deploy the Vite frontend and FastAPI backend together on Vercel.

## Project Settings

- Root Directory: project root
- Build Command: `cd frontend && npm install && npm run build`
- Output Directory: `frontend/dist`

The Python backend entry is `api/index.py`, which imports the FastAPI app from `backend/main.py`.

## API Path

After deployment, the frontend calls the backend through the same Vercel domain:

```text
/api/upload
```

For local development, if `VITE_API_BASE_URL` is not set, the frontend still calls:

```text
http://127.0.0.1:8000/upload
```

## Environment Variables

Configure backend model variables in Vercel according to `backend/.env.example`.

Do not commit `backend/.env` or any real API keys.
