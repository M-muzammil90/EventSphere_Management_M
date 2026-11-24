import { Router } from "express";
import * as c from "../controllers/exhibitorController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { uploadLogo, uploadDocument, optionalUpload } from "../middleware/uploadMiddleware.js";
import { exhibitorProfileSchema, updateExhibitorProfileSchema, applicationSchema, reviewApplicationSchema, staffSchema, productSchema } from "../validators/index.js";

const router = Router();

/* ------------------------------ public ------------------------------
   NOTE: every specific path must be registered BEFORE /:id, otherwise
   Express matches "/exhibitors/applications" as id="applications".
   -------------------------------------------------------------------- */
router.get("/directory", c.getDirectory);

/* --------------------------- exhibitor (authenticated) --------------- */
router.get("/me", protect, restrictTo("exhibitor", "admin"), c.getMyProfile);
router.patch("/me", protect, restrictTo("exhibitor", "admin"), validate({ body: updateExhibitorProfileSchema }), c.updateMyProfile);
router.post("/me/logo", protect, restrictTo("exhibitor", "admin"), optionalUpload(uploadLogo), c.uploadLogo);

// applications
router.get("/me/applications", protect, restrictTo("exhibitor", "admin"), c.getMyApplications);
router.post("/applications/:expoId", protect, restrictTo("exhibitor", "admin"), validate({ body: applicationSchema }), c.applyForExpo);

// documents
router.get("/me/documents", protect, restrictTo("exhibitor", "admin"), c.getMyDocuments);
router.post("/documents", protect, restrictTo("exhibitor", "admin"), optionalUpload(uploadDocument), c.uploadDocument);
router.post("/documents/:id/replace", protect, restrictTo("exhibitor", "admin"), uploadDocument, c.replaceDocument);
router.delete("/documents/:id", protect, restrictTo("exhibitor", "admin"), c.deleteDocument);
router.patch("/documents/:id/verify", protect, restrictTo("admin", "organizer"), c.verifyDocument);
router.get("/:id/documents", protect, restrictTo("admin", "organizer", "exhibitor"), c.getExhibitorDocuments);

// staff
router.post("/me/staff", protect, restrictTo("exhibitor", "admin"), validate({ body: staffSchema }), c.addStaff);
router.patch("/me/staff/:staffId", protect, restrictTo("exhibitor", "admin"), c.updateStaff);
router.delete("/me/staff/:staffId", protect, restrictTo("exhibitor", "admin"), c.removeStaff);

// products
router.post("/me/products", protect, restrictTo("exhibitor", "admin"), validate({ body: productSchema }), c.upsertProduct);
router.patch("/me/products/:productId", protect, restrictTo("exhibitor", "admin"), validate({ body: productSchema }), c.upsertProduct);
router.delete("/me/products/:productId", protect, restrictTo("exhibitor", "admin"), c.removeProduct);

/* ----------------------------- admin -------------------------------- */
router.get("/applications", protect, restrictTo("admin", "organizer"), c.listApplications);
router.patch("/applications/:id/review", protect, restrictTo("admin", "organizer"), validate({ body: reviewApplicationSchema }), c.reviewApplication);
router.patch("/:id/status", protect, restrictTo("admin", "organizer"), c.updateExhibitorStatus);
router.patch("/:id/profile", protect, restrictTo("admin", "organizer", "exhibitor"), validate({ body: updateExhibitorProfileSchema }), c.updateProfile);

/* -------------------- public profile (must be LAST) ------------------ */
router.get("/:id", optionalProtect, c.getPublicProfile);

export default router;
