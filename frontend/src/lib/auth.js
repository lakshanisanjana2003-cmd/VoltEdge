
const TOKEN_KEY = "voltedge_token";

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
