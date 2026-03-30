import { describe, it, expect } from "vitest";
import { parseGrowPrefix, findGrowPrefixEnd } from "@/lib/ai/grow-parser";

describe("parseGrowPrefix", () => {
  it("parses a valid prefix with newline: <<GROW:reality:0.85>>\\nText", () => {
    const result = parseGrowPrefix("<<GROW:reality:0.85>>\nText");
    expect(result.meta).toEqual({ stage: "reality", confidence: 0.85 });
    expect(result.text).toBe("Text");
  });

  it("parses a valid prefix without newline: <<GROW:goal:0.9>>Text", () => {
    const result = parseGrowPrefix("<<GROW:goal:0.9>>Text");
    expect(result.meta).toEqual({ stage: "goal", confidence: 0.9 });
    expect(result.text).toBe("Text");
  });

  it("returns null meta when prefix is missing", () => {
    const result = parseGrowPrefix("Just some plain text without prefix");
    expect(result.meta).toBeNull();
    expect(result.text).toBe("Just some plain text without prefix");
  });

  it("returns null meta for malformed prefix <<GROW:invalid>>\\nText", () => {
    const result = parseGrowPrefix("<<GROW:invalid>>\nText");
    expect(result.meta).toBeNull();
    expect(result.text).toBe("<<GROW:invalid>>\nText");
  });

  it("parses all four GROW stages correctly", () => {
    const stages = ["goal", "reality", "options", "will"] as const;
    for (const stage of stages) {
      const result = parseGrowPrefix(`<<GROW:${stage}:0.75>>\nSome text`);
      expect(result.meta).toEqual({ stage, confidence: 0.75 });
      expect(result.text).toBe("Some text");
    }
  });

  it("returns null meta for empty string", () => {
    const result = parseGrowPrefix("");
    expect(result.meta).toBeNull();
    expect(result.text).toBe("");
  });

  it("returns null meta for malformed prefix missing confidence", () => {
    const result = parseGrowPrefix("<<GROW:goal>>\nText");
    expect(result.meta).toBeNull();
    expect(result.text).toBe("<<GROW:goal>>\nText");
  });
});

describe("findGrowPrefixEnd", () => {
  it("returns -1 for incomplete buffer starting with <<GROW: but no >>", () => {
    const result = findGrowPrefixEnd("<<GROW:re");
    expect(result).toBe(-1);
  });

  it("returns -1 for buffer that does not start with <<GROW:", () => {
    const result = findGrowPrefixEnd("Some text");
    expect(result).toBe(-1);
  });

  it("returns -1 for empty buffer", () => {
    const result = findGrowPrefixEnd("");
    expect(result).toBe(-1);
  });

  it("returns correct end index for complete prefix without trailing newline", () => {
    // "<<GROW:goal:0.9>>" is 17 chars, content starts at index 17
    const buffer = "<<GROW:goal:0.9>>Some content here";
    const result = findGrowPrefixEnd(buffer);
    expect(result).toBe(17);
  });

  it("returns correct end index for complete prefix with trailing newline", () => {
    // "<<GROW:goal:0.9>>\n" is 18 chars, content starts at index 18
    const buffer = "<<GROW:goal:0.9>>\nSome content here";
    const result = findGrowPrefixEnd(buffer);
    expect(result).toBe(18);
  });

  it("returns correct end index for a longer prefix", () => {
    // "<<GROW:reality:0.85>>\n" is 22 chars, content starts at index 22
    const buffer = "<<GROW:reality:0.85>>\nContent";
    const result = findGrowPrefixEnd(buffer);
    expect(result).toBe(22);
  });
});
