import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../api/auth.js";

function ProtectedRoute({ children }) {

    const [authStatus, setAuthStatus] = useState("checking");

    useEffect(() => {

        let isMounted = true;

        const checkAuthentication = async () => {

            try {

                await getCurrentUser();

                if (isMounted) {
                    setAuthStatus("authenticated");
                }

            } catch (error) {

                if (isMounted) {
                    setAuthStatus("unauthenticated");
                }

            }
        };

        checkAuthentication();

        return () => {
            isMounted = false;
        };

    }, []);

    // Wait until authentication is checked
    if (authStatus === "checking") {
        return <div>Checking authentication...</div>;
    }

    // Redirect if user is not authenticated
    if (authStatus === "unauthenticated") {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;