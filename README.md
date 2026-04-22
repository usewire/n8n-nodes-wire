# n8n-nodes-wire

An [n8n](https://n8n.io) community node for [Wire](https://usewire.io). Push entries into a Wire container from any workflow.

This node writes to Wire. Agents read Wire via MCP.

## What is Wire?

Wire is a Context as a Service platform. Instead of copy-pasting context into every new AI tool, you put it into a **container** once and every AI agent you use can read from it. Containers follow you across tools, models, and workflows.

Think of Wire as portable, shareable, queryable memory for AI. A container holds notes, documents, structured data, decisions, and anything else worth remembering. Agents connect to it through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) and can explore, search, write, and relate entries without you having to design a schema or run a database.

Learn more at [usewire.io](https://usewire.io) or in the [docs](https://docs.usewire.io).

## Core concepts

### Containers

A **container** is the basic unit of Wire. Each one is isolated, private by default, and has its own MCP endpoint and REST API. You can share a container with teammates, keep it private to yourself, or mix several of them inside an organization.

Containers hold three things:

- **Entries**: individual records. Can be text, markdown, or structured JSON. An entry is the thing a workflow writes and an agent reads.
- **Files**: raw uploads. Wire chunks, summarizes, and indexes them into entries automatically.
- **Relationships**: connections between entries that Wire discovers during analysis.

Every container is auto-indexed for semantic search, so agents can ask natural-language questions and get real answers rather than guessing at keywords.

### Entries

An entry is one unit of context. It has content, a content type, optional tags, optional metadata, and a `source` label that records where it came from. This node writes entries tagged with `n8n:{workflowId}:{nodeName}` by default, so you can always trace a piece of context back to the workflow that produced it.

### Sources

Containers can receive entries from many places: AI agents via MCP, manual uploads, scripts, and automation tools like n8n. Each entry's `source` field records its origin so you can filter, audit, or re-run ingestion later.

### Ephemeral containers

You can try Wire with zero signup. An **ephemeral container** lives for 7 days, anyone with the URL can read and write, and it behaves like any other container. When you are ready, you **claim** it into an account. The entries and history stay with you. Nothing has to be rebuilt.

This is how many people first use Wire. An agent spins up an ephemeral container, puts some context into it, and the user decides later whether to keep it.

## What this node does

One node. One action: **Write entry**. Every input item becomes a Wire entry, ready to be searched by any agent connected to the container.

- Strings are stored as text (or markdown if you flip the option)
- Objects are stored as structured data
- Every entry is automatically tagged with the workflow and node name so you can trace where it came from
- Tags, a custom source label, and arbitrary metadata are optional

## Install

In n8n Cloud or self-hosted: go to **Settings → Community Nodes**, click **Install**, enter `n8n-nodes-wire`, accept the risk notice.

Manually: `npm install n8n-nodes-wire` inside your n8n setup, then restart.

## Setup

1. In [Wire](https://usewire.io), open your container and go to the **Sources** tab.
2. Click **Setup** on **n8n**.
3. Copy the **Wire Address** (looks like `wire://your-org/your-container`).
4. Click **Create container API key**, name it, copy the key.
5. In n8n, create a **Wire** credential and paste both values.
6. Click **Test**. You should see a success message naming the container.

## Use

Add a **Wire** node, pick your credential, and map **Content** to whatever you want to store.

Under **Add option** you can set:

- **Tags**: comma-separated, for later filtering
- **Source Override**: replace the auto-generated source label
- **Treat Content as Markdown**: preserves formatting for string content
- **Metadata**: JSON object for audit trails, upstream IDs, and so on

## What gets written

A call to `POST /container/:id/tools/write` with a body like:

```json
{
  "content": "...",
  "contentType": "text",
  "source": "n8n:abc123:Wire",
  "tags": ["crm", "daily"],
  "metadata": { "runId": "exec-42" }
}
```

## Errors

The node maps Wire error codes to human messages:

- **Insufficient credits**: writes are free, but a container is locked when the organization's credit balance is below its floor. Top up at [usewire.io](https://usewire.io).
- **API key was rejected**: the key is invalid, revoked, expired, or does not belong to the container in the Wire Address.
- **Not found**: the Wire Address in the credential is wrong.

## Links

- [Wire](https://usewire.io)
- [Docs](https://docs.usewire.io)
- [Issues](https://github.com/usewire/n8n-nodes-wire/issues)

## License

[MIT](./LICENSE)
