import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { generateToken, authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/setup-status', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        res.json({
            requiresSetup: userCount === 0,
            userCount,
        });
    } catch (error) {
        console.error('Setup status error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Register new user (admin only - or can be used for initial setup)
// Allow registration without auth if no users exist (for initial setup)
// Otherwise require admin authentication
router.post('/register', async (req, res) => {
    try {
        // Check if any users exist
        const userCount = await User.countDocuments();
        
        // If users exist, require admin authentication
        if (userCount > 0) {
            // Verify token and admin role
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            try {
                const jwt = await import('jsonwebtoken');
                const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
                const decoded = jwt.default.verify(token, JWT_SECRET);
                
                if (decoded.role !== 'admin') {
                    return res.status(403).json({ error: 'Admin role required' });
                }
            } catch (tokenError) {
                return res.status(403).json({ error: 'Invalid or expired token' });
            }
        }
    } catch (checkError) {
        // If check fails, allow registration (for initial setup)
        console.log('User count check failed, allowing registration for initial setup');
    }
    
    // Continue with registration logic
    try {
        const { username, password, role, employeeId } = req.body;

        // Validate input
        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Username, password, and role are required' });
        }

        // If role is client, employeeId is required
        if (role === 'client' && !employeeId) {
            return res.status(400).json({ error: 'Employee ID is required for client role' });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
        }

        // If client role, verify employee exists and convert to ObjectId
        let employeeObjectId = null;
        if (role === 'client') {
            if (!employeeId) {
                return res.status(400).json({ error: 'Employee ID is required for client role' });
            }
            
            // Convert to ObjectId if it's a string
            try {
                employeeObjectId = typeof employeeId === 'string' 
                    ? new mongoose.Types.ObjectId(employeeId) 
                    : employeeId;
            } catch (idError) {
                return res.status(400).json({ error: 'Invalid employee ID format' });
            }
            
            const employee = await Employee.findById(employeeObjectId);
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }
            
            // Check if this employee already has a registered user
            const existingEmployeeUser = await User.findOne({ employeeId: employeeObjectId, role: 'client' });
            if (existingEmployeeUser) {
                return res.status(400).json({ error: 'This employee already has a registered user account.' });
            }
        }

        // Create new user
        const user = new User({
            username,
            password, // Will be hashed by pre-save hook
            role,
            employeeId: role === 'client' ? employeeObjectId : undefined,
        });

        await user.save();

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id.toString(),
                username: user.username,
                role: user.role,
                employeeId: user.employeeId ? user.employeeId.toString() : null,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user without populating (to avoid casting errors)
        const user = await User.findOne({ username }).lean();
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Re-fetch user as document to use comparePassword method
        const userDoc = await User.findById(user._id);
        if (!userDoc) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check password
        const isPasswordValid = await userDoc.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Populate employeeId if it exists and is valid
        let employee = null;
        let employeeIdString = null;
        
        if (user.employeeId) {
            try {
                // Get employeeId as string first
                const rawEmployeeId = user.employeeId.toString ? user.employeeId.toString() : user.employeeId;
                
                // Validate and convert to ObjectId
                if (mongoose.Types.ObjectId.isValid(rawEmployeeId)) {
                    employeeIdString = rawEmployeeId;
                    employee = await Employee.findById(rawEmployeeId).select('name position').lean();
                } else {
                    console.error('Invalid employeeId format for user:', user._id, 'employeeId:', rawEmployeeId);
                    // Try to fix: if employeeId is corrupted, set it to null
                    // This will require the user to re-register
                }
            } catch (populateError) {
                console.error('Error populating employee:', populateError);
                // Continue without employee data
            }
        }

        // Generate token using the user document
        const token = generateToken(userDoc);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id.toString(),
                username: user.username,
                role: user.role,
                employeeId: employeeIdString,
                employee: employee ? {
                    id: employee._id.toString(),
                    name: employee.name,
                    position: employee.position,
                } : null,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get current user info (protected route)
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).lean();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Populate employeeId if it exists and is valid
        let employee = null;
        let employeeIdString = null;
        
        if (user.employeeId) {
            try {
                // Get employeeId as string first
                const rawEmployeeId = user.employeeId.toString ? user.employeeId.toString() : user.employeeId;
                
                // Validate and convert to ObjectId
                if (mongoose.Types.ObjectId.isValid(rawEmployeeId)) {
                    employeeIdString = rawEmployeeId;
                    employee = await Employee.findById(rawEmployeeId).select('name position').lean();
                } else {
                    console.error('Invalid employeeId format for user:', user._id, 'employeeId:', rawEmployeeId);
                }
            } catch (populateError) {
                console.error('Error populating employee:', populateError);
                // Continue without employee data
            }
        }

        res.json({
            id: user._id.toString(),
            username: user.username,
            role: user.role,
            employeeId: employeeIdString,
            employee: employee ? {
                id: employee._id.toString(),
                name: employee.name,
                position: employee.position,
            } : null,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reset password (admin only)
router.post('/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, newPassword } = req.body;

        if (!username || !newPassword) {
            return res.status(400).json({ error: 'Username and new password are required' });
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        res.json({
            message: 'Password reset successfully',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
