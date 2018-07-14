"use strict";
require("dotenv").config();
var port = process.env.PORT || 8880;

var express = require("express");
var app = express();

// The Alexa app uses a view called 'test' in debug mode.
// Configure the ejs view engine for this.
app.set("view engine", "ejs");

// Create an instance of the Baby Connect skill and connect to express
var bc = require("./baby-connect/handler");
var babyconnect = bc({ express: app, debug: true });

// Start listening for incoming connections
app.listen(port);
console.log("Listening on port " + port);
