import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import resume from "@/content/resume.json";
import { getCollection } from "@/lib/library/catalog";
import { detailHref } from "@/lib/library/model";
import "./resume.css";

export const metadata: Metadata = {
  title: `Résumé | ${resume.name}`,
  description: `${resume.name} — ${resume.title}. Skills, selected projects, experience, and credentials.`,
};

const pdf = "/john-overton-bell-resume.pdf";

const reportSlugs: Record<string, string> = { "GoWipe Co": "gowipe", "Vantage Movers": "vantage-movers", "Overtech Digital Services": "overtech-digital-services", "Agentic Mission Control": "agentic-mission-control", "AI Engineer Platform": "ai-engineer-platform" };
async function ReportLink({ name }: { name: string }) {
  const data = await getCollection({ database: true });
  const volume = data.volumes.find((entry) => entry.kind === "Project" && entry.indexable && (entry.slug === reportSlugs[name] || entry.projectSlug === reportSlugs[name]));
  return volume ? <li><Link href={detailHref(volume)} prefetch={false}>Case study</Link></li> : null;
}
function Projects({ id, title, projects, note }: {
  id: string;
  title: string;
  projects: typeof resume.clientWork;
  note?: string;
}) {
  return (
    <section className="rs-section" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <ul className="rs-entries">
        {projects.map((project) => (
          <li key={project.name}>
            <div className="rs-project-heading">
              <h3>{project.name}</h3>
              <ul className="rs-project-links" aria-label={`${project.name} links`}>
                <Suspense><ReportLink name={project.name} /></Suspense>
                {project.links.map(({ label, url }) => (
                  <li key={url}>
                    <a href={url} aria-label={`${project.name} ${label}`}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <p>{project.detail}</p>
          </li>
        ))}
      </ul>
      {note && <p className="rs-note">{note}</p>}
    </section>
  );
}

export default function Resume() {
  return (
    <main className="rs-page">
      <nav className="rs-nav" aria-label="Résumé navigation">
        <Link href="/projects" prefetch={false}>← Selected Work</Link>
        <a className="rs-download" href={pdf} download>Download PDF</a>
      </nav>
      <article className="rs-sheet" aria-labelledby="resume-name">
        <header className="rs-header">
          <p className="rs-kicker">Résumé</p>
          <h1 id="resume-name">{resume.name}</h1>
          <p className="rs-title">{resume.title}</p>
          <ul className="rs-contact" aria-label="Contact and profiles">
            <li>{resume.location}</li>
            <li><a href={`mailto:${resume.email}`}>{resume.email}</a></li>
            {resume.profiles.filter((profile) => profile.label !== "Portfolio").map((profile) => (
              <li key={profile.url}><a href={profile.url}>{profile.label}</a></li>
            ))}
          </ul>
        </header>
        <section className="rs-section" aria-labelledby="resume-profile">
          <h2 id="resume-profile">Profile</h2>
          <p>{resume.summary}</p>
        </section>
        <section className="rs-section" aria-labelledby="resume-skills">
          <h2 id="resume-skills">Technical Skills</h2>
          <ul className="rs-skills">
            {resume.skills.map((skill) => (
              <li key={skill.label}><strong>{skill.label}:</strong> {skill.detail}</li>
            ))}
          </ul>
        </section>
        <Projects id="resume-client" title="Selected Projects: Client Work" projects={resume.clientWork} />
        <Projects id="resume-ai" title="Selected Projects: AI Products & Infrastructure" projects={resume.aiWork} note={resume.aiStatus} />
        <section className="rs-section" aria-labelledby="resume-experience">
          <h2 id="resume-experience">Professional Experience</h2>
          <ul className="rs-entries">
            {resume.experience.map((job) => (
              <li key={job.company}>
                <h3>{job.role} · {job.company}</h3>
                <p className="rs-note">{job.dates}</p>
                <p>{job.detail}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rs-section" aria-labelledby="resume-education">
          <h2 id="resume-education">Education &amp; Credentials</h2>
          <ul className="rs-entries">
            {resume.education.map((credential) => (
              <li key={credential.name}>
                <h3>{credential.name}</h3>
                <p>{credential.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}
