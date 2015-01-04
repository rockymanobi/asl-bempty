module.exports = {
  bemptyUrl: "http://bempty.herokuapp.com",
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
        system: "INFO"
      }
    }
  }
};
