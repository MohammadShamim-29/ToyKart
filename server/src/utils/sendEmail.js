import nodemailer from "nodemailer";
import User from "../models/User.js";

let transporter;
let transporterMode = null;

const normalizePass = (pass) => String(pass || "").replace(/\s+/g, "");

export const getEmailMode = () => {
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailPass = normalizePass(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS);
  if (gmailUser && gmailPass) return "gmail";
  if (process.env.SMTP_HOST && process.env.SMTP_USER) return "smtp";
  return "dev";
};

const createGmailTransporter = () => {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const pass = normalizePass(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS);
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass }
  });
};

const getTransporter = () => {
  const mode = getEmailMode();
  if (transporter && transporterMode === mode) return transporter;

  transporterMode = mode;

  if (mode === "gmail") {
    transporter = createGmailTransporter();
  } else if (mode === "smtp") {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: normalizePass(process.env.SMTP_PASS)
      }
    });
  } else {
    transporter = {
      sendMail: async (opts) => {
        console.log("[ToyKart Email - dev mode]", opts.subject, "→", opts.to);
        if (opts.text) console.log(opts.text);
        return { messageId: "dev" };
      }
    };
  }

  return transporter;
};

export const resetEmailTransporter = () => {
  transporter = null;
  transporterMode = null;
};

/** Verify Gmail/SMTP on server start. */
export const verifyEmailConnection = async () => {
  const mode = getEmailMode();
  if (mode === "dev") return { ok: false, mode };
  const t = getTransporter();
  await t.verify();
  return { ok: true, mode, user: process.env.GMAIL_USER || process.env.SMTP_USER };
};

const extractEmailAddress = (raw) => {
  const s = String(raw || "").trim().toLowerCase();
  const match = s.match(/<([^>]+)>/);
  return (match ? match[1] : s).trim();
};

/** Emails that must never receive customer order/return notifications (admin inbox / SMTP sender). */
export const getBlockedNotificationEmails = () => {
  const blocked = new Set();
  const add = (raw) => {
    const email = extractEmailAddress(raw);
    if (email) blocked.add(email);
  };

  add(process.env.GMAIL_USER);
  add(process.env.SMTP_USER);
  add(process.env.EMAIL_FROM);
  String(process.env.NOTIFY_BLOCK_EMAILS || "")
    .split(",")
    .forEach(add);

  return blocked;
};

export const isBlockedCustomerRecipient = async (email) => {
  const normalized = extractEmailAddress(email);
  if (!normalized) return true;

  if (getBlockedNotificationEmails().has(normalized)) {
    return true;
  }

  const adminUser = await User.findOne({ email: normalized, isAdmin: true }).select("_id");
  return Boolean(adminUser);
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const from =
    process.env.EMAIL_FROM ||
    (process.env.GMAIL_USER ? `ToyKart <${process.env.GMAIL_USER}>` : "ToyKart <hello@toykart.com>");

  const mailer = getTransporter();
  const info = await mailer.sendMail({ from, to, subject, html, text });

  console.log(`[ToyKart Email] "${subject}" → ${to} (${info.messageId})`);

  return info;
};

/** Order/return/refund emails — never deliver to admin or SMTP sender addresses. */
export const sendCustomerEmail = async ({ to, subject, html, text }) => {
  const recipient = extractEmailAddress(to);
  if (await isBlockedCustomerRecipient(recipient)) {
    console.warn(
      `[ToyKart Email] Customer notification blocked for admin/sender address: ${recipient}`
    );
    return { messageId: "blocked", blocked: true };
  }
  return sendEmail({ to: recipient, subject, html, text });
};
