# Docker Setup Guide

This guide shows how to run MongoDB, the backend, and the frontend using Docker Compose.

## Prerequisites

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and start Docker Desktop
   - Verify installation: `docker --version`

## Quick Start (Full Stack)

1. **Start all services (MongoDB + Backend + Frontend)**
   ```bash
   npm run docker:up
   ```

2. **Open the app**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5001/api`
   - Health check: `http://localhost:5001/api/health`

3. **Check logs**
   ```bash
   npm run docker:logs
   ```

## MongoDB Only

If you only want MongoDB (like before):
```bash
npm run docker:up:db
```

## Docker Commands

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start full stack (MongoDB + Backend + Frontend) |
| `npm run docker:up:db` | Start only MongoDB |
| `npm run docker:down` | Stop and remove containers |
| `npm run docker:logs` | Follow logs for all services |
| `npm run docker:logs:db` | Follow logs for MongoDB only |
| `npm run docker:restart` | Restart all services |
| `npm run docker:restart:db` | Restart only MongoDB |

## Connection Details

- **Mongo Host**: `mongodb`
- **Mongo Port**: `27017`
- **Database**: `alshalal-factory`
- **Username**: `admin`
- **Password**: `admin123`
- **Backend Port**: `5001`
- **Frontend Port**: `3000`

## Data Persistence

MongoDB data is stored in Docker volumes:
- `mongodb_data` - Database files
- `mongodb_config` - Configuration files

To remove all MongoDB data:
```bash
docker-compose down -v
```

## Troubleshooting

### Containers won’t start
```bash
# Check Docker is running

docker ps

# Check for port conflicts
lsof -i :27017
lsof -i :5001
lsof -i :3000
```

### Backend can’t connect to MongoDB
1. Verify MongoDB container is running: `docker ps`
2. Check backend logs: `docker-compose logs backend`
3. Ensure `MONGODB_URI` matches the docker-compose value

### Frontend can’t reach the API
1. Verify backend is running: `docker ps`
2. Check frontend logs: `docker-compose logs frontend`
3. Ensure the frontend is using the Vite proxy (`/api`) and that `VITE_PROXY_TARGET` is set to `http://backend:5001` in `docker-compose.yml`

## Access MongoDB Shell
```bash
# Connect to MongoDB shell inside container

docker exec -it alshalal-mongodb mongosh -u admin -p admin123 --authenticationDatabase admin

# Or connect to specific database

docker exec -it alshalal-mongodb mongosh -u admin -p admin123 --authenticationDatabase admin alshalal-factory
```

## Security Notes

⚠️ **For Development Only**: The default credentials (admin/admin123) are for development.

**For Production:**
1. Change the password in `docker-compose.yml`
2. Update environment variables accordingly
3. Use secrets management for sensitive values
4. Consider using MongoDB Atlas or a managed service



## If you want to rebuild images after code changes:
```bash

  docker-compose up -d --build

  ```
