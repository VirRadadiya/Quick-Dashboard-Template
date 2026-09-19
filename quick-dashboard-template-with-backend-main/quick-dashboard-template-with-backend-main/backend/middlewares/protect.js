// @file server/middlewares/protect.js
import { verifyToken, createClerkClient } from "@clerk/backend";
import { v4 as uuid } from "uuid";
import userModel from "../database/models/user.js";
import { generateSalt, generatePassword } from "../utils/index.js";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Lazily sync a Clerk user into our MongoDB the first time they hit the backend.
async function getOrSyncUser(clerkUser) {
  const email =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ?? "";

  let user = await userModel.findOne({ email });
  if (user) return user;

  // First-ever request from this Clerk user — create a local record.
  const salt = await generateSalt();
  const password = await generatePassword(uuid(), salt); // random, never used directly

  user = await userModel.create({
    userId: uuid(),
    email,
    firstName: clerkUser.firstName ?? "",
    lastName: clerkUser.lastName ?? "",
    salt,
    password,
    isVerified: true,
    role: clerkUser.publicMetadata?.role ?? "user",
  });

  return user;
}

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.slice(7);

    // Verify the Clerk JWT (checks signature + expiry via JWKS).
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Fetch the full Clerk user profile.
    const clerkUser = await clerk.users.getUser(payload.sub);

    // Sync into MongoDB and attach to request.
    const user = await getOrSyncUser(clerkUser);
    req.user = {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      workspaceId: user.workspaceId ?? null,
      role: user.role,
    };

    return next();
  } catch (err) {
    console.error("[protect] auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default protect;
