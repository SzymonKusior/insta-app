import userController from "../controllers/userController.js";

const usersRouter = async (req, res) => {
  if (req.method === "POST" && req.url === "/api/user/register") {
    await userController.register(req, res);
  } else if (req.method === "GET" && req.url.startsWith("/api/user/confirm/")) {
    await userController.confirm(req, res);
  } else if (req.method === "POST" && req.url === "/api/user/login") {
    await userController.login(req, res);
  } else if (req.method === "GET" && req.url === "/api/user") {
    await userController.getAllUsers(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
};

export default usersRouter;
