"""Self-check: python test_launch.py (no pytest needed)."""
import datetime as dt
import tomllib

import launch

TASKS = [
    {"id": "a", "day": -10, "channel": "core", "title": "A", "gate": True},
    {"id": "b", "day": 0, "channel": "producthunt", "title": "B", "gate": True},
    {"id": "c", "day": 3, "channel": "hn", "title": "C"},
    {"id": "d", "day": 5, "channel": "core", "title": "D", "gate": True},  # post-launch gate never blocks GO
]
MANIFEST = {"name": "X", "launch_date": dt.date(2026, 12, 1), "channels": ["producthunt"], "done": ["a"],
            "one_liner": "x", "audience": "x", "url": "x", "success_metric": "x", "success_target": "x", "kill_threshold": ""}

assert [t["id"] for t in launch.selectTasks(TASKS, ["producthunt"])] == ["a", "b", "d"]
assert launch.computeDue(dt.date(2026, 12, 1), TASKS[0]) == dt.date(2026, 11, 21)
assert [t["id"] for t in launch.findBlockingGates(MANIFEST, TASKS)] == ["b"]
assert launch.findMissingFields(MANIFEST) == ["kill_threshold"]
plan = launch.renderPlan(MANIFEST, TASKS)
assert "- [x] `2026-11-21`" in plan and "## Launch day" in plan and "[hn]" not in plan

# Real library + template must parse and reference only known channels/ids.
real = launch.loadTasks()
ids = [t["id"] for t in real]
assert len(ids) == len(set(ids)), "duplicate task ids"
assert all({"id", "day", "channel", "title"} <= t.keys() for t in real)
tmpl = tomllib.loads(launch.TEMPLATE_FILE.read_text(encoding="utf-8").replace("__SLUG__", "s").replace("__DATE__", "2026-12-01"))
assert set(tmpl["channels"]) <= {t["channel"] for t in real}, "template lists a channel with no tasks"
print("ok")
