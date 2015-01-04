module.exports = {
  //bemptyUrl: "http://bempty.herokuapp.com"
  bemptyUrl: "http://localhost:3000",
  log4js: {
    "configure": {
      "appenders": [
        {
          "category": "system",
          "type": "console"
        },
        {
          "category": "access",
          "type": "console"
        },
        {
          "category": "error",
          "type": "console"
        }
      ],
      "levels": {
        system: "ALL"
      }
    }
  }
};
