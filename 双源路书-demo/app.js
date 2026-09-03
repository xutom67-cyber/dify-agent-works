/* ============================================================
   莫友路书 — app.js
   多城市（上海/北京/成都）· 多主题 · 品牌视觉
   城市/主题选择 → 生成 → 路线地图/行程列表 + 拖拽 + 双源
   ============================================================ */
const M = window.MOYOU;
let currentCity = 0;   // 城市索引
let currentTheme = 0;  // 主题索引

function getCity() { return M.cities[currentCity]; }

/* ---------- 真实地图投影（Web Mercator，WGS84 → 像素/瓦片） ---------- */
const MAP_ZOOM = 15;               // 街道级
const MAP_TILE = 256;              // 瓦片边长 px
let currentBase = 'sat';           // 底图层：sat=卫星 / street=街道
function projXY(lng, lat, z = MAP_ZOOM) {
  const n = Math.pow(2, z);
  const px = (lng + 180) / 360 * n * MAP_TILE;
  const latRad = lat * Math.PI / 180;
  const py = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n * MAP_TILE;
  return { px, py };
}
function tileOf(px, py) { return { tx: Math.floor(px / MAP_TILE), ty: Math.floor(py / MAP_TILE) }; }

/* Esri 卫星图瓦片（真实影像，无需 key，国内可达） */
function esriTileUrl(tx, ty, z = MAP_ZOOM) {
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${ty}/${tx}`;
}
/* 高德街道图瓦片（可选底图） */
function amapTileUrl(tx, ty, z = MAP_ZOOM) {
  return `https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x=${tx}&y=${ty}&z=${z}`;
}

/* 取当前城市所有 POI 投影，返回 worldpx 范围 + 每个点 -->
   供瓦片底图定位与路线绘制 */
function projectCity(z = MAP_ZOOM) {
  const spots = [];
  getCity().days.forEach((day, di) => day.spots.forEach((sp, i) => {
    if (sp.lng && sp.lat) spots.push({ sp, di, i });
  }));
  const proj = spots.map(a => ({ ...a, ...projXY(+a.sp.lng, +a.sp.lat, z) }));
  if (!proj.length) return null;
  const minPx = Math.min(...proj.map(p => p.px)), maxPx = Math.max(...proj.map(p => p.px));
  const minPy = Math.min(...proj.map(p => p.py)), maxPy = Math.max(...proj.map(p => p.py));
  const minTx = Math.floor(minPx / MAP_TILE), maxTx = Math.floor(maxPx / MAP_TILE);
  const minTy = Math.floor(minPy / MAP_TILE), maxTy = Math.floor(maxPy / MAP_TILE);
  return { proj, minPx, maxPx, minPy, maxPy, minTx, maxTx, minTy, maxTy };
}

/* ---------- 多屏切换 ---------- */
function go(id, delay = 0) {
  setTimeout(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'screen4') renderTrip();
  }, delay);
}

/* ---------- 侧边栏：当前所在（城市已定位驱动） ---------- */
function buildCitySelector() {
  const el = document.getElementById('drLocName');
  if (el) el.textContent = getCity().name;
}

function buildThemeSelector() {
  const row = document.getElementById('drThemeRow');
  if (!row) return;
  row.innerHTML = '';
  M.themes.forEach((t, i) => {
    const chip = document.createElement('button');
    chip.className = 'dr-theme' + (i === currentTheme ? ' on' : '');
    chip.innerHTML = `<span class="ic">${t.icon}</span>${t.name}`;
    chip.onclick = () => {
      currentTheme = i;
      document.querySelectorAll('.dr-theme').forEach((x, xi) => x.classList.toggle('on', xi === i));
      applyCityTheme();
    };
    row.appendChild(chip);
  });
}

const PET_LINES = {
  shanghai: "下一站，我陪你去武康路出片。",
  beijing:  "南锣鼓巷的喧闹，我替你走一趟。",
  chengdu:  "公园里的竹椅，等你去坐一下午。",
};

/* 城市×主题 → 主页诗 + 宠物台词 + 城市摄影背景 + 屏2/4 联动 */
function applyCityTheme() {
  const c = getCity();
  const pLine = document.getElementById('poemLine');
  if (pLine) pLine.textContent = c.prose || c.heroText;
  const petLine = document.getElementById('petLine');
  if (petLine) petLine.textContent = PET_LINES[c.id] || c.heroSub;
  const drLoc = document.getElementById('drLocName');
  if (drLoc) drLoc.textContent = c.name;
  document.getElementById('s2City').textContent = c.name;
  document.getElementById('s4City').textContent = c.name;
  const t = M.themes[currentTheme];
  document.getElementById('s4Title').textContent = `${c.name} · ${t.name}`;
  document.getElementById('s4Sub').textContent = t.tag + ' · ' + c.theme;
  renderCityHero();
  resetRendered();
}

/* 开屏城市摄影背景（真实城市摄影，代表文脉 + 文化色叠加） */
function renderCityHero() {
  const holder = document.getElementById('cityHero');
  if (!holder) return;
  const c = getCity();
  holder.style.backgroundImage = `url("${c.heroImg}")`;
  holder.style.setProperty('--city', c.color);
  const cap = document.getElementById('cityHeroCap');
  if (cap) cap.textContent = `${c.name}`;
}

/* 按实时定位自动定城市（演示：读取真实高德坐标；getUserMedia 定位实际由原生负责，
   这里用城市经纬度就近匹配，模拟"打开时定位"效果） */
function detectCityByLocation(lng, lat) {
  if (lng == null || lat == null) return; // 无定位 → 保持默认（上海）
  let best = 0, bd = Infinity;
  M.cities.forEach((c, i) => {
    const [clng, clat] = c.geo;
    const d = (lng - clng) ** 2 + (lat - clat) ** 2;
    if (d < bd) { bd = d; best = i; }
  });
  if (bd < 4) { currentCity = best; applyCityTheme(); }
}

/* ---------- 侧边栏开关 ---------- */
function openDrawer() { document.getElementById('drawer').classList.add('open'); }
function closeDrawer() { document.getElementById('drawer').classList.remove('open'); }

/* 历史路书（侧边栏） */
function buildHistory() {
  const el = document.getElementById('drHist');
  if (!el) return;
  const hist = [
    { city: "上海", title: "梧桐 · 微醺建筑", when: "9 月 1 日" },
    { city: "北京", title: "红墙 · 胡同深处", when: "8 月 24 日" },
    { city: "成都", title: "盖碗 · 慢半天", when: "8 月 12 日" },
  ];
  el.innerHTML = hist.map(h => `
    <button class="dr-hist-item" onclick="openHistory('${h.city}')">
      <span class="dh-dot"></span>
      <span class="dh-t">${h.title}</span>
      <span class="dh-w">${h.when}</span>
    </button>`).join('');
}
function openHistory(city) {
  const idx = M.cities.findIndex(c => c.name === city);
  if (idx >= 0) { currentCity = idx; applyCityTheme(); }
  closeDrawer();
  go('screen4');
}

/* ---------- 主页输入 ---------- */
function homeSend() {
  const box = document.getElementById('homeInput');
  const v = (box.textContent || '').trim();
  if (!v) { wakeAI(); return; }
  box.textContent = '';
  // 用主页输入直接进对话引导
  wakeAI();
  setTimeout(() => {
    const inp = document.getElementById('aiInput');
    if (inp) { inp.value = v; sendAI(); }
  }, 700);
}

/* ---------- 主页宠物（大） ---------- */
function heroImg() { /* 主页改用宠物，不再用城市头图 */ }

/* ---------- 屏2 偏好选择 ---------- */
/* ---------- 屏2：静态偏好已移除（AI 对话驱动需求） ---------- */
function buildPrefs() {
  // 需求改由 AI 动态引导生成（见 wakeAI / aiAskStep）
  // 这里保留空实现，避免切城市时调用出错。
}
function appendReq(base, tags) {
  const b = (base || '').trim().replace(/：$/, '').replace(/[。，,]\\s*$/, '');
  return b ? `${b}（${tags.join('、')}）` : tags.join('、');
}

/* ---------- 屏3 生成 ---------- */
let genTimer = null;
function startGen() {
  go('screen3');
  if (genTimer) { clearInterval(genTimer); genTimer = null; }
  const stepsEl = document.getElementById('steps');
  const logEl = document.getElementById('log');
  const progEl = document.getElementById('prog');
  stepsEl.innerHTML = ''; logEl.innerHTML = ''; progEl.style.width = '0';

  M.genSteps.forEach((st, i) => {
    const d = document.createElement('div');
    d.className = 'step';
    d.innerHTML = `<div class="state">${i + 1}</div><div><div class="st-t">${st.t}${st.tool ? `<span class="st-tool">${st.tool}</span>` : ''}</div><div class="st-s">${st.s}</div></div>`;
    stepsEl.appendChild(d);
  });
  const nodes = stepsEl.children;
  let step = 0;
  const STEP_MS = 850;

  function advance() {
    nodes[step].classList.remove('cur');
    nodes[step].classList.add('done');
    nodes[step].querySelector('.state').textContent = '✓';
    progEl.style.width = ((step + 1) / M.genSteps.length * 100) + '%';
    if (M.genLog[step]) {
      const l = document.createElement('div');
      l.className = 'line' + (M.genLog[step].startsWith('⚠') ? ' warn' : '');
      l.textContent = M.genLog[step];
      logEl.appendChild(l);
      logEl.scrollTop = logEl.scrollHeight;
    }
    step++;
    if (step >= M.genSteps.length) {
      clearInterval(genTimer); genTimer = null;
      setTimeout(() => { go('screen4'); }, 250);
    } else {
      nodes[step].classList.add('cur');
    }
  }

  nodes[0].classList.add('cur');
  genTimer = setInterval(advance, STEP_MS);
}

/* ---------- 屏4 双源切换 ---------- */
let currentFilter = 'all';
function setFilter(btn) {
  document.querySelectorAll('.seg').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.filter;
  // 标注当前源
  document.querySelectorAll('.spot').forEach(sp => {
    if (currentFilter === 'xhs') sp.style.opacity = sp.dataset.showxhs === '1' ? '1' : '.28';
    else if (currentFilter === 'amap') sp.style.opacity = sp.dataset.showamap === '1' ? '1' : '.28';
    else sp.style.opacity = '1';
  });
}

/* ---------- 屏4 三视图切换 ---------- */
let currentView = 'map';
function switchView(v) {
  currentView = v;
  document.getElementById('vtab-map').classList.toggle('active', v === 'map');
  document.getElementById('vtab-list').classList.toggle('active', v === 'list');
  document.getElementById('vtab-social').classList.toggle('active', v === 'social');
  document.getElementById('view-map').classList.toggle('hidden', v !== 'map');
  document.getElementById('view-list').classList.toggle('hidden', v !== 'list');
  document.getElementById('view-social').classList.toggle('hidden', v !== 'social');
  // 切到列表视图时惰性初始化其地图；切到同路人时渲染社区
  if (v === 'list') setTimeout(ensureListMap, 60);
  if (v === 'social') renderSocial();
}

/* ---------- 屏4 渲染路书 ---------- */
function renderTrip() {
  const daysEl = document.getElementById('days');
  if (daysEl.dataset.rendered === '1') return;

  getCity().days.forEach(day => {
    const dayH = document.createElement('div');
    dayH.className = 'day-h';
    dayH.innerHTML = `<div class="num">${day.label.slice(-1)}</div><div class="t">${day.label}</div><div class="note">${day.sub}</div>`;
    daysEl.appendChild(dayH);

    const tl = document.createElement('div');
    tl.className = 'timeline';
    day.spots.forEach((sp, idx) => {
      const hasImg = !!sp.img;
      const phBg = hasImg ? '' : `background:linear-gradient(135deg,${idx % 2 ? '#6a8f5a' : '#b5651d'},${idx % 2 ? '#8aac7c' : '#d18a4e'})`;
      const ell = document.createElement('div');
      ell.className = 'spot';
      ell.dataset.id = sp.id;
      ell.draggable = true;
      ell.dataset.showxhs = sp.koubei ? '1' : '0';
      ell.dataset.showamap = '1';
      ell.innerHTML = `
        <div class="ph" style="${phBg}">
          ${ hasImg ? `<img src="${sp.img}" alt="${sp.name}" onerror="this.parentNode.innerHTML='<div class=&quot;noimg&quot;><span>${sp.name}</span><span style=&quot;font-size:11px;opacity:.85&quot;>暂无照片</span></div>'">`
                    : `<div class="noimg"><span>${sp.name}</span><span style="font-size:11px;opacity:.85">暂无照片</span></div>`}
          <div class="num-badge">${sp.order}</div>
          ${sp.photo ? `<div class="photo-badge${sp.photoBest ? ' best' : ''}" title="最佳摄影">📷</div>` : ''}
          <div class="time-badge">${sp.time}</div>
          <div class="grade">${sp.rating}</div>
        </div>
        <div class="bd-body">
          <div class="name">${sp.name}</div>
          <div class="meta">${sp.type} · ${sp.address}</div>
          <div class="dists">
            <span class="mini amap">${sp.dist}</span>
            <span class="mini mid">营业 ${sp.open}</span>
            ${sp.cost && sp.cost !== '0' ? `<span class="mini mid">人均 ¥${sp.cost}</span>` : ''}
            ${sp.phone ? `<span class="mini xhs">☎ ${sp.phone}</span>` : ''}
          </div>
        </div>
        <button class="expand-btn" onclick="toggleSpot(this)">查看 <b>为什么推荐它</b> ▾</button>
        <div class="bd">
          ${sp.koubei ? `<div class="ev"><div class="e-ic xhs">◎</div><div><div class="e-t xhs">真源口碑</div><div class="e-b">${sp.koubei}<span class="src">${sp.src}</span></div></div></div>` : ''}
          ${sp.photo ? `<div class="ev"><div class="e-ic photo">📷</div><div><div class="e-t photo">最佳摄影<span class="src">${sp.photoBest ? '· 本线最佳机位' : '· 机位提示'}</span></div><div class="e-b">${sp.photo}</div></div></div>` : ''}
          <div class="ev"><div class="e-ic amap">⌖</div><div><div class="e-t amap">真源地点</div><div class="e-b">营业 ${sp.open}${sp.phone ? ' · 电话 ' + sp.phone : ''}<span class="src">来源：高德 POI 真实抓取</span></div></div></div>
          ${sp.arb ? `<div class="arb">${sp.arb}</div>` : ''}
        </div>`;
      tl.appendChild(ell);
    });
    daysEl.appendChild(tl);
  });

  // 动态汇总条：天数 / 均分 / 总里程
  renderSum(getCity());

  daysEl.dataset.rendered = '1';
  // 地图视图（默认）直接渲染大路书图；列表视图惰性渲染小路书图
  setTimeout(renderBigMap, 120);
  renderRouteStrip();

  setTimeout(bindDrag, 300);
}

/* 惰性渲染列表视图路书图（首次切换到列表时调用） */
function ensureListMap() {
  renderListMap();
}

/* 卡片展开（柔化） */
function toggleSpot(btn) {
  const sp = btn.closest('.spot');
  sp.classList.toggle('open');
  btn.innerHTML = sp.classList.contains('open') ? '收起 <b>▲</b>' : '查看 <b>为什么推荐它</b> ▾';
}

/* ---------- 动态汇总条 ---------- */
function renderSum(city) {
  const sum = document.getElementById('sum');
  if (!sum) return;
  const days = city.days;
  const allSpots = days.flatMap(d => d.spots);
  const dayCount = days.length;
  const avg = allSpots.length ? (allSpots.reduce((a, s) => a + (+s.rating || 0), 0) / allSpots.length).toFixed(1) : '—';
  // 估算总里程：逐天内相邻点直线距离累加（近似）
  let km = 0;
  days.forEach(d => {
    const pts = d.spots.filter(s => s.lng && s.lat);
    for (let i = 1; i < pts.length; i++) {
      km += haversine(+pts[i - 1].lat, +pts[i - 1].lng, +pts[i].lat, +pts[i].lng);
    }
  });
  const kmTxt = km ? km.toFixed(1) : '—';
  sum.innerHTML = `
    <div class="m"><b>${dayCount}</b><span>天</span></div>
    <div class="m"><b>${avg}</b><span>平均分</span></div>
    <div class="m"><b>${kmTxt}</b><span>km</span></div>
    <div class="m"><b>${allSpots.length}</b><span>站</span></div>`;
}
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/* ---------- 路线摘要条（地图视图下方） ---------- */
function renderRouteStrip() {
  const strip = document.getElementById('routeStrip');
  if (!strip || strip.dataset.rendered === '1') return;
  const days = getCity().days;
  const all = [];
  days.forEach((day, di) => day.spots.forEach(sp => all.push({ sp, di })));
  // 每天一条路线（d0=焦糖, d1=苔绿）
  const dayColors = ['#c03a2b', '#6a8f5a'];
  const html = days.map((day, di) => {
    const stage = all.filter(x => x.di === di);
    const dots = stage.map((x, i) => `
      <div class="r-node ${i === 0 ? 'start' : ''}" style="${i === 0 ? 'background:' + dayColors[di] : ''}" title="${x.sp.name}">${i + 1}</div>
      ${i < stage.length - 1 ? `<div class="r-line ${di === 0 ? 'hot' : 'hot2'}" style="background:${dayColors[di]}"></div>` : ''}
    `).join('');
    return `<div class="r-card" style="margin-bottom:10px">
      <div class="r-top"><span class="rl"><span class="dot" style="background:${dayColors[di]}"></span>${day.label}</span><span class="rt">${day.sub} · ${stage.length} 站</span></div>
      <div class="r-bar">${dots}</div>
    </div>`;
  }).join('');
  strip.innerHTML = html;
  strip.dataset.rendered = '1';
}

/* ---------- 拖拽重排（Wanderlog 式，同一 day 内排序，跨天禁止） ---------- */
let dragId = null;
function bindDrag() {
  document.querySelectorAll('.spot').forEach(el => {
    el.addEventListener('dragstart', (e) => {
      dragId = el.dataset.id; el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      document.querySelectorAll('.spot-move').forEach(x => x.remove());
      // 落位保存
      saveOrder();
    });
    el.addEventListener('dragover', (e) => { e.preventDefault(); });
    // 用插入占位表达落点
    el.addEventListener('dragenter', (e) => {
      e.preventDefault();
      const src = document.querySelector(`[data-id="${dragId}"]`);
      if (!src || src.parentNode !== el.parentNode) return; // 只允许同一天
      document.querySelectorAll('.spot-move').forEach(x => x.remove());
      const marker = document.createElement('div');
      marker.className = 'spot-move';
      if (beforeEl(el)) { el.parentNode.insertBefore(marker, el); }
      else { marker.onclick = () => {}; el.parentNode.insertBefore(marker, el.nextSibling); }
    });
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      const src = document.querySelector(`[data-id="${dragId}"]`);
      if (!src || src.parentNode !== el.parentNode) { return; }
      const marker = el.parentNode.querySelector('.spot-move');
      // 在 marker 位置插入
      if (marker) el.parentNode.insertBefore(src, marker);
      document.querySelectorAll('.spot-move').forEach(x => x.remove());
      src.style.opacity = currentFilter === 'all' ? '1' : src.dataset.showxhs === '1' || src.dataset.showamap === '1' ? '1' : '.28';
    });
  });
}
function beforeEl(el) {
  // 判断插入点在 el 前还是后（用 marker 置于其上方）
  const prev = el.previousElementSibling;
  return prev && prev.classList && prev.classList.contains('spot-move') ? false : true;
}
function saveOrder() {
  // 每晚更新 DOM 顺序 → 单纯存 localStorage（演示用）
  const order = [];
  document.querySelectorAll('.spot').forEach(el => order.push(el.dataset.id));
  try { localStorage.setItem('moyou_order', JSON.stringify(order)); } catch (e) {}
}

/* ============================================================
   同路人 · 社区互动（社交属性）
   锚定本趟行程的真实 POI（评分/营业时间真实可查证），社区层是
   可用的互动 demo：点赞 / 评论 / 回复。种子内容为「示例社区」，不冒充真实用户评分。
   ============================================================ */
let socialRendered = false;
function renderSocial() {
  const feed = document.getElementById('feed');
  if (!feed || feed.dataset.rendered === '1') return;
  const spots = getCity().days.flatMap(d => d.spots);
  const notes = [
    ['Momo', '周二下午躲开高峰去的，店里放着很慢的音乐，一个人坐了很久。', 12],
    ['阿岚', '和朋友从这儿开始逛，一路都是咖啡馆，走累了随时能坐下。', 8],
    ['K.', '收藏了这条线，周末准备带相机来，能出一整天的图。', 21],
    ['北北', '店员推荐的那杯，口感很干净。下次想试试调酒那家。', 5],
    ['耶加', '我就是看完你这篇才来的，真没踩雷。', 17],
  ];
  feed.innerHTML = spots.map((sp, i) => {
    const note = notes[i % notes.length];
    const avatarHue = (i * 47) % 360;
    return `
    <div class="post">
      <div class="post-hd">
        <div class="avatar" style="background:hsl(${avatarHue},44%,62%)">${note[0][0]}</div>
        <div class="post-user">
          <div class="nm">${note[0]}</div>
          <div class="tm">${1 + i % 2} 小时前 · 同路人</div>
        </div>
        <button class="follow" onclick="this.classList.toggle('on');this.textContent=this.classList.contains('on')?'已关注':'＋关注'">＋关注</button>
      </div>
      <div class="post-txt">${note[1]}</div>
      <div class="post-poi">
        <span class="pp-name">${sp.name}</span>
        <span class="pp-r">${sp.rating}分</span>
        <span class="pp-t">${sp.open}</span>
      </div>
      <div class="post-acts">
        <button class="act like" onclick="liked(this)"><span class="a-ic">♡</span><em>${note[2]}</em></button>
        <button class="act cmt" onclick="cmt(this)"><span class="a-ic">✎</span><em>${(note[2] % 4)}</em></button>
        <button class="act share" onclick="postShare(this)"><span class="a-ic">↗</span><em>分享</em></button>
      </div>
      <div class="cmts">
        <div class="cmt">
          <div class="ava sm" style="background:#e0d6c4">友</div>
          <div class="cmt-b"><span class="cmt-u">友本人</span> 同一条街，想看你走完的反差</div>
        </div>
      </div>
      <div class="cmt-input">
        <input placeholder="说句公道话…" onkeydown="if(event.key==='Enter')addCmt(this)">
        <button onclick="addCmt(this.previousElementSibling)">发送</button>
      </div>
    </div>`;
  }).join('');
  feed.dataset.rendered = '1';
}
function liked(btn) {
  btn.classList.toggle('on');
  const em = btn.querySelector('em');
  let n = +em.textContent;
  em.textContent = btn.classList.contains('on') ? n + 1 : n - 1;
}
function cmt(btn) { btn.closest('.post').querySelector('.cmt-input input').focus(); }
function postShare(btn) { toast('已复制这条分享，可发给同行人'); }
function addCmt(inp) {
  const v = (inp.value || '').trim();
  if (!v) return;
  const box = inp.closest('.post').querySelector('.cmts');
  const d = document.createElement('div');
  d.className = 'cmt';
  d.innerHTML = `<div class="ava sm" style="background:var(--brand)">我</div><div class="cmt-b"><span class="cmt-u">我</span> ${v}</div>`;
  box.appendChild(d);
  inp.value = '';
  toast('已评论');
}

/* ============================================================
   真实底图（Esri 卫星瓦片）+ 规划好的行进路线
   用真实经纬度投影定位 POI，画起点/终点/分段路线/编号徽章。
   ============================================================ */
function renderRouteSVG(containerId, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const data = projectCity(MAP_ZOOM);
  if (!data) { el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink-faint);font-size:12px">暂无路线数据</div>'; return; }
  const { proj, minTx, maxTx, minTy, maxTy } = data;

  const W = opts.w || 380, H = opts.h || 260;

  // 瓦片网格：列 tx∈[minTx..maxTx]，行 ty∈[minTy..maxTy]
  const cols = maxTx - minTx + 1, rows = maxTy - minTy + 1;
  const mapW = cols * 256, mapH = rows * 256;

  // POI 相对瓦片网格左上角的世界像素偏移
  const originPx = minTx * 256, originPy = minTy * 256;
  const pts = proj.map(a => ({ ...a, dx: a.px - originPx, dy: a.py - originPy }));

  // 底图瓦片 divs（当前底图层：sat=Esri 卫星 / street=高德街道）
  let tilesHtml = '';
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const left = (tx - minTx) * 256, top = (ty - minTy) * 256;
      const url = (currentBase === 'street') ? amapTileUrl(tx, ty) : esriTileUrl(tx, ty);
      tilesHtml += `<div class="map-tile" style="left:${left}px;top:${top}px;background-image:url('${url}')"></div>`;
    }
  }

  // 路线：按 day 分色，用真实像素贝塞尔连相邻点；起点绿、终点旗
  const dayColors = ['#c03a2b', '#6a8f5a'];
  const byDay = {};
  pts.forEach(a => { (byDay[a.di] = byDay[a.di] || []).push(a); });
  function pathFor(pts2) {
    if (pts2.length < 2) return '';
    let d = `M ${pts2[0].dx} ${pts2[0].dy}`;
    for (let i = 1; i < pts2.length; i++) {
      const p = pts2[i - 1], q = pts2[i];
      const mx = (p.dx + q.dx) / 2, my = (p.dy + q.dy) / 2;
      const bump = ((i * 7) % 5) - 2;
      d += ` Q ${mx} ${my + bump} ${q.dx} ${q.dy}`;
    }
    return d;
  }
  let linesSvg = '';
  Object.keys(byDay).forEach(di => {
    const pp = byDay[di];
    if (pp.length > 1) linesSvg += `<path d="${pathFor(pp)}" fill="none" stroke="${dayColors[di]}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity=".85" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))"/>`;
  });

  // POI 徽章（带白描边，卫星图上可读）+ 起点/终点特殊标记 + 摄影机位标记
  let spotsSvg = '';
  pts.forEach(a => {
    const c = dayColors[a.di];
    const start = a.i === 0;
    const last = a.i === byDay[a.di].length - 1;
    const isPhoto = !!(a.sp.photo);
    const isBest = !!(a.sp.photoBest);
    let ring = '';
    // 起/终点：绿色起点旗 / 红色终点旗 + 醒目圆环
    if (start) ring = `<circle r="18" fill="none" stroke="#27a35a" stroke-width="2.5" opacity=".9"/><circle r="24" fill="none" stroke="#27a35a" stroke-width="1.2" opacity=".5"/>`;
    if (last) ring = `<circle r="18" fill="none" stroke="#c03a2b" stroke-width="2.5" opacity=".9"/><circle r="24" fill="none" stroke="#c03a2b" stroke-width="1.2" opacity=".5"/>`;
    // 名字放徽章上方（白字 + 深色描边，卫星图上清晰）
    let name = a.sp.name;
    if (name.length > 6) name = name.slice(0, 5) + '…';
    // 摄影机位：在徽章右上角加相机圆标 + 机位提示（最佳摄影点更醒目）
    let photoMark = '';
    if (isPhoto) {
      const markBg = isBest ? '#c03a2b' : '#8a5a33';
      photoMark = `
        <g transform="translate(12,-12)">
          <circle r="8" fill="${markBg}" stroke="#fff" stroke-width="1.8" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))"/>
          <text y="1.2" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">📷</text>
        </g>`;
    }
    spotsSvg += `
      <g class="mspot" data-id="${a.sp.id}" transform="translate(${a.dx},${a.dy})" style="cursor:pointer">
        ${ring}
        <circle r="13" fill="${c}" stroke="#fff" stroke-width="2.5" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,.5))"/>
        <text y="1" text-anchor="middle" fill="#fff" font-size="12" font-weight="700" style="font-family:var(--serif)">${a.i + 1}</text>
        <text y="-20" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" style="font-family:var(--serif);letter-spacing:.03em;paint-order:stroke;stroke:rgba(20,20,18,.65);stroke-width:3">${name}</text>
        ${photoMark}
      </g>`;
  });

  el.innerHTML = `
  <div class="tile-map" style="width:${mapW}px;height:${mapH}px">
    <div class="tile-layer">${tilesHtml}</div>
    <svg viewBox="0 0 ${mapW} ${mapH}" width="${mapW}" height="${mapH}" class="route-overlay" style="position:absolute;inset:0">
      ${linesSvg}
      ${spotsSvg}
    </svg>
  </div>`;

  // 点击序号 → 打开对应卡片（滚动到列表并展开）
  el.querySelectorAll('.mspot').forEach(g => {
    g.addEventListener('click', (e) => {
      // 若刚拖拽过则不触发点击
      if (el._dragged) return;
      e.preventDefault();
      const id = g.dataset.id;
      const card = document.querySelector(`.spot[data-id="${id}"]`);
      if (card) {
        switchView('list');
        setTimeout(() => { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.classList.add('flash'); setTimeout(() => card.classList.remove('flash'), 1200); }, 150);
      }
    });
  });

  // 初始化可缩放可拖拽视图
  initPanZoom(el, W, H, pts, mapW, mapH);
}

/* ============================================================
   地图交互：拖拽平移 + 缩放（中心点模型）
   view = { tx, ty, scale } 应用到 .tile-map 的 translate(tx,ty) scale(s)
   以视口中心为变换原点（CSS transform-origin: center center）
   ============================================================ */
let _mapView = null;

function initPanZoom(el, viewW, viewH, pts, mapW, mapH) {
  // 计算 POI 包围盒与缩放初始值
  const minX = Math.min(...pts.map(p => p.dx)), maxX = Math.max(...pts.map(p => p.dx));
  const minY = Math.min(...pts.map(p => p.dy)), maxY = Math.max(...pts.map(p => p.dy));
  const cxp = (minX + maxX) / 2, cyp = (minY + maxY) / 2;
  const baseScale = Math.min(viewW / (maxX - minX + 90), viewH / (maxY - minY + 110)) * 1.05;
  const minScale = baseScale * 0.85, maxScale = baseScale * 4.6;

  const tm = el.querySelector('.tile-map');
  const overlay = el.querySelector('.route-overlay');
  const v = { tx: viewW / 2 - cxp * baseScale, ty: viewH / 2 - cyp * baseScale, scale: baseScale };
  el._view = v;
  el._baseScale = baseScale;
  el._minScale = minScale; el._maxScale = maxScale;
  el._mapW = mapW; el._mapH = mapH; el._viewW = viewW; el._viewH = viewH;
  el._dragged = false;

  const maxTx = 0, maxTy = 0;               // 地图原点(0,0)缩放后的偏移上限
  // 限定：地图填充视口，不露白（拖不出边界）
  function clampTx(scale) {
    const scaledW = mapW * scale;           // 缩放后地图宽
    if (scaledW <= viewW) return viewW / 2 - scaledW / 2;   // 比视口窄 → 居中
    return Math.min(0, viewW - scaledW) ? Math.min(0, viewW - scaledW) : 0;   // 右缘 <= 视口右缘
  }
  function clampTy(scale) {
    const scaledH = mapH * scale;
    if (scaledH <= viewH) return viewH / 2 - scaledH / 2;
    return viewH - scaledH <= 0 ? Math.min(0, viewH - scaledH) : 0;
  }

  function apply() {
    tm.style.transformOrigin = 'center center';
    tm.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.scale})`;
    // POI 徽章反向缩放：放大时徽章保持相对视口大小（乘积≈1）
    if (overlay) overlay.style.transform = `scale(${1 / v.scale})`;
    overlay.style.transformOrigin = '0 0';
  }
  el._apply = apply;
  apply();

  // —— 拖拽平移（pointer，带边界 clamp）——
  let drag = null;
  el.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.map-toggle') || e.target.closest('.map-zoom')) return;
    drag = { x: e.clientX, y: e.clientY, tx: v.tx, ty: v.ty, moved: false };
    el._dragged = false;
    el.setPointerCapture && el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
    // clamp 到边界
    const rawX = drag.tx + dx, rawY = drag.ty + dy;
    const c1 = clampTx(v.scale), c2 = clampTy(v.scale);
    v.tx = Math.min(0, Math.max(c1, rawX));
    v.ty = Math.min(0, Math.max(c2, rawY));
    // 若地图 <= 视口则锁定居中
    if (mapW * v.scale <= viewW) v.tx = (viewW - mapW * v.scale) / 2;
    if (mapH * v.scale <= viewH) v.ty = (viewH - mapH * v.scale) / 2;
    el._dragged = drag.moved;
    apply();
  });
  const endDrag = (e) => {
    if (drag && drag.moved) el._dragged = true;
    drag = null;
  };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
  el.addEventListener('pointerleave', endDrag);

  // —— 滚轮缩放（桌面，以指针为锚点）——
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.18 : 0.85;
    zoomAt(el, v, e.clientX, e.clientY, factor);
  }, { passive: false });

  // —— 双指捏合缩放（触屏）——
  let pinch = null;
  el.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      pinch = { d: dist(e.touches), cx: (e.touches[0].clientX + e.touches[1].clientX) / 2, cy: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
    }
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (pinch && e.touches.length === 2) {
      e.preventDefault();
      const nd = dist(e.touches);
      const factor = nd / pinch.d;
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      zoomAt(el, v, cx, pinch.cy, factor);
      pinch.d = nd;
    }
  }, { passive: false });
  el.addEventListener('touchend', () => { pinch = null; }, { passive: true });

  // —— 双击放大（以点击点为锚）——
  let lastTap = 0;
  el.addEventListener('dblclick', (e) => {
    if (e.target.closest('.map-toggle') || e.target.closest('.map-zoom')) return;
    zoomAt(el, v, e.clientX, e.clientY, 1.6);
  });

  function dist(t) { const a = t[0], b = t[1]; return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }

  // 暴露给缩放按钮
  el._zoom = (factor) => { const r = el.getBoundingClientRect(); zoomAt(el, v, r.left + r.width / 2, r.top + r.height / 2, factor); };
  el._reset = () => {
    v.scale = baseScale;
    v.tx = viewW / 2 - cxp * baseScale; v.ty = viewH / 2 - cyp * baseScale;
    // clamp 边界
    const c1 = clampTx(v.scale), c2 = clampTy(v.scale);
    v.tx = Math.min(0, Math.max(c1, v.tx)); v.ty = Math.min(0, Math.max(c2, v.ty));
    if (mapW * v.scale <= viewW) v.tx = (viewW - mapW * v.scale) / 2;
    if (mapH * v.scale <= viewH) v.ty = (viewH - mapH * v.scale) / 2;
    el._dragged = false; apply();
  };
}

