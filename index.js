const assert = require("assert");
const zookeeper = require("node-zookeeper-client");
const EventEmitter = require("events");

// path where the endpoints will get saved.
let baseNodePath = null;
let zkConnection = null;

class MyEmitter extends EventEmitter {}

const msdZkEmitter = new MyEmitter();
const watchEmitter = new MyEmitter(); // emitter to re-register the watch again.

// if json format
function tryParseJSON(jsonString) {
  try {
    var o = JSON.parse(jsonString.toString("utf8"));

    // Handle non-exception-throwing cases:
    // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
    // but... JSON.parse(null) returns null, and typeof null === "object",
    // so we must check for that, too. Thankfully, null is falsey, so this suffices:
    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {}

  return jsonString.toString("utf8");
}

/**
 * registerService register the service to the zookeeper node using the passed
 * options.
 * Examples:
 * ```js
 * registerService({
    name: "service-name",
    port: "4000",
    protocol: "http",
    api: "/api/v1",
    ip: "localhost",
    release: "1.1.0",
    metadata: {
      check: {
        status: "/status",
        health: "health",
        interval: "30s",
        user: "node",
        tags: ["api"]
      }
    }
  }, zkConnection);
 * ```
 * @param {object} serviceOptions
 * @param {string} serviceOptions.name - name of the service to register as ephemeral znode at basePath+name.
 * @param {string} serviceOptions.port - port number configuration of the microservice to save.
 * @param {string} serviceOptions.protocol - communication protocol [https || http].
 * @param {string} serviceOptions.api - base service api.
 * @param {string} serviceOptions.ip - ip address of the running service.
 * @param {object} serviceOptions.metadata - other metadata of the services line - healthcheck, tags, etc.
 * @param {object} [zkConn] - Zookeeper connection (pass this explicitly if using the existing connection inside different module)
 * @return {Promise} - That resolves to complete service path if the service gets registered or reject with error.
 */
function registerService(
  {
    name = null,
    port = null,
    protocol = null,
    api = null,
    ip = null,
    release = null,
    metadata = {}
  },
  zkConn
) {
  // service ip can be fetched from the network interface but that can sometimes
  // becomes inconsistents

  return new Promise((resolve, reject) => {
    if (!name) return reject("Empty serviceName string");
    if (!port) return reject("Empty service port string");
    if (!protocol) return reject("Empty service protocol string");
    if (!api) return reject("Empty service api string");
    if (!ip) return reject("Empty service ip string");
    if (!release) return reject("Empty service release string");
    if (!zkConn == null) {
      zkConnection = zkConn;
    }
    const _service_node = `${baseNodePath}/${name}`;
    const _endPoint = `${protocol}://${ip}:${port}${api}`;
    const _dataToSave = JSON.stringify({
      endpoint: _endPoint,
      metadata
    });
    nodeExist()
      .then(isNode => {
        if (!isNode) {
          reject(
            new Error(
              `${baseNodePath} not present at ${connectionURL} zookeper instance, Service can't get registered.`
            )
          );
        }
        // create the sevice name node if it doesn't exist
        zkConnection.mkdirp(_service_node, function(err, _path) {
          if (err) return reject(err);
          if (_path) {
            // path has been created to the baseNodePath create the ephemeral node
            // on the service node
            zkConnection.create(
              `${_path}/${name}`,
              Buffer.from(_dataToSave),
              zookeeper.CreateMode.EPHEMERAL_SEQUENTIAL,
              _err => {
                if (_err) return reject(_err);
                resolve(_path);
              }
            );
          }
        });
      })
      .catch(error => {
        throw new Error(error);
      });
  });
}

/**
 * connect Initiate the connection to the provided server list (ensemble).
 * Examples:
 * ```js
 * connect({
 * connectionURL: "localhost:2181",
 * basePath: "/services/endpoints/test"
 * });
 * ```
 * @param {object} connectionOptions
 * @param {string} connectionOptions.connectionURL - server list (ensemble) as string, Comma separated host:port pairs.
 * @param {string} connectionOptions.basePath - the base path in the ZooKeeper tree for services of the system or platform.
 * @returns {Promise} that resolves to an event emitter instance.
 */
function connect({ connectionURL = null, basePath = null }) {
  assert.notEqual(connectionURL, null, "Empty connectionUrl string");
  assert.notEqual(basePath, null, "Empty basePath string");
  baseNodePath = basePath;
  const data = {
    sessionTimeout: 1000,
    spinDelay: 1000,
    retries: 1
  };
  zkConnection = zookeeper.createClient(connectionURL, data);

  // connect to the zookeeper
  zkConnection.connect();

  // register some of the event to be checked on the state
  // and attach the custom event on the msdZkEmitter
  zkConnection.on("state", function(state) {
    if (
      state === zookeeper.State.DISCONNECTED ||
      state === zookeeper.State.AUTH_FAILED ||
      state === zookeeper.State.EXPIRED
    ) {
      // Zookeeper has been Disconnected,
      // client should handle this case usually by
      // stopping service
      msdZkEmitter.emit("zk-disconnected");
    }
  });

  // Individual should not be allowed to create the node on the zookeeper,
  // so checking if the baseNodePath exits on the zookeeper or not. if not
  return new Promise((resolve, reject) => {
    nodeExist()
      .then(isNode => {
        if (!isNode) {
          return reject(
            new Error(
              `${baseNodePath} not present at ${connectionURL} zookeper instance, Service can't get registered.`
            )
          );
        } else {
          // console.log(
          //   `${baseNodePath} present at ${connectionURL} zookeper instance, zookeeper connected.`
          // );
          setTimeout(checkZkStatus, 5000);
          return resolve(msdZkEmitter);
        }
      })
      .catch(error => {
        return reject(error);
      });
  });
}

// check if the nodePath exists.
function nodeExist() {
  return new Promise((resolve, reject) => {
    zkConnection.exists(baseNodePath, function(error, stat) {
      if (error) {
        //console.log(error.stack);
        return reject(error);
      }

      if (stat) {
        return resolve(true);
      } else {
        return resolve(false);
      }
    });
  });
}

// function checks the status of the zookeeper, if the status
// of the zookeeper is not found the service should stop and
// logs the same.
function checkZkStatus() {
  if (zkConnection.getState() === zookeeper.State.DISCONNECTED) {
    console.log("Zookeeper not found, stopping service");
    process.exit(0);
  }
}

// helper watcher
function watcher(event) {
  watchEmitter.emit("watch-triggered", event);
  // emit the event on the
  msdZkEmitter.emit(event.name, event.path);
}

// watcher event function
// A watch is a one-time trigger, and we need to re-register the watch again
// when it's triggers.
function watcherFunction(_dataOrChild, _path) {
  assert.notEqual(_dataOrChild, undefined, "_dataOrChild is Empty");
  assert.notEqual(_path, null, "_path is Empty");
  // if the child is required immediately set another watch for child
  if (_dataOrChild === "child") {
    zkConnection.getChildren(_path, watcher, (_err, _children) => {
      // callback just to trigger the watcher again
    });
    // else if the child is "data" trigger watcher on Nodedata
  } else if (_dataOrChild === "data") {
    zkConnection.getData(_path, watcher, (_err, _children) => {
      // callback just to trigger the watcher again
    });
  }
}

watchEmitter.on("watch-triggered", event => {
  if (event) {
    if (event.name === "NODE_CHILDREN_CHANGED") {
      watcherFunction("child", event.path);
    }

    if (event.name === "NODE_DELETED" || event.name === "NODE_DATA_CHANGED") {
      watcherFunction("data", event.path);
    }
  }
});

/**
 * getServiceEndpoints returns all endpoint from the list of registered endpoints,
 * given a service-name.
 * @param {string} serviceName - service name
 * @param {object} [zkConn] - Zookeeper connection (pass this explicitly if using the existing connection inside different module)
 * @return {Promise} - that resloves to list of all endpoints
 */
function getServiceEndpoints(serviceName, zkConn) {
  assert.notEqual(serviceName, undefined, "Service Name is Empty");
  assert.notEqual(serviceName, null, "Service Name is Empty");
  if (!zkConn == null) {
    zkConnection = zkConn;
  }
  const _endPoint = `${baseNodePath}/${serviceName}`;
  return new Promise((resolve, reject) => {
    zkConnection.getChildren(_endPoint, watcher, (_err, _children) => {
      if (_err) return reject(_err);
      if (_children.length < 1) {
        return reject(new Error("microservice handler not present"));
      }

      return resolve(_children);
    });
  });
}

/**
 * getRandomServiceEndPoint  returns a random endpoint from the list of registered endpoints.
 * @param {array} endPointsList - list of endpoints.
 * @param {string} serviceName - service name.
 * @param {object} [zkConn] - Zookeeper connection (pass this explicitly if using the existing connection inside different module)
 * @return {Promise} - That resolves to a randomnly selected endpoint.
 */
function getRandomServiceEndPoint(endPointsList, serviceName, zkConn) {
  if (!zkConn == null) {
    zkConnection = zkConn;
  }
  return new Promise((resolve, reject) => {
    let random = Math.floor(Math.random() * 100) % endPointsList.length;
    const _re = endPointsList[random];
    const _endPoint = `${baseNodePath}/${serviceName}/${_re}`;
    getService(_endPoint, zkConn).then(_edata => {
      return resolve(_edata);
    });
  });
}

/**
 * getService  return a object containing endpoint and metadata from the registered endpoint.
 * @param {string} endPoint - Full Path of the endPoint
 * @param {object} [zkConn] - Zookeeper connection (pass this explicitly if using the existing connection inside different module)
 * @return {Promise} - That resolves to a selected endpoint and metadata.
 */
function getService(endPoint, zkConn) {
  if (!zkConn == null) {
    zkConnection = zkConn;
  }
  return new Promise((resolve, reject) => {
    zkConnection.getData(endPoint, watcher, (_err, _ep) => {
      if (_err) {
        return reject(_err);
      }
      return resolve(tryParseJSON(_ep));
    });
  });
}

/**
 * getAllChildren returns all service registered at the  basePath.
 * @param {object} [zkConn] - Zookeeper connection (pass this explicitly if using the existing connection inside different module)
 * @return {Promise} - that resloves to list of all services.
 */
function getAllChildren(zkConn) {
  if (!zkConn == null) {
    zkConnection = zkConn;
  }
  return new Promise((resolve, reject) => {
    zkConnection.getChildren(baseNodePath, watcher, (_err, _children) => {
      if (_err) return reject(_err);
      if (_children.length < 1) {
        return reject(new Error("microservice handler not present"));
      }

      return resolve(_children);
    });
  });
}

/**
 * getServiceConfigData returns the configuration data for the
 * particular service.
 * @param {string} serviceConfigPath - config store path of service
 * @param {object} [zkConn] - Zookeeper connection (pass this explicitly if using the existing connection inside different module)
 * @return {Promise} - that resolves with the config data
 */

function getServiceConfigData(serviceConfigPath = null, zkConn) {
  if (!zkConn == null) {
    zkConnection = zkConn;
  }
  return new Promise((resolve, reject) => {
    if (!serviceConfigPath) return reject(new Error("path string is required"));
    zkConnection.getData(serviceConfigPath, watcher, function(
      error,
      data,
      stat
    ) {
      if (error) {
        return reject(new Error(error.stack));
      }
      return resolve(tryParseJSON(data));
    });
  });
}

/**
 * setServiceConfigData returns the configuration data for the
 * particular service.
 * @param {string} serviceConfigPath - config store path of service
 * @param {object} [zkConn] - Zookeeper connection (pass this explicitly if using the existing connection inside different module)
 * @return {Promise} - that resolves with stat of the node.
 */
function setServiceConfigData(serviceConfigPath = null, data, zkConn) {
  if (!zkConn == null) {
    zkConnection = zkConn;
  }
  return new Promise((resolve, reject) => {
    if (!serviceConfigPath) return reject(new Error("path string is required"));
    const _dataToSave = JSON.stringify({
      config: data
    });
    zkConnection.setData(serviceConfigPath, Buffer.from(_dataToSave), function(
      error,
      stat
    ) {
      if (error) {
        return reject(new Error(error.stack));
      }
      return resolve(stat);
    });
  });
}

module.exports = {
  connect,
  registerService,
  getServiceEndpoints,
  getRandomServiceEndPoint,
  getService,
  getAllChildren,
  getServiceConfigData,
  setServiceConfigData
};
