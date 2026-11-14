import { imageDelivery } from "@/lib/library/image-delivery";
import Link from "next/link";
import resume from "@/content/resume.json";
import { type Collection, type ReadingScope, type Volume, detailHref, withinPreview } from "@/lib/library/model";
import { portfolioHref, portfolioSelection, projectPicture } from "@/lib/library/portfolio";
import PortfolioArrival from "./PortfolioArrival";
import "./portfolio.css";

function Project({ volume, index, admin }: { volume: Volume; index: number; admin: ReadingScope }) {
  const picture = projectPicture(volume);
  const href = withinPreview(detailHref(volume), admin);
  const walkthrough = volume.pages.find((page) => /walkthrough/i.test(page.title)) ?? volume.pages.find((page) => page.blocks.some((block) => block.kind === "video"));
  return <article className="pf-project" id={"work-" + volume.slug}>
    <figure>
      <Link href={href} prefetch={false} tabIndex={-1} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- authorized natural product captures */}
        {picture.url && <img {...imageDelivery(picture.url, "(max-width: 700px) 92vw, 46vw")} alt="" loading="lazy" className={picture.url === volume.cover ? "pf-poster" : undefined} />}
      </Link>
      <figcaption>{picture.caption}</figcaption>
    </figure>
    <div className="pf-project-copy">
      <p className="pf-kicker"><span>{String(index + 1).padStart(2, "0")}</span>{volume.status ?? "Project study"}</p>
      <h3><Link href={href} prefetch={false}>{volume.title}</Link></h3>
      <p>{volume.summary}</p>
      {volume.role && <p className="pf-role">{volume.role}</p>}
      <div className="pf-project-actions"><Link href={href} prefetch={false}>Read the case study <span aria-hidden="true">↗</span></Link>
        {walkthrough && <Link href={href + "#report-section-" + encodeURIComponent(walkthrough.key)} prefetch={false}>Follow the walkthrough →</Link>}
      </div>
    </div>
  </article>;
}

