// Automated API tests. They need a running MongoDB and use a separate database
// ("edoms_test") that is emptied at the start. Run with:  npm test
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import app from "../app.js";

process.env.JWT_SECRET = "test-secret-for-automated-tests";
const TEST_URI = process.env.MONGODB_URI_TEST ?? "mongodb://127.0.0.1:27017/edoms_test";

let server;
let baseUrl;
let token;

// Small helper: call the API and return { status, body }.
async function api(method, path, body, useToken = true) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(useToken && token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

const validProject = {
  project_code: "T-001", name: "Test Office Block", building_type: "Office", status: "Planned",
  start_date: "2026-01-01", expected_completion_date: "2026-06-01",
};

before(async () => {
  await mongoose.connect(TEST_URI);
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((model) => model.init())); // build unique indexes
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("authentication", () => {
  it("rejects data requests without a token", async () => {
    assert.equal((await api("GET", "/projects", undefined, false)).status, 401);
  });
  it("rejects a short password", async () => {
    const res = await api("POST", "/auth/register", { full_name: "Test Officer", officer_id: "EDO-001", password: "123" }, false);
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.password);
  });
  it("registers, assigns staff number U01 and never returns the password hash", async () => {
    const res = await api("POST", "/auth/register", { full_name: "Test Officer", officer_id: "edo-001", password: "secret1" }, false);
    assert.equal(res.status, 201);
    assert.equal(res.body.user.officer_id, "EDO-001");
    assert.equal(res.body.user.staff_code, "U01");
    assert.equal(res.body.user.password_hash, undefined);
    token = res.body.token;
  });
  it("refuses a duplicate Officer ID", async () => {
    const res = await api("POST", "/auth/register", { full_name: "Other", officer_id: "EDO-001", password: "secret1" }, false);
    assert.equal(res.status, 400);
  });
  it("logs in with the staff number and rejects a wrong password", async () => {
    const ok = await api("POST", "/auth/login", { officer_id: "u01", password: "secret1" }, false);
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);
    const bad = await api("POST", "/auth/login", { officer_id: "EDO-001", password: "wrong-password" }, false);
    assert.equal(bad.status, 401);
  });
  it("returns the signed-in staff profile", async () => {
    const res = await api("GET", "/auth/me");
    assert.equal(res.status, 200);
    assert.equal(res.body.full_name, "Test Officer");
  });
  it("rejects a forged token", async () => {
    const res = await fetch(`${baseUrl}/api/projects`, { headers: { Authorization: "Bearer not.a.token" } });
    assert.equal(res.status, 401);
  });
});

