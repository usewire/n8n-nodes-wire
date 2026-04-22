import {
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

import { resolveWireAddress } from '../../credentials/WireApi.credentials';

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
 * Map Wire error codes to human messages. Wire REST responses use
 * `{ success: false, error: { code, message } }`. We surface the raw Wire
 * message plus a plain-English explanation for the codes users are most
 * likely to hit.
 */
function explainWireError(code: string | undefined, fallback: string): string {
	switch (code) {
		case 'INSUFFICIENT_CREDITS':
			return 'The Wire organization is below its credit floor. Writes are free, but the container is locked until the balance is topped up. Go to https://usewire.io to add credits.';
		case 'FORBIDDEN':
		case 'UNAUTHORIZED':
			return 'API key was rejected. Check that the key is valid and belongs to the container in the Wire Address.';
		case 'NOT_FOUND':
			return 'Container not found. Check the Wire Address in your credential.';
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
					'Every input item is sent to your Wire container as an entry. Strings are stored as text, objects as structured data. The entry is tagged with the workflow and node name.',
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
				description: 'What to store. A string, markdown, or an expression resolving to an object.',
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
							'Override the default source label. By default, entries are stamped with n8n:{workflowId}:{nodeName} so you can trace them back.',
						placeholder: 'crm-sync',
					},
					{
						displayName: 'Treat Content as Markdown',
						name: 'markdown',
						type: 'boolean',
						default: false,
						description:
							'Whether string content should be stored as markdown. Preserves headings, lists, and code blocks. No effect when content is an object.',
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

		let baseUrl: string;
		try {
			baseUrl = resolveWireAddress(String(credentials.wireAddress ?? ''));
		} catch (err) {
			throw new NodeOperationError(
				this.getNode(),
				err instanceof Error ? err.message : 'Invalid Wire Address.',
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

				let content: string | Record<string, unknown>;
				let contentType: 'text' | 'markdown' | 'structured';

				if (typeof rawContent === 'string') {
					content = rawContent;
					contentType = options.markdown ? 'markdown' : 'text';
				} else if (rawContent && typeof rawContent === 'object') {
					content = rawContent as Record<string, unknown>;
					contentType = 'structured';
				} else {
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
