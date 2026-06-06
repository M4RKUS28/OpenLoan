import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function SignUpPage() {
  const { ready, authenticated, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && authenticated) navigate("/dashboard", { replace: true });
  }, [ready, authenticated, navigate]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="text-muted-foreground">Sign up to get started</p>
      <button
        onClick={() => register()}
        className="rounded-lg bg-primary px-6 py-2.5 text-primary-foreground shadow hover:bg-primary/90"
      >
        Sign up with Keycloak
      </button>
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
