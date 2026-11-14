import type { EstateProgram } from "@/lib/estate/model";
import { LeafBody } from "@/components/library/Reading";
import { Icon } from "./Marks";

export default function HouseBook({
  program,
  index,
  examine,
}: {
  program: EstateProgram;
  index: number;
  examine: (id: string) => void;
}) {
  const page = program.book.pages[index];
  const cue = program.spreads.find((c) => c.key === page.key);
  const length = program.book.pages.length;
  const title =
    page.blocks.find((b) => b.kind === "heading")?.text ?? page.title;
  const copy = {
    ...page,
    blocks: page.blocks.filter(
      (b) => b.kind !== "heading" && b.kind !== "link",
    ),
  };
  const sources = page.blocks.filter((b) => b.kind === "link");
  return (
    <section className="ea-reading">
      <div className="ea-wrap">
        <div className="ea-reading-title">
          <div>
            <p className="ea-overline">
              <Icon name="book" size={16} /> At the writing table
            </p>
            <h1 tabIndex={-1}>{program.book.title}</h1>
          </div>
          <a className="ea-text-button" href="#library">
            <Icon name="back" />
            Return to the library
          </a>
        </div>
        <article className="ea-spread" key={page.key}>
          <div className={"ea-verso leaf-" + index}>
            <span className="ea-overline">Travellers Rest</span>
            <div>
              <span className="ea-leaf-number">
                {["I", "II", "III", "IV"][index] ?? index + 1}
              </span>
              <span className="ea-rule" />
              <p>A visitor’s companion</p>
            </div>
            <span className="ea-overline">John Overton’s house book</span>
          </div>
          <div className="ea-recto">
            <span className="ea-overline">
              Leaf {index + 1} of {length}
            </span>
            <h2>{title}</h2>
            <LeafBody page={copy} />
            {cue && (
              <button
                className="ea-object-link"
                onClick={() => examine(cue.object)}
              >
                <Icon name="eye" size={17} />
                {cue.label}
                <Icon name="diagonal" size={14} />
              </button>
            )}
            {sources.length > 0 && (
              <details className="ea-citations">
                <summary>Sources for this leaf</summary>
                {sources.map((b, i) => (
                  <a key={i} href={b.url} target="_blank" rel="noreferrer">
                    {b.text} ↗
                  </a>
                ))}
              </details>
            )}
          </div>
        </article>
        {index === length - 1 && (
          <p className="ea-invitation">
            <small>Interpretive guide</small> The family cabinet is open to you.
            My descendant John keeps his own work there.
          </p>
        )}
        <div className="ea-reader-nav">
          <a
            className="ea-text-button"
            href={index ? "#leaf-" + index : "#library"}
          >
            <Icon name="back" />
            {index ? "Previous leaf" : "Back to the room"}
          </a>
          <nav aria-label="House book pages">
            {program.book.pages.map((p, i) => (
              <a
                key={p.key}
                aria-label={"Leaf " + (i + 1)}
                aria-current={i === index ? "page" : undefined}
                href={"#leaf-" + (i + 1)}
              >
                {i + 1}
              </a>
            ))}
          </nav>
          <a
            className="ea-button dark"
            href={index + 1 >= length ? "#cabinet" : "#leaf-" + (index + 2)}
          >
            {index + 1 >= length ? "Open the family cabinet" : "Turn the page"}
            <Icon name="arrow" />
          </a>
        </div>
      </div>
    </section>
  );
}
