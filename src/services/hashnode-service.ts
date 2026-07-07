import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { createProxyDispatcher } from "../lib/proxy.js";

const publicationSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	url: z.string().optional(),
	displayTitle: z.string().optional(),
});

const postSchema = z.object({
	id: z.string(),
	title: z.string(),
	slug: z.string().optional(),
	url: z.string().optional(),
	brief: z.string().optional(),
	publishedAt: z.string().optional(),
	tags: z.array(z.object({ name: z.string(), slug: z.string() })).optional(),
	reactionCount: z.number().optional(),
	responseCount: z.number().optional(),
});

const publishPostResponseSchema = z.object({
	data: z
		.object({
			publishPost: z.object({
				post: z.object({
					id: z.string(),
					title: z.string(),
					slug: z.string().optional(),
					url: z.string().optional(),
				}),
			}),
		})
		.optional(),
	errors: z.array(z.object({ message: z.string() })).optional(),
});

const publicationQuerySchema = z.object({
	data: z
		.object({
			publication: z
				.object({
					id: z.string(),
					title: z.string().optional(),
					url: z.string().optional(),
					displayTitle: z.string().optional(),
					posts: z
						.object({
							edges: z.array(z.object({ node: postSchema })),
							pageInfo: z
								.object({
									hasNextPage: z.boolean().optional(),
									endCursor: z.string().nullable().optional(),
								})
								.optional(),
						})
						.optional(),
				})
				.nullable(),
		})
		.optional(),
	errors: z.array(z.object({ message: z.string() })).optional(),
});

export interface HashnodeCredentials {
	accessToken: string;
	publicationId?: string;
	proxyUrl?: string;
}

export class HashnodeService {
	private baseUrl = config.hashnode.baseUrl;
	private accessToken: string;
	private publicationId: string;
	private dispatcher?: ReturnType<typeof createProxyDispatcher>;

	constructor(credentials?: HashnodeCredentials) {
		const accessToken = credentials?.accessToken ?? config.hashnode.accessToken;
		if (!accessToken) {
			throw new CredentialsError("Hashnode", ["HASHNODE_ACCESS_TOKEN"]);
		}
		this.accessToken = accessToken;
		this.publicationId =
			credentials?.publicationId ?? config.hashnode.publicationId;
		this.dispatcher = createProxyDispatcher(credentials?.proxyUrl);
	}

	private async gql<T>(
		query: string,
		variables: Record<string, unknown>,
		schema: z.ZodType<T>,
	): Promise<T> {
		const response = await fetch(this.baseUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: this.accessToken,
			},
			body: JSON.stringify({ query, variables }),
			dispatcher: this.dispatcher,
		} as RequestInit);
		if (!response.ok) {
			throw new Error(
				`Hashnode API error ${response.status}: ${response.statusText}`,
			);
		}
		const data = await response.json();
		if (data.errors?.length) {
			throw new Error(
				`Hashnode GraphQL error: ${data.errors.map((e: { message: string }) => e.message).join("; ")}`,
			);
		}
		return schema.parse(data);
	}

	async getPublication(publicationId?: string) {
		const id = publicationId ?? this.publicationId;
		if (!id)
			throw new Error(
				"publicationId is required. Set HASHNODE_PUBLICATION_ID or pass it explicitly.",
			);

		const query = `query GetPublication($id: ObjectId!) {
			publication(id: $id) {
				id
				title
				url
				displayTitle
			}
		}`;
		const result = await this.gql(query, { id }, publicationQuerySchema);
		return result.data?.publication;
	}

	async getPosts(publicationId?: string, first = 10) {
		const id = publicationId ?? this.publicationId;
		if (!id)
			throw new Error(
				"publicationId is required. Set HASHNODE_PUBLICATION_ID or pass it explicitly.",
			);

		const query = `query GetPosts($id: ObjectId!, $first: Int!) {
			publication(id: $id) {
				id
				title
				url
				posts(first: $first) {
					edges {
						node {
							id
							title
							slug
							url
							brief
							publishedAt
							reactionCount
							responseCount
							tags { name slug }
						}
					}
					pageInfo { hasNextPage endCursor }
				}
			}
		}`;
		const result = await this.gql(query, { id, first }, publicationQuerySchema);
		return result.data?.publication;
	}

	async createPost(
		title: string,
		contentMarkdown: string,
		tags: { name: string; slug: string }[] = [],
		publicationId?: string,
		subtitle?: string,
		coverImageUrl?: string,
		disableComments = false,
	) {
		const id = publicationId ?? this.publicationId;
		if (!id)
			throw new Error(
				"publicationId is required. Set HASHNODE_PUBLICATION_ID or pass it explicitly.",
			);

		const mutation = `mutation PublishPost($input: PublishPostInput!) {
			publishPost(input: $input) {
				post {
					id
					title
					slug
					url
				}
			}
		}`;

		const input: Record<string, unknown> = {
			title,
			contentMarkdown,
			tags,
			publicationId: id,
			disableComments,
		};
		if (subtitle) input.subtitle = subtitle;
		if (coverImageUrl)
			input.coverImageOptions = { coverImageURL: coverImageUrl };

		return this.gql(mutation, { input }, publishPostResponseSchema);
	}
}

let _instance: HashnodeService | undefined;
export function getHashnodeService(): HashnodeService {
	if (!_instance) _instance = new HashnodeService();
	return _instance;
}
