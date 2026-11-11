import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import ClipPlayer from "@/components/performances/ClipPlayer";
import { gameDetails, games, getGame } from "@/lib/performances";
import "../performances.css";

export function generateStaticParams() {
  return games.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: PageProps<"/performances/[slug]">) {
  const game = getGame((await params).slug);
  return game
    ? { title: `${game.title} · Game performances`, description: game.summary }
    : { title: "Game not found" };
}

export default function Page({ params }: PageProps<"/performances/[slug]">) {
  return (
    <Suspense fallback={<main className="perf"><p>Loading game…</p></main>}>
      <GamePage params={params} />
    </Suspense>
  );
}

async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const game = getGame((await params).slug);
  if (!game) notFound();
  const count = (kind: string) => game.clips.filter((c) => c.kind === kind).length;

  return (
    <main className="perf">
      <p className="perf-crumb">
        <Link prefetch={false} href="/performances">
          Game performances
        </Link>{" "}
        / {game.title}
      </p>
      <h1>{game.title}</h1>
      <p className="perf-meta">
        {gameDetails(game, [game.footage])}
      </p>
      <p className="perf-summary">{game.summary}</p>
      <ul className="perf-stats">
        {(
          [
            [game.goals, game.goals === 1 ? "Goal" : "Goals"],
            [count("shot"), "Other shots"],
            [count("dribble"), "Dribbles"],
            [count("pass"), "Key passes"],
            [game.clips.length, game.clips.length === 1 ? "Clip" : "Clips"],
          ] as const
        )
          .filter(([n]) => n > 0)
          .map(([n, label]) => (
            <li key={label}>
              <b>{n}</b>
              <span>{label}</span>
            </li>
          ))}
      </ul>
      <ClipPlayer clips={game.clips} />
    </main>
  );
}
