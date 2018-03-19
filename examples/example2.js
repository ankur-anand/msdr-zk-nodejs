// run example 1 and then 2 to check for watchers in actions.

const msdzk = require("../index");

const msdzkP = msdzk.connect({
  connectionURL: "localhost:2181",
  basePath: "/services/endpoints/test"
});

let msdzkConnection;
msdzkP.then(conn => {
  msdzkConnection = conn;
  msdzkConnection.on("zk-disconnected", () => {
    // listen for zk-disconnected event, and do the clean up.
    console.log("zk-disconnected stopping the process");
    process.exit(1);
  });

  // NODE_DELETED - watched node is deleted.
  // NODE_DATA_CHANGED - Data of watched node is changed.
  // NODE_CHILDREN_CHANGED

  msdzkConnection.on("NODE_CHILDREN_CHANGED", e => {
    console.log(e + " events");
  });
});
// msdzkConnection.on("zk-connected", () => {
//   // listen for zk-connected event, and register or discover the
//   // service
//   console.log("Zookeper has been connected");
// });

const registerServiceParam = {
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
};

const registerServiceParam2 = {
  name: "service-name2",
  port: "4001",
  protocol: "http",
  api: "/api/v1",
  ip: "localhost",
  release: "1.2.0",
  metadata: {
    check: {
      status: "/status",
      health: "health",
      interval: "30s",
      user: "node",
      tags: ["api"]
    }
  }
};

msdzk.registerService(registerServiceParam).then(_p => {
  console.log("service registered at " + _p);
});

msdzk.registerService(registerServiceParam2).then(_p => {
  console.log("service registered at " + _p);
});
