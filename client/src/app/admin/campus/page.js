'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Building2, GraduationCap, Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle } from 'lucide-react';

export default function CampusPage() {
    const { authFetch } = useAuth();
    
    // Tab State: 'buildings' or 'classrooms'
    const [activeTab, setActiveTab] = useState('buildings');
    
    // Data list states
    const [buildings, setBuildings] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Feedback alerts
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Modals & Form states
    const [buildingForm, setBuildingForm] = useState({ id: null, name: '' });
    const [showBuildingModal, setShowBuildingModal] = useState(false);

    const [classroomForm, setClassroomForm] = useState({ id: null, building_id: '', name: '', capacity: '', room_type: 'Lecture Hall' });
    const [showClassroomModal, setShowClassroomModal] = useState(false);

    // Fetch all records
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch buildings
            const buildingsRes = await authFetch('/admin/buildings');
            if (buildingsRes.ok) {
                const buildingsData = await buildingsRes.json();
                setBuildings(buildingsData);
            }

            // Fetch classrooms
            const classroomsRes = await authFetch('/admin/classrooms');
            if (classroomsRes.ok) {
                const classroomsData = await classroomsRes.json();
                setClassrooms(classroomsData);
            }
        } catch (err) {
            console.error('Failed to fetch campus infrastructure data', err);
            triggerFeedback('error', 'Error loading campus data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const triggerFeedback = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    };

    // --- BUILDING CRUD OPERATIONS ---

    const handleSaveBuilding = async (e) => {
        e.preventDefault();
        if (!buildingForm.name.trim()) return;

        const isEdit = buildingForm.id !== null;
        const url = isEdit ? `/admin/buildings/${buildingForm.id}` : '/admin/buildings';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await authFetch(url, {
                method,
                body: JSON.stringify({ name: buildingForm.name })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to save building');

            triggerFeedback('success', `Building ${isEdit ? 'updated' : 'added'} successfully.`);
            setShowBuildingModal(false);
            setBuildingForm({ id: null, name: '' });
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    const handleDeleteBuilding = async (id) => {
        if (!confirm('Are you sure you want to delete this building?')) return;

        try {
            const res = await authFetch(`/admin/buildings/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to delete building');

            triggerFeedback('success', 'Building deleted successfully.');
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    // --- CLASSROOM CRUD OPERATIONS ---

    const handleSaveClassroom = async (e) => {
        e.preventDefault();
        const { id, building_id, name, capacity, room_type } = classroomForm;

        if (!building_id || !name.trim() || !capacity || !room_type) {
            triggerFeedback('error', 'All fields are required.');
            return;
        }

        const isEdit = id !== null;
        const url = isEdit ? `/admin/classrooms/${id}` : '/admin/classrooms';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await authFetch(url, {
                method,
                body: JSON.stringify({
                    building_id: parseInt(building_id, 10),
                    name: name.trim(),
                    capacity: parseInt(capacity, 10),
                    room_type: room_type.trim()
                })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to save classroom');

            triggerFeedback('success', `Classroom ${isEdit ? 'updated' : 'added'} successfully.`);
            setShowClassroomModal(false);
            setClassroomForm({ id: null, building_id: '', name: '', capacity: '', room_type: 'Lecture Hall' });
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    const handleDeleteClassroom = async (id) => {
        if (!confirm('Are you sure you want to delete this classroom?')) return;

        try {
            const res = await authFetch(`/admin/classrooms/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to delete classroom');

            triggerFeedback('success', 'Classroom deleted successfully.');
            fetchData();
        } catch (err) {
            triggerFeedback('error', err.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tab selection */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('buildings')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
                        activeTab === 'buildings'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Building2 className="h-4 w-4" /> Buildings ({buildings.length})
                </button>
                <button
                    onClick={() => setActiveTab('classrooms')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
                        activeTab === 'classrooms'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <GraduationCap className="h-4 w-4" /> Classrooms ({classrooms.length})
                </button>
            </div>

            {/* Notification Feedback */}
            {feedback.message && (
                <div className={`p-4 rounded-lg flex items-start gap-3 border transition-all ${
                    feedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                        : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                    {feedback.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                    )}
                    <span className="text-sm font-semibold">{feedback.message}</span>
                </div>
            )}

            {/* Tab Contents */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
                </div>
            ) : activeTab === 'buildings' ? (
                /* --- BUILDINGS TAB --- */
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-800">Buildings Register</h3>
                            <p className="text-slate-500 text-xs mt-0.5">List of campus buildings holding classroom zones.</p>
                        </div>
                        <button
                            onClick={() => {
                                setBuildingForm({ id: null, name: '' });
                                setShowBuildingModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-1.5 transition-all shadow-sm shadow-blue-100 cursor-pointer"
                        >
                            <Plus className="h-4 w-4" /> Add Building
                        </button>
                    </div>

                    {buildings.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 text-sm">
                            No campus buildings added. Click 'Add Building' to begin.
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase">
                                    <th className="py-3.5 px-6">Building Name</th>
                                    <th className="py-3.5 px-6">Associated Rooms</th>
                                    <th className="py-3.5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {buildings.map((b) => {
                                    const associatedRoomCount = classrooms.filter(r => r.building_id === b.id).length;
                                    return (
                                        <tr key={b.id} className="hover:bg-slate-50/55 transition-all">
                                            <td className="py-4 px-6 font-bold text-slate-800">{b.name}</td>
                                            <td className="py-4 px-6 text-slate-500 font-semibold">{associatedRoomCount} rooms</td>
                                            <td className="py-4 px-6 text-right space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setBuildingForm({ id: b.id, name: b.name });
                                                        setShowBuildingModal(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 p-2 rounded-lg text-xs font-semibold transition"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBuilding(b.id)}
                                                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 p-2 rounded-lg text-xs font-semibold transition"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                /* --- CLASSROOMS TAB --- */
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-800">Classrooms Directory</h3>
                            <p className="text-slate-500 text-xs mt-0.5">Manage details of physical academic learning zones.</p>
                        </div>
                        <button
                            onClick={() => {
                                setClassroomForm({ id: null, building_id: buildings[0]?.id || '', name: '', capacity: '', room_type: 'Lecture Hall' });
                                setShowClassroomModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-1.5 transition-all shadow-sm shadow-blue-100 cursor-pointer"
                            disabled={buildings.length === 0}
                        >
                            <Plus className="h-4 w-4" /> Add Classroom
                        </button>
                    </div>

                    {classrooms.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 text-sm">
                            {buildings.length === 0 
                                ? "You must add a building before creating classrooms." 
                                : "No classrooms configured. Click 'Add Classroom' to begin."
                            }
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase">
                                    <th className="py-3.5 px-6">Room</th>
                                    <th className="py-3.5 px-6">Building</th>
                                    <th className="py-3.5 px-6">Capacity</th>
                                    <th className="py-3.5 px-6">Room Type</th>
                                    <th className="py-3.5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {classrooms.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/55 transition-all">
                                        <td className="py-4 px-6 font-bold text-slate-800">{c.name}</td>
                                        <td className="py-4 px-6 text-slate-600 font-semibold">{c.building_name}</td>
                                        <td className="py-4 px-6 text-slate-600">{c.capacity} Seats</td>
                                        <td className="py-4 px-6">
                                            <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                                                {c.room_type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            <button
                                                onClick={() => {
                                                    setClassroomForm({
                                                        id: c.id,
                                                        building_id: c.building_id,
                                                        name: c.name,
                                                        capacity: c.capacity,
                                                        room_type: c.room_type
                                                    });
                                                    setShowClassroomModal(true);
                                                }}
                                                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 p-2 rounded-lg text-xs font-semibold transition"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClassroom(c.id)}
                                                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 p-2 rounded-lg text-xs font-semibold transition"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* --- MODAL FOR BUILDINGS --- */}
            {showBuildingModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">{buildingForm.id ? 'Edit' : 'Add'} Building</h3>
                            <button onClick={() => setShowBuildingModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveBuilding} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="buildingName" className="block text-sm font-semibold text-slate-700 mb-2">Building Name</label>
                                <input
                                    type="text"
                                    id="buildingName"
                                    value={buildingForm.name}
                                    onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950 bg-white"
                                    placeholder="e.g. Science Block A"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowBuildingModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-100"
                                >
                                    Save Building
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL FOR CLASSROOMS --- */}
            {showClassroomModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">{classroomForm.id ? 'Edit' : 'Add'} Classroom</h3>
                            <button onClick={() => setShowClassroomModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveClassroom} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="classroomBuilding" className="block text-sm font-semibold text-slate-700 mb-2">Location Building</label>
                                <select
                                    id="classroomBuilding"
                                    value={classroomForm.building_id}
                                    onChange={(e) => setClassroomForm({ ...classroomForm, building_id: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950 bg-white"
                                    required
                                >
                                    {buildings.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="classroomName" className="block text-sm font-semibold text-slate-700 mb-2">Classroom Name / Room No.</label>
                                <input
                                    type="text"
                                    id="classroomName"
                                    value={classroomForm.name}
                                    onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })}
                                    className="block w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950 bg-white"
                                    placeholder="e.g. Lab 4B"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="classroomCapacity" className="block text-sm font-semibold text-slate-700 mb-2">Seating Capacity</label>
                                    <input
                                        type="number"
                                        id="classroomCapacity"
                                        value={classroomForm.capacity}
                                        onChange={(e) => setClassroomForm({ ...classroomForm, capacity: e.target.value })}
                                        className="block w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950 bg-white"
                                        placeholder="e.g. 50"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="classroomType" className="block text-sm font-semibold text-slate-700 mb-2">Room Type</label>
                                    <select
                                        id="classroomType"
                                        value={classroomForm.room_type}
                                        onChange={(e) => setClassroomForm({ ...classroomForm, room_type: e.target.value })}
                                        className="block w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950 bg-white"
                                        required
                                    >
                                        <option value="Lecture Hall">Lecture Hall</option>
                                        <option value="Computer Lab">Computer Lab</option>
                                        <option value="Seminar Room">Seminar Room</option>
                                        <option value="Auditorium">Auditorium</option>
                                        <option value="Tutorial Room">Tutorial Room</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowClassroomModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-100"
                                >
                                    Save Classroom
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
