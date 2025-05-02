import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import "../styles/Sidebar.css";

import {
  FaTachometerAlt,
  FaUserCircle,
  FaChartPie,
  FaSignOutAlt,
} from "react-icons/fa";

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [avatar, setAvatar] = useState("/Avatars/default-avatar.png");
  const [name, setName] = useState("User");

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (isMounted) {
              setAvatar(userData.avatar || "/Avatars/default-avatar.png");
              setName(userData.name || user.displayName || "User");
            }
          } else if (isMounted) {
            setAvatar("/Avatars/default-avatar.png");
            setName(user.displayName || "User");
          }
        } catch (error) {
          console.error("Error fetching user data in sidebar:", error);
          if (isMounted) {
            setAvatar("/Avatars/default-avatar.png");
            setName(user.displayName || "User");
          }
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img
          src="/logo-removebg1.png"
          alt="WalletWise Logo"
          className="app-logo-sidebar"
        />
        <h1 className="sidebar-logo">WalletWise</h1>
      </div>

      {/* Display user info and avatar */}
      <div className="user-info">
        <img
          src={avatar}
          alt="User Avatar"
          className="avatar"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/Avatars/default-avatar.png";
          }}
        />
        <h3 className="user-name">{name}</h3>
        <p className="user-email">{user?.email}</p>
      </div>

      <div className="sidebar-menu">
        <nav className="nav-links">
          <Link
            to="/dashboard"
            className={`nav-link ${
              location.pathname === "/dashboard" ? "active" : ""
            }`}
          >
            <FaTachometerAlt className="nav-icon" /> <span>Dashboard</span>
          </Link>
          <Link
            to="/profile"
            className={`nav-link ${
              location.pathname === "/profile" ? "active" : ""
            }`}
          >
            <FaUserCircle className="nav-icon" /> <span>Profile</span>
          </Link>
          <Link 
            to="/analytics" 
            className={`nav-link ${
              location.pathname === "/analytics" ? "active" : ""
            }`}
          >
            <FaChartPie className="nav-icon" /> <span>View Analytics</span>
          </Link>
        </nav>
        
        <button className="nav-link logout-btn" onClick={handleLogout}>
          <FaSignOutAlt className="nav-icon" /> <span>Logout</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <p>&copy; {new Date().getFullYear()} WalletWise</p>
      </div>
    </aside>
  );
};

export default Sidebar;