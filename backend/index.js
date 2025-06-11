import { createServer } from "http";
import tracer from "tracer";
import imageRouter from "./app/routers/imageRouter.js";
import tagsRouter from "./app/routers/tagsRouter.js";
import filtersRouter from "./app/routers/filtersRouter.js";
import getImageRouter from "./app/routers/getImageRouter.js";
import userRouter from "./app/routers/userRouter.js";
import "dotenv/config";
import profileRouter from "./app/routers/profileRouter.js";
import { log } from "console";

const logger = tracer.colorConsole({
  format: "{{timestamp}} <{{title}}> (in {{file}}:{{line}}) {{message}} ",
});

const PORT = process.env.APP_PORT;
const server = createServer(async (req, res) => {
  // jsonController.convertTagsToJSON();
  logger.log(`${req.method} ${req.url}`);

  //images
  if (req.url.search("/api/photos") != -1) {
    await imageRouter(req, res);
  }

  //tags
  else if (req.url.search("/api/tags") != -1) {
    await tagsRouter(req, res);
  }

  //filters
  else if (req.url.search("/api/filters") != -1) {
    await filtersRouter(req, res);
  }
  //get image
  else if (req.url.search("/api/getImage") != -1) {
    await getImageRouter(req, res);
  }
  //users router
  else if (req.url.search("/api/user") != -1) {
    await userRouter(req, res);
  }
  // profiles
  else if (req.url.search("/api/profile") != -1) {
    await profileRouter(req, res);
  }
});

server.listen(PORT, () => {
  logger.log(`serwer startuje na porcie ${PORT}`);
});
