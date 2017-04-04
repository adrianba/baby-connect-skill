"use strict";

const assert = require("assert");

process.env.TOKEN_SECRET = "secret";
const tm = require("../baby-connect/tokenmanager");
const AUTH_TOKEN = tm.encodeToken({
  email: "demo@example.com",
  password: "password",
  tz: "US/Pacific"
});

const mockBC = require("./mock-babyconnect-service");
const auth = require("../baby-connect/auth");

describe("Testing authentication module", () => {
  afterEach(() => {
    mockBC.cleanUp();
  });

  it("login with correct auth token", async () => {
    mockBC.successfulLogin();
    let result = await auth.authenticate(AUTH_TOKEN);
    assert(result.status == "ok");
    assert(typeof result.babyconnect === "object");
    assert(result.timezone == "US/Pacific");
  });

  it("login with invalid credentials in auth token", async () => {
    mockBC.failedLogin();
    let result = await auth.authenticate(AUTH_TOKEN);
    assert(result.status == "loginfailed");
    assert(result.babyconnect === undefined);
    assert(result.timezone == undefined);
  });

  it("generate and validate token", async () => {
    mockBC.successfulLogin();
    let token = await auth.generateToken("demo@example.com", "password", "US/Pacific");
    mockBC.successfulLogin();
    let result = await auth.authenticate(token);
    assert(result.status == "ok");
    assert(typeof result.babyconnect === "object");
    assert(result.timezone == "US/Pacific");
  });

  it("generate token with invalid credentials", async () => {
    mockBC.failedLogin();
    let token = await auth.generateToken("demo@example.com", "password", "US/Pacific");
    assert.strictEqual(token, undefined);
  });

  describe("Testing broken tokens", () => {
    it("login with missing auth token", async () => {
      mockBC.failedLogin();
      let result = await auth.authenticate(undefined);
      assert(result.status == "notlinked");
      assert(result.babyconnect === undefined);
      assert(result.timezone == undefined);
    });

    it("login with auth token missing email", async () => {
      mockBC.failedLogin();
      let token = tm.encodeToken({ password: "password", tz: "US/Pacific" });
      let result = await auth.authenticate(token);
      assert(result.status == "notlinked");
      assert(result.babyconnect === undefined);
      assert(result.timezone == undefined);
    });

    it("login with auth token missing password", async () => {
      mockBC.failedLogin();
      let token = tm.encodeToken({ email: "demo@example.com", tz: "US/Pacific" });
      let result = await auth.authenticate(token);
      assert(result.status == "notlinked");
      assert(result.babyconnect === undefined);
      assert(result.timezone == undefined);
    });

    it("login with auth token missing timezone", async () => {
      mockBC.failedLogin();
      let token = tm.encodeToken({ email: "demo@example.com", password: "password" });
      let result = await auth.authenticate(token);
      assert(result.status == "notlinked");
      assert(result.babyconnect === undefined);
      assert(result.timezone == undefined);
    });
  });
});
