/*
  End-to-end smoke test for PulsePoint (backend).

  What it does:
  - Registers a test patient + doctor
  - Ensures patient wallet has funds
  - Creates a doctor schedule, generates slots
  - Books a slot (wallet payment)
  - Cancels appointment as doctor (refund)
  - Prints wallet balances + last transactions

  Run:
    node scripts/e2e_smoke.js

  Optional:
    API_BASE=http://localhost:5000/api node scripts/e2e_smoke.js
*/

// Load env vars if possible (dotenv is installed in server/ dependencies)
(() => {
  const path = require("path");
  const envPath = path.join(__dirname, "../server/.env");

  try {
    // If running from repo root without root node_modules, this may throw.
    require("dotenv").config({ path: envPath });
    return;
  } catch {
    // ignore
  }

  try {
    require("../server/node_modules/dotenv").config({ path: envPath });
  } catch {
    // OK: rely on process.env already being set
  }
})();

const PROVIDED_API_BASE = process.env.API_BASE;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function httpJson(apiBase, path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg = json?.error || json?.message || text || res.statusText;
    throw new Error(`${method} ${path} -> ${res.status}: ${msg}`);
  }

  return json;
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function main() {
  assert(
    typeof fetch === "function",
    "Node.js global fetch is not available. Use Node 18+.",
  );

  let apiBase = PROVIDED_API_BASE;
  let server;

  if (!apiBase) {
    const http = require("http");
    const app = require("../server/src/app");
    server = http.createServer(app);

    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    const addr = server.address();
    apiBase = `http://127.0.0.1:${addr.port}/api`;
  }

  const suffix = uniqueSuffix();
  const password = "Test1234!";

  // Reference data
  const [specList, hospitals, chambers] = await Promise.all([
    httpJson(apiBase, "/specializations"),
    httpJson(apiBase, "/hospitals"),
    httpJson(apiBase, "/chambers"),
  ]);

  assert(
    Array.isArray(specList) && specList.length > 0,
    "No specializations found",
  );
  assert(Array.isArray(hospitals), "Hospitals response was not an array");
  assert(Array.isArray(chambers), "Chambers response was not an array");

  const specId = specList[0].spec_id;

  const facility =
    hospitals.length > 0
      ? { type: "hospital", id: hospitals[0].hospital_id }
      : chambers.length > 0
        ? { type: "chamber", id: chambers[0].chamber_id }
        : null;

  assert(facility, "No hospitals or chambers found");

  // Register patient
  const patientEmail = `e2e.patient.${suffix}@example.com`;
  const patientReg = await httpJson(apiBase, "/auth/register", {
    method: "POST",
    body: {
      email: patientEmail,
      password,
      full_name: `E2E Patient ${suffix}`,
      phone: `017${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`,
      gender: "Other",
      address: "E2E Address",
      role: "patient",
      patient_code: `P-${suffix}`,
    },
  });

  const patientToken = patientReg.token;
  const patientId = patientReg.user?.user_id;
  assert(
    patientToken && patientId,
    "Patient register did not return token/user_id",
  );

  // Register doctor
  const doctorEmail = `e2e.doctor.${suffix}@example.com`;
  const doctorReg = await httpJson(apiBase, "/auth/register", {
    method: "POST",
    body: {
      email: doctorEmail,
      password,
      full_name: `E2E Doctor ${suffix}`,
      phone: `018${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`,
      gender: "Other",
      address: "E2E Clinic Address",
      role: "doctor",
      consultation_fee: 500,
      license_number: `LIC-${suffix}`,
      specialization_ids: [specId],
      experience_years: 3,
      qualification: "MBBS",
    },
  });

  const doctorToken = doctorReg.token;
  const doctorId = doctorReg.user?.user_id;
  assert(
    doctorToken && doctorId,
    "Doctor register did not return token/user_id",
  );

  // Ensure patient wallet has enough balance
  await httpJson(apiBase, "/payment/add-funds", {
    method: "POST",
    token: patientToken,
    body: { amount: 1500 },
  });

  const patientWallet1 = await httpJson(apiBase, "/payment/balance", {
    token: patientToken,
  });
  assert(
    Number(patientWallet1.balance) >= 500,
    `Patient wallet balance too low: ${patientWallet1.balance}`,
  );

  // Create schedule (doctor)
  const schedule = await httpJson(apiBase, "/schedules", {
    method: "POST",
    token: doctorToken,
    body: {
      facility_type: facility.type,
      facility_id: facility.id,
      day_of_week: "Monday",
      start_time: "10:00",
      end_time: "12:00",
      slot_duration_minutes: 30,
    },
  });

  assert(schedule?.schedule_id, "Schedule creation did not return schedule_id");

  // Generate slots for today..today (or next Monday if today isn't Monday)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const startDate = `${yyyy}-${mm}-${dd}`;

  await httpJson(apiBase, "/schedules/generate-slots", {
    method: "POST",
    token: doctorToken,
    body: {
      schedule_id: schedule.schedule_id,
      start_date: startDate,
      end_date: startDate,
    },
  });

  // Find available slots
  const slots = await httpJson(
    apiBase,
    `/schedules/slots/${doctorId}?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(startDate)}&facility_type=${encodeURIComponent(facility.type)}`,
  );

  assert(Array.isArray(slots), "Slots response was not an array");

  const freeSlot = slots.find(
    (s) => s.status === "free" && String(s.facility_id) === String(facility.id),
  );
  assert(freeSlot?.slot_id, "No free slot found to book");

  // Book slot (wallet payment)
  const appointment = await httpJson(apiBase, "/schedules/book-slot", {
    method: "POST",
    token: patientToken,
    body: {
      slot_id: freeSlot.slot_id,
      payment_method: "wallet",
      triage_notes: {
        symptoms: "E2E test symptoms",
        severity: "low",
        notes: "E2E test note",
      },
    },
  });

  assert(appointment?.appointment_id, "Booking did not return appointment_id");

  // Cancel as doctor (refund)
  await httpJson(
    apiBase,
    `/appointments/${appointment.appointment_id}/cancel`,
    {
      method: "PUT",
      token: doctorToken,
      body: { reason: "E2E doctor cancel" },
    },
  );

  // Verify wallet balances after refund
  const [patientWallet2, doctorWallet2] = await Promise.all([
    httpJson(apiBase, "/payment/balance", { token: patientToken }),
    httpJson(apiBase, "/payment/balance", { token: doctorToken }),
  ]);

  console.log("\nE2E smoke test complete");
  console.log("API_BASE:", apiBase);
  console.log("Patient:", {
    user_id: patientId,
    email: patientEmail,
    balance: patientWallet2.balance,
  });
  console.log("Doctor:", {
    user_id: doctorId,
    email: doctorEmail,
    balance: doctorWallet2.balance,
  });
  console.log("Appointment:", {
    appointment_id: appointment.appointment_id,
    slot_id: freeSlot.slot_id,
  });

  const patientTx = patientWallet2.transactions || [];
  const doctorTx = doctorWallet2.transactions || [];
  console.log("\nRecent patient transactions (top 5):");
  console.log(patientTx.slice(0, 5));
  console.log("\nRecent doctor transactions (top 5):");
  console.log(doctorTx.slice(0, 5));

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  console.error("E2E smoke test FAILED:", err.stack || err.message);
  process.exitCode = 1;
});
