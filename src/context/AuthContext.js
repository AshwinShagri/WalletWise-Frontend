import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, provider } from "../config/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null); // Add token state
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem("userUID", currentUser.uid);
        
        // Get and store token when user auth state changes
        try {
          const idToken = await currentUser.getIdToken(true);
          setToken(idToken);
          localStorage.setItem("token", idToken);
        } catch (error) {
          console.error("Error fetching ID token:", error);
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem("userUID");
        localStorage.removeItem("token");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getToken = async () => {
    try {
      if (user) {
        // Force refresh the token to ensure it's valid
        const freshToken = await user.getIdToken(true);
        setToken(freshToken);
        localStorage.setItem("token", freshToken);
        return freshToken;
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
    return null;
  };

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      
      // Get token after login
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      localStorage.setItem("token", idToken);
      localStorage.setItem("userUID", result.user.uid);
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
    localStorage.removeItem("userUID");
    localStorage.removeItem("token");
    navigate("/");
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};