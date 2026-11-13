"""Checks `.claude/rules/enforcement.yml`, the one list of how each rule is enforced.

    python3 tests/claude-rules/check_enforcement.py [repo root]
    python3 check_enforcement.py --ci-system [repo root]

`--ci-system` prints the CI system that runs the repo's checks and exits 0:
`buildkite` when any file under `.buildkite/` or a root `buildkite.yml` or
`buildkite.yaml` counts, which wins when the repo also has GitHub Actions; else
`github-actions` when a `.github/workflows/*.yml` file counts; else `none`, and
then no one can tell where a step goes.

Exit 0 when the file holds up, 1 with one line per finding, 2 when it is missing
or cannot be read. A finding is:

- a live rule ID in `.claude/rules/**/*.md` with no entry, an entry for an ID no
  rule file defines (or a retired one), an entry whose `file` is not where the
  rule is, or an ID defined in two places;
- a field or value the schema below does not have;
- a `ci` or `both` entry that names a job not under `jobs:`, or a job whose
  `step` is not the `key:` of a step under `steps:` in `.buildkite/**/*.yml` or a
  job under `jobs:` in `.github/workflows/*.yml`;
- a check that does not exist (see "Checks").

The schema is the one cnd-domain-check's claudeRulesEnforcementV1 reads:

    version: 1
    jobs:
      claude-rules:
        step: claude-rules       # a Buildkite step key or a GitHub Actions job id
        command: python3 tests/claude-rules/check_enforcement.py
        runs: always             # always | on-change
    rules:
      RUL-06:                    # a comment here says why, for a pending entry
        file: .claude/rules/writing.md
        enforcement: ci  # ci | review-agent | both | platform | guidance | pending
        ci: [claude-rules]       # ci, both: the jobs that run the checks
        checks: [tests/claude-rules/check_enforcement.py]
        mode: report-only        # ci, both: the checks only warn
        enforced: partial        # ci: needed with mode: report-only
        platform: https://...    # platform: the setting that enforces it

A `guidance` rule governs how a person or agent session behaves, such as which
command it runs or what it asks the user. No diff or setting shows it, so no CI or
review check is claimed, and a guidance entry that sets `ci`, `checks`, `mode`,
`enforced` or `platform` is a finding.

Files count when git tracks them or would add them (new and not ignored); with
no git, every file under the root counts.

Checks. Each `checks` item is one of:

- a file, such as a lint config or a script the job runs;
- `path::name`, a test file that defines the test `name`;
- `module.name` or `module.Class.name`, a file named `module` (any extension)
  that defines `name`.

A test is defined by `def name`, `func name`, `function name` or
`@test "name"`. It names its rule, so the claim can be proven: the test name
holds the ID (`test_arc_01_...`, `ARC-01: ...`), or its file does
(`@enforces("ARC-01")`, `# bats test_tags=rule:ARC-01`). `ARC-010` never counts
for `ARC-01`.

Stdlib only, so only a YAML subset is read: two-space indents, `key: value`,
`key: [a, "b, quoted"]` on one line, `key: {}` and `#` comments. A `- item`
list or a `{a: b}` map is an error (exit 2), even where full YAML allows it.

Owned and tested upstream. This file is a copy of the claude-native-repo
plugin's template, twilio-internal/claude-marketplace
plugins/claude-tooling/claude-native-repo/templates/check_enforcement.py, and
its tests are tests/claude-tooling/claude-native-repo/test_checker.py there,
so the repo that holds the copy needs no tests of its own for it. Change it
upstream, not here: setup-rules replaces a copy with a newer template only
while the copy is byte for byte a version the plugin shipped.
"""

# The repo's Python formatter skips the rest of this file, whatever its line
# length: setup-rules upgrades the copy only while it is byte for byte a
# version the plugin shipped, so a reformat would stop its upgrades.
# fmt: off

import os
import re
import subprocess
import sys
from pathlib import Path

