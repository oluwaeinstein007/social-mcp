import { BskyAgent } from "@atproto/api";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { createProxyDispatcher } from "../lib/proxy.js";

export interface BlueskyCredentials {
	// App-password login — BlueskyService logs in itself.
	identifier?: string;
	appPassword?: string;
	// Alternative to the above: resume an existing session (e.g. from an
	// authorization flow managed elsewhere) instead of logging in fresh. Requires
	// did + accessJwt + refreshJwt; handle defaults to did if not supplied.
	did?: string;
	handle?: string;
	accessJwt?: string;
	refreshJwt?: string;
	service?: string;
	/** Routes API calls through this proxy (e.g. per-tenant IP isolation). */
	proxyUrl?: string;
}

export interface BlueskyImage {
	/** Base64-encoded image bytes. Max 4 per post (AT Proto's own limit). */
	content: string;
	mimeType: string;
	alt?: string;
}

export interface BlueskySession {
	did: string;
	handle: string;
	accessJwt: string;
	refreshJwt: string;
}

export class BlueskyService {
	private agent: BskyAgent;
	private identifier?: string;
	private appPassword?: string;
	private resumeSessionData?: {
		did: string;
		handle: string;
		accessJwt: string;
		refreshJwt: string;
		active: true;
	};
	private loggedIn = false;
	private latestSession?: BlueskySession;

	constructor(credentials?: BlueskyCredentials) {
		const identifier = credentials?.identifier ?? config.bluesky.identifier;
		const appPassword = credentials?.appPassword ?? config.bluesky.appPassword;
		const service = credentials?.service ?? config.bluesky.service;

		if (credentials?.did && credentials.accessJwt && credentials.refreshJwt) {
			this.resumeSessionData = {
				did: credentials.did,
				handle: credentials.handle ?? credentials.did,
				accessJwt: credentials.accessJwt,
				refreshJwt: credentials.refreshJwt,
				active: true,
			};
		} else if (!identifier || !appPassword) {
			throw new CredentialsError("Bluesky", [
				"BLUESKY_IDENTIFIER",
				"BLUESKY_APP_PASSWORD",
				"(or did/accessJwt/refreshJwt to resume a session)",
			]);
		}
		this.identifier = identifier;
		this.appPassword = appPassword;

		const dispatcher = createProxyDispatcher(credentials?.proxyUrl);
		this.agent = new BskyAgent({
			service,
			// AT Proto rotates the refresh token on use — this is the SDK's own hook for
			// finding out, so a session-resume caller can persist the new one via
			// getSession() rather than silently working with a token that's gone stale.
			persistSession: (_evt, session) => {
				if (session) {
					this.latestSession = {
						did: session.did,
						handle: session.handle,
						accessJwt: session.accessJwt,
						refreshJwt: session.refreshJwt,
					};
				}
			},
			...(dispatcher
				? {
						fetch: ((input: RequestInfo | URL, init?: RequestInit) =>
							fetch(input, {
								...init,
								dispatcher,
							} as RequestInit)) as typeof globalThis.fetch,
					}
				: {}),
		});
	}

	private async ensureLoggedIn() {
		if (this.loggedIn) return;
		if (this.resumeSessionData) {
			await this.agent.resumeSession(this.resumeSessionData);
		} else if (this.identifier && this.appPassword) {
			await this.agent.login({
				identifier: this.identifier,
				password: this.appPassword,
			});
		} else {
			throw new Error("Bluesky credentials are missing");
		}
		this.loggedIn = true;
	}

	// Only meaningful in session-resume mode: the (possibly refreshed) session after
	// an operation, for the caller to persist if it rotated mid-call.
	getSession(): BlueskySession | undefined {
		return this.latestSession;
	}

	async createPost(text: string, images?: BlueskyImage[]) {
		await this.ensureLoggedIn();
		if (!images?.length) {
			return this.agent.post({ text });
		}

		// AT Proto has no "attach a URL" shortcut — every image is a blob uploaded to
		// the user's own PDS first, then referenced by its returned blob ref in the post.
		const embedImages = await Promise.all(
			images.slice(0, 4).map(async (image) => {
				const buffer = Buffer.from(image.content, "base64");
				const { data } = await this.agent.uploadBlob(buffer, {
					encoding: image.mimeType,
				});
				return { image: data.blob, alt: image.alt ?? "" };
			}),
		);

		return this.agent.post({
			text,
			embed: { $type: "app.bsky.embed.images", images: embedImages },
		});
	}

	async replyToPost(
		text: string,
		parentUri: string,
		parentCid: string,
		rootUri: string,
		rootCid: string,
	) {
		await this.ensureLoggedIn();
		return this.agent.post({
			text,
			reply: {
				root: { uri: rootUri, cid: rootCid },
				parent: { uri: parentUri, cid: parentCid },
			},
		});
	}

	async deletePost(postUri: string) {
		await this.ensureLoggedIn();
		await this.agent.deletePost(postUri);
	}

	async likePost(postUri: string, postCid: string) {
		await this.ensureLoggedIn();
		return this.agent.like(postUri, postCid);
	}

	async getProfile(handle: string) {
		await this.ensureLoggedIn();
		const result = await this.agent.getProfile({ actor: handle });
		return result.data;
	}

	async searchPosts(query: string, limit = 10) {
		await this.ensureLoggedIn();
		const result = await this.agent.app.bsky.feed.searchPosts({
			q: query,
			limit,
		});
		return result.data;
	}
}

let _instance: BlueskyService | undefined;
export function getBlueskyService(): BlueskyService {
	if (!_instance) _instance = new BlueskyService();
	return _instance;
}
