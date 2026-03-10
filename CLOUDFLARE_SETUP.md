# Cloudflare Pages Deployment (Frontend + API)

This project can run entirely on Cloudflare Pages by using Pages Functions for the API and MongoDB Atlas Data API for storage.

## What Changed
- The API is implemented in `functions/api/[[path]].js` (Cloudflare Pages Functions).
- The Express server under `server/` is still useful for local Docker/dev, but **not** used on Cloudflare.

## MongoDB Atlas Data API
Cloudflare Workers do not support direct MongoDB connections, so the API talks to MongoDB through the Atlas Data API.

You need:
- An Atlas cluster (free tier is fine).
- Data API enabled for the cluster.
- A Data API key.

## Required Environment Variables (Cloudflare Pages)
Set these in your Cloudflare Pages project:

- `MONGODB_DATA_API_URL`  
  Example: `https://data.mongodb-api.com/app/<app-id>/endpoint/data/v1`
- `MONGODB_DATA_API_KEY`
- `MONGODB_DATA_SOURCE` (usually your cluster name, e.g. `Cluster0`)
- `MONGODB_DATA_DATABASE` (e.g. `alshalal-factory`)
- `JWT_SECRET` (strong random value)

Optional collection overrides:
- `MONGODB_COLLECTION_USERS` (default `users`)
- `MONGODB_COLLECTION_EMPLOYEES` (default `employees`)
- `MONGODB_COLLECTION_ATTENDANCE` (default `attendances`)
- `MONGODB_COLLECTION_QUOTATIONS` (default `quotations`)

## Cloudflare Pages Build Settings
- **Build command**: `npm run build`
- **Output directory**: `dist`

No `VITE_API_URL` is required because `/api` is served from the same Pages domain.

## Notes
- The API uses JWTs signed with `JWT_SECRET`.
- Attendance overtime is stored as a plain object `{ "dayIndex": hours }`.
- If you already have MongoDB data created with the Express server, it will still work. New records created through Pages Functions will store `employeeId` as a string.

