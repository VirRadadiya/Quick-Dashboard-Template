import isAdmin from "../middlewares/isAdmin.js";
import protect from "../middlewares/protect.js";
import authService from "../services/auth-service.js";

const auth = (app) => {
  const service = new authService();

  app.get("/api/v1/auth/me", protect, async (req, res, next) => {
    try {
      const { status, ...rest } = await service.Me(req.user);
      return res.status(status).json({ ...rest });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/v1/auth/admin/me", isAdmin, async (req, res, next) => {
    try {
      const { status, ...rest } = await service.Me(req.user);
      return res.status(status).json({ ...rest });
    } catch (err) {
      next(err);
    }
  });
};

export default auth;
