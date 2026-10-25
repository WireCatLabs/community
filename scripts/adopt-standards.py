#!/usr/bin/env python3
"""Apply reviewed WireCat presets to a repository, preserving local overrides."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess

RELEASE_LOCK_FILES = ("release-lock.sh", "release-lock-info.mjs")


def copy_presets(paths, managed):
    hashes = {}
    for path in paths:
        shutil.copyfile(path, managed / path.name)
        hashes[path.name] = hashlib.sha256(path.read_bytes()).hexdigest()
    return hashes


def read_json(path, default):
    return json.loads(path.read_text()) if path.exists() else default


def write_json(path, data):
    # Rewriting an unchanged file would replace the repository's own formatting with ours.
    if read_json(path, None) == data:
        return
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repository", type=Path)
    parser.add_argument("--revision", help="source commit; defaults to this checkout's HEAD")
    parser.add_argument("--only", choices=["release-lock"], help="update only the release lock in an existing adoption")
    args = parser.parse_args()
    source = Path(__file__).resolve().parent.parent
    target = args.repository.resolve()
    package = read_json(target / "package.json", None)
    if package is None:
        parser.error("Target must contain package.json")
    revision = args.revision or subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=source, text=True
    ).strip()
    if args.only:
        managed = target / "config/wirecat"
        manifest_path = managed / "manifest.json"
        manifest = read_json(manifest_path, None)
        if manifest is None:
            parser.error("Scoped updates require an existing standards adoption")
        hashes = copy_presets([source / "standards/configs" / name for name in RELEASE_LOCK_FILES], managed)
        manifest["files"].update(hashes)
        manifest.setdefault("fileRevisions", {}).update({name: revision for name in hashes})
        write_json(manifest_path, manifest)
        print(f"Applied shared release lock to {target}; toolchain and other presets unchanged.")
        return
    toolchain = read_json(source / "standards/toolchain.json", {})
    managed = target / "config/wirecat"
    managed.mkdir(parents=True, exist_ok=True)
    hashes = copy_presets(sorted((source / "standards/configs").iterdir()), managed)
    checker = source / "standards/scripts/check.mjs"
    shutil.copyfile(checker, managed / "check.mjs")
    hashes["check.mjs"] = hashlib.sha256(checker.read_bytes()).hexdigest()
    write_json(managed / "manifest.json", {
        "source": "https://github.com/WireCatLabs/community",
        "revision": revision,
        "files": hashes,
        **toolchain,
    })
    shutil.copyfile(source / "LICENSE", managed / "LICENSE")

    biome_path = target / "biome.json"
    biome = read_json(biome_path, {"files": {"includes": ["**", "!**/node_modules", "!**/dist", "!.worktrees", "!pnpm-lock.yaml"]}})
    extends = [value for value in biome.get("extends", [])
               if value not in ("@wirecat/cli-core/biome", "./config/biome.base.json", "./config/wirecat/biome.json", "./config/wirecat/biome.base.json")]
    biome["extends"] = ["./config/wirecat/biome.base.json", *extends]
    includes = biome.setdefault("files", {}).setdefault("includes", ["**"])
    # "!**/.worktrees" also matches the path of a worktree itself, so lint run inside one checks nothing.
    includes[:] = ["!.worktrees" if value == "!**/.worktrees" else value for value in includes]
    for pattern in ["!.worktrees", "!config/wirecat"]:
        if pattern not in biome["files"]["includes"]:
            biome["files"]["includes"].append(pattern)
    write_json(biome_path, biome)

    spell_path = target / "cspell.json"
    spell = read_json(spell_path, {"version": "0.2", "files": ["README.md"]})
    imports = [value for value in spell.get("import", [])
               if value not in ("@wirecat/cli-core/cspell", "./config/wirecat/cspell.json")]
    spell["import"] = ["./config/wirecat/cspell.json", *imports]
    write_json(spell_path, spell)

    md_path = target / ".markdownlint-cli2.jsonc"
    markdown = read_json(md_path, {
        "globs": ["README.md", "SECURITY.md", "CONTRIBUTING.md", "SUPPORT.md", "CODE_OF_CONDUCT.md", "docs/dev/**/*.md"],
        "ignores": ["node_modules", "dist", ".worktrees", "config/wirecat"],
    })
    rules = markdown.setdefault("config", {})
    baseline = read_json(source / "standards/configs/markdownlint.json", {})
    for key, value in baseline.items():
        if rules.get(key) == value:
            del rules[key]
    rules["extends"] = "./config/wirecat/markdownlint.json"
    write_json(md_path, markdown)

    hook_path = target / "lefthook.yml"
    hook = hook_path.read_text() if hook_path.exists() else "extends:\n  - config/wirecat/lefthook.yml\n"
    hook = re.sub(r"(?:node_modules/@wirecat/cli-core/)?config/lefthook\.yml", "config/wirecat/lefthook.yml", hook)
    if "config/wirecat/lefthook.yml" not in hook:
        if re.search(r"^extends:\s*$", hook, re.M):
            hook = re.sub(r"^extends:\s*$", "extends:\n  - config/wirecat/lefthook.yml", hook, count=1, flags=re.M)
        else:
            hook = "extends:\n  - config/wirecat/lefthook.yml\n" + hook
    hook_path.write_text(hook)

    package["packageManager"] = toolchain["packageManager"]
    package.setdefault("devDependencies", {}).update(toolchain["devDependencies"])
    scripts = package.setdefault("scripts", {})
    scripts["standards:check"] = "node config/wirecat/check.mjs"
    scripts.setdefault("lint", "biome check .")
    scripts.setdefault("lint:fix", "biome check --write .")
    scripts.setdefault("docs:lint", "markdownlint-cli2")
    scripts.setdefault("docs:spell", "cspell lint --config cspell.json --no-progress README.md")
    scripts.setdefault("prepare", "lefthook install || true")
    write_json(target / "package.json", package)
    # The template only starts a repository off; most then grow their own steps and newer action pins.
    workflow = target / ".github/workflows/standards.yml"
    if not workflow.exists():
        workflow.parent.mkdir(parents=True, exist_ok=True)
        workflow.write_text((source / "standards/templates/standards.yml").read_text())
    print(f"Applied shared standards to {target}; run pnpm install to update its lockfile.")


if __name__ == "__main__":
    main()
