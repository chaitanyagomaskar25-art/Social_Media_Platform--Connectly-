
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { RefreshToken } from "../model/refreshToken.js";
import {User} from "../model/User.js"

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

const accessCookieOptions = {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  role: user.role || 'user',
  privateAccount: Boolean(user.privateAccount),
  notificationPreferences: user.notificationPreferences,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const createAccessToken = (user) =>
  jwt.sign(
    { userId: user._id.toString() },
    process.env.ACCESS_TOKEN,
    { expiresIn: "15m" }
  );

export const createRefreshToken = (user) =>
  jwt.sign(
    { userId: user._id.toString() },
    process.env.REFRESH_TOKEN,
    { expiresIn: "7d" }
  );

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("access_token", accessToken, accessCookieOptions);
  res.cookie("refresh_token", refreshToken, refreshCookieOptions);
};

export const clearAuthCookies = (res) => {
  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);
};

export const register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (
      ![name, username, email, password].every(
        (value) => typeof value === "string" && value.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, username, email, and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    });

    if (existingUser) {
      const field =
        existingUser.email === normalizedEmail ? "Email" : "Username";

      return res.status(409).json({
        success: false,
        message: `${field} is already registered.`,
      });
    }

    const user = await User.create({
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash: password,
      role: (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((address) => address.trim().toLowerCase())
        .includes(normalizedEmail) ? 'admin' : 'user',
    });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: publicUser(user),
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    // Unique indexes also protect against simultaneous duplicate requests.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or username is already registered.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash");

    // Keep the same message for both cases.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: publicUser(user),
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
};

export const getme = async (req, res) => {
  try {
    const accessToken = req.cookies?.access_token;
    const refreshToken = req.cookies?.refresh_token;

    let decoded;

    if (accessToken) {
      try {
        decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);
      } catch {
        decoded = null;
      }
    }

    if (!decoded) {
      if (!refreshToken) {
        clearAuthCookies(res);
        return res.status(401).json({
          success: false,
          message: "Please log in again.",
        });
      }

      let refreshDecoded;

      try {
        refreshDecoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN
        );
      } catch {
        clearAuthCookies(res);
        return res.status(401).json({
          success: false,
          message: "Refresh token is invalid or expired.",
        });
      }

      const storedToken = await RefreshToken.findOne({
        token: refreshToken,
        user: refreshDecoded.userId,
        revoked: false,
        expiresAt: { $gt: new Date() },
      }).select("+token");

      if (!storedToken) {
        clearAuthCookies(res);
        return res.status(401).json({
          success: false,
          message: "Refresh token is invalid or expired.",
        });
      }

      // Rotate refresh tokens: revoke the old token and issue a new one.
      const user = await User.findById(refreshDecoded.userId);

      if (!user) {
        await RefreshToken.updateOne(
          { _id: storedToken._id },
          { $set: { revoked: true } }
        );
        clearAuthCookies(res);
        return res.status(401).json({
          success: false,
          message: "User not found.",
        });
      }

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
      decoded = { userId: user._id.toString() };
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User found.",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("getme error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user.",
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken =
      req.cookies?.refresh_token ||
      req.body?.refreshToken ||
      req.headers["x-refresh-token"];

    if (!refreshToken) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "No refresh token provided.",
      });
    }

    let refreshDecoded;
    try {
      refreshDecoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
    } catch {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "Refresh token is invalid or expired.",
      });
    }

    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      user: refreshDecoded.userId,
      revoked: false,
      expiresAt: { $gt: new Date() },
    }).select("+token");

    if (!storedToken) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "Refresh token is invalid or has been revoked.",
      });
    }

    const user = await User.findById(refreshDecoded.userId);
    if (!user) {
      await RefreshToken.updateOne(
        { _id: storedToken._id },
        { $set: { revoked: true } }
      );
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

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

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      accessToken: newAccessToken,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh token.",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken =
      req.cookies?.refresh_token ||
      req.body?.refreshToken ||
      req.headers["x-refresh-token"];

    if (refreshToken) {
      await RefreshToken.updateOne(
        { token: refreshToken },
        { $set: { revoked: true } }
      );
    }

    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed.",
    });
  }
};
