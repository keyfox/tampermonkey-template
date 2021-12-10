import fs, { promises as fsPromises } from "fs";
import serve from "rollup-plugin-serve";
import { readableTimestamp } from "./utils.js";

// whether the rollup is in watch mode
const WATCH_MODE = process.env.ROLLUP_WATCH === "true";

const SERVE_HOST = "localhost";
const SERVE_PORT = 10001;

const pkg = JSON.parse(
  fs.readFileSync("./package.json", { encoding: "utf-8" })
);

/**
 * Return the filename of userscript to be distributed.
 * @returns {string}
 */
function outputFileName() {
  return `${pkg.name}.user.js`;
}

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

  if (WATCH_MODE) {
    // override some metadata for serving via HTTP
    const url = `http://${SERVE_HOST}:${SERVE_PORT}/${outputFileName()}`;
    metadata.version += `.${readableTimestamp(new Date())}`;
    metadata.updateURL = url;
    metadata.downloadURL = url;
    console.info(
      "It's watch mode -- your script will be also served at: " + url
    );
  }

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
    file: `./dist/${outputFileName()}`,
    format: "es",
    banner: () => buildBanner(),
  },
  plugins: [
    serve({
      contentBase: "dist",
      host: SERVE_HOST,
      port: SERVE_PORT,
    }),
  ],
};
