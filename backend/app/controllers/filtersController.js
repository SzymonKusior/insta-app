import sharp from "sharp";
import path from "path";
import { Images } from "../model.js"; // Assuming Images is an array of image objects

const __dirname = path.resolve();

const filtersController = {
  async getMetadata(req, res) {
    try {
      const id = req.url.split("/")[4];
      const image = Images.find((img) => img.id === parseInt(id));

      if (!image) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Image not found" }));
        return;
      }

      const server_image_path = path.join(
        __dirname,
        image.url.replace(/^\//, "")
      );

      const meta = await sharp(server_image_path).metadata();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, metadata: meta }));
    } catch (err) {
      console.error("Metadata error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ success: false, error: "Failed to get metadata" })
      );
    }
  },

  // PATCH /api/filters - apply any filter based on lastChange field
  async applyFilter(req, res) {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        console.log("Request body:", body);

        const requestData = JSON.parse(body);
        const { id, lastChange, ...filterParams } = requestData;

        if (!id || !lastChange) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: "Image ID and lastChange are required",
            })
          );
          return;
        }

        // Define filter operations
        const filterOperations = {
          tint: (sharp, params) => {
            const { r = 255, g = 255, b = 255 } = params;
            return sharp.tint({ r, g, b });
          },
          rotate: (sharp, params) => {
            const { angle = 90 } = params;
            return sharp.rotate(angle);
          },
          crop: (sharp, params) => {
            const { width, height, left = 0, top = 0 } = params;
            return sharp.extract({ width, height, left, top });
          },
          flip: (sharp) => {
            return sharp.flip();
          },
          flop: (sharp) => {
            return sharp.flop();
          },
          grayscale: (sharp) => {
            return sharp.greyscale();
          },
          resize: (sharp, params) => {
            const { width, height } = params;
            return sharp.resize(width, height);
          },
        };

        // Check if filter exists
        if (!filterOperations[lastChange]) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: `Filter '${lastChange}' is not supported`,
            })
          );
          return;
        }

        // Find image in database
        const imageIndex = Images.findIndex((img) => img.id === parseInt(id));

        if (imageIndex === -1) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Image not found" }));
          return;
        }

        const image = Images[imageIndex];

        // Get current image path
        const currentImagePath = path.join(
          __dirname,
          image.url.replace(/^\//, "")
        );

        // Create new filename with filter suffix
        const pathParts = image.url.split("/");
        const filename = pathParts[pathParts.length - 1];
        const [name, ext] = filename.split(".");
        const newFilename = `${name}-${lastChange}.${ext}`;
        const newPath = pathParts.slice(0, -1).concat(newFilename).join("/");
        const newServerPath = path.join(__dirname, newPath.replace(/^\//, ""));

        // Apply filter using Sharp
        let sharpInstance = sharp(currentImagePath);
        const filterOperation = filterOperations[lastChange];
        sharpInstance = filterOperation(sharpInstance, filterParams);

        await sharpInstance.toFile(newServerPath);

        // Update image object
        const timestamp = Date.now();
        // image.url = newPath.replace(/\\/g, "/");
        image.lastChange = lastChange;
        image.history.push({
          status: lastChange,
          timestamp: timestamp,
          url: newPath.replace(/\\/g, "/"),
        });

        Images[imageIndex] = image;

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, image: image }));
      } catch (error) {
        console.error("Filter application error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: "Failed to apply filter",
          })
        );
      }
    });
  },
};

export default filtersController;
