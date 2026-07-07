'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Check if token exists in localStorage on mount
    useEffect(() => {
        const verifyToken = async () => {
            const storedToken = localStorage.getItem('admin_token');
            if (!storedToken) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/admin/auth/verify`, {
                    headers: {
                        'Authorization': `Bearer ${storedToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.valid) {
                        setToken(storedToken);
                        setUser({
                            id: data.admin.id,
                            username: data.admin.username,
                            isSuperAdmin: data.admin.is_super_admin === 1 || data.admin.is_super_admin === true
                        });
                    } else {
                        localStorage.removeItem('admin_token');
                    }
                } else {
                    localStorage.removeItem('admin_token');
                }
            } catch (err) {
                console.error('Auth verification failed:', err);
                // Keep token but let pages deal with errors if offline,
                // or clear it if definitely unauthenticated.
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, []);

    // Login function
    const login = async (username, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            localStorage.setItem('admin_token', data.token);
            setToken(data.token);
            setUser({
                id: data.admin.id,
                username: data.admin.username,
                isSuperAdmin: data.admin.is_super_admin === 1 || data.admin.is_super_admin === true
            });
            return { success: true };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: err.message };
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('admin_token');
        setToken(null);
        setUser(null);
        router.push('/');
    };

    // Helper fetch with token injected automatically
    const authFetch = async (url, options = {}) => {
        const storedToken = token || localStorage.getItem('admin_token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (storedToken) {
            headers['Authorization'] = `Bearer ${storedToken}`;
        }

        const res = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers
        });

        if (res.status === 401) {
            // Token expired or invalid
            logout();
        }

        return res;
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch, API_BASE_URL }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
