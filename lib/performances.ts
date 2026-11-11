// Game performances: match film, cut into individual clips.
//
// Clip files currently live in /public/performances/<game slug>/. To move them to
// Vercel Blob, upload each file (e.g. through /admin/media on the deployed site)
// and replace `src`/`poster` with the Blob URLs. Nothing else needs to change.

export type ClipKind = "goal" | "shot" | "dribble" | "pass" | "defense";

export type Clip = {
  id: string;
  title: string;
  kind: ClipKind;
  /** Approximate time in the full recording (mm:ss), when known. */
  at?: string;
  note: string;
  src: string;
  poster: string;
};

export type Game = {
  slug: string;
  title: string;
  opponent: string;
  league?: string;
  venue?: string;
  /** ISO date (yyyy-mm-dd), when known. */
  date?: string;
  team?: string;
  number?: number;
  /** Which part of the match the film covers. */
  footage: string;
  goals: number;
  summary: string;
  clips: Clip[];
};

const base = (slug: string) => (file: string) => `/performances/${slug}/${file}`;

const gunClub = "2026-09-06-gun-club-vs-brazil";
const g = base(gunClub);

export const games: Game[] = [
  {
    slug: gunClub,
    title: "Gun Club vs. Brazil",
    opponent: "Brazil (blue)",
    league: "Gun Club West Palm Adult League",
    venue: "Gun Club, West Palm Beach",
    date: "2026-09-06",
    team: "Red",
    number: 10,
    footage: "Part of the first half",
    goals: 2,
    summary:
      "Two goals against the Brazilian side in blue, plus a first shot on target, a 1v1 take-on and a long ball into the attack. Filmed from the bleachers on a phone.",
    clips: [
      {
        id: "goal-1",
        title: "Goal 1",
        kind: "goal",
        note: "First goal against Brazil.",
        src: g("08_goal_1.mp4"),
        poster: g("08_goal_1.jpg"),
      },
      {
        id: "goal-2",
        title: "Goal 2",
        kind: "goal",
        note: "Second goal against Brazil.",
        src: g("09_goal_2.mp4"),
        poster: g("09_goal_2.jpg"),
      },
      {
        id: "first-shot",
        title: "First shot on goal",
        kind: "shot",
        note: "First shot on goal of the game.",
        src: g("06_first_shot_on_goal.mp4"),
        poster: g("06_first_shot_on_goal.jpg"),
      },
      {
        id: "step-overs",
        title: "Step-overs",
        kind: "dribble",
        note: "Step-overs to take on the defender. The ball was lost at the end of this one, so it's useful to review.",
        src: g("07_stepovers_lost_ball.mp4"),
        poster: g("07_stepovers_lost_ball.jpg"),
      },
      {
        id: "take-on",
        title: "Dribble & take-on",
        kind: "dribble",
        at: "02:04",
        note: "Picks the ball up on the near touchline and beats the defender 1v1, then moves it on into the attack.",
        src: g("01_dribble_takeon_0204.mp4"),
        poster: g("01_dribble_takeon_0204.jpg"),
      },
      {
        id: "carry-long-pass",
        title: "Ball carry & long pass",
        kind: "pass",
        at: "14:24",
        note: "Collects near the touchline, carries forward into open space and the move ends with a long ball into the attack.",
        src: g("04_carry_longpass_1424.mp4"),
        poster: g("04_carry_longpass_1424.jpg"),
      },
      {
        id: "build-up",
        title: "Build-up support",
        kind: "pass",
        at: "12:44",
        note: "Offers a wide passing option as the team plays out, then moves up with the ball.",
        src: g("03_buildup_support_1244.mp4"),
        poster: g("03_buildup_support_1244.jpg"),
      },
      {
        id: "recovery-run",
        title: "Recovery run",
        kind: "defense",
        at: "16:12",
        note: "Sprints back to track a runner and get into shape.",
        src: g("05_recovery_run_1612.mp4"),
        poster: g("05_recovery_run_1612.jpg"),
      },
    ],
  },
  {
    slug: "wellington-mens-vs-royal-palm",
    title: "Wellington Mens vs. Royal Palm",
    opponent: "Royal Palm",
    footage: "Free kick",
    goals: 1,
    summary: "The match-winning goal, scored from a free kick in a night game.",
    clips: [
      {
        id: "free-kick-winner",
        title: "Free kick winner",
        kind: "goal",
        note: "Game-winning goal from a free kick.",
        src: "/performances/wellington-mens-vs-royal-palm/free_kick_goal.mp4",
        poster: "/performances/wellington-mens-vs-royal-palm/free_kick_goal.jpg",
      },
    ],
  },
];

/** "Gun Club West Palm Adult League · #10, Red", skipping unknown parts. */
export function gameDetails(game: Game, extra: (string | undefined)[] = []) {
  return [
    game.date && formatGameDate(game.date),
    game.league,
    game.venue,
    game.number !== undefined ? `#${game.number}${game.team ? `, ${game.team}` : ""}` : game.team,
    ...extra,
  ]
    .filter(Boolean)
    .join(" · ");
}

export const kindLabel: Record<ClipKind, string> = {
  goal: "Goal",
  shot: "Shot",
  dribble: "Dribble",
  pass: "Pass",
  defense: "Defense",
};

export function getGame(slug: string) {
  return games.find((game) => game.slug === slug);
}

export function formatGameDate(iso: string) {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
