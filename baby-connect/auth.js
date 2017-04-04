"use strict";

/*
 *  The auth.js module provides helper methods for authenticating
 *  to the Baby Connect service.
 */

const BabyConnect = require("baby-connect-api");
const tokenManager = require("./tokenmanager");

let auth = (function() {
  /**
   * Validate Baby Connect email/password is valid and return encrypted token
   * containing email, password, and timezone.
   *
   * @param {string} email Baby Connect user e-mail.
   * @param {string} password Baby Connect user password.
   * @param {string} tz Time-zone string for user's location.
   * @returns {string} Authentication token.
   */
  var generateToken = async (email, password, tz) => {
    let bc = BabyConnect(email, password);
    let result = await bc.login();
    return result ? tokenManager.encodeToken({ email, password, tz }) : undefined;
  };

  /**
   * Decrypt authentication token and validate email/password against
   * Baby Connect service.
   *
   * @param {string} token Authentication token.
   * @returns {{status:('ok'|'notlinked'|'loginfailed'),babyconnect:object,timezone:string}} Status object.
   */
  var authenticate = async token => {
    let tokenData = tokenManager.decodeToken(token);
    if (!tokenData || !tokenData.email || !tokenData.password || !tokenData.tz) {
      return { status: "notlinked" };
    } else {
      let bc = BabyConnect(tokenData.email, tokenData.password, tokenData.tz);
      let result = await bc.login();
      if (!result) {
        return { status: "loginfailed" };
      } else {
        return { status: "ok", babyconnect: bc, timezone: tokenData.tz };
      }
    }
  };

  return {
    generateToken,
    authenticate
  };
})();

module.exports = auth;
