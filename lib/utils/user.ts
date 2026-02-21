export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Next.js serializes server action errors as plain objects across the network
// boundary — `instanceof Error` is always false on the client for those.
// This helper handles both cases safely.
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const { message } = err as { message: unknown };
    if (typeof message === "string") return message;
  }
  return "An unexpected error occurred";
}
