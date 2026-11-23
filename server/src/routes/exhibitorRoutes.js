import { Router } from "express";
import * as c from "../controllers/exhibitorController.js";
import { protect } from "../middleware/authMiddleware.js";
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

/* --------------------------- exhibitor ------------------------------ */
router.use(protect);

router.get("/me", restrictTo("exhibitor", "admin"), c.getMyProfile);
router.patch("/me", restrictTo("exhibitor", "admin"), validate({ body: updateExhibitorProfileSchema }), c.updateMyProfile);
router.post("/me/logo", restrictTo("exhibitor", "admin"), optionalUpload(uploadLogo), c.uploadLogo);

// applications
router.get("/me/applications", restrictTo("exhibitor", "admin"), c.getMyApplications);
router.post("/applications/:expoId", restrictTo("exhibitor", "admin"), validate({ body: applicationSchema }), c.applyForExpo);

// documents
router.get("/me/documents", restrictTo("exhibitor", "admin"), c.getMyDocuments);
router.post("/documents", restrictTo("exhibitor", "admin"), optionalUpload(uploadDocument), c.uploadDocument);
router.post("/documents/:id/replace", restrictTo("exhibitor", "admin"), uploadDocument, c.replaceDocument);
router.delete("/documents/:id", restrictTo("exhibitor", "admin"), c.deleteDocument);

// staff
router.post("/me/staff", restrictTo("exhibitor", "admin"), validate({ body: staffSchema }), c.addStaff);
router.patch("/me/staff/:staffId", restrictTo("exhibitor", "admin"), c.updateStaff);
router.delete("/me/staff/:staffId", restrictTo("exhibitor", "admin"), c.removeStaff);

// products
router.post("/me/products", restrictTo("exhibitor", "admin"), validate({ body: productSchema }), c.upsertProduct);
router.patch("/me/products/:productId", restrictTo("exhibitor", "admin"), validate({ body: productSchema }), c.upsertProduct);
router.delete("/me/products/:productId", restrictTo("exhibitor", "admin"), c.removeProduct);

/* ----------------------------- admin -------------------------------- */
router.get("/applications", restrictTo("admin", "organizer"), c.listApplications);
router.patch("/applications/:id/review", restrictTo("admin", "organizer"), validate({ body: reviewApplicationSchema }), c.reviewApplication);
router.patch("/:id/status", restrictTo("admin", "organizer"), c.updateExhibitorStatus);
router.patch("/:id/profile", restrictTo("admin", "organizer", "exhibitor"), validate({ body: updateExhibitorProfileSchema }), c.updateProfile);

/* -------------------- public profile (must be LAST) ------------------ */
router.get("/:id", c.getPublicProfile);

export default router;
