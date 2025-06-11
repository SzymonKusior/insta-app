import formidable from "formidable";
import path from "path";
import { writeFile, mkdir, readFile } from "fs/promises";
import fs from "fs";
import jsonController from "./jsonController.js";
import { Images } from "../model.js";

const __dirname = path.resolve();

const fileController = {
  uploadImage: async (req, res) => {
    const form = formidable({
      uploadDir: path.join(__dirname, "upload"),
      keepExtensions: true,
      multiples: false,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parsing error:", err);
        return res.writeHead(500).end("Upload failed");
      }

      try {
        const albumName = fields.album;

        // Create album directory inside upload folder
        const albumDir = path.join(__dirname, "upload", albumName);
        await mkdir(albumDir, { recursive: true });

        const fileName = files.file.path.split(path.sep).pop();
        const oldPath = files.file.path;
        const newPath = path.join(albumDir, fileName);

        // Copy file to new location
        const fileData = await readFile(oldPath);
        await writeFile(newPath, fileData);

        // Remove temp file
        fs.unlinkSync(oldPath);

        // Create file info for JSON controller
        const fileInfo = {
          id: Date.now(),
          originalName: files.file.name,
          url: `/upload/${albumName}/${fileName}`,
          albumName: albumName,
          fileName: fileName,
        };

        // Now handle JSON entry creation
        try {
          const jsonEntry = await jsonController.createImageEntry(fileInfo);
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify(jsonEntry));
        } catch (jsonError) {
          // If JSON creation fails, clean up the uploaded file
          await this.deleteImageFile(fileInfo.url);
          res.writeHead(500).end("Database entry creation failed");
        }
      } catch (error) {
        console.error("File processing error:", error);
        res.writeHead(500).end("File processing failed");
      }
    });
  },

  deleteImageFile: async (imagePath) => {
    try {
      const fullPath = path.join(__dirname, imagePath.replace(/^\//, ""));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("File deletion error:", error);
      return false;
    }
  },

  returnImage: async (req, res) => {
    try {
      const id = parseInt(req.url.split("/")[3]);

      const image = Images.find((img) => img.id === id);

      if (!image) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Image not found" }));
        return;
      }
      const imagePath = path.join(__dirname, image.url.replace(/^\//, ""));
      if (fs.existsSync(imagePath)) {
        console.log(image, "exists at", imagePath);

        res.writeHead(200, { "Content-Type": "image/jpeg" });
        const imageStream = fs.createReadStream(imagePath);
        imageStream.pipe(res);
      }
    } catch (error) {
      console.error("Error retrieving image:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to retrieve image" }));
    }
  },
  returnFilteredImage: async (req, res) => {
    try {
      const id = parseInt(req.url.split("/")[3]);
      const filterType = req.url.split("/")[5];

      const image = Images.find((img) => img.id === id);

      if (!image) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Image not found" }));
        return;
      }

      // Look for the filtered image in the history
      const filteredEntry = image.history.find(
        (entry) => entry.status === filterType
      );

      if (filteredEntry && filteredEntry.url) {
        // Use the URL from history if filtered image exists
        const filteredImagePath = path.join(
          __dirname,
          filteredEntry.url.replace(/^\//, "")
        );

        if (fs.existsSync(filteredImagePath)) {
          const stats = fs.statSync(filteredImagePath);
          const ext = path.extname(filteredImagePath).toLowerCase();

          let contentType = "image/jpeg";
          if (ext === ".png") contentType = "image/png";
          if (ext === ".gif") contentType = "image/gif";
          if (ext === ".webp") contentType = "image/webp";

          res.writeHead(200, {
            "Content-Type": contentType,
            "Content-Length": stats.size,
          });

          const imageStream = fs.createReadStream(filteredImagePath);
          imageStream.pipe(res);
          return;
        }
      }

      // If filtered image doesn't exist, return 404
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: `Filtered image with ${filterType} filter not found`,
        })
      );
    } catch (error) {
      console.error("Error retrieving filtered image:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to retrieve filtered image" }));
    }
  },
};
export default fileController;
