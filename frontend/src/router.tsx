import { createBrowserRouter } from "react-router-dom";
import { SiteLayout } from "@/components/SiteLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LandingPage } from "@/pages/Landing";
import { MarketplacePage } from "@/pages/Marketplace";
import { LoanDetailPage } from "@/pages/LoanDetail";
import { NewDealPage } from "@/pages/NewDeal";
import { DashboardPage } from "@/pages/Dashboard";
import { CDIPage } from "@/pages/CDI";
import { AboutPage } from "@/pages/About";
import { MCPConnectorPage } from "@/pages/MCPConnector";
import { NotFoundPage } from "@/pages/NotFound";
import { SignInPage } from "@/pages/SignIn";
import { SignUpPage } from "@/pages/SignUp";

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "marketplace", element: <MarketplacePage /> },
      { path: "cdi", element: <CDIPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "mcp", element: <MCPConnectorPage /> },
      { path: "deals/:id", element: <LoanDetailPage /> },
      {
        path: "deals/new",
        element: (
          <ProtectedRoute>
            <NewDealPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "forbidden",
        element: (
          <NotFoundPage
            code="403"
            title="Forbidden"
            body="You don't have permission to access this page."
          />
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  { path: "/signin", element: <SignInPage /> },
  { path: "/signup", element: <SignUpPage /> },
]);
