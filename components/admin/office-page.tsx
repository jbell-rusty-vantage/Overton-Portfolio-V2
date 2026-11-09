import { Suspense, type ReactNode } from "react";

/** Keep the page's own loading state available even on a navigation between
 * siblings, when the shared console layout is already mounted. */
export function officePage<P extends object>(Content: (props: P) => Promise<ReactNode>) {
  return function OfficePage(props: P) {
    return <Suspense fallback={<p className="animate-pulse text-sm text-muted" role="status">Opening the ledger…</p>}>
      <Content {...props} />
    </Suspense>;
  };
}