CONFIG = ".claude/rules/enforcement.yml"
ENFORCEMENT = ("ci", "review-agent", "both", "platform", "guidance", "pending")
RUNS = ("always", "on-change")
MODES = ("blocking", "report-only")
TOP_FIELDS = ("version", "jobs", "rules")
JOB_FIELDS = ("block", "step", "command", "runs", "triggers")
RULE_FIELDS = ("file", "enforcement", "ci", "checks", "mode", "enforced", "platform")
RULE_LINE = re.compile(r"^[-*] +([A-Z]+-\d+)(?: *\[[^\]]*\])? *: *(.*)$")
RULE_SECTIONS = ("Requirements", "Constraints")
KEY_LINE = re.compile(r"^([A-Za-z0-9_.-]+):(?: +(.*))?$")
CI_KEY = re.compile(r"^(\"[^\"]+\"|'[^']+'|[A-Za-z0-9_.-]+):(?: +(.*))?$")
BLOCK_SCALAR = re.compile(r"^[|>][-+0-9]*$")
SUBSET_HINT = (
    "only a YAML subset is read: two-space indents, `key: value`, "
    "`key: [a, b]` on one line, `key: {}`; no `- item` lists or `{a: b}` maps"
)
LIST_ITEM = re.compile(r"\s*(\"[^\"]*\"|'[^']*'|[^,]*?)\s*,")
TEST_REF = re.compile(r"^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+$")


class Broken(Exception):
    """The config is missing or cannot be read, so nothing it claims was checked."""


def parse(text):
    """Nested mappings from the strict subset, or Broken naming each bad line."""
    root, errors = {}, []
    stack = [(-2, root)]
    for n, raw in enumerate(text.splitlines(), 1):
        line = _strip_comment(raw)
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip(" "))
        m = KEY_LINE.match(line.strip())
        if indent % 2 or not m:
            errors.append(f"line {n}: not `key: value` at a two-space indent")
            continue
        while stack[-1][0] >= indent:
            stack.pop()
        if indent != stack[-1][0] + 2:
            errors.append(f"line {n}: indented past its parent")
            continue
        parent = stack[-1][1]
        key, value = m.group(1), (m.group(2) or "").strip()
        if key in parent:
            errors.append(f"line {n}: {key} is set twice")
            continue
        if value.startswith("{") and value != "{}":
            errors.append(f"line {n}: a `{{a: b}}` map is not read")
            continue
        if value in ("", "{}"):
            parent[key] = {}
            if value == "":
                stack.append((indent, parent[key]))
        elif value.startswith("["):
            if not value.endswith("]"):
                errors.append(f"line {n}: a list is `[a, b]` on one line")
                continue
            items = LIST_ITEM.findall(value[1:-1] + ",")
            parent[key] = [_scalar(v) for v in items if v.strip()]
        else:
            parent[key] = _scalar(value)
    if errors:
        raise Broken("; ".join(errors))
    return root


def _strip_comment(raw):
    """The line without a `#` comment; a `#` inside quotes is text."""
    quote = None
    for i, ch in enumerate(raw):
        if quote:
            quote = None if ch == quote else quote
        elif ch in "\"'":
            quote = ch
        elif ch == "#" and (i == 0 or raw[i - 1].isspace()):
            return raw[:i]
    return raw


def _scalar(value):
    value = value.strip()
    if len(value) > 1 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def tracked(root):
    """Repo-relative paths of the files on disk that git tracks or would add.

    Without git, every file under `root`. A file in the index but deleted from
    the working tree is left out, so a check naming it is a finding.
    """
    cmd = ["git", "-C", str(root), "ls-files", "-z", "--cached", "--others"]
    try:
        out = subprocess.run(
            [*cmd, "--exclude-standard"], capture_output=True, text=True, check=True
        ).stdout
        listed = {p for p in out.split("\0") if p}
    except (OSError, subprocess.CalledProcessError):
        listed = set()
        for here, dirs, names in os.walk(root):
            dirs[:] = [d for d in dirs if d != ".git"]
            for name in names:
                listed.add(Path(here, name).relative_to(root).as_posix())
    return {p for p in listed if (root / p).is_file()}


