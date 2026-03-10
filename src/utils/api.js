// Use relative URL to leverage Vite proxy (no CORS issues)
// Or use absolute URL if VITE_API_URL is set (for production)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    // Add authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers,
            ...options,
        });
        
        if (!response.ok) {
            // Try to parse error message, but handle empty responses
            let errorMessage = `API request failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // Response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            if (!text) {
                return null; // Empty response
            }
            return JSON.parse(text);
        }
        
        return await response.text();
    } catch (error) {
        console.error('API Error:', error);
        // Provide more helpful error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Cannot connect to server. Make sure the backend server is running on port 5001.');
        }
        throw error;
    }
}

// Employee API
export const employeeAPI = {
    getAll: () => apiCall('/employees'),
    getById: (id) => apiCall(`/employees/${id}`),
    create: (data) => apiCall('/employees', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => apiCall(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => apiCall(`/employees/${id}`, {
        method: 'DELETE',
    }),
};

// Attendance API
export const attendanceAPI = {
    getByMonth: (month, year) => apiCall(`/attendance/${month}/${year}`),
    saveMonth: (month, year, employees) => apiCall(`/attendance/${month}/${year}`, {
        method: 'POST',
        body: JSON.stringify({ employees }),
    }),
    updateDay: (employeeId, month, year, dayIndex, data) => apiCall(`/attendance/${employeeId}/${month}/${year}/${dayIndex}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
};

// Quotation API
export const quotationAPI = {
    getAll: () => apiCall('/quotations'),
    getById: (id) => apiCall(`/quotations/${id}`),
    create: (data) => apiCall('/quotations', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => apiCall(`/quotations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => apiCall(`/quotations/${id}`, {
        method: 'DELETE',
    }),
};

// Auth API
export const authAPI = {
    login: (username, password) => apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    }),
    register: (username, password, role, employeeId) => apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, role, employeeId }),
    }),
    resetPassword: (username, newPassword) => apiCall('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ username, newPassword }),
    }),
    getMe: () => apiCall('/auth/me'),
};

