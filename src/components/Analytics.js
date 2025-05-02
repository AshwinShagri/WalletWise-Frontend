import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
    BarChart, Bar, PieChart, Pie, LineChart, Line, Sector,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Cell
} from "recharts";
import { 
    FaRupeeSign, FaCalendarAlt, FaChartLine, FaChartPie, 
    FaArrowUp, FaArrowDown, FaEquals, FaList, FaChevronDown,
    FaCalendarDay, FaCalendarWeek, FaMoneyBillWave
} from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Gauge, GaugeContainer } from '@mui/x-charts/Gauge';
import "../styles/Analytics.css";

const Analytics = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState("month");
    const [analyticsData, setAnalyticsData] = useState(null);
    const [activePieIndex, setActivePieIndex] = useState(null);
    const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
    const [showCustomRange, setShowCustomRange] = useState(false);
    const [customStartDate, setCustomStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date;
    });
    const [customEndDate, setCustomEndDate] = useState(new Date());

    const COLORS = useMemo(() => [
        "#3498db", "#2ecc71", "#f1c40f", "#e74c3c", "#9b59b6",
        "#34495e", "#1abc9c", "#e67e22", "#ecf0f1", "#7f8c8d",
        "#2980b9", "#27ae60", "#f39c12", "#c0392b", "#8e44ad"
    ], []);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    const fetchAnalyticsData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        
        let params = { timeframe };
        if (timeframe === 'custom' && customStartDate && customEndDate) {
            params.customStart = customStartDate.toISOString().split('T')[0];
            params.customEnd = customEndDate.toISOString().split('T')[0];
        }
        
        try {
            const token = await user.getIdToken();
            const response = await axios.get(`${API_BASE_URL}/api/analytics`, {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnalyticsData(response.data);
        } catch (err) {
            console.error("Error fetching analytics data:", err);
            const message = err.response?.data?.error || err.message || "Failed to load analytics data. Please try again later.";
            setError(message);
            setAnalyticsData(null);
        } finally {
            setLoading(false);
        }
    }, [user, timeframe, customStartDate, customEndDate, API_BASE_URL]);


    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        fetchAnalyticsData();
    }, [user, timeframe, customStartDate, customEndDate, fetchAnalyticsData, navigate]);

    const {
        budget, totalSpent, avgDailySpent, categoryBreakdown, spendingTrend, 
        topExpenses, comparison, categoryComparison
    } = useMemo(() => {
        return {
            budget: analyticsData?.budget || null,
            totalSpent: analyticsData?.totalSpent || 0,
            avgDailySpent: analyticsData?.avgDailySpent || 0,
            categoryBreakdown: analyticsData?.categoryBreakdown || [],
            spendingTrend: analyticsData?.spendingTrend || [],
            topExpenses: analyticsData?.topExpenses || [],
            comparison: analyticsData?.comparison || { currentPeriodTotal: 0, previousPeriodTotal: 0, percentChange: 0 },
            categoryComparison: analyticsData?.categoryComparison || []
        };
    }, [analyticsData]);

    const formatCurrency = useCallback((amount) => {
        if (typeof amount !== 'number' || isNaN(amount)) return '₹--';
        return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    }, []);

    const formatPercentage = useCallback((value) => {
        if (typeof value !== 'number' || isNaN(value)) return '--%';
        if (value === Infinity) return <FaArrowUp title="Increased from zero" />;
        if (value === -100) return <FaArrowDown title="Decreased to zero" />;
        const sign = value > 0 ? '+' : '';
        const colorClass = value > 0 ? 'increase' : value < 0 ? 'decrease' : 'no-change';
        return <span className={colorClass}>{sign}{value.toFixed(2)}%</span>;
    }, []);

    const formatXAxisTick = useCallback((tickItem) => {
        try {
            const date = new Date(tickItem + 'T00:00:00Z');
            if (isNaN(date.getTime())) return tickItem;

            if (timeframe === "day") return date.toLocaleTimeString([], { hour: '2-digit' });
            if (timeframe === "week") return date.toLocaleDateString([], { weekday: 'short' });
            if (timeframe === "month") return date.getDate();
            if (timeframe === "quarter") return `${date.getMonth() + 1}/${date.getDate()}`;
            return `${date.toLocaleString('default', { month: 'short' })} '${date.getFullYear().toString().slice(-2)}`;
        } catch (e) { return tickItem; }
    }, [timeframe]);

    const onPieEnter = useCallback((_, index) => { setActivePieIndex(index); }, []);
    const onPieLeave = useCallback(() => { setActivePieIndex(null); }, []);

    const generateSummary = useMemo(() => {
        if (!analyticsData) return '';
        
        const { categoryBreakdown = [], comparison, timeframe } = analyticsData;
        if (categoryBreakdown.length === 0) return `No spending data available for this ${timeframe}.`;
        
        const topCategory = categoryBreakdown[0];
        let summary = `This ${timeframe}, your highest spending was on ${topCategory.name} (${formatCurrency(topCategory.value)})`;
        
        if (comparison?.percentChange !== undefined) {
            if (comparison.percentChange === Infinity) {
                summary += ', which is new spending compared to last period.';
            } else if (comparison.percentChange > 0) {
                summary += `. Your total spending increased by ${Math.abs(comparison.percentChange)}% compared to last ${timeframe}.`;
            } else if (comparison.percentChange < 0) {
                summary += `. Your total spending decreased by ${Math.abs(comparison.percentChange)}% compared to last ${timeframe}.`;
            } else {
                summary += ', which is unchanged from last period.';
            }
        }
        
        
        return summary;
    }, [analyticsData, formatCurrency, totalSpent]);

    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = ((payload[0].value / totalSpent) * 100);
            return (
                <div className="custom-tooltip chart-tooltip">
                    <strong className="tooltip-label">{data.name}</strong>
                    <p>{formatCurrency(data.value)}</p>
                    {totalSpent > 0 && <p className="tooltip-secondary">{percentage.toFixed(1)}% of total</p>}
                </div>
            );
        }
        return null;
    };

    const CustomLineBarTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const isTrendChart = payload[0].payload.date;
            const title = isTrendChart ? `Date: ${label}` : `Category: ${label}`;
            const value = payload[0].value;
            return (
                <div className="custom-tooltip chart-tooltip">
                    <strong className="tooltip-label">{title}</strong>
                    <p>Amount: {formatCurrency(value)}</p>
                </div>
            );
        }
        return null;
    };

    const renderActiveShape = (props) => {
        const RADIAN = Math.PI / 180;
        const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value, index } = props;
        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);

        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + (index === activePieIndex ? 5 : 0)}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    stroke="#fff"
                    strokeWidth={1}
                />
            </g>
        );
    };

    const getComparisonLabel = () => {
        if (timeframe === "day") return "vs. Yesterday";
        if (timeframe === "week") return "vs. Last Week";
        if (timeframe === "month") return "vs. Last Month";
        if (timeframe === "quarter") return "vs. Last Quarter";
        if (timeframe === "year") return "vs. Last Year";
        return "vs. Previous Period";
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div>Loading Analytics...</div>;
    }

    if (error) {
        return (
            <div className="analytics-container modern">
                <header className="analytics-header">
                    <h1>Expense Analytics</h1>
                    <div className="header-controls">
                        <div className="timeframe-selector">
                            <button className={timeframe === "month" ? "active" : ""} onClick={() => setTimeframe("month")}>Month</button>
                            <button className={timeframe === "quarter" ? "active" : ""} onClick={() => setTimeframe("quarter")}>Quarter</button>
                            <button className={timeframe === "year" ? "active" : ""} onClick={() => setTimeframe("year")}>Year</button>
                        </div>
                        <Link to="/dashboard" className="back-button">Back to Dashboard</Link>
                    </div>
                </header>
                <div className="error-message">{error}</div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="analytics-container modern">
                <header className="analytics-header">
                    <h1>Expense Analytics</h1>
                    <div className="header-controls">
                        <div className="timeframe-selector">
                            <button className={timeframe === "month" ? "active" : ""} onClick={() => setTimeframe("month")}>Month</button>
                            <button className={timeframe === "quarter" ? "active" : ""} onClick={() => setTimeframe("quarter")}>Quarter</button>
                            <button className={timeframe === "year" ? "active" : ""} onClick={() => setTimeframe("year")}>Year</button>
                        </div>
                        <Link to="/dashboard" className="back-button">Back to Dashboard</Link>
                    </div>
                </header>
                <div className="info-message">No analytics data found for the selected period.</div>
            </div>
        );
    }

    return (
        <div className="analytics-container modern">
            <header className="analytics-header">
                <h1>Expense Analytics</h1>
                <div className="header-controls">
                    <div className="timeframe-selector">
                        <div className="dropdown-container">
                            <button 
                                className="dropdown-toggle" 
                                onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                            >
                                {timeframe === 'day' && <><FaCalendarDay /> Daily</>}
                                {timeframe === 'week' && <><FaCalendarWeek /> Weekly</>}
                                {timeframe === 'month' && <><FaCalendarAlt /> Monthly</>}
                                {timeframe === 'quarter' && <><FaChartLine /> Quarterly</>}
                                {timeframe === 'year' && <><FaChartLine /> Yearly</>}
                                {timeframe === 'custom' && <><FaCalendarAlt /> Custom</>}
                                <FaChevronDown className="chevron" />
                            </button>
                            
                            {showTimeframeDropdown && (
                                <div className="dropdown-menu">
                                    <button onClick={() => { setTimeframe('day'); setShowTimeframeDropdown(false); }}>
                                        <FaCalendarDay /> Daily
                                    </button>
                                    <button onClick={() => { setTimeframe('week'); setShowTimeframeDropdown(false); }}>
                                        <FaCalendarWeek /> Weekly
                                    </button>
                                    <button onClick={() => { setTimeframe('month'); setShowTimeframeDropdown(false); }}>
                                        <FaCalendarAlt /> Monthly
                                    </button>
                                    <button onClick={() => { setTimeframe('quarter'); setShowTimeframeDropdown(false); }}>
                                        <FaChartLine /> Quarterly
                                    </button>
                                    <button onClick={() => { setTimeframe('year'); setShowTimeframeDropdown(false); }}>
                                        <FaChartLine /> Yearly
                                    </button>
                                    <button onClick={() => { 
                                        setTimeframe('custom'); 
                                        setShowTimeframeDropdown(false);
                                        setShowCustomRange(true);
                                    }}>
                                        <FaCalendarAlt /> Custom Range
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {timeframe === 'custom' && showCustomRange && (
                            <div className="custom-range-picker">
                                <DatePicker
                                    selected={customStartDate}
                                    onChange={date => setCustomStartDate(date)}
                                    selectsStart
                                    startDate={customStartDate}
                                    endDate={customEndDate}
                                    maxDate={customEndDate}
                                    placeholderText="Start Date"
                                    dateFormat="MMMM d, yyyy"
                                    className="date-picker-input"
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                />
                                <span className="date-range-separator">to</span>
                                <DatePicker
                                    selected={customEndDate}
                                    onChange={date => setCustomEndDate(date)}
                                    selectsEnd
                                    startDate={customStartDate}
                                    endDate={customEndDate}
                                    minDate={customStartDate}
                                    maxDate={new Date()}
                                    placeholderText="End Date"
                                    dateFormat="MMMM d, yyyy"
                                    className="date-picker-input"
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                />
                                <button 
                                    onClick={() => {
                                        if (customStartDate && customEndDate) {
                                            fetchAnalyticsData();
                                            setShowCustomRange(false);
                                        }
                                    }}
                                    disabled={!customStartDate || !customEndDate}
                                    className="apply-date-range"
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>
                    <Link to="/dashboard" className="back-button">Back to Dashboard</Link>
                </div>
            </header>

            <section className="ai-summary">
                <div className="summary-text">{generateSummary}</div>
            </section>

            <section className="summary-cards">
                <div className="summary-card">
                    <div className="card-icon"><FaRupeeSign /></div>
                    <div className="card-content">
                        <h3>Total Spent</h3>
                        <p className="amount">{formatCurrency(totalSpent)}</p>
                        <p className="label">
                            {timeframe === 'day' ? 'Today' : 
                             timeframe === 'week' ? 'This Week' : 
                             timeframe === 'month' ? 'This Month' : 
                             timeframe === 'quarter' ? 'This Quarter' : 'This Year'}
                        </p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="card-icon"><FaCalendarAlt /></div>
                    <div className="card-content">
                        <h3>Daily Average</h3>
                        <p className="amount">{formatCurrency(avgDailySpent)}</p>
                        <p className="label">Avg. Per Day ({timeframe})</p>
                    </div>
                </div>
                
                <div className="summary-card comparison">
                    <div className="card-icon">
                        {comparison.percentChange === 0 || !isFinite(comparison.percentChange)
                            ? <FaEquals />
                            : comparison.percentChange > 0 ? <FaArrowUp /> : <FaArrowDown />}
                    </div>
                    <div className="card-content">
                        <h3>Comparison</h3>
                        <p className="amount percentage">{formatPercentage(comparison.percentChange)}</p>
                        <p className="label">{getComparisonLabel()}</p>
                        <p className="comparison-details">
                            Current: {formatCurrency(comparison.currentPeriodTotal)} |
                            Previous: {formatCurrency(comparison.previousPeriodTotal)}
                        </p>
                    </div>
                </div>
            </section>

            <section className="analytics-grid">
                <div className="chart-container wide">
                    <div className="chart-header">
                        <h2><FaChartLine /> Spending Trend</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={spendingTrend} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis 
                                dataKey="date" 
                                tickFormatter={formatXAxisTick} 
                                tick={{ fontSize: 10, fill: '#666' }} 
                                angle={timeframe === 'day' ? 0 : -30} 
                                textAnchor="end" 
                                dy={5} 
                            />
                            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: '#666' }} width={70} />
                            <Tooltip content={<CustomLineBarTooltip />} cursor={{ stroke: '#aaa', strokeDasharray: '3 3' }} />
                            <Legend verticalAlign="top" height={36}/>
                            <Line 
                                type="monotone" 
                                dataKey="amount" 
                                name="Daily Spending" 
                                stroke="#8884d8" 
                                strokeWidth={2} 
                                dot={{ r: 3, fill: '#8884d8' }} 
                                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container combined-chart">
                    <div className="chart-header">
                        <h2><FaChartPie /> Spending by Category</h2>
                    </div>
                    <div className="pie-list-container">
                        <div className="pie-chart-wrapper">
                            {categoryBreakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            activeIndex={activePieIndex}
                                            activeShape={renderActiveShape}
                                            data={categoryBreakdown}
                                            cx="50%" cy="50%"
                                            innerRadius={50} outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value" nameKey="name"
                                            onMouseEnter={onPieEnter} onMouseLeave={onPieLeave}
                                        >
                                            {categoryBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomPieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : ( <p className="no-data-chart">No category data.</p> )}
                        </div>
                        <div className="category-list-wrapper">
                            {categoryBreakdown.length > 0 && (
                                <ul className="category-list">
                                    {categoryBreakdown.map((item, index) => (
                                        <li 
                                            key={item.name} 
                                            className={activePieIndex === index ? 'active' : ''} 
                                            onMouseEnter={() => setActivePieIndex(index)} 
                                            onMouseLeave={() => setActivePieIndex(null)}
                                        >
                                            <span className="category-color-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                            <span className="category-name" title={item.name}>{item.name}</span>
                                            <span className="category-value">{formatCurrency(item.value)}</span>
                                            <span className="category-percent">{totalSpent > 0 ? `(${(item.value / totalSpent * 100).toFixed(1)}%)` : ''}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <div className="chart-container">
                    <div className="chart-header">
                        <h2><FaList /> Category Comparison</h2>
                        <small>Amount Spent vs Previous Period</small>
                    </div>
                    {categoryComparison.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart 
                                data={categoryComparison} 
                                layout="vertical" 
                                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
                                <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: '#666' }} />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    width={80} 
                                    tick={{ fontSize: 10, fill: '#666' }}
                                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                                />
                                <Tooltip content={<CustomLineBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }}/>
                                <Legend verticalAlign="top" height={36}/>
                                <Bar dataKey="currentValue" name={`Current (${timeframe})`} fill="#3498db" barSize={15}/>
                                <Bar dataKey="previousValue" name={`Previous Period`} fill="#bdc3c7" barSize={15}/>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : ( <p className="no-data-chart">No comparison data.</p> )}
                </div>
            </section>

            <section className="top-expenses-section">
                <div className="chart-header">
                    <h2>Top 5 Expenses</h2>
                    <small>Highest spending transactions this period</small>
                </div>
                {topExpenses.length > 0 ? (
                    <div className="top-expenses-list">
                        {topExpenses.map((expense, index) => (
                            <div className="expense-card" key={index}>
                                <div className="expense-icon" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                                    <FaRupeeSign />
                                </div>
                                <div className="expense-details">
                                    <h3>{expense.title}</h3>
                                    <p className="category">{expense.category}</p>
                                    <p className="date"><FaCalendarAlt /> {expense.date}</p>
                                </div>
                                <div className="expense-amount">{formatCurrency(expense.amount)}</div>
                            </div>
                        ))}
                    </div>
                ) : ( <p className="no-data-chart">No expenses recorded.</p> )}
            </section>
        </div>
    );
};

export default Analytics;