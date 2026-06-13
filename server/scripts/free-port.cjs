const { execSync } = require("node:child_process");

const requestedPort = Number(process.env.STYLESENSE_PORT || process.env.PORT || 4000);
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 4000;

function getListeningPidsWindows(targetPort) {
  try {
    const output = execSync(
      `netstat -ano -p tcp | findstr LISTENING | findstr :${targetPort}`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );
    const pids = new Set();
    for (const line of output.split(/\r?\n/)) {
      const match = line.trim().match(/\s(\d+)\s*$/);
      if (!match) continue;
      const pid = Number(match[1]);
      if (Number.isInteger(pid) && pid > 0) pids.add(pid);
    }
    return Array.from(pids);
  } catch {
    return [];
  }
}

function killPidWindows(pid) {
  try {
    execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function main() {
  if (process.platform !== "win32") return;

  const pids = getListeningPidsWindows(port).filter((pid) => pid !== process.pid);
  if (pids.length === 0) return;

  for (const pid of pids) {
    const ok = killPidWindows(pid);
    if (ok) {
      console.log(`[predev] Freed port ${port} by stopping PID ${pid}`);
    } else {
      console.warn(`[predev] Could not stop PID ${pid} on port ${port}`);
    }
  }
}

main();
