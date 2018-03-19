# msdr-zk-nodejs

## A Simple ZooKeeper based Microservices Service Discovery and Registery library for node.js services.

#### Important Point

> This library **doesn't create the basePath at the ZooKeeper tree for services**, assuming each service needs to be provisioned as the requirement comes and to avoid the services getting registered at the incorrect basePath at the Zookeeper end in the system.

## Installation

`npm install --save msdr-zk`

## API.

### 1. connect(connectionOptions) ⇒ <code>Promise</code>

connect Initiate the connection to the provided server list (ensemble).
Examples:

```js
connect({
  connectionURL: "localhost:2181",
  basePath: "/services/endpoints/test"
});
```

**Kind**: global function  
**Returns**: <code>Promise</code> - that resolves to an event emitter instance.

| Param                           | Type                | Description                                                                 |
| ------------------------------- | ------------------- | --------------------------------------------------------------------------- |
| connectionOptions               | <code>object</code> |                                                                             |
| connectionOptions.connectionURL | <code>string</code> | server list (ensemble) as string, Comma separated host:port pairs.          |
| connectionOptions.basePath      | <code>string</code> | the base path in the ZooKeeper tree for services of the system or platform. |

> All the services will get connected to the basePath and `store their endpoints as ephemeral nodes`, at the service-name node because ephemeral nodes are only active as long as the session that created it is active. So if the services goes down the ephemeral node that it created also comes to an end.

> It's advisable to create the basePath as `persistent znodes` as Persistent znodes are useful for storing data that needs to be highly available and accessible and have a lifetime in the ZooKeeper's namespace until they're explicitly deleted.

### 2. registerService(serviceOptions) ⇒ <code>Promise</code>

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

### 3. getServiceEndpoints(serviceName) ⇒ <code>Promise</code>

getServiceEndpoints returns all endpoint from the list of registered endpoints,
given a service-name.

**Kind**: global function  
**Returns**: <code>Promise</code> - - that resloves to list of all endpoints

| Param       | Type                | Description  |
| ----------- | ------------------- | ------------ |
| serviceName | <code>string</code> | service name |

### 4. getRandomServiceEndPoint(endPointsList, serviceName) ⇒ <code>Promise</code>

getRandomServiceEndPoint returns a random endpoint from the list of registered endpoints.

**Kind**: global function  
**Returns**: <code>Promise</code> - - That resolves to a randomnly selected endpoint.

| Param         | Type                | Description        |
| ------------- | ------------------- | ------------------ |
| endPointsList | <code>array</code>  | list of endpoints. |
| serviceName   | <code>string</code> | service name.      |

### 5. getService(endPoint) ⇒ <code>Promise</code>

getService return a object containing endpoint and metadata from the registered endpoint.

**Kind**: global function  
**Returns**: <code>Promise</code> - - That resolves to a selected endpoint and metadata.

| Param    | Type                | Description               |
| -------- | ------------------- | ------------------------- |
| endPoint | <code>string</code> | Full Path of the endPoint |

### 6. getAllChildren() ⇒ <code>Promise</code>

getAllChildren returns all service registered at the basePath.

**Kind**: global function  
**Returns**: <code>Promise</code> - - that resloves to list of all services.

#### License

MIT <3
