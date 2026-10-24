export function parseRun(value: string | string[] | undefined): string {
  return typeof value === "string" && /^(0|[1-9]\d{0,8})$/.test(value) ? value : "0";
}
