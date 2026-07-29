import { createBrowserRouter } from "react-router-dom";
import { Login } from "./pages/Login";
import { ProfilePage } from "./pages/ProfilePage";
import { WelcomeConfirmation } from "./pages/WelcomeConfirmation";
import { AccessUpdate } from "./pages/AccessUpdate";
import { MembersPage } from "./pages/MembersPage";
import { MemberForm } from "./pages/MemberForm";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/welcome",
    element: <WelcomeConfirmation />,
  },
  {
    path: "/access-update",
    element: <AccessUpdate />,
  },
  {
    path: "/profile/:id",
    element: <ProfilePage />,
  },
  {
    path: "/members",
    element: <MembersPage />,
  },
  {
    path: "/members/new",
    element: <MemberForm />,
  },
  {
    path: "/members/:id/edit",
    element: <MemberForm />,
  },
]);
