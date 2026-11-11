import Link from "next/link";
import type { Metadata } from "next";
import { gameDetails, games } from "@/lib/performances";
import "./performances.css";

export const metadata: Metadata = {
  title: "Game performances",
  description: "Match film and highlight clips from John Overton's games.",
};

export default function Page() {
  return (
    <main className="perf">
      <p className="perf-crumb">
        <Link prefetch={false} href="/">
          The Library
        </Link>{" "}
        / Game performances
      </p>
      <h1>Game performances</h1>
      <p className="perf-summary">Match film, cut into individual plays: goals, shots, dribbles and the work off the ball.</p>
      <ul className="perf-games">
        {games.map((game) => (
          <li key={game.slug}>
            <Link prefetch={false} className="perf-card" href={`/performances/${game.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static poster */}
              <img src={game.clips[0]?.poster} alt="" />
              <div>
                <h2>{game.title}</h2>
                {gameDetails(game) && <p>{gameDetails(game)}</p>}
                <p>
                  {game.goals} {game.goals === 1 ? "goal" : "goals"} · {game.clips.length}{" "}
                  {game.clips.length === 1 ? "clip" : "clips"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
