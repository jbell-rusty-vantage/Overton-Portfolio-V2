"use client";

import { useActionState, useState } from "react";
import { saveBodyBlocks } from "./actions";
import type { BodyBlocksState } from "./constants";

const initial: BodyBlocksState = { ok: false, error: null, savedAt: null };

export function BodyBlocksForm({ projectId, initialJson }: { projectId: string; initialJson: string }) {
  const [state, action, pending] = useActionState(saveBodyBlocks, initial);
  // Controlled so a failed save never loses the edited text.
  const [text, setText] = useState(initialJson);

  const format = () => {
    try {
      setText(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      /* leave as-is; the server reports the error on save */
    }
  };

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={projectId} />
      <textarea
        name="bodyBlocks"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={16}
        spellCheck={false}
        className="input font-mono text-xs"
      />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.ok && !pending ? <p className="text-sm text-ok">Saved.</p> : null}
      <div className="flex gap-2">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Saving…" : "Save body blocks"}
        </button>
        <button type="button" className="btn-ghost" onClick={format}>
          Format JSON
        </button>
      </div>
    </form>
  );
}
