
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { readData, writeData } from "../config/data.js";
import { DATA_FILES } from "../config/constants.js";
import { createUser } from "../models/User.js";

export async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    const users = await readData(DATA_FILES.USERS);

    const existingUser = users.find(
      (user) => user.email.trim().toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = createUser(name, normalizedEmail, hashedPassword);

    users.push(newUser);
    await writeData(DATA_FILES.USERS, users);

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const users = await readData(DATA_FILES.USERS);

    const user = users.find(
      (user) => user.email.trim().toLowerCase() === normalizedEmail
    );

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
}
