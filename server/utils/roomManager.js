const rooms = new Map();

const generateRoomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createRoom = (socketId) => {
  let code;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  rooms.set(code, {
    users: [socketId],
    files: []
  });

  return code;
};

const timeouts = new Map();

const joinRoom = (code, socketId) => {
  const room = rooms.get(code);
  if (!room) {
    return { error: 'Room not found' };
  }

  if (timeouts.has(code)) {
    clearTimeout(timeouts.get(code));
    timeouts.delete(code);
  }

  if (room.users.includes(socketId)) {
    return { success: true };
  }

  if (room.users.length >= 5) {
    return { error: 'Room is full' };
  }

  room.users.push(socketId);
  return { success: true };
};

const removeUser = (socketId) => {
  let roomCode = null;
  
  for (const [code, room] of rooms.entries()) {
    const index = room.users.indexOf(socketId);
    if (index !== -1) {
      room.users.splice(index, 1);
      roomCode = code;
      
      if (room.users.length === 0) {
        // Wait 10 seconds before deleting the room to allow for refreshes/reconnects
        const timeoutId = setTimeout(() => {
          if (rooms.has(code) && rooms.get(code).users.length === 0) {
            rooms.delete(code);
            timeouts.delete(code);
            console.log(`Room ${code} deleted due to inactivity`);
          }
        }, 10000);
        timeouts.set(code, timeoutId);
      }
      break;
    }
  }
  
  return roomCode;
};

const getRoomUsers = (code) => {
  const room = rooms.get(code);
  return room ? room.users : [];
};

module.exports = {
  createRoom,
  joinRoom,
  removeUser,
  getRoomUsers
};
