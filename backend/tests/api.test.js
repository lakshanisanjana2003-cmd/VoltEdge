
import "dotenv/config"; 
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import app from "../app.js";
import fs from "node:fs";
import Counter from "../models/Counter.js";
import User from "../models/User.js";
import { UPLOAD_DIR } from "../middleware/uploadMiddleware.js";

process.env.JWT_SECRET = "test-secret-for-automated-tests";

const dbNameOf = (uri) => /^mongodb(?:\+srv)?:\/\/[^/?#]*\/([^/?#]*)/.exec(uri ?? "")?.[1] ?? "";
const REAL_DB_NAME = dbNameOf(process.env.MONGODB_URI); // only read to compare, never used to connect
const isSafeTestDb = (name) => /.+_test$/.test(name) && name !== REAL_DB_NAME;

const TEST_URI = process.env.MONGODB_URI_TEST;
if (!TEST_URI) throw new Error("MONGODB_URI_TEST is not set. Tests did not run.");
if (!isSafeTestDb(dbNameOf(TEST_URI))) {
  throw new Error("MONGODB_URI_TEST must use a database whose name ends with _test and is not your real database. Tests did not run.");
}

let server;
let baseUrl;
let token;

// call API and return
async function api(method, path, body, useToken = true) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(useToken && token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

const PDF_TEXT = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n";


async function sendForm(method, path, fields, file) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  if (file) form.append("file", new Blob([file.content], { type: file.type ?? "application/pdf" }), file.name);
  const response = await fetch(`${baseUrl}/api${path}`, { method, headers: { Authorization: `Bearer ${token}` }, body: form });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

const validProject = {
  project_code: "T-001", name: "Test Office Block", building_type: "Office", status: "Planned",
  start_date: "2026-01-01", expected_completion_date: "2026-06-01",
};

before(async () => {
  await mongoose.connect(TEST_URI);

  if (!isSafeTestDb(mongoose.connection.name)) {
    await mongoose.disconnect();
    throw new Error(`Refusing to delete database "${mongoose.connection.name}".`);
  }

  await mongoose.connection.dropDatabase();

  await Promise.all(
    Object.values(mongoose.models).map((model) => model.init())
  );

  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  if (mongoose.connection.readyState === 1) {
    const connectedDbName = mongoose.connection.name;

    if (!isSafeTestDb(connectedDbName)) {
      await mongoose.disconnect();
      throw new Error(
        `Refusing to delete database "${connectedDbName}".`
      );
    }

    await mongoose.connection.dropDatabase();
  }

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
        await User.updateOne({ officer_id: "EDO-001" }, { role: "admin" }); // the main test user is an administrator
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
    assert.equal(res.body.design_engineer, null); // form cleared engineer
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
    assert.equal(project.body.client, null); 
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
  
  it("saves a client ID in capitals and rejects duplicates", async () => {
    const first = await api("POST", "/clients", { name: "ID Client One", client_id: "cl-001" });
    assert.equal(first.status, 201);
    assert.equal(first.body.client_id, "CL-001");

    const duplicate = await api("POST", "/clients", { name: "ID Client Two", client_id: "CL-001" });
    assert.equal(duplicate.status, 400);
    assert.equal(duplicate.body.errors.client_id, "A client with this ID already exists.");

    const second = await api("POST", "/clients", { name: "ID Client Two", client_id: "CL-002" });
    const clash = await api("PUT", "/clients/" + second.body._id, { name: "ID Client Two", client_id: "cl-001" });
    assert.equal(clash.status, 400);

    // client may keep its ID when it is edit.
    const same = await api("PUT", "/clients/" + first.body._id, { name: "Renamed", client_id: "CL-001" });
    assert.equal(same.status, 200);
  });

  it("rejects a badly formatted client ID", async () => {
    const res = await api("POST", "/clients", { name: "Bad ID Client", client_id: "CL 1" });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.client_id);
  });

    it("saves a professional ID in capitals and rejects duplicates", async () => {
    const first = await api("POST", "/professionals", {
      name: "ID Pro One",
      role: "Draughtsman",
      professional_id: "pr-001",
      qualifications: "BSc Electrical Engineering",
    });

    assert.equal(first.status, 201);
    assert.equal(first.body.professional_id, "PR-001");
    assert.equal(first.body.qualifications, "BSc Electrical Engineering");

    const duplicate = await api("POST", "/professionals", {
      name: "ID Pro Two",
      role: "Draughtsman",
      professional_id: "PR-001",
    });

    assert.equal(duplicate.status, 400);
    assert.equal(
      duplicate.body.errors.professional_id,
      "A professional with this ID already exists."
    );

    const second = await api("POST", "/professionals", {
      name: "ID Pro Two",
      role: "Draughtsman",
      professional_id: "PR-002",
    });

    const clash = await api("PUT", "/professionals/" + second.body._id, {
      name: "ID Pro Two",
      role: "Draughtsman",
      professional_id: "pr-001",
    });

    assert.equal(clash.status, 400);

    const same = await api("PUT", "/professionals/" + first.body._id, {
      name: "Renamed Pro",
      role: "Draughtsman",
      professional_id: "PR-001",
    });

    assert.equal(same.status, 200);
  });

  it("rejects a badly formatted professional ID", async () => {
    const res = await api("POST", "/professionals", {
      name: "Bad ID Pro",
      role: "Draughtsman",
      professional_id: "PR 1",
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.errors.professional_id);
  });
});

describe("roles", () => {
  it("new accounts are staff: they can add clients but cannot delete them or list users", async () => {
    const reg = await api("POST", "/auth/register", { full_name: "Staff Person", officer_id: "STAFF-01", password: "secret1", role: "admin" }, false);
    assert.equal(reg.status, 201);
    assert.equal(reg.body.user.role, "staff"); // a role sent in form is ignored

    const adminToken = token;
    token = reg.body.token; 
    const client = await api("POST", "/clients", { client_id: "CL-R01", name: "Role Test Client" });
    assert.equal(client.status, 201);
    assert.equal((await api("DELETE", "/clients/" + client.body._id)).status, 403);
    assert.equal((await api("GET", "/users")).status, 403);

    token = adminToken; // back administrator
    assert.equal((await api("GET", "/users")).status, 200);
    assert.equal((await api("DELETE", "/clients/" + client.body._id)).status, 204);
  });

  it("a user can create only one own profile, linked to their account", async () => {
    const first = await api("POST", "/professionals/me", { professional_id: "PR-M01", name: "My Profile", role: "Draughtsman" });
    assert.equal(first.status, 201);
    const second = await api("POST", "/professionals/me", { professional_id: "PR-M02", name: "Second Profile", role: "Draughtsman" });
    assert.equal(second.status, 400);
    const updated = await api("PUT", "/professionals/me", { professional_id: "PR-M01", name: "My Profile Renamed", role: "Draughtsman" });
    assert.equal(updated.body.name, "My Profile Renamed");
    assert.equal((await api("GET", "/professionals/me")).body.professional_id, "PR-M01");
  });
});

describe("automatic staff IDs", () => {
  it("gives different staff IDs to people who register at the same time", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        api("POST", "/auth/register", { full_name: `Parallel ${i}`, officer_id: `PAR-${i}`, password: "secret1" }, false),
      ),
    );
    assert.ok(results.every((result) => result.status === 201));
    const codes = results.map((result) => result.body.user.staff_code);
    assert.equal(new Set(codes).size, 10); // all ten are different
    assert.ok(codes.every((code) => /^U\d{2,}$/.test(code)));
  });

  it("never creates two accounts with the same Officer ID, even at the same moment", async () => {
    const results = await Promise.all([
      api("POST", "/auth/register", { full_name: "Twin One", officer_id: "TWIN-01", password: "secret1" }, false),
      api("POST", "/auth/register", { full_name: "Twin Two", officer_id: "TWIN-01", password: "secret1" }, false),
    ]);
    assert.deepEqual(results.map((result) => result.status).sort(), [201, 400]);
    assert.equal(await User.countDocuments({ officer_id: "TWIN-01" }), 1);
  });

  it("continues after the highest existing staff ID and keeps old IDs unchanged", async () => {
    await Counter.deleteOne({ _id: "staff_code" }); // pretend the counter does not exist yet
    await User.create({ full_name: "Old Staff", officer_id: "OLD-01", staff_code: "U60", password_hash: "x" });
    const res = await api("POST", "/auth/register", { full_name: "New Staff", officer_id: "NEW-01", password: "secret1" }, false);
    assert.equal(res.status, 201);
    assert.equal(res.body.user.staff_code, "U61");
    assert.equal((await User.findOne({ officer_id: "OLD-01" })).staff_code, "U60");
  });

  it("shows the generated staff ID on the profile", async () => {
    const res = await api("GET", "/auth/me");
    assert.match(res.body.staff_code, /^U\d{2,}$/);
  });
});

