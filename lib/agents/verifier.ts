export type VerificationResult = { passed: boolean; message: string };

export function verifyActionResult(result: unknown): VerificationResult {
  return result ? { passed: true, message: "Action produced a result." } : { passed: false, message: "Action returned no result." };
}
