import React, { useEffect, useState, useMemo } from "react";
import { db } from "../config/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "../styles/ExpenseList.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Icons
import {
  FaTag, FaDollarSign, FaCalendarAlt, FaPen,
  FaSort, FaSortUp, FaSortDown,
  FaFilter, FaAngleLeft, FaAngleRight,
  FaTrash, FaFileDownload
} from 'react-icons/fa';

// Helper Functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const formatDate = (dateInput) => {
  let date;
  if (dateInput instanceof Timestamp) {
    date = dateInput.toDate();
  } else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return 'Invalid Date';
  }

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const ExpenseList = () => {
  const { user } = useAuth();
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [availableCategories, setAvailableCategories] = useState([]);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch available categories
  useEffect(() => {
    if (!user) return;
    const fetchCategories = async () => {
      try {
        const expensesRef = collection(db, "expenses");
        const q = query(expensesRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const categories = new Set();
        snapshot.forEach((doc) => {
          const category = doc.data()?.category;
          if (category && typeof category === 'string') {
            categories.add(category);
          }
        });
        setAvailableCategories(Array.from(categories).sort());
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, [user]);

  // Fetch expenses
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    };

    const fetchExpenses = async () => {
      setLoading(true);
      setError(null);
      try {
        const expensesRef = collection(db, "expenses");
        let constraints = [where("userId", "==", user.uid)];

        if (categoryFilter) {
          constraints.push(where("category", "==", categoryFilter));
        }
        if (startDateFilter) {
          const start = new Date(startDateFilter);
          start.setHours(0, 0, 0, 0);
          constraints.push(where("createdAt", ">=", Timestamp.fromDate(start)));
        }
        if (endDateFilter) {
          const end = new Date(endDateFilter);
          end.setHours(23, 59, 59, 999);
          constraints.push(where("createdAt", "<=", Timestamp.fromDate(end)));
        }

        constraints.push(orderBy("createdAt", "desc"));

        const q = query(expensesRef, ...constraints);
        const querySnapshot = await getDocs(q);

        const expenseData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          displayDate: doc.data().date || doc.data().createdAt,
          createdAt: doc.data().createdAt,
        }));

        setAllExpenses(expenseData);
      } catch (err) {
        console.error("Error fetching expenses:", err);
        setError("Failed to load expenses. Check Firestore indexes or connection.");
        setAllExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [user, categoryFilter, startDateFilter, endDateFilter]);

  // Sort expenses
  const sortedExpenses = useMemo(() => {
    let sortableExpenses = [...allExpenses];
    if (sortConfig.key !== null) {
      sortableExpenses.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'amount') {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else if (sortConfig.key === 'createdAt' || sortConfig.key === 'date') {
          aValue = (aValue?.toDate ? aValue.toDate() : new Date(aValue)).getTime() || 0;
          bValue = (bValue?.toDate ? bValue.toDate() : new Date(bValue)).getTime() || 0;
        } else {
          aValue = String(aValue || '').toLowerCase();
          bValue = String(bValue || '').toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableExpenses;
  }, [allExpenses, sortConfig]);

  // Paginate expenses
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedExpenses, currentPage]);

  const totalPages = Math.ceil(sortedExpenses.length / ITEMS_PER_PAGE);

  // Handle delete expense
  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        const userToken = await user.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/expense/${expenseId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userToken}`,
          },
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete expense");
        }
  
        // Refresh the list after deletion
        setAllExpenses(allExpenses.filter(expense => expense.id !== expenseId));
      } catch (err) {
        console.error("Error deleting expense:", err);
        setError(err.message || "Failed to delete expense");
      }
    }
  };
  const exportToPDF = () => {
    // Initialize jsPDF
    const doc = new jsPDF();
  
    // Title
    doc.setFontSize(18);
    doc.text("Expense Report", 14, 22);
  
    // Filters info
    doc.setFontSize(10);
    let filtersText = "All Expenses";
    if (categoryFilter || startDateFilter || endDateFilter) {
      filtersText = "Filtered by: ";
      if (categoryFilter) filtersText += `Category: ${categoryFilter} `;
      if (startDateFilter) filtersText += `From: ${formatDate(startDateFilter)} `;
      if (endDateFilter) filtersText += `To: ${formatDate(endDateFilter)}`;
    }
    doc.text(filtersText, 14, 30);
  
    // Prepare table data
    const headers = [['Title', 'Category', 'Amount', 'Date']];
    const data = sortedExpenses.map(expense => [
      expense.title || '-',
      expense.category,
      Number(expense.amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      formatDate(expense.displayDate)
    ]);
  
    // Generate the table using the explicitly imported autoTable
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 40,
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        2: { cellWidth: 30 } // Amount column width
      }
    });
  
    // Save the PDF
    const date = new Date().toLocaleDateString('en-IN');
    doc.save(`expense-report-${date}.pdf`);
  };

  // Handle sort
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Render sort icon
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <FaSort className="sort-icon neutral" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <FaSortUp className="sort-icon active" />;
    }
    return <FaSortDown className="sort-icon active" />;
  };

  return (
    <div className="expense-list-wrapper">
      {/* Filters Section */}
      <div className="filters-container">
        <h3 className="filters-title"><FaFilter /> Filter & Sort</h3>
        <div className="filters-grid">
          <div className="filter-item">
            <label htmlFor="categoryFilter">Category</label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="startDateFilter">Start Date</label>
            <input
              type="date"
              id="startDateFilter"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input"
            />
          </div>

          <div className="filter-item">
            <label htmlFor="endDateFilter">End Date</label>
            <input
              type="date"
              id="endDateFilter"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input"
            />
          </div>
        </div>
        
        <button 
          onClick={exportToPDF}
          className="download-button"
          disabled={sortedExpenses.length === 0}
        >
          <FaFileDownload /> Download as PDF
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading expenses...</p>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}

      {/* Expenses Table */}
      {!loading && !error && (
        <>
          {sortedExpenses.length === 0 ? (
            <p className="no-expenses">No expenses found matching your criteria.</p>
          ) : (
            <div className="table-responsive">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('title')}>
                      <FaPen /> Title {renderSortIcon('title')}
                    </th>
                    <th onClick={() => handleSort('category')}>
                      <FaTag /> Category {renderSortIcon('category')}
                    </th>
                    <th onClick={() => handleSort('amount')} className="amount-column">
                      <FaDollarSign /> Amount {renderSortIcon('amount')}
                    </th>
                    <th onClick={() => handleSort('createdAt')}>
                      <FaCalendarAlt /> Date {renderSortIcon('createdAt')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{expense.title || '-'}</td>
                      <td>{expense.category}</td>
                      <td className="amount-column">{formatCurrency(expense.amount)}</td>
                      <td>{formatDate(expense.displayDate)}</td>
                      <td>
                        <button 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="delete-button"
                          aria-label="Delete expense"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-button"
                aria-label="Previous Page"
              >
                <FaAngleLeft /> Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-button"
                aria-label="Next Page"
              >
                Next <FaAngleRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExpenseList;