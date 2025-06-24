const mongoose = require("mongoose");
require("dotenv").config();

// Test database connection
async function testConnection() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/task-manager"
    );
    console.log("✅ MongoDB connection successful");

    // Test basic operations
    const testUser = new mongoose.Schema({
      name: String,
      email: String,
      role: String,
    });

    const TestUser = mongoose.model("TestUser", testUser);

    // Create a test user
    const user = new TestUser({
      name: "Test User",
      email: "test@example.com",
      role: "Employee",
    });

    await user.save();
    console.log("✅ User creation successful");

    // Find the user
    const foundUser = await TestUser.findOne({ email: "test@example.com" });
    console.log("✅ User retrieval successful:", foundUser.name);

    // Clean up
    await TestUser.deleteOne({ email: "test@example.com" });
    console.log("✅ User deletion successful");

    await mongoose.disconnect();
    console.log("✅ Database disconnection successful");

    console.log("\n🎉 All basic tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testConnection();
