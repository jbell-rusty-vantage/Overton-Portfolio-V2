"use client";

import * as React from "react";
import Link from "next/link";
import {
  Book,
  FileText,
  Home,
  FolderOpen,
  Mail,
  Wrench,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
}

const initialNavItems: NavigationItem[] = [
  {
    title: "About",
    url: "#about",
    icon: Home,
    id: "about",
  },
  {
    title: "Projects",
    url: "#projects",
    icon: FolderOpen,
    id: "projects",
  },
  {
    title: "Books",
    url: "#books",
    icon: Book,
    id: "books",
  },
  {
    title: "Tech Stack",
    url: "#tech",
    icon: Wrench,
    id: "tech",
  },
  {
    title: "Contact",
    url: "#contact",
    icon: Mail,
    id: "contact",
  },
  {
    title: "Blog",
    url: "#blog",
    icon: Book,
    id: "blog",
  },
  {
    title: "Upcoming Projects",
    url: "#upcoming",
    icon: FileText,
    id: "upcoming",
  },
];

interface DraggableSidebarProps {
  selectedItem: string;
  onItemSelect: (itemId: string) => void;
}

export function DraggableSidebar({
  selectedItem,
  onItemSelect,
}: DraggableSidebarProps) {
  const [navItems, setNavItems] = React.useState(initialNavItems);
  const [draggedItem, setDraggedItem] = React.useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverItem(itemId);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, dropItemId: string) => {
    e.preventDefault();

    if (!draggedItem || draggedItem === dropItemId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const draggedIndex = navItems.findIndex((item) => item.id === draggedItem);
    const dropIndex = navItems.findIndex((item) => item.id === dropItemId);

    if (draggedIndex === -1 || dropIndex === -1) return;

    const newNavItems = [...navItems];
    const [draggedItemData] = newNavItems.splice(draggedIndex, 1);
    newNavItems.splice(dropIndex, 0, draggedItemData);

    setNavItems(newNavItems);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem
                  key={item.id}
                  className={cn(
                    "transition-all duration-200",
                    draggedItem === item.id && "opacity-50 scale-95",
                    dragOverItem === item.id &&
                      "border-2 border-dashed border-sidebar-accent"
                  )}
                >
                  <div
                    className="flex items-center w-full group/drag-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragOver={(e) => handleDragOver(e, item.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, item.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center justify-center w-4 opacity-0 group-hover/drag-item:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-3 w-3 text-sidebar-foreground/50" />
                    </div>
                    <SidebarMenuButton
                      asChild
                      isActive={selectedItem === item.id}
                      className={cn(
                        "flex-1 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "hover:translate-x-1 hover:shadow-sm",
                        selectedItem === item.id &&
                          "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                      )}
                      onClick={() => onItemSelect(item.id)}
                    >
                      <button className="flex items-center gap-2 w-full">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
