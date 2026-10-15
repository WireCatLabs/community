import assert from "node:assert/strict"
import { execFileSync, spawn, spawnSync } from "node:child_process"
import { once } from "node:events"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { releaseLockInfo } from "../../standards/configs/release-lock-info.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const row = (overrides = {}) => ({
  type: "FLOCK",
  mode: "WRITE",
  path: "/fixture/lock",
  pid: 123,
  command: "sh",
  ...overrides,
})
const ports = (rows, label = () => "old-tool pid 456") => ({
  run: () => JSON.stringify({ locks: rows }),
  realpath: (value) => {
    if (typeof value !== "string") throw Error("missing")
    return value
  },
  label,
})

test("holders, waiters and advisory labels stay distinct", () => {
  const text = releaseLockInfo(
    "/fixture/lock",
    ports([
      row({ pid: 456, mode: "WRITE*" }),
      row({ pid: 789, type: "POSIX" }),
      row({ holders: ["123,sh,9", "321,flock,9"] }),
      row({ path: "/other/lock", pid: 999 }),
    ]),
  )
  assert.match(text, /Observed lock holders.*pid 123.*pid 321/)
  assert.doesNotMatch(text.split("\n")[1], /456|789|999/)
  assert.match(text, /Last recorded release \(may be stale\).*456/)
  assert.match(text, /Do not remove the lock file/)
})

test("older lslocks falls back without HOLDERS and does not expose argv", () => {
  let calls = 0
  const text = releaseLockInfo("/fixture/lock", {
    ...ports([]),
    run: (_bin, args) => {
      calls++
      if (args[2].includes("HOLDERS")) throw Error("old util-linux")
      return JSON.stringify({ locks: [row()] })
    },
  })
  assert.equal(calls, 2)
  assert.match(text, /pid 123 \("sh"\)/)
})

test("missing tools, malformed snapshots and unreadable labels have an honest fallback", () => {
  for (const run of [
    () => {
      throw Error("not installed")
    },
    () => "{",
    () => JSON.stringify({ locks: [row({ pid: -1, holders: [] }), null] }),
  ]) {
    const text = releaseLockInfo("/fixture/lock", {
      ...ports([]),
      run,
      label: () => {
        throw Error("missing")
      },
    })
    assert.match(text, /Observed lock holders: unavailable/)
    assert.doesNotMatch(text, /Last recorded/)
  }
})

test("paths and labels escape terminal controls; snapshots do not need a label", () => {
  const text = releaseLockInfo(
    "/fixture/lock\nnext",
    ports([], () => "\u001b[31m\nlabel"),
  )
  assert.match(text, /lock\\nnext/)
  assert.equal(text.includes(String.fromCharCode(27)), false)
  assert.doesNotMatch(
    releaseLockInfo(
      "/fixture/lock",
      ports([], () => ""),
    ),
    /Last recorded/,
  )
})

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "wirecat release lock "))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  mkdirSync(join(directory, "config/wirecat"), { recursive: true })
  for (const name of ["release-lock.sh", "release-lock-info.mjs"])
    cpSync(join(root, "standards/configs", name), join(directory, "config/wirecat", name))
  return {
    directory,
    lock: join(directory, "leemour-release.lock"),
    options: { cwd: directory, env: { ...process.env, XDG_RUNTIME_DIR: directory }, encoding: "utf8" },
  }
}
const invoke = (options, tail = "", args = []) =>
  spawnSync(
    "sh",
    ["-eu", "-c", `. ./config/wirecat/release-lock.sh; wirecat_release_lock "$@"; ${tail || ":"}`, "fixture", ...args],
    options,
  )
async function holder(t, options) {
  const child = spawn(
    "sh",
    ["-eu", "-c", '. ./config/wirecat/release-lock.sh; wirecat_release_lock; printf "ready\\n"; read -r done'],
    options,
  )
  t.after(async () => {
    if (child.exitCode === null) {
      child.stdin.end("done\n")
      await once(child, "close")
    }
  })
  await once(child.stdout, "data")
  return child
}

