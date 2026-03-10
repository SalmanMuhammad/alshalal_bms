// Use relative URL for local dev through Vite proxy, or an absolute backend URL in production.
const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_BASE_URL = RAW_API_BASE_URL.endsWith('/') ? RAW_API_BASE_URL.slice(0, -1) : RAW_API_BASE_URL;
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);
const WAKE_RETRY_DELAY_MS = 4000;

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status) {
    return status === 502 || status === 503 || status === 504;
}

function buildNetworkErrorMessage(error) {
    if (error.name === 'AbortError') {
        return 'The backend took too long to respond. If it is hosted on a free Render service, it may be waking up. Please wait a few seconds and try again.';
    }

    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return 'Cannot reach the backend server. If it is hosted on a free Render service, it may be waking up. Please wait 20-40 seconds and try again.';
    }

    return error.message;
}

async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

// Helper function for API calls
async function apiCall(endpoint, options = {}, config = {}) {
    const { retryAttempts = 0, timeoutMs = DEFAULT_TIMEOUT_MS } = config;
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    // Add authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const requestUrl = `${API_BASE_URL}${endpoint}`;

    for (let attempt = 0; attempt <= retryAttempts; attempt += 1) {
        try {
            const response = await fetchWithTimeout(requestUrl, {
                headers,
                ...options,
            }, timeoutMs);

            if (!response.ok) {
                if (attempt < retryAttempts && isRetryableStatus(response.status)) {
                    await sleep(WAKE_RETRY_DELAY_MS);
                    continue;
                }

                let errorMessage = `API request failed with status ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const text = await response.text();
                if (!text) {
                    return null;
                }
                return JSON.parse(text);
            }

            return await response.text();
        } catch (error) {
            const canRetry = attempt < retryAttempts
                && (error.name === 'AbortError'
                    || error.message.includes('Failed to fetch')
                    || error.message.includes('NetworkError'));

            if (canRetry) {
                await sleep(WAKE_RETRY_DELAY_MS);
                continue;
            }

            console.error('API Error:', error);
            throw new Error(buildNetworkErrorMessage(error));
        }
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
    }, { retryAttempts: 1, timeoutMs: 20000 }),
    getSetupStatus: () => apiCall('/auth/setup-status', {}, { retryAttempts: 2, timeoutMs: 20000 }),
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
