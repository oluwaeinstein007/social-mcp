import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getMastodonService } from "../../services/mastodon-service.js";

const favouritePostParams = z.object({
	statusId: z.string().describe("The ID of the post to favourite"),
});

type FavouritePostParams = z.infer<typeof favouritePostParams>;

export const favouritePostTool = {
	name: "MASTODON_FAVOURITE_POST",
	description: "Favourite (like) a post on Mastodon",
	parameters: favouritePostParams,
	execute: async (params: FavouritePostParams) => {
		try {
			const result = await getMastodonService().favouritePost(params.statusId);
			return `Post favourited successfully on Mastodon!\n\nPost ID: ${result.id}\nFavourites: ${result.favourites_count ?? "N/A"}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error favouriting Mastodon post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
