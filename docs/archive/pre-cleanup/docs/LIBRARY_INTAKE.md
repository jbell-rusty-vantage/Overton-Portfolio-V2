# Adding a volume

Use [the real local office](http://127.0.0.1:3078/admin) for data that should persist in PostgreSQL. See [the iteration guide](ITERATING_ON_THE_LIBRARY.md) for image registration, shelf renaming and the publication check.

In the librarian’s office, create a project with a title and summary. Keep its visibility hidden while editing. Tags and approved links become part of the generated reader. Publishing and ingestion have separate controls. A paused project can be readable.

Open **Library → Books & pages** to create a hidden book linked to the project. Hybrid books use the project overview and sources, plus any authored pages. An authored page with a matching template replaces that generated section. Additional pages retain distinct page links. Use **Shelf placement** to select a shelf and position. Slots run left to right across the top row first. Review the occupied slot before choosing a swap.

Use **Visitor preview** in the authenticated Library editor to read drafts in the room. Deliberately publish the project and its book when ready. Hiding either removes that presentation from discovery and direct public reads. A published project without a wrapper has a generated reading page. The normal public catalog never exposes the editor’s draft view.

## From a handwritten report

Keep the original report and its transcription private. Record the source page for each factual claim, mark uncertain words and leave unknown facts blank. Put only reviewed public prose into a project. A hidden database row cannot revoke an already shared public Blob URL.

For an offline review, save a local JSON bundle. The stable import key identifies the same draft on a later review. Keep notes and source-page references out of public pages.

```json
{
  "schemaVersion": 1,
  "projects": [{
    "importKey": "report-one",
    "slug": "example-draft",
    "title": "Example draft",
    "summary": "A reviewed description from the supplied report.",
    "sourcePages": [1],
    "uncertain": ["Confirm the technology named on page 2"],
    "display": "hidden",
    "placement": {"shelf": "stacks-data-knowledge", "position": 2}
  }]
}
```

Run `npm run draft:review -- path/to/bundle.json`. The reviewer checks allowed fields, links, duplicate keys, slugs and slot collisions within the bundle. It performs no network calls or writes. Cross-check existing records and actual occupancy on the intended database before a separately approved import. Match the import key to previously created records and preserve manual edits. The checked-in starter seed is restricted to its verified repository identities.

The browser-local sample placement desk is available at `/dev/library-admin` in local development. Sample edits, backups and reset affect only that browser’s sample collection.

