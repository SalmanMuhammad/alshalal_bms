import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, Download, Plus, Printer, Save } from 'lucide-react';
import { currency } from '../utils/helpers';

const steps = [
    { id: 'overview', label: 'Overview' },
    { id: 'client', label: 'Client' },
    { id: 'items', label: 'Items' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'notes', label: 'Notes' },
    { id: 'review', label: 'Review' },
];

function MobileSection({ title, eyebrow, children }) {
    return (
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{eyebrow}</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{title}</h3>
            <div className="mt-5 space-y-4">{children}</div>
        </section>
    );
}

function Field({ label, children }) {
    return (
        <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{label}</span>
            <div className="mt-2">{children}</div>
        </label>
    );
}

function QuotationMobileWizard({
    documentNumber,
    setDocumentNumber,
    quotationDate,
    setQuotationDate,
    customerEmail,
    setCustomerEmail,
    client,
    setClient,
    items,
    updateItem,
    addItem,
    removeItem,
    vatPercentage,
    setVatPercentage,
    hasTransportation,
    setHasTransportation,
    transportationCharges,
    setTransportationCharges,
    paymentDetails,
    setPaymentDetails,
    notes,
    setNotes,
    terms,
    setTerms,
    totals,
    saving,
    isEditMode,
    expiryDate,
    onNavigate,
    onSave,
    onPrint,
}) {
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const activeStep = steps[activeStepIndex];
    const canGoBack = activeStepIndex > 0;
    const canGoForward = activeStepIndex < steps.length - 1;

    const stepSummary = useMemo(() => ({
        items: items.length,
        total: currency(totals.balance),
    }), [items.length, totals.balance]);

    return (
        <div className="lg:hidden print:hidden space-y-4">
            <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-blue-700 p-5 text-white shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-blue-200">Mobile Quotation Flow</p>
                        <h2 className="mt-2 text-2xl font-bold">{isEditMode ? 'Update Quotation' : 'Create Quotation'}</h2>
                        <p className="mt-1 text-sm text-blue-100">Complete the form in guided steps. The PDF and print layout will still use the A4 quotation design.</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-blue-200">Total</p>
                        <p className="mt-2 text-xl font-bold">{stepSummary.total}</p>
                    </div>
                </div>
            </section>

            <div className="flex gap-3 overflow-x-auto pb-1">
                {steps.map((step, index) => (
                    <button
                        key={step.id}
                        type="button"
                        onClick={() => setActiveStepIndex(index)}
                        className={clsx(
                            'min-w-[108px] rounded-2xl border px-4 py-3 text-left transition',
                            index === activeStepIndex
                                ? 'border-blue-500 bg-blue-600 text-white shadow-lg'
                                : 'border-slate-200 bg-white text-slate-700'
                        )}
                    >
                        <div className="text-[10px] uppercase tracking-[0.22em] opacity-70">Step {index + 1}</div>
                        <div className="mt-1 font-semibold">{step.label}</div>
                    </button>
                ))}
            </div>

            {activeStep.id === 'overview' && (
                <MobileSection eyebrow="Step 1" title="Document Overview">
                    <Field label="Document Number">
                        <input
                            type="text"
                            value={documentNumber}
                            onChange={(e) => setDocumentNumber(e.target.value)}
                            className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                        />
                    </Field>
                    <Field label="Quotation Date">
                        <input
                            type="date"
                            value={quotationDate}
                            onChange={(e) => setQuotationDate(e.target.value)}
                            className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                        />
                    </Field>
                    <Field label="Customer Email">
                        <input
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            placeholder="customer@example.com"
                            className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                        />
                    </Field>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                        <p className="font-semibold">Expiry Date</p>
                        <p className="mt-1">{expiryDate}</p>
                    </div>
                </MobileSection>
            )}

            {activeStep.id === 'client' && (
                <MobileSection eyebrow="Step 2" title="Client Information">
                    <Field label="Company">
                        <input
                            type="text"
                            value={client.company}
                            onChange={(e) => setClient((current) => ({ ...current, company: e.target.value }))}
                            className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                        />
                    </Field>
                    <Field label="Phone">
                        <input
                            type="tel"
                            value={client.phone}
                            onChange={(e) => setClient((current) => ({ ...current, phone: e.target.value }))}
                            className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                        />
                    </Field>
                    <Field label="CR">
                        <input
                            type="text"
                            value={client.cr}
                            onChange={(e) => setClient((current) => ({ ...current, cr: e.target.value }))}
                            className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                        />
                    </Field>
                    <Field label="VAT">
                        <input
                            type="text"
                            value={client.vat}
                            onChange={(e) => setClient((current) => ({ ...current, vat: e.target.value }))}
                            className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                        />
                    </Field>
                </MobileSection>
            )}

            {activeStep.id === 'items' && (
                <MobileSection eyebrow="Step 3" title="Line Items">
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Item {index + 1}</p>
                                        <p className="text-sm font-semibold text-slate-800">{currency(totals.rows[item.id]?.subtotal || 0)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        disabled={items.length <= 3}
                                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 disabled:opacity-40"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <Field label="Description">
                                    <textarea
                                        rows="4"
                                        value={item.description}
                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                        className="w-full bg-transparent text-sm text-slate-900 outline-none"
                                    />
                                </Field>
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <Field label="Quantity">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                            className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                                        />
                                    </Field>
                                    <Field label="Unit Price">
                                        <input
                                            type="number"
                                            value={item.price}
                                            onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                            className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                                        />
                                    </Field>
                                    <Field label="Discount %">
                                        <input
                                            type="number"
                                            value={item.discount}
                                            onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                                            className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                                        />
                                    </Field>
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                        <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-600">VAT</p>
                                        <p className="mt-2 text-base font-bold text-emerald-800">{currency(totals.rows[item.id]?.vat || 0)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addItem}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Add Item
                    </button>
                </MobileSection>
            )}

            {activeStep.id === 'pricing' && (
                <MobileSection eyebrow="Step 4" title="Pricing & Payment">
                    <div className="grid grid-cols-1 gap-4">
                        <Field label="VAT Percentage">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={vatPercentage}
                                onChange={(e) => setVatPercentage(Number(e.target.value) || 0)}
                                className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                            />
                        </Field>

                        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Transportation</p>
                                <p className="mt-1 text-base font-semibold text-slate-900">Include extra transport charges</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={hasTransportation}
                                onChange={(e) => {
                                    setHasTransportation(e.target.checked);
                                    if (!e.target.checked) {
                                        setTransportationCharges(0);
                                    }
                                }}
                                className="h-5 w-5 rounded border-slate-300 text-blue-600"
                            />
                        </label>

                        {hasTransportation && (
                            <Field label="Transportation Charges">
                                <input
                                    type="number"
                                    value={transportationCharges}
                                    onChange={(e) => setTransportationCharges(Number(e.target.value) || 0)}
                                    className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                                />
                            </Field>
                        )}

                        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
                            <p className="text-[10px] uppercase tracking-[0.24em] text-blue-500">Live Summary</p>
                            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-800">
                                <div className="flex justify-between">
                                    <span>Total</span>
                                    <span>{currency(totals.total)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>VAT</span>
                                    <span>{currency(totals.vat)}</span>
                                </div>
                                {hasTransportation && totals.transport > 0 && (
                                    <div className="flex justify-between">
                                        <span>Transport</span>
                                        <span>{currency(totals.transport)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-blue-200 pt-3 text-base text-blue-950">
                                    <span>Balance</span>
                                    <span>{currency(totals.balance)}</span>
                                </div>
                            </div>
                        </div>

                        <Field label="Bank Name">
                            <input
                                type="text"
                                value={paymentDetails.bankName}
                                onChange={(e) => setPaymentDetails((current) => ({ ...current, bankName: e.target.value }))}
                                className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                            />
                        </Field>
                        <Field label="Account Number">
                            <input
                                type="text"
                                value={paymentDetails.accountNumber}
                                onChange={(e) => setPaymentDetails((current) => ({ ...current, accountNumber: e.target.value }))}
                                className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                            />
                        </Field>
                        <Field label="IBAN">
                            <input
                                type="text"
                                value={paymentDetails.iban}
                                onChange={(e) => setPaymentDetails((current) => ({ ...current, iban: e.target.value }))}
                                className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                            />
                        </Field>
                    </div>
                </MobileSection>
            )}

            {activeStep.id === 'notes' && (
                <MobileSection eyebrow="Step 5" title="Notes & Terms">
                    <Field label="Notes">
                        <textarea
                            rows="5"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-transparent text-sm text-slate-900 outline-none"
                        />
                    </Field>
                    <Field label="Terms & Conditions">
                        <textarea
                            rows="5"
                            value={terms}
                            onChange={(e) => setTerms(e.target.value)}
                            className="w-full bg-transparent text-sm text-slate-900 outline-none"
                        />
                    </Field>
                </MobileSection>
            )}

            {activeStep.id === 'review' && (
                <MobileSection eyebrow="Step 6" title="Review & Export">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Quotation Snapshot</p>
                        <div className="mt-4 space-y-3 text-sm text-slate-700">
                            <div className="flex justify-between">
                                <span>Document</span>
                                <span className="font-semibold text-slate-900">#{documentNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Client</span>
                                <span className="font-semibold text-slate-900">{client.company || 'Not entered yet'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Items</span>
                                <span className="font-semibold text-slate-900">{stepSummary.items}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Balance</span>
                                <span className="font-semibold text-blue-900">{stepSummary.total}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? 'Saving...' : isEditMode ? 'Update Quotation' : 'Save Quotation'}
                        </button>
                        <button
                            type="button"
                            onClick={onPrint}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
                        >
                            <Download className="h-4 w-4" />
                            Save as PDF
                        </button>
                        <button
                            type="button"
                            onClick={onPrint}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </button>
                        <button
                            type="button"
                            onClick={() => onNavigate('quotation-list')}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to List
                        </button>
                    </div>
                </MobileSection>
            )}

            <div className="sticky bottom-3 z-10 rounded-3xl bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setActiveStepIndex((current) => Math.max(0, current - 1))}
                        disabled={!canGoBack}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    <div className="min-w-[84px] text-center text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">
                        {activeStepIndex + 1} / {steps.length}
                    </div>
                    <button
                        type="button"
                        onClick={() => setActiveStepIndex((current) => Math.min(steps.length - 1, current + 1))}
                        disabled={!canGoForward}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
                    >
                        Next
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuotationMobileWizard;
