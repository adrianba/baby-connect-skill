"use strict";

/*
 *  The handler.js module provides the HTTP end-point for
 *  the Alexa custom skill. It is responsible for registering
 *  the intents and defining slots and utterances. The skill
 *  is implemented by functions in skill.js.
 */

const alexa = require("alexa-app");
var bodyParser = require("body-parser");

let handler = config => {
  // Note that istanbul report doesn't correctly highlight this pattern
  // config = config || /* istanbul ignore next */ {};
  /* istanbul ignore if */
  if (!config) config = {};

  const bcSkill = require("./skill")({ logger: config.logger });

  let app = new alexa.app("babyconnect");

  // If configuring express server (not tested in unit tests)
  /* istanbul ignore if */
  if (config.express) {
    let loginEndpoint = "/babyconnect/login";
    let authEndpoint = "/babyconnect/auth";

    // Link express to Alexa app
    app.express({
      expressApp: config.express,

      // false for debugging - need true for production
      checkCert: !config.debug,
      debug: !!config.debug
    });

    // Configure login form
    config.express.get(loginEndpoint, (req, res) => {
      res.sendFile(__dirname + "/login.html");
    });
    // Hook up authentication token creator
    config.express.use(authEndpoint, bodyParser.urlencoded({ extended: false }));
    config.express.post(authEndpoint, bcSkill.createUserToken);
  }

  // We want to validate the authentication token on every request
  app.pre = bcSkill.authenticateUser;

  app.launch(bcSkill.launch);

  app.intent(
    "SleepStatus",
    {
      slots: { Child: "AMAZON.US_FIRST_NAME" },
      utterances: [
        "when did {-|Child} last sleep",
        "when did {he|she} last sleep",
        "when {-|Child} last slept",
        "how long has {-|Child} been asleep",
        "how long has {he|she} been asleep",
        "sleep status",
        "sleep status for {-|Child}"
      ]
    },
    bcSkill.sleepStatus
  );

  app.intent(
    "SleepTotal",
    {
      slots: { Child: "AMAZON.US_FIRST_NAME" },
      utterances: [
        "how much sleep has {-|Child} had",
        "how much sleep has {he|she} had",
        "total sleep",
        "sleep total",
        "total sleep for {-|Child}"
      ]
    },
    bcSkill.sleepTotal
  );

  app.intent(
    "BottleStatus",
    {
      slots: { Child: "AMAZON.US_FIRST_NAME" },
      utterances: [
        "when did {-|Child} last {eat|drink}",
        "when did {he|she} last {eat|drink}",
        "when {-|Child} last {ate|drank}",
        "bottle status",
        "bottle status for {-|Child}"
      ]
    },
    bcSkill.bottleStatus
  );

  app.intent(
    "BottleTotal",
    {
      slots: { Child: "AMAZON.US_FIRST_NAME" },
      utterances: [
        "how much has {-|Child} had to {eat|drink}",
        "total bottle",
        "bottle total",
        "total bottle for {-|Child}"
      ]
    },
    bcSkill.bottleTotal
  );

  app.intent(
    "DiaperStatus",
    {
      slots: { Child: "AMAZON.US_FIRST_NAME" },
      utterances: [
        "when was {-|Child} last changed",
        "how long since {-|Child} was changed",
        "when was {he|she} last changed",
        "how long since {he|she} was changed",
        "diaper status",
        "diaper status for {-|Child}"
      ]
    },
    bcSkill.diaperStatus
  );

  app.intent(
    "EndWithThanks",
    {
      utterances: ["thanks", "thank you", "cheers"]
    },
    bcSkill.thanks
  );

  app.intent("AMAZON.CancelIntent", bcSkill.cancel);
  app.intent("AMAZON.StopIntent", bcSkill.cancel);

  // Yes/No intents are used when confirming child name
  app.intent("AMAZON.YesIntent", bcSkill.yes);
  app.intent("AMAZON.NoIntent", bcSkill.no);

  // Child name intent is used when requesting child name
  app.intent(
    "ChildName",
    {
      slots: { Child: "AMAZON.US_FIRST_NAME" },
      utterances: ["{-|Child}"]
    },
    bcSkill.childName
  );

  return app;
};

module.exports = handler;
