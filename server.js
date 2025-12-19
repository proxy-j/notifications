const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// NEW: This line tells the server to look in 'public' for HTML/CSS/JS files
app.use(express.static('public')); 

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('chat message', (msg) => {
    socket.broadcast.emit('chat message', msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
