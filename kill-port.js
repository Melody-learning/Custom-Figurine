const { execSync } = require('child_process');

try {
  console.log("Locating process on TCP port 3000...");
  let pids = [];
  
  if (process.platform === 'win32') {
    const netstat = execSync('netstat -ano').toString();
    netstat.split('\n').forEach(line => {
      const parts = line.trim().split(/\s+/);
      // Expected: PROTOCOL LOCAL_ADDRESS FOREIGN_ADDRESS STATE PID
      if (parts.length > 4 && parts[1].includes(':3000')) {
        pids.push(parts[4]);
      }
    });
  }

  // Deduplicate and filter out '0' (Idle)
  pids = [...new Set(pids)].filter(pid => pid !== '0');

  if (pids.length === 0) {
    console.log("No process found running on port 3000.");
  } else {
    for (const pid of pids) {
      console.log(`Killing Next.js dev server with PID: ${pid}`);
      execSync(`taskkill /PID ${pid} /F`);
    }
  }
} catch (e) {
  console.error("Failed to kill processes:", e.message);
}
