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

    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io(API_BASE_URL);
            setIsReady(true);
        }

        return () => {
            // Optionally disconnect on unmount if needed
            // socketRef.current?.disconnect();
        };
    }, []);

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