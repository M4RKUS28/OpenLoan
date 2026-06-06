import { createBrowserRouter } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/pages/Login";
import { DashboardPage } from "@/pages/Dashboard";
import { FileManagerPage } from "@/pages/FileManager";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "files", element: <FileManagerPage /> },
      {
        path: "admin",
        element: (
          <ProtectedRoute requiredRole="admin">
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Admin-only area.</p>
            </div>
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/forbidden",
    element: (
      <div className="flex h-screen flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-bold">403 — Forbidden</h1>
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    ),
  },
]);
