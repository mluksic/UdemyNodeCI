const { cookieKey } = require("../../config/keys");
const Keygrip = require("keygrip");
const keygrip = new Keygrip([cookieKey]);

module.exports = user => {
  const sessionObject = JSON.stringify({
    passport: {
      // you have to 'toString()' because _id is a JS object with id inside of it
      user: user._id.toString()
    }
  });
  const session = Buffer.from(sessionObject).toString("base64");
  const sessionSig = keygrip.sign("session=" + session);

  return { session, sessionSig };
};
