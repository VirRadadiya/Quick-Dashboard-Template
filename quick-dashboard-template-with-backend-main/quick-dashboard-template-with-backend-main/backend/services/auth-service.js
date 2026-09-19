import authRepository from "../database/repository/auth-repository.js";
import { APIError, STATUS_CODES } from "../utils/app-errors.js";

export default class authService {
  constructor() {
    this.repository = new authRepository();
  }

  async Me(user) {
    try {
      const { user: existingUser } = await this.repository.FindUser({ email: user.email });
      if (!existingUser) {
        return { message: "User not found", status: 404 };
      }
      return {
        message: "User is authenticated",
        status: 200,
        userId: existingUser.userId,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: existingUser.email,
        profileImageUrl: existingUser.profileImageUrl,
        role: existingUser.role,
      };
    } catch (err) {
      throw new APIError("Error fetching user", STATUS_CODES.INTERNAL_ERROR, err.message, false, err.stack);
    }
  }
}
