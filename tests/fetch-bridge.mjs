// Test-only preload. Forward the fake Neon endpoint to the local PostgreSQL bridge.
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  if (String(input).includes("api.neon.tech"))
    return originalFetch("http://127.0.0.1:5544/sql", init);
  return originalFetch(input, init);
};
