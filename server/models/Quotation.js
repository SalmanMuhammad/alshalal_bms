import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
    documentNumber: {
        type: String,
        required: true,
        index: true,
    },
    quotationDate: {
        type: Date,
        required: true,
    },
    client: {
        company: { type: String, default: '' },
        phone: { type: String, default: '' },
        cr: { type: String, default: '' },
        vat: { type: String, default: '' },
    },
    items: [{
        id: { type: Number, required: true },
        description: { type: String, default: '' },
        quantity: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
    }],
    vatPercentage: {
        type: Number,
        default: 15,
    },
    hasTransportation: {
        type: Boolean,
        default: false,
    },
    transportationCharges: {
        type: Number,
        default: 0,
    },
    notes: {
        type: String,
        default: '',
    },
    terms: {
        type: String,
        default: '',
    },
    customerEmail: {
        type: String,
        default: '',
    },
    paymentDetails: {
        bankName: { type: String, default: 'AL-RAJHI BANK' },
        accountNumber: { type: String, default: '463608016082133' },
        iban: { type: String, default: 'SA3580000463608016082133' },
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

// Index for faster queries
quotationSchema.index({ documentNumber: 1 });
quotationSchema.index({ quotationDate: -1 });
quotationSchema.index({ createdAt: -1 });

export default mongoose.model('Quotation', quotationSchema);

