import { useEffect, useState } from "react";
import { UserContext, type UserData } from "./userContext";

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
