import { createContext, useContext, useEffect, useState } from "react";

export interface UserData {
    id: string;
    email: string;
    name: string;
    roleName: string;
}

export interface UserContextType {
    userData: UserData | null;
    setUserData: (userData: UserData |  null) => void;
}

export const UserContext = createContext<UserContextType>({
    userData: null,
    setUserData: () => {},
});

// tenta recuperar o usuário do localStorage ao inicializar o estado
// caso não tenha nada no localStorage, o estado inicial será null
export function UserProvider({children}: {children: React.ReactNode}) {
    const [userData, setUserData] = useState<UserData | null>(() => {
    const storedUser = localStorage.getItem('@SistemaTIC:user');
    
        if (storedUser) {
            return JSON.parse(storedUser);
        }
    
        return null;
    });

    // monitora mudanças no estado userData e atualiza o localStorage de acordo
    useEffect(() => {
        if (userData) {
            localStorage.setItem('@SistemaTIC:user', JSON.stringify(userData));
        } else {
            localStorage.removeItem('@SistemaTIC:user');
        }
    }, [userData]);

    return (
        <UserContext.Provider value={{ userData, setUserData }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}