import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

type Category = { id: string; name: string; sort_order: number };
type Software = { id: string; category_id: string; name: string; url: string; description: string | null; sort_order: number };

const categoriesQueryOptions = queryOptions({
  queryKey: ["categories"],
  staleTime: 30_000,
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []) as Category[];
  },
});

const softwaresQueryOptions = queryOptions({
  queryKey: ["softwares"],
  staleTime: 30_000,
  queryFn: async () => {
    const { data, error } = await supabase.from("softwares").select("*").order("sort_order").limit(2000);
    if (error) throw error;
    return (data ?? []) as Software[];
  },
});

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQueryOptions),
      context.queryClient.ensureQueryData(softwaresQueryOptions),
    ]),
  component: Index,
  head: () => ({
    meta: [{ title: "极客软件馆" }],
  }),
});

function Index() {
  const [q, setQ] = useState("");
  const { data: settings } = useSiteSettings();
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions);
  const { data: softwares } = useSuspenseQuery(softwaresQueryOptions);

  const grouped = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return categories
      .map((c) => ({
        category: c,
        items: softwares
          .filter((s) => s.category_id === c.id)
          .filter((s) =>
            kw
              ? s.name.toLowerCase().includes(kw) ||
                (s.description ?? "").toLowerCase().includes(kw)
              : true
          ),
      }))
      .filter((g) => g.items.length > 0);
  }, [categories, softwares, q]);

  const total = softwares.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 text-center">
        {settings.logo_url ? (
          <img
            src={settings.logo_url}
            alt={settings.site_name}
            className="mx-auto mb-4 h-16 w-auto object-contain"
          />
        ) : null}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {settings.hero_title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {settings.hero_subtitle.includes("{count}")
            ? settings.hero_subtitle.replace("{count}", String(total))
            : (
              <>
                {settings.hero_subtitle}
                <span className="ml-1 text-xs">（共 {total} 项）</span>
              </>
            )}
        </p>
        <div className="mt-5 relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={settings.search_placeholder}
            className="pl-9"
          />
        </div>
      </header>

      <div className="space-y-10">
        {grouped.map(({ category, items }) => (
          <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-20">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <span className="inline-block w-1 h-5 bg-primary rounded" />
              {category.name}
              <span className="text-xs font-normal text-muted-foreground">
                共 {items.length} 项
              </span>
            </h2>
            <div className="rounded-lg border overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">序号</TableHead>
                    <TableHead>软件 / 资源名称</TableHead>
                    <TableHead className="hidden md:table-cell">说明</TableHead>
                    <TableHead className="w-24 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium break-all"
                        >
                          {s.name}
                        </a>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {s.description || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded border hover:bg-accent inline-block"
                        >
                          查看
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ))}
        {grouped.length === 0 && q && (
          <div className="text-center text-muted-foreground py-12">
            没有找到匹配 "{q}" 的内容
          </div>
        )}
      </div>
    </div>
  );
}
