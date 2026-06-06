import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthRedirectScreen } from "@/components/AuthRedirectScreen";

// Sends the user straight to Keycloak's hosted login page. If they already
// have a session (check-sso), they go directly to the marketplace instead.
export function SignInPage() {
  const { ready, authenticated, login } = useAuth();
  const navigate = useNavigate();
  const triggered = useRef(false);

  useEffect(() => {
    if (!ready || triggered.current) return;
    if (authenticated) {
      navigate("/marketplace", { replace: true });
      return;
    }
    triggered.current = true;
    login(window.location.origin + "/marketplace");
  }, [ready, authenticated, login, navigate]);

  return <AuthRedirectScreen label="Redirecting you to sign in…" />;
}
