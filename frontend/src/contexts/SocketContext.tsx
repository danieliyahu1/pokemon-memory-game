import { createContext, useContext, ReactNode, useRef, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketContext = {
    socket: Socket;
};

// Create a context with an initial value of undefined
const SocketContext = createContext<SocketContext | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Define the SocketProvider component
const SocketProvider = ({ children }: { children: ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('authToken'));

    // Listen for storage changes to detect login/logout from other tabs
    useEffect(() => {
        const handleStorageChange = () => {
            const token = localStorage.getItem('authToken');
            setAuthToken(token);
        };

        const handleAuthTokenUpdated = () => {
            const token = localStorage.getItem('authToken');
            setAuthToken(token);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('authTokenUpdated', handleAuthTokenUpdated);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authTokenUpdated', handleAuthTokenUpdated);
        };
    }, []);

    useEffect(() => {
        // Disconnect existing socket if it exists
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        // Create new socket connection with current auth token
        const socketOptions: any = {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        };
        
        if (authToken) {
            socketOptions.auth = {
                token: authToken
            };
        }

        socketRef.current = io(API_BASE_URL, socketOptions);
        setIsReady(true);

        return () => {
            // Disconnect on unmount
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [authToken]);

    if (!isReady || !socketRef.current) {
        return <div>Connecting...</div>;
    }

    return (
        <SocketContext.Provider value={{ socket: socketRef.current }}>
            {children}
        </SocketContext.Provider>
    );
};

// Define the useSocket hook
const useSocketContext = (): SocketContext => {
    const context = useContext(SocketContext);
    if (context === undefined || context.socket === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }

    return context as SocketContext;
};

export { SocketProvider, useSocketContext };