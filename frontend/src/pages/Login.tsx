import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const { ready, authenticated, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && authenticated) navigate("/", { replace: true });
  }, [ready, authenticated, navigate]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">Welcome</h1>
      <p className="text-muted-foreground">Sign in to continue</p>
      <button
        onClick={() => login()}
        className="rounded-lg bg-primary px-6 py-2.5 text-primary-foreground shadow hover:bg-primary/90"
      >
        Sign in with Keycloak
      </button>
    </div>
  );
}
