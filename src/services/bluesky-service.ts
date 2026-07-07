import { BskyAgent } from "@atproto/api";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";

export interface BlueskyCredentials {
	identifier: string;
	appPassword: string;
	service?: string;
}

export interface BlueskyImage {
	/** Base64-encoded image bytes. Max 4 per post (AT Proto's own limit). */
	content: string;
	mimeType: string;
	alt?: string;
}

export class BlueskyService {
	private agent: BskyAgent;
	private identifier: string;
	private appPassword: string;
	private loggedIn = false;

	constructor(credentials?: BlueskyCredentials) {
		const identifier = credentials?.identifier ?? config.bluesky.identifier;
		const appPassword = credentials?.appPassword ?? config.bluesky.appPassword;
		const service = credentials?.service ?? config.bluesky.service;
		if (!identifier || !appPassword) {
			throw new CredentialsError("Bluesky", [
				"BLUESKY_IDENTIFIER",
				"BLUESKY_APP_PASSWORD",
			]);
		}
		this.identifier = identifier;
		this.appPassword = appPassword;
		this.agent = new BskyAgent({ service });
	}

	private async ensureLoggedIn() {
		if (!this.loggedIn) {
			await this.agent.login({
				identifier: this.identifier,
				password: this.appPassword,
			});
			this.loggedIn = true;
		}
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
