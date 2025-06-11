import tagsController from "../controllers/tagsController.js";

const tagsRouter = (req, res) => {
  if (req.url === "/api/tags/raw" && req.method === "GET") {
    tagsController.getTagsRaw(req, res);
  } else if (req.url === "/api/tags" && req.method === "GET") {
    tagsController.getTags(req, res);
  } else if (req.url.match(/\/api\/tags\/([0-9]+)/) && req.method === "GET") {
    tagsController.getTag(req, res);
  } else if (req.url === "/api/tags" && req.method === "POST") {
    tagsController.createTag(req, res);
  }
};

export default tagsRouter;
