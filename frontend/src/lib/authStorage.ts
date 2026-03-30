const TOKEN_KEY = 'token';

function hasSessionStorage() {
  try {
    return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function getAuthToken(): string | null {
  if (hasSessionStorage()) {
    return window.sessionStorage.getItem(TOKEN_KEY);
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (hasSessionStorage()) {
    window.sessionStorage.setItem(TOKEN_KEY, token);
    // Evite tout ancien token partage entre onglets/navigateurs restants.
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (hasSessionStorage()) {
    window.sessionStorage.removeItem(TOKEN_KEY);
  }
  localStorage.removeItem(TOKEN_KEY);
}
