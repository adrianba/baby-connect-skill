"use strict";

const crypto = require("crypto");

let tm = (function() {
  const CIPHER = "aes192";
  const TOKEN_SECRET = process.env.TOKEN_SECRET;
  const TOKEN_ENCODING = "base64";
  const STRING_ENCODING = "utf8";

  /**
   * Create encrypted token string from data object.
   * TOKEN_SECRET environment variable must be set. This is
   * used to encrypt/decrypt the data.
   *
   * @param {any} data Object to be encoded as JSON.
   * @returns {string} Encrypted token.
   */
  var encodeToken = data => {
    /* istanbul ignore if */
    if (!TOKEN_SECRET) throw "Missing TOKEN_SECRET";
    let salt = generateSaltObject();
    salt.data = data;
    let s = JSON.stringify(salt);
    let c = crypto.createCipher(CIPHER, TOKEN_SECRET);
    let d = c.update(s, STRING_ENCODING, TOKEN_ENCODING);
    d += c.final(TOKEN_ENCODING);
    return d;
  };

  /**
   * Decode encrypted token string from encodeToken.
   * TOKEN_SECRET environment variable must be set. This is
   * used to encrypt/decrypt the data.
   *
   * @param {string} token Encrypted token.
   * @returns {object} Origin data object.
   */
  var decodeToken = token => {
    /* istanbul ignore if */
    if (!TOKEN_SECRET) throw "Missing TOKEN_SECRET";
    if (!token) return undefined;
    try {
      let c = crypto.createDecipher(CIPHER, TOKEN_SECRET);
      let d = c.update(token, TOKEN_ENCODING, STRING_ENCODING);
      d += c.final(STRING_ENCODING);
      let salty = JSON.parse(d);
      return salty.data;
    } catch (ex) {
      /* istanbul ignore next */
      console.log(ex);
      /* istanbul ignore next */
      return undefined;
    }
  };

  // Create an object with a random property name with random value.
  var generateSaltObject = function() {
    let salt = {};
    let n = crypto.randomBytes(8).toString("utf8");
    let v = crypto.randomBytes(16).toString("utf8");
    salt[n] = v;
    return salt;
  };

  return {
    encodeToken,
    decodeToken
  };
})();

module.exports = tm;
