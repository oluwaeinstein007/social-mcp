import { BskyAgent } from "@atproto/api";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";

export class BlueskyService {
	private agent: BskyAgent;
	private loggedIn = false;

	constructor() {
		if (!config.bluesky.identifier || !config.bluesky.appPassword) {
			throw new CredentialsError("Bluesky", [
				"BLUESKY_IDENTIFIER",
				"BLUESKY_APP_PASSWORD",
			]);
		}
		this.agent = new BskyAgent({ service: config.bluesky.service });
	}

	private async ensureLoggedIn() {
		if (!this.loggedIn) {
			await this.agent.login({
				identifier: config.bluesky.identifier,
				password: config.bluesky.appPassword,
			});
			this.loggedIn = true;
		}
	}

	async createPost(text: string) {
		await this.ensureLoggedIn();
		return this.agent.post({ text });
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
