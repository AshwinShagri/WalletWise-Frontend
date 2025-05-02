import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// Install react-icons: npm install react-icons
import {
    FaRegUserCircle, // Using a generic user icon as placeholder for AuthContext
    FaPen,
    FaRupeeSign,
    FaTags,
    FaCalendarAlt,
    FaPlusCircle,
    FaSpinner,
    FaExclamationTriangle,
    FaArrowLeft,
    FaFolderPlus,
} from "react-icons/fa";
import "../styles/ManualExpense.css"; // We will create this new CSS file

const ManualExpense = () => {
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user, getToken } = useAuth(); // Assuming useAuth provides user object

    // Focus the first input field on mount
    useEffect(() => {
        const firstInput = document.getElementById("expense-title");
        if (firstInput) {
            firstInput.focus();
        }
    }, []);

    // Predefined categories (can be fetched from backend in future)
    const predefinedCategories = useMemo( // Use useMemo if this list could potentially change
        () => [
            "Food & Dining",
            "Transportation",
            "Shopping",
            "Bills & Utilities",
            "Entertainment",
            "Travel",
            "Education",
            "Health & Fitness",
            "Personal Care",
            "Home & Rent",
            "Groceries",
            "Investments",
            "Insurance",
            "Gifts & Donations",
            "Other", // Keep 'Other' at the end or handle its logic separately
        ],
        []
    );

    // Formats the date for display if needed, though input type="date" handles it
    const formatDateForDisplay = (isoDate) => {
        try {
            return new Date(isoDate).toLocaleDateString('en-CA'); // YYYY-MM-DD format
        } catch {
            return isoDate; // Fallback
        }
    };

    const handleAmountChange = (e) => {
        const value = e.target.value;
        // Allow only numbers and a single decimal point
        if (/^\d*\.?\d*$/.test(value)) {
             // Prevent negative numbers directly in input if desired
             // Or validate on submit
            setAmount(value);
        }
    };

    const validateForm = () => {
        setError(null); // Clear previous errors
        if (!title.trim()) {
            setError("Title is required.");
            return false;
        }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("Please enter a valid positive amount.");
            return false;
        }
        if (!category) {
             setError("Please select a category.");
             return false;
        }
        if (category === "Other" && !customCategory.trim()) {
            setError("Please enter a custom category name.");
            return false;
        }
        if (!date) {
             setError("Please select a date.");
             return false;
        }
        // Add more specific validations if needed
        return true;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null); // Clear previous errors

        try {
            const token = await getToken();
            if (!token) {
                setError("Authentication error. Please log in again.");
                setLoading(false);
                // Consider redirecting to login: navigate('/login');
                return;
            }

            // Ensure amount is parsed correctly
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount)) {
                 setError("Invalid amount entered.");
                 setLoading(false);
                 return;
            }


            const finalCategory = category === "Other" ? customCategory.trim() : category;

            const expenseData = {
                title: title.trim(),
                amount: parsedAmount,
                category: finalCategory,
                date,
                userId: user?.uid, // Include userId if your backend expects it in the body
            };

            // Get API URL from environment variable or use fallback
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

            await axios.post(`${API_BASE_URL}/api/expense/manual`, expenseData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            // Success! Maybe show a success message briefly before navigating
            // Or use react-toastify for better notifications
            // alert("Expense added successfully!"); // Replace alert with better UI feedback if desired
            navigate("/dashboard?expenseAdded=true"); // Navigate back, optionally with a success flag

        } catch (err) {
            console.error("Error adding expense:", err);
            const message = err.response?.data?.error || err.message || "Failed to add expense. Please try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Handle category change, clear custom category if switching away from "Other"
    const handleCategoryChange = (e) => {
        const selectedCategory = e.target.value;
        setCategory(selectedCategory);
        if (selectedCategory !== "Other") {
            setCustomCategory(""); // Clear custom input when not needed
        }
    };


    return (
        <div className="manual-expense-page">
             <div className="page-header">
                 <Link to="/dashboard" className="back-link"><FaArrowLeft /> Back to Dashboard</Link>
                 <h1>Add New Expense</h1>
                 {/* Optional: Display user info */}
                 {user && <div className="user-info-chip"><FaRegUserCircle /> {user.displayName || user.email}</div>}
            </div>

            <div className="manual-expense-container card">
                <form onSubmit={handleSubmit} noValidate> {/* Add noValidate to prevent default HTML5 validation UI */}
                    {/* Title Input */}
                    <div className="form-group">
                        <label htmlFor="expense-title">
                            <FaPen /> Title
                        </label>
                        <input
                            id="expense-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Lunch with colleagues"
                            required
                            aria-required="true"
                            disabled={loading}
                        />
                    </div>

                    {/* Amount Input */}
                    <div className="form-group">
                        <label htmlFor="expense-amount">
                            <FaRupeeSign /> Amount (₹)
                        </label>
                        <input
                            id="expense-amount"
                            type="text" // Use text to allow custom validation pattern
                            inputMode="decimal" // Hint for mobile keyboards
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0.00"
                            required
                            aria-required="true"
                            disabled={loading}
                        />
                    </div>

                    {/* Category Select */}
                    <div className="form-group">
                        <label htmlFor="expense-category">
                            <FaTags /> Category
                        </label>
                        <select
                            id="expense-category"
                            value={category}
                            onChange={handleCategoryChange}
                            required
                            aria-required="true"
                            disabled={loading}
                        >
                            <option value="" disabled>-- Select a Category --</option>
                            {predefinedCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Category Input (Conditional) */}
                    {/* Apply transition class */}
                    <div className={`form-group custom-category-group ${category === "Other" ? 'visible' : ''}`}>
                         {category === "Other" && ( // Render only when needed but control visibility via CSS
                             <>
                                <label htmlFor="custom-category">
                                    <FaFolderPlus /> Custom Category Name
                                </label>
                                <input
                                    id="custom-category"
                                    type="text"
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    placeholder="Enter category name"
                                    required={category === "Other"} // Conditionally required
                                    aria-required={category === "Other"}
                                    disabled={loading}
                                />
                             </>
                         )}
                    </div>


                    {/* Date Input */}
                    <div className="form-group">
                        <label htmlFor="expense-date">
                            <FaCalendarAlt /> Date
                        </label>
                        <input
                            id="expense-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            aria-required="true"
                            disabled={loading}
                            // Optionally set max date to today: max={new Date().toISOString().split("T")[0]}
                        />
                    </div>

                     {/* Error Message Display */}
                     {error && (
                         <div className="error-message form-error">
                            <FaExclamationTriangle /> {error}
                        </div>
                     )}

                    {/* Submit Button */}
                    <div className="form-actions">
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? (
                                <>
                                    <FaSpinner className="spinner-icon" /> Adding...
                                </>
                            ) : (
                                <>
                                    <FaPlusCircle /> Add Expense
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualExpense;