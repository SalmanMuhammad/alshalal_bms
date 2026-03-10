import express from 'express';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All employee routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get all employees
router.get('/', async (req, res) => {
    try {
        const employees = await Employee.find().sort({ createdAt: 1 });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single employee
router.get('/:id', async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new employee
router.post('/', async (req, res) => {
    try {
        // Only allow name and position for employee creation (notes are month-specific in Attendance)
        const employee = new Employee({
            name: req.body.name,
            position: req.body.position || 'Labor',
        });
        await employee.save();
        res.status(201).json(employee);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update employee
router.put('/:id', async (req, res) => {
    try {
        // Only allow updating name and position (notes are month-specific in Attendance)
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                position: req.body.position,
            },
            { new: true, runValidators: true }
        );
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete employee
router.delete('/:id', async (req, res) => {
    try {
        // Delete all attendance records for this employee
        await Attendance.deleteMany({ employeeId: req.params.id });
        
        // Delete the employee
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ message: 'Employee and all attendance records deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

