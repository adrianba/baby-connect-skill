"use strict";

let client = (function() {
  // Configure valid authentication token
  process.env.TOKEN_SECRET = "secret";
  const tm = require("../baby-connect/tokenmanager");
  const AUTH_TOKEN = tm.encodeToken({
    email: "demo@example.com",
    password: "password",
    tz: "US/Pacific"
  });

  // Create skill instance
  const BlackHoleStream = require("black-hole-stream");
  const skill = require("../baby-connect/handler")({
    debug: true,
    logger: new console.Console(new BlackHoleStream(), new BlackHoleStream())
  });

  function callSkill(request_json) {
    return new Promise((resolve, reject) => {
      skill.handler(request_json, null, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  var intentRequest = async request => {
    request = request || {};
    let request_json = {
      session: {
        sessionId: "SessionId.00000000-0000-0000-0000-000000000000",
        application: {
          applicationId: "amzn1.ask.skill.00000000-0000-0000-0000-000000000000"
        },
        user: {
          userId: "amzn1.ask.account.XXXXX",
          accessToken: AUTH_TOKEN
        },
        new: true
      },
      request: {
        type: "IntentRequest",
        requestId: "EdwRequestId.00000000-0000-0000-0000-000000000000",
        locale: "en-US",
        timestamp: new Date().toISOString()
      },
      version: "1.0"
    };

    if (request.sessionAttributes) {
      request_json.session.attributes = request.sessionAttributes;
      request_json.session.new = false;
    }
    if (request.name) {
      request_json.request.intent = { slots: {} };
      request_json.request.intent.name = request.name;
    } else {
      request_json.request.type = "LaunchRequest";
    }
    if (request.slots) {
      let slots = {};
      for (let slot in request.slots) {
        slots[slot] = {
          name: slot,
          value: request.slots[slot]
        };
      }
      request_json.request.intent.slots = slots;
    }
    if (request.missingAuthToken) {
      delete request_json.session.user.accessToken;
    }

    return await callSkill(request_json);
  };

  return {
    intentRequest
  };
})();

module.exports = client;
