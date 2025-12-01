// SSR-safe auth client: do not access localStorage, window or atob on the server.
// All browser-only ops are guarded with `typeof window !== 'undefined'`.

type AuthState = {
  token: string | null;
  user?: any | null;
};

type Listener = (state: AuthState) => void;

const STORAGE_TOKEN = 'access_token';
const STORAGE_USER = 'auth_user';

function safeParseJwt(token: string | null): { exp?: number } | null {
  if (!token) return null;
  // atob is a browser API; guard it
  if (typeof window === 'undefined' || typeof atob === 'undefined') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

class AuthClient {
  private state: AuthState = { token: null, user: null };
  private listeners = new Set<Listener>();
  private logoutTimer: number | null = null;

  constructor() {
    // Only access localStorage in the browser
    if (typeof window !== 'undefined') {
      try {
        const t = localStorage.getItem(STORAGE_TOKEN);
        const u = localStorage.getItem(STORAGE_USER);
        this.state.token = t ?? null;
        this.state.user = u ? JSON.parse(u) : null;
        // schedule auto-logout only in browser
        this.scheduleAutoLogout(this.state.token);
        // debug - remove if noisy
        // console.debug('[auth-client] hydrated from storage', { token: !!t, user: !!u });
      } catch (e) {
        // ignore storage/parse errors on hydration
        // console.error('[auth-client] hydrate error', e);
        this.state = { token: null, user: null };
      }
    }
  }

  getToken() {
    return this.state.token ?? null;
  }

  getUser() {
    return this.state.user ?? null;
  }

  setAuth(token: string | null, user?: any | null) {
    this.state = { token, user: user ?? null };

    if (typeof window !== 'undefined') {
      try {
        if (token) {
          localStorage.setItem(STORAGE_TOKEN, token);
        } else {
          localStorage.removeItem(STORAGE_TOKEN);
        }
        if (user) {
          localStorage.setItem(STORAGE_USER, JSON.stringify(user));
        } else {
          localStorage.removeItem(STORAGE_USER);
        }
        // console.debug('[auth-client] setAuth persisted', { token: !!token, user: !!user });
      } catch (e) {
        // storage failure - ignore but keep in-memory state
        // console.error('[auth-client] setAuth storage error', e);
      }
    }

    // schedule auto-logout only when running in browser
    if (typeof window !== 'undefined') {
      this.scheduleAutoLogout(token);
    }
    this.emit();
  }

  clear() {
    this.state = { token: null, user: null };

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_TOKEN);
        localStorage.removeItem(STORAGE_USER);
        // console.debug('[auth-client] cleared storage');
      } catch (e) {
        // console.error('[auth-client] clear storage error', e);
      }
      if (this.logoutTimer) {
        window.clearTimeout(this.logoutTimer);
        this.logoutTimer = null;
      }
    }
    this.emit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Immediately notify — safe to call on server or client; listener should be a client hook and run on client.
    try {
      listener(this.state);
    } catch (e) {
      // ignore listener errors to avoid breaking subscribers
      // console.error('[auth-client] listener threw on subscribe', e);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    for (const l of Array.from(this.listeners)) {
      try {
        l(this.state);
      } catch (e) {
        // ignore listener errors
        // console.error('[auth-client] listener error', e);
      }
    }
  }

  private scheduleAutoLogout(token: string | null) {
    // Only run timers in browser
    if (typeof window === 'undefined') return;

    if (this.logoutTimer) {
      window.clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
    if (!token) return;

    const payload = safeParseJwt(token);
    if (!payload?.exp) return;

    const expiresAt = payload.exp * 1000;
    const now = Date.now();
    const ms = expiresAt - now;

    if (ms <= 0) {
      // already expired -> clear immediately
      this.clear();
      try {
        window.location.href = '/';
      } catch {}
      return;
    }

    // schedule a timer a little after expiry (add small buffer)
    const buffer = 1000; // 1s buffer
    this.logoutTimer = window.setTimeout(() => {
      this.clear();
      try {
        window.location.href = '/';
      } catch {}
    }, ms + buffer);
  }
}

export const authClient = new AuthClient();
export default authClient;