import React from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Home.css"; // Import CSS for styling

const Home = () => {
  const { login } = useAuth();

  return (
    <div
      className="home-container"
      style={{
        backgroundImage: `url("/5b02fc14-7ef7-42be-a07b-74d06fdc7481.png")`, // Update with your actual image filename
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
      }}
    >
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-wrapper">
          {/* Left Side: App Name & Description */}
          <div className="hero-content">
            <h1 className="app-name">WalletWise</h1>
            <p className="hero-description">
              Take control of your finances with AI-powered tracking, smart insights, and seamless OCR scanning.
            </p>
            <button className="login-btn" onClick={login}>
              Login with Google
            </button>
          </div>

          {/* Right Side: Logo Card */}
          <div className="hero-logo-card">
            <img
              src="/logo-removebg.png" // Update with actual logo filename
              alt="WalletWise Logo"
              className="hero-logo"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <article className="feature-card">
          <img src="/virtual-assistant_17569415.gif" alt="AI Chatbot" />
          <h2>AI Chatbot</h2>
          <p>Interact with our AI chatbot to add expenses and track your spending effortlessly.</p>
        </article>
        <article className="feature-card">
          <img src="/analytics_17905640.gif" alt="OCR Receipt Scanner" />
          <h2>OCR Receipt Scanner</h2>
          <p>Scan receipts and extract the total and category automatically.</p>
        </article>
        <article className="feature-card">
          <img src="/analytics_15401498.gif" alt="Smart Categorization" />
          <h2>Smart Categorization</h2>
          <p>Our AI categorizes expenses automatically based on transaction details.</p>
        </article>
      </section>

      {/* How it Works Section */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <article className="step">
            <img src="/HD-wallpaper-new-google-logo-flat-material-white.jpg" alt="Step 1 - Sign in" />
            <h3>Step 1</h3>
            <p>Sign in using your Google account for a seamless experience.</p>
          </article>
          <article className="step">
            <img src="/5262072.png" alt="Step 2 - Track Expenses" />
            <h3>Step 2</h3>
            <p>Track expenses manually, via OCR scanning, or using the AI chatbot.</p>
          </article>
          <article className="step">
            <img src="/3297225.jpg" alt="Step 3 - Analyze Spending" />
            <h3>Step 3</h3>
            <p>Analyze your spending with smart insights and budgeting tools.</p>
          </article>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <p>&copy; 2025 WalletWise. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
