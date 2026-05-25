-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin') THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.softwares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  description text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.softwares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read softwares" ON public.softwares FOR SELECT USING (true);
CREATE POLICY "Admins manage softwares" ON public.softwares FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX softwares_category_idx ON public.softwares(category_id, sort_order);

INSERT INTO public.categories(name, sort_order) VALUES
  ('系统装机', 0),('解压缩软件', 1),('学习工具', 2),('卸载工具', 3),('下载工具', 4),
  ('常用工具', 5),('搜索工具', 6),('PDF工具', 7),('剪辑工具', 8),('格式转换', 9),
  ('视频播放', 10),('系统清理', 11),('其它各种工具', 12),('Adobe 全家桶', 13),
  ('常用网站', 14),('安卓端软件', 15),('各种教程', 16);

INSERT INTO public.softwares(category_id, name, url, description, sort_order) VALUES
  ((SELECT id FROM public.categories WHERE name='系统装机'), '系统下载工具', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489232&idx=2&sn=c93253cfa1b71c0700c07deea6b4edff&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='系统装机'), 'Windows 工具箱', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489245&idx=1&sn=c1b43133c92bca98b07ef83ed08eb88c&scene=21#wechat_redirect', '', 1),
  ((SELECT id FROM public.categories WHERE name='系统装机'), 'KMS激活工具', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489245&idx=1&sn=c1b43133c92bca98b07ef83ed08eb88c&scene=21#wechat_redirect', '', 2),
  ((SELECT id FROM public.categories WHERE name='系统装机'), '暂停Windows系统更新', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489379&idx=1&sn=17cb6ed50424accfc855ef4c5e35bf35&scene=21#wechat_redirect', '', 3),
  ((SELECT id FROM public.categories WHERE name='系统装机'), 'MSVC（运行库）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488858&idx=2&sn=f1aaecf938bd9fc61ee9d380035145df&scene=21#wechat_redirect', '', 4),
  ((SELECT id FROM public.categories WHERE name='系统装机'), 'Mocreak（激活Office）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488786&idx=2&sn=ade8edafda041b90f240e01e5a2102ec&scene=21#wechat_redirect', '', 5),
  ((SELECT id FROM public.categories WHERE name='解压缩软件'), '7-zip', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489245&idx=1&sn=c1b43133c92bca98b07ef83ed08eb88c&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='解压缩软件'), 'Winrar', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489395&idx=1&sn=dd7e470072ff9aab173cf056b49035dc&scene=21#wechat_redirect', '', 1),
  ((SELECT id FROM public.categories WHERE name='学习工具'), 'Xmind 2026', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489156&idx=1&sn=818e7e3528c404975b7321c529ec836b&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='学习工具'), 'Typpora（Markdown编辑器）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489011&idx=2&sn=b90ed1a9692a3783c8d1666fc57c6fb1&scene=21#wechat_redirect', '', 1),
  ((SELECT id FROM public.categories WHERE name='学习工具'), 'STranslate（翻译工具）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488451&idx=1&sn=b167ec7ed5731ec808ebee5328ccf692&scene=21#wechat_redirect', '', 2),
  ((SELECT id FROM public.categories WHERE name='卸载工具'), 'Bulk Crap Uninstaller', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489245&idx=1&sn=c1b43133c92bca98b07ef83ed08eb88c&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='卸载工具'), 'Geek uninstaller', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488353&idx=1&sn=fd6403877a2f1c2929b7a8df31133a8d&scene=21#wechat_redirect', '', 1),
  ((SELECT id FROM public.categories WHERE name='下载工具'), 'IDM直装版', 'https://mp.weixin.qq.com/s?__biz=MzcwODMwNTY3MA==&mid=2247483775&idx=1&sn=86e44cfd9ab0c267f29df42c642367fe&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='下载工具'), 'Aria2下载神器', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489167&idx=1&sn=d87b46844657af5dbd789f5dfb70bf9f&scene=21#wechat_redirect', '', 1),
  ((SELECT id FROM public.categories WHERE name='下载工具'), 'Videdown视频下载工具', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489257&idx=1&sn=bc42647d9aaec271ddfc635f7a0784d4&scene=21#wechat_redirect', '', 2),
  ((SELECT id FROM public.categories WHERE name='下载工具'), '抖珍藏（抖音批量下载）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489177&idx=2&sn=f192a5665d0a2f3f4909085d877a0efa&scene=21#wechat_redirect', '', 3),
  ((SELECT id FROM public.categories WHERE name='下载工具'), '迅雷精简版', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488820&idx=1&sn=796ab3ec363da44fdf4e840942568aa1&scene=21#wechat_redirect', '', 4),
  ((SELECT id FROM public.categories WHERE name='下载工具'), '哔哩哔哩下载器', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489004&idx=1&sn=5ff4cf791510b6211b11ca460a0549f7&scene=21#wechat_redirect', '', 5),
  ((SELECT id FROM public.categories WHERE name='下载工具'), '公众号文章下载神器', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488806&idx=1&sn=a40f829d49f1b9f73bf29fe79cbd738d&scene=21#wechat_redirect', '', 6),
  ((SELECT id FROM public.categories WHERE name='常用工具'), 'Everything桌面搜索工具', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489245&idx=1&sn=c1b43133c92bca98b07ef83ed08eb88c&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='常用工具'), 'MTools', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488961&idx=2&sn=22c44ed94528a7fc9c32faaca1d9146b&scene=21#wechat_redirect', '', 1),
  ((SELECT id FROM public.categories WHERE name='常用工具'), 'Pot 翻译工具', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489245&idx=1&sn=c1b43133c92bca98b07ef83ed08eb88c&scene=21#wechat_redirect', 'AI工具箱', 2),
  ((SELECT id FROM public.categories WHERE name='常用工具'), 'OBS Studio', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489245&idx=1&sn=c1b43133c92bca98b07ef83ed08eb88c&scene=21#wechat_redirect', '', 3),
  ((SELECT id FROM public.categories WHERE name='常用工具'), 'OncePower', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488739&idx=1&sn=2500870b3a8be57b468db33004d133ad&scene=21#wechat_redirect', '录屏工具', 4),
  ((SELECT id FROM public.categories WHERE name='常用工具'), 'TranslucentTB', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488641&idx=1&sn=a9850df214b05b46c438f6c4c60feb89&scene=21#wechat_redirect', '批量重命名', 5),
  ((SELECT id FROM public.categories WHERE name='常用工具'), '阅后即焚', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488480&idx=1&sn=233756b8ddb1b6f204d77be7f4d0a7c2&scene=21#wechat_redirect', '状态栏美化', 6),
  ((SELECT id FROM public.categories WHERE name='搜索工具'), 'Everything桌面搜索工具', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489245&idx=1&sn=c1b43133c92bca98b07ef83ed08eb88c&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='搜索工具'), 'Listary', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488509&idx=1&sn=5e20445eebda708f4b8f1f07d8be6fef&scene=21#wechat_redirect', '快速启动', 1),
  ((SELECT id FROM public.categories WHERE name='PDF工具'), 'PDF解密', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488676&idx=1&sn=98fcb9a800999b61747dac321b5d77b4&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='PDF工具'), 'Master PDF Editor', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488858&idx=1&sn=b5f7501f0b17f99b186073bd21dddd54&scene=21#wechat_redirect', '', 1),
  ((SELECT id FROM public.categories WHERE name='PDF工具'), 'Pdf24 Tools（PDF工具箱）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488424&idx=1&sn=3ce3053d25c6ae0847c2846e3f9a26a6&scene=21#wechat_redirect', '', 2),
  ((SELECT id FROM public.categories WHERE name='剪辑工具'), '万兴喵影Filmora', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488961&idx=1&sn=351f07a0e521d3acebcc99574d4fe2ca&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='格式转换'), '万兴优转（视频格式转换工具）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489269&idx=1&sn=7daf032ebc4b5dc1923c5f4f903bcd0b&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='格式转换'), '格式工厂', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488934&idx=1&sn=d8eca4fe4c149c0dd040ccee663b6577&scene=21#wechat_redirect', '', 1),
  ((SELECT id FROM public.categories WHERE name='格式转换'), 'File Converter', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489245&idx=1&sn=c1b43133c92bca98b07ef83ed08eb88c&scene=21#wechat_redirect', '', 2),
  ((SELECT id FROM public.categories WHERE name='视频播放'), 'PotPlayer万能视频播放器', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488967&idx=1&sn=252546030f87df4d283bddd892839cf6&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='视频播放'), '网易爆米花视频播放器', 'https://mp.weixin.qq.com/s?__biz=MzcwODMwNTY3MA==&mid=2247483749&idx=1&sn=3b54887e6e9f43cab520a2a985b00b16&scene=21#wechat_redirect', '', 1),
  ((SELECT id FROM public.categories WHERE name='系统清理'), 'CCleaner', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488668&idx=1&sn=5844490e1030e90b008fd25cda915f24&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='其它各种工具'), 'Quick Any2Ico图标提取转换器', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489322&idx=1&sn=e943d27ae33a98a970a358f9e782e967&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='其它各种工具'), 'WeFlow（微信聊天记录导出工具/朋友圈导出工具）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489269&idx=2&sn=541e84f51b74cb5504bf6c2706463a01&scene=21#wechat_redirect', '', 1),
  ((SELECT id FROM public.categories WHERE name='其它各种工具'), 'Watt Toolkit（加速工具箱）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488707&idx=1&sn=254341a9aea58226bcf2f92f75f46fda&scene=21#wechat_redirect', '', 2),
  ((SELECT id FROM public.categories WHERE name='其它各种工具'), 'Ultimate Vocal Remover（人声分离）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489245&idx=1&sn=c1b43133c92bca98b07ef83ed08eb88c&scene=21#wechat_redirect', '', 3),
  ((SELECT id FROM public.categories WHERE name='其它各种工具'), 'draw.io 流程图', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489245&idx=1&sn=c1b43133c92bca98b07ef83ed08eb88c&scene=21#wechat_redirect', '', 4),
  ((SELECT id FROM public.categories WHERE name='其它各种工具'), 'Luminar Neo（AI照片编辑）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488934&idx=2&sn=c4a0d73cf741143feead4f6bf04b0666&scene=21#wechat_redirect', '', 5),
  ((SELECT id FROM public.categories WHERE name='其它各种工具'), 'Beyond Compare（文件对比）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488806&idx=2&sn=0b036a3140f736090b3771f7f60f8c25&scene=21#wechat_redirect', '', 6),
  ((SELECT id FROM public.categories WHERE name='其它各种工具'), 'SBTI人格测试', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488554&idx=1&sn=bbf3226eae1cdc19f21279ac6401632a&scene=21#wechat_redirect', '', 7),
  ((SELECT id FROM public.categories WHERE name='Adobe 全家桶'), 'Adobe Illustrator 2026(AI)', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489332&idx=1&sn=c53ae28bc6126c1001cf4bcaa8cc273f&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='Adobe 全家桶'), 'Adobe Photoshop 2026', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489296&idx=1&sn=1e33bd20b0cc85cff7ef2a09268463f4&scene=21#wechat_redirect', '', 1),
  ((SELECT id FROM public.categories WHERE name='Adobe 全家桶'), 'Adobe Premiere Pro 2026（pr）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489004&idx=2&sn=ef7fbe69146bb763b7ce995cd6d01e53&scene=21#wechat_redirect', '', 2),
  ((SELECT id FROM public.categories WHERE name='Adobe 全家桶'), 'PS 精简版', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247488820&idx=2&sn=9269baa81e89aadbcfd3da7d17a0251b&scene=21#wechat_redirect', '', 3),
  ((SELECT id FROM public.categories WHERE name='常用网站'), '免费电子书、漫画、小说、有声读物、学术论文和杂志资源的网站', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489275&idx=1&sn=89472432f95102512648d526c900a708&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='常用网站'), '30款全球历史文献，各国图书馆', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489232&idx=1&sn=09ab6a5fefc157a99c7fe264da9a511e&scene=21#wechat_redirect', '', 1),
  ((SELECT id FROM public.categories WHERE name='常用网站'), '极客副业站（专注搞钱的网站）', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489150&idx=2&sn=d3c13b237e358a633578a0511ef27df8&scene=21#wechat_redirect', '', 2),
  ((SELECT id FROM public.categories WHERE name='安卓端软件'), '酷狗概念版VIP白嫖方法', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489302&idx=1&sn=4abb26e6b801d95c8cf163823b889419&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='安卓端软件'), '阅读千阅免费小说软件', 'https://mp.weixin.qq.com/s?__biz=MzcwODMwNTY3MA==&mid=2247483727&idx=1&sn=a0af5345a72c4793e89ffaa6d1694355&scene=21#wechat_redirect', '', 1),
  ((SELECT id FROM public.categories WHERE name='各种教程'), '免费AI自动生成PPT', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489291&idx=2&sn=3537c80bf6b2c4fbd03b1be589dcad79&scene=21#wechat_redirect', '', 0),
  ((SELECT id FROM public.categories WHERE name='各种教程'), '小米送100万亿Token，个人开发者白嫖全攻略！含详细领取以及API使用教程~', 'https://mp.weixin.qq.com/s?__biz=MzYyMTg0NDA0NQ==&mid=2247489275&idx=2&sn=24eebe188e00b237b8a66ece6896ab97&scene=21#wechat_redirect', '', 1);