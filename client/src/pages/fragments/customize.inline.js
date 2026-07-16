
        const TEMPLATE_JSON_URL = '/content/templates.json';
        const PRODUCTS_JSON_URL = '/content/products.json';

        /* ── Color palette ── */
        const colorPalette = {
            pacificBlue: "#B0DDF7", angelBlue: "#A7BFE5", brightBlue: "#50C6F6",
            turquoiseBlue: "#22B1C2", happyBlue: "#2C91BF", royalBlue: "#0055B8",
            blueberry: "#2D2877", navyBlue: "#190850", iceBlue: "#C8E1E6",
            robinsBlue: "#92D6D3", happySky: "#7ACDE7", aquaBlue: "#54C1C4",
            aquaMint: "#4EBBAD", teal: "#1FAAAD", mediumTeal: "#2D8E95",
            darkTeal: "#237C7C", pastelGreen: "#CBE5BE", celeryGreen: "#B0D69A",
            pistachio: "#A5D49E", seafoam: "#ABC5C1", freshGreen: "#ACC636",
            greenGrass: "#8ECB3F", emerald: "#6EA864", forestGreen: "#4B7A47",
            pastelLilac: "#D0CFE7", lilac: "#BFBDE6", lavender: "#C7A2D0",
            plum: "#7B6AB0", violet: "#6D2B76", orchidPurple: "#94307D",
            blueViolet: "#4B2C76", eggplant: "#602058", pastelPink: "#F7D8E7",
            cottonCandy: "#F2B8D1", dustyRose: "#E599AC", sweetPink: "#F49ABB",
            rose: "#F1719B", hotPink: "#EE4791", mameyPink: "#F05778",
            fuschia: "#DC126B", palePeach: "#FDE0DA", peach: "#F7BCA4",
            lightCoral: "#F47B7D", honeysuckle: "#F07761", prettyRed: "#E12D3A",
            wineRed: "#A91E3E", burgundy: "#8E2D30", happyOrange: "#F79854",
            tangerine: "#F47F25", tango: "#F15B24", burntOrange: "#DC8720",
            pumpkin: "#DA5C29", rust: "#BF6227", leather: "#9B5B51",
            chocolate: "#644245", buttercup: "#FFF546", vanilla: "#FFF481",
            honey: "#F5E47D", brightYellow: "#FEF200", sunnyYellow: "#FDEB3F",
            mustardYellow: "#E3C34D", camel: "#D7C15F", sand: "#E1CF85",
            tan: "#D7CDB4", softTaupe: "#B3A99D", taupe: "#8B7D7D",
            darkBrown: "#4B3735", softGray: "#D0D2D4", slateGray: "#9A9C9F",
            charcoal: "#58585A", black: "#231F20"
        };

        const PALETTE_KEYS = Object.keys(colorPalette);
        const DEFAULT_COLOR = colorPalette[PALETTE_KEYS[0]];

        function getColorKey(hex) { const h = String(hex).toLowerCase(); return PALETTE_KEYS.find(k => colorPalette[k].toLowerCase() === h) || null; }
        function formatColorName(key) { if (!key) return ''; return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()); }

        const CATEGORY_CONFIG = {
            tshirt: { label: 'T-Shirt', sides: ['front', 'back'], defaultSide: 'front', stageW: 300, stageH: 340, productShape: 'shirt', showColor: true },
            diary: { label: 'Diary', sides: ['front', 'back'], defaultSide: 'front', stageW: 300, stageH: 360, productShape: 'rectBook', showColor: true },
            bottle: { label: 'Bottle', sides: ['wrap'], defaultSide: 'wrap', stageW: 280, stageH: 360, productShape: 'rectLabel', showColor: true },
            cup: { label: 'Cup', sides: ['wrap'], defaultSide: 'wrap', stageW: 280, stageH: 240, productShape: 'rectLabel', showColor: true },
            default: { label: 'Product', sides: ['wrap'], defaultSide: 'wrap', stageW: 280, stageH: 320, productShape: 'rectLabel', showColor: true },
        };

        const state = {
            product: null, category: 'default', side: 'front',
            shirtColor: DEFAULT_COLOR,
            front: [], back: [], wrap: [], sel: null, nid: 1, saved: true,
            templates: [], templatesToShow: [], _colorInitialized: false,
        };

        const $ = (s, r = document) => r.querySelector(s);
        const $$ = (s, r = document) => [...r.querySelectorAll(s)];
        function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
        function getCfg() { return CATEGORY_CONFIG[state.category] || CATEGORY_CONFIG.default; }
        function layers() { return state[state.side] || []; }
        function stageSize() { const c = getCfg(); return { w: c.stageW, h: c.stageH }; }

        function setStatus(msg, type = 'idle') { const dot = $('#status-dot'), txt = $('#status-msg'); if (txt) txt.textContent = msg; if (dot) dot.className = type === 'success' ? 'active' : type === 'warning' ? 'warning' : ''; }
        let toastTimer;
        function showToast(msg) { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200); }
        function markDirty() { state.saved = false; const d = $('#unsaved-dot'); if (d) d.classList.add('show'); }
        function markSaved() { state.saved = true; const d = $('#unsaved-dot'); if (d) d.classList.remove('show'); }
        function setLayerInfo() { const n = layers().length; $('#layer-info').textContent = n ? n + ' layer' + (n !== 1 ? 's' : '') : ''; }
        function togglePanel(key) { const s = $('#panel-' + key); if (s) s.classList.toggle('open'); }
        function openPanel(key) { const s = $('#panel-' + key); if (s && !s.classList.contains('open')) s.classList.add('open'); }

        function buildSideTabs() {
            const cfg = getCfg(), wrap = $('#side-tabs-wrap'); if (!wrap) return;
            if (cfg.sides.length <= 1) { wrap.innerHTML = ''; return; }
            wrap.innerHTML = '<div class="side-tabs">' + cfg.sides.map(s => '<button class="side-tab' + (state.side === s ? ' active' : '') + '" onclick="switchSide(\'' + s + '\')">' + (s === 'wrap' ? 'Wrap' : s.charAt(0).toUpperCase() + s.slice(1)) + '</button>').join('') + '</div>';
        }
        function switchSide(side) {
            if (!getCfg().sides.includes(side)) return;
            state.side = side; state.sel = null; buildSideTabs();
            const lbl = $('#side-label'); if (lbl) lbl.innerHTML = 'Editing <strong>' + side + '</strong>';
            resetSelBoxes(); renderAll(); setStatus('Switched to ' + side + ' side.');
        }

        function isLightColor(hex) { const c = hex.replace('#', ''); const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16); return (r * 299 + g * 587 + b * 114) / 1000 > 200; }

        const _tip = document.getElementById('cs-tooltip');
        function showTip(text, x, y) { _tip.textContent = text; _tip.style.left = x + 'px'; _tip.style.top = y + 'px'; _tip.classList.add('show'); }
        function hideTip() { _tip.classList.remove('show'); }

        function updateColorChip(hex) {
            const key = getColorKey(hex), name = key ? formatColorName(key) : hex;
            const dot = $('#chip-dot'), lbl = $('#chip-label');
            if (dot) dot.style.background = hex; if (lbl) lbl.textContent = name;
        }

        function buildSwatches() {
            const cfg = getCfg(), colorPanel = $('#panel-color'); if (!colorPanel) return;
            if (!cfg.showColor) { colorPanel.style.display = 'none'; return; }
            colorPanel.style.display = '';
            const wrap = $('#preset-swatches'); if (!wrap) return;
            wrap.innerHTML = '';
            if (!state._colorInitialized) { state.shirtColor = DEFAULT_COLOR; state._colorInitialized = true; }
            PALETTE_KEYS.forEach(function (key) {
                const hex = colorPalette[key];
                const b = document.createElement('button');
                b.className = 'cs' + (hex.toLowerCase() === state.shirtColor.toLowerCase() ? ' sel' : '') + (isLightColor(hex) ? ' light' : '');
                b.style.background = hex; b.dataset.c = hex; b.dataset.name = formatColorName(key); b.title = formatColorName(key);
                b.addEventListener('mouseenter', function () { const r = b.getBoundingClientRect(); showTip(b.dataset.name, r.left + r.width / 2, r.top - 2); });
                b.addEventListener('mouseleave', hideTip);
                b.addEventListener('focus', function () { const r = b.getBoundingClientRect(); showTip(b.dataset.name, r.left + r.width / 2, r.top - 2); });
                b.addEventListener('blur', hideTip);
                b.onclick = function () { setShirtColor(hex); };
                wrap.appendChild(b);
            });
            updateColorChip(state.shirtColor);
        }

        function setShirtColor(v) {
            if (!/^#[0-9a-fA-F]{3,6}$/.test(v)) return;
            markDirty(); state.shirtColor = v;
            $$('.cs').forEach(function (s) { s.classList.toggle('sel', s.dataset.c.toLowerCase() === v.toLowerCase()); });
            updateColorChip(v); renderStage(); setStatus('Product color updated.', 'success');
        }

        function shade(hex, pct) { const n = parseInt(hex.replace('#', ''), 16); const r = Math.min(255, Math.max(0, (n >> 16) + pct)); const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + pct)); const b = Math.min(255, Math.max(0, (n & 0xff) + pct)); return '#' + [r, g, b].map(function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }

        function shirtSVGInner(w, h, c) { return '<path d="M55,28 L18,75 L56,94 L52,308 L248,308 L244,94 L282,75 L245,28 Q226,13 208,19 Q190,47 150,52 Q110,47 92,19 Q74,13 55,28 Z" fill="' + c + '" stroke="black" stroke-width="2"/><path d="M55,28 Q74,13 92,19 Q110,47 150,52 Q190,47 208,19 Q226,13 245,28" fill="none" stroke="black" stroke-width="2"/>'; }
        function rectSVGInner(w, h, c) { return '<rect x="24" y="18" rx="22" ry="22" width="' + (w - 48) + '" height="' + (h - 36) + '" fill="' + c + '" stroke="black" stroke-width="2"/><rect x="38" y="32" rx="14" ry="14" width="' + (w - 76) + '" height="' + (h - 64) + '" fill="none" stroke="black" stroke-width="2" stroke-dasharray="5 4"/>'; }
        function bookSVGInner(w, h, c) { return '<rect x="28" y="16" rx="20" ry="20" width="' + (w - 56) + '" height="' + (h - 32) + '" fill="' + c + '" stroke="black" stroke-width="2"/><rect x="44" y="30" rx="12" ry="12" width="' + (w - 88) + '" height="' + (h - 60) + '" fill="none" stroke="black" stroke-width="2"/>'; }

        function productShapeInner(shape, w, h, c) { if (shape === 'shirt') return shirtSVGInner(w, h, c); if (shape === 'rectBook') return bookSVGInner(w, h, c); return rectSVGInner(w, h, c); }
        function productShapeSvg(shape, w, h, c) { return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' + productShapeInner(shape, w, h, c) + '</svg>'; }
        function shirtSVG(w, h, c) { return shirtSVGInner(w, h, c); }
        function rectSVG(w, h, c) { return rectSVGInner(w, h, c); }
        function bookSVG(w, h, c) { return bookSVGInner(w, h, c); }

        function renderStage() {
            const cfg = getCfg(), stage = $('#stage'), svg = $('#stage-svg'); if (!stage || !svg) return;
            const areaEl = $('#canvas-stage-area');
            if (areaEl) { const aW = areaEl.clientWidth - 64, aH = areaEl.clientHeight - 64; const scale = Math.min(1, aW / cfg.stageW, aH / cfg.stageH); stage.style.width = cfg.stageW + 'px'; stage.style.height = cfg.stageH + 'px'; stage.style.transform = 'scale(' + scale + ')'; stage.style.transformOrigin = 'center center'; }
            else { stage.style.width = cfg.stageW + 'px'; stage.style.height = cfg.stageH + 'px'; }
            svg.setAttribute('viewBox', '0 0 ' + cfg.stageW + ' ' + cfg.stageH);
            if (cfg.productShape === 'shirt') svg.innerHTML = shirtSVG(cfg.stageW, cfg.stageH, state.shirtColor);
            else if (cfg.productShape === 'rectBook') svg.innerHTML = bookSVG(cfg.stageW, cfg.stageH, state.shirtColor);
            else svg.innerHTML = rectSVG(cfg.stageW, cfg.stageH, state.shirtColor);
        }

        async function loadTemplates() { try { const res = await fetch(TEMPLATE_JSON_URL, { cache: 'no-store' }); if (!res.ok) throw new Error('HTTP ' + res.status); const data = await res.json(); state.templates = Array.isArray(data) ? data : []; } catch (e) { state.templates = []; } }

        function renderTemplates() {
            const grid = $('#tpl-grid'), pill = $('#tpl-count-pill'); if (!grid) return;
            const matching = state.templates.filter(function (t) { return String(t.category || '').toLowerCase() === state.category; });
            state.templatesToShow = matching; if (pill) pill.textContent = matching.length;
            grid.innerHTML = '';
            if (!matching.length) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="icon">🎨</div>No templates for this category.</div>'; return; }
            matching.forEach(function (t, i) {
                const b = document.createElement('button'); b.className = 'tpl-btn'; b.dataset.index = i; b.title = t.name || 'Template';
                b.innerHTML = '<img class="tpl-thumb" src="' + esc(t.file) + '" alt="' + esc(t.name || 'Template') + '" loading="lazy"><div class="tpl-name">' + esc(t.name || 'Template') + '</div>';
                b.onclick = function () { applyTemplate(t); }; grid.appendChild(b);
            });
        }

        function applyTemplate(tpl) {
            markDirty();
            // Remove all image layers (both uploaded and template) — one image rule
            state[state.side] = state[state.side].filter(function (l) { return l.type !== 'image'; });
            state.sel = null;
            // Reset upload UI since template replaces uploaded image
            if (typeof window._clearUploadUI === 'function') window._clearUploadUI(true);
            const s = stageSize(); const size = Math.min(s.w, s.h) * .55;
            const layer = { id: state.nid++, type: 'image', _uploaded: false, x: Math.round((s.w - size) / 2), y: Math.round((s.h - size) / 2), w: size, h: size, src: tpl.file, name: tpl.name || 'Template' };
            layers().push(layer); renderAll(); selectLayer(layer.id); setStatus('Template "' + (tpl.name || 'Template') + '" applied.', 'success');
        }

        function refreshTemplateHighlight() {
            const selected = layers().find(function (l) { return l.type === 'image' && !l._uploaded; });
            $$('.tpl-btn').forEach(function (btn) { const idx = Number(btn.dataset.index), tpl = state.templatesToShow[idx]; btn.classList.toggle('active', !!selected && !!tpl && selected.src === tpl.file); });
        }

        function escXml(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

        function makeCurvedTextSVG(layer) {
            const text = layer.text || '', curve = layer.curve || 0, fs = layer.fontSize || 30, fw = layer.fontWeight || '400';
            const ff = layer.fontFamily || "'Inter', sans-serif", col = layer.textColor || '#fff', ta = layer.textAlign || 'center', lw = layer.w || 160;
            if (curve === 0) {
                const lines = text.split('\n'), lineH = fs * 1.3, totalH = lines.length * lineH, svgH = Math.max(totalH + fs * .7, 40), startY = (svgH - totalH) / 2 + fs * .78;
                const svgLines = lines.map(function (line, i) { const ax = ta === 'left' ? 4 : ta === 'right' ? lw - 4 : lw / 2; const anchor = ta === 'left' ? 'start' : ta === 'right' ? 'end' : 'middle'; return '<text x="' + ax + '" y="' + (startY + i * lineH) + '" text-anchor="' + anchor + '" fill="' + col + '" font-size="' + fs + '" font-weight="' + fw + '" font-family="' + ff + '">' + escXml(line) + '</text>'; }).join('');
                return '<svg xmlns="http://www.w3.org/2000/svg" width="' + lw + '" height="' + svgH + '" viewBox="0 0 ' + lw + ' ' + svgH + '">' + svgLines + '</svg>';
            }
            const absCurve = Math.abs(curve), radius = Math.max(lw * .5, (lw * 55) / absCurve), halfAngle = Math.asin(Math.min(.97, (lw * .44) / radius)), sagitta = radius - radius * Math.cos(halfAngle), svgH = Math.max(sagitta + fs * 2.0, fs * 2.4), svgW = lw, pid = 'cp' + layer.id + '_' + ((Math.random() * 1e6) | 0);
            let pathD;
            if (curve > 0) { const cx = svgW / 2, cy = svgH + radius - sagitta - fs * .5, sa = Math.PI / 2 + halfAngle, ea = Math.PI / 2 - halfAngle, sx = cx + radius * Math.cos(sa), sy = cy - radius * Math.sin(sa), ex = cx + radius * Math.cos(ea), ey = cy - radius * Math.sin(ea); pathD = 'M ' + sx + ',' + sy + ' A ' + radius + ',' + radius + ' 0 0,1 ' + ex + ',' + ey; }
            else { const cx = svgW / 2, cy = -(radius - sagitta) + fs * .5, sa = Math.PI / 2 + halfAngle, ea = Math.PI / 2 - halfAngle, sx = cx - radius * Math.cos(ea), sy = cy + radius * Math.sin(ea), ex = cx - radius * Math.cos(sa), ey = cy + radius * Math.sin(sa); pathD = 'M ' + sx + ',' + sy + ' A ' + radius + ',' + radius + ' 0 0,0 ' + ex + ',' + ey; }
            return '<svg xmlns="http://www.w3.org/2000/svg" width="' + svgW + '" height="' + svgH + '" viewBox="0 0 ' + svgW + ' ' + svgH + '"><defs><path id="' + pid + '" d="' + pathD + '"/></defs><text font-size="' + fs + '" font-weight="' + fw + '" font-family="' + ff + '" fill="' + col + '"><textPath href="#' + pid + '" startOffset="50%" text-anchor="middle">' + escXml(text.replace(/\n/g, ' ')) + '</textPath></text></svg>';
        }

        function renderLayer(layer) {
            const ov = $('#overlay'); if (!ov) return;
            let el = $('#lo-' + layer.id);
            if (!el) {
                el = document.createElement('div'); el.className = 'lobj'; el.id = 'lo-' + layer.id;
                const frame = document.createElement('div'); frame.className = 'lframe'; el.appendChild(frame);
                const rh = document.createElement('div'); rh.className = 'resize-handle'; el.appendChild(rh);
                ov.appendChild(el); setupDrag(el, layer); setupResize(rh, layer);
                el.addEventListener('pointerdown', function (e) { if (e.target.closest('.resize-handle')) return; e.stopPropagation(); selectLayer(layer.id); });
            }
            el.style.left = layer.x + 'px'; el.style.top = layer.y + 'px'; el.style.width = layer.w + 'px'; el.style.height = layer.h + 'px';
            el.classList.toggle('sel', state.sel === layer.id);
            const frame = el.querySelector('.lframe');
            if (layer.type === 'image') {
                const existing = frame.querySelector('img');
                if (!existing || existing.src !== layer.src) { frame.innerHTML = ''; const img = document.createElement('img'); img.src = layer.src; img.alt = layer.name || 'Design'; frame.appendChild(img); }
            } else if (layer.type === 'text') {
                const svgStr = makeCurvedTextSVG(layer); const blob = new Blob([svgStr], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob);
                const prev = frame.querySelector('img'); if (prev && prev.src.startsWith('blob:')) URL.revokeObjectURL(prev.src);
                frame.innerHTML = ''; const img = document.createElement('img'); img.src = url; img.alt = 'Text layer'; img.style.cssText = 'width:100%;height:100%;object-fit:contain;'; frame.appendChild(img);
            }
        }

        function renderAll() {
            const ov = $('#overlay'); if (!ov) return;
            const ids = new Set(layers().map(function (l) { return 'lo-' + l.id; }));
            Array.from(ov.children).forEach(function (el) { if (!ids.has(el.id)) el.remove(); });
            layers().forEach(renderLayer); setLayerInfo(); refreshSelBoxes(); refreshTemplateHighlight();
        }

        document.addEventListener('pointerdown', function (e) {
            const stage = $('#stage');
            if (stage && stage.contains(e.target) && !e.target.closest('.lobj')) { if (state.sel !== null) { state.sel = null; renderAll(); resetSelBoxes(); setStatus(''); } }
        });

        function selectLayer(id) {
            state.sel = id; const layer = layers().find(function (l) { return l.id === id; });
            if (layer && layer.type === 'text') { populateTextControls(layer); openPanel('text'); }
            else if (layer && layer.type === 'image') { openPanel('design'); }
            renderAll(); setStatus(layer ? (layer.type === 'text' ? 'Text' : 'Design') + ' layer selected — drag to move, corner to resize.' : '', 'idle');
        }
        function populateTextControls(layer) {
            $('#txt-content').value = layer.text || ''; $('#txt-font').value = layer.fontFamily || "'Inter', sans-serif";
            $('#txt-weight').value = layer.fontWeight || '400'; $('#txt-size').value = layer.fontSize || 36;
            $('#txt-width').value = layer.w || 160; $('#txt-color').value = layer.textColor || '#FFFFFF';
            $('#txt-curve').value = layer.curve || 0; $('#curve-val').textContent = (layer.curve || 0) + '°';
            setTextAlignUI(layer.textAlign || 'center');
        }
        function refreshSelBoxes() {
            const layer = layers().find(function (l) { return l.id === state.sel; }); const dbox = $('#design-sel-box'), tbox = $('#text-sel-box');
            if (!layer) { resetSelBoxes(); return; }
            if (layer.type === 'image') { dbox.className = 'sel-box active'; dbox.innerHTML = '<strong>' + esc(layer.name || 'Design') + '</strong><br>Selected. Drag to reposition, corner to resize.'; tbox.className = 'sel-box'; tbox.innerHTML = '<strong>No text selected</strong><br>Click a text layer to edit it.'; }
            else if (layer.type === 'text') { tbox.className = 'sel-box active'; const preview = (layer.text || '').slice(0, 24); tbox.innerHTML = '<strong>Text layer</strong> — ' + esc(preview) + (layer.text.length > 24 ? '&#x2026;' : '') + '<br>Editing in the panel above.'; dbox.className = 'sel-box'; dbox.innerHTML = '<strong>No design selected</strong><br>Click a design layer to select it.'; }
        }
        function resetSelBoxes() {
            const dbox = $('#design-sel-box'), tbox = $('#text-sel-box');
            if (dbox) { dbox.className = 'sel-box'; dbox.innerHTML = '<strong>No design selected</strong><br>Upload an image or pick a template.'; }
            if (tbox) { tbox.className = 'sel-box'; tbox.innerHTML = '<strong>No text selected</strong><br>Add text then click a layer to edit it.'; }
        }
        function setTextAlignUI(a) { ['left', 'center', 'right'].forEach(function (v) { $('#al-' + v).classList.toggle('active', v === a); }); }
        function setTextAlign(a) { markDirty(); setTextAlignUI(a); const layer = layers().find(function (l) { return l.id === state.sel && l.type === 'text'; }); if (layer) { layer.textAlign = a; renderLayer(layer); } }
        function syncTextSel() {
            markDirty(); const layer = layers().find(function (l) { return l.id === state.sel && l.type === 'text'; }); if (!layer) return;
            layer.text = $('#txt-content').value; layer.fontFamily = $('#txt-font').value; layer.fontWeight = $('#txt-weight').value;
            layer.fontSize = parseInt($('#txt-size').value) || 30; layer.w = parseInt($('#txt-width').value) || 160;
            layer.textColor = $('#txt-color').value; layer.curve = parseInt($('#txt-curve').value) || 0;
            layer.textAlign = ['left', 'center', 'right'].find(function (v) { return $('#al-' + v).classList.contains('active'); }) || 'center';
            renderLayer(layer);
        }
        let syncTimer;
        var txtEl = $('#txt-content'); if (txtEl) txtEl.addEventListener('input', function () { clearTimeout(syncTimer); syncTimer = setTimeout(syncTextSel, 60); });

        function addTextLayer() {
            markDirty(); const s = stageSize(); const id = state.nid++;
            const layer = { id: id, type: 'text', x: Math.round(s.w * .2), y: Math.round(s.h * .4), w: parseInt($('#txt-width').value) || 160, h: 64, text: $('#txt-content').value || 'YOUR TEXT', fontFamily: $('#txt-font').value, fontWeight: $('#txt-weight').value, fontSize: parseInt($('#txt-size').value) || 36, textColor: $('#txt-color').value, textAlign: ['left', 'center', 'right'].find(function (v) { return $('#al-' + v).classList.contains('active'); }) || 'center', curve: parseInt($('#txt-curve').value) || 0 };
            layers().push(layer); renderAll(); selectLayer(id); setStatus('Text layer added.', 'success');
        }
        function removeSel(fallback) {
            const idx = layers().findIndex(function (l) { return l.id === state.sel; });
            if (idx < 0) { setStatus(fallback === 'text' ? 'No text layer selected.' : fallback === 'design' ? 'No design layer selected.' : 'No layer selected.', 'warning'); return; }
            const removed = layers()[idx];
            markDirty(); layers().splice(idx, 1); state.sel = null;
            // If the removed layer was an uploaded image, reset the upload UI
            if (removed && removed._uploaded && typeof window._clearUploadUI === 'function') window._clearUploadUI(true);
            renderAll(); setStatus('Layer removed.');
        }
        function centerSel() {
            const layer = layers().find(function (l) { return l.id === state.sel; }); if (!layer) { setStatus('Select a layer first.', 'warning'); return; }
            markDirty(); const s = stageSize(); layer.x = Math.round((s.w - layer.w) / 2); layer.y = Math.round((s.h - layer.h) / 2); renderLayer(layer); setStatus('Layer centered.', 'success');
        }
        function alignSel(axis) {
            const layer = layers().find(function (l) { return l.id === state.sel; }); if (!layer) { setStatus('Select a layer first.', 'warning'); return; }
            markDirty(); const s = stageSize(); if (axis === 'hc') layer.x = Math.round((s.w - layer.w) / 2); else layer.y = Math.round((s.h - layer.h) / 2); renderLayer(layer); setStatus('Layer aligned.', 'success');
        }
        function clearSide(silent) {
            markDirty(); state[state.side] = []; state.sel = null; const ov = $('#overlay'); if (ov) ov.innerHTML = '';
            if (typeof window._clearUploadUI === 'function') window._clearUploadUI(true);
            renderAll(); if (!silent) { setStatus('Side cleared.'); showToast('Canvas cleared'); }
        }
        function promptResetDesign() { openModal('reset-modal'); }
        function confirmResetDesign() {
            closeModal('reset-modal'); markDirty();
            state.front = []; state.back = []; state.wrap = []; state.sel = null;
            const ov = $('#overlay'); if (ov) ov.innerHTML = '';
            if (typeof window._clearUploadUI === 'function') window._clearUploadUI(true);
            renderAll(); setStatus('Design reset.', 'success'); showToast('All designs cleared');
        }
        function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
        function setupDrag(el, layer) {
            let sx, sy, ox, oy;
            el.addEventListener('pointerdown', function (e) {
                if (e.target.closest('.resize-handle')) return;
                e.preventDefault(); sx = e.clientX; sy = e.clientY; ox = layer.x; oy = layer.y; el.setPointerCapture(e.pointerId);
                const s = stageSize();
                function mv(ev) { markDirty(); layer.x = clamp(ox + (ev.clientX - sx), 0, s.w - layer.w); layer.y = clamp(oy + (ev.clientY - sy), 0, s.h - layer.h); el.style.left = layer.x + 'px'; el.style.top = layer.y + 'px'; }
                function up() { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); }
                el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
            });
        }
        function setupResize(rh, layer) {
            let sx, sy, ow, oh;
            rh.addEventListener('pointerdown', function (e) {
                e.preventDefault(); e.stopPropagation(); sx = e.clientX; sy = e.clientY; ow = layer.w; oh = layer.h; rh.setPointerCapture(e.pointerId);
                const s = stageSize();
                function mv(ev) { markDirty(); layer.w = clamp(ow + (ev.clientX - sx), 30, s.w - layer.x); if (layer.type === 'image') layer.h = layer.w; else layer.h = Math.max(24, oh + (ev.clientY - sy)); renderLayer(layer); }
                function up() { rh.removeEventListener('pointermove', mv); rh.removeEventListener('pointerup', up); }
                rh.addEventListener('pointermove', mv); rh.addEventListener('pointerup', up);
            });
        }

        async function generateSnapshot() {
            const cfg = getCfg(); const s = stageSize(); const canvas = $('#snapshot-canvas'); canvas.width = s.w; canvas.height = s.h;
            const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, s.w, s.h);
            await drawSvgStringToCanvas(ctx, productShapeSvg(cfg.productShape, s.w, s.h, state.shirtColor), 0, 0, s.w, s.h);
            for (const layer of (state[state.side] || [])) {
                if (layer.type === 'image') await drawImageLayerToCanvas(ctx, layer);
                else if (layer.type === 'text') await drawSvgStringToCanvas(ctx, makeCurvedTextSVG(layer), layer.x, layer.y, layer.w, null);
            }
            return canvas.toDataURL('image/png');
        }
        function drawSvgStringToCanvas(ctx, svgStr, x, y, w, h) {
            return new Promise(function (resolve) {
                const blob = new Blob([svgStr], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob); const img = new Image();
                img.onload = function () { try { if (h === null) { const nW = img.naturalWidth || img.width || w, nH = img.naturalHeight || img.height || w, drawH = nW > 0 ? (w * nH / nW) : nH; ctx.drawImage(img, x, y, w, drawH); } else { ctx.drawImage(img, x, y, w, h); } } finally { URL.revokeObjectURL(url); resolve(); } };
                img.onerror = function () { URL.revokeObjectURL(url); resolve(); }; img.src = url;
            });
        }
        function drawImageLayerToCanvas(ctx, layer) {
            return new Promise(function (resolve) {
                const img = new Image();
                // Uploaded images are data URLs — no crossOrigin needed; template URLs may be external
                if (!layer._uploaded) img.crossOrigin = 'anonymous';
                img.onload = function () { try { const iw = img.naturalWidth || img.width || layer.w, ih = img.naturalHeight || img.height || layer.h; if (!iw || !ih) { ctx.drawImage(img, layer.x, layer.y, layer.w, layer.h); return; } const scale = Math.min(layer.w / iw, layer.h / ih), dw = iw * scale, dh = ih * scale, dx = layer.x + (layer.w - dw) / 2, dy = layer.y + (layer.h - dh) / 2; ctx.drawImage(img, dx, dy, dw, dh); } finally { resolve(); } };
                img.onerror = function () { resolve(); }; img.src = layer.src;
            });
        }
        function serializeLayers(ls) { return ls.map(function (l) { const o = { id: l.id, type: l.type, x: l.x, y: l.y, w: l.w, h: l.h, _uploaded: l._uploaded || false }; if (l.type === 'text') Object.assign(o, { text: l.text, fontFamily: l.fontFamily, fontWeight: l.fontWeight, fontSize: l.fontSize, textColor: l.textColor, textAlign: l.textAlign, curve: l.curve }); if (l.type === 'image') o.src = l.src; return o; }); }

        async function saveDesign() {
            const pid = state.product && state.product.id; const key = pid ? 'designData_' + pid : 'designData';
            let previewImage = null; try { previewImage = await generateSnapshot(); } catch (e) { console.warn('Snapshot failed:', e); }
            const data = { productId: pid || null, productCategory: state.category, productName: state.product && state.product.name || null, shirtColor: state.shirtColor, activeSide: state.side, front: serializeLayers(state.front), back: serializeLayers(state.back), wrap: serializeLayers(state.wrap), generatedAt: new Date().toISOString(), previewImage: previewImage };
            try {
                localStorage.setItem(key, JSON.stringify(data)); markSaved();
                const btn = $('#save-btn');
                if (btn) { btn.classList.add('saved'); btn.textContent = 'Saved!'; setTimeout(function () { btn.classList.remove('saved'); btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Design'; }, 2200); }
                setStatus('Design saved' + (pid ? ' for product #' + pid : '.'), 'success'); showToast('Design saved successfully!');
            } catch (err) {
                try { data.previewImage = null; localStorage.setItem(key, JSON.stringify(data)); markSaved(); showToast('Saved (preview skipped - storage full)'); }
                catch (e2) { setStatus('Could not save design data.', 'warning'); showToast('Save failed - storage may be full.'); }
            }
        }
        function handleBack() { if (!state.saved) { openModal('back-modal'); return; } proceedBack(); }
        function openModal(id) { document.getElementById(id).classList.add('show'); }
        function closeModal(id) { document.getElementById(id).classList.remove('show'); }
        async function saveAndBack() { await saveDesign(); closeModal('back-modal'); proceedBack(); }
        function proceedBack() { closeModal('back-modal'); window.location.href = '/product' + (state.product && state.product.id ? '?id=' + state.product.id : ''); }

        function updateMeta() {
            const cfg = getCfg(), p = state.product;
            const nameEl = $('#product-name'), badgeEl = $('#category-badge'), infoEl = $('#info-banner'), sideLbl = $('#side-label');
            if (nameEl) nameEl.textContent = p && p.name || 'Customizer'; if (badgeEl) badgeEl.textContent = cfg.label;
            if (sideLbl) sideLbl.innerHTML = 'Editing <strong>' + state.side + '</strong>';
            if (infoEl) { const sd = cfg.sides.length === 1 ? cfg.sides[0] + ' panel' : cfg.sides.join(' & ') + ' panels'; infoEl.innerHTML = '<strong>' + cfg.label + '</strong> &mdash; ' + sd + '. Canvas: ' + cfg.stageW + 'x' + cfg.stageH + 'px.'; }
            document.title = p && p.name ? 'Customize - ' + p.name : 'Product Customizer';
        }
        function observeResize() { if (!window.ResizeObserver) return; const area = $('#canvas-stage-area'); if (!area) return; new ResizeObserver(function () { renderStage(); }).observe(area); }

        async function init() {
            const id = new URLSearchParams(location.search).get('id'); setStatus('Loading product...');
            try {
                const res = await fetch(PRODUCTS_JSON_URL); if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json(); const products = data.products || [];
                const product = id ? products.find(function (p) { return String(p.id) === String(id).toUpperCase(); }) : null;
                if (!product && id) { setStatus('Product not found.', 'warning'); showToast('Product not found - showing default canvas.'); }
                state.product = product || null; state.category = String(product && product.category || 'default').toLowerCase();
                if (product && product.id) {
                    const saved = localStorage.getItem('designData_' + product.id);
                    if (saved) { try { const d = JSON.parse(saved); if (d.front) state.front = d.front || []; if (d.back) state.back = d.back || []; if (d.wrap) state.wrap = d.wrap || []; if (d.shirtColor) { state.shirtColor = d.shirtColor; state._colorInitialized = true; } const allIds = [].concat(state.front, state.back, state.wrap).map(function (l) { return l.id; }); if (allIds.length) state.nid = Math.max.apply(null, allIds) + 1; state.saved = true; } catch (e) { } }
                }
            } catch (err) { console.error(err); setStatus('Could not load product data.', 'warning'); }
            const cfg = getCfg(); state.side = cfg.defaultSide;
            await loadTemplates();
            updateMeta(); buildSwatches(); buildSideTabs(); renderTemplates(); renderStage(); renderAll(); observeResize();
            setStatus('Ready - upload an image, pick a template, or add text.', 'success');
        }

        /* ══════════════════════════════════════════════
           IMAGE UPLOAD
           Validates format (JPG/PNG/WEBP only) and size
           (≤ 10 KB), then converts to base64 data URL
           and places it as an image layer.
           One uploaded image at a time per side.
        ══════════════════════════════════════════════ */
        (function () {
            // ── Hard limits ──────────────────────────
            const MAX_BYTES = 50 * 1024; // 50 KB — must match hint text in HTML
            const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];
            const FORMAT_LABEL = 'JPG, PNG, or WEBP';

            // ── Element refs ─────────────────────────
            const areaEl = document.getElementById('upload-area');
            const inputEl = document.getElementById('img-upload');
            const idleEl = document.getElementById('upload-idle');
            const loadingEl = document.getElementById('upload-loading');
            const previewEl = document.getElementById('upload-preview');
            const thumbEl = document.getElementById('upload-thumb');
            const nameEl = document.getElementById('upload-name');
            const removeBtn = document.getElementById('upload-remove');
            const errorEl = document.getElementById('upload-error');
            const errTitle = document.getElementById('upload-error-title');
            const errDetail = document.getElementById('upload-error-detail');

            if (!areaEl || !inputEl) return;

            // ── Event: click → open picker ───────────
            areaEl.addEventListener('click', function (e) {
                if (removeBtn && (e.target === removeBtn || removeBtn.contains(e.target))) return;
                // Don't open picker if already showing a preview
                if (previewEl.style.display !== 'none') return;
                inputEl.click();
            });

            // ── Event: keyboard ──────────────────────
            areaEl.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputEl.click(); }
            });

            // ── Event: drag and drop ─────────────────
            areaEl.addEventListener('dragover', function (e) {
                e.preventDefault(); areaEl.classList.add('drag-over');
            });
            areaEl.addEventListener('dragleave', function (e) {
                if (!areaEl.contains(e.relatedTarget)) areaEl.classList.remove('drag-over');
            });
            areaEl.addEventListener('drop', function (e) {
                e.preventDefault(); areaEl.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file) processFile(file);
            });

            // ── Event: file input change ─────────────
            inputEl.addEventListener('change', function () {
                const file = inputEl.files[0];
                // Reset the input value BEFORE processing so that selecting the
                // exact same invalid file a second time always fires 'change' again.
                // Using setTimeout defers the reset past the current call stack,
                // which is required for Firefox compatibility.
                setTimeout(function () { inputEl.value = ''; }, 0);
                if (file) processFile(file);
            });

            // ── Event: remove button ─────────────────
            if (removeBtn) {
                removeBtn.addEventListener('click', function (e) {
                    e.stopPropagation(); clearUploadUI(false);
                });
            }

            // ── Core: validate then read file ────────
            function processFile(file) {
                clearError();

                // 1. Format validation
                if (!ALLOWED.includes(file.type)) {
                    showError(
                        'Unsupported format',
                        'Only ' + FORMAT_LABEL + ' images are supported. Please choose a different file.'
                    );
                    return;
                }

                // 2. Size validation — checked before reading to avoid wasting memory
                if (file.size > MAX_BYTES) {
                    const kb = (file.size / 1024).toFixed(1);
                    showError(
                        'File too large',
                        'Image size (' + kb + ' KB) exceeds the 50 KB limit. Please upload a smaller image.'
                    );
                    return;
                }

                // 3. Show loading state
                showLoading();

                const reader = new FileReader();
                reader.onload = function (ev) {
                    const dataUrl = ev.target.result;
                    // Sanity-check: make sure the browser could actually decode it
                    const testImg = new Image();
                    testImg.onload = function () {
                        hideLoading();
                        showPreview(file.name, dataUrl);
                        placeOnCanvas(dataUrl, file.name);
                    };
                    testImg.onerror = function () {
                        hideLoading();
                        showError(
                            'Corrupted file',
                            'This image could not be processed. Please try another file.'
                        );
                    };
                    testImg.src = dataUrl;
                };
                reader.onerror = function () {
                    hideLoading();
                    showError(
                        'Upload failed',
                        'Upload failed. Please try again.'
                    );
                };
                reader.readAsDataURL(file);
            }

            // ── UI helpers ───────────────────────────
            function showLoading() {
                idleEl.style.display = 'none';
                previewEl.style.display = 'none';
                loadingEl.style.display = 'flex';
                areaEl.classList.remove('upload-error-state');
            }
            function hideLoading() {
                loadingEl.style.display = 'none';
            }

            function showPreview(filename, dataUrl) {
                thumbEl.src = dataUrl;
                nameEl.textContent = filename.length > 28 ? filename.slice(0, 25) + '\u2026' : filename;
                idleEl.style.display = 'none';
                loadingEl.style.display = 'none';
                previewEl.style.display = 'flex';
                areaEl.classList.remove('upload-error-state');
            }

            function showError(title, detail) {
                hideLoading();
                idleEl.style.display = 'flex';
                previewEl.style.display = 'none';
                errTitle.textContent = title;
                errDetail.textContent = detail;
                errorEl.classList.add('visible');
                areaEl.classList.add('upload-error-state');
            }

            function clearError() {
                errorEl.classList.remove('visible');
                areaEl.classList.remove('upload-error-state');
                errTitle.textContent = '';
                errDetail.textContent = '';
            }

            // silentOnly=true: only reset the UI, don't touch canvas layers
            // (called by applyTemplate / clearSide / removeSel)
            function clearUploadUI(silentOnly) {
                thumbEl.src = ''; nameEl.textContent = '';
                idleEl.style.display = 'flex';
                loadingEl.style.display = 'none';
                previewEl.style.display = 'none';
                clearError();
                if (!silentOnly) {
                    state[state.side] = state[state.side].filter(function (l) {
                        return !(l.type === 'image' && l._uploaded);
                    });
                    state.sel = null; renderAll(); markDirty();
                }
            }

            function placeOnCanvas(dataUrl, filename) {
                markDirty();
                // Remove any existing uploaded image layer (one-at-a-time rule)
                state[state.side] = state[state.side].filter(function (l) {
                    return !(l.type === 'image' && l._uploaded);
                });
                // Also remove template image layers — one image total
                state[state.side] = state[state.side].filter(function (l) {
                    return l.type !== 'image';
                });
                state.sel = null;
                const s = stageSize(); const size = Math.min(s.w, s.h) * 0.55;
                const layer = {
                    id: state.nid++,
                    type: 'image',
                    _uploaded: true,
                    x: Math.round((s.w - size) / 2),
                    y: Math.round((s.h - size) / 2),
                    w: size,
                    h: size,
                    src: dataUrl,
                    name: filename || 'Uploaded image',
                };
                layers().push(layer); renderAll(); selectLayer(layer.id);
                setStatus('Image uploaded \u2014 drag to reposition, corner to resize.', 'success');
                showToast('Image added to canvas');
            }

            // Expose so reset/clear functions can call it from outside this IIFE
            window._clearUploadUI = clearUploadUI;
        })();

        /* ══════════════════════════════════════════════
           TOOLBAR STATE & ACTIONS
        ══════════════════════════════════════════════ */
        function updateToolbarState() {
            const hasSel = state.sel !== null;
            const hasLayers = layers().length > 0;
            const cx = document.getElementById('tb-center-x');
            const cy = document.getElementById('tb-center-y');
            if (cx) cx.disabled = !hasSel;
            if (cy) cy.disabled = !hasSel;
            updateCartBadge();
        }

        function updateCartBadge() {
            const badge = document.getElementById('tb-cart-badge');
            if (!badge) return;
            try {
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                const count = cart.reduce(function(sum, item) { return sum + (item.qty || 1); }, 0);
                if (count > 0) { badge.textContent = count; badge.style.display = ''; }
                else { badge.style.display = 'none'; }
            } catch { badge.style.display = 'none'; }
        }

        function handleClearDesign() {
            if (layers().length === 0) { showToast('Nothing to clear'); return; }
            openModal('reset-modal');
        }

        function handleToolbarCart() {
            // Open purchase drawer
            document.getElementById('purchaseDrawer').classList.add('open');
            document.getElementById('purchaseDrawerOverlay').classList.add('open');
        }

        // Hook into renderAll to update toolbar state
        const _origRenderAll = renderAll;
        renderAll = function() {
            _origRenderAll();
            updateToolbarState();
        };

        // Hook into selectLayer to update toolbar
        const _origSelectLayer = selectLayer;
        selectLayer = function(id) {
            _origSelectLayer(id);
            updateToolbarState();
        };

        // Initial badge update
        document.addEventListener('DOMContentLoaded', updateCartBadge);

        window.addEventListener('load', init);

        /* ── Cart modal: close via X button, click outside, Escape ── */
        document.addEventListener('DOMContentLoaded', function() {
            const cartModal = document.getElementById('cart-modal');
            const cartCloseBtn = document.getElementById('cart-modal-close-btn');

            if (cartCloseBtn) {
                cartCloseBtn.addEventListener('click', function() {
                    closeModal('cart-modal');
                });
            }

            // Close on click outside modal card
            if (cartModal) {
                cartModal.addEventListener('click', function(e) {
                    if (e.target === cartModal) {
                        closeModal('cart-modal');
                    }
                });
            }

            // Close on Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && cartModal && cartModal.classList.contains('show')) {
                    closeModal('cart-modal');
                }
            });
        });

        /* ══════════════════════════════════════════════
           PURCHASE PANEL — Add to Cart from Studio
        ══════════════════════════════════════════════ */
        (function() {
            const DESIGN_FEES = { Tshirt: 199, Diary: 149, Bottle: 149, Cup: 99 };
            const CART_KEY = 'cart';
            let csQty = 1;

            function getDesignFee(category) {
                return DESIGN_FEES[category] || 0;
            }

            function money(n) {
                return '₹' + Number(n || 0).toLocaleString('en-IN');
            }

            function getCart() {
                try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
            }

            function saveCart(items) {
                localStorage.setItem(CART_KEY, JSON.stringify(items));
            }

            function updatePurchasePanel() {
                const p = state.product;
                if (!p) return;

                const fee = getDesignFee(p.category);
                const total = (p.basePrice + fee) * csQty;
                const totalEl = document.getElementById('cs-total-price');
                const breakdownEl = document.getElementById('cs-price-breakdown');

                if (totalEl) totalEl.textContent = money(total);
                if (breakdownEl) breakdownEl.textContent = 'Base ' + money(p.basePrice) + ' + Design ' + money(fee);

                // Drawer price details
                const baseEl = document.getElementById('cs-base-price');
                const feeEl = document.getElementById('cs-design-fee');
                const qtyEl = document.getElementById('cs-qty-display');
                const drawerTotal = document.getElementById('cs-drawer-total');
                if (baseEl) baseEl.textContent = money(p.basePrice);
                if (feeEl) feeEl.textContent = money(fee);
                if (qtyEl) qtyEl.textContent = '×' + csQty;
                if (drawerTotal) drawerTotal.textContent = money(total);

                // Populate sizes
                const sizeSelect = document.getElementById('cs-size-select');
                if (sizeSelect && p.sizes && sizeSelect.options.length === 0) {
                    const urlSize = new URLSearchParams(location.search).get('size') || '';
                    p.sizes.forEach(function(s) {
                        const opt = document.createElement('option');
                        opt.value = s; opt.textContent = s;
                        if (s === urlSize) opt.selected = true;
                        sizeSelect.appendChild(opt);
                    });
                }
            }

            // Qty controls
            document.addEventListener('click', function(e) {
                if (e.target.closest('#cs-qty-minus')) {
                    if (csQty > 1) { csQty--; document.getElementById('cs-qty-val').textContent = csQty; updatePurchasePanel(); }
                } else if (e.target.closest('#cs-qty-plus')) {
                    if (csQty < 99) { csQty++; document.getElementById('cs-qty-val').textContent = csQty; updatePurchasePanel(); }
                }
            });

            // Add to Cart
            document.addEventListener('click', async function(e) {
                if (!e.target.closest('#cs-add-to-cart')) return;
                const p = state.product;
                if (!p) { showToast('No product loaded'); return; }

                // Save design first (await so previewImage is generated)
                await saveDesign();

                const selectedSize = document.getElementById('cs-size-select')?.value || p.sizes?.[0] || '';
                const selectedColor = state.shirtColor || '';
                const fee = getDesignFee(p.category);
                const totalPrice = p.basePrice + fee;

                // Load customization data (now includes previewImage)
                const designKey = 'designData_' + p.id;
                let customization = null;
                try { customization = JSON.parse(localStorage.getItem(designKey)); } catch {}

                // Use the design preview as the cart image if available
                const cartImage = (customization && customization.previewImage) || p.images?.default || '';

                // Generate unique key (exclude volatile fields from hash)
                let hashData = {};
                if (customization) {
                    var keys = Object.keys(customization);
                    for (var ki = 0; ki < keys.length; ki++) {
                        if (keys[ki] !== 'previewImage' && keys[ki] !== 'generatedAt') {
                            hashData[keys[ki]] = customization[keys[ki]];
                        }
                    }
                }
                let hash = 0;
                const cs = JSON.stringify(hashData);
                for (let i = 0; i < cs.length; i++) { hash = ((hash << 5) - hash) + cs.charCodeAt(i); hash |= 0; }
                const uniqueKey = p.id + '__' + selectedSize + '__' + selectedColor + '__' + hash;

                const cart = getCart();
                const existing = cart.find(function(item) { return item.key === uniqueKey; });

                if (existing) {
                    existing.qty += csQty;
                    existing.customization = customization;
                    existing.image = cartImage;
                } else {
                    cart.push({
                        key: uniqueKey,
                        id: p.id,
                        name: p.name,
                        image: cartImage,
                        category: p.category,
                        basePrice: p.basePrice,
                        designFee: fee,
                        price: totalPrice,
                        color: selectedColor,
                        colorName: (function() { const k = getColorKey(selectedColor); return k ? formatColorName(k) : selectedColor; })(),
                        size: selectedSize,
                        qty: csQty,
                        customized: true,
                        designRequired: true,
                        customization: customization
                    });
                }

                saveCart(cart);

                // Show modal
                const body = document.getElementById('cart-modal-body');
                if (body) body.textContent = p.name + ' (' + selectedSize + ') × ' + csQty + ' added to cart.';
                openModal('cart-modal');
            });

            // Init purchase panel after product loads
            const origInit = window.addEventListener;
            const observer = new MutationObserver(function() {
                if (state.product) {
                    updatePurchasePanel();
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            // Also try after a delay (fallback)
            setTimeout(function() { updatePurchasePanel(); }, 1500);
        })();
    
