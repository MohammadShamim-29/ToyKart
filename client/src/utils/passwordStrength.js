export const passwordRules = [
  { id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "num", label: "One number", test: (p) => /\d/.test(p) },
  { id: "special", label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) }
];

export const scorePassword = (password) => {
  const passed = passwordRules.filter((r) => r.test(password)).length;
  if (passed <= 2) return { score: 1, label: "Weak", level: "weak" };
  if (passed <= 4) return { score: 2, label: "Fair", level: "fair" };
  return { score: 3, label: "Strong", level: "strong" };
};
