const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

//middleware
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public"));

//mongoose connection
const mongoose = require("mongoose");
const mongooseURI = process.env["MongooseURI"];
mongoose.connect(mongooseURI);

//Schemas
const schema = new mongoose.Schema({
  username: { type: String, require: true },
  log: [],
});

let newUserModel = mongoose.model("newUser", schema);

//home
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

/*test case 1 : new user registration*/

/*
to register new user:
*/
app.post(`/api/users`, (req, res) => {
  newuser = req.body.username;
  newUserModel.findOne({ username: newuser }, (err, data) => {
    if (err) throw err;
    if (!data) {
      let newUserDoc = new newUserModel({ username: newuser });
      newUserDoc.save((err, data) => {
        if (err) throw err;
        res.json({ username: data.username, _id: data._id });
        // console.log(`this is the data id in /api/users :\n ${data._id}`);
        return data;
      });
    }
    //if the id already exist , find it and response
    else {
      newUserModel.findOne({ username: newuser }, (err, data) => {
        if (err) throw err;
        res.json({ username: data.username, _id: data._id });
      });
    }
  });
});

/*
to get all users;
*/
app.get(`/api/users`, (req, res) => {
  newUserModel.find({}, (err, data) => {
    if (err) throw err;
    let json = [];
    let index = data.length;
    for (let i = 0; i < index; i++) {
      json.push({ username: data[i].username, _id: data[i]._id });
    }
    res.send(json);
  });
});

/*
 * test case 2 : excercise
 */
//post method to save new exercises
app.post(`/api/users/:_id/exercises`, (req, res) => {
  let id = req.body[`:_id`];
  let description = req.body.description;
  let duration = parseInt(req.body.duration);
  let date;
  let rawdate = req.body.date;
  if (!rawdate) {
    let newdate = new Date()
      .toString()
      .match(/^(\w+)(\s)(\w+)(\s)(\d+)(\s)(\d+)/gi);
    date = newdate[0];
  } else {
    let newdate = new Date(rawdate)
      .toString()
      .match(/^(\w+)(\s)(\w+)(\s)(\d+)(\s)(\d+)/gi);
    date = newdate[0];
  }

  let update = { description: description, duration: duration, date: date };

  newUserModel.findOne({ _id: id }, (err, data) => {
    if (err) throw err;
    if (!data) {
      res.json({ error: "no user found with this ID" });
    } else {
      data.log.push(update);

      data.save((err, data) => {
        if (err) throw err;
        console.log(data);
        let index = data.log.length;
        res.json({
          username: data.username,
          description: data.log[index - 1].description,
          duration: data.log[index - 1].duration,
          date: data.log[index - 1].date,
          _id: data._id,
        });
      });
    }
  });
});

//get to display all exercises
app.get(`/api/users/:id/logs`, (req, res) => {
  let from = new Date(0).getTime();
  let to = new Date().getTime();
  let limit = req.query.limit;
  let id = req.params.id;
  if (req.query.from) {
    from = new Date(req.query.from).getTime();
  }
  if (req.query.to) {
    to = new Date(req.query.to).getTime();
  }
  if (limit) {
    limit = parseInt(limit);
  }

  newUserModel.findById(id, (err, data) => {
    if (err) throw err;
    let count = data.log.length;

    let arr = data.log.filter((user) => {
      if (
        new Date(user.date).getTime() < to &&
        new Date(user.date).getTime() > from
      ) {
        return true;
      }
    });
    let finalArr = [];
    if (limit) {
      for (let i = 0; i < limit; i++) {
        if (arr[i]) {
          finalArr.push(arr[i]);
        }
      }
    }
    if (req.query.from || req.query.to || req.query.limit) {
      res.json({
        _id: id,
        username: data.username,
        from: new Date(from).toUTCString(),
        to: new Date(to).toUTCString(),
        count: limit,
        log: finalArr,
      });
    } else {
      res.json({
        _id: id,
        username: data.username,
        count: count,
        log: data.log,
      });
    }
  });
});



//listner
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