// 以屏幕上 (cx,cy) 为锚点缩放（带边界 clamp）
function zoomAt(el, v, cx, cy, factor) {
  const newScale = Math.min(el._maxScale, Math.max(el._minScale, v.scale * factor));
  const r = el.getBoundingClientRect();
  const ox = cx - r.left, oy = cy - r.top;
  const wx = (ox - v.tx) / v.scale, wy = (oy - v.ty) / v.scale;
  v.scale = newScale;
  v.tx = ox - wx * newScale;
  v.ty = oy - wy * newScale;
  el._apply();
}

/* ---------- 列表视图：小地图 ---------- */
function renderListMap() { renderRouteSVG('amap', { w: 360, h: 210 }); }
/* ---------- 路线视图：大地图 ---------- */
function renderBigMap() { renderRouteSVG('amap-big', { w: 400, h: 300 }); }

/* ---------- 底图切换（卫星 / 街道） ---------- */
function setBase(base, btn) {
  currentBase = base;
  const box = document.getElementById('baseToggle');
  if (box) box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
  renderBigMap();
}

/* ---------- 地图缩放按钮（＋/－/复位） ---------- */
function mapZoomBtn(dir) {
  const el = document.getElementById('amap-big');
  if (!el || !el._zoom) return;
  if (dir === 0) { el._reset(); return; }
  el._zoom(dir > 0 ? 1.3 : 0.77);
}

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1900);
}

