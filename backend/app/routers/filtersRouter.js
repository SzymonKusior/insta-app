import filtersController from "../controllers/filtersController.js";

const filtersRouter = (req, res) => {
  if (
    req.url.match(/\/api\/filters\/metadata\/([0-9]+)/) &&
    req.method === "GET"
  ) {
    filtersController.getMetadata(req, res);
  } else if (req.url.search("/api/filters" && req.method === "PATCH")) {
    filtersController.applyFilter(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
};

export default filtersRouter;
