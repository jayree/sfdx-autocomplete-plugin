const os = require("os");

exports.default =
  os.platform() === "windows" || os.platform() === "win32"
    ? // tslint:disable-next-line:no-console
      (msg, cbk) => console.log("skipping on windows")
    : (msg, cbk) => describe(msg, cbk);