def _read(root, rel, errors="strict"):
    """The text of a file the check depends on, without a leading BOM; Broken when it
    cannot be read or, with strict errors, is not UTF-8."""
    try:
        return (root / rel).read_text(encoding="utf-8-sig", errors=errors)
    except UnicodeDecodeError:
        raise Broken(f"{rel} is not UTF-8 text") from None
    except OSError as exc:
        raise Broken(f"{rel} cannot be read: {exc.strerror}") from None


def rule_ids(root, files):
    """({live ID: file}, {retired ID: file}, findings) from `.claude/rules/**/*.md`:
    each `- ID: text` line under `## Requirements` or `## Constraints`, not fenced."""
    live, retired, seen, findings = {}, {}, {}, []
    for rel in sorted(f for f in files if f.startswith(".claude/rules/")):
        if not rel.endswith(".md"):
            continue
        section, fence = None, False
        for line in _read(root, rel).splitlines():
            if line.lstrip().startswith(("```", "~~~")):
                fence = not fence
                continue
            if fence:
                continue
            if line.startswith("## "):
                section = line[3:].strip()
                continue
            m = RULE_LINE.match(line)
            if not m or section not in RULE_SECTIONS:
                continue
            rule_id, text = m.groups()
            if rule_id in seen:
                findings.append(f"{rule_id} is defined in {seen[rule_id]} and {rel}")
                continue
            seen[rule_id] = rel
            (retired if text.strip() == "Retired." else live)[rule_id] = rel
    return live, retired, findings


def ci_steps(root, files):
    """Buildkite step keys (any `.buildkite/**/*.yml`) and GitHub Actions job ids
    (`.github/workflows/*.yml`). No other YAML file is read."""
    steps = set()
    for rel in files:
        path = Path(rel)
        if path.suffix not in (".yml", ".yaml"):
            continue
        if rel.startswith(".buildkite/"):
            steps |= _buildkite_keys(_read(root, rel, "replace"))
        elif path.parent.as_posix() == ".github/workflows":
            steps |= _workflow_jobs(_read(root, rel, "replace"))
    return steps


def ci_system(files):
    """`buildkite`, `github-actions` or `none`: where a new CI step goes. Buildkite
    wins when the repo has both."""
    paths = [Path(rel) for rel in files]
    if any(p.parts[0] == ".buildkite" for p in paths) or any(
        rel in ("buildkite.yml", "buildkite.yaml") for rel in files
    ):
        return "buildkite"
    workflows = [p for p in paths if p.suffix in (".yml", ".yaml")]
    if any(p.parent.as_posix() == ".github/workflows" for p in workflows):
        return "github-actions"
    return "none"


def _lines(text):
    """(indent of the dash or key, indent of the key, key, value, is a list item)
    for each line that holds a `key:`, skipping comments and block-scalar bodies."""
    block = None
    for raw in text.splitlines():
        line = _strip_comment(raw).rstrip()
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip())
        if block is not None and indent > block:
            continue
        block = None
        body, item = line.strip(), False
        if body == "-" or body.startswith("- "):
            item, body = True, body[1:].lstrip()
        key_indent = len(line) - len(body)
        m = CI_KEY.match(body)
        if not m:
            if item:  # a step that opens with `<<: *anchor` or another key
                yield indent, key_indent, None, "", True
            continue
        value = (m.group(2) or "").strip()
        if BLOCK_SCALAR.match(value):
            block = key_indent
        yield indent, key_indent, _scalar(m.group(1)), value, item


