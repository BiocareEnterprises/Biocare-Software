import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SalesLedger from './pages/SalesLedger';
import DailyRecovery from './pages/DailyRecovery';
import ChequeManagement from './pages/ChequeManagement';
import CustomerList from './pages/CustomerList';
import CustomerLedger from './pages/CustomerLedger';
import SalesReturn from './pages/SalesReturn';
import ProductList from './pages/ProductList'; 
import DailyRegister from './pages/DailyRegister'; 

// --- Firebase aur Login ke naye imports ---
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './components/Login';

function App() {
  // User ka status check karne ke liye variables
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Jab app khule toh check karo ke user login hai ya nahi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Jab tak Firebase se check ho raha hai, loading dikhao
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Loading Biocare Software...</h2>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Login Route: Agar user pehle se login hai, toh seedha Dashboard (/) par bhej do */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

        {/* Baqi saari Protected Routes: Inko ek jageh pack kar diya hai. 
            Agar user login NAHI hai, toh wapis /login par phaink do */}
        <Route
          path="*"
          element={
            user ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/products" element={<ProductList />} />
                  <Route path="/register" element={<DailyRegister />} />
                  <Route path="/sales" element={<SalesLedger />} />
                  <Route path="/returns" element={<SalesReturn />} />
                  <Route path="/recovery" element={<DailyRecovery />} />
                  <Route path="/cheques" element={<ChequeManagement />} />
                  <Route path="/customers" element={<CustomerList />} />
                  <Route path="/customers/:id/ledger" element={<CustomerLedger />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;