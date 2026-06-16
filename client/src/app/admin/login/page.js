'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { GraduationCap, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    const { user, login, loading } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            router.push('/admin/dashboard');
        }
    }, [user, loading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const res = await login(username, password);
        if (res.success) {
            router.push('/admin/dashboard');
        } else {
            setError(res.error || 'Invalid credentials. Please try again.');
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
            <div className="absolute top-4 left-4">
                <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-all">
                    <ArrowLeft className="h-4 w-4" /> Public Portal
                </Link>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-blue-900 p-3 rounded-xl shadow-md">
                        <GraduationCap className="h-10 w-10 text-blue-200" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Administrator Login
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Free Classroom Finder Control Panel
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-lg rounded-xl border border-slate-100 sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-lg flex items-start gap-2.5 text-sm font-medium">
                                <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                                Username
                            </label>
                            <div className="mt-1.5 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950 sm:text-sm bg-white"
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                                Password
                            </label>
                            <div className="mt-1.5 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950 sm:text-sm bg-white"
                                    placeholder="Enter password"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Logging in...' : 'Log In'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
