import { describe, expect, it } from "vitest";
import { z } from "zod";

const corsOriginSchema = z
	.string()
	.default("http://localhost:8080")
	.transform((val) => {
		if (!val.trim()) return "http://localhost:8080";
		if (val.trim() === "*") return "*";
		const origins = val
			.split(",")
			.map((s) => s.trim().replace(/\/+$/, ""))
			.filter(Boolean);
		if (origins.length === 0) return "http://localhost:8080";
		return origins.length === 1 ? origins[0] : origins;
	});

describe("CORS_ORIGIN Schema Validation", () => {
	it("should return single string for a single domain", () => {
		const result = corsOriginSchema.parse("http://localhost:3000");
		expect(result).toBe("http://localhost:3000");
	});

	it("should parse multiple comma-separated domains into an array of strings", () => {
		const result = corsOriginSchema.parse("http://localhost:3000, http://103.82.194.85:8000");
		expect(result).toEqual(["http://localhost:3000", "http://103.82.194.85:8000"]);
	});

	it("should correctly parse custom user domain list", () => {
		const result = corsOriginSchema.parse("http://ngnhonk.id.vn,http://www.ngnhonk.id.vn,http://103.82.194.85");
		expect(result).toEqual([
			"http://ngnhonk.id.vn",
			"http://www.ngnhonk.id.vn",
			"http://103.82.194.85"
		]);
	});

	it("should trim whitespace and remove trailing slashes from origins", () => {
		const result = corsOriginSchema.parse(" http://localhost:3000/ , http://103.82.194.85:8000/ ");
		expect(result).toEqual(["http://localhost:3000", "http://103.82.194.85:8000"]);
	});

	it("should handle wildcard '*' correctly", () => {
		const result = corsOriginSchema.parse("*");
		expect(result).toBe("*");
	});

	it("should fallback to default when empty string or undefined", () => {
		expect(corsOriginSchema.parse("")).toBe("http://localhost:8080");
		expect(corsOriginSchema.parse(undefined)).toBe("http://localhost:8080");
	});
});
