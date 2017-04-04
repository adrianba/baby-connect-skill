"use strict";

const nock = require("nock");
const BABYCONNECT_ENDPOINT = /www\.baby-connect\.com/;
const tc = require("timezonecomplete");
const timezone = "US/Pacific";

let mock = (function() {
  var cleanUp = () => {
    nock.cleanAll();
  };

  var successfulLogin = () => {
    nock(BABYCONNECT_ENDPOINT)
      .post("/Cmd?cmd=UserAuth")
      .reply(302, null, { Location: "https://www.baby-connect.com/home" });
  };

  var failedLogin = () => {
    nock(BABYCONNECT_ENDPOINT).post("/Cmd?cmd=UserAuth").reply(200, "Need to login");
  };

  var userInfo = config => {
    config = config || {};
    let response = {
      Name: "User",
      Ut: 1,
      Phone: "demo@example.com",
      flags: 4,
      Email: "demo@example.com",
      created: "01/01/2017",
      myKids: [
        {
          Name: "George",
          Created: 170101,
          PhotoInd: 6,
          Id: 2222222222222222,
          Parents: [],
          Boy: true,
          Photo: 2222222222222222,
          BDay: "01/01/2017"
        }
      ],
      Id: 1111111111111111,
      custoSynch: true
    };
    if (config.noChildren) {
      response.myKids = [];
    }
    if (config.addChild) {
      response.myKids = response.myKids.concat([
        {
          Name: config.addChild.name,
          Id: config.addChild.id
        }
      ]);
    }
    nock(BABYCONNECT_ENDPOINT).post("/CmdW?cmd=UserInfoW").reply(200, response);
  };

  var statusList = config => {
    config = config || {};
    let response = {
      summary: {
        nrOfBMDiapers: 1,
        nrOfNursingL: 3,
        nrOfPumping: 1,
        totalNursingDuration: 33,
        nursingIsLastSideLeft: true,
        totalNursingL: 20,
        totalSleepDuration: 509,
        totalBottleSize: 16.5,
        timeOfLastSleeping: "4/2/2017 14:10",
        kidId: 2222222222222222,
        timeOfLastNursing: "4/2/2017 13:22",
        nrOfSleep: 4,
        timeOfLastDiaper: "4/2/2017 12:46",
        totalPumpingSize: 6,
        longuestSleepDuration: 242,
        totalNursingR: 10,
        nrOfNursingR: 2,
        nrOfWetDiapers: 3,
        day: 170402,
        nrOfBottle: 5,
        nrOfDiapers: 4,
        isSleeping: true,
        timeOfLastPumping: "4/2/2017 8:10",
        timeOfLastBottle: "4/2/2017 14:0"
      },
      staff: [],
      users: [
        {
          Name: "User",
          Ut: 1,
          Phone: "demo@example.com",
          flags: 4,
          Email: "demo@example.com",
          Id: 1111111111111111
        },
        {
          Name: "User2",
          Ut: 1,
          flags: 4,
          Email: "user2@example.com",
          Id: 3333333333333333
        }
      ],
      ts: 243641430781,
      kidId: 2222222222222222,
      pdt: 170402,
      list: [],
      user: {
        Name: "User",
        Ut: 1,
        Phone: "demo@example.com",
        flags: 4,
        Email: "demo@example.com",
        myKids: [],
        nws: true,
        Id: 1111111111111111,
        custoSynch: true
      },
      deleted: [],
      all: true
    };

    if (config.sleepElapsed) {
      response.summary.timeOfLastSleeping = elapsed(config.sleepElapsed);
    }
    if (config.sleepTotal) {
      response.summary.totalSleepDuration = config.sleepTotal;
    }
    if (config.isSleeping !== undefined) {
      response.summary.isSleeping = config.isSleeping;
    }
    if (config.bottleElapsed) {
      response.summary.timeOfLastBottle = elapsed(config.bottleElapsed);
    }
    if (config.bottleTotal) {
      response.summary.totalBottleSize = config.bottleTotal;
    }
    if (config.diaperElapsed) {
      response.summary.timeOfLastDiaper = elapsed(config.diaperElapsed);
    }
    nock(BABYCONNECT_ENDPOINT).post("/CmdListW?cmd=StatusList").reply(200, response);
  };

  function elapsed(mins) {
    let now = tc.now(tc.zone(timezone));
    let last = now.add(tc.minutes(-mins));
    return last.format("M/d/y H:mm");
  }

  return {
    cleanUp,
    successfulLogin,
    failedLogin,
    userInfo,
    statusList
  };
})();

module.exports = mock;
