import path from "path";
import { Tag, tagsRaw, tagsJson } from "../model.js";
const __dirname = path.resolve();

const tagsController = {
  // GET /api/tags/raw - get all tags without conversion
  getTagsRaw: async (req, res) => {
    try {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(tagsRaw));
    } catch (error) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify([]));
    }
  },

  // GET /api/tags - get all tags with object conversion
  getTags: async (req, res) => {
    try {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(tagsJson));
    } catch (error) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Error reading tags data" }));
    }
  },

  // GET /api/tags/:id - get single tag
  getTag: async (req, res) => {
    try {
      const id = parseInt(req.url.split("/")[3]);
      const tag = tagsJson.find((t) => t.id === id);

      if (tag) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(tag));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Tag not found" }));
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "Server error" }));
    }
  },

  // POST /api/tags - create new tag
  createTag: async (req, res) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { name } = JSON.parse(body);

        if (!name) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ success: false, error: "Name is required" })
          );
          return;
        }

        const id = tagsRaw.length + 1;
        const popularity = Math.floor(Math.random() * 1000);
        const newTag = new Tag(id, name, popularity);
        if (tagsRaw.includes(name)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ success: false, error: "Tag already exists" })
          );
          return;
        }
        tagsRaw.push(name);

        tagsJson.push(newTag);

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, tag: newTag }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Server error" }));
      }
    });
  },
};

export default tagsController;
