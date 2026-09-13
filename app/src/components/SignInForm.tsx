import { useState, type ReactNode } from "react";
import { useAuth } from "../domain/AuthContext";

/**
 * The one shared sign-in form, per docs/ux/CLARITY_SESSION_CONTINUITY.md.
 * Each application area kept a bespoke copy of this exact form before Phase
 * 2A; this replaces all of them. Area-specific placeholder text and help
 * copy stay area-specific via props -- only the form itself, and the state
 * it reads/writes, is shared.
 */
export function SignInForm({
  placeholder,
  helpText,
}: {
  placeholder: string;
  helpText?: ReactNode;
}) {
  const { login, busy, error } = useAuth();
  const [assertion, setAssertion] = useState("");

  async function handleSubmit() {
    try {
      await login(assertion.trim());
      setAssertion("");
    } catch {
      // error is already recorded on the shared auth context
    }
  }

  return (
    <div className="sign-in-form">
      <label className="session-login">
        Development assertion
        <input
          aria-label="Development assertion"
          value={assertion}
          onChange={(event) => setAssertion(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      <button
        type="button"
        className="secondary-button"
        disabled={busy || assertion.trim().length < 16}
        onClick={() => void handleSubmit()}
      >
        Sign in
      </button>
      {error ? <p className="inline-warning" role="alert">{error}</p> : null}
      {helpText}
    </div>
  );
}
