import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Filter } from 'lucide-react';
import { supabase } from '../supabase';

const CustomerLedger = () => {
    const { id } = useParams();
    const [customer, setCustomer] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [aging, setAging] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    useEffect(() => {
        fetchData();
        fetchAging();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Customer
            const { data: custData, error: custError } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .single();
            if (custError) throw custError;
            setCustomer(custData);

            // Fetch Invoices
            const { data: invoices, error: invError } = await supabase
                .from('invoices')
                .select('*')
                .eq('shop_id', id);
            if (invError) throw invError;

            // Fetch Recoveries
            const { data: recoveries, error: recError } = await supabase
                .from('recoveries')
                .select('*')
                .eq('shop_id', id);
            if (recError) throw recError;

            // Process Ledger
            let allTransactions = [
                ...(invoices || []).map(inv => ({
                    id: `inv-${inv.id}`,
                    date: inv.date,
                    type: inv.type || 'Sale',
                    reference: inv.invoice_no,
                    description: `Salesman: ${inv.salesman_name} ${inv.notes ? `(${inv.notes})` : ''}`,
                    debit: inv.type === 'Return' ? 0 : inv.bill_amount,
                    credit: inv.type === 'Return' ? inv.bill_amount : 0
                })),
                ...(recoveries || []).map(rec => ({
                    id: `rec-${rec.id}`,
                    date: rec.date,
                    type: 'Recovery',
                    reference: `${rec.mode} ${rec.cheque_ref_no ? '#' + rec.cheque_ref_no : ''}`,
                    description: `Salesman: ${rec.salesman_name}`,
                    debit: 0,
                    credit: rec.amount
                }))
            ].sort((a, b) => new Date(a.date) - new Date(b.date));

            let runningBal = 0;
            allTransactions.forEach(t => {
                runningBal += (t.debit - t.credit);
                t.balance = runningBal;
            });

            let filtered = allTransactions;
            if (dateRange.startDate || dateRange.endDate) {
                const start = dateRange.startDate ? new Date(dateRange.startDate) : new Date('1970-01-01');
                const end = dateRange.endDate ? new Date(dateRange.endDate) : new Date('2100-01-01');
                filtered = allTransactions.filter(t => {
                    const d = new Date(t.date);
                    return d >= start && d <= end;
                });
            }

            setLedger(filtered);
        } catch (error) {
            console.error('Error fetching ledger data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAging = async () => {
        try {
            const { data: cust } = await supabase.from('customers').select('balance').eq('id', id).single();
            const { data: invoices } = await supabase.from('invoices').select('date, bill_amount, type').eq('shop_id', id).order('date', { ascending: false });
            
            let remaining = cust?.balance || 0;
            const agingData = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
            
            if (remaining > 0 && invoices) {
                const today = new Date();
                for (const inv of invoices) {
                    if (inv.type === 'Return') continue;
                    if (remaining <= 0) break;
                    
                    const invDate = new Date(inv.date);
                    const diffDays = Math.ceil(Math.abs(today - invDate) / (1000 * 60 * 60 * 24));
                    const alloc = Math.min(remaining, inv.bill_amount);
                    
                    if (diffDays <= 30) agingData['0-30'] += alloc;
                    else if (diffDays <= 60) agingData['31-60'] += alloc;
                    else if (diffDays <= 90) agingData['61-90'] += alloc;
                    else agingData['90+'] += alloc;
                    
                    remaining -= alloc;
                }
                if (remaining > 0) agingData['90+'] += remaining;
            }
            setAging(agingData);
        } catch (error) {
            console.error('Error fetching aging:', error.message);
        }
    };

    const handleFilter = () => fetchData();

    const formatCurrency = (amount) => {
        const absAmount = Math.abs(amount || 0);
        const formatted = new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(absAmount);
        return amount < 0 ? `(${formatted})` : formatted;
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading ledger...</div>;
    if (!customer) return <div className="p-8 text-center text-red-500">Customer not found.</div>;

    const totalDebit = ledger.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredit = ledger.reduce((sum, entry) => sum + (entry.credit || 0), 0);
    const currentBalance = customer.balance || 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <Link to="/customers" className="inline-flex items-center text-slate-500 hover:text-slate-700 mb-2">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
                    </Link>
                    <h2 className="text-3xl font-bold text-slate-800">{customer.shop_name}</h2>
                    <p className="text-slate-500">
                        {customer.owner_name && <span className="mr-4">Owner: {customer.owner_name}</span>}
                        {customer.phone && <span>Phone: {customer.phone}</span>}
                    </p>
                </div>
                <div className="text-right">
                    <button onClick={() => alert("Export will be enabled soon!")} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center space-x-2 text-sm mb-2">
                        <Download size={16} />
                        <span>Export Excel</span>
                    </button>
                    <p className="text-sm text-slate-500">Current Balance</p>
                    <p className={`text-2xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(currentBalance)}
                    </p>
                </div>
            </div>

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

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="flex items-end gap-4 w-full md:w-auto">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
                        <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="p-2 border border-slate-300 rounded text-sm"/>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
                        <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} className="p-2 border border-slate-300 rounded text-sm"/>
                    </div>
                    <button onClick={handleFilter} className="btn-secondary flex items-center px-4 py-2 border rounded hover:bg-slate-50">
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
                        {ledger.map((entry) => (
                            <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="p-4 text-slate-600">{entry.date}</td>
                                <td className="p-4 font-medium text-slate-800">
                                    <span className={`px-2 py-1 rounded text-xs ${entry.type === 'Invoice' ? 'bg-blue-100 text-blue-700' : entry.type === 'Recovery' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
                                <td colSpan="6" className="p-8 text-center text-slate-500">No transactions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomerLedger;