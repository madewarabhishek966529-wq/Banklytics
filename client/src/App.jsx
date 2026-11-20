import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import AppLayout from './components/layout/AppLayout.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import UploadStatement from './pages/UploadStatement.jsx';
import ImportReview from './pages/ImportReview.jsx';
import Transactions from './pages/Transactions.jsx';
import Statements from './pages/Statements.jsx';
import StatementDetails from './pages/StatementDetails.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing */}
          <Route path="/" element={<Landing />} />

          {/* Optional Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Statement Analysis App Routes (Direct access, zero friction) */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<UploadStatement />} />
            <Route path="/review" element={<ImportReview />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/statements" element={<Statements />} />
            <Route path="/statements/:id" element={<StatementDetails />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
