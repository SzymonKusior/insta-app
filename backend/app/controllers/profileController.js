import userController from "./userController.js";
import { Users } from "../model.js";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import formidable from "formidable";

// Add blacklist array to store invalidated tokens
const tokenBlacklist = new Set();

const profileController = {
  // Helper function for token authorization
  authorizeToken: (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      console.log("Attempted use of blacklisted token");
      return null;
    }

    const decoded = userController.verifyToken(token);
    if (!decoded) {
      return null;
    }

    const user = Users.find((u) => u.id === decoded.userId);
    return user;
  },

  getProfile: (req, res) => {
    const user = profileController.authorizeToken(req);
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    // Return user profile data (without password)
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "User profile retrieved successfully",
        user: user,
      })
    );
  },

  updateProfile: (req, res) => {
    const user = profileController.authorizeToken(req);
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { name, lastName } = JSON.parse(body);

        if (name) user.name = name;
        if (lastName) user.lastName = lastName;

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message: "Profile updated successfully",
            user: user,
          })
        );
      } catch (error) {
        console.error("Update profile error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });
  },

  uploadProfilePicture: (req, res) => {
    const user = profileController.authorizeToken(req);
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    const profileDir = path.join(
      path.resolve(),
      "upload",
      user.email,
      "profile"
    );

    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    const form = formidable({
      uploadDir: profileDir,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error parsing form data" }));
        return;
      }

      try {
        console.log("Files object:", files); // Debug log

        // Get the uploaded file - handle different formidable versions
        let file = files.file;
        if (Array.isArray(file)) {
          file = file[0];
        }

        if (!file) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No file uploaded" }));
          return;
        }

        console.log("File object:", file); // Debug log

        // Try different property names for file path in order of likelihood
        let filePath = file.path;
        console.log("filepath:", filePath);

        // If no direct path, try to construct from newFilename
        // ?
        if (!filePath && file.newFilename) {
          filePath = path.join(profileDir, file.newFilename);
        }

        // Last resort: try originalFilename with timestamp
        if (!filePath && file.originalFilename) {
          const timestamp = Date.now();
          const ext = path.extname(file.originalFilename);
          filePath = path.join(profileDir, `${timestamp}${ext}`);
        }

        console.log("File path:", filePath); // Debug log
        console.log("File exists:", filePath ? fs.existsSync(filePath) : false);

        // Additional check: if file path exists but file doesn't, list directory contents
        if (!filePath || !fs.existsSync(filePath)) {
          console.log("Directory contents:", fs.readdirSync(profileDir));

          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "File not found after upload",
              debug: {
                filePath,
                fileExists: filePath ? fs.existsSync(filePath) : false,
                directoryContents: fs.readdirSync(profileDir),
                fileObject: Object.keys(file),
              },
            })
          );
          return;
        }

        // Process images using the uploaded file
        await profileController.processProfileImages(filePath, user.email);

        // List processed images
        const processedFiles = [
          "profile.png",
          "profile-cropped-square.png",
          "profile-cropped-rounded.png",
          "profile-cropped-with-border.png",
          "profile-cropped-square-with-gradient.png",
          "profile-cropped-square-with-letters.png",
          "profile-cropped-square-with-pattern.png",
        ];
        const processedImages = processedFiles.map(
          (fname) => `/upload/${user.email}/profile/${fname}`
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Profile picture uploaded and processed successfully",
            processedImages,
          })
        );
      } catch (error) {
        console.error("Upload profile picture error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });
  },

  processProfileImages: async (inputPath, userEmail) => {
    const squareSize = 200;
    const strokeWidth = 10;

    // Use user-specific profile directory
    const profileDir = path.join(
      path.resolve(),
      "upload",
      userEmail,
      "profile"
    );
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    try {
      // Save original as profile.png
      await sharp(inputPath).toFile(path.join(profileDir, `profile.png`));

      // Get image metadata
      const metadata = await sharp(inputPath).metadata();
      const { width, height } = metadata;

      // Calculate square crop
      const cropSize = Math.min(width, height);
      const left = Math.floor((width - cropSize) / 2);
      const top = Math.floor((height - cropSize) / 2);

      // 1. Simple square-cropped version (just the crop without effects)
      await sharp(inputPath)
        .extract({ left, top, width: cropSize, height: cropSize })
        .resize(squareSize, squareSize)
        .toFile(path.join(profileDir, `profile-cropped-square.png`));

      // 2. Cropped rounded
      const roundedCorners = Buffer.from(
        `<svg><rect x="0" y="0" width="${squareSize}" height="${squareSize}" rx="${
          squareSize / 2
        }" ry="${squareSize / 2}"/></svg>`
      );
      await sharp(inputPath)
        .extract({ left, top, width: cropSize, height: cropSize })
        .resize(squareSize, squareSize)
        .composite([{ input: roundedCorners, blend: "dest-in" }])
        .toFile(path.join(profileDir, `profile-cropped-rounded.png`));

      // 2. Cropped with yellow border (circular)
      const tempCirclePath = path.join(
        profileDir,
        `profile-cropped-temp-circle.png`
      );
      await sharp(inputPath)
        .extract({ left, top, width: cropSize, height: cropSize })
        .resize(squareSize, squareSize)
        .composite([{ input: roundedCorners, blend: "dest-in" }])
        .toFile(tempCirclePath);

      const borderRadius = squareSize / 2 - strokeWidth / 2;
      const yellowBorderSvgBuffer = Buffer.from(
        `<svg width="${squareSize}" height="${squareSize}">
          <circle cx="${squareSize / 2}" cy="${
          squareSize / 2
        }" r="${borderRadius}" fill="none" stroke="yellow" stroke-width="${strokeWidth}"/>
        </svg>`
      );
      await sharp(tempCirclePath)
        .composite([{ input: yellowBorderSvgBuffer, blend: "over" }])
        .toFile(path.join(profileDir, `profile-cropped-with-border.png`));
      fs.unlinkSync(tempCirclePath);

      // 3. Cropped square with gradient (not rounded)
      const gradientSvg = Buffer.from(
        `<svg width="${squareSize}" height="${squareSize}">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#f00"/>
              <stop offset="100%" stop-color="#00f"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="${squareSize}" height="${squareSize}" fill="url(#gradient)" />
        </svg>`
      );
      await sharp(inputPath)
        .extract({ left, top, width: cropSize, height: cropSize })
        .resize(squareSize, squareSize)
        .composite([{ input: gradientSvg, blend: "over" }])
        .toFile(
          path.join(profileDir, `profile-cropped-square-with-gradient.png`)
        );

      // 4. Cropped square with centered letters
      const fontSize = Math.floor(squareSize * 0.3);
      const textColor = "yellow";
      const fontFamily = "Arial, sans-serif";
      const letterSvgBuffer = Buffer.from(
        `<svg width="${squareSize}" height="${squareSize}" viewBox="0 0 ${squareSize} ${squareSize}">
          <rect x="0" y="0" width="100%" height="100%" fill="rgba(255,0,0,0.5)"/>
          <text
            x="50%" y="50%"
            dominant-baseline="middle"
            text-anchor="middle"
            font-family="${fontFamily}"
            font-size="${fontSize}"
            fill="${textColor}"
          >OK</text>
        </svg>`
      );
      await sharp(inputPath)
        .extract({ left, top, width: cropSize, height: cropSize })
        .resize(squareSize, squareSize)
        .composite([{ input: letterSvgBuffer, blend: "over" }])
        .toFile(
          path.join(profileDir, `profile-cropped-square-with-letters.png`)
        );

      // 5. Cropped square with pattern
      const patternSvg = Buffer.from(
        `<svg width="${squareSize}" height="${squareSize}">
          <defs>
            <pattern id="stripes" width="10" height="20" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="white" />
              <rect y="10" width="10" height="10" fill="black" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="${squareSize}" height="${squareSize}" fill="url(#stripes)" />
        </svg>`
      );
      await sharp(inputPath)
        .extract({ left, top, width: cropSize, height: cropSize })
        .resize(squareSize, squareSize)
        .composite([{ input: patternSvg, blend: "overlay" }])
        .toFile(
          path.join(profileDir, `profile-cropped-square-with-pattern.png`)
        );

      // 6. Cropped square with circular gradient border
      // Create a circular gradient SVG overlay
      const borderWidth = 10; // thickness of the border
      const radius = squareSize / 2 - borderWidth / 2;
      const gradientCircleSvg = Buffer.from(
        `<svg width="${squareSize}" height="${squareSize}" viewBox="0 0 ${squareSize} ${squareSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="borderGradient" x1="0" y1="0" x2="${squareSize}" y2="0" gradientUnits="userSpaceOnUse">
        <stop stop-color="#f00"/>
        <stop offset="1" stop-color="#00f"/>
      </linearGradient>
    </defs>
    <circle cx="${squareSize / 2}" cy="${
          squareSize / 2
        }" r="${radius}" stroke="url(#borderGradient)" stroke-width="${borderWidth}" fill="none"/>
  </svg>`
      );

      // Compose the square image with the circular gradient border overlay
      await sharp(inputPath)
        .extract({ left, top, width: cropSize, height: cropSize })
        .resize(squareSize, squareSize)
        .composite([{ input: gradientCircleSvg, blend: "over" }])
        .toFile(
          path.join(profileDir, `profile-cropped-square-with-gradient.png`)
        );
      // Delete the original uploaded image at inputPath
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }
    } catch (error) {
      console.error("Image processing error:", error);
      throw error;
    }
  },

  logout: (req, res) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No token provided" }));
        return;
      }

      const token = authHeader.split(" ")[1];

      // Verify token is valid before blacklisting
      const decoded = userController.verifyToken(token);
      if (!decoded) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid token" }));
        return;
      }

      // Add token to blacklist
      tokenBlacklist.add(token);

      console.log(
        `Token blacklisted for user ${decoded.email}:`,
        token.substring(0, 20) + "..."
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "User logged out successfully. Token has been invalidated.",
          instruction: "Please remove token from client storage.",
        })
      );
    } catch (error) {
      console.error("Logout error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  },

  // Method to check if token is blacklisted (for other controllers)
  isTokenBlacklisted: (token) => {
    return tokenBlacklist.has(token);
  },

  // Optional: Clean up expired tokens from blacklist
  cleanupBlacklist: () => {
    tokenBlacklist.forEach((token) => {
      try {
        const decoded = userController.verifyToken(token);
        // If token verification fails (expired), remove from blacklist
        if (!decoded) {
          tokenBlacklist.delete(token);
        }
      } catch (error) {
        // Token is expired or invalid, remove from blacklist
        tokenBlacklist.delete(token);
      }
    });

    console.log(`Blacklist cleaned. Current size: ${tokenBlacklist.size}`);
  },

  setProfilePicture: (req, res) => {
    const user = profileController.authorizeToken(req);
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { profilePicture } = JSON.parse(body);
        if (!profilePicture) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No profile picture specified" }));
          return;
        }
        user.profilePicture = profilePicture;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, profilePicture }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });
  },

  getProfileImages: (req, res) => {
    const user = profileController.authorizeToken(req);
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    const profileDir = path.join(
      path.resolve(),
      "upload",
      user.email,
      "profile"
    );

    try {
      if (!fs.existsSync(profileDir)) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ images: [] }));
        return;
      }
      const files = fs
        .readdirSync(profileDir)
        .filter((f) => /\.(png|jpg|jpeg|gif)$/i.test(f))
        .map((f) => `/upload/${user.email}/profile/${f}`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ images: files }));
    } catch (error) {
      console.error("Error listing profile images:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  },
};

// Optional: Set up periodic cleanup (every hour)
setInterval(() => {
  profileController.cleanupBlacklist();
}, 60 * 60 * 1000); // 1 hour

export { tokenBlacklist }; // Export for use in other controllers
export default profileController;
