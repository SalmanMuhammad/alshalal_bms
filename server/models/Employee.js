import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    position: {
        type: String,
        default: 'Labor',
    },
    // Notes are now stored in Attendance model (month-specific)
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

export default mongoose.model('Employee', employeeSchema);

