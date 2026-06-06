import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthRedirectScreen } from "@/components/AuthRedirectScreen";

// Sends the user straight to Keycloak's hosted registration page. If they
// already have a session (check-sso), they go directly to the marketplace.
export function SignUpPage() {
  const { ready, authenticated, register } = useAuth();
  const navigate = useNavigate();
  const triggered = useRef(false);

  useEffect(() => {
    if (!ready || triggered.current) return;
    if (authenticated) {
      navigate("/marketplace", { replace: true });
      return;
    }
    triggered.current = true;
    register(window.location.origin + "/marketplace");
  }, [ready, authenticated, register, navigate]);

  return <AuthRedirectScreen label="Taking you to sign up…" />;
}
