import { describe, expect, it } from "vitest";
import { HttpError } from "../lib/http.js";

describe("HttpError", () => {
	it("sets status code", () => {
		const err = new HttpError(404, "Not found");
		expect(err.status).toBe(404);
	});

	it("sets message", () => {
		const err = new HttpError(500, "Internal error");
		expect(err.message).toBe("Internal error");
	});

	it("stores optional data payload", () => {
		const data = { detail: "rate limited" };
		const err = new HttpError(429, "Too many requests", data);
		expect(err.data).toEqual(data);
	});

	it("name is HttpError", () => {
		const err = new HttpError(400, "Bad request");
		expect(err.name).toBe("HttpError");
	});

	it("is an instance of Error", () => {
		expect(new HttpError(401, "Unauthorized")).toBeInstanceOf(Error);
	});
});
