import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Allows customizing built-in components, e.g. to add styling.
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold text-primary mb-6">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-semibold text-primary mb-4">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-medium text-primary mb-3">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-muted-foreground mb-4 leading-relaxed">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-2 text-muted-foreground">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-muted-foreground">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="ml-4">{children}</li>,
    code: ({ children }) => (
      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
        <code className="text-sm font-mono">{children}</code>
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 mb-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-8 border-border" />,
    a: ({ href, children }) => (
      <a href={href} className="text-primary hover:underline font-medium">
        {children}
      </a>
    ),
    ...components,
  };
}
