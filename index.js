const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

//Connect to mongodb
const { MongoClient } = require("mongodb");
const database = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
database.connect();

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async function (req, res) {
  const username = req.body.username;

  if (!username) {
    return res.status(400).send({ error: "invalid user" });
  } else {
    let newUser = {
      username: username,
    };

    const result = await database
      .db("exercise_tracker")
      .collection("users")
      .insertOne(newUser);

    newUser._id = result.insertedId;
    //get the id
    return res.json(newUser);
  }
});

app.get("/api/users", async function (req, res) {
  try {
    const collection = database.db("exercise_tracker").collection("users");
    const users = await collection.find().toArray();
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: `server error: ${err}` });
  }
});

app.post("/api/users/:_id/exercises", async function (req, res) {
  const id = req.params._id;
  const description = req.body.description;
  const duration = +req.body.duration; //number always
  const date = req.body.date ? new Date(req.body.date) : new Date();

  const collection = database.db("exercise_tracker").collection("users");

  const user = await collection.findOne({ _id: id });

  //check if user exist
  if (!user) {
    return res.status(400).send({ error: "invalid user" });
  }
  if (!description || !duration) {
    return res
      .status(400)
      .send({ error: "Description or duration must be provided" });
  }

  const exercise = {
    description: description,
    duration: duration,
    date: date.toDateString(),
  };
  // Update the user document
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $push: { log: exercise } }
  );
  res.json({
    _id: id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
