const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const { createRoom, joinRoom, removeUser, getRoomUsers } = require('./utils/roomManager');

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create-room", (callback) => {
    const code = createRoom(socket.id);
    socket.join(code);
    callback({ code });
  });

  socket.on("join-room", ({ code }, callback) => {
    const result = joinRoom(code, socket.id);
    if (result.error) {
      return callback(result);
    }
    
    socket.join(code);
    socket.to(code).emit("user-joined", { userId: socket.id });
    callback({ success: true, users: getRoomUsers(code) });
  });

  socket.on("signal", ({ to, signal }) => {
    io.to(to).emit("signal", { from: socket.id, signal });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const roomCode = removeUser(socket.id);
    if (roomCode) {
      io.to(roomCode).emit("user-left", { userId: socket.id });
    }
  });
});

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