describe("drawing PDF uploads", () => {
  let projectId;
  let drawing;
  const uploadedFileCount = () => fs.readdirSync(UPLOAD_DIR).length;

  async function download(drawingId, revisionId, useToken = true) {
    return fetch(`${baseUrl}/api/drawings/${drawingId}/revisions/${revisionId}/file`, {
      headers: useToken ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  it("saves a PDF sent with a new drawing as revision A and hides the server file name", async () => {
    projectId = (await api("POST", "/projects", { ...validProject, project_code: "DRW-P1" })).body._id;
    const res = await sendForm("POST", "/drawings",
      { project: projectId, drawing_number: "el-101", title: "Ground floor lighting" },
      { content: PDF_TEXT, name: "ground-floor.pdf" });
    assert.equal(res.status, 201);
    assert.equal(res.body.drawing_number, "EL-101");
    assert.equal(res.body.revisions.length, 1);
    assert.equal(res.body.revisions[0].revision, "A");
    assert.equal(res.body.revisions[0].original_name, "ground-floor.pdf");
    assert.equal(res.body.revisions[0].size, PDF_TEXT.length);
    assert.ok(res.body.revisions[0].uploaded_at);
    assert.equal(res.body.revisions[0].stored_name, undefined);
    drawing = res.body;
  });

  it("downloads the PDF for a signed-in user only", async () => {
    const ok = await download(drawing._id, drawing.revisions[0]._id);
    assert.equal(ok.status, 200);
    assert.match(ok.headers.get("content-type"), /application\/pdf/);
    assert.equal((await ok.text()).slice(0, 5), "%PDF-");
    assert.equal((await download(drawing._id, drawing.revisions[0]._id, false)).status, 401);
  });

  it("still creates a drawing without any file (JSON)", async () => {
    const res = await api("POST", "/drawings", { project: projectId, drawing_number: "EL-102", title: "Power layout" });
    assert.equal(res.status, 201);
    assert.equal(res.body.revisions.length, 0);
  });

  it("rejects wrong file types, fake PDFs and oversized files, and keeps nothing on disk", async () => {
    const filesBefore = uploadedFileCount();
    const drawingsBefore = (await api("GET", "/drawings")).body.length;
    const fields = { project: projectId, drawing_number: "EL-103", title: "Rejected drawing" };

    const txt = await sendForm("POST", "/drawings", fields, { content: "hello", name: "notes.txt", type: "text/plain" });
    assert.equal(txt.status, 400);
    assert.match(txt.body.message, /PDF/);

    const fake = await sendForm("POST", "/drawings", fields, { content: "this is not a pdf", name: "fake.pdf" });
    assert.equal(fake.status, 400);
    assert.equal(fake.body.errors.file, "The file is not a valid PDF.");

    const big = await sendForm("POST", "/drawings", fields, { content: "%PDF-" + "x".repeat(11 * 1024 * 1024), name: "big.pdf" });
    assert.equal(big.status, 400);
    assert.match(big.body.message, /too large/);

    await new Promise((resolve) => setTimeout(resolve, 300)); // rejected files are removed in the background
    assert.equal(uploadedFileCount(), filesBefore); // no rejected file was kept
    assert.equal((await api("GET", "/drawings")).body.length, drawingsBefore); // no drawing was created
  });

  it("adds revision B and keeps the file of revision A", async () => {
    const res = await sendForm("POST", `/drawings/${drawing._id}/revisions`,
      { revision: "b", revision_date: "2026-07-01", description: "Added sockets" },
      { content: PDF_TEXT + "% revision b\n", name: "ground-floor-rev-b.pdf" });
    assert.equal(res.status, 201);
    assert.deepEqual(res.body.revisions.map((r) => r.revision), ["A", "B"]);
    for (const revision of res.body.revisions) {
      assert.equal((await download(drawing._id, revision._id)).status, 200); // both files still open
    }
    const notPdf = await sendForm("POST", `/drawings/${drawing._id}/revisions`,
      { revision: "C", revision_date: "2026-07-02" }, { content: "plain text", name: "c.pdf" });
    assert.equal(notPdf.status, 400);
  });

  it("deleting a drawing removes its files", async () => {
    const filesBefore = uploadedFileCount();
    assert.equal((await api("DELETE", "/drawings/" + drawing._id)).status, 204);
    await new Promise((resolve) => setTimeout(resolve, 200)); // files are removed in the background
    assert.equal(uploadedFileCount(), filesBefore - 2);
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
