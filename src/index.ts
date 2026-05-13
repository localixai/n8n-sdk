// Public entry point for the n8n API SDK
// Re-exports all generated types and service classes

export * from './generated/index.js';
export {
	createClient,
	createConfig,
	mergeHeaders,
	type Client,
	type ClientOptions,
	type Config,
	type RequestOptions,
	type RequestResult,
} from './generated/client/index.js';
export {
	Audit,
	CommunityPackage,
	Credential,
	DataTable,
	Discover,
	Execution,
	Folders,
	Insights,
	Projects,
	SourceControl,
	Tags,
	User,
	Variables,
	Workflow,
} from './generated/sdk.gen.js';
