# Next session — project showcases and the 2D portfolio

**Implemented locally November 13, 2026.** See the [delivery and source evidence](SHOWCASES_AND_2D_DELIVERY.md), [private first edition](http://127.0.0.1:3078/admin/library/preview?portfolio=1), and [next handoff for final organization and deployment readiness](FINAL_ORGANIZATION_AND_DEPLOYMENT.md). The original assignment below is retained; content promotion and hosted release have not occurred.

The next milestone is a reviewable first edition of the portfolio. The owner wants a **GPT-6 Astra** agent to inspect the actual projects on this machine and their remote counterparts, create substantial showcases and walkthroughs, and build a polished portfolio that works without the 3D world. Finish with a handoff for final organization and deployment readiness. The Travellers Rest experience, book handling, and portrait have their own records in [HANDOFF.md](../HANDOFF.md). Use those as the baseline and check the seams where the new work touches them.

## Accepted résumé and proposed placement

The owner accepted the current résumé draft. Its opening reads:

> I build cross-platform software, including web apps, progressive web apps (PWAs), and mobile apps, along with the servers, background workers, and agent systems behind them. My AI work focuses on rigorous software development practices, durable workflows, and research that evaluates claims against source evidence.

The résumé uses the current GitHub account, grouped showcases, corrected employment dates, and the TripleTen credential. React Native is a listed skill. Only document a shipped mobile or desktop product if you can verify one. Daryl Davis was removed from the résumé at the owner's request. That decision was about the résumé.

Review [the local résumé](http://127.0.0.1:3078/resume) and its [two-page PDF](http://127.0.0.1:3078/john-overton-bell-resume.pdf). The HTML and PDF share [the résumé content](../content/resume.json). Regenerate the PDF with [the ReportLab builder](../scripts/build-resume.py) if the content changes. Only the credential and completion date belong on the public site. The transcript contains personal details.

**Recommended placement:** Give **Résumé** a first-level link beside **Selected Work** in the 2D portfolio header. On the landing page, pair a short introduction with **View résumé** and make **Download PDF** easy to find on the résumé page. Use the same `/resume` route from the estate navigation and text catalog. When selected reports are public, add links back to those reports from the corresponding web résumé entries while keeping the external project links in the two-page PDF. A recruiter should be able to reach the résumé, then a relevant case study, without entering the 3D world.

## Inspect the projects and produce the showcases

Start with the five résumé groups below. Inventory the other existing books and verified projects before proposing which belong in the first edition. Use [the report authoring guide](PROJECT_REPORTS.md), [the existing showcase record](PATHWAY_SHOWCASES.md), and [the iteration guide](ITERATING_ON_THE_LIBRARY.md) to find what can be reused and how to stage updates. The owner's new direction is to create substantive case studies from project evidence. Prior notes about placeholder reports describe the earlier pass.

| Showcase | Where to start | Walkthrough to investigate |
| --- | --- | --- |
| Vantage Movers | Local workspace `C:/Users/Pinda/Proyectos/vantage`. Read its instructions, then locate `vantage-movers-clients`, `vantage-main-server`, `vantage-operations-server`, `vantage-admin`, and existing walkthrough captures. Compare the [main site](https://vantagehomemovers.com/) and [landing page](https://vantagemoves.com/). | Show a visitor's quote flow and, with sanitized demo data, how a lead reaches the CRM and can be followed through booking or cancellation. Apply client disclosure rules to every artifact. |
| GoWipe | [Storefront](https://gowipe.co/), its existing project book and source media. Locate a local or authorized remote store project if available. | Walk through a relevant storefront interaction. Explain how it maps to conversion instrumentation using source or demo evidence; report measured results only when documented. |
| Overtech Digital Services and Research Agent | Find the owning local checkout by matching its declared remote or deployment. Compare the [studio site](https://overtech-digital-services.vercel.app/) and [agent endpoint](https://overtech-research-agent.vercel.app/) with the local project and the recorded mission used by the existing book. | Show the studio's intake or research reader, then follow a concrete finding to its evidence. Recheck whether the studio is still a launch page. Verify agent behavior separately from the endpoint's health status. |
| Agentic Mission Control | `C:/Users/Pinda/Proyectos/BellLabs/platform/mission-control` and its [public repository](https://github.com/jbell-rusty-vantage/agentic-mission-control). Check the BellLabs service inventory for the separately owned Mission Control web app. | Show one bounded Deep Agents workflow from its manifest through execution, review, and an inspectable deliverable. Use a reproducible lab run or a dated recording whose source can be traced. |
| AI Engineer Platform | BellLabs `platform/knowledge-services` and `aiengineer/ai-engineer-service`. Compare [Agent Knowledge Services](https://github.com/jbell-rusty-vantage/agent-knowledge-services) and [AI Engineer Services](https://github.com/jbell-rusty-vantage/ai-engineer-services). Inspect the student web app separately if the current handoff points to it. | Show a source becoming a verified claim and retrievable evidence, then demonstrate a supported HTTP API, MCP, or CLI interaction with the student or reporting workflow. Identify integration limits from evidence. Investor-facing tools are planned. |

1. Read each owning repository's instructions and live handoff first. For BellLabs, start at `C:/Users/Pinda/Proyectos/BellLabs/AGENTS.md` and its service inventory. Record the local checkout and revision, remote or deployment, and observation date. Compare source and deployed behavior. Where they differ, explain which version the visitor is seeing.
2. Give each featured case study a clear problem, John's role, the main decisions, a real task shown from start to finish, and proof of the result. Use annotated screenshots, a short recording with a caption or transcript when appropriate, and a readable architecture figure where it explains a real tradeoff. Design each walkthrough around a task the visitor can follow, such as inspecting a citation or tracing a lead, rather than a scroll through screens.
3. Tie important claims to a file, commit, dated capture, or reproducible run. Record whether the capability is implemented, tested locally, integrated with real dependencies, or qualified on a hosted target. Label demo data, mock behavior, and planned features. If a remote is unavailable or an account is out of scope, use local proof where possible and record the concrete gap in the final handoff.
4. Stage updated content through the existing project, book, and report path. Reuse stable project slugs and report section keys so the 2D view and the 3D books agree. Keep raw captures and confidential evidence out of public assets. Apply `display`, `activation`, `redaction_policy`, `public_alias`, and `show_name` consistently to text, media, links, and deep links. Use disposable or sanitized data for anything that exercises a workflow.

## Build the 2D portfolio

Review the current [text catalog](http://127.0.0.1:3078/catalog), `/projects`, and the real [draft cabinet](http://127.0.0.1:3078/admin/library/preview#cabinet) before deciding what to change. The proposal is to make the existing `/projects` route the designed 2D entry, expose it as **Browse portfolio** at the front door, and keep the choice to enter Travellers Rest easy to find. Confirm the route and links against live code. The 2D home should give visitors a quick introduction, a small set of strong project cards, and direct access to the résumé, reports, and walkthroughs. Keep `/catalog` as a lightweight text path.

Carry the estate's typography and materials into a readable, responsive layout. Show real project images with generous room for captions and legible diagrams. Reuse the authorized collection and `ProjectReport` so cards, reports, and books share content and visibility. Provide direct links to case studies and test keyboard navigation, reduced motion, readable mobile layout, media controls, and Back from a project to the selected work. The entry and report journey must run without loading the 3D scene.

Add one compact **History of Travellers Rest** feature using the [sourced 2D copy and exhibit brief](OVERTON_HISTORY.md). Give visitors the complete short arc through emancipation in plain text, with an optional link to the fuller exhibit inside the 3D library.

## Finish with the next handoff

- Deliver review links for the 2D entry, the résumé, and the selected case studies. Include an inventory of showcased, deferred, and blocked projects, with the evidence behind each decision. Note the source revision or dated capture for each walkthrough.
- Verify the integrated visitor journey on desktop and at phone width. Exercise entrance → 2D work → report → walkthrough → Back, the résumé and PDF download, and direct URLs for hidden material. Check that the corresponding 3D books still open their reports and return to the marked page. Run typecheck, lint, focused browser checks, and the migration-free production build. Distinguish phone emulation from any physical device check.
- Write the next handoff for **final organization and deployment readiness**. Specify the proposed first-edition lineup and navigation order, the artifacts and content records that need promotion, the remaining source or client approvals, and the exact checks still needed for the hosted visitor path. Summarize the target deployment, database or asset changes, local proof versus hosted proof, and a rollback or withdrawal path. Record what remains local or unpublished so the next session can plan the release from the actual state.

## Start prompt

```text
Run this session with GPT-6 Astra in C:\Users\Pinda\Overton-Portfolio-local.

Read the applicable AGENTS.md files, HANDOFF.md, and docs/SHOWCASES_AND_2D_NEXT.md. Follow that brief as the current assignment. Inspect my projects on disk and their remote repositories and deployments. Use real project evidence to make polished case studies and walkthroughs, beginning with the résumé projects. Build and verify the designed 2D portfolio, with a direct path to Selected Work, project reports, and the accepted two-page résumé. Use the existing 3D portfolio as the integration baseline.

Deliver the working local preview, reviewed visuals and evidence, and a fresh handoff for final organization and deployment readiness. Flag any remaining issue that affects the first release, with the specific proof or decision it still needs. This session ends with that handoff.
```
