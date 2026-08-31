/* ============================================================
   莫友路书 — app.js
   多城市（上海/北京/成都）· 多主题 · 品牌视觉
   城市/主题选择 → 生成 → 路线地图/行程列表 + 拖拽 + 双源
   ============================================================ */
const M = window.MOYOU;
let currentCity = 0;   // 城市索引
let currentTheme = 0;  // 主题索引

function getCity() { return M.cities[currentCity]; }

/* ---------- 多屏切换 ---------- */
function go(id, delay = 0) {
  setTimeout(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'screen4') renderTrip();
  }, delay);
}

/* ---------- 屏1：城市选择 + 主题选择 + 开屏联动 ---------- */
function buildCitySelector() {
  const row = document.getElementById('cityRow');
  row.innerHTML = '';
  M.cities.forEach((c, i) => {
    const chip = document.createElement('button');
    chip.className = 'city-chip' + (i === currentCity ? ' on' : '');
    chip.innerHTML = `<span class="cn">${c.name}</span><span class="cw">${c.colorName} · ${c.theme.split('·')[0].trim()}</span><div class="c-dot" style="background:${i === currentCity ? c.color : '#d8cdbd'}"></div>`;
    chip.onclick = () => {
      currentCity = i;
      // 更新城市选中态
      document.querySelectorAll('.city-chip').forEach((x, xi) => {
        x.classList.toggle('on', xi === i);
        const dot = x.querySelector('.c-dot');
        if (dot) dot.style.background = xi === i ? c.color : '#d8cdbd';
        const cw = x.querySelector('.cw');
        if (cw) cw.style.color = xi === i ? c.color : '';
      });
      applyCityTheme();
      buildPrefs();
    };
    row.appendChild(chip);
  });
}

function buildThemeSelector() {
  const row = document.getElementById('themeRow');
  row.innerHTML = '';
  M.themes.forEach((t, i) => {
    const chip = document.createElement('button');
    chip.className = 'theme-chip' + (i === currentTheme ? ' on' : '');
    chip.innerHTML = `<span class="ic">${t.icon}</span>${t.name}`;
    chip.onclick = () => {
      currentTheme = i;
      document.querySelectorAll('.theme-chip').forEach((x, xi) => x.classList.toggle('on', xi === i));
    };
    row.appendChild(chip);
  });
}

/* 城市×主题 → 开屏文案联动 */
function applyCityTheme() {
  const c = getCity();
  document.getElementById('heroTitle').textContent = c.heroText;
  document.getElementById('heroSub').textContent = c.heroSub;
  document.getElementById('heroTag').textContent = `${c.name} · ${c.colorName}`;
  document.getElementById('s2City').textContent = c.name;
  document.getElementById('s4City').textContent = c.name;
  const img = document.getElementById('heroImg');
  img.src = c.heroImg;
  // 主题名显示在 s4 标题
  const t = M.themes[currentTheme];
  document.getElementById('s4Title').textContent = `${c.name} · ${t.name}`;
  document.getElementById('s4Sub').textContent = t.tag + ' · ' + c.theme;
  // 重设 render 缓存
  resetRendered();
}

/* ---------- 屏1 头图（单图，随城市切换） ---------- */
function heroImg() {
  const img = document.getElementById('heroImg');
  if (img) { img.style.opacity = 0; setTimeout(() => { img.src = getCity().heroImg; img.style.opacity = 1; }, 60); }
}

