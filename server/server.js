require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth.route");
const assistantRoutes = require("./routes/assistant.route");
const { requireAuth } = require("./middleware/auth.middleware");
const { testConnection } = require("./lib/supabase");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || "http://localhost:3000").split(","),
    credentials: true, // required so the browser sends/receives cookies cross-origin
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/assistant", assistantRoutes);

// Example protected route
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({ message: `Hello, ${req.user.email}. This is protected data.` });
});

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
async function start() {
  try {
    await testConnection();
    console.log("✅ Supabase connected");
  } catch (err) {
    console.error("❌ Failed to connect to Supabase:", err.message);
    process.exit(1); // don't start the server with a broken DB connection
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
