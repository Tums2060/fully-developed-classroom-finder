'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { 
    LayoutDashboard, 
    Building2, 
    GraduationCap, 
    CalendarClock, 
    LineChart, 
    Settings, 
    LogOut,
    UserCheck,
    Loader
} from 'lucide-react';

export default function AdminLayout({ children }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Authenticated guard
    useEffect(() => {
        if (pathname === '/admin/login') return;
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router, pathname]);

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 gap-3">
                <Loader className="h-6 w-6 text-blue-900 animate-spin" />
                <span className="text-slate-600 font-medium">Verifying authorization...</span>
            </div>
        );
    }

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Campus Infrastructure', href: '/admin/campus', icon: Building2 },
        { name: 'Academics Records', href: '/admin/academics', icon: GraduationCap },
        { name: 'Timetable Scheduling', href: '/admin/timetable', icon: CalendarClock },
        { name: 'Utilization Analytics', href: '/admin/analytics', icon: LineChart },
        { name: 'System Settings', href: '/admin/settings', icon: Settings },
    ];

    const getPageTitle = () => {
        const item = navigation.find(n => pathname.startsWith(n.href));
        return item ? item.name : 'Admin Control Panel';
    };

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-blue-900 text-white flex flex-col justify-between shadow-xl flex-shrink-0 z-10">
                <div>
                    {/* Sidebar Brand Logo */}
                    <div className="h-16 flex items-center gap-2 px-4 border-b border-blue-800 bg-blue-950">
                        <Image
                            src="/strathmore-logo.png"
                            alt="Strathmore Logo"
                            width={84}
                            height={30}
                            className="h-7.5 w-auto object-contain"
                            priority
                        />
                        <span className="font-bold text-sm tracking-tight text-white">Classroom Finder</span>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="mt-6 px-4 space-y-1.5">
                        {navigation.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all-custom ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow'
                                            : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                                    }`}
                                >
                                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Account Panel */}
                <div className="p-4 border-t border-blue-800 bg-blue-950 flex flex-col gap-3">
                    <div className="flex items-center gap-3 px-2">
                        <div className="bg-blue-800 p-2 rounded-full">
                            <UserCheck className="h-5 w-5 text-blue-300" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{user?.username}</p>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300">
                                {user?.isSuperAdmin ? 'Super Admin' : 'Administrator'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 bg-blue-800/50 hover:bg-rose-700/80 text-blue-100 hover:text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all border border-blue-700/40 hover:border-transparent cursor-pointer"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
                    <h1 className="text-xl font-bold text-slate-800">{getPageTitle()}</h1>
                    <div className="flex items-center gap-4 text-sm text-slate-500 font-semibold">
                        <span>Academic Session: {new Date().getFullYear()}</span>
                    </div>
                </header>

                {/* Dashboard Router Outlet */}
                <main className="flex-grow p-8 overflow-y-auto bg-slate-50">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
