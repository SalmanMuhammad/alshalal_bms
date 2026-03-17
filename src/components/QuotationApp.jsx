import React, { useState, useMemo, useEffect } from 'react';
import { emptyItem, currency, addDays } from '../utils/helpers';
import { quotationAPI } from '../utils/api';
import { Save, ArrowLeft, Loader2, CheckCircle, XCircle, X, FileText, Printer, Download } from 'lucide-react';
import Header from './Header';
import QuotationMobileWizard from './QuotationMobileWizard';

function QuotationApp({ onNavigate, quotationId = null, user, onLogout }) {
    const today = new Date().toISOString().split('T')[0];
    const [documentNumber, setDocumentNumber] = useState('295');
    const [quotationDate, setQuotationDate] = useState(today);
    const [client, setClient] = useState({
        company: '',
        phone: '',
        cr: '',
        vat: '',
    });
    const [items, setItems] = useState([emptyItem(1), emptyItem(2), emptyItem(3)]);
    const [vatPercentage, setVatPercentage] = useState(15);
    const [hasTransportation, setHasTransportation] = useState(false);
    const [transportationCharges, setTransportationCharges] = useState(0);
    const [notes, setNotes] = useState('1. 30 DAYS AFTER THE ADVANCE PAYMENT\n2. 100% ADVANCE PAYMENT');
    const [terms, setTerms] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [paymentDetails, setPaymentDetails] = useState({
        bankName: 'AL-RAJHI BANK',
        iban: 'SA3580000463608016082133',
        accountNumber: '463608016082133'
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isEditMode, setIsEditMode] = useState(quotationId !== null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const expiryDate = useMemo(() => addDays(quotationDate, 30), [quotationDate]);

    const totals = useMemo(() => {
        const summary = items.reduce((acc, item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            const discount = Number(item.discount) || 0;
            const subtotal = qty * price;
            const discounted = subtotal - (subtotal * discount) / 100;
            const vat = discounted * (vatPercentage / 100);
            acc.total += discounted;
            acc.vat += vat;
            acc.rows[item.id] = {
                subtotal: discounted,
                vat,
            };
            return acc;
        }, { total: 0, vat: 0, rows: {} });

        const transport = hasTransportation ? (Number(transportationCharges) || 0) : 0;
        const balance = summary.total + summary.vat + transport;
        return { ...summary, transport, balance };
    }, [items, vatPercentage, hasTransportation, transportationCharges]);

    const updateItem = (id, field, value) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const addItem = () => {
        setItems((prev) => [...prev, emptyItem(prev.length ? prev[prev.length - 1].id + 1 : 1)]);
    };

    const removeItem = (id) => {
        setItems((prev) => (prev.length <= 3 ? prev : prev.filter((item) => item.id !== id)));
    };

    // Load quotation data if editing
    useEffect(() => {
        if (quotationId) {
            loadQuotation();
        }
    }, [quotationId]);

    const loadQuotation = async () => {
        try {
            setLoading(true);
            setError(null);
            const quotation = await quotationAPI.getById(quotationId);
            
            // Populate form with quotation data
            setDocumentNumber(quotation.documentNumber || '');
            setQuotationDate(quotation.quotationDate ? new Date(quotation.quotationDate).toISOString().split('T')[0] : today);
            setClient(quotation.client || { company: '', phone: '', cr: '', vat: '' });
            setItems(quotation.items && quotation.items.length > 0 ? quotation.items : [emptyItem(1), emptyItem(2), emptyItem(3)]);
            setVatPercentage(quotation.vatPercentage || 15);
            setHasTransportation(quotation.hasTransportation || false);
            setTransportationCharges(quotation.transportationCharges || 0);
            setNotes(quotation.notes || '1. 30 DAYS AFTER THE ADVANCE PAYMENT\n2. 100% ADVANCE PAYMENT');
            setTerms(quotation.terms || '');
            setCustomerEmail(quotation.customerEmail || '');
            setPaymentDetails(quotation.paymentDetails || {
                bankName: 'AL-RAJHI BANK',
                iban: 'SA3580000463608016082133',
                accountNumber: '463608016082133'
            });
        } catch (err) {
            console.error('Error loading quotation:', err);
            setError(err.message || 'Failed to load quotation');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            const quotationData = {
                documentNumber,
                quotationDate,
                client,
                items,
                vatPercentage,
                hasTransportation,
                transportationCharges,
                notes,
                terms,
                customerEmail,
                paymentDetails,
            };

            if (isEditMode && quotationId) {
                await quotationAPI.update(quotationId, quotationData);
                setModalMessage('Quotation updated successfully!');
                setShowSuccessModal(true);
                
                // Auto-close and navigate after 1.5 seconds
                setTimeout(() => {
                    setShowSuccessModal(false);
                    onNavigate('quotation-list');
                }, 1500);
            } else {
                await quotationAPI.create(quotationData);
                setModalMessage('Quotation saved successfully!');
                setShowSuccessModal(true);
                
                // Auto-close and navigate after 1.5 seconds
                setTimeout(() => {
                    setShowSuccessModal(false);
                    onNavigate('quotation-list');
                }, 1500);
            }
        } catch (err) {
            console.error('Error saving quotation:', err);
            setError(err.message || 'Failed to save quotation');
            setModalMessage('Failed to save quotation: ' + (err.message || 'Unknown error'));
            setShowErrorModal(true);
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Loading quotation...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Navigation Header - Hidden in Print */}
            <div className="no-print">
                <Header 
                    user={user} 
                    onLogout={onLogout} 
                    onNavigateHome={() => onNavigate('landing')}
                    currentView="quotation"
                    onNavigate={onNavigate}
                />
            </div>

            <div className="px-4 py-4 sm:px-6 no-print">
                <QuotationMobileWizard
                    documentNumber={documentNumber}
                    setDocumentNumber={setDocumentNumber}
                    quotationDate={quotationDate}
                    setQuotationDate={setQuotationDate}
                    customerEmail={customerEmail}
                    setCustomerEmail={setCustomerEmail}
                    client={client}
                    setClient={setClient}
                    items={items}
                    updateItem={updateItem}
                    addItem={addItem}
                    removeItem={removeItem}
                    vatPercentage={vatPercentage}
                    setVatPercentage={setVatPercentage}
                    hasTransportation={hasTransportation}
                    setHasTransportation={setHasTransportation}
                    transportationCharges={transportationCharges}
                    setTransportationCharges={setTransportationCharges}
                    paymentDetails={paymentDetails}
                    setPaymentDetails={setPaymentDetails}
                    notes={notes}
                    setNotes={setNotes}
                    terms={terms}
                    setTerms={setTerms}
                    totals={totals}
                    saving={saving}
                    isEditMode={isEditMode}
                    expiryDate={expiryDate}
                    onNavigate={onNavigate}
                    onSave={handleSave}
                    onPrint={handlePrint}
                />
            </div>
            
            <div className="hidden min-h-screen bg-slate-50 lg:block print:block">
                <div className="w-full flex justify-center px-4 sm:px-6 lg:px-8 py-6 no-print:py-0">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden print:rounded-none print:shadow-none print:border-0 w-full max-w-[1100px]">
                    <div className="page watermark-bg w-full print:w-[210mm]">
                        <div className="content px-5 py-4 space-y-2.5 text-slate-800 w-full">
                            {/* Quotation Header */}
                            <header className="rounded-xl bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 text-white p-4 flex flex-col gap-3 shadow-lg">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex gap-3 items-center">
                                <div className="bg-white/15 backdrop-blur rounded-xl p-2.5 flex items-center justify-center flex-shrink-0">
                                    <img src="/company_logo.png" alt="Company Logo" className="w-24 h-auto object-contain drop-shadow" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] uppercase tracking-[0.25em] text-blue-200 mb-0.5">Official Quotation</p>
                                    <h1 className="text-lg font-bold tracking-wide leading-tight">AMAL SAAD SULAIMAN AL-SUBHI TRADING &amp; EST.</h1>
                                    <p className="text-[10px] text-blue-100 leading-snug mt-0.5">VAT NO. 310320454300003 · CR: 40326322 · alshallaltawafaq@gmail.com</p>
                                    <p className="text-[9px] text-blue-200 mt-0.5">KINGDOM OF SAUDI ARABIA · JEDDAH · P.O.BOX 22341 · CONTACT: +966 55 051 9620</p>
                                </div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-2.5 text-right text-xs min-w-[180px]">
                                <p className="text-[10px] uppercase tracking-widest text-blue-200 mb-1">Quotation Details</p>
                                <div className="space-y-1.5">
                                    <div>
                                        <label className="text-[11px] uppercase tracking-wide text-blue-200">Document No.</label>
                                        <input
                                            type="text"
                                            className="mt-0.5 w-full rounded-md border border-white/30 bg-white/20 px-2 py-1 text-right font-semibold backdrop-blur focus:outline-none text-[12px]"
                                            value={documentNumber}
                                            onChange={(e) => setDocumentNumber(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] uppercase tracking-wide text-blue-200">Date</label>
                                        <input
                                            type="date"
                                            className="mt-0.5 w-full rounded-md border border-white/30 bg-white/20 px-2 py-1 text-right font-semibold backdrop-blur focus:outline-none text-[12px]"
                                            value={quotationDate}
                                            onChange={(e) => setQuotationDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Client section */}
                    <section className="rounded-xl border border-blue-100 bg-white/95 backdrop-blur p-3 shadow-sm break-avoid">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-semibold">1</span>
                            <div>
                                <p className="text-[9px] uppercase tracking-[0.25em] text-blue-400">Client Information</p>
                            </div>
                        </div>
                        <div className="col-span-12 mb-2">
                            <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-slate-50 px-2 py-2.5">
                                <span className="text-[9px] font-semibold text-slate-500 whitespace-nowrap">To:</span>
                                <input
                                    type="text"
                                    className="flex-1 bg-transparent border-none text-[12px] font-semibold text-blue-900 focus:outline-none h-6"
                                    placeholder="Client company name"
                                    value={client.company}
                                    onChange={(e) => setClient((c) => ({ ...c, company: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-slate-50 px-2 py-1">
                                <span className="text-[9px] font-semibold text-slate-500 whitespace-nowrap">Phone</span>
                                <input
                                    type="tel"
                                    className="flex-1 bg-transparent border-none text-[11px] focus:outline-none"
                                    value={client.phone}
                                    onChange={(e) => setClient((c) => ({ ...c, phone: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-slate-50 px-2 py-1">
                                <span className="text-[9px] font-semibold text-slate-500 whitespace-nowrap">CR</span>
                                <input
                                    type="text"
                                    className="flex-1 bg-transparent border-none text-[11px] focus:outline-none"
                                    value={client.cr}
                                    onChange={(e) => setClient((c) => ({ ...c, cr: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-slate-50 px-2 py-1">
                                <span className="text-[9px] font-semibold text-slate-500 whitespace-nowrap">VAT</span>
                                <input
                                    type="text"
                                    className="flex-1 bg-transparent border-none text-[11px] focus:outline-none"
                                    value={client.vat}
                                    onChange={(e) => setClient((c) => ({ ...c, vat: e.target.value }))}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Statement */}
                    <div className="text-center py-1 border-y border-dashed border-emerald-400 bg-emerald-50 rounded-lg">
                        <p className="text-[10px] font-semibold text-emerald-700 tracking-[0.25em]">
                            WE ARE PLEASED TO QUOTE YOU OUR BEST PRICE FOR THE FOLLOWING
                        </p>
                    </div>

                    {/* Items table */}
                    <section className="space-y-1.5 print-table-section">
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/95 backdrop-blur">
                            <table className="w-full text-[11px] print-table">
                                <thead className="bg-blue-900 text-white uppercase text-[9px] tracking-wide">
                                    <tr>
                                        <th className="py-1 px-1 w-8">#</th>
                                        <th className="py-1 px-1 w-2/6 text-left">Product & Description</th>
                                        <th className="py-1 px-1 w-16 text-right">Qty</th>
                                        <th className="py-1 px-1 w-24 text-right">Unit Price</th>
                                        <th className="py-1 px-1 w-16 text-right">% Disc</th>
                                        <th className="py-1 px-1 w-24 text-right">Total</th>
                                        {vatPercentage > 0 && <th className="py-1 px-1 w-20 text-right">VAT {vatPercentage}%</th>}
                                        <th className="py-1 px-1 w-12 text-center no-print">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, index) => {
                                        const rowTotals = totals.rows[item.id] || { subtotal: 0, vat: 0 };
                                        const isEmpty = !item.description || item.description.trim() === '';
                                        const allEmpty = items.every(i => !i.description || i.description.trim() === '');
                                        const shouldHideInPrint = isEmpty && !(allEmpty && index === 0);
                                        const printHiddenClass = shouldHideInPrint ? 'print-hidden-row' : '';
                                        const visibleItemsBefore = items.slice(0, index).filter((i, idx) => {
                                            const iEmpty = !i.description || i.description.trim() === '';
                                            return !(iEmpty && !(allEmpty && idx === 0));
                                        }).length;
                                        const displayNumber = visibleItemsBefore + 1;

                                        return (
                                            <tr key={item.id} className={`bg-white/70 hover:bg-blue-50/40 transition ${printHiddenClass}`}>
                                                <td className="py-1.5 px-1.5 text-center font-semibold text-slate-500 align-top">
                                                    <span className="screen-row-number">{index + 1}</span>
                                                    <span className="print-row-number">{displayNumber}</span>
                                                </td>
                                                <td className="py-1.5 px-1.5 align-top">
                                                    <textarea
                                                        placeholder="Product Details"
                                                        rows="2"
                                                        className="line-item-textarea w-full border border-slate-200 rounded-md px-2 py-1 text-[11px] text-slate-800 focus:outline-blue-500 bg-white"
                                                        value={item.description}
                                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                    ></textarea>
                                                </td>
                                                <td className="py-1.5 px-1.5 text-right align-top">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        className="w-full border border-slate-200 rounded-md px-1.5 py-1 text-right font-medium focus:outline-blue-500 bg-white text-[11px]"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                                    />
                                                </td>
                                                <td className="py-1.5 px-1.5 text-right align-top">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full border border-slate-200 rounded-md px-1.5 py-1 text-right font-medium focus:outline-blue-500 bg-white text-[11px]"
                                                        value={item.price}
                                                        onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                                    />
                                                </td>
                                                <td className="py-1.5 px-1.5 text-right align-top">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        className="w-full border border-slate-200 rounded-md px-1.5 py-1 text-right font-medium focus:outline-blue-500 bg-white text-[11px]"
                                                        value={item.discount}
                                                        onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                                                    />
                                                </td>
                                                <td className="py-1.5 px-1.5 text-right font-semibold text-slate-800 align-top text-[11px]">{currency(rowTotals.subtotal)}</td>
                                                {vatPercentage > 0 && (
                                                    <td className="py-1.5 px-1.5 text-right font-semibold text-slate-800 align-top text-[11px]">{currency(rowTotals.vat)}</td>
                                                )}
                                                <td className="py-1.5 px-1.5 text-center no-print align-top">
                                                    <button
                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-40 text-[10px]"
                                                        disabled={items.length <= 3}
                                                        onClick={() => removeItem(item.id)}
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <button
                            className="no-print inline-flex items-center gap-2 rounded-full bg-blue-600/90 px-3 py-1 text-[10px] font-semibold text-white shadow shadow-blue-500/30 transition hover:bg-blue-700"
                            onClick={addItem}
                        >
                            <span className="text-base leading-none">＋</span> Add Item
                        </button>
                    </section>

                    {/* Financial summary & Payment Details */}
                    <div className="print-financial-container">
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 print-financial-section">
                            {/* VAT & Transportation Settings - Hidden in Print */}
                            <div className="no-print rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">VAT Percentage</p>
                                        <p className="text-xs font-semibold text-slate-700">Adjust VAT</p>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-right font-semibold focus:outline-blue-500 text-[11px]"
                                        value={vatPercentage}
                                        onChange={(e) => setVatPercentage(Number(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="pt-1.5 border-t border-slate-200">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div>
                                            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Transportation</p>
                                            <p className="text-xs font-semibold text-slate-700">Charges</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={hasTransportation}
                                                onChange={(e) => {
                                                    setHasTransportation(e.target.checked);
                                                    if (!e.target.checked) {
                                                        setTransportationCharges(0);
                                                    }
                                                }}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    {hasTransportation && (
                                        <div className="mt-1.5">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-right font-semibold focus:outline-blue-500 text-[11px]"
                                                value={transportationCharges}
                                                onChange={(e) => setTransportationCharges(Number(e.target.value) || 0)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[9px] text-slate-400">Changes update totals instantly.</p>
                            </div>
                            {/* Financial Summary - Full Width in Print */}
                            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-2.5 shadow-sm print-financial-summary break-avoid">
                                <h3 className="print-section-title text-[10px] uppercase tracking-[0.25em] text-blue-600 font-bold mb-1.5">Financial Summary</h3>
                                <div className="space-y-1 text-[11px] font-semibold text-blue-900">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-700">Total Amount (Without VAT):</span>
                                        <span className="text-blue-900 font-bold">{currency(totals.total)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-700">Total VAT ({vatPercentage}%):</span>
                                        <span className="text-blue-900 font-bold">{currency(totals.vat)}</span>
                                    </div>
                                    {hasTransportation && totals.transport > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-700">Transportation Charges:</span>
                                            <span className="text-blue-900 font-bold">{currency(totals.transport)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center border-t-2 border-blue-300 pt-1.5 mt-1 text-sm">
                                        <span className="text-blue-950 font-bold uppercase tracking-wide">Total / Balance:</span>
                                        <span className="text-blue-950 font-bold">{currency(totals.balance)}</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                        {/* Payment Details - Separate section, will be beside Financial Summary in print */}
                        <section className="rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-white p-2.5 shadow-sm print-payment-details break-avoid">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center text-[9px] font-bold">$</div>
                                <h3 className="text-[9px] font-bold text-slate-700 uppercase tracking-wide">Payment Details</h3>
                            </div>
                            <div className="space-y-1.5 text-[10px]">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-semibold text-slate-600 uppercase whitespace-nowrap min-w-[85px]">Our Bank:</span>
                                    <input
                                        type="text"
                                        className="flex-1 border border-emerald-200 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-800 focus:outline-emerald-500"
                                        value={paymentDetails.bankName}
                                        onChange={(e) => setPaymentDetails((p) => ({ ...p, bankName: e.target.value }))}
                                        placeholder="AL-RAJHI BANK"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-semibold text-slate-600 uppercase whitespace-nowrap min-w-[85px]">A/C No.:</span>
                                    <input
                                        type="text"
                                        className="flex-1 border border-emerald-200 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-800 focus:outline-emerald-500"
                                        value={paymentDetails.accountNumber}
                                        onChange={(e) => setPaymentDetails((p) => ({ ...p, accountNumber: e.target.value }))}
                                        placeholder="463608016082133"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-semibold text-slate-600 uppercase whitespace-nowrap min-w-[85px]">IBAN No.:</span>
                                    <input
                                        type="text"
                                        className="flex-1 border border-emerald-200 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-800 focus:outline-emerald-500"
                                        value={paymentDetails.iban}
                                        onChange={(e) => setPaymentDetails((p) => ({ ...p, iban: e.target.value }))}
                                        placeholder="SA3580000463608016082133"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Notes & terms */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="border rounded-xl p-3 bg-amber-50/80 border-amber-200 shadow-sm break-avoid">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center text-[10px] font-bold">ℹ</div>
                                <h3 className="text-[10px] font-bold text-amber-900 uppercase tracking-wide">Notes</h3>
                            </div>
                            <textarea
                                rows="3"
                                className="w-full border border-amber-200 rounded-lg px-2.5 py-1.5 text-[11px] leading-snug focus:outline-amber-500 bg-white/80 shadow-inner"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="border rounded-xl p-3 bg-sky-50/80 border-sky-200 shadow-sm break-avoid">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="h-6 w-6 rounded-full bg-sky-500/20 text-sky-700 flex items-center justify-center text-[10px] font-bold">§</div>
                                <h3 className="text-[10px] font-bold text-sky-900 uppercase tracking-wide">Terms &amp; Conditions</h3>
                            </div>
                            <textarea
                                rows="3"
                                className="w-full border border-sky-200 rounded-lg px-2.5 py-1.5 text-[11px] leading-snug focus:outline-sky-500 bg-white/80 shadow-inner"
                                value={terms}
                                onChange={(e) => setTerms(e.target.value)}
                                placeholder="Enter terms and conditions..."
                            ></textarea>
                        </div>
                    </section>

                    {/* Authorization */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        <div className="relative rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm break-avoid">
                            <h3 className="font-semibold text-slate-600 mb-0.5 uppercase text-[9px] tracking-[0.25em]">Company Representative</h3>
                            <p className="text-[10px] text-slate-500">AMAL SAAD SULAIMAN AL-SUBHI TRADING EST.</p>
                            <p className="text-[10px] text-slate-500">Represented by: Abrar Ahmed</p>
                            <p className="text-[10px] text-slate-500">Position: General Manager</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Expires On: <span className="font-semibold text-slate-800">{expiryDate}</span></p>
                            <img src="/electronic_sign-removebg-preview.png" alt="Electronic Signature" className="w-20 absolute top-1.5 right-3 opacity-80" />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm break-avoid">
                            <h3 className="font-semibold text-slate-600 mb-1 uppercase text-[9px] tracking-[0.25em]">Customer Acceptance</h3>
                            <div className="space-y-2">
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500">Signature</label>
                                    <div className="mt-1 h-7 rounded-lg border border-dashed border-slate-300"></div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500">Email</label>
                                    <input
                                        type="email"
                                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] focus:outline-blue-500"
                                        placeholder="customer@example.com"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="flex flex-col md:flex-row items-center justify-between pt-4 border-t border-slate-200 text-[9px] uppercase tracking-[0.25em] text-slate-500">
                        <p>Page 1 of 1</p>
                        <div className="flex flex-wrap gap-2 no-print mt-3 md:mt-0">
                            <button
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold shadow-sm hover:shadow transition-all duration-200 text-sm flex items-center gap-2"
                                onClick={() => onNavigate('quotation-list')}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to List
                            </button>
                            <button
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {isEditMode ? 'Update' : 'Save'}
                                    </>
                                )}
                            </button>
                            <button
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm flex items-center gap-2"
                                onClick={handlePrint}
                            >
                                <Download className="w-4 h-4" />
                                Save as PDF
                            </button>
                            <button
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold shadow-sm hover:shadow transition-all duration-200 text-sm flex items-center gap-2"
                                onClick={handlePrint}
                            >
                                <Printer className="w-4 h-4" />
                                Print
                            </button>
                        </div>
                    </footer>
                </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
                    onClick={() => {
                        setShowSuccessModal(false);
                        onNavigate('quotation-list');
                    }}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all scale-100 animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Success!</h3>
                            <p className="text-slate-600 mb-6">{modalMessage}</p>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    onNavigate('quotation-list');
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 w-full"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
                    onClick={() => setShowErrorModal(false)}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all scale-100 animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <XCircle className="w-12 h-12 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Error</h3>
                            <p className="text-slate-600 mb-6">{modalMessage}</p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowErrorModal(false)}
                                    className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 font-semibold transition-all duration-200"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setShowErrorModal(false);
                                        handleSave();
                                    }}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </>
    );
}

export default QuotationApp;
