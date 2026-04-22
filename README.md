# n8n-nodes-wire

An [n8n](https://n8n.io) community node for [Wire](https://usewire.io). Write to a Wire container from any workflow.

## What is Wire?

**Your context, everywhere.** Wire is Context as a Service. Portable, shareable, composable context containers for AI agents.

You put your documents, structured data, and notes into a **container**. Wire organizes everything automatically. Your agents read that container through MCP from Claude, Cursor, Cline, or any MCP-compatible tool. Same context, every tool. No copy-paste, no re-onboarding every new model.

## Containers

A container is where your context lives. It is private by default, and you can share it with teammates or make it public.

- **Add context** by uploading files, letting agents write to it, or pushing through the API (this node)
- **Use context** by connecting any AI tool through MCP, or calling the REST API
- **Spin up, swap, delete** a container whenever you want

One container per project, per team, per client, per whatever. Segment however makes sense.

## Try without signing up

Every container starts **ephemeral**: it lasts 7 days, anyone with the URL can use it, no account needed. When you want to keep it, **claim** it into an organization and everything inside comes with you. Nothing is rebuilt.

Most people start this way. Spin up a container, drop some context in, see it work, then claim.

## What this node does

One node. One action: **Write to Wire**. Each input item becomes an entry in the container you point at.

- Wire figures out the content type automatically (text, markdown, or structured JSON)
- Each entry is tagged with the workflow and node name so you can trace it back
- Tags, a custom label, and extra metadata are optional

Your agents read whatever n8n writes.

## Install

In n8n Cloud or self-hosted: **Settings → Community Nodes → Install**, enter `n8n-nodes-wire`, accept the risk notice.

Manually: `npm install n8n-nodes-wire` in your n8n setup, then restart.

## Setup

1. In [Wire](https://usewire.io), open your container and go to the **Sources** tab.
2. Click **Setup** on **n8n**.
3. Copy the **Wire Address** (looks like `wire://your-org/your-container`).
4. Click **Create container API key**, name it, copy the key.
5. In n8n, create a **Wire** credential and paste both values.
6. Click **Test**. You should see a success message.

## Use

Add a **Wire** node, pick your credential, map **Content** to whatever you want to store.

Under **Add option**:

- **Tags** for filtering later
- **Source Override** if you want a custom label
- **Metadata** for run IDs, upstream record IDs, and anything else you want audited

## Errors

The node maps Wire error codes to plain messages:

- **Insufficient credits**: the organization's credit balance is below its floor. Writes are free, but the container is locked until you top up at [usewire.io](https://usewire.io).
- **API key was rejected**: the key is invalid, revoked, expired, or for a different container.
- **Not found**: the Wire Address in the credential is wrong.

## Links

- [Wire](https://usewire.io)
- [Docs](https://docs.usewire.io)
- [Issues](https://github.com/usewire/n8n-nodes-wire/issues)

## License

[MIT](./LICENSE)
