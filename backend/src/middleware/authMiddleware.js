
import jwt from "jsonwebtoken";
import { User } from "../model/User.js";
import { RefreshToken } from "../model/refreshToken.js";
import {
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
} from "../controller/authController.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const accessToken = req.cookies?.access_token || bearerToken;

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);
        const user = await User.findById(decoded.userId);

        if (user) {
          req.user = user;
          return next();
        }
      } catch {
        // Access token expired or invalid; fall through to refresh token verification
      }
    }

    // Try transparent refresh via refresh token if available
    const refreshToken =
      req.cookies?.refresh_token ||
      req.headers["x-refresh-token"] ||
      (req.body && req.body.refreshToken);

    if (refreshToken) {
      try {
        const refreshDecoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN
        );

        const storedToken = await RefreshToken.findOne({
          token: refreshToken,
          user: refreshDecoded.userId,
          revoked: false,
          expiresAt: { $gt: new Date() },
        });

        if (storedToken) {
          const user = await User.findById(refreshDecoded.userId);

          if (user) {
            const newAccessToken = createAccessToken(user);
            const newRefreshToken = createRefreshToken(user);

            await RefreshToken.updateOne(
              { _id: storedToken._id },
              { $set: { revoked: true } }
            );

            await RefreshToken.create({
              user: user._id,
              token: newRefreshToken,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });

            setAuthCookies(res, newAccessToken, newRefreshToken);
            res.setHeader("x-access-token", newAccessToken);

            req.user = user;
            return next();
          }
        }
      } catch (refreshErr) {
        // Refresh token invalid or expired
      }
    }

    return res.status(401).json({
      success: false,
      message: "Authentication required. Session expired.",
    });
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};
