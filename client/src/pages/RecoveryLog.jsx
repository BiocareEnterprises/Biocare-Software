import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, FileSpreadsheet } from 'lucide-react';

const RecoveryLog = () => {
    const [recoveries, setRecoveries] = useState([]);
    const [shops, setShops] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        salesman_name: '',
        shop_id: '',
        mode: 'Cash',
        amount: '',
        cheque_ref_no: '',
        bank_name: '',
        due_date: ''
    });

    useEffect(() => {
        fetchRecoveries();
        fetchShops();
    }, []);

    const fetchRecoveries = async () => {
        try {
            const res = await api.get('/recovery');
            setRecoveries(res.data);
        } catch (error) {
            console.error('Error fetching recoveries:', error);
        }
    };

    const fetchShops = async () => {
        try {
            const res = await api.get('/shops');
            setShops(res.data);
        } catch (error) {
            console.error('Error fetching shops:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/recovery', formData);
            setShowModal(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                salesman_name: '',
                shop_id: '',
                mode: 'Cash',
                amount: '',
                cheque_ref_no: '',
                bank_name: '',
                due_date: ''
            });
            fetchRecoveries();
        } catch (error) {
            alert('Error recording recovery: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleExport = () => {
        window.open('http://localhost:5000/api/reports/recovery?format=xlsx', '_blank');
    };



    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Daily Recovery Log</h2>
                <div className="flex space-x-3">
                    <button onClick={handleExport} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center space-x-2">
                        <FileSpreadsheet size={18} />
                        <span>Export to Excel</span>
                    </button>
                    <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
                        <Plus size={18} />
                        <span>New Entry</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Shop Name</th>
                                <th className="p-4 font-medium">Salesman</th>
                                <th className="p-4 font-medium">Mode</th>
                                <th className="p-4 font-medium text-right">Amount</th>
                                <th className="p-4 font-medium">Ref No / Cheque Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recoveries.map((rec) => (
                                <tr key={rec.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4">{rec.date}</td>
                                    <td className="p-4 font-medium text-slate-800">{rec.shop_name}</td>
                                    <td className="p-4">{rec.salesman_name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${rec.mode === 'Cash' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {rec.mode}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-700">Rs. {rec.amount.toLocaleString()}</td>
                                    <td className="p-4 text-sm text-slate-500">{rec.cheque_ref_no || '-'}</td>
                                </tr>
                            ))}
                            {recoveries.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400">No recovery entries found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Record Recovery</h3>
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
                                <select
                                    name="shop_id"
                                    value={formData.shop_id}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    required
                                >
                                    <option value="">Select Shop</option>
                                    {shops.map(shop => (
                                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Salesman Name</label>
                                <input
                                    type="text"
                                    name="salesman_name"
                                    value={formData.salesman_name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                                    <select
                                        name="mode"
                                        value={formData.mode}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount Received</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>

                            {formData.mode === 'Cheque' && (
                                <div className="p-4 bg-slate-50 rounded-lg space-y-4 border border-slate-200">
                                    <h4 className="text-sm font-bold text-slate-700">Cheque Details</h4>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Cheque No</label>
                                        <input
                                            type="text"
                                            name="cheque_ref_no"
                                            value={formData.cheque_ref_no}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-slate-300 rounded-lg"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Bank Name</label>
                                        <input
                                            type="text"
                                            name="bank_name"
                                            value={formData.bank_name}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-slate-300 rounded-lg"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            name="due_date"
                                            value={formData.due_date}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-slate-300 rounded-lg"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex space-x-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-accent text-white rounded-lg hover:bg-blue-600">Save Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecoveryLog;
