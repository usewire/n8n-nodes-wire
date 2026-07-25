# Changelog

## 0.1.9

**Object field — workflow writes can land as queryable records.**

A workflow that fires on every form submission, deploy, or spreadsheet row pushes the same shape forever, but the node could only store it as loose content: the values existed as text, and nothing downstream could filter or aggregate them.

Naming an **Object** groups those records so they can be queried together, and the container builds a field profile for the object from the writes themselves — which keys exist, their types, and how often each one appears.

- **Object** (top level, optional) — the group name, e.g. `expenses`. Leave it blank and the node behaves exactly as before.
- **Fields (JSON)** (under Options) — explicit queryable values, for when the readable content and the queryable values differ. Usually unnecessary: map **Content** to `{{ $json }}` and the payload's own keys become the field map.

The node output gains two fields when an object is set:

- `object` — the object's canonical name. Wire keeps the first spelling an object gets, so `Expenses` written after `expenses` comes back as `expenses`.
- `unknownFields` — present only when writing into an object whose schema is owned by a connector, listing keys that schema doesn't define. The write still lands; it's a heads-up, not an error.

Requires a Wire container running the `object`/`fields` params on `wire_write`. Against an older container the extra keys are ignored, so upgrading early is safe — the feature simply does nothing until the server side is live.

## 0.1.8

Mark the node as `usableAsTool` so an n8n AI Agent can call it directly.
