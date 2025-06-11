import { Tag, Image, Images, tagsJson } from "../model.js";
import path from "path";
import fileController from "./fileController.js";
const __dirname = path.resolve();
// const dataPath = path.join(__dirname, "data.json");

const jsonController = {
  // Get all images
  getImages: async (req, res) => {
    try {
      if (Images.length === 0) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "no images found" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(Images));
    } catch (error) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to retrieve images" }));
    }
  },

  // Get single image by ID
  getImage: async (req, res) => {
    try {
      const id = parseInt(req.url.split("/")[3]);

      const image = Images.find((img) => img.id === id);

      if (image) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(image));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "image not found" }));
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Server error" }));
    }
  },

  // Create new image entry (called after file upload)
  createImageEntry: async (fileInfo) => {
    try {
      const { id, originalName, url, albumName } = fileInfo;
      const lastChange = "original";
      const history = [
        {
          status: "original",
          timestamp: id,
        },
      ];

      const image = new Image(id, originalName, url, lastChange, history);
      Images.push(image);

      return image;
    } catch (error) {
      throw new Error("Failed to create image entry");
    }
  },

  // Delete image
  deleteImage: async (req, res) => {
    try {
      const id = parseInt(req.url.split("/")[3]);
      console.log(req.url.split("/"));

      const imageIndex = Images.findIndex((img) => img.id === id);

      if (imageIndex === -1) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Image with ID ${id} not found` }));
        return;
      }

      const image = Images[imageIndex];

      // Delete physical file
      const fileDeleted = await fileController.deleteImageFile(image.url);

      // Remove from JSON array
      Images.splice(imageIndex, 1);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: fileDeleted,
          message: `Image with id ${id} deleted successfully`,
        })
      );
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Server error" }));
    }
  },

  // Update image
  updateImage: async (req, res) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        console.log("body", body);
        const updateData = JSON.parse(body);
        console.log(updateData);

        const { id, status } = updateData;

        if (!id || !status) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "ID and status are required" }));
          return;
        }

        // let images = JSON.parse(data);

        const imageIndex = Images.findIndex((img) => img.id === id);

        if (imageIndex === -1) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Image not found" }));
          return;
        }

        // Update image properties
        const image = Images[imageIndex];
        const timestamp = Date.now();

        // Update lastChange
        image.lastChange = status;

        // Add new entry to history
        image.history.push({
          status: status,
          timestamp: timestamp,
        });

        Images[imageIndex] = image;

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(image));
      } catch (error) {
        console.error("Update error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server error" }));
      }
    });
  },

  // PATCH /api/photos/tags - update image tags
  updateImageTags: async (req, res) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { photoId, tags } = JSON.parse(body);

        if (!photoId || !Array.isArray(tags)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: "PhotoId and tags array are required",
            })
          );
          return;
        }

        const imageIndex = Images.findIndex((img) => img.id == photoId);

        if (imageIndex === -1) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Photo not found" }));
          return;
        }

        const image = Images[imageIndex];

        // Initialize tags array if it doesn't exist
        if (!image.tags) {
          image.tags = [];
        }

        // Add tags that aren't already present
        tags.forEach((tag) => {
          if (tag.name) {
            const existingTag = image.tags.find((t) => t.name === tag.name);
            if (!existingTag) {
              image.tags.push({ name: tag.name });
            }
          }
        });

        Images[imageIndex] = image;

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, image: image }));
      } catch (error) {
        console.error("Update image tags error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Server error" }));
      }
    });
  },

  // GET /api/photos/tags/:photoId - get tags for specific photo
  getImageTags: async (req, res) => {
    try {
      const photoId = parseInt(req.url.split("/")[4]);

      const image = Images.find((img) => img.id === photoId);

      if (!image) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Photo not found" }));
        return;
      }

      const result = {
        id: image.id,
        tags: image.tags || [],
      };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (error) {
      console.error("Get image tags error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "Server error" }));
    }
  },
};

export default jsonController;
