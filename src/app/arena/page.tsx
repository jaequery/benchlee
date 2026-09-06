import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ArenaPage({ searchParams }: {
  searchParams: Promise<{ task?: string; a?: string; b?: string }>;
}) {
  const { task, a, b } = await searchParams;
  const query = new URLSearchParams();
  if (task) query.set("task", task);
  if (a) query.set("a", a);
  if (b) query.set("b", b);
  redirect(query.size ? `/compare?${query}` : "/compare");
}
