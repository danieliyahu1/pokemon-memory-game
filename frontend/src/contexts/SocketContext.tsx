import { createContext, useContext, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketContext = {
    socket: Socket;
};

// Create a context with an initial value of undefined
const SocketContext = createContext<SocketContext | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
let socket: Socket | null = null;

function getSocket (): Socket
{
    if (!socket) {
        socket = useRef(io(API_BASE_URL)).current;
    }
    return socket;
};

// Define the SocketProvider component
const SocketProvider = ({ children }: { children: ReactNode }) => {
    const socket = getSocket();
    return (
        <SocketContext.Provider value={{ socket: socket! }}>
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