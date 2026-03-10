import React from 'react';
import { LogOut, User, FileText, Users, Calendar, TrendingUp, Shield, ArrowRight, Sparkles } from 'lucide-react';

function LandingPage({ onNavigate, user, onLogout }) {
    const isAdmin = user?.role === 'admin';
    const isClient = user?.role === 'client';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Top Navigation Bar - Modern Design */}
                <nav className="bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-lg sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-20">
                            {/* Left: Company Logo & Info */}
                            <div className="flex items-center gap-4 flex-1">
                                {/* Logo Container */}
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                    <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-3 shadow-xl border border-white/20">
                                        <img 
                                            src="/company_logo.png" 
                                            alt="Company Logo" 
                                            className="w-14 h-14 object-contain drop-shadow-lg"
                                        />
                                    </div>
                                </div>
                                
                                {/* Company Info */}
                                <div className="hidden md:block border-l border-slate-200 pl-4">
                                    <div className="flex flex-col">
                                        <h1 className="text-xl font-bold text-slate-900 leading-tight">
                                            AMAL SAAD SULAIMAN
                                        </h1>
                                        <p className="text-sm font-semibold text-slate-600">
                                            AL-SUBHI TRADING & EST.
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-slate-500 font-medium">
                                                VAT: 310320454300003
                                            </span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-slate-500 font-medium">
                                                CR: 40326322
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Mobile Company Name */}
                                <div className="md:hidden">
                                    <h1 className="text-base font-bold text-slate-900">Business Management</h1>
                                    <p className="text-xs text-slate-500">Dashboard</p>
                                </div>
                            </div>
                            
                            {/* Right: User Profile & Actions */}
                            <div className="flex items-center gap-3">
                                {/* User Profile Card */}
                                <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 group">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                                    </div>
                                    
                                    {/* User Info */}
                                    <div className="text-left min-w-[120px]">
                                        <p className="text-sm font-bold text-slate-900 leading-tight">
                                            {user?.employee?.name || user?.username}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-slate-600">
                                                {isAdmin ? 'Administrator' : 'Employee'}
                                            </p>
                                            <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                isAdmin 
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
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
                                </div>
                                
                                {/* Mobile User Avatar */}
                                <div className="sm:hidden relative">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        isAdmin 
                                            ? 'bg-blue-500 text-white' 
                                            : 'bg-emerald-500 text-white'
                                    }`}>
                                        {isAdmin ? 'A' : 'E'}
                                    </div>
                                </div>
                                
                                {/* Logout Button */}
                                <button
                                    onClick={onLogout}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 rounded-xl transition-all duration-200 font-semibold text-sm border border-red-200/60 hover:border-red-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl w-full">
                        {/* Welcome Section */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/50 rounded-full mb-4">
                                <Sparkles className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-700">Welcome Back</span>
                            </div>
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
                                AMAL SAAD SULAIMAN
                            </h2>
                            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-700 mb-3">
                                AL-SUBHI TRADING & EST.
                            </h3>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Streamline your business operations with our comprehensive management system
                            </p>
                        </div>

                        {/* Feature Cards Grid */}
                        <div className={`grid ${isAdmin ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6 mb-8 max-w-5xl mx-auto`}>
                            {/* Quotation System - Admin Only */}
                            {isAdmin && (
                                <div 
                                    className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100"
                                    onClick={() => onNavigate('quotation', null)}
                                >
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    
                                    {/* Content */}
                                    <div className="relative p-8">
                                        {/* Icon */}
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            <FileText className="w-8 h-8 text-white" />
                                        </div>
                                        
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Quotation System</h3>
                                        <p className="text-slate-600 mb-6 leading-relaxed">
                                            Create professional quotations with automatic VAT calculations, customizable templates, and instant PDF export
                                        </p>
                                        
                                        {/* Features List */}
                                        <ul className="space-y-2 mb-6">
                                            <li className="flex items-center gap-2 text-sm text-slate-600">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                Automatic calculations
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-slate-600">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                VAT & tax management
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-slate-600">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                PDF export & printing
                                            </li>
                                        </ul>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex flex-col gap-3">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNavigate('quotation', null);
                                                }}
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group-hover:from-blue-700 group-hover:to-indigo-700"
                                            >
                                                Create New Quotation
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNavigate('quotation-list');
                                                }}
                                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 border border-slate-200"
                                            >
                                                View All Quotations
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Attendance & HR - Both Admin and Client */}
                            <div 
                                className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 cursor-pointer"
                                onClick={() => onNavigate('attendance')}
                            >
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                {/* Content */}
                                <div className="relative p-8">
                                    {/* Icon */}
                                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <Users className="w-8 h-8 text-white" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                                        {isAdmin ? 'Attendance & HR' : 'My Attendance'}
                                    </h3>
                                    <p className="text-slate-600 mb-6 leading-relaxed">
                                        {isAdmin 
                                            ? 'Comprehensive employee management with attendance tracking, payroll processing, overtime management, and performance analytics'
                                            : 'Mark your daily attendance, track your working hours, and manage your overtime entries'
                                        }
                                    </p>
                                    
                                    {/* Features List */}
                                    <ul className="space-y-2 mb-6">
                                        {isAdmin ? (
                                            <>
                                                <li className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar className="w-4 h-4 text-emerald-500" />
                                                    Attendance tracking
                                                </li>
                                                <li className="flex items-center gap-2 text-sm text-slate-600">
                                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                    Payroll management
                                                </li>
                                                <li className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Users className="w-4 h-4 text-emerald-500" />
                                                    Employee analytics
                                                </li>
                                            </>
                                        ) : (
                                            <>
                                                <li className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar className="w-4 h-4 text-emerald-500" />
                                                    Daily attendance marking
                                                </li>
                                                <li className="flex items-center gap-2 text-sm text-slate-600">
                                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                    Overtime tracking
                                                </li>
                                                <li className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Users className="w-4 h-4 text-emerald-500" />
                                                    Personal records
                                                </li>
                                            </>
                                        )}
                                    </ul>
                                    
                                    {/* Action Button */}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigate('attendance');
                                        }}
                                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group-hover:from-emerald-700 group-hover:to-teal-700"
                                    >
                                        {isAdmin ? 'Manage Attendance' : 'View My Attendance'}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="max-w-5xl mx-auto mt-12 pt-8 border-t border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Registration</p>
                                    <p className="text-sm text-slate-700">VAT NO. 310320454300003</p>
                                    <p className="text-sm text-slate-700">CR: 40326322</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Location</p>
                                    <p className="text-sm text-slate-700">KINGDOM OF SAUDI ARABIA</p>
                                    <p className="text-sm text-slate-700">JEDDAH · P.O.BOX 22341</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Contact</p>
                                    <p className="text-sm text-slate-700">+966 55 051 9620</p>
                                    <p className="text-sm text-slate-700">alshallaltawafaq@gmail.com</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}

export default LandingPage;

