import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Receipt, CreditCard, Users, RotateCcw, Package, Calendar } from 'lucide-react';

const Layout = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/customers', label: 'Customers', icon: Users },
        { path: '/products', label: 'Products', icon: Package }, // New
        { path: '/sales', label: 'Sales Ledger', icon: BookOpen },
        { path: '/returns', label: 'Sales Return', icon: RotateCcw },
        { path: '/recovery', label: 'Recovery Log', icon: Receipt },
        { path: '/cheques', label: 'Cheque Management', icon: CreditCard },
        { path: '/register', label: 'Daily Register', icon: Calendar }, // New
    ];

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 bg-primary text-white hidden md:flex flex-col">
                <div className="p-6 border-b border-secondary">
                    <h1 className="text-2xl font-bold text-accent">Bio Care</h1>
                    <p className="text-sm text-slate-400">Distribution System</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-accent text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-secondary hover:text-white'
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-secondary">
                    <div className="flex items-center space-x-3 text-slate-400 text-sm">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                            <span className="font-bold text-white">A</span>
                        </div>
                        <div>
                            <p className="text-white">Admin User</p>
                            <p>Online</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-primary text-white p-4 flex justify-between items-center">
                    <h1 className="font-bold">Bio Care</h1>
                    <button className="p-2">Menu</button>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
