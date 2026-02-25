const { createServer } = require("node:http");
const fs = require("node:fs");

let env = {};
try {
  const file = fs.readFileSync(".env", "utf8");
  file.split("\n").forEach(line => {
    const [key, value] = line.split("=");
    if (key) env[key.trim()] = value?.trim();
  });
} catch {
  console.log(".env not found, using defaults");
}

const PORT = env.PORT || 3000;
const HOSTNAME = env.HOSTNAME || "127.0.0.1";

let MENU = [
  { id: 1, name: "Піца Гуцульська", category: "Піца", price: 250, available: true },
  { id: 2, name: "Борщ", category: "Супи", price: 120, available: true },
  { id: 3, name: "Чизкейк", category: "Десерти", price: 150, available: false },
];

function readBody(req, callback) {
  let body = "";
  req.on("data", chunk => body += chunk.toString());
  req.on("end", () => {
    try {
      callback(null, body ? JSON.parse(body) : {});
    } catch {
      callback("Invalid JSON");
    }
  });
}

/* --- Сервер --- */
const server = createServer((req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  /* ================= GET ================= */
  if (method === "GET" && pathname === "/menu") {
    const category = parsedUrl.searchParams.get("category");

    let results = [...MENU];
    if (category) {
      results = results.filter(
        d => d.category.toLowerCase() === category.toLowerCase()
      );
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({ count: results.length, items: results }));
  }

  /* ================= POST ================= */
  if (method === "POST" && pathname === "/menu") {
    return readBody(req, (err, data) => {
      if (err) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: err }));
      }

      /* Валідація */
      if (!data.name || typeof data.price !== "number") {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: "name(string) and price(number) required" }));
      }

      const nextId = MENU.length ? MENU[MENU.length - 1].id + 1 : 1;

      const dish = {
        id: nextId,
        name: data.name,
        category: data.category || "Інше",
        price: data.price,
        available: data.available ?? true,
      };

      MENU.push(dish);

      res.statusCode = 201;
      res.end(JSON.stringify({ message: "Created", dish }));
    });
  }

  /* ================= PUT (повна заміна) ================= */
  if (method === "PUT" && pathname.startsWith("/menu/")) {
    const id = Number(pathname.split("/")[2]);

    return readBody(req, (err, data) => {
      if (err) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: err }));
      }

      const index = MENU.findIndex(d => d.id === id);
      if (index === -1) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: "Not found" }));
      }

      /* Валідація */
      if (!data.name || typeof data.price !== "number") {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: "name and price required" }));
      }

      MENU[index] = {
        id,
        name: data.name,
        category: data.category || "Інше",
        price: data.price,
        available: data.available ?? true,
      };

      res.statusCode = 200;
      res.end(JSON.stringify({ message: "Replaced", dish: MENU[index] }));
    });
  }

  /* ================= PATCH (часткове оновлення) ================= */
  if (method === "PATCH" && pathname.startsWith("/menu/")) {
    const id = Number(pathname.split("/")[2]);

    return readBody(req, (err, data) => {
      if (err) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: err }));
      }

      const dish = MENU.find(d => d.id === id);
      if (!dish) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: "Not found" }));
      }

      /* Валідація */
      if (data.price && typeof data.price !== "number") {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: "price must be number" }));
      }

      Object.assign(dish, data);

      res.statusCode = 200;
      res.end(JSON.stringify({ message: "Patched", dish }));
    });
  }

  /* ================= 404 ================= */
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Route not found" }));
});

/* --- Запуск сервера --- */
server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});
