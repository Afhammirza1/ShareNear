const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL, /\.vercel\.app$/, /\.railway\.app$/]
    : "*",
  methods: ["GET", "POST"],
  credentials: true
};

app.use(cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'ShareNear Server', 
    version: '1.0.0',
    status: 'running'
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  maxHttpBufferSize: 1e8
});

const rooms = {};

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('create-room', (password, callback) => {
    let roomId;
    do {
        roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (rooms[roomId]);
    
    rooms[roomId] = { users: [socket.id], password: password, files: [] };
    socket.join(roomId);
    console.log(`Room ${roomId} created by ${socket.id}`);
    callback(roomId);
  });

  socket.on('join-room', (roomId, password, callback) => {
    const room = rooms[roomId];
    if (room && room.password === password) {
      room.users.push(socket.id);
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', { userId: socket.id, users: room.users });
      console.log(`${socket.id} joined room ${roomId}`);
      callback({ success: true, message: 'Joined room successfully', users: room.users });
    } else {
      callback({ success: false, message: 'Invalid room ID or password' });
    }
  });

  socket.on('offer', (data) => {
    socket.to(data.to).emit('offer', { sdp: data.sdp, from: socket.id });
  });

  socket.on('answer', (data) => {
    socket.to(data.to).emit('answer', { sdp: data.sdp, from: socket.id });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.to).emit('ice-candidate', { candidate: data.candidate, from: socket.id });
  });

  socket.on('file-meta', (data) => {
    socket.to(data.roomId).emit('file-meta', { metadata: data.metadata, from: socket.id });
  });

  socket.on('request-chunk', (data) => {
    socket.to(data.to).emit('request-chunk', { from: socket.id, fileName: data.fileName, index: data.index });
  });
  
  socket.on('chat-message', (data) => {
    socket.to(data.roomId).emit('chat-message', { message: data.message, from: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const index = room.users.indexOf(socket.id);
      if (index !== -1) {
        room.users.splice(index, 1);
        io.to(roomId).emit('user-left', socket.id);
        if (room.users.length === 0) {
          delete rooms[roomId];
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
