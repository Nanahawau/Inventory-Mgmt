/* Lightweight auth client (singleton) used by api & hooks.
   - stores token in localStorage under 'access_token'
   - exposes setToken/getToken/clearToken and a simple subscribe API
   - schedules an automatic logout when the token's exp time is reached (if the token is a JWT)
*/

type Subscriber = (token: string | null) => void;

const STORAGE_KEY = 'access_token';

function safeParseJwt(token: string | null): { exp?: number } | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch {
    return null;
  }
}

class AuthClient {
  private subscribers: Set<Subscriber> = new Set();
  private logoutTimer: number | null = null;

  getToken() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  setToken(token: string | null) {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEY, token);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
    this.notify(token);
    this.scheduleAutoLogout(token);
  }

  clearToken() {
    this.setToken(null);
  }

  subscribe(fn: Subscriber) {
    this.subscribers.add(fn);
    // call immediately with current token
    try {
      fn(this.getToken());
    } catch {}
    return () => this.subscribers.delete(fn);
  }

  private notify(token: string | null) {
    for (const s of Array.from(this.subscribers)) {
      try {
        s(token);
      } catch {}
    }
  }

  private scheduleAutoLogout(token: string | null) {
    // clear existing
    if (this.logoutTimer) {
      window.clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
    if (!token) return;

    const payload = safeParseJwt(token);
    if (!payload?.exp) return;

    // exp is in seconds since epoch
    const expiresAt = payload.exp * 1000;
    const now = Date.now();
    const ms = expiresAt - now;

    if (ms <= 0) {
      // already expired -> clear immediately
      this.clearToken();
      // redirect to login
      try {
        window.location.href = '/';
      } catch {}
      return;
    }

    // schedule a timer a little after expiry (add small buffer)
    const buffer = 1000; // 1s buffer
    this.logoutTimer = window.setTimeout(() => {
      this.clearToken();
      try {
        // redirect user to login page on expiry
        window.location.href = '/';
      } catch {}
    }, ms + buffer);
  }
}

export const authClient = new AuthClient();
export default authClient;