import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Filter } from 'lucide-react';

const CustomerLedger = () => {
    const { id } = useParams();
    const [customer, setCustomer] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [aging, setAging] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchData();
        fetchAging();
    }, [id]); // Initial load

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (dateRange.startDate) params.startDate = dateRange.startDate;
            if (dateRange.endDate) params.endDate = dateRange.endDate;

            const [custRes, ledgerRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/dms/customers/${id}`),
                axios.get(`http://localhost:5000/api/dms/customers/${id}/ledger`, { params })
            ]);
            setCustomer(custRes.data);
            setLedger(ledgerRes.data);
        } catch (error) {
            console.error('Error fetching ledger data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAging = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/dms/customers/${id}/aging`);
            setAging(res.data);
        } catch (error) {
            console.error('Error fetching aging:', error);
        }
    };

    const handleFilter = () => {
        fetchData();
    };

    const formatCurrency = (amount) => {
        const absAmount = Math.abs(amount);
        const formatted = new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(absAmount);
        return amount < 0 ? `(${formatted})` : formatted;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString();
    };

    if (loading && !customer) return <div className="p-8 text-center">Loading ledger...</div>;
    if (!customer) return <div className="p-8 text-center">Customer not found.</div>;

    const currentBalance = ledger.length > 0 ? ledger[ledger.length - 1].balance : 0;

    // Calculate Totals for the view
    const totalDebit = ledger.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredit = ledger.reduce((sum, entry) => sum + (entry.credit || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header & Navigation */}
            <div className="flex justify-between items-start">
                <div>
                    <Link to="/customers" className="inline-flex items-center text-slate-500 hover:text-slate-700 mb-2">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
                    </Link>
                    <h2 className="text-3xl font-bold text-slate-800">{customer.ShopName}</h2>
                    <p className="text-slate-500">
                        {customer.BookerName && <span className="mr-4">Booker: {customer.BookerName}</span>}
                        {customer.Area && <span>Area: {customer.Area}</span>}
                    </p>
                </div>
                <div className="text-right">
                    <button
                        onClick={() => window.open(`http://localhost:5000/api/dms/customers/${id}/ledger/export`, '_blank')}
                        className="btn-primary bg-green-600 hover:bg-green-700 flex items-center space-x-2 text-sm mb-2"
                    >
                        <Download size={16} />
                        <span>Export Excel</span>
                    </button>
                    <p className="text-sm text-slate-500">Current Balance</p>
                    <p className={`text-2xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(currentBalance)}
                    </p>
                </div>
            </div>

            {/* Aging Analysis Cards */}
            {aging && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase">0-30 Days</p>
                        <p className="text-lg font-bold text-slate-700">{formatCurrency(aging['0-30'])}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase">31-60 Days</p>
                        <p className="text-lg font-bold text-yellow-600">{formatCurrency(aging['31-60'])}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase">61-90 Days</p>
                        <p className="text-lg font-bold text-orange-600">{formatCurrency(aging['61-90'])}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase">90+ Days</p>
                        <p className="text-lg font-bold text-red-600">{formatCurrency(aging['90+'])}</p>
                    </div>
                </div>
            )}

            {/* Filters & Summary */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="flex items-end gap-4 w-full md:w-auto">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            className="p-2 border border-slate-300 rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            className="p-2 border border-slate-300 rounded text-sm"
                        />
                    </div>
                    <button onClick={handleFilter} className="btn-secondary flex items-center">
                        <Filter size={16} className="mr-2" /> Filter
                    </button>
                </div>
                <div className="flex gap-6 text-sm">
                    <div>
                        <span className="text-slate-500 block">Total Debit</span>
                        <span className="font-bold text-slate-800">{formatCurrency(totalDebit)}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 block">Total Credit</span>
                        <span className="font-bold text-slate-800">{formatCurrency(totalCredit)}</span>
                    </div>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-4 font-semibold text-slate-600">Date</th>
                            <th className="p-4 font-semibold text-slate-600">Reference</th>
                            <th className="p-4 font-semibold text-slate-600">Description</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">Debit</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">Credit</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ledger.map((entry, index) => (
                            <tr key={`${entry.type}-${index}`} className={`border-b border-slate-100 hover:bg-slate-50 ${entry.type === 'Opening Balance' ? 'bg-slate-50 italic' : ''}`}>
                                <td className="p-4 text-slate-600">{formatDate(entry.date)}</td>
                                <td className="p-4 font-medium text-slate-800">
                                    <span className={`px-2 py-1 rounded text-xs ${entry.type === 'Invoice' ? 'bg-blue-100 text-blue-700' :
                                        entry.type === 'Recovery' ? 'bg-green-100 text-green-700' :
                                            entry.type === 'Opening Balance' ? 'bg-slate-200 text-slate-700' :
                                                'bg-red-100 text-red-700' // Return
                                        }`}>
                                        {entry.reference || entry.type}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-600">{entry.description || '-'}</td>
                                <td className="p-4 text-right text-slate-600">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                                <td className="p-4 text-right text-slate-600">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                                <td className="p-4 text-right font-medium text-slate-800">{formatCurrency(entry.balance)}</td>
                            </tr>
                        ))}
                        {ledger.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-500">
                                    No transactions found for this period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomerLedger;
