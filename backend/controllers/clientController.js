import Client from "../models/Client.js";
import Project from "../models/Project.js";
import { isValidId, validateClient } from "../utils/validation.js";

const NOT_FOUND = { message: "Client not found." };

// GET /api/clients
export async function getClients(req, res) {
  res.json(await Client.find().sort({ name: 1 }));
}

// POST /api/clients
export async function createClient(req, res) {
  const { errors, data } = validateClient(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }
  res.status(201).json(await Client.create(data));
}

// PUT /api/clients/:id
export async function updateClient(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json(NOT_FOUND);
  const { errors, data } = validateClient(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }
  const client = await Client.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!client) return res.status(404).json(NOT_FOUND);
  res.json(client);
}

// DELETE /api/clients/:id
export async function deleteClient(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json(NOT_FOUND);
  const client = await Client.findByIdAndDelete(req.params.id);
  if (!client) return res.status(404).json(NOT_FOUND);
  // Projects keep existing, they just lose the link to this client.
  await Project.updateMany({ client: req.params.id }, { client: null });
  res.status(204).end();
}
