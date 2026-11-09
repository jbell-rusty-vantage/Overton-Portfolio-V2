import {
  shelves,
  zones,
  type Collection,
  type VolumeKind,
  type Leaf,
} from "./model";

const entries: [string, string, string, string, VolumeKind][] = [
  [
    "agent-workbench",
    "Agent Workbench",
    "stacks-ai-agents",
    "A sample workbench for tracing an agent from an instruction to its result.",
    "Project",
  ],
  [
    "research-assistant",
    "Research Assistant",
    "stacks-ai-agents",
    "A sample research notebook that groups questions with their sources.",
    "Project",
  ],
  [
    "knowledge-atlas",
    "Knowledge Atlas",
    "stacks-data-knowledge",
    "An example atlas for following relationships between records.",
    "Project",
  ],
  [
    "data-pipeline",
    "Data Pipeline",
    "stacks-data-knowledge",
    "A sample pipeline that checks records before they enter a catalog.",
    "Project",
  ],
  [
    "web-application",
    "Web Application",
    "stacks-web-apps",
    "An example interface for navigating a collection by topic.",
    "Project",
  ],
  [
    "interface-system",
    "Interface System",
    "stacks-web-apps",
    "A sample inventory of accessible interface patterns.",
    "Project",
  ],
  [
    "client-study-a",
    "Client Study A",
    "stacks-client-work",
    "A fictional brief for a small service directory.",
    "Project",
  ],
  [
    "client-study-b",
    "Client Study B",
    "stacks-client-work",
    "A fictional editorial handoff for a client website.",
    "Project",
  ],
  [
    "field-notes",
    "Field Notes",
    "periodicals-blog",
    "An example journal entry about finding a book by its shelf.",
    "Journal",
  ],
  [
    "index-cards",
    "Index Cards",
    "periodicals-blog",
    "Notes on sorting references into a working index.",
    "Journal",
  ],
  [
    "shelf-marks",
    "Shelf Marks",
    "periodicals-blog",
    "A sample essay on making a collection navigable.",
    "Journal",
  ],
  [
    "reading-list",
    "Reading List",
    "favorites-books",
    "A sample reading list for the favorites wing.",
    "Favorite",
  ],
  [
    "tool-drawer",
    "Tool Drawer",
    "favorites-tools",
    "A short example of a tool reference.",
    "Favorite",
  ],
  [
    "course-notes",
    "Course Notes",
    "reading-room-courses",
    "A sample notebook for a course reading.",
    "Favorite",
  ],
  [
    "working-paper",
    "Working Paper",
    "reading-room-articles",
    "An example report for the reading room.",
    "Favorite",
  ],
  ...[
    "novice",
    "builder",
    "full_stack",
    "systems_data",
    "ai_agent_mastery",
    "production_grade",
  ].map((s): [string, string, string, string, VolumeKind] => [
    s,
    s.replaceAll("_", " "),
    "evolution-timeline",
    "An illustrative stage in the evolution hall.",
    "Evolution",
  ]),
];
export function sampleCollection(): Collection {
  const counts = new Map<string, number>();
  return {
    source: "fixtures",
    sceneUrl: "/library/hall.glb",
    zones: zones.map((z) => z.slug),
    screens: [
      {
        slot: "main",
        mode: "terminal",
        title: "Catalog terminal",
        lines: ["index mounted", "shelves ready", "sample collection online"],
      },
      {
        slot: "side",
        mode: "feed",
        title: "Desk bulletin",
        lines: [
          "Sample collection opened",
          "Project volumes available in the stacks",
        ],
      },
    ],
    volumes: entries.map(([id, title, shelf, summary, kind]) => {
      const position = (counts.get(shelf) ?? 0) + 1;
      counts.set(shelf, position);
      const extras: Leaf[] =
        id === "agent-workbench"
          ? [
              {
                key: "gallery",
                title: "Gallery",
                blocks: [
                  {
                    kind: "image",
                    url: "/library/plate-0.webp",
                    text: "The illustrated cover of the demonstration workbench.",
                  },
                ],
              },
              {
                key: "code",
                title: "Code",
                blocks: [
                  {
                    kind: "code",
                    text: 'const nextStep = { task: "Review source", state: "ready" };',
                  },
                ],
              },
              {
                key: "metrics",
                title: "Measurements",
                blocks: [
                  {
                    kind: "text",
                    text: "Illustrative example: one review step has a named input and a recorded result.",
                  },
                ],
              },
              {
                key: "links",
                title: "References",
                blocks: [
                  {
                    kind: "link",
                    text: "Read the sample Knowledge Atlas",
                    url: "/projects/demo-knowledge-atlas",
                  },
                ],
              },
            ]
          : [];
      return {
        slug: "demo-" + id,
        title,
        summary,
        kind,
        shelf,
        position,
        plate:
          Math.max(
            0,
            shelves.findIndex((s) => s.slug === shelf),
          ) % 4,
        tags: [kind === "Project" ? "Design study" : kind],
        featured: position === 1 && kind === "Project",
        pages: [
          {
            key: "overview",
            title: "Overview",
            blocks: [{ kind: "text", text: summary }],
          },
          {
            key: "architecture",
            title: "Field notes",
            blocks: [
              {
                kind: "text",
                text: "This demonstration volume shows how a library entry can carry a summary, supporting notes and a place on a shelf. It is fictional.",
              },
            ],
          },
          ...extras,
        ],
      };
    }),
  };
}