def _buildkite_keys(text):
    """The `key:` of each step under a `steps:` list, group steps included."""
    keys, stack = set(), []  # stack: [indent of `steps:`, indent of its steps' keys]
    for indent, key_indent, key, value, item in _lines(text):
        while stack and (
            indent < stack[-1][0] or (indent == stack[-1][0] and not item)
        ):
            stack.pop()
        if stack and item and stack[-1][1] is None:
            stack[-1][1] = key_indent
        at_step = bool(stack) and key_indent == stack[-1][1]
        if key == "steps" and (key_indent == 0 or at_step):
            stack.append([key_indent, None])
        elif key == "key" and at_step and value:
            keys.add(_scalar(value))
    return keys


def _workflow_jobs(text):
    jobs, inside, indent = set(), False, None
    for line in text.splitlines():
        line = _strip_comment(line).rstrip()
        if not line.strip():
            continue
        if not line[0].isspace():
            inside = line == "jobs:"
            continue
        if not inside:
            continue
        here = len(line) - len(line.lstrip())
        indent = here if indent is None else indent
        m = CI_KEY.match(line.strip())
        if here == indent and m:
            jobs.add(_scalar(m.group(1)))
    return jobs


def check_problem(root, files, rule_id, check):
    """Why `check` proves nothing for `rule_id`, or None."""
    if not isinstance(check, str) or not check:
        return f"{rule_id}: check {check!r} is not a string"
    if "::" in check:
        rel, name = (s.strip() for s in check.split("::", 1))
        if not name:
            return f"{rule_id}: check {check} names no test after ::"
        homes = [rel] if rel in files else []
    elif check in files:
        return None
    elif TEST_REF.match(check):
        module, name = check.split(".", 1)[0], check.rsplit(".", 1)[1]
        homes = sorted(f for f in files if Path(f).stem == module)
    else:
        return f"{rule_id}: check {check} is not a file in the repo"
    if not homes:
        return f"{rule_id}: check {check} names no file in the repo"
    q = re.escape(name)
    defines = re.compile(
        rf"(?:\b(?:def|func|function)\s+{q}(?![\w-])|@test\s+[\"']{q}[\"'])"
    )
    rule = re.compile(rf"(?<![A-Za-z0-9]){re.escape(rule_id)}(?!\d)")
    snake = re.compile(rf"(?<![a-z0-9]){rule_id.lower().replace('-', '_')}(?!\d)")
    for rel in homes:
        text = _read(root, rel, "replace")
        named = rule.search(name) or snake.search(name.lower()) or rule.search(text)
        if defines.search(text) and named:
            return None
    return f"{rule_id}: check {check}: no file defines that test and names the rule"


def check(root):
    """The findings for the repo at `root`; Broken when the config cannot be read."""
    path = root / CONFIG
    if not path.is_file():
        raise Broken(f"{CONFIG} does not exist")
    try:
        config = parse(_read(root, CONFIG))
    except Broken as exc:
        raise Broken(f"{CONFIG}: {exc} ({SUBSET_HINT})") from None
    findings = [f"unknown top-level field {k}" for k in config if k not in TOP_FIELDS]
    if config.get("version") != "1":
        findings.append(f"version is {config.get('version')!r}, want 1")
    jobs, rules = config.get("jobs") or {}, config.get("rules") or {}
    if not isinstance(jobs, dict) or not isinstance(rules, dict):
        raise Broken(f"{CONFIG}: jobs and rules must be mappings")
    files = tracked(root)
    live, retired, findings_ids = rule_ids(root, files)
    findings += findings_ids
    steps = ci_steps(root, files)
    for name, job in sorted(jobs.items()):
        findings += _job_findings(name, job, steps)
    for rule_id in sorted(set(live) - set(rules)):
        findings.append(f"{rule_id} ({live[rule_id]}) has no entry")
    for rule_id, entry in sorted(rules.items()):
        if rule_id not in live:
            why = "is retired" if rule_id in retired else "is defined in no rule file"
            findings.append(f"{rule_id} has an entry but {why}")
            continue
        if not isinstance(entry, dict):
            findings.append(f"{rule_id}: the entry is not a mapping")
            continue
        findings += _rule_findings(root, files, rule_id, entry, live[rule_id], jobs)
    return findings, rules


