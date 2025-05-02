import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import OCRScanner from "./components/OCRScanner";
import Chatbot from "./components/Chatbot";
import ManualExpense from "./components/ManualExpense";
import Analytics from "./components/Analytics";
import SidebarLayout from "./layouts/SidebarLayout";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Home Page (No Sidebar) */}
        <Route path="/" element={<Home />} />

        {/* Protected Routes with Sidebar Layout */}
        
          <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
          <Route element={<SidebarLayout />}>
          <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
          <Route path="/add-expense/manual" element={<PrivateRoute element={<ManualExpense />} />} />
          <Route path="/add-expense/ocr" element={<PrivateRoute element={<OCRScanner />} />} />
          <Route path="/add-expense/chatbot" element={<PrivateRoute element={<Chatbot />} />} />
          <Route path="/analytics" element={<PrivateRoute element={<Analytics />} />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