test("real contention preserves the inode and refuses before executing release work", async (t) => {
  const { directory, lock, options } = fixture(t)
  await holder(t, options)
  const inode = statSync(lock).ino
  writeFileSync(lock, "retained lock inode\n")
  writeFileSync(`${lock}.who`, "previous-tool pid 999999999\n")
  const result = invoke(options, "printf published")
  assert.equal(result.status, 1)
  assert.equal(result.stdout, "")
  assert.match(result.stderr, /another release holds/)
  assert.match(result.stderr, /Last recorded release \(may be stale\).*previous-tool/)
  assert.equal(readFileSync(`${lock}.who`, "utf8"), "previous-tool pid 999999999\n")
  assert.equal(statSync(lock).ino, inode)
  assert.equal(readFileSync(lock, "utf8"), "retained lock inode\n")
  assert.match(result.stderr, new RegExp(directory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
})

test("the lock remains held across child commands and is available after exit", async (t) => {
  const { options } = fixture(t)
  const first = invoke(options, "sh -c 'if flock -n ./leemour-release.lock true; then exit 7; fi'")
  assert.equal(first.status, 0)
  assert.equal(invoke(options, "printf released").stdout, "released")
  const child = await holder(t, options)
  const waiting = spawn(
    "sh",
    ["-eu", "-c", ". ./config/wirecat/release-lock.sh; wirecat_release_lock 2; printf acquired"],
    options,
  )
  const output = []
  waiting.stdout.on("data", (chunk) => output.push(chunk))
  child.stdin.end("done\n")
  await once(child, "close")
  const [code] = await once(waiting, "close")
  assert.equal(code, 0)
  assert.equal(Buffer.concat(output).toString(), "acquired")
})

test("invalid waits fail before opening a lock or running release work", (t) => {
  const { lock, options } = fixture(t)
  for (const value of ["-1", "0.5", "", "abc"]) {
    const result = invoke(options, "printf published", [value])
    assert.equal(result.status, 2)
    assert.equal(result.stdout, "")
  }
  assert.throws(() => readFileSync(lock))
})

test("flock command failures are not described as another release", (t) => {
  const { directory, options } = fixture(t)
  mkdirSync(join(directory, "bin"))
  const fake = join(directory, "bin/flock")
  writeFileSync(fake, "#!/bin/sh\nexit 42\n", { mode: 0o755 })
  const result = invoke({ ...options, env: { ...options.env, PATH: `${join(directory, "bin")}:${options.env.PATH}` } })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /flock exit 42/)
  assert.doesNotMatch(result.stderr, /another release holds/)
})

test("scoped adoption is idempotent and preserves every unrelated file", (t) => {
  const { directory } = fixture(t)
  const manifest = { revision: "old-source", files: { "unrelated.json": "abc" }, devDependencies: {} }
  writeFileSync(join(directory, "config/wirecat/manifest.json"), JSON.stringify(manifest))
  writeFileSync(join(directory, "package.json"), '{"name":"fixture","private":true}\n')
  writeFileSync(join(directory, "config/wirecat/unrelated.json"), "untouched\n")
  const args = [
    join(root, "scripts/adopt-standards.py"),
    directory,
    "--only",
    "release-lock",
    "--revision",
    "fixture-source",
  ]
  execFileSync("python3", args)
  const result = readFileSync(join(directory, "config/wirecat/manifest.json"), "utf8")
  execFileSync("python3", args)
  assert.equal(readFileSync(join(directory, "config/wirecat/manifest.json"), "utf8"), result)
  const parsed = JSON.parse(result)
  assert.equal(parsed.revision, "old-source")
  assert.equal(parsed.files["unrelated.json"], "abc")
  assert.equal(parsed.fileRevisions["release-lock.sh"], "fixture-source")
  assert.equal(readFileSync(join(directory, "package.json"), "utf8"), '{"name":"fixture","private":true}\n')
  assert.equal(readFileSync(join(directory, "config/wirecat/unrelated.json"), "utf8"), "untouched\n")
})

test("full adoption includes the helper and resets scoped provenance", (t) => {
  const { directory } = fixture(t)
  writeFileSync(join(directory, "package.json"), '{"name":"fixture","private":true}\n')
  writeFileSync(
    join(directory, "config/wirecat/manifest.json"),
    JSON.stringify({ revision: "old", files: {}, fileRevisions: { "release-lock.sh": "scoped" } }),
  )
  execFileSync("python3", [join(root, "scripts/adopt-standards.py"), directory, "--revision", "full-source"])
  const manifest = JSON.parse(readFileSync(join(directory, "config/wirecat/manifest.json"), "utf8"))
  assert.equal(manifest.revision, "full-source")
  assert.equal(manifest.fileRevisions, undefined)
  for (const name of ["release-lock.sh", "release-lock-info.mjs"]) {
    assert.equal(
      readFileSync(join(directory, "config/wirecat", name), "utf8"),
      readFileSync(join(root, "standards/configs", name), "utf8"),
    )
    assert.match(manifest.files[name], /^[a-f0-9]{64}$/)
  }
})

test("scoped adoption refuses an uninitialized target", (t) => {
  const { directory } = fixture(t)
  writeFileSync(join(directory, "package.json"), '{"name":"fixture"}\n')
  const result = spawnSync("python3", [join(root, "scripts/adopt-standards.py"), directory, "--only", "release-lock"], {
    encoding: "utf8",
  })
  assert.equal(result.status, 2)
  assert.match(result.stderr, /existing standards adoption/)
})
