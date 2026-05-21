import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import clsx from "clsx";

const AuthInput = ({
  label,
  type = "text",
  error,
  icon: Icon,
  showToggle,
  className,
  ...props
}) => {
  const [show, setShow] = useState(false);
  const inputType = showToggle ? (show ? "text" : "password") : type;

  return (
    <label className={clsx("block", className)}>
      <span className="auth-label">{label}</span>
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-candy-slate"
            size={18}
          />
        ) : null}
        <input
          type={inputType}
          className={clsx(
            "auth-input",
            Icon && "auth-input--icon",
            showToggle && "auth-input--toggle",
            error && "border-red-400"
          )}
          {...props}
        />
        {showToggle ? (
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-candy-slate hover:text-candy-navy"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs font-medium text-red-500">{error}</p> : null}
    </label>
  );
};

export default AuthInput;
