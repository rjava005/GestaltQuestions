import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "react-toastify";

import { UseAuthMode } from "../../../../context/AuthMode";
import { AllowedInstitutions, type ValidInstitutions } from "../../types";

type AuthProps = {
  onSubmit: (
    email: string,
    password: string,
    username?: string,
    firstName?: string,
    lastName?: string,
    institution?: ValidInstitutions | null,
  ) => Promise<void>;
};

const shellStyles = {
  card: "w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-soft backdrop-blur-md",
  title: "text-2xl font-semibold text-text",
  subtitle: "text-sm text-text-muted",
  modeRow: "inline-flex rounded-full border border-border bg-surface-muted p-1",
  modeButton:
    "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
  modeButtonActive: "bg-surface-strong text-text",
  modeButtonInactive: "text-text-muted hover:text-text",
  formGrid: "grid grid-cols-1 gap-4 sm:grid-cols-2",
  field: "flex flex-col gap-1.5",
  label: "text-sm font-medium text-text-muted",
  input:
    "w-full rounded-lg border border-border bg-surface-strong px-3 py-2 text-sm text-text placeholder:text-text-soft outline-none transition-colors duration-200 focus:border-accent",
  select:
    "w-full rounded-lg border border-border bg-surface-strong px-3 py-2 text-sm text-text outline-none transition-colors duration-200 focus:border-accent",
  full: "sm:col-span-2",
  helper:
    "text-sm text-text-muted transition-colors hover:text-text hover:underline",
  submit:
    "w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-strong",
  secondary:
    "w-full rounded-lg border border-border bg-surface-muted px-4 py-2.5 text-sm font-medium text-text transition-colors duration-200 hover:bg-surface-strong",
};

export default function AuthBase({ onSubmit }: AuthProps) {
  const { mode, setMode } = UseAuthMode();
  const auth = getAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institution, setInstitution] = useState<ValidInstitutions | null>(
    null,
  );

  const isSignUp = mode === "signup";
  const isLogin = mode === "login";
  const isReset = mode === "passwordReset";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isReset) {
      await handlePasswordReset();
      return;
    }

    await onSubmit(email, password, username, firstName, lastName, institution);
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Password reset sent to ${email} (check spam).`);
    } catch {
      toast.error("Could not reset password.");
    }
  };

  return (
    <section className={shellStyles.card}>
      <div className="mb-5 flex flex-col gap-1">
        <h1 className={shellStyles.title}>
          {isLogin ? "Log In" : isSignUp ? "Create Account" : "Reset Password"}
        </h1>
        <p className={shellStyles.subtitle}>
          {isLogin
            ? "Welcome back. Sign in to continue."
            : isSignUp
              ? "Create your account to get started."
              : "Enter your email to receive a reset link."}
        </p>
      </div>

      {!isReset && (
        <div className="mb-5">
          <div
            className={shellStyles.modeRow}
            aria-label="Authentication mode switch"
          >
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`${shellStyles.modeButton} ${isLogin ? shellStyles.modeButtonActive : shellStyles.modeButtonInactive}`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`${shellStyles.modeButton} ${isSignUp ? shellStyles.modeButtonActive : shellStyles.modeButtonInactive}`}
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" id={mode}>
        <div className={shellStyles.formGrid}>
          {isSignUp && (
            <>
              <div className={shellStyles.field}>
                <label htmlFor="first-name" className={shellStyles.label}>
                  First Name
                </label>
                <input
                  id="first-name"
                  name="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Freddy"
                  className={shellStyles.input}
                />
              </div>

              <div className={shellStyles.field}>
                <label htmlFor="last-name" className={shellStyles.label}>
                  Last Name
                </label>
                <input
                  id="last-name"
                  name="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Freeman"
                  className={shellStyles.input}
                />
              </div>

              <div className={`${shellStyles.field} ${shellStyles.full}`}>
                <label htmlFor="username" className={shellStyles.label}>
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="freebodyfreddy"
                  className={shellStyles.input}
                />
              </div>
            </>
          )}

          <div
            className={`${shellStyles.field} ${isSignUp ? shellStyles.full : ""}`}
          >
            <label htmlFor="email" className={shellStyles.label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className={shellStyles.input}
              required
            />
          </div>

          {!isReset && (
            <div
              className={`${shellStyles.field} ${isSignUp ? shellStyles.full : ""}`}
            >
              <label htmlFor="password" className={shellStyles.label}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className={shellStyles.input}
                required
              />
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setMode("passwordReset")}
                  className={`${shellStyles.helper} mt-1 w-fit`}
                >
                  Forgot Password?
                </button>
              )}
            </div>
          )}

          {isSignUp && (
            <div className={`${shellStyles.field} ${shellStyles.full}`}>
              <label htmlFor="institution" className={shellStyles.label}>
                Institution
              </label>
              <select
                id="institution"
                value={institution ?? ""}
                onChange={(e) =>
                  setInstitution(e.target.value as ValidInstitutions)
                }
                className={shellStyles.select}
              >
                <option value="" disabled>
                  Select your institution
                </option>
                {AllowedInstitutions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button type="submit" className={shellStyles.submit}>
          {isLogin ? "Log In" : isSignUp ? "Sign Up" : "Send Password Reset"}
        </button>

        {isReset && (
          <button
            type="button"
            className={shellStyles.secondary}
            onClick={() => setMode("login")}
          >
            Go Back to Login
          </button>
        )}
      </form>
    </section>
  );
}
