import { passwordRules, scorePassword } from "../../utils/passwordStrength";

const PasswordStrength = ({ password }) => {
  const { score, label, level } = scorePassword(password || "");

  return (
    <div className="password-strength">
      <div className="password-strength-bars">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`password-strength-bar ${n <= score ? `is-${level}` : ""}`}
            aria-hidden
          />
        ))}
        <span className="password-strength-label">{label}</span>
      </div>
      <ul className="password-strength-rules">
        {passwordRules.map((rule) => (
          <li key={rule.id} className={rule.test(password || "") ? "is-met" : ""}>
            {rule.test(password || "") ? "✓" : "○"} {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrength;
