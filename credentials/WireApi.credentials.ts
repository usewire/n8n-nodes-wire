import { URL } from 'url';
import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Parse a wire:// address into the concrete HTTPS base URL a container
 * responds at. Format is `wire://{orgslug}/{containerId}`.
 */
export function resolveWireAddress(raw: string): string {
	const input = (raw ?? '').trim();
	if (!input.startsWith('wire://')) {
		throw new Error(
			'Wire Address must start with wire:// and look like wire://your-org/your-container.',
		);
	}
	let url: URL;
	try {
		url = new URL(input);
	} catch {
		throw new Error('Wire Address could not be parsed. Copy a fresh one from the container Sources tab.');
	}
	const orgSlug = url.host;
	const containerId = url.pathname.replace(/^\/+|\/+$/g, '');
	if (!orgSlug || !containerId) {
		throw new Error('Wire Address is missing the org slug or container ID.');
	}
	return `https://${orgSlug}.api.usewire.io/container/${containerId}`;
}

export class WireApi implements ICredentialType {
	name = 'wireApi';

	displayName = 'Wire';

	documentationUrl = 'https://usewire.io';

	properties: INodeProperties[] = [
		{
			displayName: 'Wire Address',
			name: 'wireAddress',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'wire://your-org/your-container',
			description:
				'The wire:// address for your container, copied from the Sources tab in Wire. Points at one specific container.',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description:
				'A container API key. Create and rotate keys in the Sources tab in Wire.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ (() => { const u = new URL($credentials.wireAddress); return `https://${u.host}.api.usewire.io/container${u.pathname}`; })() }}',
			url: '/status',
			method: 'GET',
		},
	};
}
