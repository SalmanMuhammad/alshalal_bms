// Helper functions for Quotation System
export const emptyItem = (id) => ({
    id,
    product: '',
    description: '',
    quantity: 1,
    price: 0,
    discount: 0,
});

export const currency = (value) => `${value.toFixed(2)} SAR`;

export const addDays = (dateStr, days) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-GB');
};

// Helper functions for Attendance System
export const generateDays = (month, year) => {
    const days = [];
    const monthIndex = month - 1; // Convert to 0-indexed
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthIndex, day);
        date.setHours(0, 0, 0, 0);
        const dayOfWeek = date.getDay();
        const isFriday = dayOfWeek === 5; // Friday is 5
        const isPast = date < today;
        const isToday = date.getTime() === today.getTime();
        const isFuture = date > today;
        
        days.push({
            day,
            dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
            isFriday,
            dayIndex: day - 1, // For array indexing
            isPast,
            isToday,
            isFuture,
            date: date
        });
    }
    return days;
};

export const getMonthName = (monthNumber) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
};

export const initialEmployees = [
    { id: 1, name: 'Ahmed Ali', position: 'Production Manager' },
    { id: 2, name: 'Mohammed Hassan', position: 'Steel Worker' },
    { id: 3, name: 'Khalid Ibrahim', position: 'Labor' },
    { id: 4, name: 'Omar Abdullah', position: 'Steel Worker' },
    { id: 5, name: 'Yusuf Saleh', position: 'Labor' },
    { id: 6, name: 'Hassan Ali', position: 'Steel Worker' },
    { id: 7, name: 'Ibrahim Mohammed', position: 'Labor' },
    { id: 8, name: 'Saeed Ahmed', position: 'Steel Worker' },
    { id: 9, name: 'Fahad Khalid', position: 'Labor' },
    { id: 10, name: 'Nasser Omar', position: 'Steel Worker' },
    { id: 11, name: 'Tariq Yusuf', position: 'Labor' },
    { id: 12, name: 'Majed Hassan', position: 'Steel Worker' },
    { id: 13, name: 'Rashid Ibrahim', position: 'Labor' },
    { id: 14, name: 'Sultan Ahmed', position: 'Steel Worker' },
    { id: 15, name: 'Badr Mohammed', position: 'Labor' },
    { id: 16, name: 'Zaid Ali', position: 'Steel Worker' },
    { id: 17, name: 'Hamza Khalid', position: 'Labor' },
    { id: 18, name: 'Bilal Omar', position: 'Steel Worker' },
    { id: 19, name: 'Ammar Yusuf', position: 'Labor' },
    { id: 20, name: 'Faisal Hassan', position: 'Steel Worker' },
    { id: 21, name: 'Waleed Ibrahim', position: 'Labor' },
    { id: 22, name: 'Nawaf Ahmed', position: 'Steel Worker' },
    { id: 23, name: 'Turki Mohammed', position: 'Labor' },
    { id: 24, name: 'Mishal Ali', position: 'Steel Worker' },
    { id: 25, name: 'Saud Khalid', position: 'Labor' },
    { id: 26, name: 'Fahd Omar', position: 'Steel Worker' },
    { id: 27, name: 'Mansour Yusuf', position: 'Labor' },
    { id: 28, name: 'Bandar Hassan', position: 'Steel Worker' },
    { id: 29, name: 'Sami Ibrahim', position: 'Labor' },
    { id: 30, name: 'Hani Ahmed', position: 'Steel Worker' },
    { id: 31, name: 'Rami Mohammed', position: 'Labor' }
];

