import "dotenv/config";
import mongoose from "mongoose";
import Client from "./models/Client.js";
import Professional from "./models/Professional.js";
import Project from "./models/Project.js";

// Adds a few DEMO records so the screens are not empty.
//   npm run seed             adds data only when there are no projects yet
//   npm run seed -- --reset  deletes all clients, professionals and projects first
// Staff accounts are not touched. Register on the sign-in page.
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  if (process.argv.includes("--reset")) {
    await Project.deleteMany({});
    await Client.deleteMany({});
    await Professional.deleteMany({});
    console.log("Old clients, professionals and projects deleted.");
  } else if ((await Project.countDocuments()) > 0) {
    console.log("Projects already exist, nothing added. Use --reset to start again.");
    return;
  }

  const hospital = await Client.create({
    name: "Demo: City Hospital Board", company: "City Hospital", contact_person: "Dr. Perera",
    phone: "0112345678", email: "board@cityhospital.example", address: "Colombo 07",
  });
  const lakeview = await Client.create({
    name: "Demo: Lakeview Apartments", company: "Lakeview Developers", contact_person: "Mr. Silva",
    phone: "0779876543", email: "info@lakeview.example", address: "Kandy",
  });
  const engineer = await Professional.create({
    name: "Demo: Eng. Nimal Fernando", role: "Electrical Design Engineer", organization: "EDOMS Office",
  });
  const draughtsman = await Professional.create({
    name: "Demo: Kasun Jayasinghe", role: "Draughtsman", organization: "EDOMS Office",
  });

  await Project.create({
    project_code: "EP-2026-001", name: "Demo: Hospital Wing B Electrical Design", client: hospital._id,
    building_type: "Hospital", location: "Colombo 07", status: "Ongoing", priority: "High",
    start_date: new Date("2026-06-01"), expected_completion_date: new Date("2026-12-15"),
    design_engineer: engineer._id, draughtsman: draughtsman._id,
  });
  await Project.create({
    project_code: "EP-2026-002", name: "Demo: Lakeview Tower Services", client: lakeview._id,
    building_type: "Residential", location: "Kandy", status: "Planned", priority: "Medium",
    start_date: new Date("2026-03-10"), expected_completion_date: new Date("2026-10-30"),
    design_engineer: engineer._id,
  });
  console.log("Demo clients, professionals and projects added.");
}

seed()
  .catch((error) => console.error("Seeding failed:", error.message))
  .finally(() => mongoose.disconnect());
