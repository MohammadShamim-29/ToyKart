import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

// Generate a strong random password
const generatePassword = () => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*_+-=[]{}|;:,.<>?";
  
  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Add more random characters to reach 12 characters
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split("").sort(() => Math.random() - 0.5).join("");
};

const email = process.argv[2];
if (!email) {
  console.error("Usage: node src/scripts/resetAdminPassword.js <email>");
  process.exit(1);
}

const run = async () => {
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }
  
  if (!user.isAdmin) {
    console.error(`User ${email} is not an admin`);
    process.exit(1);
  }
  
  const newPassword = generatePassword();
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { password: hashedPassword },
    { new: true }
  );
  
  console.log("\n✓ Password changed successfully");
  console.log(`Email: ${updatedUser.email}`);
  console.log(`New Password: ${newPassword}\n`);
  
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
