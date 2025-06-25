const io = require("socket.io-client");

// Test socket connection
async function testSocket() {
  console.log("🔌 Testing Socket.io connection...");

  const socket = io("http://localhost:3100", {
    path: "/socket.io",
    auth: {
      token: "Bearer test-token",
    },
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("✅ Connected to Socket.io server");
    console.log("Socket ID:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected from Socket.io server");
  });

  socket.on("connect_error", (error) => {
    console.error("🔴 Connection error:", error.message);
  });

  // Test task events
  socket.on("task:assigned", (data) => {
    console.log("📋 Task assigned event received:", data);
  });

  socket.on("task:updated", (data) => {
    console.log("📝 Task updated event received:", data);
  });

  socket.on("task:completed", (data) => {
    console.log("✅ Task completed event received:", data);
  });

  socket.on("task:deadline", (data) => {
    console.log("⏰ Task deadline event received:", data);
  });

  socket.on("task:comment", (data) => {
    console.log("💬 Task comment event received:", data);
  });

  // Keep connection alive for 10 seconds
  setTimeout(() => {
    console.log("🔄 Disconnecting...");
    socket.disconnect();
    process.exit(0);
  }, 10000);
}

// Run the test
testSocket().catch(console.error);
