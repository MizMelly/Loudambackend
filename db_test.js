const mysql = require("mysql2/promise");
require("dotenv").config();

async function testConnection() {
  console.log("🔍 Testing MySQL connection...");

  console.log("Host:", process.env.DB_HOST);
  console.log("User:", process.env.DB_USER);
  console.log("Database:", process.env.DB_NAME);
  console.log("Port:", process.env.DB_PORT || 3306);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      connectTimeout: 10000,
    });

    console.log("✅ Connected to MySQL successfully!");

    const [rows] = await connection.query("SELECT 1 AS test");
    console.log("🧪 Test query result:", rows);

    await connection.end();
    console.log("🔌 Connection closed");
  } catch (error) {
    console.error("❌ Connection failed!");
    console.error("Code:", error.code);
    console.error("Fatal:", error.fatal);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
  }
}

testConnection();