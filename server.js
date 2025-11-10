const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Store connected users
const users = new Map();

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user registration
  socket.on('register', (username) => {
    users.set(socket.id, username);
    console.log(`User registered: ${username} (${socket.id})`);
    
    // Broadcast updated user list to all clients
    const userList = Array.from(users.values());
    io.emit('userList', userList);
  });

  // Handle sending messages
  socket.on('sendMessage', ({ from, to, message }) => {
    console.log(`Message from ${from} to ${to}: ${message}`);
    
    // Find the recipient's socket ID
    let recipientSocketId = null;
    for (const [socketId, username] of users.entries()) {
      if (username === to) {
        recipientSocketId = socketId;
        break;
      }
    }

    if (recipientSocketId) {
      // Send to specific user
      io.to(recipientSocketId).emit('receiveMessage', {
        from,
        to,
        message,
        timestamp: new Date().toLocaleTimeString()
      });
      
      // Also send confirmation back to sender
      socket.emit('messageSent', {
        from,
        to,
        message,
        timestamp: new Date().toLocaleTimeString()
      });
    } else {
      socket.emit('error', `User "${to}" is not online`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    console.log(`User disconnected: ${username} (${socket.id})`);
    
    // Broadcast updated user list
    const userList = Array.from(users.values());
    io.emit('userList', userList);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
