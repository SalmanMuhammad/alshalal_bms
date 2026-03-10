import express from 'express';
import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All attendance routes require authentication
router.use(authenticateToken);

// Helper function to extract valid ObjectId from potentially corrupted data
function extractObjectId(value) {
    if (!value) return null;
    
    // If it's already a valid ObjectId string, return it
    if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        // Check if it's a proper 24-character hex string
        if (/^[0-9a-fA-F]{24}$/.test(value)) {
            return value;
        }
    }
    
    // If it's an ObjectId instance, convert to string
    if (value instanceof mongoose.Types.ObjectId) {
        return value.toString();
    }
    
    // If it's a stringified object, try to extract the ObjectId
    if (typeof value === 'string') {
        // Try to extract ObjectId from string like: "new ObjectId('6953a2e1a3a04596a69f3a68')"
        const objectIdMatch = value.match(/ObjectId\(['"]([0-9a-fA-F]{24})['"]\)/);
        if (objectIdMatch && objectIdMatch[1]) {
            return objectIdMatch[1];
        }
        
        // Try to extract from JSON-like string
        try {
            const parsed = JSON.parse(value);
            if (parsed._id) {
                const id = parsed._id.toString ? parsed._id.toString() : parsed._id;
                if (mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id)) {
                    return id;
                }
            }
        } catch (e) {
            // Not JSON, continue
        }
        
        // Try to find a 24-character hex string in the value
        const hexMatch = value.match(/([0-9a-fA-F]{24})/);
        if (hexMatch && hexMatch[1]) {
            return hexMatch[1];
        }
    }
    
    return null;
}

// Get attendance data for a specific month-year
router.get('/:month/:year', async (req, res) => {
    try {
        const { month, year } = req.params;
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        // For clients, only get their own employee record
        // For admins, get all employees
        let employeeQuery = {};
        if (req.user.role === 'client' && req.user.employeeId) {
            const employeeId = extractObjectId(req.user.employeeId);
            if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
                employeeQuery._id = new mongoose.Types.ObjectId(employeeId);
            } else {
                console.error('Invalid employeeId for client user:', req.user.employeeId);
                return res.status(400).json({ error: 'Invalid employee ID. Please contact administrator.' });
            }
        }
        
        // Get employees
        const employees = await Employee.find(employeeQuery).sort({ createdAt: 1 });
        
        // Get all attendance records for this month-year
        const attendanceRecords = await Attendance.find({ month: monthNum, year: yearNum });
        
        // Get all users for these employees to check registration status
        const employeeIds = employees.map(emp => emp._id);
        const users = await User.find({ 
            employeeId: { $in: employeeIds },
            role: 'client'
        }).select('username employeeId').lean();
        
        // Create a map of users by employeeId for quick lookup
        const userMap = {};
        users.forEach(user => {
            if (user.employeeId) {
                // Handle both ObjectId and string formats
                let empId;
                if (mongoose.Types.ObjectId.isValid(user.employeeId)) {
                    // It's a valid ObjectId, convert to string
                    const objId = user.employeeId instanceof mongoose.Types.ObjectId 
                        ? user.employeeId 
                        : new mongoose.Types.ObjectId(user.employeeId);
                    empId = objId.toString();
                } else if (user.employeeId._id) {
                    empId = user.employeeId._id.toString();
                } else if (user.employeeId.toString) {
                    empId = user.employeeId.toString();
                } else {
                    empId = String(user.employeeId);
                }
                userMap[empId] = {
                    username: user.username,
                    hasUser: true
                };
            }
        });
        
        // Debug logging
        console.log('Employee IDs:', employeeIds.map(id => id.toString()));
        console.log('Users found:', users.length);
        console.log('User map:', Object.keys(userMap));
        
        // Create a map of attendance records by employeeId for quick lookup
        const attendanceMap = {};
        attendanceRecords.forEach(record => {
            attendanceMap[record.employeeId.toString()] = record;
        });
        
        // Combine employee data with attendance data
        const attendanceData = employees.map(emp => {
            const attendanceRecord = attendanceMap[emp._id.toString()];
            // Try multiple formats to find user info
            const empIdStr = emp._id.toString();
            const userInfo = userMap[empIdStr] || userMap[String(emp._id)] || userMap[emp._id];
            
            // Convert overtime Map to object
            const overtimeObj = {};
            if (attendanceRecord && attendanceRecord.overtime) {
                if (attendanceRecord.overtime instanceof Map) {
                    attendanceRecord.overtime.forEach((hours, day) => {
                        overtimeObj[day] = hours;
                    });
                } else if (typeof attendanceRecord.overtime === 'object') {
                    Object.assign(overtimeObj, attendanceRecord.overtime);
                }
            }
            
            return {
                id: emp._id.toString(),
                name: emp.name || '',
                position: emp.position || 'Labor',
                // User registration info
                hasUser: userInfo ? true : false,
                username: userInfo ? userInfo.username : null,
                // Only return salaryType/basicSalary if attendance record exists (month has been saved)
                // Otherwise return null/undefined so frontend can import from previous month
                salaryType: attendanceRecord?.salaryType || null,
                basicSalary: attendanceRecord?.basicSalary !== undefined ? attendanceRecord.basicSalary : null,
                pendingSalary: attendanceRecord?.pendingSalary || 0,
                bonus: attendanceRecord?.bonus || 0,
                fine: attendanceRecord?.fine || 0,
                paidAmount: attendanceRecord?.paidAmount || 0,
                notes: attendanceRecord?.notes || '', // Notes from attendance record (month-specific)
                attendance: Array.isArray(attendanceRecord?.attendance) ? attendanceRecord.attendance : [],
                overtime: overtimeObj,
                transferredPending: attendanceRecord?.transferredPending !== undefined ? attendanceRecord.transferredPending : null,
            };
        });
        
        res.json(attendanceData);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Save attendance data for a specific month-year
router.post('/:month/:year', async (req, res) => {
    try {
        const { month, year } = req.params;
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        const { employees } = req.body; // Array of employee data
        
        // For clients, filter to only their own employee
        let employeesToSave = employees;
        if (req.user.role === 'client' && req.user.employeeId) {
            const clientEmployeeId = extractObjectId(req.user.employeeId);
            if (!clientEmployeeId || !mongoose.Types.ObjectId.isValid(clientEmployeeId)) {
                return res.status(400).json({ error: 'Invalid employee ID. Please contact administrator.' });
            }
            
            employeesToSave = employees.filter(emp => {
                const empId = extractObjectId(emp.id);
                return empId === clientEmployeeId;
            });
            
            if (employeesToSave.length === 0) {
                return res.status(403).json({ error: 'You can only update your own attendance' });
            }
        }
        
        const updatePromises = employeesToSave.map(async (empData) => {
            // Additional check: ensure client can only update their own employee
            if (req.user.role === 'client' && req.user.employeeId) {
                const clientEmployeeId = extractObjectId(req.user.employeeId);
                const empId = extractObjectId(empData.id);
                if (empId !== clientEmployeeId) {
                    throw new Error('You can only update your own attendance');
                }
            }
            // Update employee basic info (name, position only - notes are month-specific)
            const employee = await Employee.findById(empData.id);
            if (!employee) {
                throw new Error(`Employee ${empData.id} not found`);
            }
            
            employee.name = empData.name;
            employee.position = empData.position;
            await employee.save();
            
            // Convert overtime object to Map for storage
            const overtimeMap = new Map();
            if (empData.overtime) {
                Object.entries(empData.overtime).forEach(([day, hours]) => {
                    const parsedHours = parseFloat(hours);
                    if (!isNaN(parsedHours) && parsedHours > 0) {
                        overtimeMap.set(day.toString(), parsedHours);
                    }
                });
            }
            
            // Find or create attendance record for this month-year
            let attendanceRecord = await Attendance.findOne({
                employeeId: empData.id,
                month: monthNum,
                year: yearNum,
            });
            
            if (attendanceRecord) {
                // Update existing attendance record
                attendanceRecord.salaryType = empData.salaryType;
                attendanceRecord.basicSalary = empData.basicSalary;
                attendanceRecord.pendingSalary = empData.pendingSalary;
                attendanceRecord.bonus = empData.bonus;
                attendanceRecord.fine = empData.fine;
                attendanceRecord.paidAmount = empData.paidAmount || 0;
                attendanceRecord.attendance = empData.attendance || [];
                attendanceRecord.overtime = overtimeMap;
                attendanceRecord.transferredPending = empData.transferredPending !== undefined && empData.transferredPending !== null ? empData.transferredPending : null;
                attendanceRecord.notes = empData.notes || ''; // Month-specific notes
            } else {
                // Create new attendance record
                attendanceRecord = new Attendance({
                    employeeId: empData.id,
                    month: monthNum,
                    year: yearNum,
                    salaryType: empData.salaryType,
                    basicSalary: empData.basicSalary,
                    pendingSalary: empData.pendingSalary,
                    bonus: empData.bonus,
                    fine: empData.fine,
                    paidAmount: empData.paidAmount || 0,
                    attendance: empData.attendance || [],
                    overtime: overtimeMap,
                    transferredPending: empData.transferredPending !== undefined && empData.transferredPending !== null ? empData.transferredPending : null,
                    notes: empData.notes || '', // Month-specific notes
                });
            }
            
            return attendanceRecord.save();
        });
        
        await Promise.all(updatePromises);
        res.json({ message: 'Attendance saved successfully' });
    } catch (error) {
        console.error('Error saving attendance:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update single employee attendance for a day
router.patch('/:employeeId/:month/:year/:dayIndex', async (req, res) => {
    try {
        const { employeeId, month, year, dayIndex } = req.params;
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        const dayIdx = parseInt(dayIndex);
        const { status, overtime } = req.body;
        
        // For clients, verify they can only update their own attendance
        if (req.user.role === 'client' && req.user.employeeId) {
            const clientEmployeeId = extractObjectId(req.user.employeeId);
            const requestedEmployeeId = extractObjectId(employeeId);
            
            if (!clientEmployeeId || !requestedEmployeeId || clientEmployeeId !== requestedEmployeeId) {
                return res.status(403).json({ error: 'You can only update your own attendance' });
            }
        }
        
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        // Find or create attendance record
        let attendanceRecord = await Attendance.findOne({
            employeeId: employeeId,
            month: monthNum,
            year: yearNum,
        });
        
        if (!attendanceRecord) {
            attendanceRecord = new Attendance({
                employeeId: employeeId,
                month: monthNum,
                year: yearNum,
            });
        }
        
        // Ensure attendance array is long enough
        if (!Array.isArray(attendanceRecord.attendance)) {
            attendanceRecord.attendance = [];
        }
        while (attendanceRecord.attendance.length <= dayIdx) {
            attendanceRecord.attendance.push(null);
        }
        
        // Update attendance status
        if (status !== undefined) {
            attendanceRecord.attendance[dayIdx] = status;
        }
        
        // Update overtime
        if (overtime !== undefined) {
            if (!attendanceRecord.overtime) {
                attendanceRecord.overtime = new Map();
            }
            const parsedOvertime = parseFloat(overtime);
            if (!isNaN(parsedOvertime) && parsedOvertime > 0) {
                attendanceRecord.overtime.set(dayIndex.toString(), parsedOvertime);
            } else {
                attendanceRecord.overtime.delete(dayIndex.toString());
            }
        }
        
        await attendanceRecord.save();
        
        res.json({ message: 'Attendance updated successfully' });
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;

