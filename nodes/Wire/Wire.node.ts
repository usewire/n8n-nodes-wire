import {
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

interface WireEntryResponse {
	success: boolean;
	data?: {
		entryId?: string;
		message?: string;
	};
	error?: {
		code?: string;
		message?: string;
	};
}

/**
 * Map Wire error codes to human-friendly messages. Wire's REST responses use
 * `{ success: false, error: { code, message } }`. We surface the raw Wire
 * message as the source of truth, but prepend a plain-English explanation for
 * the codes users are most likely to hit.
 */
function explainWireError(code: string | undefined, fallback: string): string {
	switch (code) {
		case 'INSUFFICIENT_CREDITS':
			return 'Wire container is out of credits. Top up at https://app.usewire.io/billing.';
		case 'FORBIDDEN':
			return 'This API key does not have access to the target container, or the key is missing the `write` scope.';
		case 'NOT_FOUND':
			return 'Container not found. Check the Container URL in your Wire API credential.';
		case 'UNAUTHORIZED':
			return 'API key was rejected. It may be revoked, expired, or for a different container.';
		case 'TOOL_ERROR':
			return fallback || 'Wire rejected the write.';
		default:
			return fallback || 'Write to Wire failed.';
	}
}

export class Wire implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wire',
		name: 'wire',
		icon: 'file:wire.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{"Write entry"}}',
		description: 'Send entries to a Wire container',
		defaults: {
			name: 'Wire',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'wireApi',
				required: true,
			},
		],
		properties: [
			{
				displayName:
					'Sends each input item to your Wire container as an entry. Content is auto-classified: strings become text, objects become structured data. The entry is tagged with the workflow and node name so you can trace where it came from.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Content',
				name: 'content',
				type: 'string',
				default: '',
				required: true,
				typeOptions: {
					rows: 4,
				},
				description:
					'The body of the entry. Text, markdown, or a JSON object. Use an expression like {{ $json }} to send the whole input item, or {{ $json.fieldName }} to send a specific field.',
				placeholder: '{{ $json }}',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
					{
						displayName: 'Tags',
						name: 'tags',
						type: 'string',
						default: '',
						description: 'Comma-separated tags for lightweight filtering. Leave blank for none.',
						placeholder: 'meeting, q2',
					},
					{
						displayName: 'Source Override',
						name: 'source',
						type: 'string',
						default: '',
						description:
							'Override the default source label. By default, entries are stamped with `n8n:{workflowId}:{nodeName}` so you can trace them back. Use this to set a custom value like `crm-sync` or `daily-report`.',
						placeholder: 'crm-sync',
					},
					{
						displayName: 'Treat Content as Markdown',
						name: 'markdown',
						type: 'boolean',
						default: false,
						description:
							'Whether string content should be stored as markdown (preserves headings, lists, code). Has no effect when content is an object.',
					},
					{
						displayName: 'Metadata (JSON)',
						name: 'metadata',
						type: 'json',
						default: '',
						description:
							'Arbitrary JSON metadata stored with the entry. Useful for run IDs, upstream record IDs, or any audit trail.',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('wireApi');
		const baseUrl = String(credentials.containerUrl ?? '').replace(/\/$/, '');

		if (!baseUrl) {
			throw new NodeOperationError(
				this.getNode(),
				'Wire credential is missing a Container URL. Open the credential and paste the URL from your container\'s Sources tab.',
			);
		}

		const writeUrl = `${baseUrl}/tools/write`;
		const workflowId = this.getWorkflow().id ?? 'unknown';
		const nodeName = this.getNode().name;
		const defaultSource = `n8n:${workflowId}:${nodeName}`;

		for (let i = 0; i < items.length; i++) {
			try {
				const rawContent = this.getNodeParameter('content', i);
				const options = this.getNodeParameter('options', i, {}) as {
					tags?: string;
					source?: string;
					markdown?: boolean;
					metadata?: string | Record<string, unknown>;
				};

				// Infer contentType from the shape of the input. Users never pick.
				let content: string | Record<string, unknown>;
				let contentType: 'text' | 'markdown' | 'structured';

				if (typeof rawContent === 'string') {
					content = rawContent;
					contentType = options.markdown ? 'markdown' : 'text';
				} else if (rawContent && typeof rawContent === 'object') {
					content = rawContent as Record<string, unknown>;
					contentType = 'structured';
				} else {
					// Numbers, booleans, null — coerce to string text.
					content = String(rawContent);
					contentType = 'text';
				}

				const tagList = options.tags
					? options.tags
							.split(',')
							.map((t) => t.trim())
							.filter(Boolean)
					: undefined;

				let metadata: Record<string, unknown> | undefined;
				if (options.metadata !== undefined && options.metadata !== '') {
					metadata =
						typeof options.metadata === 'string'
							? (JSON.parse(options.metadata) as Record<string, unknown>)
							: (options.metadata as Record<string, unknown>);
				}

				const body: Record<string, unknown> = {
					content,
					contentType,
					source: options.source?.trim() || defaultSource,
				};
				if (tagList && tagList.length > 0) body.tags = tagList;
				if (metadata) body.metadata = metadata;

				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'wireApi',
					{
						method: 'POST',
						url: writeUrl,
						headers: {
							'Content-Type': 'application/json',
						},
						body,
						json: true,
					},
				)) as WireEntryResponse;

				if (!response.success) {
					const message = explainWireError(response.error?.code, response.error?.message ?? '');
					throw new NodeOperationError(this.getNode(), message, { itemIndex: i });
				}

				returnData.push({
					json: {
						success: true,
						entryId: response.data?.entryId,
						message: response.data?.message,
						source: body.source as string,
						contentType,
					},
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
