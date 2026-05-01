import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SalesLedger from './pages/SalesLedger';
import DailyRecovery from './pages/DailyRecovery';
import ChequeManagement from './pages/ChequeManagement';
import CustomerList from './pages/CustomerList';
import CustomerLedger from './pages/CustomerLedger';
import SalesReturn from './pages/SalesReturn';
import ProductList from './pages/ProductList'; // New
import DailyRegister from './pages/DailyRegister'; // New

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductList />} /> {/* New */}
          <Route path="/register" element={<DailyRegister />} /> {/* New */}
          <Route path="/sales" element={<SalesLedger />} />
          <Route path="/returns" element={<SalesReturn />} />
          <Route path="/recovery" element={<DailyRecovery />} />
          <Route path="/cheques" element={<ChequeManagement />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id/ledger" element={<CustomerLedger />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
