import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, User, Plus, X } from 'lucide-react';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        address: '',
        initial_balance: ''
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/dms/customers');
            setCustomers(res.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        try {
            const customerData = {
                ...newCustomer,
                initial_balance: parseFloat(newCustomer.initial_balance) || 0
            };
            await axios.post('http://localhost:5000/api/shops', customerData);
            setIsAddModalOpen(false);
            setNewCustomer({ name: '', address: '', initial_balance: '' });
            fetchCustomers();
        } catch (error) {
            console.error('Error adding customer:', error);
            alert('Failed to add customer');
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.ShopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.BookerName && c.BookerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Customers</h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search customers..."
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Add Customer
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-4 font-semibold text-slate-600">Shop Name</th>
                            <th className="p-4 font-semibold text-slate-600">Booker</th>
                            <th className="p-4 font-semibold text-slate-600">Area</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">Balance</th>
                            <th className="p-4 font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.CustomerID} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" />
                                    {customer.ShopName}
                                </td>
                                <td className="p-4 text-slate-600">{customer.BookerName || '-'}</td>
                                <td className="p-4 text-slate-600">{customer.Area || '-'}</td>
                                <td className={`p-4 text-right font-bold ${customer.Balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(customer.Balance || 0)}
                                </td>
                                <td className="p-4">
                                    <Link
                                        to={`/customers/${customer.CustomerID}/ledger`}
                                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                                    >
                                        View Ledger
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-slate-500">
                                    No customers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Add New Customer</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <form onSubmit={handleAddCustomer}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={newCustomer.name}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Area / Address</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={newCustomer.address}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Initial Balance</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={newCustomer.initial_balance}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, initial_balance: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                                    >
                                        Add Customer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div >
                )
            }
        </div >
    );
};

export default CustomerList;
