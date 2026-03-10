import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, MessageSquare, Save, Loader2, UserPlus, CheckCircle, XCircle, X, Key } from 'lucide-react';
import clsx from 'clsx';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { generateDays, getMonthName } from '../utils/helpers';
import { attendanceAPI, employeeAPI, authAPI } from '../utils/api';
import Header from './Header';

function AttendanceHRSystem({ onNavigate, user, onLogout }) {
    const currentDate = new Date();
    const isAdmin = user?.role === 'admin';
    const isClient = user?.role === 'client';
    const clientEmployeeId = user?.employeeId;
    
    // Clients can only view current month
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    
    const days = useMemo(() => generateDays(selectedMonth, selectedYear), [selectedMonth, selectedYear]);
    const daysInMonth = days.length;
    const monthName = getMonthName(selectedMonth);

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingEmployees, setSavingEmployees] = useState(new Set()); // Track which employees are being saved
    const [error, setError] = useState(null);
    const [selectedNoteEmployee, setSelectedNoteEmployee] = useState(null);
    const [notesText, setNotesText] = useState('');
    const [hasChanges, setHasChanges] = useState(false); // Track if user has made changes
    const datePickerRef = useRef(null);
    
    // Registration modal state
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registerEmployee, setRegisterEmployee] = useState(null);
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerError, setRegisterError] = useState(null);
    const [registerSuccess, setRegisterSuccess] = useState(false);
    
    // Reset password modal state
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [resetPasswordEmployee, setResetPasswordEmployee] = useState(null);
    const [resetPassword, setResetPassword] = useState('password123');
    const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
    const [resetPasswordError, setResetPasswordError] = useState(null);
    const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
    
    // Add employee modal state
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [newEmployeeName, setNewEmployeeName] = useState('');
    const [newEmployeePosition, setNewEmployeePosition] = useState('Labor');
    const [createWithLogin, setCreateWithLogin] = useState(false);
    const [newEmployeeUsername, setNewEmployeeUsername] = useState('');
    const [newEmployeePassword, setNewEmployeePassword] = useState('password123'); // Default password

    // Helper function to initialize attendance based on dates
    const initializeAttendance = (daysArray) => {
        return daysArray.map((dayObj) => {
            if (dayObj.isFriday) {
                return 'dayoff'; // Fridays are day off
            } else if (dayObj.isFuture) {
                return null; // Future dates are blank
            } else {
                return 'absent'; // Past dates default to absent
            }
        });
    };

    // Calculate Net Salary (helper function - must be defined before use)
    // This is a pure function, so we can define it outside the component or use useCallback
    const calculateNetSalaryHelper = (emp) => {
        let base = 0;
        // Count present days (including future dates if marked), excluding dayoff
        const presentDays = emp.attendance ? emp.attendance.filter((s) => s === 'present').length : 0;
        
        // Calculate overtime hours
        const overtimeHours = emp.overtimeHours || 0;
        
        // Base salary is only paid if there is any attendance (present days) OR overtime hours
        const hasAttendanceOrOT = presentDays > 0 || overtimeHours > 0;

        if (emp.salaryType === 'Daily') {
            base = (emp.basicSalary || 0) * presentDays;
        } else {
            // For Fixed salary: only pay base if there's attendance or OT
            base = hasAttendanceOrOT ? (emp.basicSalary || 0) : 0;
        }

        const overtimeRate = emp.salaryType === 'Daily' 
            ? ((emp.basicSalary || 0) / 10) * 1.5 
            : ((emp.basicSalary || 0) / 30 / 10) * 1.5;
        const overtimePay = overtimeHours * overtimeRate;

        return (base + overtimePay + parseFloat(emp.bonus || 0) - parseFloat(emp.fine || 0) + parseFloat(emp.pendingSalary || 0)).toFixed(2);
    };

    // Get today's day index
    const todayIndex = useMemo(() => {
        if (days.length === 0) return -1;
        const index = days.findIndex(dayObj => dayObj.isToday === true);
        return index; // Returns -1 if today is not in the selected month
    }, [days]);

    // Load attendance data from API
    const loadAttendanceData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get previous month to check for remaining amounts to transfer
            const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
            const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
            
            // Load previous month data to get remaining amounts FIRST
            let prevMonthData = [];
            try {
                prevMonthData = await attendanceAPI.getByMonth(prevMonth, prevYear);
            } catch (e) {
                // Previous month might not exist, that's okay
                console.log('No previous month data found');
            }
            
            // Calculate remaining amounts from previous month for each employee
            // Also store salaryType and basicSalary for import
            const prevRemainingMap = {};
            const prevSalaryInfoMap = {}; // Store salaryType and basicSalary from previous month
            prevMonthData.forEach(prevEmp => {
                // Calculate overtime hours for previous month employee
                const prevOvertime = prevEmp.overtime || {};
                const prevOvertimeObj = prevOvertime instanceof Map 
                    ? Object.fromEntries(prevOvertime) 
                    : prevOvertime;
                const prevOvertimeHours = Object.values(prevOvertimeObj).reduce((sum, hrs) => sum + (parseFloat(hrs) || 0), 0);
                
                // Create a complete employee object with overtime hours for calculation
                const prevEmpWithOT = {
                    ...prevEmp,
                    overtimeHours: prevOvertimeHours,
                };
                
                // Calculate remaining from previous month: Net Amount - Paid Amount
                // Net Amount includes: base salary + overtime pay + bonus - fine + pending
                const prevNet = parseFloat(calculateNetSalaryHelper(prevEmpWithOT));
                const prevPaid = parseFloat(prevEmp.paidAmount || 0);
                const prevRemaining = prevNet - prevPaid;
                if (prevRemaining > 0) {
                    prevRemainingMap[prevEmp.id] = prevRemaining;
                }
                
                // Store salary info from previous month for import
                prevSalaryInfoMap[prevEmp.id] = {
                    salaryType: prevEmp.salaryType || 'Fixed',
                    basicSalary: prevEmp.basicSalary || 0,
                };
            });
            
            // Now load current month data
            const data = await attendanceAPI.getByMonth(selectedMonth, selectedYear);
            
            if (data.length === 0) {
                // No data exists for current month, but we might have employees from previous month
                // Create employees from previous month data with transferred pending
                if (prevMonthData.length > 0) {
                    const transformedData = prevMonthData.map((prevEmp) => {
                        const transferredAmount = prevRemainingMap[prevEmp.id] || 0;
                        
                        // Import salaryType and basicSalary from previous month
                        const salaryType = prevEmp.salaryType || 'Fixed';
                        const basicSalary = prevEmp.basicSalary || 0;
                        
                        return {
                            id: prevEmp.id,
                            name: prevEmp.name || `Employee`,
                            position: prevEmp.position || 'Labor',
                            // Preserve user registration info from previous month if available
                            hasUser: prevEmp.hasUser || false,
                            username: prevEmp.username || null,
                            salaryType: salaryType, // Import from previous month
                            basicSalary: basicSalary, // Import from previous month
                            pendingSalary: transferredAmount, // Transfer remaining as pending
                            bonus: 0,
                            fine: 0,
                            notes: prevEmp.notes || '',
                            paidAmount: 0, // No payment for new month yet
                            attendance: initializeAttendance(days),
                            overtime: {},
                            overtimeHours: 0,
                            transferredPending: transferredAmount > 0 ? transferredAmount : null, // Mark transfer
                        };
                    });
                    setEmployees(transformedData);
                } else {
                    setEmployees([]);
                }
            } else {
                // Transform API data to match component format
                const transformedData = data.map((emp, index) => {
                    const attendance = emp.attendance || [];
                    const overtime = emp.overtime || {};
                    
                    // Convert overtime Map/object to regular object
                    const overtimeObj = overtime instanceof Map 
                        ? Object.fromEntries(overtime) 
                        : overtime;
                    
                    // Calculate total OT hours
                    const overtimeHours = Object.values(overtimeObj).reduce((sum, hrs) => sum + (parseFloat(hrs) || 0), 0);
                    
                    // Import salaryType and basicSalary from previous month if current month has no saved data
                    // Check if this month has been saved: if salaryType is null, it means no attendance record exists yet
                    const prevSalaryInfo = prevSalaryInfoMap[emp.id];
                    const hasSavedData = emp.salaryType !== null && emp.salaryType !== undefined;
                    
                    // If month has been saved, use saved values
                    // If not saved yet, import from previous month
                    const salaryType = hasSavedData 
                        ? emp.salaryType // Use saved value
                        : (prevSalaryInfo?.salaryType || 'Fixed'); // Import from previous month
                    const basicSalary = hasSavedData
                        ? (emp.basicSalary !== null && emp.basicSalary !== undefined ? emp.basicSalary : 0) // Use saved value
                        : (prevSalaryInfo?.basicSalary || 0); // Import from previous month
                    
                    // Check if transfer from previous month has already been done for this month
                    // transferredPending flag exists and is not null means transfer was already done
                    const alreadyTransferred = emp.transferredPending !== undefined && emp.transferredPending !== null;
                    
                    // Transfer remaining from previous month to current month's pending salary
                    // Only if transfer hasn't been done yet
                    let newPendingSalary = emp.pendingSalary || 0;
                    let transferredAmount = 0;
                    if (!alreadyTransferred && prevRemainingMap[emp.id]) {
                        transferredAmount = prevRemainingMap[emp.id];
                        newPendingSalary = (emp.pendingSalary || 0) + transferredAmount;
                    }
                    
                    return {
                        id: emp.id,
                        name: emp.name || `Employee ${index + 1}`,
                        position: emp.position || 'Labor',
                        // Preserve user registration info
                        hasUser: emp.hasUser || false,
                        username: emp.username || null,
                        salaryType: salaryType, // Import from previous month if empty
                        basicSalary: basicSalary, // Import from previous month if empty
                        pendingSalary: newPendingSalary,
                        bonus: emp.bonus || 0,
                        fine: emp.fine || 0,
                        notes: emp.notes || '',
                        paidAmount: emp.paidAmount || 0, // Paid amount for this month
                        attendance: attendance.length > 0 ? attendance : initializeAttendance(days),
                        overtime: overtimeObj,
                        overtimeHours: overtimeHours,
                        transferredPending: transferredAmount > 0 ? transferredAmount : (emp.transferredPending || null), // Mark transfer amount
                    };
                });
                
                // Filter to only show client's own employee if role is client
                let filteredData = transformedData;
                if (isClient && clientEmployeeId) {
                    filteredData = transformedData.filter(emp => emp.id === clientEmployeeId);
                }
                
                setEmployees(filteredData);
                
                // Debug: Log user registration info
                if (isAdmin) {
                    console.log('Employee user registration status:', filteredData.map(emp => ({
                        id: emp.id,
                        name: emp.name,
                        hasUser: emp.hasUser,
                        username: emp.username
                    })));
                }
            }
        } catch (err) {
            console.error('Error loading attendance:', err);
            setError(err.message || 'Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear, days, isClient, clientEmployeeId, isAdmin]);

    // Save attendance data to API (debounced)
    const saveAttendanceData = useCallback(async (employeesToSave) => {
        try {
            setSaving(true);
            setError(null);
            
            // Mark all employees as being saved
            const employeeIds = new Set(employeesToSave.map(emp => emp.id));
            setSavingEmployees(employeeIds);
            
            // Get previous month to check if we need to mark transfer
            const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
            const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
            
            // Load previous month data to calculate remaining amounts
            let prevMonthData = [];
            try {
                prevMonthData = await attendanceAPI.getByMonth(prevMonth, prevYear);
            } catch (e) {
                // Previous month might not exist
            }
            
            // Create map of previous month remaining amounts
            const prevRemainingMap = {};
            prevMonthData.forEach(prevEmp => {
                const prevNet = parseFloat(calculateNetSalaryHelper(prevEmp));
                const prevPaid = parseFloat(prevEmp.paidAmount || 0);
                const prevRemaining = prevNet - prevPaid;
                if (prevRemaining > 0) {
                    prevRemainingMap[prevEmp.id] = prevRemaining;
                }
            });
            
            // Transform data for API
            const dataToSave = employeesToSave.map(emp => {
                // Remaining is just Net - Paid (calculated on display, not stored)
                // We just need to save the transferredPending flag to mark that transfer was done
                
                return {
                    id: emp.id,
                    name: emp.name,
                    position: emp.position,
                    salaryType: emp.salaryType,
                    basicSalary: emp.basicSalary,
                    pendingSalary: emp.pendingSalary, // This includes transferred amount if transfer was done
                    bonus: emp.bonus,
                    fine: emp.fine,
                    paidAmount: emp.paidAmount || 0,
                    transferredPending: emp.transferredPending || null, // Keep the transfer flag (set during load if transfer happened)
                    notes: emp.notes || '',
                    attendance: emp.attendance || [],
                    overtime: emp.overtime || {},
                };
            });
            
            await attendanceAPI.saveMonth(selectedMonth, selectedYear, dataToSave);
            
            // Clear saving state for all employees after successful save
            setSavingEmployees(new Set());
        } catch (err) {
            console.error('Error saving attendance:', err);
            setError(err.message || 'Failed to save attendance data');
            // Clear saving state on error too
            setSavingEmployees(new Set());
        } finally {
            setSaving(false);
        }
    }, [selectedMonth, selectedYear]);

    // Load data when month/year changes
    useEffect(() => {
        loadAttendanceData();
        setHasChanges(false); // Reset changes flag when switching months
    }, [loadAttendanceData]);

    // Check if current month is selected
    const isCurrentMonth = useMemo(() => {
        const now = new Date();
        return selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
    }, [selectedMonth, selectedYear]);

    // Get current selected date object for DatePicker
    const selectedDate = useMemo(() => {
        return new Date(selectedYear, selectedMonth - 1, 1);
    }, [selectedMonth, selectedYear]);

    // Get current selected option label
    const selectedMonthYearLabel = useMemo(() => {
        return `${getMonthName(selectedMonth)} ${selectedYear}`;
    }, [selectedMonth, selectedYear]);

    // Handle date change from DatePicker
    // For clients: lock to current month
    const handleDateChange = (date) => {
        if (date) {
            // For clients: only allow current month
            if (isClient) {
                const today = new Date();
                const selected = new Date(date);
                if (selected.getMonth() !== today.getMonth() || selected.getFullYear() !== today.getFullYear()) {
                    alert('You can only view the current month.');
                    return;
                }
            }
            setSelectedMonth(date.getMonth() + 1);
            setSelectedYear(date.getFullYear());
        }
    };

    // Auto-save debounce (save 2 seconds after last change)
    // Only save if:
    // 1. User has made changes (hasChanges is true)
    // 2. OR it's the current month (allow auto-save for current month)
    useEffect(() => {
        if (employees.length === 0 || loading) return;
        
        // Don't auto-save for non-current months unless user has made changes
        if (!isCurrentMonth && !hasChanges) {
            return;
        }
        
        const timeoutId = setTimeout(() => {
            if (hasChanges || isCurrentMonth) {
                saveAttendanceData(employees);
                setHasChanges(false); // Reset after saving
            }
        }, 2000);
        
        return () => clearTimeout(timeoutId);
    }, [employees, loading, saveAttendanceData, hasChanges, isCurrentMonth]);

    // Recalculate attendance array when month changes (merge with loaded data)
    // Also transfer remaining amount from previous month to pending salary
    useEffect(() => {
        if (loading || employees.length === 0) return;
        
        setEmployees(prev => prev.map(emp => {
            const currentAttendance = emp.attendance || [];
            const newAttendance = days.map((dayObj, index) => {
                // If we have existing data for this day, preserve it
                if (index < currentAttendance.length && currentAttendance[index] !== null && currentAttendance[index] !== undefined) {
                    return currentAttendance[index];
                }
                // For Fridays, mark as 'dayoff' (not absent)
                if (dayObj.isFriday) {
                    return 'dayoff';
                }
                // For future dates with no data, leave blank (null)
                if (dayObj.isFuture) {
                    return null;
                }
                // For past dates with no data, mark as absent
                return 'absent';
            });
            
            // When switching to a new month, check if there's remaining from previous month
            // and transfer it to pending salary for the new month
            // Note: This logic will be handled when loading data for the new month
            return { 
                ...emp, 
                attendance: newAttendance,
            };
        }));
    }, [daysInMonth, days, loading]);

    // Compute attendance stats for the graph
    const chartData = useMemo(() => {
        return days.map((dayObj, index) => {
            // Count present for all dates (including future if marked), excluding dayoff
            const presentCount = employees.filter(emp => {
                const status = emp.attendance[index];
                return status === 'present';
            }).length;
            return { day: dayObj.day, present: presentCount };
        });
    }, [employees, days]);

    // Handle Input Changes
    const updateEmployee = (id, field, value) => {
        setHasChanges(true); // Mark that user has made changes
        setEmployees(prev => prev.map(emp =>
            emp.id === id ? { ...emp, [field]: value } : emp
        ));
    };

    // Toggle Attendance (works for past, today, and future dates, but not Fridays)
    // For clients: only allow editing today
    const toggleAttendance = (empId, dayIndex) => {
        const dayObj = days[dayIndex];
        // Don't allow toggling Fridays (they are day off)
        if (dayObj.isFriday) return;
        
        // For clients: only allow editing today
        if (isClient) {
            if (dayIndex !== todayIndex) {
                alert('You can only mark attendance for today.');
                return;
            }
            // Also verify it's the client's own employee
            if (empId !== clientEmployeeId) {
                alert('You can only edit your own attendance.');
                return;
            }
        }
        
        setEmployees(prev => prev.map(emp => {
            if (emp.id !== empId) return emp;
            const newAttendance = [...emp.attendance];
            const currentStatus = newAttendance[dayIndex];
            
            // Toggle logic: null/blank -> present -> absent -> present (cycle)
            if (currentStatus === null || currentStatus === undefined) {
                newAttendance[dayIndex] = 'present';
            } else if (currentStatus === 'present') {
                newAttendance[dayIndex] = 'absent';
            } else {
                newAttendance[dayIndex] = 'present';
            }
            return { ...emp, attendance: newAttendance };
        }));
    };

    // Update OT for specific day
    // For clients: only allow editing today
    const updateOvertime = (empId, dayIndex, hours) => {
        // For clients: only allow editing today
        if (isClient) {
            if (dayIndex !== todayIndex) {
                alert('You can only add overtime for today.');
                return;
            }
            // Also verify it's the client's own employee
            if (empId !== clientEmployeeId) {
                alert('You can only edit your own overtime.');
                return;
            }
        }
        
        setHasChanges(true); // Mark that user has made changes
        setEmployees(prev => prev.map(emp => {
            if (emp.id !== empId) return emp;
            const newOvertime = { ...emp.overtime };
            const parsedHours = parseFloat(hours);
            if (!isNaN(parsedHours) && parsedHours > 0) {
                newOvertime[dayIndex] = parsedHours;
            } else {
                delete newOvertime[dayIndex];
            }
            // Calculate total OT hours
            const totalOT = Object.values(newOvertime).reduce((sum, hrs) => sum + (parseFloat(hrs) || 0), 0);
            return { ...emp, overtime: newOvertime, overtimeHours: totalOT };
        }));
    };

    // Calculate Net Salary (for use in component)
    const calculateNetSalary = (emp) => {
        return calculateNetSalaryHelper(emp);
    };

    // Calculate Remaining Amount (Net - Paid)
    const calculateRemaining = (emp) => {
        const netSalary = parseFloat(calculateNetSalaryHelper(emp));
        const paidAmount = parseFloat(emp.paidAmount || 0);
        const remaining = netSalary - paidAmount;
        return remaining.toFixed(2);
    };

    // Helper to check if it's Friday
    const isFriday = (dayObj) => dayObj.isFriday;

    // Get average attendance
    const averageAttendance = chartData.length > 0
        ? (chartData.reduce((sum, d) => sum + d.present, 0) / chartData.length).toFixed(1)
        : 0;

    // Open add employee modal
    const openAddEmployeeModal = () => {
        setNewEmployeeName(`Employee ${employees.length + 1}`);
        setNewEmployeePosition('Labor');
        setCreateWithLogin(false);
        setNewEmployeeUsername('');
        setNewEmployeePassword('password123');
        setShowAddEmployeeModal(true);
    };

    // Add new employee
    const addEmployee = async () => {
        try {
            if (!newEmployeeName.trim()) {
                setError('Employee name is required');
                return;
            }

            if (createWithLogin && !newEmployeeUsername.trim()) {
                setError('Username is required when creating login');
                return;
            }

            // Create temporary ID for loading state
            const tempId = `temp-${Date.now()}`;
            setSavingEmployees(prev => new Set([...prev, tempId]));
            
            const newEmployee = {
                name: newEmployeeName.trim(),
                position: newEmployeePosition || 'Labor',
                salaryType: 'Fixed',
                basicSalary: 3000,
                pendingSalary: 0,
                bonus: 0,
                fine: 0,
                paidAmount: 0,
                notes: '',
            };
            
            const created = await employeeAPI.create(newEmployee);
            const newEmployeeId = created._id || created.id;
            
            // If createWithLogin is checked, register a user for this employee
            if (createWithLogin) {
                try {
                    await authAPI.register(
                        newEmployeeUsername.trim(),
                        newEmployeePassword || 'password123',
                        'client',
                        newEmployeeId
                    );
                } catch (regErr) {
                    console.error('Error registering user:', regErr);
                    // Continue even if registration fails - employee is already created
                    setError(`Employee created but registration failed: ${regErr.message}`);
                }
            }
            
            // Add to local state with attendance initialized
            const newEmp = {
                id: newEmployeeId,
                ...newEmployee,
                attendance: initializeAttendance(days),
                overtime: {},
                overtimeHours: 0,
            };
            
            setEmployees(prev => [...prev, newEmp]);
            
            // Remove temp ID and add real ID
            setSavingEmployees(prev => {
                const newSet = new Set(prev);
                newSet.delete(tempId);
                newSet.add(newEmployeeId);
                return newSet;
            });
            
            // Save attendance for this new employee
            await saveAttendanceData([...employees, newEmp]);
            
            // Reload attendance data to get updated user info if user was created
            if (createWithLogin) {
                await loadAttendanceData();
            }
            
            // Close modal and reset
            setShowAddEmployeeModal(false);
            setNewEmployeeName('');
            setNewEmployeePosition('Labor');
            setCreateWithLogin(false);
            setNewEmployeeUsername('');
            setNewEmployeePassword('password123');
        } catch (err) {
            console.error('Error adding employee:', err);
            setError(err.message || 'Failed to add employee');
            setSavingEmployees(prev => {
                const newSet = new Set(prev);
                newSet.delete(`temp-${Date.now()}`);
                return newSet;
            });
        }
    };

    // Open register modal for existing employee
    const openRegisterModal = (employee) => {
        // Prevent opening if user already exists
        if (employee.hasUser) {
            alert(`This employee already has a registered user account (${employee.username}). Use reset password to change the password.`);
            return;
        }
        
        setRegisterEmployee(employee);
        setRegisterUsername('');
        setRegisterPassword('password123'); // Default password
        setRegisterError(null);
        setRegisterSuccess(false);
        setShowRegisterModal(true);
    };

    // Open reset password modal for existing employee
    const openResetPasswordModal = (employee) => {
        if (!employee.hasUser) {
            alert('This employee does not have a registered user account. Please register first.');
            return;
        }
        
        setResetPasswordEmployee(employee);
        setResetPassword('password123'); // Default password
        setResetPasswordError(null);
        setResetPasswordSuccess(false);
        setShowResetPasswordModal(true);
    };

    // Reset password for existing user
    const resetPasswordForEmployee = async () => {
        if (!resetPasswordEmployee) return;
        
        if (!resetPasswordEmployee.hasUser || !resetPasswordEmployee.username) {
            setResetPasswordError('This employee does not have a registered user account.');
            return;
        }

        if (!resetPassword.trim()) {
            setResetPasswordError('Password is required');
            return;
        }

        try {
            setResetPasswordLoading(true);
            setResetPasswordError(null);
            
            await authAPI.resetPassword(
                resetPasswordEmployee.username,
                resetPassword || 'password123'
            );
            
            setResetPasswordSuccess(true);
            
            // Close modal after 1.5 seconds
            setTimeout(() => {
                setShowResetPasswordModal(false);
                setResetPasswordEmployee(null);
                setResetPassword('password123');
                setResetPasswordSuccess(false);
            }, 1500);
        } catch (err) {
            console.error('Error resetting password:', err);
            setResetPasswordError(err.message || 'Failed to reset password');
        } finally {
            setResetPasswordLoading(false);
        }
    };

    // Register user for existing employee
    const registerUserForEmployee = async () => {
        if (!registerEmployee) return;
        
        // Double check - prevent if user already exists
        if (registerEmployee.hasUser) {
            setRegisterError('This employee already has a registered user account.');
            return;
        }
        
        if (!registerUsername.trim()) {
            setRegisterError('Username is required');
            return;
        }

        try {
            setRegisterLoading(true);
            setRegisterError(null);
            
            await authAPI.register(
                registerUsername.trim(),
                registerPassword || 'password123',
                'client',
                registerEmployee.id
            );
            
            setRegisterSuccess(true);
            
            // Reload attendance data to get updated user info
            await loadAttendanceData();
            
            // Close modal after 1.5 seconds
            setTimeout(() => {
                setShowRegisterModal(false);
                setRegisterEmployee(null);
                setRegisterUsername('');
                setRegisterPassword('password123');
                setRegisterSuccess(false);
            }, 1500);
        } catch (err) {
            console.error('Error registering user:', err);
            setRegisterError(err.message || 'Failed to register user');
        } finally {
            setRegisterLoading(false);
        }
    };

    // Remove employee
    const removeEmployee = async (employeeId) => {
        if (employees.length <= 1) return; // Keep at least one employee
        
        try {
            setSavingEmployees(prev => new Set([...prev, employeeId]));
            await employeeAPI.delete(employeeId);
            setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
            setSavingEmployees(prev => {
                const newSet = new Set(prev);
                newSet.delete(employeeId);
                return newSet;
            });
        } catch (err) {
            console.error('Error removing employee:', err);
            setError(err.message || 'Failed to remove employee');
            setSavingEmployees(prev => {
                const newSet = new Set(prev);
                newSet.delete(employeeId);
                return newSet;
            });
        }
    };

    // Save notes
    const saveNotes = async () => {
        if (!selectedNoteEmployee) return;
        
        try {
            setHasChanges(true); // Mark that user has made changes
            updateEmployee(selectedNoteEmployee.id, 'notes', notesText);
            setSelectedNoteEmployee(null);
            setNotesText('');
        } catch (err) {
            console.error('Error saving notes:', err);
            setError(err.message || 'Failed to save notes');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Loading attendance data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Error Banner */}
            {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <span className="block sm:inline">{error}</span>
                    <button
                        className="absolute top-0 bottom-0 right-0 px-4 py-3"
                        onClick={() => setError(null)}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Saving Indicator - Only show if saving but no individual loaders visible */}
            {saving && savingEmployees.size === 0 && (
                <div className="mb-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <span>Saving changes...</span>
                </div>
            )}

            {/* Navigation Header */}
            <Header 
                user={user} 
                onLogout={onLogout} 
                onNavigateHome={() => onNavigate('landing')}
                currentView="attendance"
                onNavigate={onNavigate}
            />

            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                {/* Page Header with Date Picker */}
                <div className="mb-8 bg-gradient-to-r from-blue-950 via-blue-800 to-blue-700 text-white p-6 rounded-2xl shadow-xl border border-blue-600/20 relative overflow-hidden">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                                <Calendar className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-tight mb-1 drop-shadow-lg">
                                    Alshalal Factory
                                </h1>
                                <p className="text-blue-100 font-medium text-sm tracking-wide">
                                    Attendance & HR Tracking System
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-4 w-full md:w-auto justify-center md:justify-end items-center">
                            <div className="relative z-50" ref={datePickerRef}>
                                {isAdmin ? (
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={handleDateChange}
                                        showMonthYearPicker
                                        dateFormat="MMMM yyyy"
                                        minDate={new Date(currentDate.getFullYear() - 2, 0, 1)}
                                        maxDate={new Date(currentDate.getFullYear() + 2, 11, 31)}
                                        customInput={
                                            <button
                                                type="button"
                                                className="bg-white/15 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20 text-center shadow-lg hover:bg-white/20 transition-all duration-200 min-w-[200px]"
                                            >
                                                <span className="block text-xs text-blue-100 font-bold uppercase tracking-wider mb-1">Select Month & Year</span>
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="font-bold text-white text-lg">{selectedMonthYearLabel}</span>
                                                </div>
                                                <span className="text-xs text-blue-200 font-medium">({daysInMonth} Days)</span>
                                            </button>
                                        }
                                        calendarClassName="!bg-white !border-slate-200 !rounded-xl !shadow-2xl"
                                        className="react-datepicker-wrapper"
                                        popperClassName="z-[100]"
                                        popperPlacement="bottom-end"
                                        popperModifiers={[
                                            {
                                                name: "offset",
                                                options: {
                                                    offset: [0, 8],
                                                },
                                            },
                                        ]}
                                    />
                                ) : (
                                    <div className="bg-white/15 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20 text-center shadow-lg min-w-[200px]">
                                        <span className="block text-xs text-blue-100 font-bold uppercase tracking-wider mb-1">Current Month</span>
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="font-bold text-white text-lg">{selectedMonthYearLabel}</span>
                                        </div>
                                        <span className="text-xs text-blue-200 font-medium">({daysInMonth} Days)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            {/* Dashboard Graph */}
            <section className="mb-8 bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-factory-blue" />
                    Daily Attendance Overview
                </h2>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis 
                                dataKey="day" 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fill: '#64748b', fontSize: 12 }} 
                            />
                            <YAxis 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fill: '#64748b', fontSize: 12 }} 
                            />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="present" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-green-100 p-3 rounded">
                        <p className="font-semibold text-green-800">Average Attendance</p>
                        <p className="text-2xl font-bold text-green-900">
                            {averageAttendance} / {employees.length}
                        </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded">
                        <p className="font-semibold text-blue-800">Total Employees</p>
                        <p className="text-2xl font-bold text-blue-900">{employees.length}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded">
                        <p className="font-semibold text-purple-800">Working Days</p>
                        <p className="text-2xl font-bold text-purple-900">{daysInMonth}</p>
                    </div>
                </div>
            </section>

            {/* Add Employee Button - Admin Only */}
            {isAdmin && (
                <div className="mb-4 flex justify-end no-print">
                    <button
                        onClick={openAddEmployeeModal}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Add New Employee
                    </button>
                </div>
            )}

            {/* Main Table */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-800 text-white font-semibold uppercase text-xs tracking-wider">
                            <tr>
                                <th className="sticky left-0 z-20 bg-slate-800 p-3 min-w-[200px] border-r border-slate-700">Employee Details</th>
                                <th colSpan={4} className="text-center bg-slate-900/50 border-r border-slate-700 py-2">Payroll Setup</th>
                                {days.map((dayObj, index) => (
                                    <th key={index} className={clsx(
                                        "p-1 text-center min-w-[32px] border-r border-slate-700",
                                        isFriday(dayObj) ? "bg-amber-500/20 text-amber-200" : "",
                                        dayObj.isToday ? "bg-blue-500/30 text-blue-100 border-l-2 border-r-2 border-blue-400" : ""
                                    )}>
                                        {dayObj.day}
                                    </th>
                                ))}
                                <th colSpan={7} className="text-center bg-slate-900/50 border-l border-slate-700 py-2">Adjustments & Payment</th>
                            </tr>
                            <tr>
                                <th className="sticky left-0 z-20 bg-slate-800 p-2 min-w-[200px] border-r border-slate-700"></th>
                                <th className="p-2 min-w-[100px] border-r border-slate-700 text-center">Type</th>
                                <th className="p-2 min-w-[100px] border-r border-slate-700 text-center">Base</th>
                                <th className="p-2 min-w-[100px] border-r border-slate-700 text-center">Pending</th>
                                <th className="w-2 border-r border-slate-700 bg-slate-900/50"></th> {/* Spacer */}
                                {days.map((dayObj, index) => (
                                    <th key={index} className={clsx(
                                        "p-1 text-center min-w-[32px] border-r border-slate-700 text-[10px] font-normal text-blue-200",
                                        isFriday(dayObj) ? "bg-amber-500/20 text-amber-200" : "",
                                        dayObj.isToday ? "bg-blue-500/30 text-blue-100 border-l-2 border-r-2 border-blue-400" : ""
                                    )}>
                                        {dayObj.dayName}
                                    </th>
                                ))}
                                <th className="p-2 min-w-[80px] border-l border-slate-700 text-center">OT (Hrs)</th>
                                <th className="p-2 min-w-[100px] border-r border-slate-700 text-center">Bonus</th>
                                <th className="p-2 min-w-[100px] border-r border-slate-700 text-center">Fine</th>
                                <th className="p-2 min-w-[120px] border-r border-slate-700 text-center">Net Amount</th>
                                <th className="p-2 min-w-[100px] border-r border-slate-700 text-center">Paid Amount</th>
                                <th className="p-2 min-w-[120px] border-r border-slate-700 text-center">Remaining</th>
                                <th className="p-2 min-w-[50px] border-r border-slate-700 text-center">Notes</th>
                                {isAdmin && <th className="p-3 min-w-[50px] no-print bg-slate-800"></th>} {/* Action column header */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employees.length === 0 ? (
                                <tr>
                                    <td colSpan={100} className="text-center py-8 text-slate-500">
                                        No employees found. Click "Add New Employee" to get started.
                                    </td>
                                </tr>
                            ) : (
                                employees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                                        {/* Fixed Column: Name & Position */}
                                        <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                {isAdmin ? (
                                                    <input
                                                        type="text"
                                                        value={emp.name}
                                                        onChange={(e) => updateEmployee(emp.id, 'name', e.target.value)}
                                                        className="flex-1 font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                                                        placeholder="Employee Name"
                                                        disabled={savingEmployees.has(emp.id)}
                                                    />
                                                ) : (
                                                    <div className="flex-1 font-bold text-slate-800">{emp.name}</div>
                                                )}
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1">
                                                        {!emp.hasUser ? (
                                                            <button
                                                                onClick={() => openRegisterModal(emp)}
                                                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                                                title="Register user for login"
                                                            >
                                                                <UserPlus className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => openResetPasswordModal(emp)}
                                                                className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                                                                title={`Reset password for ${emp.username}`}
                                                            >
                                                                <Key className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                {savingEmployees.has(emp.id) && (
                                                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isAdmin ? (
                                                    <input
                                                        type="text"
                                                        value={emp.position}
                                                        onChange={(e) => updateEmployee(emp.id, 'position', e.target.value)}
                                                        className="flex-1 text-xs text-slate-500 bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                                                        placeholder="Position"
                                                        disabled={savingEmployees.has(emp.id)}
                                                    />
                                                ) : (
                                                    <div className="flex-1 text-xs text-slate-500">{emp.position}</div>
                                                )}
                                                {emp.hasUser && emp.username && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium" title={`Username: ${emp.username}`}>
                                                        @{emp.username}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Payroll Setup Inputs - Admin Only */}
                                        {isAdmin ? (
                                            <>
                                                <td className="p-2 min-w-[100px] border-r border-slate-100">
                                                    <label className="text-[10px] text-slate-400 block uppercase">Type</label>
                                                    <select
                                                        value={emp.salaryType}
                                                        onChange={(e) => updateEmployee(emp.id, 'salaryType', e.target.value)}
                                                        className="w-full bg-slate-100 rounded text-xs border-none py-1 px-1 focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option>Fixed</option>
                                                        <option>Daily</option>
                                                    </select>
                                                </td>
                                                <td className="p-2 min-w-[100px] border-r border-slate-100">
                                                    <label className="text-[10px] text-slate-400 block uppercase">Base</label>
                                                    <input
                                                        type="number"
                                                        value={emp.basicSalary || ''}
                                                        onChange={(e) => updateEmployee(emp.id, 'basicSalary', parseFloat(e.target.value) || 0)}
                                                        className="w-full font-mono text-xs border-b border-transparent focus:border-blue-500 outline-none bg-transparent"
                                                    />
                                                </td>
                                                <td className="p-2 min-w-[100px] border-r border-slate-100 bg-yellow-50/30">
                                                    <label className="text-[10px] text-yellow-600/70 block uppercase">Pending</label>
                                                    <input
                                                        type="number"
                                                        value={emp.pendingSalary || ''}
                                                        onChange={(e) => updateEmployee(emp.id, 'pendingSalary', parseFloat(e.target.value) || 0)}
                                                        className="w-full font-mono text-xs text-yellow-700 border-b border-transparent focus:border-yellow-500 outline-none bg-transparent"
                                                    />
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-2 min-w-[100px] border-r border-slate-100">
                                                    <label className="text-[10px] text-slate-400 block uppercase">Type</label>
                                                    <div className="text-xs font-semibold text-slate-600">{emp.salaryType}</div>
                                                </td>
                                                <td className="p-2 min-w-[100px] border-r border-slate-100">
                                                    <label className="text-[10px] text-slate-400 block uppercase">Base</label>
                                                    <div className="text-xs font-semibold text-slate-600">{emp.basicSalary || 0}</div>
                                                </td>
                                                <td className="p-2 min-w-[100px] border-r border-slate-100 bg-yellow-50/30">
                                                    <label className="text-[10px] text-yellow-600/70 block uppercase">Pending</label>
                                                    <div className="text-xs font-semibold text-yellow-700">{emp.pendingSalary || 0}</div>
                                                </td>
                                            </>
                                        )}
                                        <td className="w-2 border-r border-slate-300 bg-slate-100"></td>

                                        {/* Calendar Grid with OT */}
                                        {emp.attendance.map((status, index) => {
                                            const dayObj = days[index];
                                            const isFri = isFriday(dayObj);
                                            const otHours = emp.overtime[index] || '';
                                            const isFuture = dayObj.isFuture;
                                            const isToday = dayObj.isToday;
                                            
                                            // For past dates with no status, treat as absent for display
                                            // For future dates, show null if blank
                                            // For Fridays, show 'dayoff'
                                            const displayStatus = isFri 
                                                ? 'dayoff'
                                                : (isFuture 
                                                    ? (status || null) 
                                                    : (status || 'absent'));
                                            
                                            return (
                                                <td key={index} className={clsx(
                                                    "p-0 border-r border-slate-100 text-center relative",
                                                    isFri ? "bg-amber-50" : "",
                                                    isFuture && !status ? "bg-slate-50" : "",
                                                    isToday ? "bg-blue-100/50 border-l-2 border-r-2 border-blue-400" : ""
                                                )}>
                                                    {isFri ? (
                                                        // Friday: Show "OFF" for day off
                                                        <div className="w-full h-10 flex items-center justify-center bg-amber-100 text-amber-700 font-bold text-xs">
                                                            OFF
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => toggleAttendance(emp.id, index)}
                                                            disabled={isClient && index !== todayIndex}
                                                            className={clsx(
                                                                "w-full h-10 flex items-center justify-center transition-all",
                                                                isClient && index !== todayIndex 
                                                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                                                                    : displayStatus === 'present'
                                                                    ? "bg-green-100 hover:bg-green-200 text-green-700 font-bold"
                                                                    : displayStatus === null || displayStatus === undefined
                                                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-400"
                                                                    : "bg-red-50 hover:bg-red-100 text-red-400"
                                                            )}
                                                            title={
                                                                isClient && index !== todayIndex 
                                                                    ? "You can only mark attendance for today"
                                                                    : `Day ${dayObj.day}: ${displayStatus === 'present' ? 'Present' : displayStatus === 'absent' ? 'Absent' : 'Not set'}`
                                                            }
                                                        >
                                                            {displayStatus === 'present' ? 'P' : displayStatus === null || displayStatus === undefined ? '-' : 'A'}
                                                        </button>
                                                    )}
                                                    {!isFri && (
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            max="12"
                                                            value={otHours}
                                                            onChange={(e) => updateOvertime(emp.id, index, e.target.value)}
                                                            disabled={isClient && index !== todayIndex}
                                                            className={clsx(
                                                                "w-full h-6 text-[10px] text-center border-t border-blue-200 focus:outline-none",
                                                                isClient && index !== todayIndex 
                                                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                                                    : "bg-blue-50/50 focus:bg-blue-100"
                                                            )}
                                                            placeholder="OT"
                                                            title={isClient && index !== todayIndex ? "You can only add overtime for today" : "Overtime hours"}
                                                        />
                                                    )}
                                                </td>
                                            );
                                        })}

                                        {/* Adjustments & Net */}
                                        <td className="p-2 w-[80px] border-l border-slate-200 bg-blue-50/20">
                                            <label className="text-[10px] text-slate-400 block uppercase text-center">OT (Hrs)</label>
                                            <div className="text-center font-bold text-blue-600">
                                                {emp.overtimeHours || 0}
                                            </div>
                                        </td>
                                        <td className="p-2 min-w-[100px] border-r border-slate-100">
                                            <label className="text-[10px] text-green-600/70 block uppercase text-center">Bonus</label>
                                            {isAdmin ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={emp.bonus || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                                        updateEmployee(emp.id, 'bonus', value);
                                                    }}
                                                    className="w-full text-center text-green-700 bg-transparent outline-none border-b border-transparent focus:border-green-500 font-semibold min-w-[60px]"
                                                    placeholder="0.00"
                                                />
                                            ) : (
                                                <div className="w-full text-center text-green-700 font-semibold min-w-[60px]">{emp.bonus || 0}</div>
                                            )}
                                        </td>
                                        <td className="p-2 min-w-[100px] border-r border-slate-100">
                                            <label className="text-[10px] text-red-400/70 block uppercase text-center">Fine</label>
                                            {isAdmin ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={emp.fine || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                                        updateEmployee(emp.id, 'fine', value);
                                                    }}
                                                    className="w-full text-center text-red-500 bg-transparent outline-none border-b border-transparent focus:border-red-500 font-semibold min-w-[60px]"
                                                    placeholder="0.00"
                                                />
                                            ) : (
                                                <div className="w-full text-center text-red-500 font-semibold min-w-[60px]">{emp.fine || 0}</div>
                                            )}
                                        </td>
                                        <td className="p-3 min-w-[120px] bg-slate-50 font-bold text-slate-800 text-right border-l border-slate-200">
                                            {calculateNetSalary(emp)} SAR
                                        </td>
                                        <td className="p-2 min-w-[100px] border-r border-slate-100">
                                            <label className="text-[10px] text-blue-600/70 block uppercase text-center">Paid</label>
                                            {isAdmin ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={emp.paidAmount || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                                        updateEmployee(emp.id, 'paidAmount', value);
                                                    }}
                                                    className="w-full text-center text-blue-700 bg-transparent outline-none border-b border-transparent focus:border-blue-500 font-semibold min-w-[60px]"
                                                    placeholder="0.00"
                                                />
                                            ) : (
                                                <div className="w-full text-center text-blue-700 font-semibold min-w-[60px]">{emp.paidAmount || 0}</div>
                                            )}
                                        </td>
                                        <td className="p-3 min-w-[120px] bg-yellow-50 font-bold text-yellow-800 text-right border-l border-slate-200">
                                            {calculateRemaining(emp)} SAR
                                        </td>
                                        <td className="p-2 text-center w-[50px]">
                                            <button
                                                onClick={() => {
                                                    setSelectedNoteEmployee(emp);
                                                    setNotesText(emp.notes || '');
                                                }}
                                                className="text-slate-400 hover:text-blue-600 transition-colors relative"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                {emp.notes && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}
                                            </button>
                                        </td>
                                        {isAdmin && (
                                            <td className="p-2 text-center w-[50px] no-print">
                                                <button
                                                    onClick={() => removeEmployee(emp.id)}
                                                    disabled={employees.length <= 1}
                                                    className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    title="Remove Employee"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes Modal */}
            {selectedNoteEmployee && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm" onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setSelectedNoteEmployee(null);
                        setNotesText('');
                    }
                }}>
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className="text-xl font-bold text-slate-800">Notes: {selectedNoteEmployee.name}</h3>
                            <button
                                onClick={() => {
                                    setSelectedNoteEmployee(null);
                                    setNotesText('');
                                }}
                                className="text-slate-400 hover:text-red-500 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <textarea
                            className="w-full h-40 border-2 border-slate-300 rounded-lg p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            placeholder="Add notes about performance, issues, or reminders..."
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            autoFocus
                        ></textarea>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setSelectedNoteEmployee(null);
                                    setNotesText('');
                                }}
                                className="px-5 py-2.5 rounded-lg text-sm font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveNotes}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                                <Save className="w-5 h-5" /> Save Notes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Employee Modal */}
            {showAddEmployeeModal && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowAddEmployeeModal(false);
                        }
                    }}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all scale-100 animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-2xl font-bold text-slate-800">Add New Employee</h3>
                            <button
                                onClick={() => setShowAddEmployeeModal(false)}
                                className="text-slate-400 hover:text-red-500 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Employee Name *
                                </label>
                                <input
                                    type="text"
                                    value={newEmployeeName}
                                    onChange={(e) => setNewEmployeeName(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Enter employee name"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Position
                                </label>
                                <input
                                    type="text"
                                    value={newEmployeePosition}
                                    onChange={(e) => setNewEmployeePosition(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Enter position"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={createWithLogin}
                                        onChange={(e) => setCreateWithLogin(e.target.checked)}
                                        className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="text-sm font-semibold text-slate-700">Create login account</span>
                                        <p className="text-xs text-slate-500">Register a user account for client login</p>
                                    </div>
                                </label>
                            </div>

                            {createWithLogin && (
                                <div className="space-y-4 pl-8 border-l-2 border-blue-200 bg-blue-50/30 p-4 rounded-lg">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Username *
                                        </label>
                                        <input
                                            type="text"
                                            value={newEmployeeUsername}
                                            onChange={(e) => setNewEmployeeUsername(e.target.value)}
                                            className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            placeholder="Enter username"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Password
                                        </label>
                                        <input
                                            type="text"
                                            value={newEmployeePassword}
                                            onChange={(e) => setNewEmployeePassword(e.target.value)}
                                            className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            placeholder="Default: password123"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Leave empty to use default password: password123</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowAddEmployeeModal(false);
                                    setNewEmployeeName('');
                                    setNewEmployeePosition('Labor');
                                    setCreateWithLogin(false);
                                    setNewEmployeeUsername('');
                                    setNewEmployeePassword('password123');
                                    setError(null);
                                }}
                                className="px-5 py-2.5 rounded-lg text-sm font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addEmployee}
                                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                                <Save className="w-5 h-5" /> Create Employee
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Register User Modal */}
            {showRegisterModal && registerEmployee && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !registerSuccess) {
                            setShowRegisterModal(false);
                        }
                    }}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all scale-100 animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {registerSuccess ? (
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                    <CheckCircle className="w-12 h-12 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Success!</h3>
                                <p className="text-slate-600 mb-6">User registered successfully for {registerEmployee.name}</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-6 border-b pb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800">Register User</h3>
                                        <p className="text-sm text-slate-500 mt-1">Create login for {registerEmployee.name}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowRegisterModal(false);
                                            setRegisterEmployee(null);
                                            setRegisterUsername('');
                                            setRegisterPassword('password123');
                                            setRegisterError(null);
                                        }}
                                        className="text-slate-400 hover:text-red-500 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                                        title="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Username *
                                        </label>
                                        <input
                                            type="text"
                                            value={registerUsername}
                                            onChange={(e) => setRegisterUsername(e.target.value)}
                                            className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            placeholder="Enter username"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Password
                                        </label>
                                        <input
                                            type="text"
                                            value={registerPassword}
                                            onChange={(e) => setRegisterPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            placeholder="Default: password123"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Leave empty to use default password: password123</p>
                                    </div>

                                    {registerError && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                            <XCircle className="w-5 h-5 flex-shrink-0" />
                                            <span>{registerError}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setShowRegisterModal(false);
                                            setRegisterEmployee(null);
                                            setRegisterUsername('');
                                            setRegisterPassword('password123');
                                            setRegisterError(null);
                                        }}
                                        className="px-5 py-2.5 rounded-lg text-sm font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={registerUserForEmployee}
                                        disabled={registerLoading}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {registerLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Registering...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-5 h-5" />
                                                Register User
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && resetPasswordEmployee && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !resetPasswordSuccess) {
                            setShowResetPasswordModal(false);
                        }
                    }}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all scale-100 animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {resetPasswordSuccess ? (
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                    <CheckCircle className="w-12 h-12 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Success!</h3>
                                <p className="text-slate-600 mb-6">Password reset successfully for {resetPasswordEmployee.username}</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-6 border-b pb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800">Reset Password</h3>
                                        <p className="text-sm text-slate-500 mt-1">Reset password for {resetPasswordEmployee.name} ({resetPasswordEmployee.username})</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowResetPasswordModal(false);
                                            setResetPasswordEmployee(null);
                                            setResetPassword('password123');
                                            setResetPasswordError(null);
                                        }}
                                        className="text-slate-400 hover:text-red-500 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                                        title="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="text"
                                            value={resetPassword}
                                            onChange={(e) => setResetPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                            placeholder="Default: password123"
                                            autoFocus
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Leave empty to use default password: password123</p>
                                    </div>

                                    {resetPasswordError && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                            <XCircle className="w-5 h-5 flex-shrink-0" />
                                            <span>{resetPasswordError}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setShowResetPasswordModal(false);
                                            setResetPasswordEmployee(null);
                                            setResetPassword('password123');
                                            setResetPasswordError(null);
                                        }}
                                        className="px-5 py-2.5 rounded-lg text-sm font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={resetPasswordForEmployee}
                                        disabled={resetPasswordLoading}
                                        className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {resetPasswordLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Resetting...
                                            </>
                                        ) : (
                                            <>
                                                <Key className="w-5 h-5" />
                                                Reset Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}

export default AttendanceHRSystem;
