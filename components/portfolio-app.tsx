"use client";

import * as React from "react";
import { Suspense } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DraggableSidebar } from "@/components/draggable-sidebar";
import { SidebarSkeleton } from "@/components/sidebar-skeleton";
import { ContentRenderer } from "@/components/content-renderer";

export default function PortfolioApp() {
  const [selectedItem, setSelectedItem] = React.useState("about");

  return (
    <SidebarProvider>
      <Suspense fallback={<SidebarSkeleton />}>
        <DraggableSidebar
          selectedItem={selectedItem}
          onItemSelect={setSelectedItem}
        />
      </Suspense>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Portfolio</h2>
            <span className="text-sm text-muted-foreground">
              Current:{" "}
              {selectedItem.charAt(0).toUpperCase() + selectedItem.slice(1)}
            </span>
          </div>
        </header>
        <ContentRenderer selectedItem={selectedItem} />
      </SidebarInset>
    </SidebarProvider>
  );
}
