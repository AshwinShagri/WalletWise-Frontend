import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../config/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import ExpenseList from "../components/ExpenseList"; // Assuming ExpenseList is styled appropriately
import "../styles/Dashboard.css"; // Import the new CSS

// --- Font Awesome Icons (Example using react-icons, install if needed: npm install react-icons) ---
// Or use standard <i> tags if you prefer including Font Awesome via CDN
import {
  FaTachometerAlt,
  FaUserCircle,
  FaPlusCircle,
  FaChartPie,
  FaSignOutAlt,
  FaWallet,
  FaCalendarDay,
  FaTimes, // Close icon
  FaEdit,  // Manual Entry icon
  FaCamera, // OCR icon
  FaCommentDots // Chatbot icon
} from 'react-icons/fa';
// --- End Icons ---

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [avatar, setAvatar] = useState("/Avatars/1.png"); // Default avatar
  const [name, setName] = useState("User");
  const [totalMonthExpenses, setTotalMonthExpenses] = useState(0);
  const [totalTodayExpenses, setTotalTodayExpenses] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component
    setIsLoading(true);

    if (user) {
      const fetchUserData = async () => {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (isMounted && userSnap.exists()) {
            const userData = userSnap.data();
            setAvatar(userData.avatar || "/Avatars/default-avatar.png"); // Use a default if none set
            setName(userData.name || user.displayName || "User");
          } else if (isMounted) {
             setName(user.displayName || "User"); // Fallback name
             setAvatar("/Avatars/default-avatar.png"); // Fallback avatar
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
           if (isMounted) {
               setName(user.displayName || "User");
               setAvatar("/Avatars/default-avatar.png");
           }
        }
      };

      const fetchExpenses = async () => {
        try {
            // Ensure date calculations handle timezones correctly if necessary,
            // Firestore timestamp might be better than ISO string for querying ranges.
            // Using ISO string based on original code for now.
          const today = new Date();
          const localTodayISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];

          const firstDayOfMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
           const localFirstDayOfMonthISO = new Date(firstDayOfMonthDate.getTime() - firstDayOfMonthDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];


          const expensesRef = collection(db, "expenses");
          // Consider adding orderBy and limit for performance if list grows large
          const q = query(expensesRef, where("userId", "==", user.uid));
          const snapshot = await getDocs(q);

          let monthTotal = 0;
          let todayTotal = 0;

          snapshot.docs.forEach((doc) => {
            const expense = doc.data();
             // Ensure expense.date exists and is a valid string or timestamp
             if (expense.date && typeof expense.date === 'string') {
                const expenseDate = expense.date.split("T")[0];

                // Compare dates as strings (YYYY-MM-DD format is comparable)
                 if (expenseDate >= localFirstDayOfMonthISO) {
                     monthTotal += Number(expense.amount) || 0; // Ensure amount is a number
                 }
                 if (expenseDate === localTodayISO) {
                     todayTotal += Number(expense.amount) || 0; // Ensure amount is a number
                 }
             } else if (expense.date && expense.date.toDate) { // Handle Firestore Timestamps
                 const expenseDate = expense.date.toDate();
                 const expenseDateISO = new Date(expenseDate.getTime() - expenseDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];

                 if (expenseDateISO >= localFirstDayOfMonthISO) {
                     monthTotal += Number(expense.amount) || 0;
                 }
                 if (expenseDateISO === localTodayISO) {
                    todayTotal += Number(expense.amount) || 0;
                 }
             }
          });

           if (isMounted) {
             setTotalMonthExpenses(monthTotal);
             setTotalTodayExpenses(todayTotal);
           }
        } catch (error) {
           console.error("Error fetching expenses:", error);
           // Optionally set expenses to 0 or show an error state
            if (isMounted) {
                setTotalMonthExpenses(0);
                setTotalTodayExpenses(0);
            }
        }
      };

      Promise.all([fetchUserData(), fetchExpenses()]).then(() => {
         if (isMounted) {
            setIsLoading(false);
         }
      });

    } else {
      // If no user, maybe redirect to login or show specific message
       if (isMounted) setIsLoading(false); // Stop loading if no user
    }

     // Cleanup function to prevent setting state on unmounted component
     return () => {
         isMounted = false;
     };
  }, [user]); // Dependency array includes user

  const handleLogout = async () => {
      try {
          await logout();
          navigate('/'); // Redirect to login after logout
      } catch (error) {
          console.error("Logout failed:", error);
          // Optionally show an error message to the user
      }
  };

  // Format currency function
  const formatCurrency = (amount) => {
      // Adjust 'en-IN' and 'INR' based on your target locale/currency
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (isLoading) {
      // Optional: Add a more sophisticated loading spinner/animation here
      return <div className="loading-overlay"><div>Loading Dashboard...</div></div>;
  }

  if (!user) {
      // Handles the case where user is logged out or auth state is lost
      // You might want to redirect to login here immediately
      // navigate('/login'); // Uncomment if immediate redirect is desired
      return <div className="loading-overlay"><div>Please <Link to="/login">log in</Link> to view your dashboard.</div></div>;
  }


  return (
    <div className="dashboard-container">
      {/* -- Sidebar -- */}
      <aside className="sidebar">
        <div className="sidebar-header">
           {/* You can replace text with a logo */}
           <img src="/logo-removebg1.png" alt="WalletWise Logo" className="app-logo-sidebar" />
      <h1 className="sidebar-logo">WalletWise</h1>
        </div>
        <div className="user-info">
          <img src={avatar} alt="User Avatar" className="avatar" onError={(e)=>{e.target.onerror = null; e.target.src="/Avatars/default-avatar.png"}}/> {/* Fallback directly in img tag */}
          <h3 className="user-name">{name}</h3>
          <p className="user-email">{user?.email}</p>
        </div>
        <nav className="nav-links">
           <Link to="/dashboard" className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}>
               <FaTachometerAlt className="nav-icon" /> <span>Dashboard</span>
           </Link>
           <Link to="/profile" className={`nav-link ${location.pathname === "/profile" ? "active" : ""}`}>
               <FaUserCircle className="nav-icon" /> <span>Profile</span>
           </Link>
        </nav>
        {/* -- Actions moved to Sidebar -- */}
        <div className="sidebar-actions">
            <button className="sidebar-action-button add-expense-btn" onClick={() => setShowPopup(true)}>
               <FaPlusCircle className="action-icon" /> <span>Add Expense</span>
            </button>
            <Link to="/analytics" className="sidebar-action-button view-analytics-btn">
               <FaChartPie className="action-icon" /> <span>View Analytics</span>
            </Link>
            <button className="sidebar-action-button logout-btn" onClick={handleLogout}>
                <FaSignOutAlt className="action-icon" /> <span>Logout</span>
            </button>
        </div>
         <div className="sidebar-footer">
             {/* Optional footer content */}
             <p>&copy; {new Date().getFullYear()} WalletWise</p>
         </div>
      </aside>

      {/* -- Main Content Area -- */}
      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Welcome back, {name}!</h1>
          <p>Here's your financial overview for today.</p>
        </header>

        <section className="quick-overview">
          <div className="overview-box month-expenses">
            <div className="overview-icon-wrapper">
              <FaWallet className="overview-icon" />
            </div>
            <div className="overview-details">
              <h2>{formatCurrency(totalMonthExpenses)}</h2>
              <p>Total Expenses This Month</p>
            </div>
          </div>
          <div className="overview-box today-expenses">
             <div className="overview-icon-wrapper">
               <FaCalendarDay className="overview-icon" />
             </div>
             <div className="overview-details">
               <h2>{formatCurrency(totalTodayExpenses)}</h2>
               <p>Today's Expenses</p>
             </div>
          </div>
           {/* Add more overview boxes if needed (e.g., Budget Remaining, Savings Goal) */}
        </section>

        <section className="recent-expenses">
          <h2>Recent Activity</h2>
          {/* ExpenseList component will display recent expenses */}
          <ExpenseList />
        </section>
      </main>

      {/* -- Popup Modal for Adding Expense -- */}
      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}> {/* Close on overlay click */}
           <div className="popup-content" onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside popup */}
             <button className="popup-close" onClick={() => setShowPopup(false)} aria-label="Close">
                <FaTimes />
             </button>
             <h3>How would you like to add an expense?</h3>
             <div className="popup-options">
                 <button className="popup-button manual" onClick={() => { navigate("/add-expense/manual"); setShowPopup(false); }}>
                    <FaEdit className="popup-icon" /> Manual Entry
                 </button>
                 <button className="popup-button ocr" onClick={() => { navigate("/add-expense/ocr"); setShowPopup(false); }}>
                    <FaCamera className="popup-icon" /> Scan Receipt (OCR)
                 </button>
                 <button className="popup-button chatbot" onClick={() => { navigate("/add-expense/chatbot"); setShowPopup(false); }}>
                    <FaCommentDots className="popup-icon" /> Use AI Chatbot
                 </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;