describe("project CRUD and validation", () => {
  let projectId;
  let clientId;
  let engineerId;

  it("creates a client and a professional to link to", async () => {
    const client = await api("POST", "/clients", { name: "Test Ministry", email: "a@b.lk", phone: "0112345678" });
    const pro = await api("POST", "/professionals", { name: "Eng. Test", role: "Electrical Design Engineer" });
    assert.equal(client.status, 201);
    assert.equal(pro.status, 201);
    clientId = client.body._id;
    engineerId = pro.body._id;
  });

  it("CREATE: saves a valid project and returns linked client and engineer", async () => {
    const res = await api("POST", "/projects", { ...validProject, client: clientId, design_engineer: engineerId });
    assert.equal(res.status, 201);
    assert.equal(res.body.project_code, "T-001");
        assert.equal(res.body.client.name, "Test Ministry");
    assert.equal(res.body.design_engineer.name, "Eng. Test");
    assert.equal(res.body.priority, "Not recorded");
    assert.ok(res.body._id && res.body.created_at);
    assert.equal(res.body.start_date.slice(0, 10), "2026-01-01");
    projectId = res.body._id;
  });

  it("VALIDATION: reports every bad field at once", async () => {
    const res = await api("POST", "/projects", {
      project_code: "x", name: "ab", building_type: "Spaceship", status: "Completed",
      start_date: "2026-05-01", expected_completion_date: "2026-01-01",
    });
    assert.equal(res.status, 400);
    for (const field of ["project_code", "name", "building_type", "expected_completion_date", "actual_completion_date"]) {
      assert.ok(res.body.errors[field], `expected an error for ${field}`);
    }
  });

  it("VALIDATION: rejects impossible dates, bad ids and unknown linked records", async () => {
    const badDate = await api("POST", "/projects", { ...validProject, project_code: "T-002", start_date: "2026-13-45" });
    assert.ok(badDate.body.errors.start_date);
    const badId = await api("POST", "/projects", { ...validProject, project_code: "T-002", client: "nope" });
    assert.ok(badId.body.errors.client);
    const missing = await api("POST", "/projects", { ...validProject, project_code: "T-002", client: "64b7f0f0f0f0f0f0f0f0f0f0" });
    assert.ok(missing.body.errors.client);
  });

  it("VALIDATION: rejects a duplicate project ID (case-insensitive)", async () => {
    const res = await api("POST", "/projects", { ...validProject, project_code: "t-001" });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.project_code);
  });

  it("READ: lists projects and fetches one by id", async () => {
    const list = await api("GET", "/projects");
    assert.equal(list.status, 200);
    assert.equal(list.body.length, 1);
    const one = await api("GET", "/projects/" + projectId);
    assert.equal(one.status, 200);
    assert.equal(one.body.name, "Test Office Block");
  });

  it("READ: unknown or malformed ids give 404", async () => {
    assert.equal((await api("GET", "/projects/64b7f0f0f0f0f0f0f0f0f0f0")).status, 404);
    assert.equal((await api("GET", "/projects/not-an-id")).status, 404);
  });

  it("SEARCH / FILTER / SORT: works on code, name, status and building type", async () => {
    await api("POST", "/projects", { ...validProject, project_code: "T-003", name: "Hospital Annex", building_type: "Hospital", status: "Ongoing", start_date: "2026-03-01", expected_completion_date: "2026-09-01" });
    assert.equal((await api("GET", "/projects?q=annex")).body.length, 1);
    assert.equal((await api("GET", "/projects?q=t-00")).body.length, 2);
    assert.equal((await api("GET", "/projects?status=Ongoing")).body[0].project_code, "T-003");
    assert.equal((await api("GET", "/projects?building_type=Office")).body.length, 1);
    assert.equal((await api("GET", "/projects?start_from=2026-02-01")).body.length, 1);
    assert.equal((await api("GET", "/projects?sort=name")).body[0].name, "Hospital Annex");
    assert.equal((await api("GET", "/projects?q=.*")).body.length, 0); // special characters are not treated as a pattern
  });

  it("UPDATE: changes fields, keeps the same id, keeps the creator", async () => {
    const before = await api("GET", "/projects/" + projectId);
    const res = await api("PUT", "/projects/" + projectId, { ...validProject, name: "Renamed Block", status: "Completed", actual_completion_date: "2026-05-20", client: clientId });
    assert.equal(res.status, 200);
    assert.equal(res.body._id, projectId);
    assert.equal(res.body.name, "Renamed Block");
    assert.equal(res.body.status, "Completed");
    assert.equal(res.body.created_by, before.body.created_by);
    assert.equal(res.body.design_engineer, null); // the form cleared the engineer
  });

  it("UPDATE: cannot take another project's ID", async () => {
    const res = await api("PUT", "/projects/" + projectId, { ...validProject, project_code: "T-003" });
    assert.equal(res.status, 400);
  });

  it("PERSISTENCE: data is still there after the database connection is closed and reopened", async () => {
    await mongoose.disconnect();
    await mongoose.connect(TEST_URI);
    const res = await api("GET", "/projects/" + projectId);
    assert.equal(res.body.name, "Renamed Block");
  });

  it("RELATIONSHIPS: deleting a client or professional unlinks it from projects", async () => {
    assert.equal((await api("DELETE", "/clients/" + clientId)).status, 204);
    const project = await api("GET", "/projects/" + projectId);
    assert.equal(project.body.client, null); // the link was removed, the project is still there
  });

  it("DELETE: removes the project, and a second delete gives 404", async () => {
    assert.equal((await api("DELETE", "/projects/" + projectId)).status, 204);
    assert.equal((await api("GET", "/projects/" + projectId)).status, 404);
    assert.equal((await api("DELETE", "/projects/" + projectId)).status, 404);
  });
});

describe("clients and professionals", () => {
  it("validates email, phone and role", async () => {
    const client = await api("POST", "/clients", { name: "X", email: "bad", phone: "abc" });
    assert.equal(client.status, 400);
    assert.ok(client.body.errors.name && client.body.errors.email && client.body.errors.phone);
    const pro = await api("POST", "/professionals", { name: "Someone", role: "Wizard" });
    assert.ok(pro.body.errors.role);
  });
  it("supports update and delete", async () => {
    const created = await api("POST", "/clients", { name: "Ministry One" });
    const updated = await api("PUT", "/clients/" + created.body._id, { name: "Ministry Uno", company: "MoE" });
    assert.equal(updated.body.name, "Ministry Uno");
    assert.equal((await api("DELETE", "/clients/" + created.body._id)).status, 204);
    assert.equal((await api("PUT", "/clients/" + created.body._id, { name: "Gone" })).status, 404);
  });
});

describe("error handling", () => {
  it("returns JSON for malformed bodies and unknown routes", async () => {
    const res = await fetch(`${baseUrl}/api/projects`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: "{bad json" });
    assert.equal(res.status, 400);
    assert.ok((await res.json()).message);
    assert.equal((await api("GET", "/nothing-here")).status, 404);
  });
});