/* ---------- 屏5 ---------- */
function renderPains() {
  const painsEl = document.getElementById('pains');
  M.pains.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = 'item';
    d.innerHTML = `<div class="no">${i + 1}</div><div><div class="tt">${p.tt}</div><div class="dd">${p.d}</div></div>`;
    painsEl.appendChild(d);
  });
  const cmp = document.getElementById('compare');
  const table = document.createElement('div');
  table.innerHTML = `<div class="h"><div class="pu">莫友路书</div><div class="pt">主流同行</div></div>` +
    M.compare.map(c => `<div class="r"><div class="pu">${c.us}</div><div class="pt">${c.them}</div></div>`).join('');
  cmp.appendChild(table);
}

/* ---------- render 缓存重置（切换城市时） ---------- */
function resetRendered() {
  const daysEl = document.getElementById('days');
  if (daysEl) { daysEl.dataset.rendered = ''; daysEl.innerHTML = ''; }
  const rs = document.getElementById('routeStrip');
  if (rs) { rs.dataset.rendered = ''; rs.innerHTML = ''; }
  const feed = document.getElementById('feed');
  if (feed) { feed.dataset.rendered = ''; feed.innerHTML = ''; }
  // 清地图标记
  if (window.__amapMarkers) { window.__amapMarkers.forEach(m => m.setMap && m.setMap(null)); window.__amapMarkers = []; }
  if (window.__bigMarkers) { window.__bigMarkers.forEach(m => m.setMap && m.setMap(null)); window.__bigMarkers = []; }
  if (window.__bigLines) { window.__bigLines.forEach(l => l.setMap && l.setMap(null)); window.__bigLines = []; }
}

