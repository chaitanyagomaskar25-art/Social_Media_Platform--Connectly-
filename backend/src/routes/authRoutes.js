
import { Router } from "express";
import {
  register,
  login,
  getme,
  logout,
  refresh,
} from "../controller/authController.js";

import { updateUserProfile } from '../controller/userController.js';

import { requireAuth } from "../middleware/authMiddleware.js";
import { uploadAvatarImage } from "../middleware/uploadMiddleware.js";
import { updateNotificationPreferences } from "../controller/notificationPreferenceController.js";

export const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", getme);
router.post("/logout", logout);
router.patch("/profile", requireAuth, uploadAvatarImage, updateUserProfile);
router.patch("/notification-preferences", requireAuth, updateNotificationPreferences);