def _job_findings(name, job, steps):
    if not isinstance(job, dict):
        return [f"job {name}: not a mapping"]
    out = [f"job {name}: unknown field {k}" for k in job if k not in JOB_FIELDS]
    if job.get("runs") not in (None, *RUNS):
        out.append(f"job {name}: runs is {job['runs']!r}, want one of {RUNS}")
    step = job.get("step")
    if not step:
        out.append(f"job {name}: no step")
    elif not isinstance(step, str):
        out.append(f"job {name}: step is not a single value")
    elif step not in steps:
        out.append(
            f"job {name}: step {step} is not a step key in .buildkite/ "
            "or a job in .github/workflows/*.yml"
        )
    return out


def _rule_findings(root, files, rule_id, entry, defined_in, jobs):
    out = [f"{rule_id}: unknown field {k}" for k in entry if k not in RULE_FIELDS]
    kind = entry.get("enforcement")
    if entry.get("file") != defined_in:
        out.append(f"{rule_id}: file is {entry.get('file')!r}, not {defined_in}")
    if not isinstance(kind, str) or kind not in ENFORCEMENT:
        return [*out, f"{rule_id}: enforcement is {kind!r}, want one of {ENFORCEMENT}"]
    names = _as_list(entry.get("ci") or [])
    checks = _as_list(entry.get("checks") or [])
    if kind in ("ci", "both"):
        if not names or not checks:
            out.append(f"{rule_id}: a {kind} entry names its ci jobs and its checks")
        for job in names:
            if not isinstance(job, str):
                out.append(f"{rule_id}: ci is not a list of job names: {job!r}")
            elif job not in jobs:
                out.append(f"{rule_id}: ci job {job} is not under jobs:")
        out += [
            p for p in (check_problem(root, files, rule_id, c) for c in checks) if p
        ]
    else:
        out += [
            f"{rule_id}: {k} is only for ci and both entries"
            for k in ("ci", "checks", "mode")
            if k in entry
        ]
    mode, enforced = entry.get("mode"), entry.get("enforced")
    if mode not in (None, *MODES):
        out.append(f"{rule_id}: mode is {mode!r}, want one of {MODES}")
    if enforced not in (None, "partial"):
        out.append(f"{rule_id}: enforced is {enforced!r}, want partial")
    elif enforced and kind != "ci":
        out.append(f"{rule_id}: enforced: partial is only for a ci entry")
    elif kind == "ci" and (mode == "report-only") != (enforced == "partial"):
        out.append(f"{rule_id}: mode: report-only and enforced: partial go together")
    platform = entry.get("platform")
    if kind == "platform" and not str(platform or "").startswith("https://"):
        out.append(f"{rule_id}: a platform entry names its setting as an https URL")
    elif kind != "platform" and platform is not None:
        out.append(f"{rule_id}: platform is only for a platform entry")
    return out


def _as_list(value):
    return value if isinstance(value, list) else [value]


def main(argv):
    args = argv[1:]
    if args[:1] == ["--ci-system"]:
        print(ci_system(tracked(Path(args[1] if len(args) > 1 else ".").resolve())))
        return 0
    root = Path(args[0] if args else ".").resolve()
    try:
        findings, rules = check(root)
    except Broken as exc:
        print(f"broken: {exc}", file=sys.stderr)
        return 2
    for finding in findings:
        print(f"{CONFIG}: {finding}", file=sys.stderr)
    counts = {}
    for entry in rules.values():
        kind = entry.get("enforcement") if isinstance(entry, dict) else None
        kind = kind if isinstance(kind, str) else None
        counts[kind] = counts.get(kind, 0) + 1
    summary = ", ".join(f"{counts[k]} {k}" for k in ENFORCEMENT if k in counts)
    print(f"{len(rules)} entries ({summary or 'none'}); {len(findings)} findings")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