/* ============================================================
   AI 大脑 —— 唤醒 · 多轮意图引导 · Tools 调用
   ============================================================ */
/* ============ AI 大脑 —— 动态引导引擎 ============
   AI 根据已选 tag 动态决定下一轮问什么、出哪些候选。
   已选 step 实时拼成「需求句」，逐步收敛才进生成。 */
let aiStepIdx = 0;
let aiSelected = {};       // key -> [tagId,...]（多选兴趣）
let aiTypingTimer = null;

function wakeAI() {
  document.getElementById('aiOverlay').classList.remove('hidden');
  openPetPreview();
  const chat = document.getElementById('aiChat');
  chat.innerHTML = '';
  aiStepIdx = 0;
  aiSelected = {};
  renderReqBar();
  aiSay(`嘿，我是小莫。想去哪走走？`);
  setTimeout(() => aiAskStep(0), 650);
  document.getElementById('aiState').textContent = '正在听你说…';
}

function closeAI() {
  document.getElementById('aiOverlay').classList.add('hidden');
}

/* 让小莫说一句话（typewriter） */
function petBigHtml() {
  const big = document.getElementById('petSvgBig');
  return big ? `<svg viewBox="0 0 120 120" width="100%" height="100%">${big.innerHTML}</svg>` : '';
}

