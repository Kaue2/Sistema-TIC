import { createContext, useContext } from "react";

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

export function useUser() {
    return useContext(UserContext);
}
