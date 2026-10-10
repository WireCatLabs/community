#!/usr/bin/env python3
"""Check or publish the four shared GitHub policies without persistent credentials."""

import argparse
import pathlib
import subprocess
import tempfile

FILES = ("CONTRIBUTING.md", "SECURITY.md", "SUPPORT.md", "CODE_OF_CONDUCT.md")
TARGET = "WireCatLabs/.github"


def run(*args, **kwargs):
    return subprocess.run(args, check=True, text=True, **kwargs)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true", help="report drift without changing the remote")
    mode.add_argument("--apply", action="store_true", help="commit and push updated defaults")
    args = parser.parse_args()
    source = pathlib.Path(__file__).resolve().parent.parent
    policies = {name: (source / name).read_bytes() for name in FILES}

    with tempfile.TemporaryDirectory(prefix="wirecat-defaults-") as temporary:
        checkout = pathlib.Path(temporary) / "defaults"
        run("gh", "repo", "clone", TARGET, str(checkout), "--", "--depth=1")
        changed = []
        for name, content in policies.items():
            target = checkout / name
            if not target.exists() or target.read_bytes() != content:
                changed.append(name)
                if args.apply:
                    target.write_bytes(content)
        if not changed:
            print("Shared GitHub policies are synchronized.")
            return 0
        print("Policies requiring synchronization: " + ", ".join(changed))
        if args.check:
            return 1
        run("git", "add", "--", *changed, cwd=checkout)
        run("git", "commit", "-s", "-m", "docs: synchronize shared WireCat policies", cwd=checkout)
        run("git", "push", "origin", "HEAD:main", cwd=checkout)
        print("Shared GitHub policies published.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
