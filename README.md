# Viralytics

Minimal Next.js + Tailwind demo for the Hacklytics2026 prototype.

## New: YouTube Trending + Niche Filter + Gemini Pattern Extraction

This repo now includes an API route that:
1) pulls **global trending** YouTube videos (region-based),
2) filters/sorts them by a user-provided niche keyword,
3) sends the best-matching videos to Gemini for **pattern extraction**.

Quick start:

```bash
npm install
npm run dev
```

Visit http://localhost:3000

Gemini integration (optional):

- To enable Gemini-backed spin-off generation, set these environment variables in a local env file or your deployment:

	- `GEMINI_API_URL` — the full HTTP endpoint for your Gemini/generative API (POST)
	- `GEMINI_API_KEY` — the bearer API key

Example (env.local):

```
GEMINI_API_URL=https://your-gemini-endpoint.example/v1/generate
GEMINI_API_KEY=sk-...
```

The `/api/spinoff` endpoint will try Gemini first and fall back to the built-in mock generator if the call fails or the env vars are not set.

Deployment
----------

Deploy to Vercel (recommended for Next.js):

- Push this repository to GitHub.
- Import the repo into Vercel and set environment variables in the Vercel dashboard (`GEMINI_API_URL`, `GEMINI_API_KEY` if used).
- Vercel will run the build and host the app.

Docker (local or container host):

Build the image:

```bash
docker build -t trendspinoff-demo .
```

Run the container (exposes port 3000):

```bash
docker run -p 3000:3000 --env-file .env.local trendspinoff-demo
```

Notes:
- Use `npm run build` locally before creating production images to verify the build.
- The `.env.example` file shows optional environment variables the app can use.
