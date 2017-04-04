"use strict";

const assert = require("assert");
const mockBC = require("./mock-babyconnect-service");
const bcSkill = require("./bc-client");

describe("Testing Baby Connect skill", () => {
  afterEach(() => {
    mockBC.cleanUp();
  });

  it("test launch intent", async () => {
    mockBC.successfulLogin();

    // LaunchIntent
    let result = await bcSkill.intentRequest();

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Welcome to Baby Connect. How can I help you?</speak>"
    );
    assert.strictEqual(result.response.card, undefined);
    assert.strictEqual(result.response.shouldEndSession, false);
  });

  it("test sleep status with named child", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();
    mockBC.statusList({
      sleepElapsed: 50
    });

    let result = await bcSkill.intentRequest({
      name: "SleepStatus",
      slots: { Child: "George" }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>George is currently sleeping. He has been asleep for 50 minutes.</speak>"
    );
    assert.strictEqual(result.response.card.title, "Sleep");
    assert.strictEqual(
      result.response.card.content,
      "George is currently sleeping. He has been asleep for 50 minutes."
    );
    assert.strictEqual(result.response.shouldEndSession, false);
    assert.strictEqual(result.sessionAttributes.lastIntent, "SleepStatus");
    assert.strictEqual(result.sessionAttributes.state, undefined);
    assert.strictEqual(result.sessionAttributes.lastChild, "George");
    assert.strictEqual(result.sessionAttributes.lastChildId, 2222222222222222);
  });

  it("test sleep status with named child who is awake", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();
    mockBC.statusList({
      sleepElapsed: 55,
      isSleeping: false
    });

    let result = await bcSkill.intentRequest({
      name: "SleepStatus",
      slots: { Child: "George" }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>George was last asleep 55 minutes ago.</speak>"
    );
    assert.strictEqual(result.response.card.title, "Sleep");
    assert.strictEqual(result.response.card.content, "George was last asleep 55 minutes ago.");
    assert.strictEqual(result.response.shouldEndSession, false);
  });

  it("test sleep status with no name", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();
    mockBC.statusList({
      sleepElapsed: 50
    });

    let result = await bcSkill.intentRequest({
      name: "SleepStatus"
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>George is currently sleeping. He has been asleep for 50 minutes.</speak>"
    );
    assert.strictEqual(result.response.card.title, "Sleep");
    assert.strictEqual(
      result.response.card.content,
      "George is currently sleeping. He has been asleep for 50 minutes."
    );
    assert.strictEqual(result.response.shouldEndSession, false);
  });

  it("test sleep total", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();
    mockBC.statusList({
      sleepTotal: 30
    });

    let result = await bcSkill.intentRequest({
      name: "SleepTotal",
      slots: { Child: "George" }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>George has had 30 minutes of sleep today.</speak>"
    );
    assert.strictEqual(result.response.card.title, "Sleep");
    assert.strictEqual(result.response.card.content, "George has had 30 minutes of sleep today.");
    assert.strictEqual(result.response.shouldEndSession, false);
  });

  it("test bottle status", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();
    mockBC.statusList({
      bottleElapsed: 45
    });

    let result = await bcSkill.intentRequest({
      name: "BottleStatus",
      slots: { Child: "George" }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>George last ate 45 minutes ago.</speak>"
    );
    assert.strictEqual(result.response.card.title, "Sleep");
    assert.strictEqual(result.response.card.content, "George last ate 45 minutes ago.");
    assert.strictEqual(result.response.shouldEndSession, false);
  });

  it("test bottle total", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();
    mockBC.statusList({
      bottleTotal: 9.5
    });

    let result = await bcSkill.intentRequest({
      name: "BottleTotal",
      slots: { Child: "George" }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>George has had 9.5 ounces to drink today.</speak>"
    );
    assert.strictEqual(result.response.card.title, "Sleep");
    assert.strictEqual(result.response.card.content, "George has had 9.5 ounces to drink today.");
    assert.strictEqual(result.response.shouldEndSession, false);
  });

  it("test diaper status", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();
    mockBC.statusList({
      diaperElapsed: 25
    });

    let result = await bcSkill.intentRequest({
      name: "DiaperStatus",
      slots: { Child: "George" }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>George was last changed 25 minutes ago.</speak>"
    );
    assert.strictEqual(result.response.card.title, "Sleep");
    assert.strictEqual(result.response.card.content, "George was last changed 25 minutes ago.");
    assert.strictEqual(result.response.shouldEndSession, false);
  });

  it("test thank you with session", async () => {
    mockBC.successfulLogin();
    let result = await bcSkill.intentRequest({
      name: "EndWithThanks",
      sessionAttributes: {}
    });
    assert.strictEqual(result.response.shouldEndSession, true);
    assert.strictEqual(result.response.outputSpeech.ssml, "<speak>You're welcome.</speak>");
  });

  it("test thank you without session", async () => {
    mockBC.successfulLogin();
    let result = await bcSkill.intentRequest({
      name: "EndWithThanks"
    });
    assert.strictEqual(result.response.shouldEndSession, true);
    assert.strictEqual(result.response.outputSpeech, undefined);
  });

  it("test cancel with session", async () => {
    mockBC.successfulLogin();
    let result = await bcSkill.intentRequest({
      name: "AMAZON.CancelIntent",
      sessionAttributes: {}
    });
    assert.strictEqual(result.response.shouldEndSession, true);
    assert.strictEqual(result.response.outputSpeech.ssml, "<speak>Okay.</speak>");
  });

  it("test cancel without session", async () => {
    mockBC.successfulLogin();
    let result = await bcSkill.intentRequest({
      name: "AMAZON.CancelIntent"
    });
    assert.strictEqual(result.response.shouldEndSession, true);
    assert.strictEqual(result.response.outputSpeech, undefined);
  });

  it("test stop with session", async () => {
    mockBC.successfulLogin();
    let result = await bcSkill.intentRequest({
      name: "AMAZON.StopIntent",
      sessionAttributes: {}
    });
    assert.strictEqual(result.response.shouldEndSession, true);
    assert.strictEqual(result.response.outputSpeech.ssml, "<speak>Okay.</speak>");
  });

  it("test failed login", async () => {
    mockBC.failedLogin();
    let result = await bcSkill.intentRequest({
      name: "AMAZON.StopIntent"
    });
    assert.strictEqual(result.response.shouldEndSession, true);
    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Your Baby Connect account information is incorrect. Please use the Alexa App to re-link the account.</speak>"
    );
    assert.strictEqual(result.response.card.type, "LinkAccount");
  });

  it("test missing auth token", async () => {
    mockBC.failedLogin();
    let result = await bcSkill.intentRequest({
      name: "AMAZON.StopIntent",
      missingAuthToken: true
    });
    assert.strictEqual(result.response.shouldEndSession, true);
    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Your Baby Connect account is not linked. Please use the Alexa App to link the account.</speak>"
    );
    assert.strictEqual(result.response.card.type, "LinkAccount");
  });

  it("test sleep status with invalid child name", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();
    mockBC.statusList();

    let result = await bcSkill.intentRequest({
      name: "SleepStatus",
      slots: { Child: "Ringo" }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Sorry, I thought you said Ringo but that name isn't available. Did you mean George?</speak>"
    );
    assert.strictEqual(result.response.shouldEndSession, false);
    assert.strictEqual(result.sessionAttributes.lastIntent, "SleepStatus");
    assert.strictEqual(result.sessionAttributes.state, "confirmchild");
    assert.strictEqual(result.sessionAttributes.lastChild, "George");
    assert.strictEqual(result.sessionAttributes.lastChildId, 2222222222222222);
  });

  it("test confirm child with yes", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();
    mockBC.statusList({
      sleepElapsed: 12
    });

    let result = await bcSkill.intentRequest({
      name: "AMAZON.YesIntent",
      sessionAttributes: {
        lastIntent: "SleepStatus",
        state: "confirmchild",
        lastChild: "George",
        lastChildId: 2222222222222222
      }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>George is currently sleeping. He has been asleep for 12 minutes.</speak>"
    );
    assert.strictEqual(result.response.card.title, "Sleep");
    assert.strictEqual(
      result.response.card.content,
      "George is currently sleeping. He has been asleep for 12 minutes."
    );
    assert.strictEqual(result.response.shouldEndSession, false);
    assert.strictEqual(result.sessionAttributes.lastIntent, "SleepStatus");
    assert.strictEqual(result.sessionAttributes.state, undefined);
    assert.strictEqual(result.sessionAttributes.lastChild, "George");
    assert.strictEqual(result.sessionAttributes.lastChildId, 2222222222222222);
  });

  it("test yes intent without session", async () => {
    mockBC.successfulLogin();
    let result = await bcSkill.intentRequest({
      name: "AMAZON.YesIntent"
    });
    assert.strictEqual(result.response.shouldEndSession, true);
    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Sorry. I didn't understand your request.</speak>"
    );
  });

  it("test yes intent with invalid state", async () => {
    mockBC.successfulLogin();
    let result = await bcSkill.intentRequest({
      name: "AMAZON.YesIntent",
      sessionAttributes: { state: "choosechild" }
    });
    assert.strictEqual(result.response.shouldEndSession, true);
    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Sorry. I didn't understand your request.</speak>"
    );
  });

  it("test confirm child with no", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();
    mockBC.statusList();

    let result = await bcSkill.intentRequest({
      name: "AMAZON.NoIntent",
      sessionAttributes: {
        lastIntent: "SleepStatus",
        state: "confirmchild",
        lastChild: "George",
        lastChildId: 2222222222222222
      }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Okay. Which child did you mean?</speak>"
    );
    assert.strictEqual(result.response.shouldEndSession, false);
    assert.strictEqual(result.sessionAttributes.lastIntent, "SleepStatus");
    assert.strictEqual(result.sessionAttributes.state, "choosechild");
    assert.strictEqual(result.sessionAttributes.lastChild, undefined);
    assert.strictEqual(result.sessionAttributes.lastChildId, undefined);
  });

  it("test choose child with missing name", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();
    mockBC.statusList();

    let result = await bcSkill.intentRequest({
      name: "ChildName",
      slots: { Child: "John" },
      sessionAttributes: { lastIntent: "SleepStatus", state: "choosechild" }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Sorry. I didn't catch the child's name. Which child did you mean?</speak>"
    );
    assert.strictEqual(result.response.shouldEndSession, false);
    assert.strictEqual(result.sessionAttributes.lastIntent, "SleepStatus");
    assert.strictEqual(result.sessionAttributes.state, "choosechild");
    assert.strictEqual(result.sessionAttributes.lastChild, undefined);
    assert.strictEqual(result.sessionAttributes.lastChildId, undefined);
  });

  it("test choose child with valid name", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();
    mockBC.statusList({
      sleepTotal: 22
    });

    let result = await bcSkill.intentRequest({
      name: "ChildName",
      slots: { Child: "George" },
      sessionAttributes: { lastIntent: "SleepTotal", state: "choosechild" }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>George has had 22 minutes of sleep today.</speak>"
    );
    assert.strictEqual(result.response.card.title, "Sleep");
    assert.strictEqual(result.response.card.content, "George has had 22 minutes of sleep today.");
    assert.strictEqual(result.response.shouldEndSession, false);
    assert.strictEqual(result.sessionAttributes.lastIntent, "SleepTotal");
    assert.strictEqual(result.sessionAttributes.state, undefined);
    assert.strictEqual(result.sessionAttributes.lastChild, "George");
    assert.strictEqual(result.sessionAttributes.lastChildId, 2222222222222222);
  });

  it("test choose child with valid name but invalid last intent", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();

    let result = await bcSkill.intentRequest({
      name: "ChildName",
      slots: { Child: "George" },
      sessionAttributes: { lastIntent: "unknown", state: "choosechild" }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Sorry. I couldn't remember what you asked for.</speak>"
    );
    assert.strictEqual(result.response.card, undefined);
    assert.strictEqual(result.response.shouldEndSession, true);
  });

  it("test choose child without session", async () => {
    mockBC.successfulLogin();
    let result = await bcSkill.intentRequest({
      name: "ChildName",
      slots: { Child: "George" }
    });
    assert.strictEqual(result.response.shouldEndSession, true);
    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Sorry. I didn't understand your request.</speak>"
    );
  });

  it("test child name intent with incorrect state", async () => {
    mockBC.successfulLogin();
    let result = await bcSkill.intentRequest({
      name: "ChildName",
      slots: { Child: "George" },
      sessionAttributes: { state: "confirmchild" }
    });
    assert.strictEqual(result.response.shouldEndSession, true);
    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Sorry. I didn't understand your request.</speak>"
    );
  });

  it("test sleep status with no children", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo({ noChildren: true });

    let result = await bcSkill.intentRequest({
      name: "SleepStatus",
      slots: { Child: "George" }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Sorry. You don't have any children registered with Baby Connect.</speak>"
    );
    assert.strictEqual(result.response.card, undefined);
    assert.strictEqual(result.response.shouldEndSession, true);
  });

  it("test sleep status with no name but multiple children", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo({
      addChild: { name: "Paul", id: 4444444444444444 }
    });

    let result = await bcSkill.intentRequest({
      name: "SleepStatus"
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Sorry. I didn't catch the child's name. Which child did you mean?</speak>"
    );
    assert.strictEqual(result.response.card, undefined);
    assert.strictEqual(result.response.shouldEndSession, false);
    assert.strictEqual(result.sessionAttributes.lastIntent, "SleepStatus");
    assert.strictEqual(result.sessionAttributes.state, "choosechild");
    assert.strictEqual(result.sessionAttributes.lastChild, undefined);
    assert.strictEqual(result.sessionAttributes.lastChildId, undefined);
  });

  it("test sleep status while in confirm child state", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();

    let result = await bcSkill.intentRequest({
      name: "SleepStatus",
      sessionAttributes: {
        lastIntent: "SleepStatus",
        state: "confirmchild",
        lastChild: "George",
        lastChildId: 2222222222222222
      }
    });

    assert.strictEqual(result.response.outputSpeech.ssml, "<speak>Did you mean George?</speak>");
    assert.strictEqual(result.response.card, undefined);
    assert.strictEqual(result.response.shouldEndSession, false);
    assert.strictEqual(result.sessionAttributes.lastIntent, "SleepStatus");
    assert.strictEqual(result.sessionAttributes.state, "confirmchild");
    assert.strictEqual(result.sessionAttributes.lastChild, "George");
    assert.strictEqual(result.sessionAttributes.lastChildId, 2222222222222222);
  });

  it("test sleep status while in choose child state", async () => {
    mockBC.successfulLogin();
    mockBC.userInfo();

    let result = await bcSkill.intentRequest({
      name: "SleepStatus",
      sessionAttributes: {
        lastIntent: "SleepStatus",
        state: "choosechild"
      }
    });

    assert.strictEqual(
      result.response.outputSpeech.ssml,
      "<speak>Which child did you mean?</speak>"
    );
    assert.strictEqual(result.response.card, undefined);
    assert.strictEqual(result.response.shouldEndSession, false);
    assert.strictEqual(result.sessionAttributes.lastIntent, "SleepStatus");
    assert.strictEqual(result.sessionAttributes.state, "choosechild");
    assert.strictEqual(result.sessionAttributes.lastChild, undefined);
    assert.strictEqual(result.sessionAttributes.lastChildId, undefined);
  });
});
