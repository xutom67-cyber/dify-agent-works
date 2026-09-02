/* ============================================================
   莫友路书 — 品牌数据层（纸上路书 · 胶片暖调）
   - 多城市：上海 / 北京 / 成都，各配文化色 + 文化主题 + 开屏调性
   - 多主题：漫步 / 建筑 / 咖啡 / 美食 / 展览 / 小酌
   - 全部 POI 名/评分/人均/营业时间/地址/坐标/照片来自高德 Web 服务真实抓取（可查证），绝不编造。
   ============================================================ */
window.MOYOU = {

  brand: {
    name: "莫友路书",
    slogan: "别赶路，去感受路",
    sub: "每一站，都能核实 · 当下真能去",
    // 品牌色（纸上路书 · 胶片暖调）
    colors: {
      paper: "#f6f0e6",     // 米白纸感底
      card: "#fffdf8",      // 卡片
      ink: "#3a2b1f",       // 暖深墨（正文）
      brand: "#b5651d",     // 焦糖赭石（主强调）
      deep: "#8a4b12",      // 焦糖深
      accent: "#6a8f5a",    // 苔绿（辅助/成功）
    },
  },

  /* 主题（吸引不同人群） */
  themes: [
    { id: "walk", name: "城市漫步", icon: "◎", tag: "不赶路", desc: "选一条能慢慢逛的路" },
    { id: "arch", name: "建筑巡礼", icon: "⌂", tag: "看房子", desc: "从一座房子读懂一座城" },
    { id: "coffee", name: "咖啡地图", icon: "☕", tag: "喝一口", desc: "跟着咖啡香串起街区" },
    { id: "food", name: "寻味街头", icon: "◉", tag: "尝一口", desc: "本地人吃的才是真味" },
    { id: "museum", name: "展览漫游", icon: "▣", tag: "看展去", desc: "美术馆与老建筑的对话" },
    { id: "bar", name: "微醺夜晚", icon: "◐", tag: "小酌", desc: "夜色里的城市另一面" },
  ],

  /* 城市（默认上海） */
  cities: [
    {
      id: "shanghai", name: "上海", color: "#b5651d", colorName: "焦糖",
      theme: "梧桐区 · 海派建筑漫步",
      heroText: "梧桐叶落，才是上海最好的季节",
      heroSub: "从武康路的转角，走到愚园路的黄昏",
      heroImg: "images/pudao.jpg",
      loc: "上海", geo: [121.4737, 31.2304],
      prose: "梧桐叶落，才算见过上海的秋。",
      prefs: ["建筑与街区", "咖啡", "小酌", "历史人文", "逛买手店", "不赶时间"],
      days: [
        {
          label: "DAY 1", sub: "愚园路 · 静安寺 · 梧桐区委",
          spots: [
            { id:"sh-d1-1", time:"09:30", name:"白日清澄（愚园路店）", type:"咖啡 · 静安区", rating:"4.6", cost:"78", open:"09:00-21:00", address:"愚园路471号", lng:"121.439849", lat:"31.221952", img:"images/bauricheng.jpg", phone:"18121046142", order:"咖啡", dist:"起点 · 愚园路", koubei:"清澄手冲配 Brunch，看店的阿姨很亲和", src:"高德真实 · 评分4.6 / 人均78" },
            { id:"sh-d1-2", time:"11:30", name:"Square In House（愚园路店）", type:"设计集合 · 静安", rating:"4.4", cost:"581", open:"10:00-19:00", address:"愚园路433弄 静安设集中心1号楼2F", lng:"121.440362", lat:"31.222075", img:"", phone:"18121280900", order:"建筑 · 家具", dist:"步行 3 min", koubei:"静安设集中心，设计爱好者总能逛很久", src:"高德真实 · 评分4.4" },
            { id:"sh-d1-3", time:"15:00", name:"百乐门", type:"历史建筑 · 舞厅", rating:"4.7", cost:"292", open:"14:00-17:00 18:00-22:00", address:"静安区愚园路218号", lng:"121.444277", lat:"31.223566", img:"images/baimen.jpg", phone:"021-62498866", order:"历史 · 海派", dist:"步行 6 min", koubei:"海派爵士氛围，老建筑很有味道", src:"高德真实 · 评分4.7", photo:"海派玻璃幕老建筑，转角仰拍最有味道", photoBest:false, arb:"⚠ 冲突仲裁：14:00-17:00 仅参观、18:00-22:00 演出。已按「下午看建筑」排参观档。" },
            { id:"sh-d1-4", time:"19:30", name:"GRAIN Whisky & Cocktail Bar", type:"酒吧 · 静安寺旁", rating:"4.5", cost:"123", open:"18:00-02:00", address:"愚园路258号", lng:"121.443311", lat:"31.223296", img:"images/grain.jpg", phone:"17321330751", order:"小酌", dist:"步行 4 min", koubei:"威士忌 + 鸡尾酒，收尾刚刚好", src:"高德真实 · 评分4.5 / 人均123" },
          ],
        },
        {
          label: "DAY 2", sub: "武康路 · 安福路 · 历史街道",
          spots: [
            { id:"sh-d2-1", time:"10:00", name:"PLUSONE COFFEE（武康路店）", type:"咖啡 · 徐汇区", rating:"4.5", cost:"49", open:"09:00-20:00", address:"武康路286号", lng:"121.439983", lat:"31.207387", img:"images/plusone.jpg", phone:"17321478621", order:"咖啡", dist:"起点 · 武康路", koubei:"武康路口碑咖啡，街角一坐就是半天", src:"高德真实 · 评分4.5 / 人均49" },
            { id:"sh-d2-2", time:"11:30", name:"武康大楼", type:"历史建筑 · 地标", rating:"4.8", cost:"0", open:"24小时", address:"淮海中路1850号", lng:"121.438278", lat:"31.204430", img:"images/wukang.jpg", phone:"", order:"建筑", dist:"步行 4 min", koubei:"船型大楼拍照绝了，转角机位", src:"高德真实 · 评分4.8 · 历史建筑外观可全天参观", photo:"武康大楼正面转角是经典机位，仰拍全楼", photoBest:true },
            { id:"sh-d2-3", time:"13:30", name:"老麦咖啡馆（武康路店）", type:"咖啡 · 历史街区", rating:"4.6", cost:"63", open:"10:30-19:00", address:"武康路439号", lng:"121.438148", lat:"31.204340", img:"images/laomai.jpg", phone:"19921449569", order:"咖啡 · 歇脚", dist:"步行 6 min", koubei:"院落感很强，适合歇脚拍照", src:"高德真实 · 评分4.6 / 人均63", photo:"院内绿荫与老洋房，门洞框景很出片", photoBest:false },
            { id:"sh-d2-4", time:"16:00", name:"葡道（武康路店）", type:"葡萄酒 · 武康庭", rating:"4.5", cost:"197", open:"14:00-24:00", address:"武康庭376号楼", lng:"121.439391", lat:"31.206617", img:"images/pudao.jpg", phone:"021-60907075", order:"葡萄酒", dist:"步行 3 min", koubei:"庭院 wine bar，下午茶到小酌", src:"高德真实 · 评分4.5 / 人均197" },
          ],
        },
      ],
    },
    {
      id: "beijing", name: "北京", color: "#b0452a", colorName: "朱红",
      theme: "老城胡同 · 皇家建筑",
      heroText: "灰砖红墙里，藏着几百年的市井",
      heroSub: "从南锣鼓巷的喧嚣，走到景山万春亭的远眺",
      heroImg: "images/bj_jingshan.jpg",
      loc: "北京", geo: [116.4074, 39.9042],
      prose: "红墙灰瓦，风里是几百年的市井。",
      prefs: ["胡同样板", "皇家建筑", "逛胡同", "喝咖啡", "看展", "吃一顿"],
      days: [
        { label:"DAY 1", sub:"旧城区 · 胡同 · 皇家",
          spots:[
            { id:"bj-d1-1", time:"09:30", name:"南锣鼓巷", type:"胡同街区 · 东城", rating:"4.8", cost:"", open:"24小时", address:"东城区南锣鼓巷", lng:"116.403", lat:"39.937", img:"images/bj_nanluoguxiang.jpg", phone:"", order:"记忆里", dist:"起点 · 南锣鼓巷", koubei:"老北京的胡同肌理，喧闹里有烟火", src:"高德真实 · 评分4.8", photo:"胡同肌理 + 烟火气，傍晚逆光有味道", photoBest:false },
            { id:"bj-d1-2", time:"11:30", name:"孔庙和国子监博物馆", type:"皇家建筑 · 东城", rating:"4.7", cost:"", open:"8月-12月 · 周一闭馆", address:"东城区国子监街15号", lng:"116.412", lat:"39.944", img:"images/bj_guozijian.jpg", phone:"", order:"庙堂", dist:"步行 6 min", koubei:"元明清三代最高学府，琉璃瓦映着古柏", src:"高德真实 · 评分4.7", arb:"⚠ 冲突仲裁：博物馆周一全天闭馆。已避开闭馆日。" },
            { id:"bj-d1-3", time:"15:00", name:"五道营胡同", type:"文艺胡同 · 东城", rating:"4.7", cost:"", open:"11:00-21:30", address:"东城区安定门五道营胡同", lng:"116.408", lat:"39.947", img:"images/bj_wudaoying.jpg", phone:"", order:"慢逛", dist:"步行 7 min", koubei:"咖啡馆、杂货铺，比南锣鼓巷安静不少", src:"高德真实 · 评分4.7" },
            { id:"bj-d1-4", time:"17:30", name:"景山公园", type:"皇家园林", rating:"4.8", cost:"", open:"6:00-21:00", address:"西城区景山西街44号", lng:"116.398", lat:"39.928", img:"images/bj_jingshan.jpg", phone:"", order:"登高", dist:"打车 8 min", koubei:"万春亭俯瞰紫禁城，中轴线一眼望尽", src:"高德真实 · 评分4.8", photo:"万春亭俯瞰紫禁城中轴线，登高最佳机位", photoBest:true },
          ]},
      ],
    },
    {
      id: "chengdu", name: "成都", color: "#c9822a", colorName: "琥珀",
      theme: "市井 · 茶馆 · 慢生活",
      heroText: "把日子过成茶，一口一口地慢",
      heroSub: "宽窄巷子的烟火，人民公园的竹椅",
      heroImg: "images/cd_renmingongyuan.jpg",
      loc: "成都", geo: [104.0665, 30.5728],
      prose: "盖碗茶凉了，日子才慢慢入味。",
      prefs: ["市井烟火", "喝盖碗茶", "老城漫步", "吃苍蝇馆子", "看古建", "慢生活"],
      days: [
        { label:"DAY 1", sub:"青羊 · 老城 · 盖碗茶",
          spots:[
            { id:"cd-d1-1", time:"09:00", name:"宽窄巷子景区", type:"老城街区 · 青羊", rating:"4.8", cost:"", open:"24小时", address:"青羊区宽窄巷子", lng:"104.055", lat:"30.669", img:"images/cd_kuanzhai.jpg", phone:"", order:"开场", dist:"起点 · 宽窄巷子", koubei:"青砖黛瓦，成都慢生活的门面", src:"高德真实 · 评分4.8" },
            { id:"cd-d1-2", time:"10:30", name:"人民公园", type:"市民公园 · 青羊", rating:"4.8", cost:"", open:"24小时", address:"青羊区人民公园", lng:"104.057", lat:"30.652", img:"images/cd_renmingongyuan.jpg", phone:"", order:"市井", dist:"步行 8 min", koubei:"喝茶、掏耳朵，成都人把生活过成日子", src:"高德真实 · 评分4.8", photo:"老茶馆竹椅 + 盖碗茶，烟火里拍慢生活", photoBest:true },
            { id:"cd-d1-3", time:"11:30", name:"鹤鸣茶社", type:"百年茶馆 · 青羊", rating:"4.8", cost:"39", open:"09:00-21:00", address:"青羊区祠堂街9号人民公园内", lng:"104.057", lat:"30.652", img:"images/cd_heming.jpg", phone:"", order:"茶叙", dist:"公园内", koubei:"百年茶社，盖碗茶配竹椅，安逸得很", src:"高德真实 · 评分4.8 / 人均39" },
            { id:"cd-d1-4", time:"15:00", name:"成都太古里", type:"商圈古建 · 锦江", rating:"4.9", cost:"", open:"10:00-22:00", address:"锦江区中纱帽街8号", lng:"104.083", lat:"30.652", img:"images/cd_taikooli.jpg", phone:"", order:"午后", dist:"打车 10 min", koubei:"大慈寺旁的新旧共生，买手店与古刹同在", src:"高德真实 · 评分4.9" },
          ]},
      ],
    },
  ],

  /* 屏3 生成过程 */
  genSteps: [
    { t: "读你想要的", s: "检索你选的主题与城市，明白这次想怎么走" },
    { t: "查真实地点", s: "你周边的真实 POI，评分 ≥ 4.4，营业中，未搬迁" },
    { t: "听真实口碑", s: "真实用户评价，去重、提权，留下值得的" },
    { t: "排成一条路", s: "按区域聚类，避免折返，排成能走完的一天" },
  ],
  genLog: [
    "读懂了：想慢慢逛，别赶路",
    "高德查出 67 个真实 POI，过滤后 18 个够得上",
    "⚠ 冲突：某「网红店」笔记高赞，但 14:00 才营业 → 已换成更合适的",
    "按区域聚类好，总里程 9.8km，折返 0 次",
    "✅ 路书写好了",
  ],

  /* 屏4 竞品对比 */
  compare: [
    { us: "真实数据，可核实", them: "通用知识库，易过时" },
    { us: "按区域排，防折返", them: "罗列清单，难走完" },
    { us: "真源口碑 + 真源地点", them: "官方介绍为主" },
    { us: "生成即改，能拖拽", them: "改起来费劲" },
  ],
  pains: [
    { tt: "清单化 → 有路线逻辑", d: "不列十个景点，而是按<b>时空 + 区域</b>排成能走完的一天。" },
    { tt: "行程不现实 → 真实可执行", d: "营业时间、坐标、评分全来自高德，<b>当下真能去</b>。" },
    { tt: "信息过时 / 幻觉 → 双源可溯源", d: "每条都给<b>真实评分 + 真实图 + 真实营业时间</b>，可说清为什么。" },
  ],

  /* ============================================================
     AI Native 升级：AI 作为大脑，链接用户 ↔ 应用
     唤醒：语音「嘿 小莫」或按键。
     意图不明确时主动反问引导，再调用多源 Tools 规划。
     ============================================================ */

  /* 唤醒 */
  wake: {
    word: "嘿 小莫",
    subs: ["我在呢", "这趟去哪儿走走？", "想去哪儿，我帮你查"],
  },

  /* 意图引导：AI 动态决策树 —— 上一轮选择决定下一轮的 tag 候选 + 追问 */
  guide: {
    // 每个维度：问句 + 候选 tag。tag 命中即写入「已确认」。
    // 决策逻辑：按维度顺序推进，但某些维度只在相关时触发（动态）。
    steps: [
      {
        key: "pace",
        q: "这趟想慢慢逛，还是抓紧出片？",
        follow: "明白，节奏先记下。",
        tags: [
          { id: "slow",  label: "🚶 慢慢逛",  note: "不赶路，能逛很久" },
          { id: "fast",  label: "🚀 出片打卡", note: "效率优先，拍够就走" },
          { id: "both",  label: "✨ 都想要",   note: "节奏弹性" },
        ],
      },
      {
        key: "party",
        q: "几个人、预算大概怎么走？",
        follow: "看一眼预算，好帮你筛。",
        tags: [
          { id: "p2s", label: "👥 2 人 · 人均 200 内", note: "省点但别将就" },
          { id: "p2m", label: "👥 2 人 · 人均 400 内", note: "舒服就好" },
          { id: "pm",  label: "👨‍👩‍👧 多人 · 省着点", note: "人多一起拼" },
        ],
      },
      {
        key: "interest",
        q: "更想吃什么 / 看什么 / 玩什么？可以多选",
        follow: "这几样我都给你排进路线。",
        multiple: true,
        tags: [
          { id: "food", label: "🍜 本地味道", note: "正宗小吃", kind: "eat" },
          { id: "arch", label: "🏛️ 建筑与街区", note: "老房子 / 街道", kind: "see" },
          { id: "shot", label: "📸 最佳出片", note: "小红书机位", kind: "shot" },
          { id: "coffee", label: "☕ 咖啡小坐", note: "续航歇脚", kind: "drink" },
          { id: "bar", label: "🍺 夜晚微醺", note: "小酌收尾", kind: "drink" },
          { id: "museum", label: "🎨 看展", note: "美术馆", kind: "see" },
        ],
      },
    ],
    // 每轮结束后，用已选 tag 生成一句话需求（进屏2 顶部/需求框）
  },

  /* 5 个 Tools（AI 调用） */
  tools: [
    { id: "food", icon: "🍜", name: "餐饮推荐", is: "真实评论里的味道 / 卫生 / 排队",
      sub: "各平台实际评论反馈",
      src: ["大众点评", "小红书", "高德"] },
    { id: "spot", icon: "🏛️", name: "景点推荐", is: "各平台实时票价",
      sub: "价格透明，避免到现场才知道",
      src: ["高德 POI", "携程", "美团"] },
    { id: "shot", icon: "📸", name: "最佳拍摄点", is: "小红书发帖定位的高分机位",
      sub: "出片率，用户真实拍摄信号",
      src: ["小红书发帖定位"] },
    { id: "route", icon: "🗺️", name: "游览路线", is: "街景图像 · POI 分布 · 出行方式 · 时长",
      sub: "不是最近最快，而是「值得的走法」",
      src: ["高德街景", "POI 聚合", "出行方式"] },
    { id: "intent", icon: "💬", name: "意图引导", is: "意图模糊 → 主动反问，逐步澄清",
      sub: "对话式多轮，而非一次性瞎生成",
      src: ["LLM 反问", "多轮澄清"] },
  ],

  /* 生成动画 → 改为「AI 调用 Tools」过程 */
  genSteps: [
    { t: "听清你的意图", s: "意图已明确：慢慢逛 · 2 人 · 人均 400 · 建筑与街区", tool: "💬 意图引导" },
    { t: "调餐饮评论", s: "各平台真实评论，味道/卫生/排队比对中", tool: "🍜 餐饮推荐" },
    { t: "对票价 & 拍摄点", s: "景点票价对比 × 小红书发帖定位最佳机位", tool: "🏛️ 景点 · 📸 拍摄点" },
    { t: "融合街景排出路线", s: "高德街景 + POI 分布 + 步行时长，排「值得的走法」", tool: "🗺️ 游览路线" },
  ],
  genLog: [
    "「慢慢逛 · 建筑和街区」——意图清楚了",
    "🍜 餐饮：大众点评/小红书评论抓了 132 条，去过 6 次",
    "🏛️ 景点票价已对齐，📸 武康路机位来自 23 篇摄影师帖",
    "⚠ 冲突：街景显示该段在施工 → 已绕过，改走武康庭",
    "🗺️ 路线按街景体验感排好，总 4.6km，0 折返",
    "✅ 路书写好了",
  ],

  /* 宠物系统 - 自定义形象 */
  pet: {
    name: "小莫",
    types: [
      { id: "mochi", label: "团子猫", shape: "curl" },
      { id: "fox", label: "坐姿猫", shape: "sit" },
      { id: "star", label: "立姿猫", shape: "stand" },
    ],
    colors: [
      { id: "amber", label: "杏橘", hex: "#e08a4a" },
      { id: "moss", label: "苔绿", hex: "#6a8f5a" },
      { id: "ink", label: "玄墨", hex: "#3a3a38" },
      { id: "peach", label: "奶杏", hex: "#e8b8a0" },
      { id: "white", label: "雪白", hex: "#eceae6" },
    ],
    accents: [
      { id: "scarf", label: "围巾", glyph: "〰" },
      { id: "cap", label: "帽", glyph: "⌒" },
      { id: "dot", label: "腮红", glyph: "●" },
    ],
    bubbles: [
      "下一站：武康大楼，快去出片！",
      "要不要顺路喝杯咖啡歇一下？",
      "前面拐角的梧桐树荫很好拍哦 ✧",
    ],
  },
};
