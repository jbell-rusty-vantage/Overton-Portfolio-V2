import { officePage } from "@/components/admin/office-page";
import Link from "next/link";
import {
  PageHeader,
  Badge,
  Field,
  Select,
  DISPLAY_STATES,
} from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { publicImage, templateNames } from "@/lib/library/policy";
import { layoutSchema, roomAnchors } from "@/lib/estate/program";
import { EditorForm, BlockFields } from "./EditorForm";

export const metadata = { title: "Library editor" };
async function LibraryEditor() {
  await requireAdmin();
  const [
    books,
    projects,
    shelves,
    zones,
    screens,
    media,
    sites,
    assets,
    estateLayout,
    estateScenes,
  ] = await Promise.all([
    db.book.findMany({
      orderBy: { title: "asc" },
      include: { pages: { orderBy: { position: "asc" } } },
    }),
    db.project.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true, slug: true, display: true },
      orderBy: { title: "asc" },
    }),
    db.shelf.findMany({
      orderBy: [{ zoneId: "asc" }, { sortOrder: "asc" }],
      include: {
        slots: { orderBy: { position: "asc" } },
        zone: { select: { title: true } },
      },
    }),
    db.libraryZone.findMany({ orderBy: { sortOrder: "asc" } }),
    db.computerScreen.findMany({ orderBy: { slot: "asc" } }),
    db.mediaAsset.findMany({
      where: { deletedAt: null, kind: { in: ["video", "image", "model3d"] } },
      select: { id: true, title: true, kind: true, url: true },
    }),
    db.deployment.findMany({
      where: { deletedAt: null, iframeAllowed: true },
      select: { id: true, title: true },
    }),
    db.sceneAsset.findMany({
      where: { slug: "library-hall" },
      orderBy: { version: "desc" },
    }),
    db.uiLayout.findUnique({ where: { slug: "travellers-rest-visit" } }),
    db.sceneAsset.findMany({
      where: {
        slug: { in: ["travellers-rest-house", "travellers-rest-house-low"] },
      },
      select: { isActive: true, version: true },
    }),
  ]);
  const parsedEstate = layoutSchema.safeParse(estateLayout?.blocks);
  const estate = parsedEstate.success ? parsedEstate.data[0].props : null;
  const editionScenes = estateScenes.filter(
    (s) => s.version === estate?.edition,
  );
  const estateReleased =
    editionScenes.length === 2 &&
    editionScenes.every((s) => s.isActive) &&
    books.some(
      (b) =>
        b.slug === estate?.companion &&
        ["published", "featured"].includes(b.display),
    ) &&
    roomAnchors.every((r) =>
      zones.some(
        (z) =>
          r.slug === z.slug && ["published", "featured"].includes(z.display),
      ),
    );
  const slots = shelves.flatMap((s) =>
    s.slots.map((p) => ({ ...p, shelf: s })),
  );
  const shelfOptions = [
    { value: "", label: "Unplaced" },
    ...shelves.map((s) => ({
      value: s.slug,
      label: s.zone.title + " / " + s.title,
    })),
  ];
  const emptyOption = { value: "", label: "None" };
  const coverOptions = [{ value: "", label: "Use project cover or Library plate" },
    ...media.filter((m) => m.kind === "image" && publicImage(m.url)).map((m) => ({ value: m.id, label: m.title || m.url }))];
  const projectOptions = [
    { value: "", label: "Standalone book" },
    ...projects
      .filter(
        (p) =>
          !books.some((b) => b.entityId === p.id && b.entityType === "project"),
      )
      .map((p) => ({ value: p.id, label: p.title })),
  ];
  const activeVersions = assets
    .filter((a) => a.isActive)
    .map((a) => a.id)
    .sort()
    .join(",");
  return (
    <>
      <PageHeader
        title="Library editor"
        description="Edit a volume, place it on a shelf, then preview the room."
        actions={
          <Link className="btn-ghost" href="/admin/preview/library">
            Visitor preview
          </Link>
        }
      />
      <nav className="mb-5 flex flex-wrap gap-3 text-sm">
        {[
          ...(estate ? ["Travellers Rest"] : []),
          "Books",
          "Shelves",
          "Zones",
          "Screens",
          "Scenes",
        ].map((t) => (
          <a key={t} href={"#" + t.toLowerCase().replaceAll(" ", "-")}>
            {t}
          </a>
        ))}
      </nav>
      {estate && estateLayout && (
        <section id="travellers-rest" className="card my-5">
          <h2 className="font-serif text-2xl">Travellers Rest</h2>
          <p className="my-2 text-sm">
            Release or withdraw the four rooms, house book and both scene tiers
            together. Each cabinet project has its own visibility setting.
            House program edition {estate.edition}
            {estate.edition === 2
              ? " · continuous 3D library with the speaking portrait, physical volumes and inspectable documents."
              : " · guided visit."}
          </p>
          <Link className="underline" href="/admin/preview/library#cabinet">
            Preview the complete project cabinet
          </Link>
          <EditorForm
            command="estate"
            version={estateLayout.updatedAt.toISOString()}
            label="Save house program"
          >
            <Field label="House visit">
              <Select
                name="release"
                defaultValue={estateReleased ? "publish" : "draft"}
                options={[
                  { value: "draft", label: "Hidden draft" },
                  { value: "publish", label: "Published guided visit" },
                ]}
              />
            </Field>
            <Field
              label="Featured visit starts (UTC)"
              hint="Leave blank for an immediate start."
            >
              <input
                className="input"
                type="datetime-local"
                name="start"
                defaultValue={estate.featuredFrom?.slice(0, 16) ?? ""}
              />
            </Field>
            <Field
              label="Featured visit ends (UTC)"
              hint="Leave blank for an open-ended visit."
            >
              <input
                className="input"
                type="datetime-local"
                name="end"
                defaultValue={estate.featuredUntil?.slice(0, 16) ?? ""}
              />
            </Field>
          </EditorForm>
        </section>
      )}
      <section id="books">
        <h2 className="font-serif text-2xl">Books & pages</h2>
        <details className="card my-3">
          <summary>Create a draft book</summary>
          <EditorForm command="book" label="Create hidden book">
            <Field label="Project">
              <Select name="project" options={projectOptions} />
            </Field>
            <Field label="Title">
              <input className="input" name="title" required />
            </Field>
            <Field label="Slug">
              <input
                className="input"
                name="slug"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
              />
            </Field>
            <Field label="Subtitle">
              <input className="input" name="subtitle" />
            </Field>
            <Field label="Page mode">
              <Select
                name="pageMode"
                options={["hybrid", "generated", "authored"]}
              />
            </Field>
            <Field label="Cover artwork">
              <Select name="coverMediaId" options={coverOptions} />
            </Field>
          </EditorForm>
        </details>
        {books.map((b) => {
          const project = projects.find(
            (p) => p.id === b.entityId && b.entityType === "project",
          );
          const slot = slots.find(
            (p) => p.entityType === "book" && p.entityId === b.id,
          );
          return (
            <details key={b.id} id={"volume-" + b.id} className="card my-3">
              <summary>
                {b.title} <Badge value={b.display} />
              </summary>
              {project && (
                <p className="my-3 text-sm">
                  Linked project{" "}
                  <Link
                    className="underline"
                    href={"/admin/projects/" + project.id}
                  >
                    {project.title}
                  </Link>{" "}
                  · {project.display}
                </p>
              )}
              <EditorForm
                command="book"
                version={b.updatedAt.toISOString()}
                label="Save presentation"
              >
                <input type="hidden" name="id" value={b.id} />
                <Field label="Title">
                  <input
                    className="input"
                    name="title"
                    defaultValue={b.title}
                    required
                  />
                </Field>
                <Field label="Slug">
                  <input
                    className="input"
                    name="slug"
                    defaultValue={b.slug}
                    required
                  />
                </Field>
                <Field label="Subtitle">
                  <input
                    className="input"
                    name="subtitle"
                    defaultValue={b.subtitle ?? ""}
                  />
                </Field>
                <Field
                  label="Book visibility"
                  hint="The linked project must also permit access."
                >
                  <Select
                    name="display"
                    options={DISPLAY_STATES}
                    defaultValue={b.display}
                  />
                </Field>
                <Field label="Pages">
                  <Select
                    name="pageMode"
                    options={["generated", "authored", "hybrid"]}
                    defaultValue={b.pageMode}
                  />
                </Field>
                <Field label="Cover artwork">
                  <Select
                    name="coverMediaId"
                    defaultValue={b.coverMediaId ?? ""}
                    options={coverOptions}
                  />
                </Field>
              </EditorForm>
              <h3 className="font-serif text-xl">Shelf placement</h3>
              <EditorForm
                command="place"
                version={
                  slot
                    ? [slot.id, slot.shelfId, slot.position].join("/")
                    : "unplaced"
                }
                label="Save placement"
              >
                <input type="hidden" name="bookId" value={b.id} />
                <Field label="Shelf">
                  <Select
                    name="shelf"
                    defaultValue={slot?.shelf.slug}
                    options={shelfOptions}
                  />
                </Field>
                <Field label="Position (top row first)">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    className="input"
                    name="position"
                    defaultValue={slot?.position ?? 1}
                  />
                </Field>
                <Field label="Swap with an occupied slot">
                  <Select
                    name="swap"
                    options={[
                      emptyOption,
                      ...slots
                        .filter((p) => p.id !== slot?.id)
                        .map((p) => ({
                          value: p.id,
                          label:
                            p.shelf.title +
                            " · " +
                            p.position +
                            " · " +
                            (books.find((b) => b.id === p.entityId)?.title ??
                              p.entityType),
                        })),
                    ]}
                  />
                </Field>
              </EditorForm>
              <h3 className="font-serif text-xl">Authored pages</h3>
              {[...b.pages, null].map((p) => (
                <details
                  key={p?.id ?? "new"}
                  className="my-2 rounded border border-line p-3"
                >
                  <summary>
                    {p
                      ? p.position + ". " + (p.templateCode ?? "Untitled page")
                      : "Add a page"}
                  </summary>
                  <EditorForm
                    command="page"
                    version={p?.updatedAt.toISOString()}
                    label={p ? "Save page" : "Add page"}
                  >
                    <input type="hidden" name="bookId" value={b.id} />
                    <input type="hidden" name="id" value={p?.id ?? ""} />
                    <Field label="Page template">
                      <Select
                        name="template"
                        options={Object.keys(templateNames)}
                        defaultValue={p?.templateCode ?? "overview"}
                      />
                    </Field>
                    <Field label="Position">
                      <input
                        name="position"
                        type="number"
                        min="1"
                        max="256"
                        required
                        className="input"
                        defaultValue={
                          p?.position ?? (b.pages.at(-1)?.position ?? 0) + 1
                        }
                      />
                    </Field>
                    <BlockFields initial={JSON.stringify(p?.blocks ?? [])} />
                    {p && (
                      <>
                        <Field label="Swap with page">
                          <Select
                            name="swap"
                            options={[
                              emptyOption,
                              ...b.pages
                                .filter((q) => q.id !== p.id)
                                .map((q) => ({
                                  value: q.id,
                                  label: q.position + ". " + q.templateCode,
                                })),
                            ]}
                          />
                        </Field>
                        <label>
                          <input type="checkbox" name="duplicate" value="yes" />{" "}
                          Save a copy at the end
                        </label>
                        <label>
                          <input type="checkbox" name="delete" value="yes" />{" "}
                          Remove this page when saving
                        </label>
                      </>
                    )}
                  </EditorForm>
                </details>
              ))}
            </details>
          );
        })}
      </section>
      <section id="shelves" className="my-8">
        <h2 className="font-serif text-2xl">Shelf inventory</h2>
        <details className="card my-3">
          <summary>Place a project directly</summary>
          {projects
            .filter(
              (p) =>
                !books.some(
                  (b) => b.entityType === "project" && b.entityId === p.id,
                ) ||
                slots.some(
                  (s) => s.entityType === "project" && s.entityId === p.id,
                ),
            )
            .map((p) => {
              const slot = slots.find(
                (s) => s.entityType === "project" && s.entityId === p.id,
              );
              return (
                <EditorForm
                  key={p.id}
                  command="place"
                  version={
                    slot
                      ? [slot.id, slot.shelfId, slot.position].join("/")
                      : "unplaced"
                  }
                  label="Save project placement"
                >
                  <strong>{p.title}</strong>
                  <input type="hidden" name="targetType" value="project" />
                  <input type="hidden" name="bookId" value={p.id} />
                  <Field label="Shelf">
                    <Select
                      name="shelf"
                      options={shelfOptions}
                      defaultValue={slot?.shelf.slug}
                    />
                  </Field>
                  <Field label="Position">
                    <input
                      className="input"
                      type="number"
                      name="position"
                      min={1}
                      max={24}
                      defaultValue={slot?.position ?? 1}
                    />
                  </Field>
                </EditorForm>
              );
            })}
        </details>
        {shelves.map((s) => (
          <details className="border-b border-line py-2" key={s.id}>
            <summary>
              {s.title} · {s.slots.length}/{s.capacity}
            </summary>
            <p className="text-sm">
              {s.zone.title} · {s.sceneNodeName}
            </p>
            <EditorForm command="shelf" version={s.title} label="Rename shelf">
              <input type="hidden" name="slug" value={s.slug} />
              <Field
                label="Shelf title"
                hint="Changes the cabinet sign and catalog label. Existing links and books stay in place."
              >
                <input
                  className="input"
                  name="title"
                  maxLength={64}
                  required
                  defaultValue={s.title}
                />
              </Field>
            </EditorForm>
            {s.slots.map((p) => (
              <p key={p.id}>
                {p.position}.{" "}
                {books.find((b) => b.id === p.entityId)?.title ??
                  projects.find((t) => t.id === p.entityId)?.title ??
                  p.entityType}
              </p>
            ))}
          </details>
        ))}
      </section>
      <section id="zones">
        <h2 className="font-serif text-2xl">Rooms</h2>
        {zones
          .filter((z) => !roomAnchors.some((r) => r.slug === z.slug))
          .map((z) => (
            <details className="card my-2" key={z.id}>
              <summary>
                {z.title} <Badge value={z.display} />
              </summary>
              <EditorForm
                command="zone"
                version={JSON.stringify([z.display, z.cameraPreset])}
              >
                <input type="hidden" name="slug" value={z.slug} />
                <Field label="Visibility">
                  <Select
                    name="display"
                    options={DISPLAY_STATES}
                    defaultValue={z.display}
                  />
                </Field>
                <Field
                  label="Camera override"
                  hint="Optional {eye:[x,y,z],target:[x,y,z]} in scene meters. Clear to restore the designed view."
                >
                  <textarea
                    className="input"
                    name="camera"
                    defaultValue={
                      Object.keys(z.cameraPreset ?? {}).length
                        ? JSON.stringify(z.cameraPreset)
                        : ""
                    }
                  />
                </Field>
              </EditorForm>
            </details>
          ))}
      </section>
      <section id="screens" className="my-8">
        <h2 className="font-serif text-2xl">Computer screens</h2>
        {screens.map((s) => {
          const config =
            s.config && typeof s.config === "object" && !Array.isArray(s.config)
              ? s.config
              : {};
          return (
            <details key={s.id} className="card my-2">
              <summary>
                {s.slot} · {s.mode}
              </summary>
              <EditorForm command="screen" version={s.updatedAt.toISOString()}>
                <input type="hidden" name="slot" value={s.slot} />
                <Field label="Display title">
                  <input
                    className="input"
                    name="title"
                    defaultValue={String(config.title ?? s.slot + " display")}
                    required
                  />
                </Field>
                <Field label="Mode">
                  <Select
                    name="mode"
                    options={["feed", "terminal", "image", "video", "iframe"]}
                    defaultValue={s.mode}
                  />
                </Field>
                <Field label="Media">
                  <Select
                    name="mediaId"
                    defaultValue={s.mediaId}
                    options={[
                      emptyOption,
                      ...media
                        .filter((m) => m.kind !== "model3d")
                        .map((m) => ({
                          value: m.id,
                          label: m.kind + " · " + (m.title ?? m.id),
                        })),
                    ]}
                  />
                </Field>
                <Field label="Embeddable site">
                  <Select
                    name="deploymentId"
                    defaultValue={s.deploymentId}
                    options={[
                      emptyOption,
                      ...sites.map((d) => ({ value: d.id, label: d.title })),
                    ]}
                  />
                </Field>
                <label>
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={config.enabled !== false}
                  />{" "}
                  Enable this display
                </label>
              </EditorForm>
            </details>
          );
        })}
      </section>
      <section id="scenes">
        <h2 className="font-serif text-2xl">Scene versions</h2>
        <p className="text-sm">
          The built-in Blender hall is available as a rollback. Uploaded
          versions must include every room, shelf and screen anchor.
        </p>
        <EditorForm
          command="scene"
          version={activeVersions}
          label="Activate scene"
        >
          <Field label="Version">
            <Select
              name="assetId"
              options={[
                { value: "builtin", label: "Built-in hall" },
                { value: "", label: "New version from uploaded GLB" },
                ...assets.map((a) => ({
                  value: a.id,
                  label:
                    "Version " + a.version + (a.isActive ? " · active" : ""),
                })),
              ]}
              defaultValue={assets.find((a) => a.isActive)?.id ?? "builtin"}
            />
          </Field>
          <Field label="Media for new version">
            <Select
              name="mediaId"
              options={[
                emptyOption,
                ...media
                  .filter((m) => m.kind === "model3d")
                  .map((m) => ({ value: m.id, label: m.title ?? m.id })),
              ]}
            />
          </Field>
        </EditorForm>
      </section>
    </>
  );
}

export default officePage(LibraryEditor);
