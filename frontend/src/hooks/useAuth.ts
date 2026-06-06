import { useEffect, useState } from "react";
import { getUserInfo, initKeycloak, isAuthenticated, login, logout } from "@/lib/auth";

interface AuthState {
  ready: boolean;
  authenticated: boolean;
  user: ReturnType<typeof getUserInfo>;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    ready: false,
    authenticated: false,
    user: null,
  });

  useEffect(() => {
    initKeycloak().then(() => {
      setState({
        ready: true,
        authenticated: isAuthenticated(),
        user: getUserInfo(),
      });
    });
  }, []);

  return { ...state, login, logout };
}
