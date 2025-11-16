import { useState, useEffect } from "react";
import { User, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [idToken, setIdToken] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setUser(user);
            if (user) {
                const token = await user.getIdToken();
                setIdToken(token);
            } else {
                setIdToken(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const token = await result.user.getIdToken();
            setIdToken(token);
            return result.user;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setIdToken(null);
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        }
    };

    return {
        user,
        idToken,
        loading,
        loginWithGoogle,
        logout,
    };
};

