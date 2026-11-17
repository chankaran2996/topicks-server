// Creates an admin account. There is no public sign-up.
//
// With a password:
//   npm run create-admin -- --name "Owner" --email you@example.com --password "StrongPass123"
// Without a password (emails a "set your password" link, valid 48 hours):
//   npm run create-admin -- --name "Owner" --email you@example.com
//
// Running it again for an existing email resets that account (new password or new link).
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { sendMail } from '../config/mailer.js';
import User from '../models/userModel.js';
import { ROLES } from '../config/roles.js';
import { INVITE_TTL_HOURS, MIN_PASSWORD_LENGTH, setPasswordLink } from '../controllers/authController.js';
import { setPasswordInviteEmail } from '../utils/emailTemplates.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => (cur.startsWith('--') ? [...acc, [cur.slice(2), arr[i + 1]]] : acc), [])
);

if (!args.email) {
  console.error('Usage: npm run create-admin -- --name "Owner" --email you@example.com [--password "StrongPass123"]');
  process.exit(1);
}
if (args.password && (args.password.length < MIN_PASSWORD_LENGTH || !/[a-z]/i.test(args.password) || !/\d/.test(args.password))) {
  console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters and contain a letter and a number`);
  process.exit(1);
}

await connectDB();
const email = args.email.toLowerCase().trim();
let user = await User.findOne({ email });
const isNew = !user;
if (isNew) user = new User({ email, name: args.name || 'Admin', role: ROLES.ADMIN });

user.role = ROLES.ADMIN;
user.isActive = true;
if (args.name) user.name = args.name;

let inviteToken;
if (args.password) {
  user.password = args.password;
  user.hasPassword = true;
} else {
  if (isNew) {
    user.password = crypto.randomBytes(24).toString('hex'); // unusable until they set their own
    user.hasPassword = false;
  }
  inviteToken = user.createPasswordToken(INVITE_TTL_HOURS * 60);
}

await user.save();
console.log(`${isNew ? 'Created' : 'Updated'} admin: ${email}`);

if (inviteToken) {
  const link = setPasswordLink(inviteToken);
  await sendMail({ to: email, ...setPasswordInviteEmail(user.name, link, INVITE_TTL_HOURS) });
  console.log(`Set-password link (valid ${INVITE_TTL_HOURS}h): ${link}`);
}
await mongoose.disconnect();
