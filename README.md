# Alshalal Factory - Business Management System

A comprehensive business management application for Alshalal Factory, featuring Professional Quotation generation and Attendance & HR Tracking with MongoDB database integration.

## Features

### 📄 Professional Quotation System
- Generate professional business quotations
- PDF download functionality
- Payment details and financial summaries
- VAT and transportation charges management

### 📊 Attendance & HR Tracking System
- **Database Integration**: All data is saved to MongoDB
- **Monthly Attendance Tracking**: Track employee attendance for any month/year
- **Payroll Management**: Fixed or daily salary calculation
- **Overtime Tracking**: Per-day overtime hours
- **Bonus & Fine System**: Adjustments to employee payments
- **Notes System**: Employee-specific notes and comments
- **Dashboard Analytics**: Visual charts showing daily attendance
- **Auto-save**: Changes are automatically saved after 2 seconds

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Recharts (for charts)
- Lucide React (for icons)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- CORS enabled

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Docker and Docker Compose (for full stack or MongoDB container) OR MongoDB local installation OR MongoDB Atlas account

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd alshalal_bms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # MongoDB Connection String
   # For Docker MongoDB Container (recommended for development):
   MONGODB_URI=mongodb://admin:admin123@localhost:27017/alshalal-factory?authSource=admin
   
   # For local MongoDB (without authentication):
   # MONGODB_URI=mongodb://localhost:27017/alshalal-factory
   
   # For MongoDB Atlas (cloud - recommended for production):
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/alshalal-factory?retryWrites=true&w=majority
   
   # Server Port (5001 to avoid AirPlay conflict on macOS)
   PORT=5001
   ```

4. **Start with Docker Compose** (Recommended - full stack)
   ```bash
   # Start MongoDB + Backend + Frontend
   npm run docker:up
   
   # Or using docker-compose directly:
   docker-compose up -d
   
   # Check if MongoDB is running
   docker ps
   
   # View logs
   npm run docker:logs
   ```
   
   **MongoDB Only (previous behavior)**
   ```bash
   npm run docker:up:db
   ```
   
   **Alternative: Local MongoDB Installation**
   ```bash
   # On macOS with Homebrew:
   brew services start mongodb-community
   
   # On Linux:
   sudo systemctl start mongod
   
   # On Windows:
   # Start MongoDB service from Services panel
   ```

### Running the Application

You need to run both the backend server and the frontend development server:

**Terminal 1 - Backend Server:**
```bash
npm run dev:server
```
The server will run on `http://localhost:5001` (changed from 5000 to avoid AirPlay conflict on macOS)

**Terminal 2 - Frontend Development Server:**
```bash
npm run dev
```
The frontend will run on `http://localhost:3000`

### Cloudflare Pages Deployment (Frontend + API)
See `CLOUDFLARE_SETUP.md` for the Cloudflare Pages setup using Pages Functions and MongoDB Atlas Data API.

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm run server
   ```

## Docker Compose Options

### Option 1: Full Stack (Recommended for Development) ⭐
1. Make sure Docker is installed and running
2. Start all services:
   ```bash
   npm run docker:up
   ```
3. Frontend: `http://localhost:3000`
4. Backend API: `http://localhost:5001/api`
5. To stop:
   ```bash
   npm run docker:down
   ```

**Docker Commands:**
- `npm run docker:up` - Start full stack
- `npm run docker:up:db` - Start only MongoDB
- `npm run docker:down` - Stop and remove containers
- `npm run docker:logs` - View logs for all services
- `npm run docker:logs:db` - View MongoDB logs only
- `npm run docker:restart` - Restart all services
- `npm run docker:restart:db` - Restart only MongoDB

**Note:** Data is persisted in Docker volumes, so your data won't be lost when you stop the container.

### Option 2: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/alshalal-factory`

### Option 3: MongoDB Atlas (Cloud - Recommended for Production)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Get your connection string and add it to `.env`

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance/:month/:year` - Get attendance for specific month
- `POST /api/attendance/:month/:year` - Save attendance for month
- `PATCH /api/attendance/:employeeId/:month/:year/:dayIndex` - Update single day attendance

## Data Structure

### Employee Document
```javascript
{
  name: String,
  position: String,
  salaryType: 'Fixed' | 'Daily',
  basicSalary: Number,
  pendingSalary: Number,
  bonus: Number,
  fine: Number,
  notes: String,
  attendance: Map {
    "month-year": {
      attendance: [String], // Array of status per day
      overtime: Map // Day index to hours
    }
  }
}
```

## Features in Detail

### Auto-Save
- All changes are automatically saved to the database after 2 seconds of inactivity
- A "Saving..." indicator appears when data is being saved
- Error messages are displayed if saving fails

### Month/Year Navigation
- Switch between different months and years
- Data is automatically loaded for the selected month
- Each month's data is stored separately in the database

### Employee Management
- Add new employees with default values
- Edit employee details (name, position, salary)
- Remove employees (minimum 1 employee required)
- All changes are persisted to the database

## Troubleshooting

### MongoDB Connection Issues
- **Docker Container**: 
  - Ensure Docker is running: `docker ps`
  - Check container status: `docker-compose ps`
  - View logs: `npm run docker:logs`
  - Restart container: `npm run docker:restart`
- **Local MongoDB**: 
  - Ensure MongoDB service is running
  - Check connection string in `.env`
- **MongoDB Atlas**: 
  - Verify network access (IP whitelist)
  - Check connection string format
- **General**: 
  - Verify connection string in `.env` matches your setup
  - Check MongoDB logs for errors
  - Ensure port 27017 is not blocked by firewall

### Port Already in Use
- Change `PORT` in `.env` if 5001 is taken (Note: Port 5000 is often used by macOS AirPlay)
- Update Vite proxy in `vite.config.js` or set `VITE_PROXY_TARGET` if needed

### CORS Errors
- Ensure backend server is running
- Check that API URL is correct in `src/utils/api.js`

## License

Proprietary - Alshalal Factory
