import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const SidebarLayout = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarLayout;
