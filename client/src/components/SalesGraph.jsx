import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';

const SalesGraph = () => {
    const [data, setData] = useState([]);

    const fetchSalesData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/reports/monthly-sales');
            console.log('Sales Data Response:', res.data);
            // Format data for chart
            const formattedData = res.data.map(item => ({
                name: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                sales: item.total
            }));
            console.log('Formatted Data:', formattedData);
            setData(formattedData);
        } catch (error) {
            console.error('Error fetching sales data:', error);
        }
    };

    useEffect(() => {
        fetchSalesData();
    }, []);

    if (data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Monthly Sales Overview</h3>
                    <button
                        onClick={fetchSalesData}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Refresh
                    </button>
                </div>
                <div className="h-64 w-full flex items-center justify-center text-slate-400">
                    No sales data available yet.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Monthly Sales Overview</h3>
                <button
                    onClick={fetchSalesData}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    Refresh
                </button>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickFormatter={(value) => `Rs ${value / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [`Rs ${value.toLocaleString()}`, 'Sales']}
                        />
                        <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="#0ea5e9"
                            fill="#e0f2fe"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SalesGraph;
