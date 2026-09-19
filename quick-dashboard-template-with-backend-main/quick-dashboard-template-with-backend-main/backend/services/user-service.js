import userRepository from "../database/repository/user-repository.js";
import { APIError, BadRequestError, STATUS_CODES, ValidationError } from "../utils/app-errors.js";

export default class userService {
  constructor() {
    this.repository = new userRepository();
  }

  async FetchUsers({ filters = {}, page = 1, limit = 20, sort = {}, excludeFields = ["password", "salt"] }) {
    try {
      const result = await this.repository.FetchUsers({ filters, page, limit, sort, excludeFields });
      if (!result?.data?.length) {
        return { message: "No users found.", status: 404 };
      }
      return {
        message: "Users fetched successfully!",
        status: 200,
        data: result.data,
        totalDocuments: result.totalDocuments,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      };
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      throw new APIError("Error fetching users", STATUS_CODES.INTERNAL_ERROR, err.message, false, err.stack);
    }
  }

  async FetchUserByUserId(id) {
    try {
      const user = await this.repository.FetchUserByUserId(id);
      if (!user) return { message: "User not found", status: 404 };
      return { message: "User found!", status: 200, user };
    } catch (err) {
      throw new APIError("Error fetching user", STATUS_CODES.INTERNAL_ERROR, err.message, false, err.stack);
    }
  }

  async UpdateUser(req, body) {
    try {
      const { user: existingUser } = await this.repository.FindUser({ email: req.user.email });
      if (!existingUser) return { message: "User not found.", status: 404 };

      const allowedFields = ["firstName", "middleName", "lastName", "DOB", "gender", "profileImageUrl"];
      const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowedFields.includes(k)));

      if (!Object.keys(updates).length) {
        return { message: "No valid fields provided for update.", status: 400 };
      }

      const updatedUser = await this.repository.UpdateUser(req.user.userId, updates);
      if (!updatedUser) return { message: "User not found", status: 404 };
      return { message: "User updated successfully!", status: 200, updatedUser };
    } catch (err) {
      throw new APIError("Error updating user", STATUS_CODES.INTERNAL_ERROR, err.message, false, err.stack);
    }
  }

  async DeleteUser(req) {
    try {
      const deleted = await this.repository.DeleteUser(req.user);
      if (!deleted) return { message: "Delete failed.", status: 400 };
      return { message: "User deleted successfully.", status: 200 };
    } catch (err) {
      throw new APIError("Error deleting user", STATUS_CODES.INTERNAL_ERROR, err.message, false, err.stack);
    }
  }

  async GetNotifPrefs(userId) {
    try {
      const prefs = await this.repository.getNotifPrefs(userId);
      return { status: 200, prefs: prefs ?? { productUpdates: true, securityAlerts: true, marketing: false, weeklyDigest: false } };
    } catch (err) {
      throw new APIError("Error fetching prefs", STATUS_CODES.INTERNAL_ERROR, err.message, false, err.stack);
    }
  }

  async UpdateNotifPrefs(userId, prefs) {
    try {
      const updated = await this.repository.updateNotifPrefs(userId, prefs);
      return { status: 200, prefs: updated };
    } catch (err) {
      throw new APIError("Error updating prefs", STATUS_CODES.INTERNAL_ERROR, err.message, false, err.stack);
    }
  }
}
