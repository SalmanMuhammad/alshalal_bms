import express from 'express';
import Quotation from '../models/Quotation.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All quotation routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get all quotations
router.get('/', async (req, res) => {
    try {
        const quotations = await Quotation.find()
            .sort({ createdAt: -1 }) // Most recent first
            .select('documentNumber quotationDate client createdAt updatedAt');
        
        res.json(quotations);
    } catch (error) {
        console.error('Error fetching quotations:', error);
        res.status(500).json({ error: 'Failed to fetch quotations' });
    }
});

// Get single quotation by ID
router.get('/:id', async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        
        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        
        res.json(quotation);
    } catch (error) {
        console.error('Error fetching quotation:', error);
        res.status(500).json({ error: 'Failed to fetch quotation' });
    }
});

// Create new quotation
router.post('/', async (req, res) => {
    try {
        const quotationData = req.body;
        
        // Validate required fields
        if (!quotationData.documentNumber || !quotationData.quotationDate) {
            return res.status(400).json({ error: 'Document number and date are required' });
        }
        
        const quotation = new Quotation(quotationData);
        await quotation.save();
        
        res.status(201).json(quotation);
    } catch (error) {
        console.error('Error creating quotation:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create quotation' });
    }
});

// Update quotation
router.put('/:id', async (req, res) => {
    try {
        const quotation = await Quotation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        
        res.json(quotation);
    } catch (error) {
        console.error('Error updating quotation:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update quotation' });
    }
});

// Delete quotation
router.delete('/:id', async (req, res) => {
    try {
        const quotation = await Quotation.findByIdAndDelete(req.params.id);
        
        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        
        res.json({ message: 'Quotation deleted successfully' });
    } catch (error) {
        console.error('Error deleting quotation:', error);
        res.status(500).json({ error: 'Failed to delete quotation' });
    }
});

export default router;

