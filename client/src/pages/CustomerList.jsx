import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Plus, X } from 'lucide-react';
import { supabase } from '../supabase'; // Supabase connect ho gaya! (axios hta diya)

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Form ki state ko Supabase ke columns jaisa kar diya h
    const [newCustomer, setNewCustomer] = useState({
        shop_name: '',
        owner_name: '',
        phone: '',
        address: '',
        balance: ''
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    // Supabase se data NIKALNE ka function
    const fetchCustomers = async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('id', { ascending: false }); // Naye customers upar aayenge

            if (error) throw error;
            if (data) setCustomers(data);
        } catch (error) {
            console.error('Error fetching customers:', error.message);
        }
    };

    // Supabase mein data DAALNE ka function
    const handleAddCustomer = async (e) => {
        e.preventDefault();
        try {
            const customerData = {
                shop_name: newCustomer.shop_name,
                owner_name: newCustomer.owner_name,
                phone: newCustomer.phone,
                address: newCustomer.address,
                balance: parseFloat(newCustomer.balance) || 0
            };

            const { error } = await supabase
                .from('customers')
                .insert([customerData]);

            if (error) throw error;

            setIsAddModalOpen(false);
            setNewCustomer({ shop_name: '', owner_name: '', phone: '', address: '', balance: '' });
            fetchCustomers(); // List ko foran update (refresh) karega
            
        } catch (error) {
            console.error('Error adding customer:', error.message);
            alert('Masla aagaya bhai: ' + error.message);
        }
    };

    // Search bar filter
    const filteredCustomers = customers.filter(c =>
        (c.shop_name && c.shop_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.owner_name && c.owner_name.toLowerCase().includes(searchTerm.toLowerCase()))
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
                            <th className="p-4 font-semibold text-slate-600">Owner / Phone</th>
                            <th className="p-4 font-semibold text-slate-600">Address</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">Balance</th>
                            <th className="p-4 font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" />
                                    {customer.shop_name}
                                </td>
                                <td className="p-4 text-slate-600">
                                    {customer.owner_name || '-'} <br/>
                                    <span className="text-xs text-slate-400">{customer.phone}</span>
                                </td>
                                <td className="p-4 text-slate-600">{customer.address || '-'}</td>
                                <td className={`p-4 text-right font-bold ${customer.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(customer.balance || 0)}
                                </td>
                                <td className="p-4">
                                    <Link
                                        to={`/customers/${customer.id}/ledger`}
                                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                                    >
                                        View Ledger
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-500">
                                    No customers found. Database khali hai bhai.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isAddModalOpen && (
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
                                    type="text" required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={newCustomer.shop_name}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, shop_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name</label>
                                    <input
                                        type="text" required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={newCustomer.owner_name}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, owner_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input
                                        type="text" required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={newCustomer.phone}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <input
                                    type="text" required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={newCustomer.address}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Opening Balance</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={newCustomer.balance}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, balance: e.target.value })}
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
                                    Save Customer
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerList;