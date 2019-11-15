const path = require("path");
const jsonfile = require("jsonfile");
const run = require('./run');
const myPackage = require("../package.json");
const defaultConfig = require("./config/default.json");
const userConfig = require("./config/user.json");
const packageName = myPackage.name;
const packageVersion = myPackage.version;

function writeJson(content) {
  const userConfigPath = path.join(__dirname, "./config/user.json");
  jsonfile.writeFile(userConfigPath, content, { spaces: 4 }, function(err) {
    if (err) {
      console.error(err);
      return;
    }
    console.log();
    console.log("success.");
    console.log();
  });
}

function listAllCfg() {
  return Object.assign({}, defaultConfig, userConfig);
}

function saveCfg(data) {
  const { alias, command, desc='' } = data;
  const copyConfig = { ...userConfig };
  copyConfig[alias] = { command, desc };
  writeJson(copyConfig);
}

function deleteCfg(alias) {
  const copyConfig = { ...userConfig };
  if (alias in copyConfig) {
    delete copyConfig[alias];
    writeJson(copyConfig);
  }
}

function commandIsExist(cmd) {
  return run(`which ${cmd}`).then(stdout => {
    if (stdout.trim().length === 0) {
      // maybe an empty command was supplied?
      // are we running on Windows??
      return Promise.reject(new Error("No output"));
    }

    const rNotFound = /^[\w\-]+ not found/g;

    if (rNotFound.test(cmd)) {
      return Promise.resolve(false);
    }

    return Promise.resolve(true);
  });
}

function showConfirm() {
  return new Promise((resolve, reject) => {
    prompt({
      name: "answer",
      message: "Are you sure?",
      type: "list",
      choices: ["Yes", "No"]
    })
      .then(res => {
        if (res.answer === "Yes") {
          resolve();
        } else {
          reject();
        }
      })
      .catch(e => {
        reject(e);
      });
  });
} 

module.exports = {
  packageName,
  packageVersion,
  commandIsExist,
  listAllCfg,
  saveCfg,
  deleteCfg,
  showConfirm,
};
