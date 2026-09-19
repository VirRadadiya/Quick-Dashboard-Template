// @file server/middlewares/isAdmin.js
import { verifyToken, createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.slice(7);
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const clerkUser = await clerk.users.getUser(payload.sub);

    if (clerkUser.publicMetadata?.role !== "admin") {
      return res.status(403).json({ message: "Not Authorized" });
    }

    if (!req.user) {
      req.user = {
        userId: clerkUser.id,
        email:
          clerkUser.emailAddresses.find(
            (e) => e.id === clerkUser.primaryEmailAddressId
          )?.emailAddress ?? "",
        role: "admin",
      };
    }

    return next();
  } catch (err) {
    console.error("[isAdmin] auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default isAdmin;
