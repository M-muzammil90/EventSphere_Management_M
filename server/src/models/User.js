import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const ROLES = ["admin", "organizer", "exhibitor", "attendee"];

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, maxlength: 160 },
    city: { type: String, trim: true, maxlength: 80 },
    state: { type: String, trim: true, maxlength: 80 },
    country: { type: String, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 20 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never returned by default
    },
    role: {
      type: String,
      enum: { values: ROLES, message: "Role must be one of: " + ROLES.join(", ") },
      default: "attendee",
    },
    phone: { type: String, trim: true, maxlength: 32 },
    jobTitle: { type: String, trim: true, maxlength: 100 },
    avatar: { type: String, trim: true, default: "" },
    address: addressSchema,

    // notification + privacy preferences (GDPR consent)
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      sessionReminders: { type: Boolean, default: true },
      scheduleChanges: { type: Boolean, default: true },
      exhibitorMatches: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
      profileVisible: { type: Boolean, default: true },
      analyticsConsent: { type: Boolean, default: true },
      dataSharing: { type: Boolean, default: false },
    },

    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,

    // password reset — stores a SHA-256 hash, never the raw token
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: Date,

    twoFactorEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/* ------------------------------- indexes ------------------------------ */
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

/* ------------------------------- virtuals ----------------------------- */
userSchema.virtual("isStaff").get(function () {
  return ["admin", "organizer"].includes(this.role);
});

/* ------------------------------ middleware ---------------------------- */
// Hash password whenever it is set or modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Record passwordChangedAt (invalidates older JWTs)
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

/* ------------------------------- methods ------------------------------ */
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtIat) {
  if (!this.passwordChangedAt) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIat;
};

/** Creates a reset token, stores only its hash, and returns the raw value. */
userSchema.methods.createPasswordResetToken = function () {
  const raw = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(raw).digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  return raw;
};

userSchema.methods.safeJSON = function () {
  const o = this.toJSON();
  delete o.password;
  delete o.passwordResetToken;
  delete o.passwordResetExpires;
  return o;
};

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
