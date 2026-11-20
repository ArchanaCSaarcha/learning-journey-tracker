
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
   import authRoutes from "./routes/authRoutes.js";
import { protect } from "./middleware/authMiddleware.js";
import goalRoutes from "./routes/goalRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";


dotenv.config();

const app = express();


app.use(cors());
// Allow a small PDF attachment to be sent as part of a note.
app.use(express.json({ limit: "7mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/subjects", subjectRoutes);
app.get("/api/protected", protect, (req, res) => {
  res.status(200).json({
    message: "You accessed a protected route successfully!",
    user: req.user,
  });
});

app.get("/", (req, res) => {
  res.send("Personal Learning Journey Tracker API is running!");
});

app.use("/api/tasks", taskRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/notes", noteRoutes);

export default app;
