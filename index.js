const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const cors = require("cors")
const app = express();
app.use(cors())
const server = createServer(app);
const io = new Server(server, {
 cors:{
  origin:"http://localhost:5173"
 }
}); 
io.on('connection', (socket) => {
  console.log(`Client connected `);
  socket.on('disconnect', () => {
    console.log(`Client disconnected`);
  });

  socket.on('collab code',  (data) => { //listening to chat message event
    
    // include the offset with the message
    // console.log(data)
    socket.to(data.room).emit('receive code', data.code); // those user are there in the room where this client who sent the code is there, send them all the message.
  });
  socket.on("join room",(data)=>{
    console.log(data)
    socket.join(data)
  })
});

server.listen(3001, () => {
  console.log('server running at http://localhost:3001');
});