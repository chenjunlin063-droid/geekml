import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, LogOut } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

type Category = { id: string; name: string; sort_order: number };
type Software = { id: string; category_id: string; name: string; url: string; description: string | null; sort_order: number };

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">加载中...</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-xl font-semibold">无管理权限</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          当前账号不是管理员。请使用管理员账号登录。
        </p>
        <Button className="mt-4" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); }}>
          退出登录
        </Button>
      </main>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });
  const { data: softwares } = useQuery({
    queryKey: ["softwares"],
    queryFn: async () => {
      const { data, error } = await supabase.from("softwares").select("*").order("sort_order").limit(2000);
      if (error) throw error;
      return data as Software[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["softwares"] });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">后台管理</h1>
        <div className="flex gap-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary self-center">← 返回首页</Link>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4 mr-1" /> 退出
          </Button>
        </div>
      </div>

      <Tabs defaultValue="softwares">
        <TabsList>
          <TabsTrigger value="softwares">软件 ({softwares?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="categories">分类 ({categories?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="site">界面设置</TabsTrigger>
        </TabsList>

        <TabsContent value="softwares" className="mt-4">
          <SoftwareManager categories={categories ?? []} softwares={softwares ?? []} onChange={refresh} />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoryManager categories={categories ?? []} onChange={refresh} />
        </TabsContent>
        <TabsContent value="site" className="mt-4">
          <SiteSettingsManager />
        </TabsContent>
      </Tabs>
    </main>
  );
}

/* ------------------- Software manager ------------------- */
function SoftwareManager({
  categories,
  softwares,
  onChange,
}: {
  categories: Category[];
  softwares: Software[];
  onChange: () => void;
}) {
  const [editing, setEditing] = useState<Software | null>(null);
  const [open, setOpen] = useState(false);

  const startCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const startEdit = (s: Software) => {
    setEditing(s);
    setOpen(true);
  };

  async function remove(id: string) {
    if (!confirm("确定删除这条软件？")) return;
    const { error } = await supabase.from("softwares").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("已删除");
    onChange();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>软件列表</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={startCreate}>
              <Plus className="size-4 mr-1" /> 新增软件
            </Button>
          </DialogTrigger>
          <SoftwareDialog
            key={editing?.id ?? "new"}
            categories={categories}
            initial={editing}
            onSaved={() => {
              setOpen(false);
              onChange();
            }}
          />
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead className="hidden md:table-cell">链接</TableHead>
                <TableHead className="w-24">排序</TableHead>
                <TableHead className="w-28 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {softwares.map((s) => {
                const cat = categories.find((c) => c.id === s.category_id);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{cat?.name ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                      {s.url}
                    </TableCell>
                    <TableCell>{s.sort_order}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(s)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(s.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function SoftwareDialog({
  categories,
  initial,
  onSaved,
}: {
  categories: Category[];
  initial: Software | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [catId, setCatId] = useState(initial?.category_id ?? categories[0]?.id ?? "");
  const [sort, setSort] = useState(initial?.sort_order ?? 0);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name || !url || !catId) return toast.error("请填写完整信息");
    setBusy(true);
    const payload = { name, url, description: desc, category_id: catId, sort_order: Number(sort) || 0 };
    const { error } = initial
      ? await supabase.from("softwares").update(payload).eq("id", initial.id)
      : await supabase.from("softwares").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "已更新" : "已添加");
    onSaved();
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{initial ? "编辑软件" : "新增软件"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>名称</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>链接 URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <Label>说明（可选）</Label>
          <Input value={desc ?? ""} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>分类</Label>
            <Select value={catId} onValueChange={setCatId}>
              <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>排序</Label>
            <Input type="number" value={sort} onChange={(e) => setSort(Number(e.target.value))} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button disabled={busy} onClick={save}>{busy ? "保存中..." : "保存"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ------------------- Category manager ------------------- */
function CategoryManager({ categories, onChange }: { categories: Category[]; onChange: () => void }) {
  const [name, setName] = useState("");
  const [sort, setSort] = useState(0);

  async function add() {
    if (!name) return;
    const { error } = await supabase.from("categories").insert({ name, sort_order: sort });
    if (error) return toast.error(error.message);
    setName(""); setSort(0);
    toast.success("已新增");
    onChange();
  }

  async function update(c: Category, patch: Partial<Category>) {
    const { error } = await supabase.from("categories").update(patch).eq("id", c.id);
    if (error) return toast.error(error.message);
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("删除分类会同时删除其下的所有软件，确认？")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("已删除");
    onChange();
  }

  return (
    <Card>
      <CardHeader><CardTitle>分类管理</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 items-end mb-4">
          <div className="flex-1 min-w-[160px]">
            <Label>新增分类名称</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="w-24">
            <Label>排序</Label>
            <Input type="number" value={sort} onChange={(e) => setSort(Number(e.target.value))} />
          </div>
          <Button onClick={add}><Plus className="size-4 mr-1" /> 新增</Button>
        </div>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead className="w-32">排序</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <CategoryRow key={c.id} c={c} onUpdate={update} onDelete={remove} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryRow({
  c,
  onUpdate,
  onDelete,
}: {
  c: Category;
  onUpdate: (c: Category, patch: Partial<Category>) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(c.name);
  const [sort, setSort] = useState(c.sort_order);
  return (
    <TableRow>
      <TableCell>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== c.name && onUpdate(c, { name })}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={sort}
          onChange={(e) => setSort(Number(e.target.value))}
          onBlur={() => sort !== c.sort_order && onUpdate(c, { sort_order: sort })}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button size="icon" variant="ghost" onClick={() => onDelete(c.id)}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
