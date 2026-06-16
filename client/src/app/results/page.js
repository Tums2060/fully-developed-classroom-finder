'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Building2, Clock, Users, ShieldAlert, BadgeCheck } from 'lucide-react';

function ResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const day = searchParams.get('day_of_week') || '';
    const start = searchParams.get('start_time') || '';
    const end = searchParams.get('end_time') || '';
    const capacity = searchParams.get('capacity') || '';
    const roomType = searchParams.get('room_type') || '';

    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter states
    const [selectedBuilding, setSelectedBuilding] = useState('All');
    const [sortBy, setSortBy] = useState('name'); // name or capacity

    useEffect(() => {
        if (!day || !start || !end) {
            router.push('/');
            return;
        }

        const fetchAvailableRooms = async () => {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams({
                    day_of_week: day,
                    start_time: start,
                    end_time: end
                });
                if (capacity) params.append('capacity', capacity);
                if (roomType && roomType !== 'All') params.append('room_type', roomType);

                const res = await fetch(`http://localhost:5000/api/public/search/available?${params.toString()}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to fetch search results');
                }
                const data = await res.json();
                setRooms(data);
                setFilteredRooms(data);
            } catch (err) {
                console.error(err);
                setError(err.message || 'Unable to load available classrooms.');
            } finally {
                setLoading(false);
            }
        };

        fetchAvailableRooms();
    }, [day, start, end, capacity, roomType, router]);

    // Apply filtering and sorting
    useEffect(() => {
        let result = [...rooms];

        if (selectedBuilding !== 'All') {
            result = result.filter(r => r.building_name === selectedBuilding);
        }

        if (sortBy === 'capacity-desc') {
            result.sort((a, b) => b.capacity - a.capacity);
        } else if (sortBy === 'capacity-asc') {
            result.sort((a, b) => a.capacity - b.capacity);
        } else {
            // Default sort by building and room name
            result.sort((a, b) => {
                const bCompare = a.building_name.localeCompare(b.building_name);
                if (bCompare !== 0) return bCompare;
                return a.room_name.localeCompare(b.room_name);
            });
        }

        setFilteredRooms(result);
    }, [rooms, selectedBuilding, sortBy]);

    // Extract unique building names for quick filtering
    const buildings = ['All', ...new Set(rooms.map(r => r.building_name))];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-blue-900 text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center space-x-2 text-blue-200 hover:text-white transition-all">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="font-semibold text-sm">Back to Search</span>
                        </Link>
                        <div className="flex items-center space-x-2">
                            <GraduationCap className="h-6 w-6 text-blue-300" />
                            <span className="font-bold text-lg hidden sm:inline">Free Classroom Finder</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Results Header Info */}
            <div className="bg-white border-b border-slate-200 py-6 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Search Results</h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-slate-600 text-sm">
                            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                                Day: <strong className="text-slate-900">{day}</strong>
                            </span>
                            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                                Time: <strong className="text-slate-900">{start} - {end}</strong>
                            </span>
                            {capacity && (
                                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                                    Min Capacity: <strong className="text-slate-900">{capacity}</strong>
                                </span>
                            )}
                            {roomType && roomType !== 'All' && (
                                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                                    Type: <strong className="text-slate-900">{roomType}</strong>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Sorting & Filter controls */}
                    {!loading && rooms.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3">
                            <div>
                                <label htmlFor="building-filter" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Building</label>
                                <select
                                    id="building-filter"
                                    value={selectedBuilding}
                                    onChange={(e) => setSelectedBuilding(e.target.value)}
                                    className="rounded-md border-slate-300 border p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                                >
                                    {buildings.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="sort-by" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sort By</label>
                                <select
                                    id="sort-by"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="rounded-md border-slate-300 border p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                                >
                                    <option value="name">Name & Building</option>
                                    <option value="capacity-desc">Capacity (High to Low)</option>
                                    <option value="capacity-asc">Capacity (Low to High)</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Grid */}
            <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-slate-500 text-sm">Searching for empty classrooms...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3 max-w-2xl mx-auto">
                        <ShieldAlert className="h-6 w-6 text-red-600 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold">Search Error</h3>
                            <p className="text-sm mt-1">{error}</p>
                            <Link href="/" className="mt-3 inline-block bg-red-600 text-white font-semibold text-sm px-4 py-2 rounded-md hover:bg-red-700 transition">
                                Go Back
                            </Link>
                        </div>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md mx-auto mt-8">
                        <ShieldAlert className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-800">No Classrooms Available</h2>
                        <p className="text-slate-500 mt-2 text-sm">
                            {rooms.length === 0 
                                ? "All rooms are currently booked or do not match your criteria for this time slot." 
                                : "No classrooms match the selected building filter."
                            }
                        </p>
                        <div className="mt-6 flex justify-center gap-3">
                            {rooms.length > 0 && selectedBuilding !== 'All' ? (
                                <button onClick={() => setSelectedBuilding('All')} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-md text-sm font-medium transition">
                                    Clear Filters
                                </button>
                            ) : null}
                            <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow">
                                Adjust Time Slot
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Room Cards list */
                    <div className="space-y-6">
                        <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            Available Classrooms ({filteredRooms.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRooms.map((room) => (
                                <div 
                                    key={room.id} 
                                    className="bg-white rounded-xl border border-slate-100 shadow p-6 card-hover flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-lg text-slate-900">{room.room_name}</h3>
                                            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                                                <BadgeCheck className="h-3.5 w-3.5" /> Available
                                            </span>
                                        </div>

                                        <div className="space-y-2 mt-4 text-slate-600 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-slate-400" />
                                                <span>Building: <strong className="text-slate-800">{room.building_name}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-slate-400" />
                                                <span>Capacity: <strong className="text-slate-800">{room.capacity} seats</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="h-4 w-4 text-slate-400" />
                                                <span>Type: <strong className="text-slate-800 capitalize">{room.room_type}</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 mt-5 pt-4 flex justify-between items-center text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5 text-blue-500" /> Valid for queried slot
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-500 text-sm">Loading page parameters...</p>
            </div>
        }>
            <ResultsContent />
        </Suspense>
    );
}
