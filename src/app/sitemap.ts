import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/brand";
import { listModels, listTasks } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tasks, models] = await Promise.all([listTasks(), listModels()]);

  const staticRoutes = [
    "/",
    "/tasks",
    "/compare",
    "/leaderboard",
    "/models",
    "/methodology",
  ].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "daily" as const,
    priority: path === "/" ? 1 : 0.7,
  }));

  return [
    ...staticRoutes,
    ...tasks.map((t) => ({
      url: absoluteUrl(`/tasks/${t.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...models.map((m) => ({
      url: absoluteUrl(`/models/${m.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
