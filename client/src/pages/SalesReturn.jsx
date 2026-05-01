import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RotateCcw, Save } from 'lucide-react';

const SalesReturn = () => {
    const [shops, setShops] = useState([]);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        shop_id: '',
        bill_amount: '',
        invoice_no: '',
        notes: ''
    });

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/shops');
            setShops(res.data);
        } catch (error) {
            console.error('Error fetching shops:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/sales', {
                ...formData,
                type: 'Return', // Critical: Mark as Return
                salesman_name: 'Admin' // Placeholder
            });
            alert('Sales Return recorded successfully!');
            setFormData({
                date: new Date().toISOString().split('T')[0],
                shop_id: '',
                bill_amount: '',
                invoice_no: '',
                notes: ''
            });
        } catch (error) {
            console.error('Error recording return:', error);
            alert('Error: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div>
            <div className="flex items-center space-x-2 mb-6">
                <RotateCcw className="text-red-600" size={24} />
                <h2 className="text-2xl font-bold text-slate-800">Sales Return (Credit Note)</h2>
            </div>

            <div className="card max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full p-2 border border-slate-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Shop / Customer</label>
                            <select
                                name="shop_id"
                                value={formData.shop_id}
                                onChange={handleChange}
                                className="w-full p-2 border border-slate-300 rounded-lg"
                                required
                            >
                                <option value="">Select Shop</option>
                                {shops.map(shop => (
                                    <option key={shop.id} value={shop.id}>
                                        {shop.name} (Bal: {shop.current_balance})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Return Amount</label>
                            <input
                                type="number"
                                name="bill_amount"
                                value={formData.bill_amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="w-full p-2 border border-slate-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Reference / Invoice No</label>
                            <input
                                type="text"
                                name="invoice_no"
                                value={formData.invoice_no}
                                onChange={handleChange}
                                placeholder="RET-001"
                                className="w-full p-2 border border-slate-300 rounded-lg"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            className="w-full p-2 border border-slate-300 rounded-lg"
                            placeholder="Reason for return..."
                        ></textarea>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" className="btn-primary bg-red-600 hover:bg-red-700 flex items-center">
                            <Save size={18} className="mr-2" />
                            Record Return
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SalesReturn;
