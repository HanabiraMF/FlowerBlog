-- Demo content. Remove it from 后台 → 站点设置 → 示例内容, or via SQL.
INSERT OR IGNORE INTO users
  (id, username, email, password_hash, password_salt, role, status, bio, avatar_url, created_at, updated_at)
VALUES
  ('usr_demo_editor', '花房编辑', 'editor@flowerblog.demo',
   'Zmxvd2VyYmxvZy1kZW1vLWhhc2gtbm90LXZhbGlkMQ==',
   'Zmxvd2VyYmxvZy1kZW1vLXNhbHQ=',
   'demo', 'active',
   '在 FlowerBlog 记录植物、光线和缓慢的日常。',
   '/demo/avatar-editor.svg',
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-120 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-2 days')),
  ('usr_demo_reader_lin', '林间来信', 'lin@flowerblog.demo',
   'Zmxvd2VyYmxvZy1kZW1vLWhhc2gtbm90LXZhbGlkMQ==',
   'Zmxvd2VyYmxvZy1kZW1vLXNhbHQ=',
   'demo', 'active',
   '喜欢散步、旧书和下雨天。',
   '/demo/avatar-reader-1.svg',
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-34 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-34 days')),
  ('usr_demo_reader_man', '慢慢', 'man@flowerblog.demo',
   'Zmxvd2VyYmxvZy1kZW1vLWhhc2gtbm90LXZhbGlkMQ==',
   'Zmxvd2VyYmxvZy1kZW1vLXNhbHQ=',
   'demo', 'active',
   '把日子过成一首很长的诗。',
   '/demo/avatar-reader-2.svg',
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-27 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-27 days'));

INSERT OR IGNORE INTO posts
  (id, slug, title, excerpt, content, cover_url, tags, status, featured, views, author_id, created_at, updated_at, published_at)
VALUES
  ('post_demo_morning', 'slow-morning-rituals',
   '慢一点，让早晨先醒来',
   '不急着打开手机，不急着安排一整天。只为一杯手冲咖啡、一扇半开的窗，和一小段不被打扰的空白留出位置。',
   '清晨六点半，屋子里还留着夜的颜色。窗外的香樟被风吹得沙沙响，像一封没有署名的信。我给自己冲了一杯咖啡，没有加糖，也没有打开手机。

## 把早晨还给自己

有一段时间，我把早晨过成了任务清单：起床、洗漱、看消息、回复邮件，然后匆匆出门。后来才发现，一整天最好的那部分，常常在还没有开始“做事”之前。

于是我开始练习一种很慢的早晨：

- 先喝半杯温水，再煮咖啡
- 把窗户推开，让风先进来
- 读三页书，或者什么都不读
- 写下今天唯一想做的一件事

> 早晨不是一天的序言，它本身就是一天。

## 一杯咖啡的时间

手冲咖啡最迷人的，不是味道，而是它强制你慢下来。水要一圈一圈地绕，粉要一点一点地膨胀。你不能催它，就像不能催一朵花开放。

我常常在这三分钟里发呆。看蒸汽从壶嘴升起，看阳光慢慢爬过木桌，看杯子边缘那一圈细细的泡沫。那些看起来“什么都没有发生”的时刻，其实正在悄悄把人修补好。

![清晨的植物](/demo/inline-botanical.svg)

## 留一点空白

我们太习惯把时间填满了。通勤时听播客，吃饭时看视频，连散步也要听点什么。空白似乎成了一种浪费。

但我觉得，空白是种子发芽需要的黑暗。只有在那些什么都不做的间隙里，一些模糊的念头才有机会冒出来，长成一句诗，一个决定，或者仅仅是一个久违的、舒展的呼吸。

今天早上，我没有列待办清单。我只是坐在窗边，看一只麻雀在晾衣绳上停了很久。

它飞走的时候，我觉得自己也轻了一点。',
   '/demo/cover-morning.svg',
   '["生活","清晨","慢生活"]',
   'published', 1, 248, 'usr_demo_editor',
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-2 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-2 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-2 days')),

  ('post_demo_room', 'a-room-for-flowers',
   '给花留一个房间',
   '花不是装饰品。它们有自己的呼吸、方向和脾气。把家里的一角交给植物，也是在给生活留一处不被效率支配的地方。',
   '搬家后的第一个周末，我没有先拆书箱，而是去了花市。

那天带回来一盆尤加利、两枝白色洋桔梗，还有一小束我叫不出名字的黄色小花。花瓶是旧货市场淘来的，玻璃上有一道浅浅的划痕。我把它们放在朝南的窗边，阳光透过来的时候，整张桌子都像被轻轻吻了一下。

## 植物教我的事

养花之前，我以为照顾植物是一件很确定的事：浇水、晒太阳、施肥。后来才发现，更难的是观察。

- 叶子发黄，可能是水太多，也可能是太少
- 新芽朝哪里长，取决于光从哪里来
- 有些花在你以为它死了之后，还会从根部再冒出来

植物不解释，也不催促。它们只是安静地回应环境，然后按照自己的节奏生长。

> 你无法让一朵花提前开放，但你可以为它准备好土壤、水和光。

![窗边的花](/demo/inline-window.svg)

## 一角，就够

不是每个人都有一个花园。但几乎每个人都可以有一个角落：一只瓶子、一束路边买来的小花、一盆从朋友那里分来的绿萝。

重要的不是花有多贵，而是你愿不愿意每天看它一眼。

我现在每天下班回家，会先走到窗边，摸一摸尤加利的叶子，看看有没有新的芽。那几分钟里，工作的消息还在响，地铁还在开，世界还是很快。但我站着的地方，暂时是慢的。

也许这就是“给花留一个房间”的意思：不是真的腾出一间屋子，而是在生活里留出一小块地方，只用来照顾一些没有用、但很美好的东西。',
   '/demo/cover-room.svg',
   '["植物","家居","生活方式"]',
   'published', 0, 186, 'usr_demo_editor',
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-5 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-5 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-5 days')),

  ('post_demo_noticing', 'the-art-of-noticing',
   '练习看见：一件很小的事',
   '看见不是把目光投过去，而是允许自己被某样东西留住。今天的练习，是在熟悉的路线上，找到一件从未注意过的小事。',
   '我每天走同一条路去咖啡馆，大约十二分钟。路过一棵银杏、两个水果摊、一家总是关着门的裁缝店，还有一个在午后晒太阳的橘猫。

按理说，我应该对这条路很熟悉了。但昨天，我第一次注意到墙缝里长着一株小蕨。

## 熟悉的盲区

我们对熟悉的东西，往往看得最少。就像住了很多年的房间，你未必说得清天花板上有没有裂纹。

那天我决定做一个练习：在十二分钟里，不戴耳机，不看手机，只找三样以前没注意过的东西。

结果我找到了：

1. 二楼阳台垂下来的蓝色床单，在风里像一面海
2. 水果摊的老板会给每一袋橘子画一个小笑脸
3. 裁缝店的橱窗里，摆着一只缺了耳朵的陶瓷兔子

## 被留住的瞬间

看见一件小事，并不会立刻改变什么。我还是要去咖啡馆，还是要打开电脑，还是要处理那些没做完的事。

但那个上午变得有点不一样。好像世界在我不知道的时候，偷偷多长出了几层。而我终于停下来，和其中一层打了个照面。

> 生活不是缺少美，而是缺少一次不赶时间的抬头。

如果你今天也走一条熟悉的路，不妨试着找到三件从未注意过的小事。不用拍照，不用分享，只是看见它们。

然后你会发现，被看见的东西，也会回头看见你。',
   '/demo/cover-noticing.svg',
   '["观察","日常","随笔"]',
   'published', 0, 142, 'usr_demo_editor',
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-8 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-8 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-8 days')),

  ('post_demo_letter', 'letters-to-my-future-self',
   '写给未来自己的三封信',
   '我们总会给过去的自己写信，却很少认真地对未来说话。于是有了这三封不急着寄出的信，分别写给三个月后、一年后和十年后的自己。',
   '最近整理抽屉，翻出了大学时写给自己的信。信封上写着“毕业那天拆”，里面只有一句话：**希望你还喜欢现在的自己。**

我坐在地板上读了很久，忽然意识到，我们总是习惯回头看，却很少认真地对未来说话。

于是我想，不如写三封信。不寄出，只是放在一个知道的地方。

## 第一封：写给三个月后

> 你好吗？希望你没有因为赶路，错过楼下的桂花。
>
> 那件让你焦虑了很久的事，如果还没有结果，也没关系。种下去的种子不会每天都变化，但它没有停止生长。
>
> 记得在周末出门一次，哪怕只是去很远的地方买一只面包。也记得给妈妈打电话。

## 第二封：写给一年后

> 我不知道你现在在哪里，做什么工作，身边是谁。这些都不重要。
>
> 我只想问：你还有没有在做那些让你眼睛发亮的事？还有没有为一本书熬夜、为一场雨停下、为一个想法失眠？
>
> 如果没有，也来得及。重新开始这件事，永远来得及。

## 第三封：写给十年后

> 亲爱的你，应该已经长出了几根白头发吧。
>
> 希望那时候的你，住在一个有阳光的房子里，窗台上有几盆养得不错的植物。希望你能对年轻时的选择说一句“我不后悔”，也能对失去的东西坦然地说一声再见。
>
> 最重要的是，希望你依然相信：生活值得慢慢过。

![写给未来的信](/demo/inline-letter.svg)

## 把信放进时间里

写完这三封信，我把它们折好，放进一个木盒子里，和大学时那封放在一起。

不是为了在某个日子真的拆开，而是为了在写下的那一刻，提前和未来的自己握了一次手。

这让我觉得安心。原来未来不是一个黑漆漆的洞口，而是一个可以对话的人。',
   '/demo/cover-letter.svg',
   '["书信","成长","自我对话"]',
   'published', 0, 96, 'usr_demo_editor',
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-11 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-11 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-11 days')),

  ('post_demo_table', 'seasonal-table',
   '一桌一季：把季节端上餐桌',
   '春天的芦笋、夏天的番茄、秋天的南瓜、冬天的柑橘。跟着时令吃饭，是最简单也最不简单的季节感。',
   '小时候，季节是衣服的厚薄，是院子里第一朵栀子花开，是晚饭桌上突然多出来的一盘毛豆。

后来长大了，超市里一年四季什么都有，季节反而模糊了。直到我开始按着菜市场的节奏做饭，才重新找回了那种“此刻正当季”的踏实。

## 春：一点清苦

春天我喜欢买芦笋和豌豆。芦笋只要用橄榄油煎一下，撒一点海盐和黑胡椒，边缘微焦就很好。豌豆则适合和米饭一起焖，出锅时拌一小块黄油。

春天也适合吃一点苦。荠菜、香椿、苦菊，像是身体在替土地醒来。

## 夏：番茄要够红

夏天最快乐的事，是番茄便宜又好吃。冰镇之后切开，撒一点糖，是童年；和鸡蛋一起炒，是日常；用手撕碎拌罗勒和橄榄油，是给周末的仪式感。

> 一个愿意为你切番茄的人，大概也是愿意陪你把日子过细的人。

## 秋：南瓜与板栗

秋天厨房里总是甜的。南瓜蒸熟压成泥，加一点牛奶，就是很好的早餐。板栗在锅里翻炒，壳裂开的声音像小小的烟花。

## 冬：柑橘的香气

冬天我会在桌上放一盘柑橘。它们既是水果，也是香气的来源。剥下来的皮放在暖气边，整个房间都会变得暖洋洋。

![一桌一季](/demo/inline-table.svg)

## 顺着季节生活

跟着时令吃饭，不是一种规矩，而是一种提醒。

提醒你，时间正在流动；提醒你，不是所有东西都要立刻得到；也提醒你，在正确的时候吃一颗番茄，会比在任何时候吃一颗进口番茄更接近幸福。

这个周末，去菜市场看看吧。看看最近什么最便宜、最香、最饱满。

季节会告诉你，今晚该吃什么。',
   '/demo/cover-table.svg',
   '["食物","季节","生活"]',
   'published', 0, 78, 'usr_demo_editor',
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-16 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-16 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-16 days')),

  ('post_demo_reading', 'reading-in-autumn',
   '秋日读书：让文字慢慢经过',
   '有些书适合一口气读完，有些书只适合在某个季节里，每天读几页。这个秋天，我把阅读速度调慢了一档。',
   '入秋之后，天黑得早了。下班回家的路上，风里有一点凉，路灯亮起来的时候，会看见细小的飞虫绕着光打转。

这样的晚上最适合读书。

## 慢读

以前我读书很贪心，总想快点知道结局，于是一页接一页，读到凌晨。第二天醒来，情节都记得，却说不出自己到底读了什么。

现在我试着慢一点。每天只读二十页，遇到喜欢的句子就停下来，抄在本子上。有时候一段话要读三遍，有时候干脆合上书，发一会儿呆。

奇怪的是，读得慢了，记得的反而多了。

> 阅读不是从书里拿走什么，而是让文字经过你，留下它愿意留下的东西。

## 最近在读

- 《山茶文具店》—— 代笔人的故事，温柔得像一杯热茶
- 《瓦尔登湖》—— 重读，这次读出了更多关于“少”的自由
- 《夜晚的潜水艇》—— 想象力像水一样漫过现实

## 一本书的余温

我喜欢在书上留下痕迹：折角、铅笔画线、页边空白处歪歪扭扭的字。多年以后再翻开，那些痕迹会告诉我，当时的我在想什么。

书不只是被读过的对象。它也是一段时间的容器，装着那个季节的光线、温度和心情。

这个秋天，希望你能遇到一本，让你愿意慢下来的书。',
   '/demo/cover-reading.svg',
   '["阅读","秋天","书单"]',
   'published', 0, 64, 'usr_demo_editor',
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-21 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-21 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ','now','-21 days'));

INSERT OR IGNORE INTO comments (id, post_id, user_id, parent_id, content, status, created_at) VALUES
  ('cmt_demo_1', 'post_demo_morning', 'usr_demo_reader_lin', NULL,
   '读到“空白是种子发芽需要的黑暗”时，正好坐在窗边。今天决定不急着出门，给自己留一个完整的早晨。',
   'approved', strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 days')),
  ('cmt_demo_2', 'post_demo_morning', 'usr_demo_editor', 'cmt_demo_1',
   '很高兴这句话被你接住了。愿你的早晨有咖啡香，也有一点点无所事事。',
   'approved', strftime('%Y-%m-%dT%H:%M:%fZ','now','-20 hours')),
  ('cmt_demo_3', 'post_demo_room', 'usr_demo_reader_man', NULL,
   '上周也刚从花市抱回一盆尤加利，现在每天回家第一件事就是去看它有没有长新叶。',
   'approved', strftime('%Y-%m-%dT%H:%M:%fZ','now','-3 days')),
  ('cmt_demo_4', 'post_demo_noticing', 'usr_demo_reader_lin', NULL,
   '试着做了这个练习，发现每天路过的面包店门口，原来有一块小黑板写着当天的面包。',
   'approved', strftime('%Y-%m-%dT%H:%M:%fZ','now','-6 days'));

INSERT OR IGNORE INTO post_views (post_id, view_date, views) VALUES
  ('post_demo_morning', date('now','-6 days'), 18),
  ('post_demo_morning', date('now','-5 days'), 26),
  ('post_demo_morning', date('now','-4 days'), 31),
  ('post_demo_morning', date('now','-3 days'), 22),
  ('post_demo_morning', date('now','-2 days'), 37),
  ('post_demo_morning', date('now','-1 days'), 44),
  ('post_demo_morning', date('now'), 29),
  ('post_demo_room', date('now','-5 days'), 21),
  ('post_demo_room', date('now','-4 days'), 17),
  ('post_demo_room', date('now','-3 days'), 29),
  ('post_demo_room', date('now','-2 days'), 24),
  ('post_demo_room', date('now','-1 days'), 19),
  ('post_demo_room', date('now'), 14),
  ('post_demo_noticing', date('now','-6 days'), 12),
  ('post_demo_noticing', date('now','-5 days'), 18),
  ('post_demo_noticing', date('now','-4 days'), 15),
  ('post_demo_noticing', date('now','-3 days'), 20),
  ('post_demo_noticing', date('now','-2 days'), 11),
  ('post_demo_noticing', date('now','-1 days'), 16),
  ('post_demo_letter', date('now','-4 days'), 9),
  ('post_demo_letter', date('now','-3 days'), 13),
  ('post_demo_letter', date('now','-2 days'), 16),
  ('post_demo_letter', date('now','-1 days'), 11),
  ('post_demo_table', date('now','-3 days'), 8),
  ('post_demo_table', date('now','-2 days'), 12),
  ('post_demo_table', date('now','-1 days'), 14),
  ('post_demo_reading', date('now','-2 days'), 7),
  ('post_demo_reading', date('now','-1 days'), 10),
  ('post_demo_reading', date('now'), 9);
