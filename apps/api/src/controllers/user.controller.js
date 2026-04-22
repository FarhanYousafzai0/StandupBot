import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { User, toPublicUser } from "../models/User.js";

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  res.json({ user: toPublicUser(user) });
});
