"use strict";

require("core-js/modules/web.dom-collections.iterator.js");

require("core-js/modules/es.promise.js");

require("core-js/modules/es.regexp.exec.js");

require("core-js/modules/es.string.match.js");

var _s3SyncClient = _interopRequireDefault(require("s3-sync-client"));

var _path = _interopRequireDefault(require("path"));

var _prompt = _interopRequireDefault(require("prompt"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _ = _interopRequireWildcard(require("lodash"));

var _rimraf = _interopRequireDefault(require("rimraf"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const loginFile = _path.default.join(process.cwd(), '.chcplogin');

(function () {
  module.exports = {
    execute: execute
  };

  async function execute(context) {
    try {
      await deploy(context);
    } catch (err) {
      throw err;
    }
  }

  async function deploy(context) {
    let config;
    let credentials;
    let ignore = context.ignoredFiles;

    try {
      config = _fsExtra.default.readFileSync(context.defaultConfig, 'utf8');
      config = JSON.parse(config);
    } catch (e) {
      console.log('Cannot parse cordova-hcp.json. Did you run cordova-hcp init?');
      process.exit(0);
    }

    if (!config) {
      console.log('You need to run "cordova-hcp init" before you can run "cordova-hcp login".');
      console.log('Both commands needs to be invoked in the root of the project directory.');
      process.exit(0);
    }

    try {
      credentials = _fsExtra.default.readFileSync(loginFile, 'utf8');
      credentials = JSON.parse(credentials);
    } catch (e) {
      console.log('Cannot parse .chcplogin: ', e);
    }

    if (!credentials) {
      console.log('You need to run "cordova-hcp login" before you can run "cordova-hcp deploy".');
      process.exit(0);
    }

    ignore = ignore.filter(ignoredFile => !ignoredFile.match(/^chcp/));
    ignore = ignore.map(ignoredFile => "!".concat(ignoredFile)); // console.log('Credentials: ', credentials);
    // console.log('Config: ', config);
    // console.log('Ignore: ', ignore);

    try {
      _rimraf.default.sync('./s3sync');

      await _fsExtra.default.ensureDir('./s3sync');
    } catch (err) {
      throw err;
    }

    try {
      await _fsExtra.default.copy(context.sourceDirectory, './s3sync');
    } catch (err) {
      console.error(err);
    }

    const client = new _s3SyncClient.default({
      region: config.s3region,
      credentials: {
        accessKeyId: credentials.key,
        secretAccessKey: credentials.secret
      }
    });
    const {
      TransferMonitor
    } = _s3SyncClient.default;
    const monitor = new TransferMonitor();
    monitor.on('progress', progress => console.log(progress));

    try {
      await client.sync('./s3sync', "s3://".concat(config.s3bucket, "/").concat(config.s3prefix), {
        commandInput: {
          ACL: 'public-read'
        },
        monitor: monitor,
        del: true
      });
      console.log('Deploy complete', "s3://".concat(config.s3bucket, "/").concat(config.s3prefix));
    } catch (err) {
      throw err;
    }
  }
})();
//# sourceMappingURL=deploy.js.map