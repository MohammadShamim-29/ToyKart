import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error("Usage: node src/scripts/promoteAdmin.js <email>");
  process.exit(1);
}

const run = async () => {
  await connectDB();
  const user = await User.findOneAndUpdate({ email }, { isAdmin: true }, { new: true });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }
  console.log(`User ${user.email} is now an admin.`);
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