function aiSay(text, done) {
  const chat = document.getElementById('aiChat');
  const b = document.createElement('div');
  b.className = 'msg ai';
  b.innerHTML = `<div class="m-ava">${petBigHtml()}</div><div class="m-body"><div class="bubble"></div></div>`;
  chat.appendChild(b);
  const av = b.querySelector('.m-ava');
  if (av) av.innerHTML = petBigHtml();
  const bubble = b.querySelector('.bubble');
  let i = 0;
  bubble.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  bubble.appendChild(cursor);
  clearInterval(aiTypingTimer);
  aiTypingTimer = setInterval(() => {
    bubble.insertBefore(document.createTextNode(text[i]), cursor);
    i++;
    chat.scrollTop = chat.scrollHeight;
    if (i >= text.length) {
      clearInterval(aiTypingTimer);
      cursor.remove();
      if (done) done();
    }
  }, 22);
}

/* 顶部「已确认」需求句 —— 实时更新 */
function renderReqBar() {
  const bar = document.getElementById('aiReqBar');
  if (!bar) return;
  const parts = [getCity().name];
  M.guide.steps.forEach(step => {
    const sel = aiSelected[step.key];
    if (sel && sel.length) {
      const labels = sel.map(id => (step.tags.find(t => t.id === id) || { label: id }).label)
        .map(l => l.replace(/^[^\u4e00-\u9fa5A-Za-z]+/, ''));
      parts.push(labels.join(' · '));
    }
  });
  bar.textContent = '📋 ' + parts.filter(Boolean).join(' · ');
}

