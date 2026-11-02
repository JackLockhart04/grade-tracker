#!/usr/bin/env node
// Starts the Express app in-process WITHOUT a database so the security
// controls can be exercised on a machine that has no PostgreSQL. The Prisma
// client module is replaced with a stub whose user lookups always return
// "no such user", so every login attempt fails with 401 exactly as it would
// for an attacker guessing credentials.
//
// Usage: node scripts/security-evidence-server.mjs [port]
// Run it from a repository checkout; it loads ./server/src/app.ts from the
// current working directory. Stop it with Ctrl+C.

import { createRequire, register } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

process.env.NODE_ENV ??= "test";

// Resolve tsx from the checkout being run so TypeScript sources load directly.
const require = createRequire(pathToFileURL(path.resolve("package.json")));
const tsx = await import(pathToFileURL(require.resolve("tsx/esm/api")).href);
tsx.register();
register(new URL("./stub-prisma-hooks.mjs", import.meta.url));

const port = Number(process.argv[2] ?? 3100);
const appModule = await import(pathToFileURL(path.resolve("server/src/app.ts")).href);

appModule.app.listen(port, "127.0.0.1", () => {
  console.log(
    `evidence server listening on http://127.0.0.1:${port} (prisma stubbed, NODE_ENV=${process.env.NODE_ENV})`,
  );
});
