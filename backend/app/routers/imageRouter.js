import fileController from "../controllers/fileController.js";
import jsonController from "../controllers/jsonController.js";

const imageRouter = async (req, res) => {
  if (req.url === "/api/photos" && req.method === "POST") {
    // Handle file upload first, then create JSON entry
    await fileController.uploadImage(req, res);
  } else if (req.url === "/api/photos" && req.method === "GET") {
    await jsonController.getImages(req, res);
  } else if (req.url.match(/\/api\/photos\/([0-9]+)/) && req.method === "GET") {
    await jsonController.getImage(req, res);
  } else if (
    req.url.match(/\/api\/photos\/([0-9]+)/) &&
    req.method === "DELETE"
  ) {
    await jsonController.deleteImage(req, res);
  } else if (req.url === "/api/photos" && req.method === "PATCH") {
    await jsonController.updateImage(req, res);
  } else if (req.url === "/api/photos/tags" && req.method === "PATCH") {
    await jsonController.updateImageTags(req, res);
  } else if (
    req.url.match(/\/api\/photos\/tags\/([0-9]+)/) &&
    req.method === "GET"
  ) {
    await jsonController.getImageTags(req, res);
  }
};

export default imageRouter;
