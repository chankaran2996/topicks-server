import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { ALL_ROLES } from '../config/roles.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ALL_ROLES, required: true },
    isActive: { type: Boolean, default: true },
    // False until the user has chosen their own password (invited accounts).
    hasPassword: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
    passwordTokenHash: { type: String, select: false },
    passwordTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  // Skip on first creation so the very first login token stays valid.
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// True when a JWT issued at `iat` (seconds) predates the last password change.
userSchema.methods.changedPasswordAfter = function (iat) {
  return Boolean(this.passwordChangedAt) && this.passwordChangedAt.getTime() > iat * 1000;
};

// Creates a one-time token for the set-password link. Only its hash is stored.
userSchema.methods.createPasswordToken = function (ttlMinutes) {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordTokenHash = hashToken(token);
  this.passwordTokenExpires = new Date(Date.now() + ttlMinutes * 60 * 1000);
  return token;
};

userSchema.statics.findByPasswordToken = function (token) {
  return this.findOne({
    passwordTokenHash: hashToken(String(token)),
    passwordTokenExpires: { $gt: new Date() },
    isActive: true,
  }).select('+passwordTokenHash +passwordTokenExpires');
};

userSchema.methods.toSafeJSON = function () {
  return { id: this._id, name: this.name, email: this.email, role: this.role };
};

export default mongoose.model('User', userSchema);
