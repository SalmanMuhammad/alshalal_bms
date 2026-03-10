# Cloudflare Pages Frontend Deployment

This project should be deployed to Cloudflare Pages as a frontend-only app.

The API should be hosted separately on Render using the Express server under `server/`. MongoDB Atlas App Services Data API is no longer the recommended path for this repository.

## Cloudflare Pages Settings

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`

## Environment Variables

Set this in the Cloudflare Pages project:

- `VITE_API_URL`

Example:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

## Deployment Flow

1. Deploy the backend first.
2. Verify the backend health endpoint:

```text
https://your-render-service.onrender.com/api/health
```

3. Add `VITE_API_URL` to the Cloudflare Pages project.
4. Deploy the frontend to Cloudflare Pages.
5. Open the site and complete the initial admin setup if no users exist yet.

## Notes

- Do not set `MONGODB_URI` or Atlas credentials in Cloudflare Pages for this setup.
- The frontend calls the backend over HTTPS using `VITE_API_URL`.
- If the backend is on a free Render plan, the first request after inactivity may be slow while the service wakes up.
