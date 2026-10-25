// Every request to the Express API is here. The React app never talks to MongoDB directly.
import { clearToken, getToken, saveToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Sends one request and returns the JSON answer.
async function request(method, path, body) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;

  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Make sure the backend is running.");
  }

  if (response.status === 204) return null; // delete succeeded, no body
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Token missing or expired on a normal page: go back to the sign-in page.
    const isLoginRequest = path.startsWith("/auth/login") || path.startsWith("/auth/register");
    if (response.status === 401 && !isLoginRequest) {
      clearToken();
      window.location.assign("/auth");
    }
    const error = new Error(data?.message || "Request failed.");
    error.status = response.status;
    error.fieldErrors = data?.errors; // for example { name: "Project name is required." }
    throw error;
  }
  return data;
}

// ---------- Projects ----------
// filters can contain: q, status, building_type, start_from, sort
export function listProjects(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return request("GET", "/projects" + (query ? `?${query}` : ""));
}

export async function getProject(id) {
  try {
    return await request("GET", `/projects/${id}`);
  } catch (error) {
    if (error.status === 404) return null; // the page shows "Project not found"
    throw error;
  }
}

export function saveProject(values, id) {
  return id ? request("PUT", `/projects/${id}`, values) : request("POST", "/projects", values);
}

export function deleteProject(id) {
  return request("DELETE", `/projects/${id}`);
}

// ---------- Clients ----------
export const listClients = () => request("GET", "/clients");
export const saveClient = (values, id) =>
  id ? request("PUT", `/clients/${id}`, values) : request("POST", "/clients", values);
export const deleteClient = (id) => request("DELETE", `/clients/${id}`);

// ---------- Professionals ----------
export const listProfessionals = () => request("GET", "/professionals");
export const saveProfessional = (values, id) =>
  id ? request("PUT", `/professionals/${id}`, values) : request("POST", "/professionals", values);
export const deleteProfessional = (id) => request("DELETE", `/professionals/${id}`);

// ---------- Staff sign in ----------
// You can sign in with the Officer ID or the staff number (for example U01).
export async function signIn(officerId, password) {
  const result = await request("POST", "/auth/login", { officer_id: officerId, password });
  saveToken(result.token);
}

export async function registerStaff(fullName, officerId, password) {
  const result = await request("POST", "/auth/register", {
    full_name: fullName,
    officer_id: officerId,
    password,
  });
  saveToken(result.token);
}

export const getMyProfile = () => request("GET", "/auth/me");

export function signOut() {
  clearToken();
}
