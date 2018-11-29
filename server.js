const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const users = {};
let rooms = {};

app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/users", function(req, res) {
  res.send(users);
});

app.get("/rooms", function(req, res) {
  res.send(rooms);
});

app.get("/:roomid", function(req, res) {
  if (!rooms[req.params.roomid]) {
    res.send("No Such Room Exists");
  } else if (req.params.roomid && rooms[req.params.roomid].length === 2) {
    res.send("Room is at capacity");
  } else {
    res.sendFile(__dirname + "/public/room.html");
  }
});

app.post("/", function(req, res) {
  rooms[req.body.room] = [];
  res.send({ msg: `${req.body.room} has been created.` });
});

io.on("connection", function(socket) {
  socket.on("setSocketId", function(data) {
    const userId = socket.id;
    console.log(`User - ${socket.id} - connected to - ${data.room}`);

    rooms[data.room].push(userId);
    users[userId] = { room: data.room };
    if (rooms[data.room].length === 2) {
      console.log("call button");
      console.log(rooms[data.room]);
      socket.emit("call button");
      // rooms[data.room].forEach(id => {
      //   socket.to(id).emit("call button");
      // });
    }
  });

  socket.on("messages", function(data) {
    rooms[data.room].forEach(id => {
      socket.to(id).emit("messages", data.msg);
    });
  });

  socket.on("send-data", function(data) {
    data.dataObj["callerId"] = socket.id;
    rooms[data.room].forEach(id => {
      if (socket.id !== id) socket.to(id).emit("receive-data", data.dataObj);
    });
  });

  socket.on("disconnect", function() {
    if (!users[socket.id]) return;
    console.log(`a user disconnected : ${socket.id}`);
    rooms[users[socket.id].room] = rooms[users[socket.id].room].filter(
      id => id !== socket.id
    );

    for (var roomName in rooms) {
      if (rooms[roomName].length === 0) {
        delete rooms[roomName];
      }
    }
    delete users[socket.id];
  });
});

const port = process.env.PORT || 8080;

http.listen(port, () => console.log(`server running on port ${port}`));