import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

type Category = { id: string; name: string; sort_order: number };
type Software = { id: string; category_id: string; name: string; url: string; description: string | null; sort_order: number; icon_url: string | null };


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
        {settings.promo_text ? (
          <div className="mt-6 flex justify-center">
            {settings.promo_url ? (
              <a
                href={settings.promo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 px-3 py-1.5 text-sm md:text-base font-semibold transition-transform hover:scale-[1.03]"
              >
                <span className="animate-pulse text-orange-500 text-lg">📢</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 underline decoration-orange-400/50 decoration-2 underline-offset-4 group-hover:decoration-orange-500">
                  {settings.promo_text}
                </span>
                <span className="text-orange-500 transition-transform group-hover:translate-x-1">→</span>
              </a>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 text-sm md:text-base font-semibold">
                <span className="animate-pulse text-orange-500 text-lg">📢</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500">
                  {settings.promo_text}
                </span>
              </div>
            )}
          </div>
        ) : null}
      </header>

      {settings.home_layout === "compact" ? (
        <CompactLayout grouped={grouped} q={q} />
      ) : settings.home_layout === "card" ? (
        <CardLayout grouped={grouped} q={q} />
      ) : (
        <DefaultLayout grouped={grouped} q={q} />
      )}

    </div>
  );
}

type GroupedItem = { category: Category; items: Software[] };

function DefaultLayout({ grouped, q }: { grouped: GroupedItem[]; q: string }) {
  return (
    <div className="space-y-10">
      {grouped.map(({ category, items }) => (
        <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-20">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <span className="inline-block w-1 h-5 bg-primary rounded" />
            {category.name}
            <span className="text-xs font-normal text-muted-foreground">共 {items.length} 项</span>
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
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium break-all">
                        {s.name}
                      </a>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {s.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded border hover:bg-accent inline-block">
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
        <div className="text-center text-muted-foreground py-12">没有找到匹配 "{q}" 的内容</div>
      )}
    </div>
  );
}

function CompactLayout({ grouped, q }: { grouped: GroupedItem[]; q: string }) {
  return (
    <div className="mt-2 space-y-5">
      {grouped.map(({ category, items }) => (
        <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-20">
          <div className="rounded-lg overflow-hidden border bg-card shadow-sm">
            <div className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white px-4 py-2.5 text-sm font-semibold flex items-center justify-between">
              <span>{category.name}</span>
              <span className="text-xs font-normal opacity-90">共 {items.length} 项</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 divide-x divide-y divide-border">
              {items.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.description || s.name}
                  className="group flex items-center gap-2 px-3 py-2.5 hover:bg-accent transition-colors min-w-0"
                >
                  {s.icon_url ? (
                    <img src={s.icon_url} alt="" className="size-7 shrink-0 rounded object-contain bg-muted" />
                  ) : (
                    <span className="inline-flex items-center justify-center size-7 shrink-0 rounded bg-gradient-to-br from-sky-100 to-indigo-100 text-indigo-600 text-xs font-bold">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-sm text-foreground group-hover:text-primary truncate">
                    {s.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      ))}
      {grouped.length === 0 && q && (
        <div className="text-center text-muted-foreground py-12">没有找到匹配 "{q}" 的内容</div>
      )}
    </div>
  );
}

function CardLayout({ grouped, q }: { grouped: GroupedItem[]; q: string }) {
  const palette = [
    "bg-sky-50 text-sky-600",
    "bg-rose-50 text-rose-600",
    "bg-amber-50 text-amber-600",
    "bg-emerald-50 text-emerald-600",
    "bg-violet-50 text-violet-600",
    "bg-orange-50 text-orange-600",
    "bg-teal-50 text-teal-600",
    "bg-pink-50 text-pink-600",
  ];
  return (
    <div className="mt-2 space-y-6">
      {grouped.map(({ category, items }) => (
        <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-20">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30">
              <h2 className="text-base font-bold text-red-600 tracking-wide">
                {category.name}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              {items.map((s, i) => {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const totalRows = Math.ceil(items.length / 2);
                const isLastRow = row === totalRows - 1;
                return (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.description || s.name}
                    className={[
                      "group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/50 min-w-0",
                      isLastRow ? "" : "border-b border-border",
                      col === 0 ? "md:border-r md:border-border" : "",
                    ].join(" ")}
                  >
                    {s.icon_url ? (
                      <img
                        src={s.icon_url}
                        alt=""
                        className="size-7 shrink-0 rounded object-contain"
                      />
                    ) : (
                      <span
                        className={`inline-flex items-center justify-center size-7 shrink-0 rounded text-sm font-bold ${palette[i % palette.length]}`}
                      >
                        {s.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="text-sm text-sky-600 group-hover:text-sky-700 group-hover:underline truncate">
                      {s.name}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      ))}
      {grouped.length === 0 && q && (
        <div className="text-center text-muted-foreground py-12">没有找到匹配 "{q}" 的内容</div>
      )}
    </div>
  );
}


