import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Calendar, Building2, Search, ArrowRight, Eye } from 'lucide-react';
import { quotationAPI } from '../utils/api';
import Header from './Header';

function QuotationList({ onNavigate, onEditQuotation, user, onLogout }) {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadQuotations();
    }, []);

    const loadQuotations = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await quotationAPI.getAll();
            setQuotations(data);
        } catch (err) {
            console.error('Error loading quotations:', err);
            setError(err.message || 'Failed to load quotations');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, documentNumber) => {
        if (!window.confirm(`Are you sure you want to delete quotation #${documentNumber}?`)) {
            return;
        }

        try {
            await quotationAPI.delete(id);
            await loadQuotations(); // Reload list
        } catch (err) {
            console.error('Error deleting quotation:', err);
            alert('Failed to delete quotation: ' + (err.message || 'Unknown error'));
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const filteredQuotations = quotations.filter(q => {
        const search = searchTerm.toLowerCase();
        return (
            q.documentNumber?.toLowerCase().includes(search) ||
            q.client?.company?.toLowerCase().includes(search) ||
            q.client?.phone?.toLowerCase().includes(search)
        );
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Loading quotations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navigation Header */}
            <Header 
                user={user} 
                onLogout={onLogout} 
                onNavigateHome={() => onNavigate('landing')}
                currentView="quotation-list"
                onNavigate={onNavigate}
            />
            
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">Quotation Management</h1>
                            <p className="text-slate-600">View and manage all your quotations</p>
                        </div>
                        <button
                            onClick={() => onNavigate('quotation', null)}
                            className="bg-white/15 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20 text-white font-semibold shadow-lg hover:bg-white/20 transition-all duration-200 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create New Quotation
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl relative flex items-center gap-2">
                        <span className="flex-1">{error}</span>
                        <button
                            className="text-red-500 hover:text-red-700 font-bold text-xl leading-none"
                            onClick={() => setError(null)}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Quotations List */}
                {filteredQuotations.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200/60">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <FileText className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">
                            {searchTerm ? 'No quotations found' : 'No quotations yet'}
                        </h3>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            {searchTerm 
                                ? 'Try adjusting your search terms or create a new quotation'
                                : 'Create your first professional quotation to get started'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => onNavigate('quotation', null)}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 mx-auto"
                            >
                                <Plus className="w-5 h-5" />
                                Create New Quotation
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredQuotations.map((quotation) => (
                            <div
                                key={quotation._id}
                                className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200/60 hover:border-blue-300"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-xs font-bold text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-full border border-blue-200">
                                                    #{quotation.documentNumber}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                                {quotation.client?.company || 'No Company Name'}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 mb-5 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                                <Calendar className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span className="font-medium">{formatDate(quotation.quotationDate)}</span>
                                        </div>
                                        {quotation.client?.phone && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                                    <Building2 className="w-4 h-4 text-indigo-600" />
                                                </div>
                                                <span className="font-medium">{quotation.client.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => onEditQuotation(quotation._id)}
                                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(quotation._id, quotation.documentNumber)}
                                            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl hover:text-red-700 font-semibold transition-all duration-200 flex items-center justify-center border border-red-200 hover:border-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default QuotationList;

