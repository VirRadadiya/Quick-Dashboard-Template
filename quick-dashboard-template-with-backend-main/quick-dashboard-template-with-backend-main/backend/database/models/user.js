// @file server/database/models/user.js
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      default: uuid,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,

      trim: true,
    },
    // userName: {
    //   type: String,
    //   required: true,
    //   unique: true,
    //   trim: true,
    //   lowercase: true,
    //   index: true,
    //   match: [
    //     /^[a-zA-Z0-9_.]+$/,
    //     "Username can only contain letters, numbers, periods, and underscores",
    //   ],
    // },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Invalid email format"],
    },
    salt: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      maxlength: 160,
      default: "",
    },
    profileImageUrl: {
      type: String,
      default: "default_profile_image_url",
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    favorites: {
      type: [String], // array of rentalId strings
      default: [],
    },
    workspaceId: {
      type: String,
      required: false,
      index: true,
    },
    // Onboarding status
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    onboardingCompletedAt: {
      type: Date,
      default: null,
    },
    notificationPrefs: {
      productUpdates: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
      marketing:      { type: Boolean, default: false },
      weeklyDigest:   { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform(doc, ret) {
        return ret;
      },
    },
  }
);
const userModel = mongoose.model("userDetails", userSchema);
export default userModel;
