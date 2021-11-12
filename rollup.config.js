import fs from "fs";
import { promises as fsPromises } from "fs";

const pkg = JSON.parse(
  fs.readFileSync("./package.json", { encoding: "utf-8" })
);

/**
 * Get userscript's metadata as tuples of key and value.
 * @returns {Promise<any>}
 */
async function getMetadataRecords() {
  // try to fill missing metadata values from package.json
  const fallback = ["name", "version", "description"].reduce((acc, k) => {
    const pkgValue = pkg[k];
    if (typeof pkgValue !== "undefined") {
      acc[k] = pkgValue;
    }
    return acc;
  }, {});

  // read JSON-formed metadata
  const json = JSON.parse(
    await fsPromises.readFile("./src/metadata.json", { encoding: "utf-8" })
  );

  const metadata = { ...fallback, ...json };

  // convert list values to multiple key-value records
  return Object.entries(metadata)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        return v.map((e) => [k, e]);
      } else {
        return [[k, v]];
      }
    })
    .flat(1);
}

/**
 * Build banner string. Used for write userscript's metadata.
 * @returns {Promise<string>}
 */
async function buildBanner() {
  const metadataRecords = await getMetadataRecords();

  // for indentation purpose
  const keyLengthMax = metadataRecords.reduce(
    (acc, [key, value]) => Math.max(acc, key.length),
    0
  );
  function recordToLine([k, v]) {
    return `// @${k.padEnd(keyLengthMax, " ")}  ${v}`;
  }

  return [
    "// ==UserScript==",
    ...metadataRecords.map(recordToLine),
    "// ==/UserScript==",
    "", // the last empty line
  ].join("\n");
}

export default {
  input: pkg.main,
  output: {
    file: `./dist/${pkg.name}.user.js`,
    format: "es",
    banner: () => buildBanner(),
  },
};
