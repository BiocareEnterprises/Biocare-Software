import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { FileSpreadsheet, AlertTriangle } from 'lucide-react';

const ChequeManagement = () => {
    const [cheques, setCheques] = useState([]);
    const [selectedCheque, setSelectedCheque] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusData, setStatusData] = useState({
        status: '',
        bounce_reason: '',
        deposit_date: '',
        clearance_date: ''
    });

    useEffect(() => {
        fetchCheques();
    }, []);

    const fetchCheques = async () => {
        try {
            const res = await api.get('/cheques');
            setCheques(res.data);
        } catch (error) {
            console.error('Error fetching cheques:', error);
        }
    };

    const handleStatusClick = (cheque) => {
        setSelectedCheque(cheque);
        setStatusData({
            status: cheque.status,
            bounce_reason: cheque.bounce_reason || '',
            deposit_date: cheque.deposit_date || '',
            clearance_date: cheque.clearance_date || ''
        });
        setShowStatusModal(true);
    };

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/cheques/${selectedCheque.id}/status`, statusData);
            setShowStatusModal(false);
            fetchCheques();
        } catch (error) {
            alert('Error updating status: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleExport = () => {
        window.open('http://localhost:5000/api/reports/cheques?format=xlsx', '_blank');
    };



    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-orange-100 text-orange-700';
            case 'Deposited': return 'bg-blue-100 text-blue-700';
            case 'Cleared': return 'bg-green-100 text-green-700';
            case 'Bounced': return 'bg-red-100 text-red-700';
            case 'Returned': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Cheque Management Center</h2>
                <div className="flex space-x-3">
                    <button onClick={handleExport} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center space-x-2">
                        <FileSpreadsheet size={18} />
                        <span>Export to Excel</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <th className="p-4 font-medium">Due Date</th>
                                <th className="p-4 font-medium">Cheque No</th>
                                <th className="p-4 font-medium">Shop Name</th>
                                <th className="p-4 font-medium">Bank Name</th>
                                <th className="p-4 font-medium text-right">Amount</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cheques.map((cheque) => (
                                <tr key={cheque.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4">{cheque.due_date}</td>
                                    <td className="p-4 font-medium text-slate-800">{cheque.cheque_no}</td>
                                    <td className="p-4">{cheque.shop_name}</td>
                                    <td className="p-4">{cheque.bank_name}</td>
                                    <td className="p-4 text-right font-bold text-slate-700">Rs. {cheque.amount.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cheque.status)}`}>
                                            {cheque.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleStatusClick(cheque)}
                                            className="text-sm text-accent hover:underline font-medium"
                                        >
                                            Update Status
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {cheques.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400">No cheques found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Status Update Modal */}
            {showStatusModal && selectedCheque && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Update Cheque Status</h3>
                        <div className="mb-4 p-3 bg-slate-50 rounded-lg text-sm">
                            <p><strong>Cheque No:</strong> {selectedCheque.cheque_no}</p>
                            <p><strong>Amount:</strong> Rs. {selectedCheque.amount.toLocaleString()}</p>
                        </div>
                        <form onSubmit={handleStatusUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">New Status</label>
                                <select
                                    value={statusData.status}
                                    onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Deposited">Deposited</option>
                                    <option value="Cleared">Cleared</option>
                                    <option value="Bounced">Bounced</option>
                                    <option value="Returned">Returned</option>
                                </select>
                            </div>

                            {statusData.status === 'Deposited' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Deposit Date</label>
                                    <input
                                        type="date"
                                        value={statusData.deposit_date}
                                        onChange={(e) => setStatusData({ ...statusData, deposit_date: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                        required
                                    />
                                </div>
                            )}

                            {statusData.status === 'Cleared' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Clearance Date</label>
                                    <input
                                        type="date"
                                        value={statusData.clearance_date}
                                        onChange={(e) => setStatusData({ ...statusData, clearance_date: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                        required
                                    />
                                </div>
                            )}

                            {statusData.status === 'Bounced' && (
                                <div>
                                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg mb-2 flex items-start">
                                        <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                                        <span>Warning: Marking as Bounced will automatically reverse the credit for {selectedCheque.shop_name}.</span>
                                    </div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bounce Reason</label>
                                    <input
                                        type="text"
                                        value={statusData.bounce_reason}
                                        onChange={(e) => setStatusData({ ...statusData, bounce_reason: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                        placeholder="e.g., Insufficient Funds"
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex space-x-3 mt-6">
                                <button type="button" onClick={() => setShowStatusModal(false)} className="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-accent text-white rounded-lg hover:bg-blue-600">Update Status</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChequeManagement;
