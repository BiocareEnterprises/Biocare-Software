import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import SalesGraph from '../components/SalesGraph';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalOutstanding: 0,
        todayRecovery: 0,
        pendingCheques: 0,
        bouncedCheques: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // In a real app, these would be aggregated on the backend. 
            // For prototype, we'll fetch lists and calculate.
            const [shopsRes, recoveryRes, chequesRes] = await Promise.all([
                api.get('/shops'),
                api.get('/recovery'),
                api.get('/cheques')
            ]);

            const shops = shopsRes.data;
            const recoveries = recoveryRes.data;
            const cheques = chequesRes.data;

            const totalOutstanding = shops.reduce((sum, shop) => sum + (shop.current_balance || 0), 0);

            const today = new Date().toISOString().split('T')[0];
            const todayRecovery = recoveries
                .filter(r => r.date === today)
                .reduce((sum, r) => sum + r.amount, 0);

            const pendingCheques = cheques.filter(c => c.status === 'Pending').length;
            const bouncedCheques = cheques.filter(c => c.status === 'Bounced').length;

            setStats({
                totalOutstanding,
                todayRecovery,
                pendingCheques,
                bouncedCheques
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className="card flex items-center p-6">
            <div className={`p-4 rounded-full ${color} bg-opacity-10 mr-4`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Market Outstanding"
                    value={`Rs. ${stats.totalOutstanding.toLocaleString()}`}
                    icon={TrendingUp}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Today's Recovery"
                    value={`Rs. ${stats.todayRecovery.toLocaleString()}`}
                    icon={CheckCircle}
                    color="bg-green-500"
                />
                <StatCard
                    title="Pending Cheques"
                    value={stats.pendingCheques}
                    icon={Clock}
                    color="bg-orange-500"
                    subtext="To be deposited/cleared"
                />
                <StatCard
                    title="Bounced Cheques"
                    value={stats.bouncedCheques}
                    icon={AlertCircle}
                    color="bg-red-500"
                    subtext="Action required"
                />
            </div>

            {/* Sales Graph */}
            <SalesGraph />

            {/* Recent Activity or Charts could go here */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                    <div className="flex space-x-4">
                        <button onClick={() => navigate('/sales')} className="btn-primary w-full transform hover:scale-105 transition-transform duration-200">New Sale</button>
                        <button onClick={() => navigate('/recovery')} className="btn-primary w-full bg-green-600 hover:bg-green-700 transform hover:scale-105 transition-transform duration-200">Record Recovery</button>
                    </div>
                </div>
                <div className="card hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-lg font-bold mb-4">System Status</h3>
                    <p className="text-slate-500">All systems operational. Database connected.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
