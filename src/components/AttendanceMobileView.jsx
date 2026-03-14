import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { CalendarDays, Key, Loader2, MessageSquare, Plus, Trash2, UserPlus } from 'lucide-react';

function AttendanceMobileView({
    employees,
    days,
    selectedMonthYearLabel,
    averageAttendance,
    isAdmin,
    isClient,
    todayIndex,
    savingEmployees,
    calculateNetSalary,
    calculateRemaining,
    updateEmployee,
    toggleAttendance,
    updateOvertime,
    onOpenNotes,
    onOpenRegister,
    onOpenResetPassword,
    onRemoveEmployee,
    onOpenAddEmployee,
}) {
    const initialDayIndex = todayIndex >= 0 ? todayIndex : 0;
    const [activeDayIndex, setActiveDayIndex] = useState(initialDayIndex);
    const activeDay = days[activeDayIndex];

    const summaryStats = useMemo(() => ([
        {
            label: 'Employees',
            value: employees.length,
            tone: 'from-blue-600 to-cyan-500',
        },
        {
            label: 'Avg Attendance',
            value: averageAttendance,
            tone: 'from-emerald-600 to-teal-500',
        },
        {
            label: 'Selected Day',
            value: activeDay ? `${activeDay.day} ${activeDay.dayName}` : '--',
            tone: 'from-amber-500 to-orange-500',
        },
    ]), [activeDay, averageAttendance, employees.length]);

    return (
        <div className="lg:hidden space-y-5">
            <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-blue-700 p-5 text-white shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-blue-200">Mobile Attendance Mode</p>
                        <h2 className="mt-2 text-2xl font-bold">{selectedMonthYearLabel}</h2>
                        <p className="mt-1 text-sm text-blue-100">Swipe days, then update each employee card without horizontal table scrolling.</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                        <CalendarDays className="h-7 w-7 text-blue-100" />
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                    {summaryStats.map((stat) => (
                        <div key={stat.label} className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                            <p className="text-[10px] uppercase tracking-[0.24em] text-blue-200">{stat.label}</p>
                            <p className={clsx('mt-2 text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent', stat.tone)}>
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {isAdmin && (
                <button
                    onClick={onOpenAddEmployee}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700"
                >
                    <Plus className="h-5 w-5" />
                    Add Employee
                </button>
            )}

            <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Day Selector</p>
                        <h3 className="text-lg font-semibold text-slate-900">
                            {activeDay ? `Day ${activeDay.day} · ${activeDay.dayName}` : 'Select a day'}
                        </h3>
                    </div>
                    {activeDay?.isToday && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Today</span>
                    )}
                </div>

                <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-1">
                    {days.map((day, index) => (
                        <button
                            key={`${day.day}-${day.dayName}-${index}`}
                            type="button"
                            onClick={() => setActiveDayIndex(index)}
                            className={clsx(
                                'min-w-[84px] snap-start rounded-2xl border px-3 py-3 text-left transition',
                                index === activeDayIndex
                                    ? 'border-blue-500 bg-blue-600 text-white shadow-lg'
                                    : day.isFriday
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : 'border-slate-200 bg-slate-50 text-slate-700'
                            )}
                        >
                            <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">{day.dayName}</div>
                            <div className="mt-1 text-xl font-bold">{day.day}</div>
                            <div className="mt-1 text-[11px]">{day.isFriday ? 'Day Off' : day.isFuture ? 'Upcoming' : 'Active'}</div>
                        </button>
                    ))}
                </div>
            </section>

            <div className="space-y-4">
                {employees.map((emp) => {
                    const status = emp.attendance?.[activeDayIndex] ?? null;
                    const overtimeValue = emp.overtime?.[activeDayIndex] || '';
                    const selectedDayIsFriday = activeDay?.isFriday;
                    const selectedDayIsFuture = activeDay?.isFuture;
                    const isSaving = savingEmployees.has(emp.id);
                    const canEditDay = !selectedDayIsFriday && (!isClient || activeDayIndex === todayIndex);

                    const displayStatus = selectedDayIsFriday
                        ? 'dayoff'
                        : (selectedDayIsFuture ? status : (status || 'absent'));

                    return (
                        <article key={emp.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-4 text-white">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        {isAdmin ? (
                                            <input
                                                type="text"
                                                value={emp.name}
                                                onChange={(e) => updateEmployee(emp.id, 'name', e.target.value)}
                                                className="w-full border-b border-white/20 bg-transparent pb-1 text-lg font-bold text-white outline-none"
                                            />
                                        ) : (
                                            <h3 className="text-lg font-bold">{emp.name}</h3>
                                        )}
                                        {isAdmin ? (
                                            <input
                                                type="text"
                                                value={emp.position}
                                                onChange={(e) => updateEmployee(emp.id, 'position', e.target.value)}
                                                className="mt-1 w-full border-b border-white/10 bg-transparent pb-1 text-sm text-blue-100 outline-none"
                                            />
                                        ) : (
                                            <p className="mt-1 text-sm text-blue-100">{emp.position}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {emp.hasUser ? (
                                            <button
                                                type="button"
                                                onClick={() => onOpenResetPassword(emp)}
                                                className="rounded-full bg-white/10 p-2 text-amber-200 transition hover:bg-white/20"
                                                title={`Reset password for ${emp.username}`}
                                            >
                                                <Key className="h-4 w-4" />
                                            </button>
                                        ) : isAdmin ? (
                                            <button
                                                type="button"
                                                onClick={() => onOpenRegister(emp)}
                                                className="rounded-full bg-white/10 p-2 text-blue-100 transition hover:bg-white/20"
                                                title="Register user"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                            </button>
                                        ) : null}
                                        {isAdmin && (
                                            <button
                                                type="button"
                                                onClick={() => onRemoveEmployee(emp.id)}
                                                disabled={employees.length <= 1}
                                                className="rounded-full bg-white/10 p-2 text-rose-200 transition hover:bg-white/20 disabled:opacity-40"
                                                title="Remove employee"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {emp.hasUser && emp.username && (
                                        <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                                            @{emp.username}
                                        </span>
                                    )}
                                    {isSaving && (
                                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-400/20 px-3 py-1 text-xs font-semibold text-blue-100">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Saving
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 p-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Salary Type</span>
                                        {isAdmin ? (
                                            <select
                                                value={emp.salaryType}
                                                onChange={(e) => updateEmployee(emp.id, 'salaryType', e.target.value)}
                                                className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                            >
                                                <option>Fixed</option>
                                                <option>Daily</option>
                                            </select>
                                        ) : (
                                            <div className="mt-2 text-sm font-semibold text-slate-800">{emp.salaryType}</div>
                                        )}
                                    </label>

                                    <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Base Salary</span>
                                        {isAdmin ? (
                                            <input
                                                type="number"
                                                value={emp.basicSalary || ''}
                                                onChange={(e) => updateEmployee(emp.id, 'basicSalary', parseFloat(e.target.value) || 0)}
                                                className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                            />
                                        ) : (
                                            <div className="mt-2 text-sm font-semibold text-slate-800">{emp.basicSalary || 0}</div>
                                        )}
                                    </label>

                                    <label className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-amber-600">Pending</span>
                                        {isAdmin ? (
                                            <input
                                                type="number"
                                                value={emp.pendingSalary || ''}
                                                onChange={(e) => updateEmployee(emp.id, 'pendingSalary', parseFloat(e.target.value) || 0)}
                                                className="mt-2 w-full bg-transparent text-sm font-semibold text-amber-800 outline-none"
                                            />
                                        ) : (
                                            <div className="mt-2 text-sm font-semibold text-amber-800">{emp.pendingSalary || 0}</div>
                                        )}
                                    </label>

                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-600">Net Amount</span>
                                        <div className="mt-2 text-sm font-semibold text-emerald-800">{calculateNetSalary(emp)}</div>
                                    </div>

                                    <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Paid Amount</span>
                                        {isAdmin ? (
                                            <input
                                                type="number"
                                                value={emp.paidAmount || ''}
                                                onChange={(e) => updateEmployee(emp.id, 'paidAmount', parseFloat(e.target.value) || 0)}
                                                className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                            />
                                        ) : (
                                            <div className="mt-2 text-sm font-semibold text-slate-800">{emp.paidAmount || 0}</div>
                                        )}
                                    </label>

                                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-rose-600">Remaining</span>
                                        <div className="mt-2 text-sm font-semibold text-rose-800">{calculateRemaining(emp)}</div>
                                    </div>
                                </div>

                                <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Selected Day Action</p>
                                            <h4 className="mt-1 text-base font-semibold text-slate-900">
                                                {activeDay ? `${activeDay.dayName}, ${activeDay.day}` : 'Choose a day'}
                                            </h4>
                                        </div>
                                        {displayStatus === 'dayoff' ? (
                                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Day Off</span>
                                        ) : (
                                            <span className={clsx(
                                                'rounded-full px-3 py-1 text-xs font-semibold',
                                                displayStatus === 'present'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : displayStatus == null
                                                    ? 'bg-slate-200 text-slate-600'
                                                    : 'bg-rose-100 text-rose-700'
                                            )}>
                                                {displayStatus === 'present' ? 'Present' : displayStatus == null ? 'Blank' : 'Absent'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleAttendance(emp.id, activeDayIndex)}
                                            disabled={!canEditDay}
                                            className={clsx(
                                                'rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition',
                                                !canEditDay
                                                    ? 'bg-slate-200 text-slate-500'
                                                    : displayStatus === 'present'
                                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                    : 'bg-rose-600 text-white hover:bg-rose-700'
                                            )}
                                        >
                                            {selectedDayIsFriday
                                                ? 'Friday is a fixed day off'
                                                : !canEditDay
                                                ? 'Only today can be edited in client mode'
                                                : displayStatus === 'present'
                                                ? 'Mark as Absent'
                                                : 'Mark as Present'}
                                        </button>

                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="rounded-2xl border border-slate-200 bg-white p-3">
                                                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Overtime Hours</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    value={overtimeValue}
                                                    disabled={!canEditDay}
                                                    onChange={(e) => updateOvertime(emp.id, activeDayIndex, e.target.value)}
                                                    className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none disabled:text-slate-400"
                                                />
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => onOpenNotes(emp)}
                                                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                                Notes
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

export default AttendanceMobileView;
