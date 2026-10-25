// After signing in, the API sends a token. We keep it in localStorage
// and send it with every request so the server knows who we are.
const TOKEN_KEY = "edoms_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isValidOfficerId(officerId) {
  return /^[A-Za-z0-9._-]{3,30}$/.test(officerId.trim());
}
