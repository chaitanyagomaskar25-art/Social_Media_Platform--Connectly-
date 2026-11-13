import { Router } from "express";
import {
  blockUser,
  listBlockedUsers,
  listReports,
  submitReport,
  unblockUser,
  updateReport,
} from "../controller/moderationController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const router = Router();

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  return next();
};

router.use(requireAuth);

router.post("/blocks/:userId", blockUser);
router.delete("/blocks/:userId", unblockUser);
router.get("/blocks", listBlockedUsers);

router.post("/reports", submitReport);
router.get("/admin/reports", requireAdmin, listReports);
router.patch("/admin/reports/:reportId", requireAdmin, updateReport);
