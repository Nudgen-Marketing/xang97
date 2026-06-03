import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken, verifyAdminPassword, verifySessionToken } from "@/lib/auth";

test("verifyAdminPassword accepts only configured username and password", async () => {
  process.env.ADMIN_USERNAME = "admin";
  process.env.ADMIN_PASSWORD = "secret-a97";

  assert.equal(await verifyAdminPassword("admin", "secret-a97"), true);
  assert.equal(await verifyAdminPassword("admin", "wrong"), false);
  assert.equal(await verifyAdminPassword("other", "secret-a97"), false);
});

test("signed admin session token verifies and rejects tampering", () => {
  process.env.ADMIN_SESSION_SECRET = "12345678901234567890123456789012";

  const token = createSessionToken();
  const tampered = token.replace("admin", "user");

  assert.equal(verifySessionToken(token), true);
  assert.equal(verifySessionToken(tampered), false);
});
