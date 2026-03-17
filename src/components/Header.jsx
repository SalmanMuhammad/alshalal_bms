import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, Home, Shield, FileText, Users, Menu, ChevronDown, Plus, List } from 'lucide-react';

function Header({ user, onLogout, onNavigateHome, currentView, onNavigate }) {
    const isAdmin = user?.role === 'admin';
    const [showNavDropdown, setShowNavDropdown] = useState(false);
    const [showQuotationDropdown, setShowQuotationDropdown] = useState(false);
    const quotationDropdownRef = useRef(null);
    const navDropdownRef = useRef(null);

    const navigationItems = isAdmin ? [
        { id: 'attendance', label: 'Attendance', icon: Users, view: 'attendance' },
    ] : [
        { id: 'attendance', label: 'My Attendance', icon: Users, view: 'attendance' },
    ];

    const quotationItems = [
        { id: 'quotation-create', label: 'Create Quotation', icon: Plus, view: 'quotation', action: () => onNavigate('quotation', null) },
        { id: 'quotation-list', label: 'View All Quotations', icon: List, view: 'quotation-list', action: () => onNavigate('quotation-list') },
    ];

    const handleNavigation = (view) => {
        if (onNavigate) {
            onNavigate(view);
        }
        setShowNavDropdown(false);
        setShowQuotationDropdown(false);
    };

    const handleQuotationAction = (action) => {
        if (action) {
            action();
        }
        setShowQuotationDropdown(false);
        setShowNavDropdown(false);
    };

    const isActive = (view) => {
        if (view === 'quotation' || view === 'quotation-list') {
            return currentView === 'quotation' || currentView === 'quotation-list';
        }
        return currentView === view;
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (quotationDropdownRef.current && !quotationDropdownRef.current.contains(event.target)) {
                setShowQuotationDropdown(false);
            }
            if (navDropdownRef.current && !navDropdownRef.current.contains(event.target)) {
                setShowNavDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <nav className="no-print bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
            <div className="w-full px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Company Logo - Clickable to Dashboard */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <button
                            onClick={onNavigateHome}
                            className="flex items-center gap-3 group transition-all duration-200 hover:opacity-80"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-2 shadow-md group-hover:shadow-lg transition-shadow">
                                    <img 
                                        src="/company_logo.png" 
                                        alt="Company Logo" 
                                        className="w-10 h-10 object-contain"
                                    />
                                </div>
                            </div>
                        </button>
                        
                        {/* Company Info */}
                        <div className="hidden md:flex flex-col justify-center border-l border-slate-200 pl-4 h-full text-left">
                            <h1 className="text-sm font-bold text-slate-900 leading-tight">
                                AMAL SAAD SULAIMAN
                            </h1>
                            <p className="text-[10px] font-semibold text-slate-600 leading-tight">
                                AL-SUBHI TRADING & EST.
                            </p>
                            {/* <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-slate-500 font-medium">
                                    VAT: 310320454300003
                                </span>
                                <span className="text-[9px] text-slate-400">•</span>
                                <span className="text-[9px] text-slate-500 font-medium">
                                    CR: 40326322
                                </span>
                            </div> */}
                        </div>
                    </div>
                    
                    {/* Center: Navigation Menu (Desktop) */}
                    {isAdmin && (
                        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
                            {/* Quotations Dropdown */}
                            <div className="relative" ref={quotationDropdownRef}>
                                <button
                                    onClick={() => setShowQuotationDropdown(!showQuotationDropdown)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                        isActive('quotation') || isActive('quotation-list')
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
                                    }`}
                                >
                                    <FileText className="w-4 h-4" />
                                    Quotations
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showQuotationDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {showQuotationDropdown && (
                                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 overflow-hidden">
                                        {quotationItems.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.view);
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleQuotationAction(item.action)}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 ${
                                                        active
                                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                                            : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span>{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.view);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavigation(item.view)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                            active
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Right: User Info & Logout */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Navigation Dropdown (Mobile/Tablet for Admin) */}
                        {isAdmin && (
                            <div className="lg:hidden relative" ref={navDropdownRef}>
                                <button
                                    onClick={() => setShowNavDropdown(!showNavDropdown)}
                                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                                
                                {showNavDropdown && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 overflow-hidden">
                                        {/* Quotations Section in Mobile Menu */}
                                        <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                            Quotations
                                        </div>
                                        {quotationItems.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.view);
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleQuotationAction(item.action)}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 ${
                                                        active
                                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                                            : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {item.label}
                                                </button>
                                            );
                                        })}
                                        
                                        <div className="border-t border-slate-200 mt-1 pt-1">
                                            {navigationItems.map((item) => {
                                                const Icon = item.icon;
                                                const active = isActive(item.view);
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleNavigation(item.view)}
                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 ${
                                                            active
                                                                ? 'bg-blue-50 text-blue-700 font-medium'
                                                                : 'text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        {item.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* User Info (Desktop) */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-slate-900 leading-tight">
                                    {user?.employee?.name || user?.username}
                                </p>
                                <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    isAdmin 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {isAdmin ? (
                                        <>
                                            <Shield className="w-2.5 h-2.5 inline mr-1" />
                                            Admin
                                        </>
                                    ) : (
                                        'Employee'
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Mobile User Avatar */}
                        <div className="sm:hidden relative">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        
                        {/* Logout Button */}
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Header;

