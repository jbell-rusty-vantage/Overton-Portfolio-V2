"use client";
import {
  startTransition,
  useEffect,
  useRef,
  useActionState,
  useState,
  type ReactNode,
} from "react";
import { saveLibrary } from "./actions";
import { LeafBody } from "@/components/library/Reading";
import { blocksFrom } from "@/lib/library/policy";

export function EditorForm({
  command,
  version = "",
  children,
  label = "Save",
}: {
  command: string;
  version?: string;
  children: ReactNode;
  label?: string;
}) {
  const [state, action, pending] = useActionState(saveLibrary, {
    ok: false,
    message: "",
  });
  const dirty = useRef(false);
  useEffect(() => {
    if (state.ok) dirty.current = false;
  }, [state]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  return (
    <form
      onChange={() => {
        dirty.current = true;
      }}
      className="my-3 grid gap-3 rounded border border-line p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="command" value={command} />
      <input type="hidden" name="version" value={version} />
      {children}
      <div>
        <button className="btn" disabled={pending}>
          {pending ? "Saving…" : label}
        </button>
      </div>
      {state.message && (
        <p role="status" className={state.ok ? "text-ok" : "text-danger"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
export function BlockFields({ initial }: { initial: string }) {
  const first = JSON.parse(initial)?.[0];
  const simple = JSON.parse(initial).length <= 1;
  const [advanced, setAdvanced] = useState(!simple);
  const [raw, setRaw] = useState(initial);
  const [component, setComponent] = useState(first?.component ?? "Prose");
  const [text, setText] = useState(
    first?.props?.text ??
      first?.props?.label ??
      first?.props?.code ??
      first?.props?.alt ??
      "",
  );
  const [url, setUrl] = useState(first?.props?.url ?? "");
  const formBlocks = [{ component, props: { text, url } }];
  let parsed: unknown = [];
  try {
    parsed = advanced ? JSON.parse(raw) : formBlocks;
  } catch {}
  return (
    <>
      <label className="text-sm">
        <input
          type="checkbox"
          checked={advanced}
          onChange={(e) => {
            if (e.target.checked) setRaw(JSON.stringify(formBlocks, null, 2));
            setAdvanced(e.target.checked);
          }}
        />{" "}
        Advanced block list
      </label>
      {advanced ? (
        <label>
          <span className="label">Page blocks</span>
          <textarea
            className="input"
            name="blocks"
            rows={6}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
        </label>
      ) : (
        <>
          <label>
            <span className="label">Content type</span>
            <select
              className="input"
              name="component"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
            >
              {[
                "Prose",
                "Architecture",
                "Timeline",
                "Metric",
                "Code",
                "Image",
                "Link",
              ].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Text, label or alt text</span>
            <textarea
              className="input"
              name="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={16000}
            />
          </label>
          {["Link", "Image"].includes(component) && (
            <label>
              <span className="label">{component === "Image" ? "Image URL or bundled artwork path" : "HTTPS URL"}</span>
              <input
                className="input"
                name="url"
                type={component === "Image" ? "text" : "url"}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </label>
          )}
        </>
      )}
      <details>
        <summary>Page preview</summary>
        <LeafBody
          page={{
            key: "preview",
            title: "Preview",
            blocks: blocksFrom(parsed),
          }}
        />
      </details>
    </>
  );
}