export default function Portfolio({ data, admin = false }: { data: Collection; admin?: ReadingScope }) {
  const { selected, other } = portfolioSelection(data.volumes);
  const estate = admin === true ? "/admin/preview/library" : "/library";
  return <div className="portfolio">
    <PortfolioArrival />
    <a className="pf-skip" href="#selected-work">Skip to selected work</a>
    <header className="pf-header"><Link href={portfolioHref(admin)} prefetch={false} className="pf-name">John Overton Bell<span>Software developer</span></Link>
      <nav aria-label="Portfolio navigation"><a href="#selected-work">Selected Work</a><Link href="/resume" prefetch={false}>Résumé</Link><Link href={estate} prefetch={false}>The Library <span aria-hidden="true">↗</span></Link></nav>
    </header>
    <main>
      {admin && <p className="pf-draft">Private first-edition review · Includes unpublished content. <Link href="/admin/library" prefetch={false}>Return to the office ↗</Link></p>}
      <section className="pf-hero" aria-labelledby="portfolio-title">
        <div><p className="pf-kicker">Independent work. Connected systems.</p><h1 id="portfolio-title">Software with<br /><em>work to do.</em></h1>
          <p className="pf-intro">I’m John. I build web applications, commerce experiences and the servers, workers and agent systems behind them.</p>
          <p className="pf-intro-detail">These studies follow the work from a person’s task to the decisions, interfaces and evidence that make it possible.</p>
          <div className="pf-actions"><a href="#selected-work">Explore selected work ↓</a><Link href="/resume" prefetch={false}>View résumé ↗</Link></div>
        </div>
        <aside className="pf-note"><span className="pf-monogram" aria-hidden="true">JB</span><p className="pf-kicker">A practice in three parts</p><ol><li><span>01</span><strong>Useful interfaces</strong><p>Clear paths through a real task.</p></li><li><span>02</span><strong>Connected operations</strong><p>The services behind the screen.</p></li><li><span>03</span><strong>Inspectable AI</strong><p>Research tied to its source evidence.</p></li></ol></aside>
      </section>
      <section id="selected-work" tabIndex={-1} className="pf-work" aria-labelledby="selected-title"><div className="pf-section-heading"><div><p className="pf-kicker">Selected work</p><h2 id="selected-title">From the interface<br />to the infrastructure.</h2></div><p>Client platforms and independent research systems. Each case study makes its scope and evidence visible.</p></div>
        {data.source === "unavailable" ? <p className="pf-empty" role="status">The collection is temporarily unavailable. Please reload to try again. My résumé remains available above.</p> : selected.length ? <div className="pf-projects">{selected.map((volume, index) => <Project key={volume.slug} volume={volume} index={index} admin={admin} />)}</div> : <p className="pf-empty">The selected case studies are being prepared for publication. Explore my experience in the <Link href="/resume" prefetch={false}>résumé</Link>.</p>}
      </section>
      {other.length > 0 && <section className="pf-more" aria-labelledby="more-title"><p className="pf-kicker">Further reading</p><h2 id="more-title">Elsewhere on the shelves</h2><ul>{other.map((volume) => <li key={volume.slug}><Link href={withinPreview(detailHref(volume), admin)} prefetch={false}>{volume.title}<span aria-hidden="true">↗</span></Link><p>{volume.summary}</p></li>)}</ul></section>}
      <section className="pf-library"><div><p className="pf-kicker">A different way in</p><h2>The work also lives<br />in a library.</h2><p>My ancestor Judge John Overton’s library at Travellers Rest inspired this portfolio. Visit the room, take a project book from the cabinet, and read the same studies in a different setting.</p><Link href={estate} prefetch={false}>Enter Travellers Rest ↗</Link></div>
        {/* eslint-disable-next-line @next/next/no-img-element -- bundled estate illustration */}
        <img {...imageDelivery("/travellers-rest/plates/library.webp", "(max-width: 700px) 92vw, 46vw")} alt="An interpretive view of the library at Travellers Rest." loading="lazy" />
      </section>
      <article className="pf-history" aria-labelledby="history-title">
        <div><p className="pf-kicker">The place behind the portfolio</p><h2 id="history-title">History of<br />Travellers Rest</h2><p className="pf-history-dates">1789–1865</p></div>
        <div>
          <p>Judge John Overton came to Nashville in 1789 to practice law. He became a Tennessee judge, helped publish the state’s first law reports, and amassed wealth through land speculation and other ventures. Enslaved people helped build his plantation home, Travellers Rest, and their labor sustained it. Overton and his allies helped Andrew Jackson win the presidency in 1828.</p>
          <p>In 1864 the judge’s son John made Travellers Rest available to Confederate General John Bell Hood, whose army lost the Battle of Nashville. Tennessee voters approved abolition in February 1865. That December, ratification of the 13th Amendment abolished slavery nationwide, except as punishment for a crime after conviction.</p>
          <p className="pf-history-sources">Sources: <a href="https://www.historictravellersrest.org/history/nashville-from-frontier-to-home-of-the-u-s-president">Museum history</a> · <a href="https://travellersrestenslavedpersonsdocumentationproject.omeka.net/items/show/100">William’s record</a> · <a href="https://travellersrestenslavedpersonsdocumentationproject.omeka.net/items/show/101">Franklin’s record</a> · <a href="https://www.archives.gov/milestone-documents/13th-amendment">13th Amendment</a></p>
        </div>
      </article>
    </main>
    <footer className="pf-footer"><div><p className="pf-kicker">Let’s build something useful.</p><a href={`mailto:${resume.email}`}>{resume.email} ↗</a></div><nav aria-label="More about John"><Link href="/resume" prefetch={false}>Résumé</Link><a href="/john-overton-bell-resume.pdf" download>Download PDF</a><a href="/catalog">Text catalog</a></nav><p>John Overton Bell · The Library</p></footer>
  </div>;
}
