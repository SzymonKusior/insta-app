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
  } else if (req.url === "/api/profile/images" && req.method === "GET") {
    await profileController.getProfileImages(req, res);
  } else if (req.url === "/api/profile/picture" && req.method === "PATCH") {
    // Add this new route to handle profile picture updates
    await profileController.setProfilePicture(req, res);
  }
};

export default profileRouter;
