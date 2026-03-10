# Authentication Setup Guide

This application now includes a login system with role-based access control.

## Roles

1. **Admin**: Full access to all features
   - Can create and manage quotations
   - Can manage all employees and their attendance
   - Can edit all attendance records (past, present, future)
   - Can manage payroll, bonuses, fines, etc.

2. **Client (Employee)**: Limited access
   - Can only view their own attendance record
   - Can only mark attendance for today
   - Can only add overtime for today
   - Cannot edit past or future attendance
   - Cannot access quotation system
   - Cannot view or edit other employees' data

## Setting Up the First Admin User

To create the first admin user, you can use the registration endpoint or create it directly in MongoDB.

### Option 1: Using API (Recommended)

1. Start the server: `npm run server` or `npm run dev:server`
2. Use a tool like Postman or curl to register an admin user:

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "role": "admin"
  }'
```

### Option 2: Using MongoDB directly

1. Connect to your MongoDB database
2. Insert a user document:

```javascript
db.users.insertOne({
  username: "admin",
  password: "$2a$10$...", // bcrypt hashed password
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

To generate a bcrypt hash, you can use Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your-password', 10);
console.log(hash);
```

## Creating Employee (Client) Users

To create an employee user:

1. First, create an employee record (if not exists)
2. Then register a user with `role: "client"` and link it to the employee:

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "employee1",
    "password": "password123",
    "role": "client",
    "employeeId": "EMPLOYEE_ID_HERE"
  }'
```

Replace `EMPLOYEE_ID_HERE` with the actual MongoDB ObjectId of the employee.

## Security Notes

- Passwords are automatically hashed using bcrypt before storage
- JWT tokens are used for authentication (expires in 7 days)
- All API routes (except `/api/auth/login` and `/api/auth/register`) require authentication
- Quotation and Employee routes require admin role
- Attendance routes require authentication but allow both admin and client roles (with restrictions)

## Environment Variables

Make sure to set a secure JWT secret in production:

```env
JWT_SECRET=your-very-secure-secret-key-here
```

The default secret is `your-secret-key-change-in-production` and should be changed in production environments.

