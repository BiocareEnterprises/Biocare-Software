import React, { useState } from 'react'; // <-- Yahan useState add kiya hai
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Receipt, CreditCard, Users, RotateCcw, Package, Calendar, LogOut } from 'lucide-react';
import { auth } from '../firebase'; 
import { signOut } from 'firebase/auth'; 

const Layout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate(); 
    
    // Nayi line: Menu open/close yaad rakhne ke liye
    const [isMenuOpen, setIsMenuOpen] = useState(false); 

    const handleLogout = async () => {
        try {
            await signOut(auth); 
            navigate('/login'); 
        } catch (error) {
            console.error("Logout mein masla aaya:", error);
        }
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/customers', label: 'Customers', icon: Users },
        { path: '/products', label: 'Products', icon: Package },
        { path: '/sales', label: 'Sales Ledger', icon: BookOpen },
        { path: '/returns', label: 'Sales Return', icon: RotateCcw },
        { path: '/recovery', label: 'Recovery Log', icon: Receipt },
        { path: '/cheques', label: 'Cheque Management', icon: CreditCard },
        { path: '/register', label: 'Daily Register', icon: Calendar },
    ];

    return (
        <div className="flex h-screen bg-background relative">
            
            {/* Sidebar (Desktop aur Mobile dono ke liye set kar diya) */}
            <aside className={`w-64 bg-primary text-white flex-col ${isMenuOpen ? 'flex absolute z-50 h-full shadow-2xl' : 'hidden'} md:flex md:relative`}>
                <div className="p-6 border-b border-secondary flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-accent">Bio Care</h1>
                        <p className="text-sm text-slate-400">Distribution System</p>
                    </div>
                    {/* Mobile mein menu close karne ka chota 'X' button */}
                    <button 
                        className="md:hidden text-white text-2xl font-bold" 
                        onClick={() => setIsMenuOpen(false)}
                    >
                        ✕
                    </button>
                </div>
                
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)} // Nayi line: Jaise hi koi link click ho, menu band ho jaye
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
            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                
                {/* Mobile Header (Menu Button ke sath) */}
                <header className="md:hidden bg-primary text-white p-4 flex justify-between items-center shadow-md">
                    <h1 className="font-bold text-xl">Bio Care</h1>
                    <button 
                        className="px-3 py-1 bg-secondary rounded-md"
                        onClick={() => setIsMenuOpen(true)} // Button dabane par menu khul jaye
                    >
                        Menu
                    </button>
                </header>

                {/* Desktop Top Bar (Sign Out Button) */}
                <div className="flex justify-end items-center p-4 bg-white shadow-sm">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors border border-red-100"
                    >
                        <LogOut size={18} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 md:p-6">
                    {children}
                </div>
            </main>

            {/* Background Overlay (Taa ke menu khulne par background blackish ho jaye) */}
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default Layout;