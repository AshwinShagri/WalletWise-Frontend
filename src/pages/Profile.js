import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../config/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import "../styles/Profile.css";
import { ArrowLeft, User, DollarSign } from 'react-feather';

const avatars = Array.from({ length: 20 }, (_, i) => `/Avatars/${i + 1}.png`);
const currencies = ["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)"];

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [currency, setCurrency] = useState("INR (₹)");
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setSelectedAvatar(data.avatar || avatars[0]);
          setCurrency(data.currency || "INR (₹)");
          setDisplayName(data.name || user.displayName || "");
        } else {
          const initialData = { name: user.displayName || "", avatar: avatars[0], currency: "INR (₹)" };
          await setDoc(userRef, initialData);
          setSelectedAvatar(avatars[0]);
          setCurrency("INR (₹)");
          setDisplayName(user.displayName || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { name: displayName, avatar: selectedAvatar, currency });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const openAvatarModal = () => {
    setShowAvatarModal(true);
  };

  const closeAvatarModal = () => {
    setShowAvatarModal(false);
  };

  const selectAvatarHandler = (avatar) => {
    setSelectedAvatar(avatar);
    closeAvatarModal();
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="profile-container">
      <button className="back-to-dashboard-button" onClick={handleGoBack}>
        <ArrowLeft size={18} /> Back to Dashboard
      </button>
      <div className="profile-header">
        <h2>Account Settings</h2>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-section">
            <label htmlFor="name"><User size={18} /> Name</label>
            <input
              type="text"
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="profile-section">
            <label>Avatar</label>
            <div
              className="avatar-selection"
              onClick={openAvatarModal}
              onMouseEnter={() => setIsAvatarHovered(true)}
              onMouseLeave={() => setIsAvatarHovered(false)}
            >
              <img
                src={selectedAvatar}
                alt="Selected Avatar"
                className={`selected-avatar ${isAvatarHovered ? 'hovered' : ''}`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = avatars[0];
                }}
              />
              <span className="change-avatar-text">Change Avatar</span>
            </div>
          </div>

          <div className="profile-section">
            <label htmlFor="currency"><DollarSign size={18} /> Default Currency</label>
            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencies.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </div>

          <button className="save-button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {showAvatarModal && (
          <div className="avatar-modal">
            <div className="avatar-modal-content">
              <h3>Choose your Avatar</h3>
              <div className="avatar-grid">
                {avatars.map((avatar) => (
                  <img
                    key={avatar}
                    src={avatar}
                    alt="Avatar Option"
                    className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                    onClick={() => selectAvatarHandler(avatar)}
                  />
                ))}
              </div>
              <button className="modal-close-button" onClick={closeAvatarModal}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
