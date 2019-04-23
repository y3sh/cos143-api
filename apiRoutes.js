const UserModel = require("./userModel")
const uuidv4 = require('uuid/v4');

const taylorUser = new UserModel()
taylorUser.username = "taylor"
taylorUser.password = "taylor"

const usernameToUserModelMap = {
  taylor: taylorUser
};

const sessionUUIDToUser = {}

module.exports = function (app) {
  app.get("/api/users/:username?", function (req, res) {
    try {
      if (req.params.username === null || req.params.username === undefined) {
        res.json(Object.keys(usernameToUserModelMap).map(username => {
          return usernameToUserModelMap[username].toJSON()
        }))
      } else {
        res.json(usernameToUserModelMap[req.params.username].toJSON())
      }
    } catch {
      res.json(null)
    }
  });

  app.post("/api/users", function (req, res) {
    try {
      if (req.get("X-Auth-Token")) {
        res.status(400).json({error: "Cannot create account while logged in."})
        return
      }

      if (usernameToUserModelMap[req.body.username]) {
        res.status(400).json({error: "Username already exists."})
      } else if (!req.body.username || !req.body.password) {
        res.status(400).json({error: "Missing username or password in json."})
      } else {
        const userModel = new UserModel()
        userModel.fromJSON(req.body)
        usernameToUserModelMap[userModel.username] = userModel
        res.json(userModel.toJSON())
      }
    } catch {
      res.status(400).json({error: "Bad request, invalid username/password. Must be 4-6 chars each."})
    }
  });

  app.put("/api/users/:username?", function (req, res) {
    try {
      const userModel = usernameToUserModelMap[req.params.username]

      if (!userModel) {
        res.status(400).json({error: "Username not found, try post first."})
      } else {
        userModel.fromJSON(req.body)
        delete usernameToUserModelMap[req.params.username]
        usernameToUserModelMap[userModel.username] = userModel
        res.json(userModel.toJSON())
      }
    } catch {
      res.status(400).json({error: "Bad request, make sure you have username and password"})
    }
  });

  app.delete("/api/users/:username?", function (req, res) {
    try {
      const userModel = usernameToUserModelMap[req.params.username]
      const sessionId = userModel.sessionId;
      delete usernameToUserModelMap[req.params.username]
      delete sessionUUIDToUser[sessionId]
      res.status(200).json();
    } catch {
      res.status(400).json({error: "User not found."})
    }
  });

  app.post("/api/sessions", function (req, res) {
    try {
      const userModel = usernameToUserModelMap[req.body.username]
      if (UserModel.strToHash(req.body.password) === userModel.password) {
        if (!userModel.sessionId) {
          userModel.sessionId = uuidv4();
          sessionUUIDToUser[userModel.sessionId] = userModel
        }

        res.json({sessionId: userModel.sessionId})
      } else {
        res.status(400).json({error: "Invalid credentials."})
      }
    } catch {
      res.status(400).json({error: "Invalid credentials."})
    }
  });

  app.delete("/api/sessions/:sessionId?", function (req, res) {
    try {
      const userModel = sessionUUIDToUser[req.params.sessionId]
      delete sessionUUIDToUser[req.params.sessionId]
      userModel.sessionId = null
      res.status(200).json({});
    } catch {
      res.status(400).json({error: "Session not found."})
    }
  });

  app.get("/api/secret", function (req, res) {
    try {
      const sessionId = req.get("X-Auth-Token")
      if (sessionUUIDToUser[sessionId]) {
        res.json({
          "TheAnswerToLifeTheUniverseAndEverything": 42,
          "timestamp": Date.now(),
        })
      } else {
        res.status(401).json({error: "Access restricted, please include X-Auth-Token header."})
      }
    } catch {
    }
  });

  app.get("/api/secrets", function (req, res) {
    try {
      const sessionId = req.get("X-Auth-Token")
      if (sessionUUIDToUser[sessionId]) {
        res.json({
          "TheAnswerToLifeTheUniverseAndEverything": 42,
          "HatchLaunchCodes": [4, 8, 15, 16, 23, 42],
          "THX": 1138,
          "TaylorSwift": 13,
          "Spartan": 117,
          "Lights": 4,
          "MilesPerHour": 88,
          "Spoilers": ["Rosebud", "No, I am your father.", "The Cake is a Lie", "That's the cup of a carpenter"]
        })
      } else {
        res.status(401).json({error: "Access restricted, please include X-Auth-Token header."})
      }
    } catch {
    }
  });
};
