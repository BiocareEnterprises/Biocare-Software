import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase'; // Supabase connection
import { Plus, FileSpreadsheet, Search, Trash2, Printer } from 'lucide-react';

const SalesLedger = () => {
    const [invoices, setInvoices] = useState([]);
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        invoice_no: '',
        date: new Date().toISOString().split('T')[0],
        shop_id: '',
        salesman_name: '',
        items: [] 
    });
    const [currentItem, setCurrentItem] = useState({ product_id: '', quantity: 1 });

    useEffect(() => {
        fetchInvoices();
        fetchShops();
        fetchProducts();
    }, []);

    const fetchInvoices = async () => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    *,
                    customers ( shop_name )
                `)
                .order('date', { ascending: false });

            if (error) throw error;
            if (data) setInvoices(data);
        } catch (error) {
            console.error('Error fetching invoices:', error.message);
        }
    };

    const fetchShops = async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('shop_name', { ascending: true });
            if (error) throw error;
            if (data) setShops(data);
        } catch (error) {
            console.error('Error fetching shops:', error.message);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name', { ascending: true });
            if (error) throw error;
            if (data) setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error.message);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addItem = () => {
        if (!currentItem.product_id || currentItem.quantity <= 0) return;
        const product = products.find(p => p.id === parseInt(currentItem.product_id));
        if (!product) return;

        const newItem = {
            product_id: product.id,
            name: product.name,
            quantity: parseInt(currentItem.quantity),
            rate: product.rate,
            cost_price: product.cost_price
        };

        setFormData({
            ...formData,
            items: [...formData.items, newItem]
        });
        setCurrentItem({ product_id: '', quantity: 1 });
    };

    const removeItem = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const bill_amount = calculateTotal();
            
            // 1. Create Invoice
            const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .insert([{
                    invoice_no: formData.invoice_no,
                    date: formData.date,
                    shop_id: parseInt(formData.shop_id),
                    salesman_name: formData.salesman_name,
                    bill_amount: bill_amount
                }])
                .select();

            if (invoiceError) throw invoiceError;
            const newInvoice = invoiceData[0];

            // 2. Insert Items & Deduct Stock
            for (const item of formData.items) {
                await supabase.from('invoice_items').insert([{
                    invoice_id: newInvoice.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    rate: item.rate,
                    cost_price: item.cost_price || 0,
                    amount: item.quantity * item.rate
                }]);

                const prod = products.find(p => p.id === item.product_id);
                if (prod) {
                    await supabase.from('products')
                        .update({ stock_quantity: prod.stock_quantity - item.quantity })
                        .eq('id', item.product_id);
                }
            }

            // 3. Update Customer Balance
            const customer = shops.find(s => s.id === parseInt(formData.shop_id));
            if (customer) {
                await supabase.from('customers')
                    .update({ balance: (customer.balance || 0) + bill_amount })
                    .eq('id', customer.id);
            }

            setShowModal(false);
            setFormData({
                invoice_no: '',
                date: new Date().toISOString().split('T')[0],
                shop_id: '',
                salesman_name: '',
                items: []
            });
            fetchInvoices();
            fetchShops();
            fetchProducts();
            alert("Invoice created successfully!");
        } catch (error) {
            alert('Error creating invoice: ' + error.message);
        }
    };

    const handlePrint = (invoice) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Invoice #${invoice.invoice_no}</title>
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: bold; color: #2563eb; display: flex; align-items: center; gap: 10px; }
                    .invoice-details { text-align: right; }
                    .invoice-title { font-size: 32px; font-weight: bold; color: #0f172a; margin-bottom: 5px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                    .box { background: #f8fafc; padding: 20px; border-radius: 8px; }
                    .box h3 { margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                    .box p { margin: 0; font-weight: 600; font-size: 16px; }
                    table { w-full; width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { text-align: left; padding: 12px; background: #f1f5f9; color: #475569; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
                    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
                    .totals { float: right; width: 300px; }
                    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
                    .total-row.final { font-size: 18px; font-weight: bold; border-top: 2px solid #0f172a; margin-top: 10px; padding-top: 10px; }
                    .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">Bio Care Software</div>
                    <div class="invoice-details">
                        <div class="invoice-title">INVOICE</div>
                        <div>#${invoice.invoice_no}</div>
                        <div>Date: ${invoice.date}</div>
                    </div>
                </div>

                <div class="grid">
                    <div class="box">
                        <h3>Bill To</h3>
                        <p>${invoice.customers?.shop_name || 'Customer'}</p>
                        <p style="font-weight: 400; font-size: 14px; margin-top: 5px; color: #64748b;">${invoice.salesman_name ? `Salesman: ${invoice.salesman_name}` : ''}</p>
                    </div>
                    <div class="box">
                        <h3>Payment Details</h3>
                        <p>Total Bill: Rs. ${invoice.bill_amount.toLocaleString()}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Item Description</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Consolidated Bill Amount</td>
                            <td style="text-align: right;">Rs. ${invoice.bill_amount.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="totals">
                    <div class="total-row final">
                        <span>Total:</span>
                        <span>Rs. ${invoice.bill_amount.toLocaleString()}</span>
                    </div>
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Sales Ledger</h2>
                <div className="flex space-x-3">
                    <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
                        <Plus size={18} />
                        <span>New Invoice</span>
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
                                <th className="p-4 font-medium">Invoice No</th>
                                <th className="p-4 font-medium">Shop Name</th>
                                <th className="p-4 font-medium">Salesman</th>
                                <th className="p-4 font-medium text-right">Bill Amount</th>
                                <th className="p-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4">{inv.date}</td>
                                    <td className="p-4 font-medium text-slate-800">{inv.invoice_no}</td>
                                    <td className="p-4">{inv.customers?.shop_name || 'N/A'}</td>
                                    <td className="p-4">{inv.salesman_name}</td>
                                    <td className="p-4 text-right font-medium text-blue-600">
                                        Rs. {inv.bill_amount.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handlePrint(inv)}
                                            className="text-slate-500 hover:text-blue-600 p-1"
                                            title="Print Invoice"
                                        >
                                            <Printer size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400">No invoices found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">New Invoice</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Invoice No</label>
                                    <input
                                        type="text"
                                        name="invoice_no"
                                        value={formData.invoice_no}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
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
                                            <option key={shop.id} value={shop.id}>{shop.shop_name}</option>
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
                            </div>

                            {/* Product Selection */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="font-bold text-sm text-slate-700 mb-2">Add Products</h4>
                                <div className="flex space-x-2 mb-2">
                                    <select
                                        className="flex-1 p-2 border border-slate-300 rounded-lg"
                                        value={currentItem.product_id}
                                        onChange={(e) => setCurrentItem({ ...currentItem, product_id: e.target.value })}
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity}) - Rs. {p.rate}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        className="w-20 p-2 border border-slate-300 rounded-lg"
                                        placeholder="Qty"
                                        min="1"
                                        value={currentItem.quantity}
                                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                                    />
                                    <button type="button" onClick={addItem} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                                        <Plus size={20} />
                                    </button>
                                </div>

                                {/* Items List */}
                                <div className="space-y-2">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-sm">
                                            <span>{item.name} x {item.quantity}</span>
                                            <div className="flex items-center space-x-3">
                                                <span className="font-bold">Rs. {item.quantity * item.rate}</span>
                                                <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 text-right font-bold text-lg text-slate-800">
                                    Total: Rs. {calculateTotal().toLocaleString()}
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-accent text-white rounded-lg hover:bg-blue-600">Save Invoice</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesLedger;