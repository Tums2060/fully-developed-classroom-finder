'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Search,
    GraduationCap,
    Building2,
    CalendarRange,
    Clock,
    Users,
    SlidersHorizontal,
    ShieldAlert
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function SearchPage() {
    // Search Parameter states
    const [dayOfWeek, setDayOfWeek] = useState('Monday');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('10:00');
    const [capacity, setCapacity] = useState('');
    const [roomType, setRoomType] = useState('All');
    const [roomTypes, setRoomTypes] = useState([]);

    // Validation error state
    const [error, setError] = useState('');

    // Results states
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [loadingResults, setLoadingResults] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    // Client filtering & sorting states
    const [selectedBuilding, setSelectedBuilding] = useState('All');
    const [sortBy, setSortBy] = useState('name'); // name, capacity-desc, capacity-asc

    // Student room claiming states 
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [selectedRoomForClaim, setSelectedRoomForClaim] = useState(null);
    const [groupSize, setGroupSize] = useState(1);
    const [duration, setDuration] = useState(30);
    const [claimSuccess, setClaimSuccess] = useState(false);
    const [cancellationPin, setCancellationPin] = useState('');
    const [claimError, setClaimError] = useState('');
    const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

    // Fetch available classrooms based on current filters
    const fetchAvailableRooms = async (dayVal = dayOfWeek, startVal = startTime, endVal = endTime, capVal = capacity, typeVal = roomType) => {
        setLoadingResults(true);
        setSearchError('');
        try {
            const params = new URLSearchParams({
                day_of_week: dayVal,
                start_time: startVal,
                end_time: endVal
            });

            if (capVal) params.append('capacity', capVal);
            if (typeVal && typeVal !== 'All') params.append('room_type', typeVal);

            const res = await fetch(`http://localhost:5000/api/public/search/available?${params.toString()}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch search results');
            }
            const data = await res.json();
            setRooms(data);
            setFilteredRooms(data);
            setHasSearched(true);
        } catch (err) {
            console.error(err);
            setSearchError(err.message || 'Unable to load available classrooms.');
        } finally {
            setLoadingResults(false);
        }
    };

    // Initialize defaults and run initial search on mount
    useEffect(() => {
        const weekdays = ['Monday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayIndex = new Date().getDay();
        const defaultDay = weekdays[currentDayIndex];
        setDayOfWeek(defaultDay);

        const fetchRoomTypesAndInitialRooms = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/public/room-types');
                if (res.ok) {
                    const data = await res.json();
                    setRoomTypes(data);
                }
            } catch (err) {
                console.error('Failed to fetch room types:', err);
            }

            // Run initial search automatically
            await fetchAvailableRooms(defaultDay, startTime, endTime, capacity, roomType);
        };

        fetchRoomTypesAndInitialRooms();
    }, []);

    // Apply sorting and building filtering client-side
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

    const handleSearch = (e) => {
        e.preventDefault();
        setError('');

        if (startTime >= endTime) {
            setError('Start time must be strictly before end time.');
            return;
        }

        fetchAvailableRooms(dayOfWeek, startTime, endTime, capacity, roomType);
    };

    // Claim Event Handlers
    const handleOpenClaimModal = (room) => {
        setSelectedRoomForClaim(room);
        setGroupSize(1);
        const availableOptions = getFilteredDurations(room);
        setDuration(availableOptions.length > 0 ? availableOptions[0].value : 30);
        setClaimSuccess(false);
        setCancellationPin('');
        setClaimError('');
        setIsClaimModalOpen(true);
    };

    const handleCloseClaimModal = () => {
        setIsClaimModalOpen(false);
        setSelectedRoomForClaim(null);
    };

    // Dynamically filter duration dropdown options based on next official class
    const getFilteredDurations = (room) => {
        const allDurations = [
            { label: '30 mins', value: 30 },
            { label: '45 mins', value: 45 },
            { label: '1 hr', value: 60 },
            { label: '1.5 hrs', value: 90 },
            { label: '2 hrs', value: 120 }
        ];
        if (!room.next_class_start) return allDurations;

        const nextClassDate = new Date(room.next_class_start);
        const now = new Date();
        const diffMinutes = Math.floor((nextClassDate - now) / 60000);

        return allDurations.filter(opt => opt.value <= diffMinutes);
    };

    const handleConfirmClaim = async (e) => {
        e.preventDefault();
        setClaimError('');
        setIsSubmittingClaim(true);

        try {
            // Get or generate device token 
            let deviceToken = localStorage.getItem('device_token');
            if (!deviceToken) {
                deviceToken = uuidv4();
                localStorage.setItem('device_token', deviceToken);
            }

            const response = await fetch('http://localhost:5000/api/claims', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    classroom_id: selectedRoomForClaim.id,
                    device_token: deviceToken,
                    group_size: groupSize,
                    duration: duration
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to claim room');
            }

            setCancellationPin(data.cancel_pin);
            setClaimSuccess(true);
            // Re-fetch rooms to update client view immediately
            fetchAvailableRooms(dayOfWeek, startTime, endTime, capacity, roomType);
        } catch (err) {
            console.error('Claim room error:', err);
            setClaimError(err.message || 'An error occurred while claiming the room.');
        } finally {
            setIsSubmittingClaim(false);
        }
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const buildings = ['All', ...new Set(rooms.map(r => r.building_name))];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            {/* Header / Navigation */}
            <header className="bg-blue-900 text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <Link href="/" className="flex items-center space-x-3">
                                <Image
                                    src="/strathmore-logo.png"
                                    alt="Free Classroom Finder Logo"
                                    width={120}
                                    height={43}
                                    className="h-11 w-auto object-contain"
                                    priority
                                />
                                <span className="font-bold text-xl tracking-tight">
                                    Free Classroom Finder
                                </span>
                            </Link>
                        </div>
                        <div>
                            <Link
                                href="/admin/login"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all-custom shadow"
                            >
                                Admin Login
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
                {/* Welcome / Intro */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                        Find an Empty Classroom
                    </h1>
                    <p className="mt-2 text-slate-600 text-sm">
                        Search real-time classroom availability for study groups, lectures, or private study.
                    </p>
                </div>

                {/* Grid Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Search Parameters Form */}
                    <div className="lg:col-span-4 lg:order-last">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80 sticky top-6">
                            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <Search className="h-4.5 w-4.5 text-blue-600" /> Parameters
                            </h2>
                            <form onSubmit={handleSearch} className="space-y-5">
                                {error && (
                                    <div className="bg-rose-50 text-rose-600 p-3 rounded-md text-xs font-semibold border border-rose-100">
                                        {error}
                                    </div>
                                )}

                                {/* Day of the Week */}
                                <div>
                                    <label htmlFor="day" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <CalendarRange className="h-3.5 w-3.5 text-blue-600" /> Day of Week
                                    </label>
                                    <select
                                        id="day"
                                        value={dayOfWeek}
                                        onChange={(e) => setDayOfWeek(e.target.value)}
                                        className="block w-full rounded-md border-slate-300 border p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-slate-900 text-sm transition-all"
                                        required
                                    >
                                        {days.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Times grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="start_time" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-blue-600" /> Start Time
                                        </label>
                                        <input
                                            type="time"
                                            id="start_time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="block w-full rounded-md border-slate-300 border p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-slate-900"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="end_time" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-blue-600" /> End Time
                                        </label>
                                        <input
                                            type="time"
                                            id="end_time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="block w-full rounded-md border-slate-300 border p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-slate-900"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Optional Filters */}
                                <div className="border-t border-slate-100 pt-4 space-y-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" /> Filters (Optional)
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="building-filter" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                                <Building2 className="h-3.5 w-3.5 text-blue-600" /> Building Location
                                            </label>
                                            <select
                                                id="building-filter"
                                                value={selectedBuilding}
                                                onChange={(e) => setSelectedBuilding(e.target.value)}
                                                className="block w-full rounded-md border-slate-300 border p-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-slate-900"
                                            >
                                                {buildings.map(b => (
                                                    <option key={b} value={b}>{b === 'All' ? 'All Buildings' : b}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="capacity" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5 text-blue-600" /> Min Capacity
                                            </label>
                                            <input
                                                type="number"
                                                id="capacity"
                                                value={capacity}
                                                onChange={(e) => setCapacity(e.target.value)}
                                                placeholder="e.g. 30"
                                                min="1"
                                                className="block w-full rounded-md border-slate-300 border p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="room_type" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                                <Building2 className="h-3.5 w-3.5 text-blue-600" /> Room Type
                                            </label>
                                            <select
                                                id="room_type"
                                                value={roomType}
                                                onChange={(e) => setRoomType(e.target.value)}
                                                className="block w-full rounded-md border-slate-300 border p-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-slate-900"
                                            >
                                                <option value="All">All Types</option>
                                                {roomTypes.map((type) => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-all-custom shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer text-sm"
                                >
                                    <Search className="h-4.5 w-4.5" /> Search Availability
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Live Search Results */}
                    <div className="lg:col-span-8 lg:order-first space-y-6">
                        {/* Results Toolbar with filters/sorting */}
                        {hasSearched && !loadingResults && !searchError && rooms.length > 0 && (
                            <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="text-sm font-semibold text-slate-600">
                                    Available Classrooms (<span className="text-blue-600">{filteredRooms.length}</span>)
                                </div>
                                <div className="flex items-center gap-3">
                                    <div>
                                        <select
                                            id="sort-by"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="rounded-md border-slate-300 border p-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-medium"
                                        >
                                            <option value="name">Sort by Name</option>
                                            <option value="capacity-desc">Capacity: High to Low</option>
                                            <option value="capacity-asc">Capacity: Low to High</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading spinner */}
                        {loadingResults && (
                            <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-16 flex flex-col items-center justify-center space-y-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                <p className="text-slate-500 text-sm font-semibold">Querying live space metrics...</p>
                            </div>
                        )}

                        {/* Error panel */}
                        {!loadingResults && searchError && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-6 rounded-xl flex items-start gap-3">
                                <ShieldAlert className="h-6 w-6 text-rose-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-sm">Search Error</h3>
                                    <p className="text-xs mt-1 font-medium">{searchError}</p>
                                </div>
                            </div>
                        )}

                        {/* Empty/No available rooms state */}
                        {!loadingResults && !searchError && hasSearched && filteredRooms.length === 0 && (
                            <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-16 text-center max-w-md mx-auto">
                                <ShieldAlert className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                <h3 className="font-bold text-slate-800 text-base">No Classrooms Available</h3>
                                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                                    {rooms.length === 0
                                        ? "All classrooms are currently booked or do not match your criteria for this time slot."
                                        : "No classrooms match the selected building filter."
                                    }
                                </p>
                                {rooms.length > 0 && selectedBuilding !== 'All' && (
                                    <button
                                        onClick={() => setSelectedBuilding('All')}
                                        className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3.5 py-2 rounded-md font-semibold transition"
                                    >
                                        Clear Building Filter
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Available Rooms Grid */}
                        {!loadingResults && !searchError && hasSearched && filteredRooms.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {filteredRooms.map((room) => (
                                    <div
                                        key={room.id}
                                        className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 hover:shadow-md transition-all-custom flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start gap-2 mb-3">
                                                <h3 className="font-bold text-slate-800 text-base truncate">{room.room_name}</h3>
                                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100 flex-shrink-0">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Available
                                                </span>
                                            </div>

                                            <div className="space-y-2.5 mt-4 text-slate-600 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-slate-400" />
                                                    <span>Building: <strong className="text-slate-700 font-semibold">{room.building_name}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-slate-400" />
                                                    <span>Capacity: <strong className="text-slate-700 font-semibold">{room.capacity} seats</strong></span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="h-4 w-4 text-slate-400" />
                                                    <span>Type: <strong className="text-slate-700 font-semibold capitalize">{room.room_type}</strong></span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100 mt-5 pt-3.5 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5 text-blue-500" /> Valid for: {dayOfWeek} {startTime} - {endTime}
                                            </span>
                                            {room.capacity > 25 ? (
                                                <span className="bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded text-[10px] border border-slate-200">
                                                    Walk-in Only (Shared Space)
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleOpenClaimModal(room)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded text-[10px] transition-colors cursor-pointer"
                                                >
                                                    Claim Room
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Claim Modal */}
            {isClaimModalOpen && selectedRoomForClaim && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-150 overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-base">Claim Room: {selectedRoomForClaim.room_name}</h3>
                            <button
                                onClick={handleCloseClaimModal}
                                className="text-white/80 hover:text-white font-bold text-xl cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {claimSuccess ? (
                                <div className="text-center space-y-4">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-lg">Room Claimed!</h4>
                                    <p className="text-sm text-slate-650">
                                        You have successfully claimed <strong>{selectedRoomForClaim.room_name}</strong>.
                                    </p>
                                    <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-4 max-w-xs mx-auto">
                                        <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Cancellation PIN</span>
                                        <span className="block text-3xl font-extrabold text-blue-900 tracking-widest mt-1">{cancellationPin}</span>
                                        <span className="block text-[9px] text-rose-500 mt-2 font-medium">Keep this PIN. You will need it to cancel this claim.</span>
                                    </div>
                                    <button
                                        onClick={handleCloseClaimModal}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-md transition-colors w-full cursor-pointer text-sm shadow"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleConfirmClaim} className="space-y-5">
                                    {claimError && (
                                        <div className="bg-rose-55 text-rose-650 p-3 rounded-md text-xs font-semibold border border-rose-100">
                                            {claimError}
                                        </div>
                                    )}

                                    {/* Info Panel */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
                                        <p>Max claim duration is 90 minutes. Active claim duration is automatically verified.</p>
                                        {selectedRoomForClaim.next_class_start && (
                                            <p className="mt-1 font-semibold text-amber-700">
                                                Next official class: {new Date(selectedRoomForClaim.next_class_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </div>

                                    {/* Group Size selection */}
                                    <div>
                                        <label htmlFor="modal_group_size" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Group Size (Max {selectedRoomForClaim.capacity})
                                        </label>
                                        <select
                                            id="modal_group_size"
                                            value={groupSize}
                                            onChange={(e) => setGroupSize(parseInt(e.target.value, 10))}
                                            className="block w-full rounded-md border-slate-350 border p-2.5 bg-white text-slate-905 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            required
                                        >
                                            {Array.from({ length: selectedRoomForClaim.capacity }, (_, i) => i + 1).map((size) => (
                                                <option key={size} value={size}>{size} {size === 1 ? 'person' : 'people'}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Duration selection */}
                                    <div>
                                        <label htmlFor="modal_duration" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Claim Duration
                                        </label>
                                        {getFilteredDurations(selectedRoomForClaim).length > 0 ? (
                                            <select
                                                id="modal_duration"
                                                value={duration}
                                                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                                                className="block w-full rounded-md border-slate-350 border p-2.5 bg-white text-slate-905 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                required
                                            >
                                                {getFilteredDurations(selectedRoomForClaim).map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md p-3 font-semibold">
                                                This room cannot be claimed because the next official class starts in less than 30 minutes.
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleCloseClaimModal}
                                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-md transition-colors cursor-pointer text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingClaim || getFilteredDurations(selectedRoomForClaim).length === 0}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-md transition-colors cursor-pointer text-sm shadow flex justify-center items-center gap-2"
                                        >
                                            {isSubmittingClaim ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                    Claiming...
                                                </>
                                            ) : (
                                                'Confirm Claim'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-slate-100 border-t border-slate-200 py-6 text-center text-slate-500 text-sm">
                &copy; {new Date().getFullYear()} Strathmore University Free Classroom Finder. For educational institutions and study groups.
            </footer>
        </div>
    );
}