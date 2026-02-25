const { createServer } = require("node:http");
const fs = require("node:fs");

let env = {};
try {
  const file = fs.readFileSync(".env", "utf8");
  file.split("\n").forEach((line) => {
    const [k, v] = line.split("=");
    if (k) env[k.trim()] = v?.trim();
  });
} catch {}

const PORT = env.PORT || 3000;
const HOSTNAME = env.HOSTNAME || "127.0.0.1";

let DEVICES = [{ id: 1, device: "Smart Lamp", status: "on", room: "Kitchen" }];

/* --- читання body --- */
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

const server = createServer((req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader("Content-Type", "application/json; charset=utf-8");

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

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}`);
});
