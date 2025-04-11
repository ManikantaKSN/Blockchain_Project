module.exports = {
    networks: {
      development: {
        host: "127.0.0.1",
        port: 7545,   // or your configured port
        network_id: "*",
        gas: 6721975, // explicitly set gas limit
      }
    },
    compilers: {
      solc: {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    }
  };
  