import { createBrowserRouter } from "react-router-dom";
import { Login } from "./pages/Login";
import { ProfilePage } from "./pages/ProfilePage";
import { WelcomeConfirmation } from "./pages/WelcomeConfirmation";
import { AccessUpdate } from "./pages/AccessUpdate";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />, // Rota pública
  },
  {
    path: "/welcome",
    element: <WelcomeConfirmation />, // Rota pública
  },
  {
    path: "/access-update",
    element: <AccessUpdate />, // Rota pública
  },
  {
    path: "/profile/:id",
    element: <ProfilePage />,
  },
]);
