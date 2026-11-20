
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDirectory = path.join(__dirname, "../data");

export async function readData(fileName) {
  const filePath = path.join(dataDirectory, fileName);

  const data = await fs.readFile(filePath, "utf-8");

  return JSON.parse(data);
}

export async function writeData(fileName, data) {
  const filePath = path.join(dataDirectory, fileName);

  await fs.writeFile(
    filePath,
    JSON.stringify(data, null, 2)
  );
}
