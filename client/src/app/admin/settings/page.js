'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Shield, Key, UserPlus, Users, Trash2, X, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
    const { user, authFetch } = useAuth();
    
    // Feedback alerts
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Personal Change Password Form
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Super Admin: List of Administrators & Create Admin Form
    const [admins, setAdmins] = useState([]);
    const [newAdminForm, setNewAdminForm] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
    const [loadingAdmins, setLoadingAdmins] = useState(false);

    const triggerFeedback = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
    };

    // Fetch administrative accounts (Super Admin only)
    const fetchAdmins = async () => {
        if (!user?.isSuperAdmin) return;
        setLoadingAdmins(true);
        try {
            const res = await authFetch('/admin/settings/admins');
            if (res.ok) {
                const data = await res.json();
                setAdmins(data);
            }
        } catch (err) {
            console.error('Failed to load administrators directory', err);
        } finally {
            setLoadingAdmins(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, [user]);

    // Handle personal password update
    const handleChangePassword = async (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            triggerFeedback('error', 'All password fields are required.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            triggerFeedback('error', 'New passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            triggerFeedback('error', 'New password must be at least 6 characters long.');
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const res = await authFetch('/admin/auth/change-password', {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to update password');

            triggerFeedback('success', 'Your password has been changed successfully.');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (err) {
            triggerFeedback('error', err.message);
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    // Handle standard admin creation (Super Admin only)
    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        const { username, password, confirmPassword } = newAdminForm;

        if (!username.trim() || !password || !confirmPassword) {
            triggerFeedback('error', 'All administrator fields are required.');
            return;
        }

        if (password !== confirmPassword) {
            triggerFeedback('error', 'Administrator passwords do not match.');
            return;
        }

        if (password.length < 6) {
            triggerFeedback('error', 'Password must be at least 6 characters long.');
            return;
        }

        setIsCreatingAdmin(true);
        try {
            const res = await authFetch('/admin/settings/create-admin', {
                method: 'POST',
                body: JSON.stringify({ username: username.trim(), password })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to create administrator');

            triggerFeedback('success', `Administrator account '${username.trim()}' created.`);
            setNewAdminForm({ username: '', password: '', confirmPassword: '' });
            fetchAdmins();
        } catch (err) {
            triggerFeedback('error', err.message);
        } finally {
            setIsCreatingAdmin(false);
        }
    };

    // Handle revoking administrator access (Super Admin only)
    const handleRevokeAdmin = async (id, targetUsername) => {
        if (!user?.isSuperAdmin) return;
        if (!confirm(`Are you sure you want to revoke admin access for '${targetUsername}'?`)) return;

        try {
            const res = await authFetch(`/admin/settings/revoke-admin/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to revoke administrator access');

            triggerFeedback('success', `Access revoked for '${targetUsername}'.`);
            fetchAdmins();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    return (
        <div className="space-y-8">
            {/* Notifications feedback */}
            {feedback.message && (
                <div className={`p-4 rounded-lg flex items-start gap-3 border transition-all ${
                    feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                    {feedback.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                    )}
                    <span className="text-sm font-semibold">{feedback.message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- PASSWORD MODIFICATION --- */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 lg:col-span-1">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Key className="h-5 w-5 text-blue-600" /> Security Settings
                        </h3>
                        <p className="text-slate-500 text-xs mt-0.5">Modify your administrator access password.</p>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label htmlFor="currentPass" className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                            <input
                                type="password"
                                id="currentPass"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                className="block w-full border border-slate-300 rounded-md p-2.5 text-slate-950 bg-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="newPass" className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                            <input
                                type="password"
                                id="newPass"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="block w-full border border-slate-300 rounded-md p-2.5 text-slate-950 bg-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmNewPass" className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                id="confirmNewPass"
                                value={passwordForm.confirmNewPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                                className="block w-full border border-slate-300 rounded-md p-2.5 text-slate-950 bg-white"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isUpdatingPassword}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
                        >
                            {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>

                {/* --- SUPER ADMIN PANEL --- */}
                {user?.isSuperAdmin ? (
                    <div className="lg:col-span-2 space-y-8">
                        {/* Create Admin Form */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <UserPlus className="h-5 w-5 text-emerald-600" /> Create Administrator Account
                                </h3>
                                <p className="text-slate-500 text-xs mt-0.5">Provision a standard administrator login. (Standard admins cannot write settings).</p>
                            </div>

                            <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label htmlFor="newUsername" className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        id="newUsername"
                                        value={newAdminForm.username}
                                        onChange={(e) => setNewAdminForm({ ...newAdminForm, username: e.target.value })}
                                        className="block w-full border border-slate-300 rounded-md p-2.5 text-slate-950 bg-white"
                                        placeholder="e.g. jsmith"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        value={newAdminForm.password}
                                        onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                                        className="block w-full border border-slate-300 rounded-md p-2.5 text-slate-950 bg-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={newAdminForm.confirmPassword}
                                        onChange={(e) => setNewAdminForm({ ...newAdminForm, confirmPassword: e.target.value })}
                                        className="block w-full border border-slate-300 rounded-md p-2.5 text-slate-950 bg-white"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreatingAdmin}
                                    className="md:col-span-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <UserPlus className="h-4 w-4" />
                                    {isCreatingAdmin ? 'Creating...' : 'Register Administrator'}
                                </button>
                            </form>
                        </div>

                        {/* Admins Directory Table */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-slate-600" /> Administrators Directory
                                </h3>
                                <p className="text-slate-500 text-xs mt-0.5">List of system accounts and role privileges.</p>
                            </div>

                            {loadingAdmins ? (
                                <div className="text-center py-6">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 mx-auto"></div>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase">
                                            <th className="py-3 px-6">Username</th>
                                            <th className="py-3 px-6">Role Privilege</th>
                                            <th className="py-3 px-6 text-right">Access Revocation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {admins.map((adm) => {
                                            const isSelf = adm.id === user.id;
                                            return (
                                                <tr key={adm.id} className="hover:bg-slate-50/50">
                                                    <td className="py-4 px-6 font-bold text-slate-800">
                                                        {adm.username} {isSelf && <span className="text-slate-400 font-normal text-xs">(you)</span>}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {adm.is_super_admin === 1 || adm.is_super_admin === true ? (
                                                            <span className="bg-blue-50 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100">
                                                                Super Admin
                                                            </span>
                                                        ) : (
                                                            <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full">
                                                                Admin
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        {adm.is_super_admin === 1 || adm.is_super_admin === true ? (
                                                            <span className="text-slate-400 text-xs font-semibold select-none pr-3">System Protected</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleRevokeAdmin(adm.id, adm.username)}
                                                                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 p-2 rounded-lg text-xs font-semibold transition"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" /> Revoke Access
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Standard Admin Settings Info Banner */
                    <div className="lg:col-span-2 bg-slate-100 p-6 rounded-xl border border-slate-200 flex items-start gap-4">
                        <ShieldAlert className="h-6 w-6 text-slate-500 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold text-slate-800">System Management Console</h4>
                            <p className="text-sm text-slate-500 mt-1">
                                Standard administrators are restricted from creating or revoking accounts. Contact the Super Admin if you need additional accounts created.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
