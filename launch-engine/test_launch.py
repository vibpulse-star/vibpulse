"""Self-check: python test_launch.py (no pytest needed)."""
import datetime as dt
import tempfile
import tomllib
from pathlib import Path
from types import SimpleNamespace

import launch

TASKS = [
    {"id": "a", "day": -10, "channel": "core", "title": "A", "gate": True},
    {"id": "b", "day": 0, "channel": "producthunt", "title": "B", "gate": True},
    {"id": "ph-launch", "day": 0, "channel": "producthunt", "title": "PH"},
    {"id": "c", "day": 3, "channel": "hn", "title": "C"},
    {"id": "d", "day": 5, "channel": "core", "title": "D", "gate": True},  # post-launch gate never blocks GO
]
MANIFEST = {"name": "X", "launch_date": dt.date(2026, 12, 1), "channels": ["producthunt"], "done": ["a"],
            "one_liner": "x", "audience": "x", "url": "x", "success_metric": "x", "success_target": "lots", "kill_threshold": ""}


def expectError(fn):
    try:
        fn()
    except ValueError:
        return
    raise AssertionError("expected ValueError")


# Core logic
assert [t["id"] for t in launch.selectTasks(TASKS, ["producthunt"])] == ["a", "b", "ph-launch", "d"]
assert launch.computeDue(dt.date(2026, 12, 1), TASKS[0]) == dt.date(2026, 11, 21)
assert [t["id"] for t in launch.findBlockingGates(MANIFEST, TASKS)] == ["b"]
assert launch.findMissingFields(MANIFEST) == ["kill_threshold", "success_target (needs a number)"]
plan = launch.renderPlan(MANIFEST, TASKS)
assert "- [x] `2026-11-21`" in plan and "## Launch day" in plan and "[hn]" not in plan

# Council (Skeptic) regressions
expectError(lambda: launch.validateManifest({**MANIFEST, "channels": ["HN"]}, TASKS, "m"))        # typo'd channel
expectError(lambda: launch.validateManifest({**MANIFEST, "channels": "email"}, TASKS, "m"))       # string not list
expectError(lambda: launch.validateManifest({**MANIFEST, "launch_date": "2026-12-01"}, TASKS, "m"))  # quoted date
assert launch.findWeekdayWarnings(MANIFEST, TASKS) == []                                           # 2026-12-01 is Tue
assert launch.findWeekdayWarnings({**MANIFEST, "launch_date": dt.date(2026, 12, 5)}, TASKS)        # Saturday
assert not launch.SLUG_RE.match("../escape") and launch.SLUG_RE.match("my-app2")

with tempfile.TemporaryDirectory() as tmp:
    launch.PROJECTS = Path(tmp)
    text = launch.TEMPLATE_FILE.read_text(encoding="utf-8").replace("__SLUG__", "p").replace("__DATE__", "2026-12-01")
    text = text.replace("done = []", "done = []  # trailing comment")
    (Path(tmp) / "p.toml").write_bytes(b"\xef\xbb\xbf" + text.encode())                             # BOM, like PowerShell 5
    launch.cmdDone(SimpleNamespace(slug="p", task_ids=["positioning"]))
    saved = launch.readToml(Path(tmp) / "p.toml")
    assert saved["done"] == ["positioning"] and "# trailing comment" in (Path(tmp) / "p.toml").read_text()
    (Path(tmp) / "q.toml").write_text(text.replace("2026-12-01", "2026-12-09"))
    assert launch.findCollisions("p", saved) == ["q launches 2026-12-09, within 14 days"]

# Project kinds: digital skips saas-only tasks, internal gets only the internal channel; collisions are saas-only
KT = TASKS + [{"id": "s", "day": -5, "channel": "core", "title": "S", "gate": True, "kinds": ["saas"]},
              {"id": "i", "day": -1, "channel": "internal", "title": "I", "gate": True}]
assert "s" in [t["id"] for t in launch.selectTasks(KT, [], "saas")]
assert "s" not in [t["id"] for t in launch.selectTasks(KT, [], "digital")]
assert [t["id"] for t in launch.selectTasks(KT, [], "internal")] == ["i"]
assert launch.findCollisions("p", {**MANIFEST, "kind": "digital"}) == []
expectError(lambda: launch.validateManifest({**MANIFEST, "kind": "app"}, TASKS, "m"))

# Real library + template must parse and reference only known channels/ids.
real = launch.loadTasks()
ids = [t["id"] for t in real]
assert len(ids) == len(set(ids)), "duplicate task ids"
assert all({"id", "day", "channel", "title"} <= t.keys() for t in real)
tmpl = tomllib.loads(launch.TEMPLATE_FILE.read_text(encoding="utf-8").replace("__SLUG__", "s").replace("__DATE__", "2026-12-01"))
launch.validateManifest(tmpl, real, "template")
print("ok")
