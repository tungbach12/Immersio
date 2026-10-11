import type { InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon: LucideIcon;
  trailing?: ReactNode;
};

export function AuthField({ id, label, icon: Icon, trailing, className, ...inputProps }: AuthFieldProps) {
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-field-label">{label}</label>
      <div className="auth-input-wrap">
        <Icon className="auth-field-icon" size={18} strokeWidth={1.7} aria-hidden="true" />
        <input id={id} className={`auth-input${className ? ` ${className}` : ""}`} {...inputProps} />
        {trailing}
      </div>
    </div>
  );
}
