import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Calendar, Save, FileSpreadsheet } from 'lucide-react';

const DailyRegister = () => {
    const [registers, setRegisters] = useState([]);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        opening_balance: '',
        closing_balance: '',
        notes: ''
    });

    useEffect(() => {
        fetchRegisters();
    }, []);

    const fetchRegisters = async () => {
        try {
            const res = await api.get('/register');
            setRegisters(res.data);
        } catch (error) {
            console.error('Error fetching registers:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/register', formData);
            alert('Register updated successfully');
            fetchRegisters();
        } catch (error) {
            alert('Error updating register: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Calendar className="text-accent" size={24} />
                    <h2 className="text-2xl font-bold text-slate-800">Daily Register</h2>
                </div>
                <button
                    onClick={() => window.open('http://localhost:5000/api/reports/register?format=xlsx', '_blank')}
                    className="btn-primary bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                >
                    <FileSpreadsheet size={18} />
                    <span>Export to Excel</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="card lg:col-span-1 h-fit">
                    <h3 className="text-lg font-bold mb-4">Update Today's Register</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-slate-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Opening Balance</label>
                            <input
                                type="number"
                                name="opening_balance"
                                value={formData.opening_balance}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-slate-300 rounded-lg"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Closing Balance</label>
                            <input
                                type="number"
                                name="closing_balance"
                                value={formData.closing_balance}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-slate-300 rounded-lg"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full p-2 border border-slate-300 rounded-lg"
                                placeholder="Any discrepancies or notes..."
                            ></textarea>
                        </div>
                        <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2">
                            <Save size={18} />
                            <span>Save Register</span>
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="card lg:col-span-2">
                    <h3 className="text-lg font-bold mb-4">Recent Registers</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                    <th className="p-4 font-medium">Date</th>
                                    <th className="p-4 font-medium text-right">Opening Balance</th>
                                    <th className="p-4 font-medium text-right">Closing Balance</th>
                                    <th className="p-4 font-medium">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registers.map((reg) => (
                                    <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-4 font-medium text-slate-800">{reg.date}</td>
                                        <td className="p-4 text-right text-green-600 font-medium">Rs. {reg.opening_balance?.toLocaleString()}</td>
                                        <td className="p-4 text-right text-blue-600 font-bold">Rs. {reg.closing_balance?.toLocaleString()}</td>
                                        <td className="p-4 text-sm text-slate-500">{reg.notes || '-'}</td>
                                    </tr>
                                ))}
                                {registers.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-slate-400">No registers found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyRegister;
