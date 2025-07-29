import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function TestMdxPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">TSX Route Demo</h1>
        <p className="text-xl text-muted-foreground">
          This page is built with React components (.tsx) but styled to
          complement our MDX pages
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default">TSX</Badge>
              React Components
            </CardTitle>
            <CardDescription>
              This page demonstrates React component rendering in Next.js
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Unlike MDX files, this page uses pure React components with
              TypeScript. It provides full access to all React features and
              TypeScript benefits.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Full TypeScript support</li>
              <li>Component composition</li>
              <li>Props and state management</li>
              <li>Advanced React patterns</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">MDX</Badge>
              Comparison
            </CardTitle>
            <CardDescription>
              How this differs from the MDX route
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              While MDX is great for content-heavy pages, TSX gives you complete
              control.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Type Safety:</span>
                <Badge variant="default">Full</Badge>
              </div>
              <div className="flex justify-between">
                <span>Component Access:</span>
                <Badge variant="default">Complete</Badge>
              </div>
              <div className="flex justify-between">
                <span>Writing Experience:</span>
                <Badge variant="secondary">Code-focused</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Interactive Section */}
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-semibold text-primary">
          Interactive Features
        </h2>

        <p className="text-muted-foreground max-w-2xl mx-auto">
          Since this is a TSX file, we can easily include interactive elements
          and complex component logic.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="default">Primary Action</Button>
          <Button variant="outline">Secondary Action</Button>
          <Button variant="secondary">Alternative</Button>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <Link href="/mdx-test">
            <Button variant="outline">View MDX Demo →</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">← Back to Home</Button>
          </Link>
        </div>
      </div>

      {/* Code Example */}
      <div className="mt-12">
        <h3 className="text-2xl font-medium text-primary mb-4">
          Component Example
        </h3>
        <div className="bg-muted p-6 rounded-lg">
          <pre className="text-sm font-mono overflow-x-auto">
            <code>{`// This page is a regular React component
export default function TestMdxPage() {
  return (
    <div className="container mx-auto">
      <h1>TSX Route Demo</h1>
      {/* Full React component capabilities */}
    </div>
  );
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
