import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getLinkedInService } from "../../services/linkedin-service.js";

const searchPeopleParams = z.object({
	keywords: z.string().min(1).describe("Keywords to search for people on LinkedIn"),
	count: z
		.number()
		.int()
		.min(1)
		.max(50)
		.default(10)
		.describe("Number of results to return"),
});

type SearchPeopleParams = z.infer<typeof searchPeopleParams>;

export const searchPeopleTool = {
	name: "SEARCH_LINKEDIN_PEOPLE",
	description: "Search for people on LinkedIn by keywords",
	parameters: searchPeopleParams,
	execute: async (params: SearchPeopleParams) => {
		try {
			const result = await getLinkedInService().searchPeople(
				params.keywords,
				params.count,
			);
			if (result.elements.length === 0) {
				return `No people found for keywords: "${params.keywords}"`;
			}
			const lines = result.elements.map(
				(el, i) => `${i + 1}. ${el.targetUrn ?? "(unknown URN)"}`,
			);
			return `LinkedIn people search results for "${params.keywords}":\n\n${lines.join("\n")}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error searching LinkedIn people: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
