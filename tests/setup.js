// default jest timeout is 5s, because of that tests that take longer fail
// this number is set up to you
jest.setTimeout(30000);

require("../models/User");

const mongoose = require("mongoose");
const keys = require("../config/keys");

mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, { useMongoClient: true });
1;
