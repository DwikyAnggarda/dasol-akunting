export type MutationError = {
  code: string;
  fieldErrors?: Record<string, string[]>;
  message: string;
};

export type MutationState =
  | { error?: never; message?: string; status: "idle" | "success" }
  | { error: MutationError; status: "error" };

export const initialMutationState: MutationState = { status: "idle" };
