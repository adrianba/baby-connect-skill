"use strict";
/*
 *  The skill.js module is responsible for providing responses
 *  to the user. There may be multiple ways of interacting with
 *  Alexa to provide a particular response. The handler.js
 *  module will manage those different ways and end up calling
 *  the same method in the skill.js module to provide the response.
 */

const bcAuth = require("./auth");

let skill = config => {
  // Note that istanbul report doesn't correctly highlight this pattern
  // config = config || /* istanbul ignore next */ {};
  /* istanbul ignore if */
  if (!config) config = {};

  // var logger = config.logger || /* istanbul ignore next */ console;
  var logger = config.logger;
  /* istanbul ignore if */
  if (!logger) logger = console;

  /**
   * Create authentication token for login form and redirect client to Alexa
   * so that the token can be stored.
   *
   * @param {object} req Express request object.
   * @param {object} res Express response object.
   */
  /* istanbul ignore next : simple function and want to avoid mocking express */
  var createUserToken = (req, res) => {
    if (!req.body.state) {
      res.status(500).send({ error: "Missing state value" });
    } else if (!req.body.redirect_uri) {
      res.status(500).send({ error: "Missing redirect_uri value" });
    } else {
      bcAuth
        .generateToken(req.body.email, req.body.pwd, req.body.tz)
        .then(token => {
          let url = req.body.redirect_uri +
            "#state=" +
            encodeURIComponent(req.body.state) +
            "&token_type=Bearer&access_token=" +
            encodeURIComponent(token);
          logger.log("Redirecting to " + url);
          res.redirect(302, url);
        })
        .catch(ex => {
          logger.log(ex);
          res.status(500).send({ error: "Error generating token" });
        });
    }
  };

  /**
   * Alexa app pre function to validate the authentication token.
   * Adds `babyConnect` and `timeZone` properties to the Alexa request
   * object.
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   * @param {object} type Alexa app request type.
   */
  var authenticateUser = async (req, res, type) => {
    logger.log(
      "Type = " +
        req.data.request.type +
        " Name = '" +
        (req.data.request.intent ? req.data.request.intent.name : "") +
        "'"
    );
    logger.log("Authenticating token");
    let result = await bcAuth.authenticate(req.getSession().details.accessToken);
    if (result.status == "ok") {
      logger.log("Logged in");
      req.babyConnect = result.babyconnect;
      req.timeZone = result.timezone;
    } else {
      var msg;
      switch (result.status) {
        case "notlinked":
          msg = "Your Baby Connect account is not linked. Please use the Alexa App to link the account.";
          break;
        case "loginfailed":
          msg = "Your Baby Connect account information is incorrect. Please use the Alexa App to re-link the account.";
          break;
      }
      logger.log(msg);
      res.linkAccount().shouldEndSession(true).say(msg).send();
    }
  };

  /**
   * Alexa intent handler for the launch intent. This provides a welcome
   * message and starts a session.
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   */
  var launch = (req, res) => {
    logger.log("Launching!");
    res.say("Welcome to Baby Connect. How can I help you?");
    res.shouldEndSession(false);
  };

  /**
   * Alexa intent handler to end the session in response to built-in
   * Alexa intents for Cancel and Stop.
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   */
  var cancel = (req, res) => {
    if (!req.getSession().isNew()) {
      res.say("Okay.");
    }
    req.getSession().clear();
    res.shouldEndSession(true);
  };

  /**
   * Alexa intent handler to end the session in response to a "thank you".
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   */
  var thanks = (req, res) => {
    if (!req.getSession().isNew()) {
      res.say("You're welcome.");
    }
    req.getSession().clear();
    res.shouldEndSession(true);
  };

  /**
   * Alexa intent handler to indicate how long a child has been asleep
   * or the amount of time since they last slept.
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   */
  var sleepStatus = (req, res) => {
    return renderInfo(
      req,
      res,
      async (bc, kid) => {
        return await bc.getSleepStatus({ kid: kid.id });
      },
      (kid, result) =>
        result.isSleeping
          ? kid.name +
              " is currently sleeping. He has been asleep for " +
              result.elapsedRendered +
              "."
          : kid.name + " was last asleep " + result.elapsedRendered + " ago."
    );
  };

  /**
   * Alexa intent handler to indicate how long a child has slept
   * in total today.
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   */
  var sleepTotal = (req, res) => {
    return renderInfo(
      req,
      res,
      async (bc, kid) => {
        return await bc.getSleepStatus({ kid: kid.id });
      },
      (kid, result) => kid.name + " has had " + result.totalRendered + " of sleep today."
    );
  };

  /**
   * Alexa intent handler to indicate how long since a child last
   * had a bottle.
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   */
  var bottleStatus = (req, res) => {
    return renderInfo(
      req,
      res,
      async (bc, kid) => {
        return await bc.getBottleStatus({ kid: kid.id });
      },
      (kid, result) => kid.name + " last ate " + result.elapsedRendered + " ago."
    );
  };

  /**
   * Alexa intent handler to indicate how much a child has eaten
   * in total today.
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   */
  var bottleTotal = (req, res) => {
    return renderInfo(
      req,
      res,
      async (bc, kid) => {
        return await bc.getBottleStatus({ kid: kid.id });
      },
      (kid, result) => kid.name + " has had " + result.totalRendered + " to drink today."
    );
  };

  /**
   * Alexa intent handler to indicate how long since a child last
   * had a diaper change.
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   */
  var diaperStatus = (req, res) => {
    return renderInfo(
      req,
      res,
      async (bc, kid) => {
        return await bc.getDiaperStatus({ kid: kid.id });
      },
      (kid, result) => kid.name + " was last changed " + result.elapsedRendered + " ago."
    );
  };

  /**
   * Method to render intent for a given child.
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   * @param {function(object,object)} status Callback function to get status from Baby Connect.
   * @param {function(object,object)} render Callback function to render result of status call.
   */
  var renderInfo = async (req, res, status, render) => {
    let kid = await findChild(req, res);
    if (!kid) return;

    let result = await status(req.babyConnect, kid);
    logger.log(result);
    let content = render(kid, result);
    res.say(content);
    res.card({ type: "Simple", title: "Sleep", content });
    res.shouldEndSession(false);
  };

  /**
   * Alexa intent handler to handle 'yes' response.
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   */
  var yes = (req, res) => {
    return yesno(req, res, true);
  };

  /**
   * Alexa intent handler to handle 'no' response.
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   */
  var no = (req, res) => {
    return yesno(req, res, false);
  };

  /**
   * Handle yes/no response from 'confirmchild' state.
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   * @param {boolean} isYes true if yes, false if no.
   */
  var yesno = async (req, res, isYes) => {
    if (!ensureExistingSession(req, res)) return;
    let session = req.getSession();
    let state = session.get("state");
    if (state != "confirmchild") {
      return didntUnderstand(req, res);
    }
    if (isYes) {
      session.clear("state");
      await chainIntent(req, res);
    } else {
      res.say("Okay. Which child did you mean?");
      session.set("state", "choosechild");
      session.clear("lastChild");
      session.clear("lastChildId");
      res.shouldEndSession(false);
    }
  };

  /**
   * Alexa intent handler to handle 'child name' response.
   *
   * @param {object} req Alexa app request object.
   * @param {object} res Alexa app response object.
   */
  var childName = async (req, res) => {
    if (!ensureExistingSession(req, res)) return;
    let session = req.getSession();
    let state = session.get("state");
    if (state != "choosechild") {
      return didntUnderstand(req, res);
    }
    let child = req.slot("Child");
    let childList = await req.babyConnect.getChildList();
    let childLower = child.toLowerCase();
    let kid = childList.find(k => k.name.toLowerCase() == childLower);
    if (kid) {
      let session = req.getSession();
      session.clear("state");
      session.set("lastChild", kid.name);
      session.set("lastChildId", kid.id);
      await chainIntent(req, res);
    } else {
      logger.log("Didn't find child " + child);
      res.say("Sorry. I didn't catch the child's name. Which child did you mean?");
      res.shouldEndSession(false);
    }
  };

  /**
   * Common method to ensure that this isn't the first intent in a session.
   */
  var ensureExistingSession = (req, res) => {
    let session = req.getSession();
    if (!session.isNew()) return true;
    didntUnderstand(req, res);
    session.clear();
    res.shouldEndSession(true);
  };

  /**
   * Common method used to indicate request wasn't understood.
   */
  var didntUnderstand = (req, res) => {
    res.say("Sorry. I didn't understand your request.");
  };

  var findChild = async (req, res) => {
    let session = req.getSession();
    let child = req.slot("Child");
    logger.log("Looking for " + child);
    if (!child) {
      // if a child slot wasn't provided then check what state we are in
      // if we're in the middle of a confirmchild or choosechild check
      // then we shouldn't be trying to find a child so repeat the question
      // and return.
      let state = session.get("state");
      if (state == "confirmchild") {
        res.say("Did you mean " + session.get("lastChild") + "?");
        res.shouldEndSession(false);
        return;
      } else if (state == "choosechild") {
        res.say("Which child did you mean?");
        res.shouldEndSession(false);
        return;
      }
    }

    // Get the list of available children from Baby Connect
    let childList = await req.babyConnect.getChildList();
    let kid;

    if (child) {
      // If we were provided with a child slot then look for the ID
      let childLower = child.toLowerCase();
      kid = childList.find(k => k.name.toLowerCase() == childLower);
    } else if (session.get("lastChildId")) {
      // if we had a child selected in the session use that
      kid = { id: session.get("lastChildId"), name: session.get("lastChild") };
    } else if (childList.length === 1) {
      // if there is only one child available assume that one if none supplied
      kid = childList[0];
    }

    // Store the name of the last intent request in the session
    // We should only get to this point as part of a real intent
    // (i.e. not from a yes/no, etc.)
    // We will use this name in the future once we establish the child
    // name if we don't have it so far.
    /* istanbul ignore else */
    if (req.data && req.data.request && req.data.request.intent) {
      let name = req.data.request.intent.name;
      if (!name.startsWith("AMAZON.") && name !== "ChildName") {
        logger.log("Setting lastIntent to " + name);
        session.set("lastIntent", name);
      }
    } else {
      throw new Error("Missing intent name.");
    }

    if (!kid) {
      // If we don't have a child identified for this command
      if (childList.length === 0) {
        // you have no children
        logger.log("No children");
        res.say("Sorry. You don't have any children registered with Baby Connect.");
        session.clear();
        res.shouldEndSession(true);
      } else if (childList.length === 1) {
        // Did you mean {Child}?
        logger.log("Didn't find child " + child + ". Only one child registered.");
        // If we get to this point then the child slot must have been filled
        // otherwise we'd have chosen the only child available
        res.say(
          "Sorry, I thought you said " +
            child +
            " but that name isn't available. Did you mean " +
            childList[0].name +
            "?"
        );
        session.set("state", "confirmchild");
        session.set("lastChild", childList[0].name);
        session.set("lastChildId", childList[0].id);
        res.shouldEndSession(false);
      } else {
        logger.log("Didn't find child " + child);
        res.say("Sorry. I didn't catch the child's name. Which child did you mean?");
        session.set("state", "choosechild");
        res.shouldEndSession(false);
      }
      return;
    }

    // Remember child for future commands
    logger.log("Setting session lastChild to " + kid.name);
    session.set("lastChild", kid.name);
    session.set("lastChildId", kid.id);

    return kid;
  };

  // This method is used to continue processing the original intent
  // once the child identity has been established.
  var chainIntent = async (req, res) => {
    let lastIntent = req.getSession().get("lastIntent");
    logger.log("Chaining to previous intent: " + lastIntent);
    switch (lastIntent) {
      case "SleepStatus":
        return await sleepStatus(req, res);
      case "SleepTotal":
        return await sleepTotal(req, res);
      default:
        logger.log("Didn't match last intent.");
        res.say("Sorry. I couldn't remember what you asked for.");
        break;
    }
  };

  return {
    createUserToken,
    authenticateUser,
    launch,
    cancel,
    thanks,
    yes,
    no,
    childName,
    sleepStatus,
    sleepTotal,
    bottleStatus,
    bottleTotal,
    diaperStatus
  };
};

module.exports = skill;
