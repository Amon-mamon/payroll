import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "./errors";

export const notify = {
  success: (title: string, description?: string) => toast.add({ title, description, type: "success" }),
  error: (error: unknown, title = "Something went wrong") =>
    toast.add({ title, description: getErrorMessage(error), type: "error" }),
};
