/**
 * @hook useAuth
 * @description Manages Firebase authentication state and provides login/logout functionality.
 *
 * @purpose
 * - Track the current authenticated user
 * - Handle Google OAuth login flow
 * - Manage Firebase ID tokens for API authentication
 * - Provide loading state during auth initialization
 *
 * @returns {Object}
 * - user: User | null - The currently authenticated Firebase user
 * - idToken: string | null - Firebase ID token for API calls
 * - loading: boolean - True while auth state is being determined
 * - loginWithGoogle: () => Promise<User> - Initiates Google OAuth popup login
 * - logout: () => Promise<void> - Signs out the current user
 *
 * @example
 * const { user, loading, loginWithGoogle, logout } = useAuth();
 *
 * if (loading) return <Spinner />;
 * if (!user) return <LoginButton onClick={loginWithGoogle} />;
 * return <Dashboard user={user} onLogout={logout} />;
 */

import { useState, useEffect } from "react";
import { User, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [idToken, setIdToken] = useState<string | null>(null);

    useEffect(() => {
        console.log("useAuth: Setting up auth state listener");
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            console.log("Auth state changed:", user ? `User: ${user.email}` : "No user");
            setUser(user);
            if (user) {
                try {
                    const token = await user.getIdToken();
                    setIdToken(token);
                    console.log("Got ID token");
                } catch (error) {
                    console.error("Failed to get ID token:", error);
                }
            } else {
                setIdToken(null);
            }
            setLoading(false);
            console.log("Auth loading complete");
        });

        return unsubscribe;
    }, []);

    const loginWithGoogle = async () => {
        try {
            console.log("Attempting Google login...");
            const result = await signInWithPopup(auth, googleProvider);
            console.log("Google login successful:", result.user.email);
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
            console.log("Logged out");
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

