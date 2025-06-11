import fileController from "../controllers/fileController.js";

const getImageRouter = (req, res) => {
  if (
    req.url.match(
      /\/api\/getImage\/([0-9]+)\/filter\/(tint|crop|resize|rotate|flip|flop|grayscale)/
    ) &&
    req.method === "GET"
  ) {
    fileController.returnFilteredImage(req, res);
  } else if (
    req.url.match(/\/api\/getImage\/([0-9]+)/) &&
    req.method === "GET"
  ) {
    fileController.returnImage(req, res);
  }
};

export default getImageRouter;
