import { config } from "../config.js";

export function toolText(text: string) {
  return {
    content: [{ type: "text" as const, text }],
  };
}

export function toolJson(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function toolError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

type ProjectFlagOptions = {
  allowAllProjects?: boolean;
};

export function addProjectFlag(
  args: string[],
  project?: string,
  options?: ProjectFlagOptions
) {
  if (project) {
    args.push("--project", project);
    return;
  }

  if (config.projects.strict) {
    return;
  }

  if (options?.allowAllProjects) {
    args.push("--all-projects");
  }
}
