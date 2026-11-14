// Profile the designed 2D portfolio and actual continuous estate on the selected server.
process.env.PROFILE_BASE ??= "http://127.0.0.1:3078";
process.env.PROFILE_PORTFOLIO ??= "/admin/preview/portfolio";
process.env.PROFILE_ESTATE ??= "/admin/preview/library";
await import("./profile-release.mjs");
