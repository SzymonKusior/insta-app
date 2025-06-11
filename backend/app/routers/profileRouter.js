import profileController from "../controllers/profileController.js";

const profileRouter = async (req, res) => {
  if (req.url === "/api/profile" && req.method === "GET") {
    await profileController.getProfile(req, res);
  } else if (req.url === "/api/profile" && req.method === "PATCH") {
    await profileController.updateProfile(req, res);
  } else if (req.url === "/api/profile" && req.method === "POST") {
    await profileController.uploadProfilePicture(req, res);
  } else if (req.url === "/api/profile/logout" && req.method === "GET") {
    await profileController.logout(req, res);
  } else if (req.url === "/api/profile/logout" && req.method === "POST") {
    await profileController.logout(req, res);
  }
};

export default profileRouter;
