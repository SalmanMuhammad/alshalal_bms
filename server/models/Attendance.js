import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true,
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },
    year: {
        type: Number,
        required: true,
    },
    // Payroll information for this month
    salaryType: {
        type: String,
        enum: ['Fixed', 'Daily'],
        default: 'Fixed',
    },
    basicSalary: {
        type: Number,
        default: 0,
    },
    pendingSalary: {
        type: Number,
        default: 0,
    },
    bonus: {
        type: Number,
        default: 0,
    },
    fine: {
        type: Number,
        default: 0,
    },
    paidAmount: {
        type: Number,
        default: 0,
    },
    // Attendance data
    attendance: {
        type: [String], // Array of attendance status for each day: 'present', 'absent', 'dayoff', null
        default: [],
    },
    overtime: {
        type: Map,
        of: Number, // Map of day index to overtime hours
        default: new Map(),
    },
    transferredPending: {
        type: Number,
        default: null, // Amount transferred from previous month, null if not transferred
    },
    notes: {
        type: String,
        default: '', // Notes specific to this month for this employee
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

// Compound index to ensure one attendance record per employee per month-year
attendanceSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);

