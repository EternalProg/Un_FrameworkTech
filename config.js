const fs = require("node:fs");
const path = require("node:path");

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env.example");
  if (!fs.existsSync(envPath)) return;

  const file = fs.readFileSync(envPath, "utf8");
  file.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  });
}

function isValidPort(value) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

loadEnvFile();

const errors = [];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    errors.push(`${name} is required`);
  }
  return value;
}

const PORT = requireEnv("PORT");
const HOSTNAME = requireEnv("HOSTNAME");
const NODE_ENV = requireEnv("NODE_ENV");

if (PORT && !isValidPort(PORT)) {
  errors.push("PORT must be an integer between 1 and 65535");
}

if (NODE_ENV && NODE_ENV !== "development" && NODE_ENV !== "production") {
  errors.push("NODE_ENV must be development or production");
}

if (errors.length) {
  console.error("Invalid environment configuration:");
  errors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

module.exports = {
  PORT: Number(PORT),
  HOSTNAME,
  NODE_ENV,
};
