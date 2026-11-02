// Module customization hook used by security-evidence-server.mjs.
// Any import of the server's database/prisma module is redirected to
// stub-prisma.mjs so the app can start without PostgreSQL.

const stubUrl = new URL("./stub-prisma.mjs", import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (/\/database\/prisma(\.js|\.ts)?$/.test(specifier)) {
    return { url: stubUrl, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}
