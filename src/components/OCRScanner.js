// components/OCRScanner.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
// npm install react-icons
import { FaUpload, FaReceipt, FaTimes, FaSpinner, FaCheckCircle, FaExclamationCircle, FaEdit, FaSave, FaTrashAlt, FaArrowLeft, FaRupeeSign, FaCalendarAlt, FaTag, FaStickyNote } from 'react-icons/fa';

// Import the CSS module (assuming you rename and structure it)
// import styles from '../styles/OCRScanner.module.css';
// OR stick with the regular CSS import if you prefer
import '../styles/OCRScanner.css';


const OCRScanner = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAdding, setIsAdding] = useState(false); // Separate state for adding expense
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null); // Stores the raw OCR result
    const [convertCurrency, setConvertCurrency] = useState(true);
    const [editedExpense, setEditedExpense] = useState(null); // Data being edited
    const [successMessage, setSuccessMessage] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false); // Control visibility of success message

    const { user, token, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null); // Ref for file input

    // Reset all component state
    const resetAllState = useCallback(() => {
        setFile(null);
        setPreview(null);
        setIsProcessing(false);
        setIsAdding(false);
        setError(null);
        setResult(null);
        // setConvertCurrency(true); // Keep user preference? Or reset? Resetting for now.
        setEditedExpense(null);
        setSuccessMessage(null);
        setShowSuccess(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Clear the file input
        }
    }, []);

    // Effect to reset state on user change or mount
    useEffect(() => {
        resetAllState();
    }, [user, resetAllState]);

    // Clear success message after a delay
    useEffect(() => {
        let timer;
        if (showSuccess && successMessage) {
            timer = setTimeout(() => {
                setShowSuccess(false);
                // Optionally clear the message itself after fade out
                // setTimeout(() => setSuccessMessage(null), 500);
            }, 4000); // Hide after 4 seconds
        }
        return () => clearTimeout(timer);
    }, [showSuccess, successMessage]);


    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            setError(null); // Clear error on new file selection
            setResult(null); // Clear previous results
            setEditedExpense(null); // Clear editable data
            setSuccessMessage(null); // Clear success message
            setShowSuccess(false);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        } else if (selectedFile) {
            setError('Please select a valid image file (jpg, png, webp, etc.).');
            resetFile();
        }
    };

    const resetFile = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setEditedExpense(null);
         if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Clear the file input visually
        }
    };

    const handleScanSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a receipt image.');
            return;
        }
        if (!user || authLoading) {
            setError('Authentication required. Please wait or log in.');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSuccessMessage(null);
        setShowSuccess(false);
        setResult(null); // Clear previous result before scanning
        setEditedExpense(null);

        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001'; // Fallback URL

        try {
            const formData = new FormData();
            formData.append('receipt', file);
            formData.append('convertCurrency', convertCurrency);

            const response = await axios.post(
                `${apiUrl}/api/ocr/process`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const processedData = response.data.data;
            setResult(processedData); // Store the raw result

            // Pre-populate the editable expense data, ensuring numbers are numbers
             // Use optional chaining and provide defaults
            const initialAmount = parseFloat(processedData.convertedAmount ?? processedData.total ?? 0);
            const initialOriginalAmount = parseFloat(processedData.total ?? 0);

            setEditedExpense({
                amount: isNaN(initialAmount) ? 0 : initialAmount,
                originalAmount: isNaN(initialOriginalAmount) ? 0 : initialOriginalAmount,
                originalCurrency: processedData.currency || 'N/A',
                convertedCurrency: processedData.convertedCurrency || null,
                 // Use category or default to 'Other'
                category: processedData.category || 'Other',
                date: processedData.date || new Date().toISOString().split('T')[0], // Default to today
                title: processedData.title || 'Scanned Expense' // Default title
            });

        } catch (err) {
            console.error('Error processing receipt:', err);
            const message = err.response?.data?.error || 'Failed to process receipt. The image might be unclear or unsupported.';
            setError(message);
            setResult(null);
            setEditedExpense(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        // Ensure amount and originalAmount are stored as numbers
        const isNumericField = name === 'amount' || name === 'originalAmount';
        setEditedExpense(prev => ({
            ...prev,
            [name]: isNumericField ? parseFloat(value) || 0 : value
        }));
    };

     const handleAddExpense = async () => {
        if (!editedExpense) return;

        setIsAdding(true); // Use separate loading state
        setError(null);
        setSuccessMessage(null);
        setShowSuccess(false);

        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';

        try {
            // Ensure amount is a number before sending
            const payload = {
                ...editedExpense,
                amount: parseFloat(editedExpense.amount) || 0,
            };

            await axios.post(
                `${apiUrl}/api/ocr/add-expense`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccessMessage(`Expense "${editedExpense.title}" added successfully!`);
            setShowSuccess(true);
            // Reset form fields but keep the success message briefly
            setFile(null);
            setPreview(null);
            setResult(null);
            setEditedExpense(null);
            if (fileInputRef.current) {
                 fileInputRef.current.value = "";
             }

        } catch (err) {
            console.error('Error adding expense:', err);
            setError(err.response?.data?.error || 'Failed to add expense. Please check the details.');
        } finally {
            setIsAdding(false);
        }
    };

    // Drag and Drop Handlers
    const handleDragOver = (e) => {
        e.preventDefault(); // Necessary to allow drop
        e.stopPropagation();
        // Add visual cue class if desired
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Remove visual cue class if desired

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            const file = droppedFiles[0];
            // Trigger file change handler
             if (fileInputRef.current) {
                fileInputRef.current.files = droppedFiles; // Assign files to input
                handleFileChange({ target: fileInputRef.current }); // Simulate change event
            }
        }
    };


    // Component Structure
    return (
        <div className="ocr-page-container">
            <div className="ocr-header">
                <h1><FaReceipt /> Receipt Scanner</h1>
                <Link to="/dashboard" className="ocr-back-button">
                    <FaArrowLeft /> Go to Dashboard
                </Link>
            </div>

             {/* Success Message Toast */}
             <div className={`ocr-toast success ${showSuccess ? 'show' : ''}`}>
                 <FaCheckCircle /> {successMessage}
            </div>

             {/* Error Message Toast */}
             {error && (
                 <div className="ocr-toast error show">
                    <FaExclamationCircle /> {error}
                    <button onClick={() => setError(null)} className="close-toast"><FaTimes /></button>
                </div>
            )}

            <div className="ocr-content-area">
                {/* --- Left Column: Upload & Preview --- */}
                <div className="ocr-upload-column">
                    <form onSubmit={handleScanSubmit} className="ocr-form">
                        <div
                            className={`file-upload-container ${preview ? 'has-preview' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={(e) => {/* Optionally remove visual cue */}}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()} // Trigger click on container click
                        >
                             {preview ? (
                                <>
                                    <img src={preview} alt="Receipt preview" className="receipt-preview-image" />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); resetFile(); }}
                                        className="remove-preview-button"
                                        aria-label="Remove selected file"
                                    >
                                        <FaTimes />
                                    </button>
                                </>
                            ) : (
                                <div className="upload-placeholder-content">
                                    <FaUpload className="upload-icon" />
                                    <p><strong>Drag & Drop</strong> your receipt image here</p>
                                    <p>or</p>
                                    <span className="upload-browse-button">Browse Files</span>
                                    <p className="upload-hint">Supports JPG, PNG, WEBP</p>
                                </div>
                            )}
                             <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png, image/jpeg, image/webp" // Be more specific
                                onChange={handleFileChange}
                                className="file-input-hidden" // Hide the default input
                                disabled={isProcessing || isAdding}
                            />
                        </div>

                        <div className="ocr-options">
                            <label className="currency-toggle">
                                <input
                                    type="checkbox"
                                    checked={convertCurrency}
                                    onChange={() => setConvertCurrency(!convertCurrency)}
                                    disabled={isProcessing || isAdding || !file}
                                />
                                <span>Convert to default currency (if applicable)</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="scan-button primary-button"
                            disabled={!file || isProcessing || isAdding || !user || authLoading}
                        >
                            {isProcessing ? (
                                <><FaSpinner className="spinner" /> Scanning...</>
                            ) : (
                                'Scan Receipt'
                            )}
                        </button>
                    </form>
                </div>

                {/* --- Right Column: Results & Edit Form --- */}
                <div className="ocr-results-column">
                    <div className={`ocr-results-card ${editedExpense ? 'visible' : ''}`}>
                        {!editedExpense && !isProcessing && (
                             <div className="results-placeholder">
                                <FaEdit />
                                <p>Scan a receipt to see the extracted details here and edit before adding.</p>
                            </div>
                        )}
                         {isProcessing && !editedExpense && (
                             <div className="results-placeholder loading">
                                <FaSpinner className="spinner" />
                                <p>Analyzing your receipt...</p>
                            </div>
                        )}

                         {editedExpense && (
                            <div className="edit-expense-form">
                                <h3>Edit Extracted Details</h3>

                                <div className="form-grid">
                                    {/* Title */}
                                    <div className="form-group">
                                        <label htmlFor="title"><FaStickyNote /> Title:</label>
                                        <input
                                            id="title" type="text" name="title"
                                            value={editedExpense.title} onChange={handleEditChange}
                                            placeholder="e.g., Lunch at Cafe" maxLength={50}
                                            disabled={isAdding}
                                        />
                                    </div>

                                    {/* Amount */}
                                    <div className="form-group">
                                        <label htmlFor="amount"><FaRupeeSign /> Amount:</label>
                                        <div className="amount-input-group">
                                            <input
                                                 id="amount" type="number" name="amount"
                                                 value={editedExpense.amount} onChange={handleEditChange}
                                                 step="0.01" placeholder="0.00"
                                                 disabled={isAdding}
                                            />
                                             <span className="currency-display">
                                                 {editedExpense.convertedCurrency || editedExpense.originalCurrency}
                                            </span>
                                        </div>
                                         {/* Display Original Amount if converted */}
                                         {editedExpense.convertedCurrency && editedExpense.originalCurrency !== editedExpense.convertedCurrency && (
                                            <div className="original-amount-display">
                                                Original: {editedExpense.originalAmount.toFixed(2)} {editedExpense.originalCurrency}
                                            </div>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <div className="form-group">
                                        <label htmlFor="category"><FaTag /> Category:</label>
                                        <select
                                            id="category" name="category"
                                            value={editedExpense.category} onChange={handleEditChange}
                                            disabled={isAdding}
                                        >
                                            {/* Use a predefined list or fetch from backend */}
                                            <option value="Food & Dining">Food & Dining</option>
                                            <option value="Transportation">Transportation</option>
                                            <option value="Shopping">Shopping</option>
                                            <option value="Bills & Utilities">Bills & Utilities</option>
                                            <option value="Entertainment">Entertainment</option>
                                            <option value="Travel">Travel</option>
                                            <option value="Education">Education</option>
                                            <option value="Health & Fitness">Health & Fitness</option>
                                            <option value="Personal Care">Personal Care</option>
                                            <option value="Home & Rent">Home & Rent</option>
                                            <option value="Groceries">Groceries</option>
                                            <option value="Investments">Investments</option>
                                            <option value="Insurance">Insurance</option>
                                            <option value="Gifts & Donations">Gifts & Donations</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    {/* Date */}
                                    <div className="form-group">
                                        <label htmlFor="date"><FaCalendarAlt /> Date:</label>
                                        <input
                                            id="date" type="date" name="date"
                                            value={editedExpense.date} onChange={handleEditChange}
                                            disabled={isAdding}
                                             // Optionally set max date to today
                                             max={new Date().toISOString().split("T")[0]}
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                     <button
                                        type="button"
                                        onClick={handleAddExpense}
                                        className="add-expense-button primary-button"
                                        disabled={isAdding || isProcessing}
                                    >
                                        {isAdding ? (
                                            <><FaSpinner className="spinner" /> Adding...</>
                                        ) : (
                                             <><FaSave /> Add Expense</>
                                        )}
                                    </button>
                                     <button
                                        type="button"
                                        onClick={resetAllState} // Use full reset
                                        className="cancel-button secondary-button"
                                        disabled={isAdding || isProcessing}
                                    >
                                        <FaTrashAlt /> Cancel / New Scan
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OCRScanner;