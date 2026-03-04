const { createServer } = require("node:http");
const config = require("./config");

let DEVICES = [{ id: 1, device: "Smart Lamp", status: "on", room: "Kitchen" }];

function readBody(req, cb) {
  let body = "";
  req.on("data", (chunk) => (body += chunk.toString()));
  req.on("end", () => {
    try {
      cb(null, body ? JSON.parse(body) : {});
    } catch {
      cb("Invalid JSON");
    }
  });
}

function shouldLog(statusCode) {
  if (config.NODE_ENV === "development") return true;
  return statusCode >= 400;
}

function getLogLevel(statusCode) {
  if (statusCode >= 500) return "ERROR";
  if (statusCode >= 400) return "WARN";
  return "INFO";
}

function logRequest(method, pathname, statusCode) {
  if (!shouldLog(statusCode)) return;
  const timestamp = new Date().toISOString();
  const level = getLogLevel(statusCode);
  const logLine = `${timestamp} | ${level} | ${method} | ${pathname} | ${statusCode}`;
  console.log(logLine);
}

const server = createServer((req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  res.on("finish", () => {
    logRequest(method, pathname, res.statusCode);
  });

  // HEALTH
  if (method === "GET" && pathname === "/health") {
    res.statusCode = 200;
    return res.end(
      JSON.stringify(
        {
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
        },
        null,
        2
      )
    );
  }

  /* ================= 5xx ================= */
  if (method === "GET" && pathname === "/error") {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "Internal Server Error" }));
  }

  /* ================= GET ================= */
  if (method === "GET" && pathname === "/devices") {
    const room = parsedUrl.searchParams.get("room");

    let result = [...DEVICES];
    if (room) {
      result = result.filter(
        (d) => d.room.toLowerCase() === room.toLowerCase()
      );
    }

    res.statusCode = 200;
    return res.end(
      JSON.stringify({ count: result.length, items: result }, null, 2)
    );
  }

  /* ================= POST ================= */
  if (method === "POST" && pathname === "/devices") {
    return readBody(req, (err, data) => {
      if (err) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: err }));
      }

      /* валідація */
      if (!data.device || !data.room) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: "device and room required" }));
      }

      const nextId = DEVICES.length ? DEVICES[DEVICES.length - 1].id + 1 : 1;

      const newDevice = {
        id: nextId,
        device: data.device,
        status: data.status || "off",
        room: data.room,
      };

      DEVICES.push(newDevice);

      res.statusCode = 201;
      res.end(
        JSON.stringify({ message: "Device added", device: newDevice }, null, 2)
      );
    });
  }

  /* ================= PATCH ================= */
  if (method === "PATCH" && pathname.startsWith("/devices/")) {
    const id = Number(pathname.split("/")[2]);

    return readBody(req, (err, data) => {
      if (err) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: err }));
      }

      const device = DEVICES.find((d) => d.id === id);
      if (!device) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: "Device not found" }));
      }

      /* заборона змінювати id */
      if (data.id) delete data.id;

      Object.assign(device, data);

      res.statusCode = 200;
      res.end(JSON.stringify({ message: "Device updated", device }, null, 2));
    });
  }

  /* ================= DELETE ================= */
  if (method === "DELETE" && pathname.startsWith("/devices/")) {
    const id = Number(pathname.split("/")[2]);
    const initialLength = DEVICES.length;

    DEVICES = DEVICES.filter((d) => d.id !== id);

    if (DEVICES.length === initialLength) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: "Device not found" }));
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ message: "Device removed" }, null, 2));
    return;
  }

  /* ================= 404 ================= */
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(config.PORT, config.HOSTNAME, () => {
  console.log(`Server running at http://${config.HOSTNAME}:${config.PORT}`);
});

const SHUTDOWN_TIMEOUT_MS = 10000;
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}. Shutting down...`);

  // Якщо сервер не встиг закритися за цей час - завершити процес примусово.
  const shutdownTimer = setTimeout(() => {
    console.error("Shutdown timeout exceeded. Forcing exit.");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  // Після закриття завершити процес, а у випадку помилки завершити з іншим кодом.
  server.close((err) => {
    clearTimeout(shutdownTimer);
    if (err) {
      console.error("Error during server shutdown:", err);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  gracefulShutdown("unhandledRejection");
});
