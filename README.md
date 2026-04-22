# n8n-nodes-wire

An [n8n](https://n8n.io) community node for [Wire](https://usewire.io). Push entries into a Wire container from any workflow.

Ingestion only. This node is for getting data into Wire. Agents consume Wire via MCP, not n8n.

## What it does

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
- [Issues](https://github.com/usewire/n8n-nodes-wire/issues)

## License

[MIT](./LICENSE)
