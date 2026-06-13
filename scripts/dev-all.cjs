const path = require("node:path");
const net = require("node:net");
const http = require("node:http");
const { spawn } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const defaultPort = Number(process.env.STYLESENSE_PORT || 4000);

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function canBind(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findFreePort(startPort, maxChecks = 30) {
  for (let i = 0; i < maxChecks; i += 1) {
    const port = startPort + i;
    // eslint-disable-next-line no-await-in-loop
    const free = await canBind(port);
    if (free) return port;
  }
  throw new Error(`No free port found from ${startPort} to ${startPort + maxChecks - 1}`);
}

function prefixStream(stream, prefix) {
  stream.on("data", (chunk) => {
    const text = chunk.toString();
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (!line) continue;
      process.stdout.write(`[${prefix}] ${line}\n`);
    }
  });
}

function waitForHealth(port, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    function probe() {
      const req = http.get(
        {
          hostname: "127.0.0.1",
          port,
          path: "/health",
          timeout: 1500,
        },
        (res) => {
          res.resume();
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
            resolve();
            return;
          }
          if (Date.now() - startedAt >= timeoutMs) {
            reject(new Error(`Server health check failed with status ${res.statusCode}`));
            return;
          }
          setTimeout(probe, 600);
        }
      );

      req.on("timeout", () => {
        req.destroy();
      });

      req.on("error", () => {
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error("Server health check timed out."));
          return;
        }
        setTimeout(probe, 600);
      });
    }

    probe();
  });
}

function run(command, args, cwd, env, name) {
  const useWindowsCmd = process.platform === "win32";
  const launchCommand = useWindowsCmd ? "cmd.exe" : command;
  const launchArgs = useWindowsCmd ? ["/d", "/s", "/c", [command, ...args].join(" ")] : args;

  const child = spawn(launchCommand, launchArgs, {
    cwd,
    env,
    stdio: ["inherit", "pipe", "pipe"],
  });
  prefixStream(child.stdout, name);
  prefixStream(child.stderr, name);
  return child;
}

function stopProcessTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  child.kill("SIGTERM");
}

async function main() {
  const port = await findFreePort(defaultPort);
  if (port !== defaultPort) {
    log(`Port ${defaultPort} is busy. Using ${port} instead.`);
  }

  const baseEnv = { ...process.env };
  const apiBase = `http://localhost:${port}/api/v1`;

  log(`Starting server on port ${port}...`);
  const serverProc = run(
    "npm",
    ["run", "dev:plain"],
    path.join(rootDir, "server"),
    { ...baseEnv, STYLESENSE_PORT: String(port) },
    "server"
  );

  let shuttingDown = false;
  let clientProc = null;

  function shutdown(code = 0) {
    if (shuttingDown) return;
    shuttingDown = true;
    stopProcessTree(clientProc);
    stopProcessTree(serverProc);
    setTimeout(() => process.exit(code), 350);
  }

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));

  serverProc.on("exit", (code) => {
    if (!shuttingDown) {
      log(`Server exited with code ${code ?? 1}.`);
      shutdown(code ?? 1);
    }
  });

  await waitForHealth(port);
  log(`Server healthy. Starting client with API ${apiBase}`);

  clientProc = run(
    "npm",
    ["run", "dev"],
    path.join(rootDir, "client"),
    {
      ...baseEnv,
      NEXT_PUBLIC_API_URL: apiBase,
      REACT_APP_API_URL: `http://localhost:${port}`,
    },
    "client"
  );

  clientProc.on("exit", (code) => {
    if (!shuttingDown) {
      log(`Client exited with code ${code ?? 1}.`);
      shutdown(code ?? 1);
    }
  });
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
