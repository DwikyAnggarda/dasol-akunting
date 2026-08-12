export type AuthActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

export const initialAuthActionState: AuthActionState = {
  message: "",
  status: "idle",
};