/* AI 提问某一步骤（动态出 tag） */
function aiAskStep(idx) {
  const chat = document.getElementById('aiChat');
  const step = M.guide.steps[idx];
  if (!step) { finishGuide(); return; }
  aiStepIdx = idx;

  const b = document.createElement('div');
  b.className = 'msg ai';
  b.innerHTML = `<div class="m-ava">${petBigHtml()}</div><div class="m-body"><div class="bubble q">${step.q}</div></div>`;
  chat.appendChild(b);
  const av = b.querySelector('.m-ava');
  if (av) av.innerHTML = petBigHtml();
  const body = b.querySelector('.m-body');

  const opts = document.createElement('div');
  opts.className = 'ai-opts' + (step.multiple ? ' multi' : '');
  const chosen = aiSelected[step.key] || [];
  step.tags.forEach(t => {
    const c = document.createElement('button');
    c.className = 'ai-opt' + (chosen.includes(t.id) ? ' on' : '');
    c.textContent = t.label;
    c.dataset.id = t.id;
    c.onclick = () => {
      if (step.multiple) {
        const set = aiSelected[step.key] = (aiSelected[step.key] || []).slice();
        const i = set.indexOf(t.id);
        if (i >= 0) set.splice(i, 1); else set.push(t.id);
        c.classList.toggle('on');
        renderReqBar();
        const doneBtn = chat.querySelector('.ai-step-done');
        if (doneBtn) doneBtn.classList.add('visible');
      } else {
        userBubble(t.label);
        aiSelected[step.key] = [t.id];
        optionsInactive(opts);
        renderReqBar();
        aiSay(step.follow, () => setTimeout(() => aiAskStep(idx + 1), 250));
      }
    };
    opts.appendChild(c);
  });

  if (step.multiple) {
    const done = document.createElement('button');
    done.className = 'ai-step-done';
    done.textContent = '✓ 就这些，下一步';
    done.onclick = () => {
      if (!(aiSelected[step.key] || []).length) { toast('选一个以上更准哦'); return; }
      userBubble((aiSelected[step.key] || []).map(id => (step.tags.find(t => t.id === id) || { label: id }).label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '')).join('、'));
      optionsInactive(opts);
      renderReqBar();
      aiSay(step.follow, () => setTimeout(() => aiAskStep(idx + 1), 250));
    };
    opts.appendChild(done);
  }

  body.appendChild(opts);
  chat.appendChild(b);
  chat.scrollTop = chat.scrollHeight;
}

function userBubble(text) {
  const chat = document.getElementById('aiChat');
  const ub = document.createElement('div');
  ub.className = 'msg user';
  ub.innerHTML = `<div class="bubble">${text}</div>`;
  chat.appendChild(ub);
  chat.scrollTop = chat.scrollHeight;
}
function optionsInactive(opts) { opts.remove(); }

/* 引导完成 → 写需求框 → 跳屏2 */
function finishGuide() {
  buildReqFromAnswered();
  closeAI();
  go('screen2');
}

function sendAI() {
  const inp = document.getElementById('aiInput');
  const v = (inp.value || '').trim();
  if (!v) return;
  inp.value = '';
  userBubble(v);
  aiSay('收到，我记下来了。', () => {
    const step = M.guide.steps[aiStepIdx];
    aiSelected[step.key] = aiSelected[step.key] || [];
    setTimeout(() => aiAskStep(aiStepIdx + 1), 250);
    renderReqBar();
  });
}

/* 把澄清结果写进需求框 */
function buildReqFromAnswered() {
  const card = document.getElementById('reqCard');
  const ident = document.getElementById('ident');
  const clean = (l) => l.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '');
  const labelOf = (key, id) => {
    const step = M.guide.steps.find(s => s.key === key);
    if (!step) return id;
    const t = step.tags.find(x => x.id === id);
    return clean((t ? t.label : id));
  };
  const parts = [getCity().name];
  ['pace', 'party', 'interest'].forEach(key => {
    const sel = aiSelected[key];
    if (sel && sel.length) parts.push(sel.map(id => labelOf(key, id)).join('、'));
  });
  const reqTxt = parts.filter(Boolean).join(' · ');
  if (card) card.textContent = reqTxt;

  // 已识别 chips：把已选 tag 都展示出来
  if (ident) {
    ident.innerHTML = '';
    ['pace', 'party', 'interest'].forEach(key => {
      const step = M.guide.steps.find(s => s.key === key);
      const sel = aiSelected[key];
      if (sel && step) sel.forEach(id => {
        const t = step.tags.find(x => x.id === id);
        if (!t) return;
        const d = document.createElement('span');
        d.className = 'ident-chip';
        d.innerHTML = `<b>${t.note || ''}</b>`;
        d.setAttribute('data-label', clean(t.label));
        ident.appendChild(d);
      });
    });
  }
}

/* ============================================================
   宠物系统 —— 自定义形象（SVG）
   ============================================================ */
let petState = { type: 'mochi', color: 'amber', accent: 'scarf' };

function openPet() {
  document.getElementById('petOverlay').classList.remove('hidden');
  renderPetCfg();
  renderPetSvg();
}
function closePet() {
  document.getElementById('petOverlay').classList.add('hidden');
  syncPetFab();
}
function openPetPreview() { renderPetSvg(); }

function renderPetCfg() {
  const tRow = document.getElementById('petTypeRow');
  const cRow = document.getElementById('petColorRow');
  const aRow = document.getElementById('petAccentRow');
  tRow.innerHTML = ''; cRow.innerHTML = ''; aRow.innerHTML = '';
  M.pet.types.forEach(t => {
    const b = document.createElement('button');
    b.className = 'pc-opt' + (petState.type === t.id ? ' on' : '');
    b.textContent = t.label;
    b.onclick = () => { petState.type = t.id; renderPetCfg(); renderPetSvg(); syncPetFab(); };
    tRow.appendChild(b);
  });
  M.pet.colors.forEach(c => {
    const b = document.createElement('button');
    b.className = 'pc-opt sw' + (petState.color === c.id ? ' on' : '');
    b.style.background = c.hex;
    b.title = c.label;
    b.onclick = () => { petState.color = c.id; renderPetCfg(); renderPetSvg(); syncPetFab(); };
    cRow.appendChild(b);
  });
  M.pet.accents.forEach(a => {
    const b = document.createElement('button');
    b.className = 'pc-opt' + (petState.accent === a.id ? ' on' : '');
    b.textContent = a.glyph + ' ' + a.label;
    b.onclick = () => { petState.accent = a.id; renderPetCfg(); renderPetSvg(); syncPetFab(); };
    aRow.appendChild(b);
  });
}

function petHex() { return (M.pet.colors.find(c => c.id === petState.color) || M.pet.colors[0]).hex; }

