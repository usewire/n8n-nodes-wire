# n8n-nodes-wire

An [n8n](https://n8n.io) community node for [Wire](https://usewire.io) — push entries into a Wire container from any workflow.

**Ingestion only.** This node is for getting data *into* Wire. Agents consume Wire via [MCP](https://docs.usewire.io/mcp/overview/), not n8n.

## What it does

One node. One action: **Write entry**. Every item that flows through the node becomes a Wire entry, ready to be searched by any agent connected to the container.

- **Strings** → stored as text (or markdown if you flip the option)
- **Objects** → stored as structured data
- Every entry is automatically tagged with the workflow and node name so you can trace where it came from
- Tags, custom source labels, and arbitrary metadata are optional

## Install

### In n8n Cloud / self-hosted

1. Go to **Settings → Community Nodes**
2. Click **Install**
3. Enter `n8n-nodes-wire`
4. Accept the risk notice and install

### Manually (self-hosted)

```bash
npm install n8n-nodes-wire
```

Then restart n8n.

## Setup

1. **Create a Wire container** at [app.usewire.io](https://app.usewire.io) (or use an existing one).
2. Open the container's **Sources** tab.
3. Click **Setup** under "Webhook writes".
4. Copy the **Endpoint URL** (strip the trailing `/tools/write` — you only want the base up to `/container/{id}`).
5. Click **Create container API key**, name it (e.g. "n8n"), and copy the key.
6. In n8n, create a new **Wire API** credential:
   - **Container URL**: paste the base URL
   - **API Key**: paste the key
   - Click **Test** — you should see a success message.

## Use

Add a **Wire** node to your workflow, select your credential, and map **Content** to whatever you want to store. Common patterns:

- `{{ $json }}` — store the entire input item as structured data
- `{{ $json.summary }}` — store a specific field as text
- A literal string — store a fixed note with every run

Under **Add option** you can set:

- **Tags** — comma-separated, for later filtering
- **Source Override** — replace the auto-generated source label
- **Treat Content as Markdown** — preserves formatting for string content
- **Metadata** — JSON object for audit trails, upstream IDs, etc.

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

See the [Wire REST API docs](https://docs.usewire.io/mcp/rest-api/#write) for the full contract.

## Errors

The node surfaces Wire's error codes as human messages:

- **Out of credits** — Wire container needs a credit top-up at [app.usewire.io/billing](https://app.usewire.io/billing)
- **Forbidden** — the API key doesn't have access to the target container
- **Not found** — the Container URL in the credential is wrong
- **Unauthorized** — the API key is revoked, expired, or for a different container

## Links

- [Wire](https://usewire.io)
- [Docs](https://docs.usewire.io)
- [App](https://app.usewire.io)
- [Issues](https://github.com/usewire/n8n-nodes-wire/issues)

## License

[MIT](./LICENSE)
