import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


BRIDGE = Path(__file__).resolve().parents[1] / "bridge.py"


class BridgeCliTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name) / "bridge"
        self.environment = {
            **os.environ,
            "AGENT_BRIDGE_ROOT": str(self.root),
            "AGENT_BRIDGE_WAKE_TRANSPORT": "none",
        }

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def run_bridge(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(BRIDGE), *args],
            capture_output=True,
            cwd=BRIDGE.parent.parent.parent,
            env=self.environment,
            text=True,
        )

    def require_success(self, *args: str) -> subprocess.CompletedProcess[str]:
        result = self.run_bridge(*args)
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        return result

    def test_lifecycle_requires_close_before_archive(self) -> None:
        posted = self.require_success(
            "post",
            "codex",
            "claude",
            "review",
            "bridge-lifecycle",
            "--body",
            "Review the local bridge lifecycle.",
        )
        message_path = Path(posted.stdout.strip())
        filename = message_path.name
        self.assertIn("status: open", message_path.read_text(encoding="utf-8"))
        self.assertNotEqual(self.run_bridge("archive", filename).returncode, 0)

        for state in ("acknowledged", "in_progress", "result", "closed"):
            self.require_success("update", "claude", filename, state)

        archived = self.require_success("archive", filename)
        self.assertTrue(Path(archived.stdout.split(": ", 1)[1].strip()).exists())

    def test_sensitive_message_body_is_rejected(self) -> None:
        result = self.run_bridge(
            "post",
            "codex",
            "claude",
            "question",
            "sensitive-body",
            "--body",
            "ghp_12345678901234567890",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Potential credential material detected", result.stderr)