function renderPetSvg() {
  const svg = document.getElementById('petSvg');
  if (!svg) return;
  const col = petHex();
  const dk = '#2a2624';
  const accent = M.pet.accents.find(a => a.id === petState.accent);
  const pink = '#f4b8b0';      // 腮红 / 耳内衬
  const light = shade(col, .16); // 肚皮浅色
  let body = '';
  if (petState.type === 'fox') { // 坐姿猫
    body = `
      <ellipse cx="60" cy="108" rx="26" ry="6" fill="rgba(0,0,0,.06)"/>
      <ellipse cx="60" cy="86" rx="30" ry="26" fill="${col}"/>
      <ellipse cx="60" cy="96" rx="20" ry="17" fill="${light}"/>
      <path d="M38 50 L44 24 L56 46 Z" fill="${col}"/>
      <path d="M44 27 L50 42 L42 44 Z" fill="${pink}" opacity=".7"/>
      <path d="M82 50 L76 24 L64 46 Z" fill="${col}"/>
      <path d="M76 27 L70 42 L78 44 Z" fill="${pink}" opacity=".7"/>
      <path d="M60 24 L66 38 L54 38 Z" fill="${dk}" opacity=".10"/>
      <ellipse cx="60" cy="76" rx="24" ry="22" fill="${col}"/>
      <ellipse cx="60" cy="84" rx="17" ry="15" fill="${light}"/>
      <g class="pet-eyes">
        <ellipse cx="50" cy="74" rx="4.6" ry="5.4" fill="${dk}"/>
        <ellipse cx="70" cy="74" rx="4.6" ry="5.4" fill="${dk}"/>
        <circle cx="51.6" cy="71.8" r="1.8" fill="#fff"/>
        <circle cx="71.6" cy="71.8" r="1.8" fill="#fff"/>
      </g>
      <g class="pet-blush">
        <ellipse cx="42" cy="80" rx="5" ry="3.2" fill="${pink}" opacity=".7"/>
        <ellipse cx="78" cy="80" rx="5" ry="3.2" fill="${pink}" opacity=".7"/>
      </g>
      <path d="M57 84 q3 3 6 0" stroke="${dk}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M36 88 q-2 10 8 12" stroke="${col}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="45" cy="104" rx="6" ry="4.6" fill="${col}"/>
      <ellipse cx="75" cy="104" rx="6" ry="4.6" fill="${col}"/>
      <path d="M43 104 l1.6 2.6 l1.6 -2.6 M73 104 l1.6 2.6 l1.6 -2.6" stroke="${dk}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  } else if (petState.type === 'star') { // 立姿猫
    body = `
      <ellipse cx="60" cy="104" rx="24" ry="6" fill="rgba(0,0,0,.06)"/>
      <ellipse cx="60" cy="56" rx="23" ry="21" fill="${col}"/>
      <ellipse cx="60" cy="63" rx="16" ry="14" fill="${light}"/>
      <path d="M42 42 L36 16 L50 36 Z" fill="${col}"/>
      <path d="M39 20 L46 34 L38 36 Z" fill="${pink}" opacity=".7"/>
      <path d="M78 42 L84 16 L70 36 Z" fill="${col}"/>
      <path d="M81 20 L74 34 L82 36 Z" fill="${pink}" opacity=".7"/>
      <g class="pet-eyes">
        <ellipse cx="51" cy="56" rx="4.4" ry="5.2" fill="${dk}"/>
        <ellipse cx="69" cy="56" rx="4.4" ry="5.2" fill="${dk}"/>
        <circle cx="52.5" cy="54" r="1.7" fill="#fff"/>
        <circle cx="70.5" cy="54" r="1.7" fill="#fff"/>
      </g>
      <g class="pet-blush">
        <ellipse cx="42" cy="62" rx="4.8" ry="3" fill="${pink}" opacity=".7"/>
        <ellipse cx="78" cy="62" rx="4.8" ry="3" fill="${pink}" opacity=".7"/>
      </g>
      <path d="M58 65 q2 3 4 0" stroke="${dk}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="60" cy="90" rx="20" ry="15" fill="${col}"/>
      <ellipse cx="60" cy="96" rx="12" ry="9" fill="${light}"/>
      <path d="M50 104 q-2 8 -6 10" stroke="${col}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="47" cy="58" rx="6" ry="4.4" fill="${col}"/>
      <ellipse cx="73" cy="58" rx="6" ry="4.4" fill="${col}"/>`;
  } else { // 团子猫（蜷缩）
    body = `
      <ellipse cx="60" cy="86" rx="30" ry="20" fill="rgba(0,0,0,.05)"/>
      <ellipse cx="60" cy="62" rx="34" ry="30" fill="${col}"/>
      <ellipse cx="60" cy="72" rx="24" ry="20" fill="${light}"/>
      <path d="M38 42 Q36 16 52 36 Z" fill="${col}"/>
      <path d="M82 42 Q84 16 68 36 Z" fill="${col}"/>
      <path d="M41 25 L47 36 L40 38 Z" fill="${pink}" opacity=".7"/>
      <path d="M79 25 L73 36 L80 38 Z" fill="${pink}" opacity=".7"/>
      <g class="pet-eyes">
        <ellipse cx="49" cy="60" rx="4.8" ry="5.6" fill="${dk}"/>
        <ellipse cx="71" cy="60" rx="4.8" ry="5.6" fill="${dk}"/>
        <circle cx="50.8" cy="57.6" r="1.9" fill="#fff"/>
        <circle cx="72.8" cy="57.6" r="1.9" fill="#fff"/>
      </g>
      <g class="pet-blush">
        <ellipse cx="41" cy="66" rx="5.2" ry="3.4" fill="${pink}" opacity=".7"/>
        <ellipse cx="79" cy="66" rx="5.2" ry="3.4" fill="${pink}" opacity=".7"/>
      </g>
      <path d="M57 70 q3 3 6 0" stroke="${dk}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M44 78 q-10 8 -4 -6" stroke="${col}" stroke-width="3.8" fill="none" stroke-linecap="round"/>`;
  }
  let accentSvg = '';
  if (accent && accent.id === 'scarf') accentSvg = `<path d="M46 82 q14 8 28 0 l-3.5 9 q-11 6 -21 0 Z" fill="${accent.hex || '#e08a6d'}"/><path d="M56 90 q-1 6 3 8" stroke="${accent.hex || '#e08a6d'}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  else if (accent && accent.id === 'cap') accentSvg = `<path d="M40 54 a20 15 0 0 1 40 0 Z" fill="${accent.hex || '#e08a6d'}"/><ellipse cx="60" cy="38" rx="3.4" ry="3" fill="${accent.hex || '#e08a6d'}"/>`;
  else if (accent && accent.id === 'dot') accentSvg = `<ellipse cx="38" cy="78" rx="5.5" ry="3.6" fill="#ff9d8a" opacity=".8"/><ellipse cx="82" cy="78" rx="5.5" ry="3.6" fill="#ff9d8a" opacity=".8"/>`;
  svg.innerHTML = `<g>${body}${accentSvg}</g>`;
  // 同步到大主页宠物
  const big = document.getElementById('petSvgBig');
  if (big) big.innerHTML = `<g>${body}${accentSvg}</g>`;
  // 同步到圆形唤醒按钮
  const btn = document.getElementById('petSvgBtn');
  if (btn && !btn.dataset.fixed) btn.innerHTML = `<g>${body}${accentSvg}</g>`;
}
/* 颜色提亮/加深（生成肚皮浅色等） */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * amt); g = Math.round(g + (255 - g) * amt); b = Math.round(b + (255 - b) * amt);
  return `rgb(${r},${g},${b})`;
}
function syncPetFab() {
  const svg = document.getElementById('petSvg');
  const wrap = (html) => `<svg viewBox="0 0 120 120" width="100%" height="100%">${html}</svg>`;
  const fab = document.getElementById('petFace');
  if (fab && svg) fab.innerHTML = wrap(svg.innerHTML);
  const avatar = document.getElementById('aiAvatar');
  if (avatar && svg) avatar.innerHTML = wrap(svg.innerHTML);
  const big = document.getElementById('petSvgBig');
  if (big) { const wrapBig = (html) => `<svg viewBox="0 0 120 120" width="100%" height="100%">${html}</svg>`; big.innerHTML = wrapBig(svg.innerHTML); }
}

