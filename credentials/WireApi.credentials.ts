import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WireApi implements ICredentialType {
	name = 'wireApi';

	displayName = 'Wire API';

	documentationUrl = 'https://docs.usewire.io/mcp/rest-api/';

	properties: INodeProperties[] = [
		{
			displayName: 'Container URL',
			name: 'containerUrl',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'https://my-org.mcp.usewire.io/container/abc123',
			description:
				'Full URL of the Wire container, copied from the Sources tab in the Wire app. Do not include a trailing slash or an endpoint path.',
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
				'Container-scoped API key. Create one inside the container\'s Sources tab or under Access → API Keys in the Wire app.',
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
			baseURL: '={{$credentials.containerUrl.replace(/\\/$/, "")}}',
			url: '/status',
			method: 'GET',
		},
	};
}
