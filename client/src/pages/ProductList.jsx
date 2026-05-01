import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, Package, FileSpreadsheet } from 'lucide-react';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        rate: '',
        stock_quantity: '',
        cost_price: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            sku: product.sku,
            rate: product.rate,
            stock_quantity: product.stock_quantity,
            cost_price: product.cost_price || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/products/${id}`);
                fetchProducts();
            } catch (error) {
                alert('Error deleting product: ' + error.message);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, formData);
            } else {
                await api.post('/products', formData);
            }
            setShowModal(false);
            setEditingProduct(null);
            setEditingProduct(null);
            setFormData({ name: '', sku: '', rate: '', stock_quantity: '', cost_price: '' });
            fetchProducts();
        } catch (error) {
            alert('Error saving product: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Package className="text-accent" size={24} />
                    <h2 className="text-2xl font-bold text-slate-800">Product Management</h2>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => window.open('http://localhost:5000/api/reports/products?format=xlsx', '_blank')}
                        className="btn-primary bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                    >
                        <FileSpreadsheet size={18} />
                        <span>Export to Excel</span>
                    </button>
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            setFormData({ name: '', sku: '', rate: '', stock_quantity: '', cost_price: '' });
                            setShowModal(true);
                        }}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus size={18} />
                        <span>Add Product</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <th className="p-4 font-medium">SKU</th>
                                <th className="p-4 font-medium">Product Name</th>
                                <th className="p-4 font-medium text-right">Cost Price</th>
                                <th className="p-4 font-medium text-right">Rate</th>
                                <th className="p-4 font-medium text-right">Stock Quantity</th>
                                <th className="p-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4 font-mono text-sm text-slate-500">{product.sku}</td>
                                    <td className="p-4 font-medium text-slate-800">{product.name}</td>
                                    <td className="p-4 text-right text-slate-500">Rs. {(product.cost_price || 0).toLocaleString()}</td>
                                    <td className="p-4 text-right">Rs. {product.rate.toLocaleString()}</td>
                                    <td className="p-4 text-right font-bold text-blue-600">{product.stock_quantity}</td>
                                    <td className="p-4 flex justify-center space-x-2">
                                        <button onClick={() => handleEdit(product)} className="text-blue-500 hover:text-blue-700 p-1">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 p-1">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400">No products found. Add one to get started.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">SKU (Unique ID)</label>
                                <input
                                    type="text"
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Rate (Price)</label>
                                    <input
                                        type="number"
                                        name="rate"
                                        value={formData.rate}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price</label>
                                    <input
                                        type="number"
                                        name="cost_price"
                                        value={formData.cost_price}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                                    <input
                                        type="number"
                                        name="stock_quantity"
                                        value={formData.stock_quantity}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-accent text-white rounded-lg hover:bg-blue-600">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
