"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "./actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, {});
  return (
    <form action={action} className="grid max-w-md gap-4">
      <label className="block">
        <span className="label">Current password</span>
        <input name="current" type="password" autoComplete="current-password" required className="input" />
      </label>
      <label className="block">
        <span className="label">New password (12+ characters)</span>
        <input name="next" type="password" autoComplete="new-password" required minLength={12} className="input" />
      </label>
      <label className="block">
        <span className="label">Confirm new password</span>
        <input name="confirm" type="password" autoComplete="new-password" required minLength={12} className="input" />
      </label>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <button className="btn w-fit" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
