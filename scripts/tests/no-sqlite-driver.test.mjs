import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const biome = join(root, "node_modules/.bin/biome")
const BAD = `import { DatabaseSync } from "node:sqlite"
import Database from "better-sqlite3"
import { eq } from "drizzle-orm"
import { sqliteTable } from "drizzle-orm/sqlite-core"
export * from "bun:sqlite"
export const lazy = () => import("node:sqlite")
export const required = require("better-sqlite3")
export { Database, DatabaseSync, eq, sqliteTable }
`
const GOOD = `import { readFileSync } from "node:fs"
import { openStore } from "@wirecat/cli-core/store"
import sqliteUtils from "sqlite-utils"
export { openStore, readFileSync, sqliteUtils }
`

const lintProbe = (ownConfig = {}) => {
  const probe = mkdtempSync(join(tmpdir(), "no-sqlite-driver-"))
  try {
    cpSync(join(root, "standards/configs"), join(probe, "config/wirecat"), { recursive: true })
    mkdirSync(join(probe, "src"))
    mkdirSync(join(probe, "test"))
    writeFileSync(join(probe, "src/bad.ts"), BAD)
    writeFileSync(join(probe, "src/good.ts"), GOOD)
    writeFileSync(join(probe, "test/bad.test.ts"), BAD)
    writeFileSync(join(probe, ".gitignore"), "node_modules\n")
    writeFileSync(
      join(probe, "biome.json"),
      JSON.stringify({
        extends: ["./config/wirecat/biome.base.json"],
        files: { includes: ["**", "!config/wirecat"] },
        linter: { rules: { recommended: false } },
        ...ownConfig,
      }),
    )
    spawnSync("git", ["init", "-q"], { cwd: probe })
    const { stdout, stderr } = spawnSync(biome, ["lint", "--max-diagnostics=none", "."], {
      cwd: probe,
      encoding: "utf8",
    })
    return [...`${stdout}${stderr}`.matchAll(/^(\S+):\d+:\d+ plugin/gm)].map(([, file]) => file)
  } finally {
    rmSync(probe, { recursive: true, force: true })
  }
}

test("flags every way a CLI's source can load a SQLite driver, and nothing in tests", () => {
  assert.deepEqual(lintProbe(), Array(7).fill("src/bad.ts"))
})

test("cli-core turns it off by repeating the plugin with no files", () => {
  const off = { plugins: [{ path: "./config/wirecat/no-sqlite-driver.grit", includes: [] }] }
  assert.deepEqual(lintProbe(off), [])
})
