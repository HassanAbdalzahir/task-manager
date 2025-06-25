const jwt = require("jsonwebtoken");

const managerData = {
  userId: "685b48f2bbb692a2b1d47348",
  email: "hassan@nano2.com",
  role: "Manager",
  workspaceId: "685b4644c5b40353f3cfaaed",
};

const token = jwt.sign(
  managerData,
  "your-super-secret-jwt-key-change-in-production",
  {
    expiresIn: "7d",
  }
);

console.log("Manager Token:");
console.log(token);
console.log("\nTest command:");
console.log(
  `curl -H "Authorization: Bearer ${token}" http://localhost:3100/api/users/subordinates`
);
