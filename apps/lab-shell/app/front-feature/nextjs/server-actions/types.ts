export interface VerificationState {
  status: "idle" | "success" | "error";
  input: string;
  message: string;
  errorType: "validation" | "transport" | null;
  normalizedName: string | null;
  receipt: string | null;
  via: "api-route" | "server-action" | null;
}
