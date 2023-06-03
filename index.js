const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
//import parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", function (req, res) {
  const username = req.body;

  if (!username) {
    return res.status(400).send({ error: "invalid user" });
  } else {
    return res.json({
      username: username,
    });
  }
});

app.post("/api/users/:_id/exercise", function (req, res) {
  const id = req.params._id;
  const description = req.params.description;
  const duration = req.params.duration;
  const date = req.params.date;

  if (!id) {
    return res.status(400).send({ error: "invalid exercise input" });
  } else {
    return res.json({
      id: id,
      description: description,
      duration: duration,
      date: date,
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
