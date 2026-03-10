# Render Backend Deployment

Deploy the Express API in `server/` to Render as a Web Service.

## Render Service Settings

- Environment: `Node`
- Build command: `npm install`
- Start command: `npm run server`

## Required Environment Variables

- `MONGODB_URI`
- `JWT_SECRET`
- `PORT`

Recommended values:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/alshalal-factory?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=<strong-random-secret>
PORT=10000
```

Optional:

- `HOST=0.0.0.0`

## Deployment Flow

1. Create a new Web Service in Render from this repository.
2. Set the build and start commands above.
3. Add the required environment variables.
4. Deploy the service.
5. Verify the API health endpoint:

```text
https://your-render-service.onrender.com/api/health
```

## Notes

- Free Render services sleep after inactivity. The first request after idle time may take 20-40 seconds.
- The frontend has a retry/timeout message to handle wake-up delays more gracefully.
- Rotate any MongoDB passwords that have been shared or exposed.
