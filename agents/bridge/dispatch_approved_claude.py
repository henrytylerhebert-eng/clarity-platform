#!/usr/bin/env python3
"""Run one owner-approved Claude implementation task and record its result."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

BRIDGE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BRIDGE_DIR.parent.parent
sys.path.insert(0, str(BRIDGE_DIR))

from bridge import (  # noqa: E402
    archive_message,
    message_thread,
    now_iso,
    open_message_path,
    parse_message,
    post_message,
    reply_slug,
    update_message_status,
)


def write_prompt(message: dict[str, str], filename: str) -> str:
    prior = []
    for item in message_thread(message["id"]):
        if item.get("id") != message["id"]:
            prior.append(
                f"<bridge-context id=\"{item['id']}\" from=\"{item['from']}\">\n"
                f"{item['body']}\n</bridge-context>"
            )
    return f"""# Approved Clarity implementation assignment

Worker: Claude Code
Workspace: {REPO_ROOT}
Canonical request: agents/bridge/inbox/claude/{filename}
Approval: approved
Posted: {message.get('posted', now_iso())}

## Write authorization

The project owner explicitly approved this bounded implementation task. You may
modify only the repository files required by the request. Do not commit, push,
deploy, publish, install dependencies, access external systems, or modify real
PHI/PII/secrets. Preserve unrelated dirty work. Stop and report if the request
would require a new human, security, legal, or production decision.

## Required operating rules

Read README.md, AGENTS.md, agents/bridge/PROJECT_CONFIGURATION.md,
agents/bridge/PROTOCOL.md, and the referenced canonical decision records before
editing. Use existing repository patterns. Keep synthetic-only boundaries. Run
focused tests before reporting. Return exact files changed, commands run,
results, and remaining risks.

## Prior canonical context

{chr(10).join(prior) if prior else 'No prior thread context.'}

## Request body

<bridge-request>
{message['body']}
</bridge-request>
"""


def invoke_claude(prompt: str, timeout: int, budget: float) -> str:
    result = subprocess.run(
        [
            "claude",
            "-p",
            "--no-session-persistence",
            "--safe-mode",
            "--output-format",
            "json",
            "--permission-mode",
            "acceptEdits",
            "--max-budget-usd",
            str(budget),
        ],
        input=prompt,
        text=True,
        capture_output=True,
        cwd=REPO_ROOT,
        timeout=timeout,
        env={**os.environ, "NO_COLOR": "1"},
        check=False,
    )
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError:
        payload = None
    if isinstance(payload, dict) and payload.get("is_error"):
        detail = payload.get("result") or payload.get("message") or "unknown Claude API error"
        status = payload.get("api_error_status")
        suffix = f" (HTTP {status})" if status else ""
        raise RuntimeError(f"claude API error{suffix}: {detail}")
    if result.returncode != 0:
        raise RuntimeError(f"claude exited with status {result.returncode}")
    if isinstance(payload, dict):
        response = payload.get("result", payload.get("response", payload.get("message", "")))
    else:
        response = result.stdout
    if not isinstance(response, str) or not response.strip():
        raise RuntimeError("claude returned an empty response")
    return response.strip()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("filename", help="approved Claude inbox message filename")
    parser.add_argument("--timeout", type=int, default=1800)
    parser.add_argument("--max-budget-usd", type=float, default=12.0)
    args = parser.parse_args()

    path = open_message_path(args.filename)
    message = parse_message(path)
    if message.get("to") != "claude":
        raise ValueError("Approved Claude dispatcher only accepts messages addressed to claude.")
    if message.get("approval") != "approved":
        raise ValueError("Refusing to write: canonical message is not owner-approved.")
    if message.get("status") != "open":
        raise ValueError(f"Refusing to write: message status is {message.get('status')}.")

    update_message_status("claude", args.filename, "acknowledged")
    update_message_status("claude", args.filename, "in_progress")
    try:
        response = invoke_claude(write_prompt(message, args.filename), args.timeout, args.max_budget_usd)
    except (Exception, KeyboardInterrupt) as error:
        update_message_status("claude", args.filename, "review")
        post_message(
            "claude",
            "codex",
            "status",
            reply_slug(message["id"]),
            f"Approved Claude implementation failed: {error}",
            reply_to=message["id"],
            status="result",
        )
        raise

    update_message_status("claude", args.filename, "result")
    update_message_status("claude", args.filename, "closed")
    archive_message(args.filename)
    reply = post_message(
        "claude",
        "codex",
        "answer",
        reply_slug(message["id"]),
        response,
        reply_to=message["id"],
        status="result",
    )
    print(reply)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, ValueError, subprocess.TimeoutExpired) as error:
        print(f"dispatch-approved-claude: {error}", file=sys.stderr)
        raise SystemExit(1)
