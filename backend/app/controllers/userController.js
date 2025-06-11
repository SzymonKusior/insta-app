import { hash, compare } from "bcryptjs";
import { User, Users } from "../model.js";
import jsonwebtoken from "jsonwebtoken";
const { sign, verify } = jsonwebtoken;
import "dotenv/config";
const JWT_SECRET = process.env.JWT_SECRET;
import { tokenBlacklist } from "./profileController.js";

const userController = {
  register: async (req, res) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { name, lastName, email, password } = JSON.parse(body);

        if (!name || !lastName || !email || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "All fields are required" }));
          return;
        }

        const existingUser = Users.find((user) => user.email === email);
        if (existingUser) {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: "User with this email already exists" })
          );
          return;
        }

        const hashedPassword = await userController.hashPassword(password);
        const userId = Date.now();

        new User(userId, name, lastName, email, hashedPassword);

        const token = userController.createToken(userId, email);

        res.writeHead(201, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`Skopiuj poniższy link do przeglądarki
http://localhost:3000/api/user/confirm/${token}
w celu potwierdzenia konta
Uwaga: link jest ważny przez godzinę`);
      } catch (error) {
        console.error("Registration error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });
  },

  confirm: async (req, res) => {
    try {
      const token = req.url.split("/")[4];

      if (!token) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Token is required" }));
        return;
      }

      const decoded = userController.verifyToken(token);

      if (!decoded) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid or expired token" }));
        return;
      }

      const user = Users.find((u) => u.id === decoded.userId);

      if (!user) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "User not found" }));
        return;
      }

      if (user.confirmed) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "User already confirmed" }));
        return;
      }

      user.confirmed = true;
      console.log("User confirmed:", user);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "User confirmed successfully",
          user: user,
        })
      );
    } catch (error) {
      console.error("Confirmation error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  },
  login: async (req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { email, password } = JSON.parse(body);

        if (!email || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Email and password are required" }));
          return;
        }

        const user = Users.find((u) => u.email === email);

        if (!user) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid email or password" }));
          return;
        }

        if (!user.confirmed) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: "Please confirm your account first" })
          );
          return;
        }

        const isPasswordValid = await userController.comparePassword(
          password,
          user.password
        );

        if (!isPasswordValid) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid email or password" }));
          return;
        }

        // Create new token
        const token = userController.createToken(user.id, user.email);

        // Set Authorization header
        res.setHeader("Authorization", "Bearer " + token);

        // Send response with token
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Login successful",
            token: token,
            user: {
              id: user.id,
              name: user.name,
              lastName: user.lastName,
              email: user.email,
              confirmed: user.confirmed,
            },
          })
        );
      } catch (error) {
        console.error("Login error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });
  },

  getAllUsers: async (req, res) => {
    try {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(Users));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  },
  hashPassword: async (password) => {
    if (!password) {
      throw new Error("Password is required");
    }
    return await hash(password, 10);
  },

  createToken: (userId, email) => {
    const token = sign(
      {
        userId: userId,
        email: email,
      },
      JWT_SECRET,
      {
        expiresIn: "1h", // 1 hour
      }
    );
    return token;
  },

  verifyToken: (token) => {
    try {
      const decoded = verify(token, JWT_SECRET);
      return decoded;
    } catch (ex) {
      console.log("Token verification failed:", ex.message);
      return null;
    }
  },

  // Enhanced token verification that checks blacklist
  verifyTokenWithBlacklist: (token) => {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      console.log("Token is blacklisted");
      return null;
    }

    // Verify token normally
    return userController.verifyToken(token);
  },

  // Helper method for testing tokens
  processToken: () => {
    const token = userController.createToken(123, "test@example.com");
    console.log("Created token:", token);

    setTimeout(() => {
      const decoded = userController.verifyToken(token);
      console.log("Decoded token:", decoded);
    }, 1000);
  },
  comparePassword: async (plainPassword, hashedPassword) => {
    try {
      return await compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error("Password comparison error:", error);
      return false;
    }
  },
};

export default userController;
