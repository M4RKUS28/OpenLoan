import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

let initPromise: Promise<boolean> | null = null;

export async function initKeycloak(): Promise<boolean> {
  if (initPromise) return initPromise;
  initPromise = keycloak.init({
    onLoad: "check-sso",
    silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
    pkceMethod: "S256",
    // App and Keycloak live on different origins, so the login-status iframe's
    // 3rd-party-cookie check (auth.../3p-cookies/step1.html) is framed cross-site
    // and blocked by X-Frame-Options — it times out and fails init(). It relies on
    // 3rd-party cookies that browsers block anyway. Disable it; session detection
    // still works via the same-origin silent-check-sso iframe above.
    checkLoginIframe: false,
  });
  return initPromise;
}

export async function login(redirectUri?: string) {
  await keycloak.login(redirectUri ? { redirectUri } : undefined);
}

export async function register(redirectUri?: string) {
  // Redirects to Keycloak's hosted registration form (requires
  // registrationAllowed=true on the realm).
  await keycloak.register(redirectUri ? { redirectUri } : undefined);
}

export async function logout() {
  await keycloak.logout({ redirectUri: window.location.origin });
}

export function getToken(): string | undefined {
  return keycloak.token;
}

export async function getValidToken(): Promise<string> {
  await keycloak.updateToken(30);
  if (!keycloak.token) throw new Error("Not authenticated");
  return keycloak.token;
}

// Returns a fresh token when signed in, or undefined when not — never throws.
// Used by the API client so public endpoints (the marketplace) work for guests.
export async function getOptionalToken(): Promise<string | undefined> {
  if (!keycloak.authenticated) return undefined;
  try {
    await keycloak.updateToken(30);
    return keycloak.token ?? undefined;
  } catch {
    return undefined;
  }
}

export function getUserInfo() {
  const p = keycloak.tokenParsed;
  if (!p) return null;
  return {
    id: p.sub as string,
    email: p.email as string,
    username: p.preferred_username as string,
    roles: (p.realm_access?.roles ?? []) as string[],
  };
}

export function isAuthenticated(): boolean {
  return keycloak.authenticated ?? false;
}

export { keycloak };
