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

## Tencent Cloud Docker Deployment

Use this option for Tencent Cloud Lighthouse or another Linux server with Docker and Docker Compose installed.

### 1. Pull the latest code

```bash
git pull
```

### 2. Create backend environment variables

Create `backend/.env` on the server:

```env
LLM_PROVIDER=deepseek

DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-chat

KIMI_API_KEY=your_kimi_api_key
KIMI_API_URL=https://api.moonshot.ai/v1/chat/completions
KIMI_MODEL=moonshot-v1-8k

DOUBAO_API_KEY=your_doubao_api_key
DOUBAO_API_URL=your_doubao_openai_compatible_url
DOUBAO_MODEL=your_doubao_model_name
```

Only fill the providers you plan to use. Do not commit `backend/.env`.

### 3. Start the project

```bash
docker compose up -d --build
```

### 4. Visit the site

Open:

```text
http://your-public-ip
```

The frontend is served by Nginx on port `80`. Requests to `/api/upload` are proxied to the FastAPI backend container on port `8000`.
