# msdr-zk-nodejs

[![Build Status](https://travis-ci.org/ankur-anand/msdr-zk-nodejs.svg?branch=master)](https://travis-ci.org/ankur-anand/msdr-zk-nodejs) [![NPM](https://nodei.co/npm/msdr-zk.png)](https://nodei.co/npm/msdr-zk/)

A Simple ZooKeeper based Microservices Service Discovery and Registery library for node.js services, that _automatically re-register the watch again on the path_ when data is requested for the first time.

#### Important Point

> This library **doesn't create the basePath at the ZooKeeper tree for services**, assuming each service needs to be provisioned as the requirement comes and to avoid the services getting registered at the incorrect basePath at the Zookeeper end in the system.

## Installation

`npm install --save msdr-zk`

## Usage.

```js
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
  // NODE_CREATED - Watched node is created.
  // NODE_DELETED - watched node is deleted.
  // NODE_DATA_CHANGED - Data of watched node is changed.
  // NODE_CHILDREN_CHANGED

  msdzkConnection.on("NODE_CHILDREN_CHANGED", e => {
    console.log("Node Children changed on the path");
    console.log(e);
  });
});

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

// register service
msdzk.registerService(registerServiceParam).then(_p => {
  console.log("service registered at " + _p);
});

//allows service to register and then check
setTimeout(() => {
  msdzk.getServiceEndpoints("service-name").then(arr => {
    console.log(arr);
    msdzk.getRandomServiceEndPoint(arr, "service-name").then(endpoint => {
      console.log(endpoint);
    });
  });
}, 2000);
```

More Examples in examples folder.

## Api.

#### 1. connect(connectionOptions) ⇒ <code>Promise</code>

connect Initiate the connection to the provided server list (ensemble).
Examples:

```js
connect({
  connectionURL: "localhost:2181",
  basePath: "/services/endpoints/test"
});
```

**Kind**: global function  
**Returns**: <code>Promise</code> - that resolves to an event emitter instance [Event](#event).

| Param                           | Type                | Description                                                                 |
| ------------------------------- | ------------------- | --------------------------------------------------------------------------- |
| connectionOptions               | <code>object</code> |                                                                             |
| connectionOptions.connectionURL | <code>string</code> | server list (ensemble) as string, Comma separated host:port pairs.          |
| connectionOptions.basePath      | <code>string</code> | the base path in the ZooKeeper tree for services of the system or platform. |

> All the services will get connected to the basePath and `store their endpoints as ephemeral nodes`, at the service-name node because ephemeral nodes are only active as long as the session that created it is active. So if the services goes down the ephemeral node that it created also comes to an end.

> It's advisable to create the basePath as `persistent znodes` as Persistent znodes are useful for storing data that needs to be highly available and accessible and have a lifetime in the ZooKeeper's namespace until they're explicitly deleted.

#### 2. registerService(serviceOptions) ⇒ <code>Promise</code>

registerService register the service to the zookeeper node using the passed options.
Examples:

```js
registerService({
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
});
```

**Kind**: global function  
**Returns**: <code>Promise</code> - - That resolves to complete service path if the service gets registered or reject with error.

| Param                   | Type                | Description                                                          |
| ----------------------- | ------------------- | -------------------------------------------------------------------- |
| serviceOptions          | <code>object</code> |                                                                      |
| serviceOptions.name     | <code>string</code> | name of the service to register as ephemeral znode at basePath+name. |
| serviceOptions.port     | <code>string</code> | port number configuration of the microservice to save.               |
| serviceOptions.protocol | <code>string</code> | communication protocol [https                                        |  | http]. |
| serviceOptions.api      | <code>string</code> | base service api.                                                    |
| serviceOptions.ip       | <code>string</code> | ip address of the running service.                                   |
| serviceOptions.metadata | <code>object</code> | other metadata of the services line - healthcheck, tags, etc.        |

#### 3. getServiceEndpoints(serviceName) ⇒ <code>Promise</code>

getServiceEndpoints returns all endpoint from the list of registered endpoints,
given a service-name.

**Kind**: global function  
**Returns**: <code>Promise</code> - - that resloves to list of all endpoints

| Param       | Type                | Description  |
| ----------- | ------------------- | ------------ |
| serviceName | <code>string</code> | service name |

#### 4. getRandomServiceEndPoint(endPointsList, serviceName) ⇒ <code>Promise</code>

getRandomServiceEndPoint returns a random endpoint from the list of registered endpoints.

**Kind**: global function  
**Returns**: <code>Promise</code> - - That resolves to a randomnly selected endpoint.

| Param         | Type                | Description        |
| ------------- | ------------------- | ------------------ |
| endPointsList | <code>array</code>  | list of endpoints. |
| serviceName   | <code>string</code> | service name.      |

#### 5. getService(endPoint) ⇒ <code>Promise</code>

getService return a object containing endpoint and metadata from the registered endpoint.

**Kind**: global function  
**Returns**: <code>Promise</code> - - That resolves to a selected endpoint and metadata.

| Param    | Type                | Description               |
| -------- | ------------------- | ------------------------- |
| endPoint | <code>string</code> | Full Path of the endPoint |

#### 6. getAllChildren() ⇒ <code>Promise</code>

getAllChildren returns all service registered at the basePath.

**Kind**: global function  
**Returns**: <code>Promise</code> - - that resloves to list of all services.

#### 7. getServiceConfigData(serviceConfigPath) ⇒ <code>Promise</code>

getServiceConfigData returns the configuration data for the
particular service.

**Kind**: global function  
**Returns**: <code>Promise</code> - - that resolves with the config data

| Param             | Type                | Default           | Description                  |
| ----------------- | ------------------- | ----------------- | ---------------------------- |
| serviceConfigPath | <code>string</code> | <code>null</code> | config store path of service |

#### 8. setServiceConfigData(serviceConfigPath) ⇒ <code>Promise</code>

setServiceConfigData returns the configuration data for the
particular service.

**Kind**: global function  
**Returns**: <code>Promise</code> - - that resolves with stat of the node.

| Param             | Type                | Default           | Description                  |
| ----------------- | ------------------- | ----------------- | ---------------------------- |
| serviceConfigPath | <code>string</code> | <code>null</code> | config store path of service |

---

### Event

The watcher function triggers the follwoing event on the instance of event emitter resolved with `connect` function.

**Properties**

* `NODE_DELETED` - watched node is deleted.
* `NODE_DATA_CHANGED` - Data of watched node is changed.
* `NODE_CHILDREN_CHANGED` - Children of watched node is changed.

---

#### License

MIT <3
