
import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

interface User {
    id: string;
    name: string;
    role: string;
    specialty?: string;
}

interface AuthContextData {
    user: User | null;
    signIn: (data: any) => Promise<void>;
    signOut: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load token from localStorage
        const token = localStorage.getItem('@ClinicaSocial:token');
        const userData = localStorage.getItem('@ClinicaSocial:user');

        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const signIn = async ({ email, password }: any) => {
        try {
            const data = await api.login({ email, password });

            // Backend returns: { access_token, token_type, role, user_id, name }
            // We map this to our User interface
            const user: User = {
                id: (data as any).user_id,
                name: (data as any).name,
                role: (data as any).role,
                specialty: (data as any).specialty
            };

            localStorage.setItem('@ClinicaSocial:token', (data as any).access_token);
            localStorage.setItem('@ClinicaSocial:user', JSON.stringify(user));

            setUser(user);
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const signOut = () => {
        localStorage.removeItem('@ClinicaSocial:token');
        localStorage.removeItem('@ClinicaSocial:user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, signIn, signOut, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    return context;
}
