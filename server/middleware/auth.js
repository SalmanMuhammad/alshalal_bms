import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { userId, username, role, employeeId }
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
};

// Middleware to check if user is client (employee)
export const requireClient = (req, res, next) => {
    if (req.user.role !== 'client') {
        return res.status(403).json({ error: 'Access denied. Client role required.' });
    }
    next();
};

// Helper function to generate JWT token
export const generateToken = (user) => {
    // Safely extract employeeId
    let employeeIdString = null;
    if (user.employeeId) {
        try {
            // Handle different formats of employeeId
            if (user.employeeId._id) {
                employeeIdString = user.employeeId._id.toString();
            } else if (typeof user.employeeId === 'object' && user.employeeId.toString) {
                employeeIdString = user.employeeId.toString();
            } else if (typeof user.employeeId === 'string') {
                // Validate it's a proper ObjectId string
                if (mongoose.Types.ObjectId.isValid(user.employeeId)) {
                    employeeIdString = user.employeeId;
                }
            }
        } catch (e) {
            console.error('Error extracting employeeId for token:', e);
            employeeIdString = null;
        }
    }

    const payload = {
        userId: user._id.toString(),
        username: user.username,
        role: user.role,
        employeeId: employeeIdString,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

