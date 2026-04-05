export class CredentialsError extends Error {
	constructor(platform: string, missingVars: string[]) {
		super(
			`${platform} credentials not configured. Please set: ${missingVars.join(", ")}`,
		);
		this.name = "CredentialsError";
	}
}