/* ============================================================
   硬件唤醒 —— 电源键长按（物理按键），语音「嘿 小莫」
   注：背部轻敲为 iPhone 系统手势，Web 原型无法真实触达手机背面，
   故在唤醒提示里如实质为硬件方式；demo 内用电源键长按模拟。
   ============================================================ */
function bindHardware() {
  const power = document.getElementById('hwPower');
  const hint = document.getElementById('hwHint');
  if (!power) return;
  let holdTimer = null;
  const HOLD = 1000;   // 长按 1 秒

  function start(e) {
    e.preventDefault();
    power.classList.add('lit');
    // 长按进度提示
    if (hint) {
      hint.textContent = '';
      hint.style.display = 'block';
    }
    const startT = Date.now();
    holdTimer = setInterval(() => {
      if (Date.now() - startT >= HOLD) {
        clearInterval(holdTimer);
        end(e);
        wakeAI();
      }
    }, 60);
  }
  function end(e) {
    if (e) e.preventDefault();
    clearInterval(holdTimer);
    holdTimer = null;
    power.classList.remove('lit');
    if (hint) hint.style.display = 'none';
  }
  power.addEventListener('mousedown', start);
  power.addEventListener('touchstart', start, { passive: false });
  power.addEventListener('mouseup', end);
  power.addEventListener('mouseleave', end);
  power.addEventListener('touchend', end);

  // 音量键 → 提示（演示）
  const vol = (id, msg) => { const el = document.getElementById(id); if (el) el.addEventListener('click', () => toast(msg)); };
  vol('hwVolUp', '音量 +（演示）');
  vol('hwVolDown', '音量 −（演示）');
}

/* ---------- init ---------- */
(function init() {
  buildCitySelector();
  buildThemeSelector();
  buildHistory();
  applyCityTheme();
  renderPains();
  heroImg();
  renderPetSvg();
  syncPetFab();
  bindHardware();
  initCubeScene();
  // 打开时按实时定位定城市（演示：这里模拟浏览器 geolocation）
  try {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => detectCityByLocation(pos.coords.longitude, pos.coords.latitude),
        () => {/* 拒绝定位 → 保持默认上海 */},
        { timeout: 3000 }
      );
    }
  } catch (e) {}
})();

/* ============================================================
   屏1 开场：3D 立方体液态粒子 + 城市标签轮换同步
   ============================================================ */
function initCubeScene() {
  // 1) 同步宠物图标到圆形唤醒按钮（用当前宠物 SVG）
  const btn = document.getElementById('petSvgBtn');
  const svg = document.getElementById('petSvg');
  if (btn && svg) {
    btn.innerHTML = `<g>${svg.innerHTML}</g>`;
  }

  // 2) 扫描网格 canvas（透视网格 + 数据流）+ 数据卡轮换 + HUD
  const cap = document.getElementById('cityHeroCap');
  const cards = Array.prototype.slice.call(document.querySelectorAll('.data-card'));
  const cardCities = ['上海','北京','成都','上海','上海','成都'];
  // 初始：第一张在前
  if (cards.length) cards[0].classList.add('on');

  // 轮换数据卡（层叠浮起淡入淡出）
  let cur = 0;
  setInterval(() => {
    const prev = cur; cur = (cur + 1) % cards.length;
    cards[prev].classList.remove('on'); cards[prev].classList.add('off');
    cards[cur].classList.remove('off'); cards[cur].classList.add('on');
    if (cap) cap.textContent = cardCities[cur];
  }, 3600);

  // HUD：实时时间 + 坐标微动
  const hudTime = document.getElementById('hudTime');
  const hudCoord = document.getElementById('hudCoord');
  if (hudTime) {
    const fmt = () => { const d = new Date(); return [d.getHours(),d.getMinutes(),d.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':'); };
    hudTime.textContent = fmt();
    setInterval(() => { if (hudTime) hudTime.textContent = fmt(); }, 1000);
  }
  const coords = ['31.23°N · 121.47°E','39.90°N · 116.40°E','30.57°N · 104.07°E','31.20°N · 121.44°E'];
  let ci = 0;
  setInterval(() => { if (hudCoord) { ci = (ci + 1) % coords.length; hudCoord.textContent = coords[ci]; } }, 3600);

  // 扫描网格 canvas（透视网格 + 流动数据流线）
  drawGrid();

  function drawGrid() {
    const gg = document.getElementById('cubeGrid');
    if (!gg) return;
    const ctx2 = gg.getContext('2d');
    const sc = document.getElementById('cubeScene');
    function size2() { gg.width = sc.clientWidth; gg.height = sc.clientHeight; }
    size2(); window.addEventListener('resize', size2);
    const t0 = Date.now();
    (function frame() {
      const w = gg.width, h = gg.height, t = (Date.now() - t0) / 1000;
      ctx2.clearRect(0, 0, w, h);
      // 透视网格：水平/垂直细线，中间有深度感
      ctx2.strokeStyle = 'rgba(192,58,43,.10)'; ctx2.lineWidth = .6;
      const vps = 24;
      for (let i = 0; i <= vps; i++) {
        const x = (w / vps) * i;
        ctx2.beginPath(); ctx2.moveTo(x, 0); ctx2.lineTo(x, h); ctx2.stroke();
      }
      for (let j = 0; j <= 16; j++) {
        const y = (h / 16) * j;
        ctx2.beginPath(); ctx2.moveTo(0, y); ctx2.lineTo(w, y); ctx2.stroke();
      }
      // 数据流：沿网格向右流动的短线（科技数据感）
      ctx2.strokeStyle = 'rgba(106,143,90,.4)'; ctx2.lineWidth = 1.4;
      for (let k = 0; k < 14; k++) {
        const row = (k % 16) * (h / 16) + 3;
        const speed = 60 + (k % 5) * 30;
        const lead = ((t * speed) + k * 97) % (w + 40) - 20;
        ctx2.beginPath(); ctx2.moveTo(lead, row); ctx2.lineTo(lead + 18, row); ctx2.stroke();
      }
      // 数据点：周期闪烁
      for (let m = 0; m < 10; m++) {
        const px = ((t * 40 + m * 137) % (w * 1.4)) - w * 0.2;
        const py = (m % 16) * (h / 16) + 8;
        const a = .3 + .4 * Math.sin(t * 2 + m);
        ctx2.fillStyle = `rgba(192,58,43,${a})`;
        ctx2.beginPath(); ctx2.arc(px, py, 1.8, 0, Math.PI * 2); ctx2.fill();
      }
      requestAnimationFrame(frame);
    })();
  }

  // 3) 液态粒子 canvas（面板表面流动的液态光点）
  const cv = document.getElementById('cubeParticles');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const scene = document.getElementById('cubeScene');
  function size() { cv.width = scene.clientWidth; cv.height = scene.clientHeight; }
  size();
  window.addEventListener('resize', size);

  const COLORS = [[192,58,43],[106,143,90],[224,138,74],[222,170,120]];
  const parts = [];
  const N = 34;
  for (let i = 0; i < N; i++) {
    parts.push({
      x: Math.random(), y: Math.random(),
      r: 1 + Math.random() * 2.2,
      vx: (Math.random() - .5) * .0006, vy: -.0004 - Math.random() * .0005,
      c: COLORS[i % COLORS.length],
      tw: Math.random() * Math.PI * 2
    });
  }
  function tick() {
    const w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.tw += .02;
      if (p.y < -.05) { p.y = 1.05; p.x = Math.random(); }
      if (p.x < -.05) p.x = 1.05; if (p.x > 1.05) p.x = -.05;
      const px = p.x * w, py = p.y * h;
      const a = .35 + Math.sin(p.tw) * .25;
      const mr = p.r * (w / 400);
      const g = ctx.createRadialGradient(px, py, 0, px, py, mr * 4);
      g.addColorStop(0, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${a})`);
      g.addColorStop(1, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, mr * 4, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  tick();
}
