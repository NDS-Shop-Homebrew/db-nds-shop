import { execSync } from "child_process";
import fs from "fs";
import path from "path";

let gitTag: string;

try {
  gitTag = execSync("git describe --tags --abbrev=0").toString().trim();
} catch (err) {
  gitTag = "dev";
}

const envPath: string = path.resolve("./.env");

let envContent = "";
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, "utf-8");
}

const lines = envContent.split(/\r?\n/);
let found = false;

const newLines = lines.map((line) => {
  if (line.startsWith("VITE_APP_VERSION=")) {
    found = true;
    return `VITE_APP_VERSION=${gitTag}`;
  }
  return line;
});

if (!found) {
  newLines.push(`VITE_APP_VERSION=${gitTag}`);
}

fs.writeFileSync(envPath, newLines.join("\n"));

console.log(`✅ Updated .env with version: ${gitTag}`);
