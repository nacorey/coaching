import type { GrowStage } from "@/lib/storage/types";

export interface GrowMeta {
  stage: GrowStage;
  confidence: number;
}

export interface ParseResult {
  meta: GrowMeta | null;
  text: string;
}

const GROW_PREFIX_REGEX = /^<<GROW:(goal|reality|options|will):([\d.]+)>>\n?/;

/**
 * Parses a <<GROW:stage:confidence>> prefix from a complete AI response.
 * Returns the extracted meta and remaining text.
 * Returns null meta if the prefix is missing or malformed.
 */
export function parseGrowPrefix(input: string): ParseResult {
  const match = GROW_PREFIX_REGEX.exec(input);
  if (!match) {
    return { meta: null, text: input };
  }

  const stage = match[1] as GrowStage;
  const confidence = parseFloat(match[2]);
  const text = input.slice(match[0].length);

  return { meta: { stage, confidence }, text };
}

/**
 * For streaming: finds the end position of the GROW prefix in a buffer.
 * Returns -1 if the buffer doesn't start with <<GROW: or the >> hasn't arrived yet.
 * Returns the index of the first content character after the prefix (skipping trailing \n).
 */
export function findGrowPrefixEnd(buffer: string): number {
  if (!buffer.startsWith("<<GROW:")) {
    return -1;
  }

  const closeIdx = buffer.indexOf(">>");
  if (closeIdx === -1) {
    return -1;
  }

  // The ">>" occupies 2 characters, so content starts at closeIdx + 2
  let contentStart = closeIdx + 2;

  // Skip a single trailing newline if present
  if (buffer[contentStart] === "\n") {
    contentStart += 1;
  }

  return contentStart;
}