/* ---------- 屏2 偏好选择 ---------- */
function buildPrefs() {
  const box = document.getElementById('reqBox');
  box.textContent = '';
  const prefVibe = document.getElementById('prefVibe');
  const chipsEl = document.getElementById('chips');
  prefVibe.innerHTML = '';
  chipsEl.innerHTML = '';
  // 每个城市有自己的偏好词
  getCity().prefs.forEach(tag => {
    const el = document.createElement('button');
    el.className = 'ptag';
    el.dataset.val = tag;
    el.textContent = tag;
    el.onclick = () => {
      el.classList.toggle('on');
      const tags = [...el.parentNode.querySelectorAll('.on')].map(x => x.dataset.val);
      if (tags.length) box.textContent = appendReq(box.textContent, tags);
    };
    prefVibe.appendChild(el);
  });
  // 示例 chips（随城市）
  const cityName = getCity().name;
  const EXAMPLES = [
    { t: `${cityName} · 慢慢逛`, v: `${cityName}周末，2 人，喜欢建筑和咖啡，预算人均400，想慢慢逛` },
    { t: `${cityName} · 本地味`, v: `${cityName} 2天，逛当地街区，吃本地人吃的，不赶行程` },
    { t: `${cityName} · 深度一点`, v: `${cityName}周末，想走一条能讲出故事的路，慢慢来` },
  ];
  EXAMPLES.forEach(ex => {
    const c = document.createElement('button');
    c.className = 'chip';
    c.textContent = ex.t;
    c.onclick = () => {
      document.querySelectorAll('.chip').forEach(x => x.classList.remove('used'));
      c.classList.add('used');
      document.getElementById('reqBox').textContent = ex.v;
    };
    chipsEl.appendChild(c);
  });
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
    d.innerHTML = `<div class="state">${i + 1}</div><div><div class="st-t">${st.t}</div><div class="st-s">${st.s}</div></div>`;
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
  const dayColors = ['#b5651d', '#6a8f5a'];
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
   手绘 SVG 路书图（替代高德 JS 地图 —— 稳定、文艺、永不空白）
   把每个城市的真实经纬度投影到米白纸底，画品牌色手绘路线 + 墨色序号点 + 衬线地名。
   ============================================================ */
function renderRouteSVG(containerId, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const days = getCity().days;
  // 收集所有点（带 day 索引）
  const all = [];
  days.forEach((day, di) => day.spots.forEach((sp, i) => {
    if (sp.lng && sp.lat) all.push({ sp, di, i });
  }));
  if (!all.length) { el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink-faint);font-size:12px">暂无路线数据</div>'; return; }

  // 归一化到 viewBox 0 0 W H，留出 padding
  const W = opts.w || 360, H = opts.h || 250;
  const pad = opts.pad || 34;
  const lngs = all.map(a => +a.sp.lng), lats = all.map(a => +a.sp.lat);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const spanLng = (maxLng - minLng) || 0.001, spanLat = (maxLat - minLat) || 0.001;
  const x = lng => pad + (lng - minLng) / spanLng * (W - pad * 2);
  const y = lat => pad + (maxLat - lat) / spanLat * (H - pad * 2);

  const dayColors = ['#b5651d', '#6a8f5a'];

  // 生成手绘感路线 path（用二次贝塞尔连接相邻点，带小幅抖动）
  function pathFor(pts) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i];
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      // 轻微垂直偏移制造「手绘」感
      const bump = ((i * 7) % 5) - 2;
      d += ` Q ${mx} ${my + bump} ${q.x} ${q.y}`;
    }
    return d;
  }

  // 每一点投影
  const proj = all.map(a => ({ ...a, px: x(+a.sp.lng), py: y(+a.sp.lat) }));
  const byDay = {};
  proj.forEach(a => { (byDay[a.di] = byDay[a.di] || []).push(a); });

  let spotsSvg = '';
  // 先画所有天的路线
  let linesSvg = '';
  Object.keys(byDay).forEach(di => {
    const pts = byDay[di];
    if (pts.length > 1) linesSvg += `<path d="${pathFor(pts)}" fill="none" stroke="${dayColors[di]}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 0" opacity=".55"/>`;
  });

  // 再画每一点（序号圆 + 衬线地名）
  proj.forEach(a => {
    const c = dayColors[a.di];
    const start = a.i === 0;
    spotsSvg += `
      <g class="mspot" data-id="${a.sp.id}" transform="translate(${a.px},${a.py})" style="cursor:pointer">
        <circle r="${start ? 15 : 13}" fill="${c}" stroke="#fff" stroke-width="2.5" style="filter:drop-shadow(0 2px 3px rgba(90,60,20,.28))"/>
        <text y="4.5" text-anchor="middle" fill="#fff" font-size="${start ? 13 : 12}" font-weight="700">${a.i + 1}</text>
        <text y="-20" text-anchor="middle" fill="#2b1d12" font-size="10.5" font-weight="600" style="font-family:var(--serif);letter-spacing:.02em">${a.sp.name}</text>
      </g>`;
  });

  // 纸底 + 环境点（文艺噪点）
  const paperDots = Array.from({ length: 24 }, (_, i) => {
    const rx = (i * 37 + 11) % W, ry = (i * 53 + 7) % H;
    return `<circle cx="${rx}" cy="${ry}" r="1.1" fill="#c9b489" opacity=".16"/>`;
  }).join('');

  el.innerHTML = `
  <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <defs>
      <filter id="grain_${containerId.replace(/\W/g,'')}" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/>
        <feColorMatrix in="n" type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="table" tableValues="0 0.04"/></feComponentTransfer>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="#f7f0e2"/>
    ${paperDots}
    <rect width="${W}" height="${H}" filter="url(#grain_${containerId.replace(/\W/g,'')})" opacity=".5"/>
    <rect width="${W}" height="${H}" fill="none" stroke="#e2d4bc" stroke-width="1" rx="14"/>
    ${linesSvg}
    ${spotsSvg}
  </svg>`;

  // 点击序号 → 打开对应卡片（滚动到列表并展开）
  el.querySelectorAll('.mspot').forEach(g => {
    g.addEventListener('click', () => {
      const id = g.dataset.id;
      const card = document.querySelector(`.spot[data-id="${id}"]`);
      if (card) {
        switchView('list');
        setTimeout(() => { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.classList.add('flash'); setTimeout(() => card.classList.remove('flash'), 1200); }, 150);
      }
    });
  });
}

/* ---------- 列表视图：小 SVG ---------- */
function renderListMap() { renderRouteSVG('amap', { w: 360, h: 210, pad: 32 }); }
/* ---------- 路线视图：大 SVG ---------- */
function renderBigMap() { renderRouteSVG('amap-big', { w: 380, h: 260, pad: 34 }); }

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

/* ---------- init ---------- */
(function init() {
  buildCitySelector();
  buildThemeSelector();
  applyCityTheme();
  buildPrefs();
  renderPains();
  heroImg();
  const box = document.getElementById('reqBox');
  box.addEventListener('input', () => { box.dataset.built = '1'; });
})();
