const { createClient } = require("redis");
const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const cors = require("cors");
const { Redis } = require('@upstash/redis')
require('dotenv/config');
const url = process.env.url;
// const redisUrl = process.env.redis_url; // Make sure this is set to your Render Redis URL
const redisUrl = process.env.UPSTASH_REDIS_REST_URL; // Make sure this is set to your Render Redis URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN; // Make sure this is set to your Render Redis URL

const client = new Redis({
  url: redisUrl,
  token: redisToken,
})

const app = express();
app.use(cors());
const server = createServer(app);
(async ()=>{
  try {
    const pong = await client.ping();
    if (pong === "PONG") {
      console.log("✅ Redis is reachable");
    }
  } catch (err) {
    console.error("❌ Redis is NOT reachable:", err);
  }

})()
// --- Redis Client Setup ---
// const client = createClient({
//   url: redisUrl,
//   socket: {
//     reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
//   },
// });

// // Attach error listener immediately
// client.on("error", (err) => {
//   console.log("Redis Error:", err);
// });

// Use a self-invoking async function for top-level await
// (async () => {
//   try {
//     await client.connect();
//     console.log("Successfully connected to Redis.");
//   } catch (err) {
//     console.error("Failed to connect to Redis:", err);
//     process.exit(1); // Exit if Redis connection fails
//   }
// })();


// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: {
    origin: url,
  },
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Event for when a user sends new code
  socket.on('collab code', async (data) => {
    const { room, code } = data;
    
    // 1. Immediately save the latest code to Redis
    await client.set(room, code);
    
    // 2. Broadcast the new code to everyone else in the room
    socket.to(room).emit('receive code', code);
  });

  // Event for when a user joins a room
  socket.on("join room", async (roomName) => {
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
    
    // Fetch the current code state directly from Redis
    const currentCode = await client.get(roomName);
    
    // Send the latest code only to the client that just joined
    socket.emit("receive code", currentCode || ""); // Send empty string if room is new
  });
});

// No more setInterval needed!

server.listen(3001, () => {
  console.log('Server running at http://localhost:3001');
});