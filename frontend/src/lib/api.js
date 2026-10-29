
import { clearToken, getToken, saveToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Sends 1 request return JSON answer.
async function request(method, path, body) {
  const headers = {};
  const isFormData = body instanceof FormData; // file upload must NOT sent JSON
  if (body && !isFormData) headers["Content-Type"] = "application/json";
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;

  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
       body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Make sure the backend is running.");
  }

  if (response.status === 204) return null; // delete succeeded, no body
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Token missing ,expired on normal page go sign-in page.
    const isLoginRequest = path.startsWith("/auth/login") || path.startsWith("/auth/register");
    if (response.status === 401 && !isLoginRequest) {
      clearToken();
      window.location.assign("/auth");
    }
    const error = new Error(data?.message || "Request failed.");
    error.status = response.status;
    error.fieldErrors = data?.errors; // for example { name:"Project name is required." }
    throw error;
  }
  return data;
}

// Projects 
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

// Clients
export const listClients = () => request("GET", "/clients");
export const saveClient = (values, id) =>
  id ? request("PUT", `/clients/${id}`, values) : request("POST", "/clients", values);
export const deleteClient = (id) => request("DELETE", `/clients/${id}`);

// Professionals 
export const listProfessionals = () => request("GET", "/professionals");
export const saveProfessional = (values, id) =>
  id ? request("PUT", `/professionals/${id}`, values) : request("POST", "/professionals", values);
export const deleteProfessional = (id) => request("DELETE", `/professionals/${id}`);

// Staff sign in 
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
  return result.user; // contains the staff ID that the server generated
}

export const getMyProfile = () => request("GET", "/auth/me");

export function signOut() {
  clearToken();
}

// Site visits 
export const listSiteVisits = () => request("GET", "/site-visits");
export const saveSiteVisit = (values, id) =>
  id ? request("PUT", `/site-visits/${id}`, values) : request("POST", "/site-visits", values);
export const deleteSiteVisit = (id) => request("DELETE", `/site-visits/${id}`);

//  Testing and certification 
export const listTestRecords = () => request("GET", "/test-records");
export const saveTestRecord = (values, id) =>
  id ? request("PUT", `/test-records/${id}`, values) : request("POST", "/test-records", values);
export const deleteTestRecord = (id) => request("DELETE", `/test-records/${id}`);

//  Drawings and documents 
export const listDrawings = () => request("GET", "/drawings");

export function saveDrawing(values, id) {
  let body = values;
  if (values.file instanceof File) {
    body = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (value !== null && value !== undefined) body.append(key, value);
    }
  }
  return id ? request("PUT", `/drawings/${id}`, body) : request("POST", "/drawings", body);
}
export const deleteDrawing = (id) => request("DELETE", `/drawings/${id}`);
export const uploadRevision = (drawingId, formData) => request("POST", `/drawings/${drawingId}/revisions`, formData);

// Downloads a file through the API. 
export async function downloadRevisionFile(drawingId, revision) {
  let response;
  try {
    response = await fetch(`${API_URL}/drawings/${drawingId}/revisions/${revision._id}/file`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  } catch {
    throw new Error("Cannot reach the server. Make sure the backend is running.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Download failed.");
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = revision.original_name;
  link.click();
  URL.revokeObjectURL(url);
}

// My professional profile 
export async function getMyProfessional() {
  try {
    return await request("GET", "/professionals/me");
  } catch (error) {
    if (error.status === 404) return null; // no profile yet
    throw error;
  }
}
export const saveMyProfessional = (values, exists) =>
  request(exists ? "PUT" : "POST", "/professionals/me", values);

//User accounts (administrators)
export const listUsers = () => request("GET", "/users");
export const changeUserRole = (id, role) => request("PUT", `/users/${id}/role`, { role });
