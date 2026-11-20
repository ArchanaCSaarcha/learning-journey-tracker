import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import app from "../app.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("home route confirms that the API is running", async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /API is running/);
});

test("notes API requires a login token", async () => {
  const response = await fetch(`${baseUrl}/api/notes`);
  assert.equal(response.status, 401);
  assert.match((await response.json()).message, /Authentication required/);
});

test("protected routes reject an invalid login token", async () => {
  const response = await fetch(`${baseUrl}/api/notes`, {
    headers: { Authorization: "Bearer not-a-real-token" },
  });
  assert.equal(response.status, 401);
  assert.match((await response.json()).message, /Invalid or expired token/);
});
