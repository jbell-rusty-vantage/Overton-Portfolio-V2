// Hidden starter previews are available only on this explicitly loopback-bound development server.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const office = process.argv[2] === "--office";
const port = Number(process.argv[office ? 3 : 2] || (office ? 3078 : 3077));
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw Error("Invalid preview port");
const bin = createRequire(import.meta.url).resolve("next/dist/bin/next");
if (office) console.log("Local PostgreSQL office: http://127.0.0.1:" + port + "/admin");
const child = spawn(
  process.execPath,
  [bin, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "development",
      LIBRARY_CONTENT_SOURCE: office ? "database" : process.env.LIBRARY_CONTENT_SOURCE || "database",
      LIBRARY_LOCAL_REVIEW: office ? "" : "loopback",
      LIBRARY_OFFICE_HOST: office ? "127.0.0.1:" + port : "",
      LIBRARY_OFFICE_TEST: "",
    },
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
