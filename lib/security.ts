// lib/security.ts

// Regex patterns for Indian PII
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;
const PHONE_REGEX = /\b[6-9]\d{9}\b/g;
const AADHAAR_REGEX = /\b\d{12}\b/g;

/**
 * Masks PII in the text and returns the masked text + a map of the original values.
 */
export function maskPII(text: string): { maskedText: string; piiMap: Record<string, string> } {
  const piiMap: Record<string, string> = {};
  let maskedText = text;
  let maskIndex = 1;

  // Mask PAN
  maskedText = maskedText.replace(PAN_REGEX, (match) => {
    const placeholder = `[PAN_MASKED_${maskIndex}]`;
    piiMap[placeholder] = match;
    maskIndex++;
    return placeholder;
  });

  // Mask Phone
  maskedText = maskedText.replace(PHONE_REGEX, (match) => {
    const placeholder = `[PHONE_MASKED_${maskIndex}]`;
    piiMap[placeholder] = match;
    maskIndex++;
    return placeholder;
  });

  // Mask Aadhaar
  maskedText = maskedText.replace(AADHAAR_REGEX, (match) => {
    const placeholder = `[AADHAAR_MASKED_${maskIndex}]`;
    piiMap[placeholder] = match;
    maskIndex++;
    return placeholder;
  });

  return { maskedText, piiMap };
}

/**
 * Restores original PII values into the AI response (if the AI echoed them back).
 */
export function unmaskPII(text: string, piiMap: Record<string, string>): string {
  let unmaskedText = text;
  for (const [placeholder, original] of Object.entries(piiMap)) {
    unmaskedText = unmaskedText.split(placeholder).join(original);
  }
  return unmaskedText;
}