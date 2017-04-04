"use strict";

const assert = require("assert");
process.env.TOKEN_SECRET = "secret";
const tm = require("../baby-connect/tokenmanager");

describe("Testing TokenManager", () => {
  it("encode and decode token", () => {
    let data = { s: "string", n: 123 };
    let token = tm.encodeToken(data);
    let decoded = tm.decodeToken(token);
    assert.deepStrictEqual(data, decoded);
  });

  it("encode data twice and ensure tokens are different", () => {
    let data = { s: "string", n: 123 };
    let token1 = tm.encodeToken(data);
    let token2 = tm.encodeToken(data);
    assert.notEqual(token1, token2);
  });
});
