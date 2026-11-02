#!/usr/bin/env node
// Fires repeated failed login attempts at a running Grade Tracker API and
// prints one row per attempt so the login rate limit can be observed.
//
// Usage: node scripts/security-evidence.mjs <base-url> [attempts]
// Example: node scripts/security-evidence.mjs http://localhost:3000
//
// Only the built-in fetch is used, so the script has no dependencies.

const baseUrl = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const attempts = Number(process.argv[3] ?? 12);
const credentials = {
  email: "rate-limit-evidence@example.com",
  password: "definitely-the-wrong-password",
};

function pad(value, width) {
  return String(value).padEnd(width);
}

console.log(`Target: ${baseUrl}/api/auth/login`);
console.log(`Sending ${attempts} login attempts with a wrong password.\n`);
console.log(`${pad("attempt", 8)}${pad("status", 8)}${pad("RateLimit-Remaining", 21)}body`);

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const body = (await response.text()).trim();
  const remaining = response.headers.get("ratelimit-remaining") ?? "(none)";

  console.log(`${pad(attempt, 8)}${pad(response.status, 8)}${pad(remaining, 21)}${body}`);
}
