import isAdmin from "../middlewares/isAdmin.js";
import protect from "../middlewares/protect.js";
import userService from "../services/user-service.js";

const user = (app) => {
  const service = new userService();

  app.post("/api/v1/user/fetch-users", protect, isAdmin, async (req, res, next) => {
    try {
      const { status, ...rest } = await service.FetchUsers(req.body);
      return res.status(status).json({ ...rest });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/v1/user/fetch-user-by-id/:userId", protect, isAdmin, async (req, res, next) => {
    try {
      const { status, ...rest } = await service.FetchUserByUserId(req.params.userId);
      return res.status(status).json({ ...rest });
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/v1/user/update-user", protect, async (req, res, next) => {
    try {
      const { status, ...rest } = await service.UpdateUser(req, req.body);
      return res.status(status).json({ ...rest });
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/v1/user/delete-user", protect, async (req, res, next) => {
    try {
      const { status, ...rest } = await service.DeleteUser(req);
      return res.status(status).json({ ...rest });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/v1/user/notification-prefs", protect, async (req, res, next) => {
    try {
      const { status, ...rest } = await service.GetNotifPrefs(req.user.userId);
      return res.status(status).json({ ...rest });
    } catch (err) { next(err); }
  });

  app.patch("/api/v1/user/notification-prefs", protect, async (req, res, next) => {
    try {
      const { status, ...rest } = await service.UpdateNotifPrefs(req.user.userId, req.body);
      return res.status(status).json({ ...rest });
    } catch (err) { next(err); }
  });
};

export default user;
