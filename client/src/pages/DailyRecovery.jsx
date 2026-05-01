import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, FileSpreadsheet } from 'lucide-react';

const DailyRecovery = () => {
    const [recoveries, setRecoveries] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        shop_id: '',
        amount: '',
        mode: 'Cash',
        cheque_number: '',
        bank_name: '',
        cheque_date: ''
    });

    const fetchData = async () => {
        try {
            const [recoveryRes, shopsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/recovery'),
                axios.get('http://localhost:5000/api/shops')
            ]);
            setRecoveries(recoveryRes.data);
            setShops(shopsRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Map frontend state to backend expected fields
            const payload = {
                ...formData,
                salesman_name: 'Admin', // Placeholder
                cheque_ref_no: formData.cheque_number, // Map cheque_number to cheque_ref_no
                due_date: formData.cheque_date         // Map cheque_date to due_date
            };

            await axios.post('http://localhost:5000/api/recovery', payload);

            setFormData({
                date: new Date().toISOString().split('T')[0],
                shop_id: '',
                amount: '',
                mode: 'Cash',
                cheque_number: '',
                bank_name: '',
                cheque_date: ''
            });
            fetchData();
        } catch (error) {
            console.error('Error adding recovery:', error);
            alert('Error adding recovery: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            try {
                await axios.delete(`http://localhost:5000/api/recovery/${id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting recovery:', error);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Daily Recovery Log</h2>
                <button
                    onClick={() => window.open('http://localhost:5000/api/reports/recovery', '_blank')}
                    className="btn-primary bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                >
                    <FileSpreadsheet size={18} />
                    <span>Export Excel</span>
                </button>
            </div>

            {/* Add New Entry Form */}
            <div className="card mb-8">
                <h3 className="text-lg font-semibold mb-4">Add New Entry</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Shop / Customer</label>
                        <select
                            name="shop_id"
                            value={formData.shop_id}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                            required
                        >
                            <option value="">Select Shop</option>
                            {shops.map(shop => (
                                <option key={shop.id} value={shop.id}>{shop.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mode</label>
                        <select
                            name="mode"
                            value={formData.mode}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                        >
                            <option value="Cash">Cash</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>

                    {formData.mode === 'Cheque' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cheque No.</label>
                                <input
                                    type="text"
                                    name="cheque_number"
                                    value={formData.cheque_number}
                                    onChange={handleChange}
                                    placeholder="Cheque No"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                                <input
                                    type="text"
                                    name="bank_name"
                                    value={formData.bank_name}
                                    onChange={handleChange}
                                    placeholder="Bank Name"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cheque Date</label>
                                <input
                                    type="date"
                                    name="cheque_date"
                                    value={formData.cheque_date}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div className="md:col-span-6 flex justify-end">
                        <button type="submit" className="btn-primary flex items-center">
                            <Plus size={18} className="mr-2" />
                            Add Entry
                        </button>
                    </div>
                </form>
            </div>

            {/* Recovery Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 font-semibold text-slate-600">Date</th>
                                <th className="p-4 font-semibold text-slate-600">Customer Name</th>
                                <th className="p-4 font-semibold text-slate-600 text-right">Amount</th>
                                <th className="p-4 font-semibold text-slate-600">Mode</th>
                                <th className="p-4 font-semibold text-slate-600">Cheque No.</th>
                                <th className="p-4 font-semibold text-slate-600 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Loading recovery log...</td>
                                </tr>
                            ) : recoveries.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">No entries found.</td>
                                </tr>
                            ) : (
                                recoveries.map((entry) => (
                                    <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-4">{entry.date}</td>
                                        <td className="p-4 font-medium text-slate-800">{entry.shop_name || entry.customer_name}</td>
                                        <td className="p-4 text-right font-bold text-green-600">
                                            PKR {entry.amount.toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.mode === 'Cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {entry.mode}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500">{entry.cheque_ref_no || entry.cheque_number || '-'}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DailyRecovery;
