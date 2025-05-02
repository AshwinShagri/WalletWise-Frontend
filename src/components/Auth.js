import React, { useEffect, useState } from "react";
import { auth } from "./config/firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";

const AuthComponent = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("User:", currentUser);
      setUser(currentUser);

      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken(true);
          console.log("🔥 ID Token:", idToken);
          localStorage.setItem("token", idToken);
        } catch (error) {
          console.error("❌ Error fetching ID token:", error);
        }
      } else {
        localStorage.removeItem("token");
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("❌ Login Error:", error);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {user ? <p>✅ Logged in as {user.displayName}</p> : <button onClick={signInWithGoogle}>Sign in with Google</button>}
    </div>
  );
};

export default AuthComponent;
