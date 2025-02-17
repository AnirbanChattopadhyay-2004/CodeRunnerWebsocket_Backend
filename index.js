const { createClient } = require("redis")
const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const cors = require("cors")


const app = express();
app.use(cors())
const server = createServer(app);
require('dotenv/config')
const url = process.env.url
const client = createClient ({
  url : process.env.redis_url,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000), // Exponential backoff
  },

});
async function connection(){
  await client.connect()
  client.on("error",(err)=>{console.log("Redis err",err)})
}
connection()
let room_val = {}
const io = new Server(server, {
 cors:{
  origin:url
 }
}); 
io.on('connection', (socket) => {
  console.log(`Client connected `);
  socket.on('disconnect', () => {
    console.log(`Client disconnected`);
  });

  socket.on('collab code',  (data) => { //listening to chat message event
    
    // include the offset with the message
    // console.log(data.code)
    room_val[data.room] = (data.code)
    socket.to(data.room).emit('receive code', data.code); // those user are there in the room where this client who sent the code is there, send them all the message.
  });
  socket.on("join room",async (data)=>{
    // console.log(data)
    // console.log("joined "+room_val[data])
    socket.join(data)
    // console.log("client data"+await client.get(data))
    const val = await client.get(data)
    if(!room_val[data])
      room_val[data] = JSON.stringify(val) === "{}"?"":val
    socket.emit("receive code",room_val[data]?room_val[data]:"")
  })
});

setInterval(()=>{
  Object.keys(room_val).forEach(async (key)=>{
    console.log(key)
    await client.set(key,room_val[key])
  })
},100000)

server.listen(3001, () => { 
  console.log('server running at http://localhost:3001');
});
 