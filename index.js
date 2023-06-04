const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

//Connect to mongodb
const { MongoClient, ObjectId } = require("mongodb");
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
//check error middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Server Error");
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
  const duration = +req.body.duration;
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/;

  //validate date input
  if (req.body.date && !dateFormat.test(req.body.date)) {
    return res
      .status(400)
      .send({ error: "Invalid date format. Use 'yyyy-mm-dd'" });
  }
  const date = req.body.date ? new Date(req.body.date) : new Date();
  const collection = database.db("exercise_tracker").collection("users");

  try {
    //Use new ObjectId to turn id into object for comparison
    const user = await collection.findOne({ _id: new ObjectId(id) });

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
      { $push: { logs: exercise } }
    );

    res.json({
      _id: id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.get("/api/users/:_id/logs", async function (req, res) {
  const id = req.params._id;
  //query: from, to, limit
  const from = req.query.from ? new Date(req.query.from) : new Date(0);
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const limit = parseInt(req.query.limit, 10);
  const collection = database.db("exercise_tracker").collection("users");

  try {
    const user = await collection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(400).send({ error: "invalid user" });
    }

    // const logs = user.logs;
    // const count = user.logs.length;

    const fileredLogs = user.logs
      .filter((log) => {
        const logDate = new Date(log.date);
        return logDate >= from && logDate <= to;
      })
      .slice(0, limit);

    res.json({
      username: user.username,
      count: fileredLogs.length,
      _id: id,
      logs: fileredLogs,
    });
  } catch (err) {
    console.log(err);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
