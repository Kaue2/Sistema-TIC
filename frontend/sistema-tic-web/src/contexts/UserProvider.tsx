import { useEffect, useRef, useState } from "react";
import { UserContext, type UserData } from "./userContext";
import { getUserPhotoUrl } from "../services/user-services";

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

    // busca a foto do usuário logado uma única vez (login, ou reload de página com sessão
    // ativa) e guarda em cache no contexto/localStorage. Os componentes que mostram o ícone
    // de perfil (nav, cabeçalho do perfil) leem daqui em vez de cada um pedir a própria cópia.
    const fetchingPhotoRef = useRef(false);
    useEffect(() => {
        if (!userData || userData.avatarUrl !== undefined || fetchingPhotoRef.current) return;

        fetchingPhotoRef.current = true;
        getUserPhotoUrl(userData.id)
            .then((avatarUrl) => {
                setUserData((current) => (current ? { ...current, avatarUrl } : current));
            })
            .finally(() => {
                fetchingPhotoRef.current = false;
            });
    }, [userData]);

    return (
        <UserContext.Provider value={{ userData, setUserData }}>
            {children}
        </UserContext.Provider>
    );
}
