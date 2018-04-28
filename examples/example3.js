// Example to get and get service config data
const msdrZk = require("../index");
const platform_config = {
  port: 3001,
  mongoDB: {
    url: "mongodb://localhost:27017"
  },
  redisDB: {
    url: "redisURL"
  }
};

msdrZk
  .connect({
    connectionURL: "localhost:2181",
    basePath: "/services/config/development/test"
  })
  .then(conn => {
    console.log(conn);
    msdrZk
      .setServiceConfigData(
        "/services/config/development/test",
        platform_config
      )
      .then(stats => {
        msdrZk
          .getServiceConfigData("/services/config/development/test")
          .then(data => {
            console.log(data);
          });
      });
  });
