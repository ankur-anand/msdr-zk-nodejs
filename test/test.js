const sinon = require("sinon");
const sinonTestFactory = require("sinon-test");
const sinonTest = sinonTestFactory(sinon);

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const expect = chai.expect;
const msdzk = require("../index");

describe("msd-zk-nodejs test suite", function() {
  describe("#connect()", function() {
    it(
      "should return a promise object",
      sinonTest(function() {
        const spy = this.spy(msdzk, "connect");
        const connectionParam = {
          connectionURL: "localhost:2181",
          basePath: "/services/endpoints/test"
        };

        const msdzkConnection = msdzk.connect(connectionParam);
        expect(spy).to.have.property("callCount", 1);
        expect(spy.calledOnceWith(connectionParam)).to.be.true;
        expect(msdzkConnection).to.be.a("promise");
      })
    );

    it(
      "should resolve a promise object into an eventEmitter when connected",
      sinonTest(function() {
        const spy = this.spy(msdzk, "connect");
        const connectionParam = {
          connectionURL: "localhost:2181",
          basePath: "/services/endpoints/test"
        };

        const msdzkConnection = msdzk.connect(connectionParam);
        expect(spy).to.have.property("callCount", 1);
        expect(spy.calledOnceWith(connectionParam)).to.be.true;
        return expect(msdzkConnection).to.be.fulfilled;
      })
    );

    it(
      "should reject a promise object into an error when not connected",
      sinonTest(function() {
        const spy = this.spy(msdzk, "connect");
        const connectionParam = {
          connectionURL: "localhost:2181",
          basePath: "/services/endpoints/abarakadabra/alibaba"
        };

        const msdzkConnection = msdzk.connect(connectionParam);
        expect(spy).to.have.property("callCount", 1);
        expect(spy.calledOnceWith(connectionParam)).to.be.true;
        return expect(msdzkConnection).to.be.rejectedWith(
          "/services/endpoints/abarakadabra/alibaba not present at localhost:2181 zookeper instance, Service can't get registered."
        );
      })
    );
  });

  describe("#registerService()", function() {
    it(
      "should resolve a promise object into an path when registered",
      sinonTest(function() {
        const spy = this.spy(msdzk, "registerService");
        const connectionParam = {
          connectionURL: "localhost:2181",
          basePath: "/services/endpoints/test"
        };

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

        const registerPromise = msdzk.connect(connectionParam).then(conn => {
          msdzk.registerService(registerServiceParam).then(_p => {
            expect(_p).to.equal("/services/endpoints/test/service-name");
          });
        });

        return expect(registerPromise).to.be.fulfilled;
      })
    );
  });

  describe("#getServiceEndpoints()", function() {
    it(
      "should resolve a promise object into array of nodes of an service",
      sinonTest(function() {
        const connectionParam = {
          connectionURL: "localhost:2181",
          basePath: "/services/endpoints/test"
        };

        const registerServiceParam = {
          name: "service-name-3",
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

        const registerPromise = msdzk.connect(connectionParam).then(conn => {
          msdzk.registerService(registerServiceParam).then(_p => {
            msdzk.getServiceEndpoints("service-name-3").then(arr => {
              expect(arr).to.be.an("array").that.is.not.empty;
            });
          });
        });

        return expect(registerPromise).to.be.fulfilled;
      })
    );
  });

  describe("#getAllChildren()", function() {
    it(
      "should resolve a promise object into array of nodes containing list of all services",
      sinonTest(function() {
        const connectionParam = {
          connectionURL: "localhost:2181",
          basePath: "/services/endpoints/test"
        };

        const registerServiceParam = {
          name: "service-name-4",
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

        const registerPromise = msdzk.connect(connectionParam).then(conn => {
          msdzk.registerService(registerServiceParam).then(_p => {
            msdzk.getAllChildren().then(arr => {
              expect(arr).to.be.an("array").that.is.not.empty;
            });
          });
        });

        return expect(registerPromise).to.be.fulfilled;
      })
    );
  });

  describe("#getRandomServiceEndPoint()", function() {
    it(
      "should resolve a promise into an random endpoint from the nodes list of the service",
      sinonTest(function() {
        const connectionParam = {
          connectionURL: "localhost:2181",
          basePath: "/services/endpoints/test"
        };

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

        const registerPromise = msdzk.connect(connectionParam).then(conn => {
          msdzk.registerService(registerServiceParam).then(_p => {
            msdzk.getServiceEndpoints("service-name").then(arr => {
              msdzk
                .getRandomServiceEndPoint(arr, "service-name")
                .then(endpoint => {
                  expect(endpoint).to.have.own.property("endpoint");
                  expect(endpoint).to.have.own.property("metadata");
                });
            });
          });
        });

        return expect(registerPromise).to.be.fulfilled;
      })
    );
  });
});
