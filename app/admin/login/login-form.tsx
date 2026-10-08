"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label">Email</span>
        <input name="email" type="email" autoComplete="username" required className="input" defaultValue={state.email} key={state.email} />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="input" />
      </label>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <button className="btn w-full" disabled={pending}>
        {pending ? "Checking…" : "Enter the office"}
      </button>
    </form>
  );
}
