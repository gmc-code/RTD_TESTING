/* seatingplan directive: client-side behaviour. Each .seatingplan[data-seatingplan] gets its own instance. */
(function () {
    'use strict';

    var PRESETS = [
        { label: '5×6', rows: [6, 6, 6, 6, 6] },
        { label: '4×7', rows: [7, 7, 7, 7] },
        { label: '3×10', rows: [10, 10, 10] },
        { label: '11,11,6', rows: [11, 11, 6] },
        { label: '5,8,8,6', rows: [5, 8, 8, 6] }
    ];
    var XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    var xlsxPromise = null;

    var PRINT_CSS =
        '@page{size:landscape;margin:10mm}' +
        'body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#000}' +
        'h1{font-size:16px;margin:0 0 8px}' +
        '.wb{border:2px solid #000;text-align:center;padding:5px;font-weight:700;letter-spacing:1px;font-size:12px;margin-bottom:12px}' +
        '.sp-grid{display:flex;flex-direction:column;gap:10px}' +
        '.sp-row{display:grid;gap:8px}' +
        '.sp-desk{border:1px solid #000;border-radius:5px;height:64px;position:relative;display:flex;align-items:center;justify-content:center;min-width:0;break-inside:avoid}' +
        '.sp-desk-num{position:absolute;top:1px;left:4px;font-size:8px;color:#666}' +
        '.sp-card{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;width:94%}' +
        '.sp-first{font-weight:700;font-size:12px}.sp-last{font-size:11px}' +
        '.sp-badge{font-size:9px;font-weight:700;border:1px solid #000;border-radius:3px;padding:0 3px}';

    /* ---------------- helpers ---------------- */

    function make(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }

    function esc(v) {
        return String(v).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function clean(v) { return v == null ? '' : String(v).trim(); }

    // "Hughes 11" -> "H11"
    function formatHomeroom(hr) {
        var str = clean(hr);
        if (!str) return '';
        var digits = str.replace(/\D/g, '');
        return str.charAt(0) + (digits.length >= 2 ? digits.slice(-2) : digits);
    }

    function isPositionRule(type) { return type === 'FRONT_ROW' || type === 'BACK_ROW'; }

    function adjacent(a, b) {
        var r = Math.abs(a.row - b.row), c = Math.abs(a.col - b.col);
        return r <= 1 && c <= 1 && !(r === 0 && c === 0);
    }

    function loadXlsx() {
        if (window.XLSX) return Promise.resolve(window.XLSX);
        if (!xlsxPromise) {
            xlsxPromise = new Promise(function (resolve, reject) {
                var s = document.createElement('script');
                s.src = XLSX_URL;
                s.onload = function () { resolve(window.XLSX); };
                s.onerror = function () { xlsxPromise = null; reject(new Error('Could not load the Excel reader.')); };
                document.head.appendChild(s);
            });
        }
        return xlsxPromise;
    }

    function decodeBuffer(buf) {
        var b = new Uint8Array(buf);
        if (b[0] === 0xFF && b[1] === 0xFE) return new TextDecoder('utf-16le').decode(b);
        if (b[0] === 0xFE && b[1] === 0xFF) return new TextDecoder('utf-16be').decode(b);
        return new TextDecoder('utf-8').decode(b);
    }

    function parseCSV(text) {
        var firstLine = text.split(/\r?\n/, 1)[0] || '';
        var delim = ',';
        [',', '\t', ';'].forEach(function (d) {
            if (firstLine.split(d).length > firstLine.split(delim).length) delim = d;
        });
        var rows = [], row = [], field = '', inQuotes = false;
        for (var i = 0; i < text.length; i++) {
            var c = text.charAt(i);
            if (inQuotes) {
                if (c === '"') {
                    if (text.charAt(i + 1) === '"') { field += '"'; i++; } else { inQuotes = false; }
                } else { field += c; }
            } else if (c === '"') {
                inQuotes = true;
            } else if (c === delim) {
                row.push(field); field = '';
            } else if (c === '\n' || c === '\r') {
                if (c === '\r' && text.charAt(i + 1) === '\n') i++;
                row.push(field); rows.push(row); row = []; field = '';
            } else {
                field += c;
            }
        }
        if (field !== '' || row.length) { row.push(field); rows.push(row); }
        if (!rows.length) return [];
        var headers = rows[0].map(clean);
        return rows.slice(1).map(function (r) {
            var o = {};
            headers.forEach(function (h, i) { o[h] = r[i] == null ? '' : r[i]; });
            return o;
        });
    }

    function rowsToStudents(rows) {
        var students = [];
        rows.forEach(function (row) {
            var r = {};
            Object.keys(row).forEach(function (k) { r[clean(k).toLowerCase()] = clean(row[k]); });
            var hasData = Object.keys(r).some(function (k) { return r[k] !== ''; });
            if (!hasData) return;
            var idx = students.length;
            var first = r['preferred'] || r['first name'] || r['firstname'] || 'Student';
            var surname = r['surname'] || r['last name'] || r['lastname'] || String(idx + 1);
            students.push({
                id: 'student-' + idx,
                firstName: first,
                surname: surname,
                fullName: first + ' ' + surname,
                homeroom: formatHomeroom(r['homeroom'])
            });
        });
        return students;
    }

    /* ---------------- one seating plan ---------------- */

    function SeatingPlan(root, cfg) {
        var storageKey = 'seatingplan:' + cfg.id;
        var state = {
            students: [],
            rules: [],
            layout: cfg.layout.slice(),
            fillFromLast: cfg.fill === 'last',
            sortMode: cfg.sort || 'DEFAULT'
        };
        var draggingId = null;
        var ui = {};
        var modal = null;
        var mui = {};

        /* ----- data ----- */

        function defaultsFromConfig() {
            state.students = (cfg.students || []).map(function (s, idx) {
                var first = clean(s.firstName) || 'Student';
                var surname = clean(s.surname) || String(idx + 1);
                return {
                    id: 'student-' + idx,
                    firstName: first,
                    surname: surname,
                    fullName: first + ' ' + surname,
                    homeroom: formatHomeroom(s.homeroom)
                };
            });
            state.rules = (cfg.rules || []).map(function (r, i) {
                return {
                    id: 'rule-cfg-' + i,
                    student1Id: 'student-' + r.a,
                    student2Id: r.b == null ? null : 'student-' + r.b,
                    type: r.type
                };
            });
        }

        // Only called after the visitor changes something, so an untouched page always shows the author's roster.
        function save() {
            try {
                localStorage.setItem(storageKey, JSON.stringify({ students: state.students, rules: state.rules }));
            } catch (e) { /* storage blocked */ }
        }

        function load() {
            try {
                var raw = localStorage.getItem(storageKey);
                if (!raw) return false;
                var d = JSON.parse(raw);
                if (d && Array.isArray(d.students)) {
                    state.students = d.students;
                    state.rules = Array.isArray(d.rules) ? d.rules : [];
                    return true;
                }
            } catch (e) { /* ignore */ }
            return false;
        }

        function studentById(id) {
            for (var i = 0; i < state.students.length; i++) {
                if (state.students[i].id === id) return state.students[i];
            }
            return null;
        }

        function rulesFor(id) {
            return state.rules.filter(function (r) { return r.student1Id === id || r.student2Id === id; });
        }

        function ruleTypeBetween(a, b) {
            var m = state.rules.filter(function (r) {
                return (r.student1Id === a && r.student2Id === b) || (r.student1Id === b && r.student2Id === a);
            });
            var hasSep = m.some(function (r) { return r.type === 'SEPARATE'; });
            var hasPair = m.some(function (r) { return r.type === 'PAIR'; });
            if (hasSep && hasPair) return 'CONFLICT';
            return m.length ? m[0].type : null;
        }

        /* ----- skeleton ----- */

        function build() {
            var layoutBtns = PRESETS.slice();
            var key = state.layout.join(',');
            var known = layoutBtns.some(function (p) { return p.rows.join(',') === key; });
            if (!known) layoutBtns.unshift({ label: key, rows: state.layout.slice() });

            root.innerHTML =
                (cfg.title ? '<div class="sp-title">' + esc(cfg.title) + '</div>' : '') +
                '<div class="sp-toolbar">' +
                '<div class="sp-layouts" data-role="layouts">' +
                layoutBtns.map(function (p) {
                    return '<button type="button" class="sp-btn sp-btn-layout" data-action="layout" data-layout="' +
                        p.rows.join(',') + '">' + esc(p.label) + '</button>';
                }).join('') +
                '</div>' +
                '<button type="button" class="sp-btn sp-btn-toggle" data-action="fill" data-role="fill"></button>' +
                '<button type="button" class="sp-btn sp-btn-teal" data-action="rules">Rules</button>' +
                '<button type="button" class="sp-btn" data-action="import">Import</button>' +
                '<input type="file" class="sp-file" accept=".xlsx,.xls,.csv" data-role="file">' +
                '<button type="button" class="sp-btn sp-btn-grey" data-action="sort" data-mode="AZ">A → Z</button>' +
                '<button type="button" class="sp-btn sp-btn-grey" data-action="sort" data-mode="ZA">Z → A</button>' +
                '<button type="button" class="sp-btn sp-btn-amber" data-action="sort" data-mode="RANDOM">Random</button>' +
                '<button type="button" class="sp-btn sp-btn-purple" data-action="reverse">Reverse</button>' +
                '<button type="button" class="sp-btn sp-btn-red" data-action="clear">Clear</button>' +
                '<button type="button" class="sp-btn sp-btn-grey" data-action="reset">Reset</button>' +
                '<button type="button" class="sp-btn sp-btn-grey" data-action="print">Print</button>' +
                '</div>' +
                '<div class="sp-status" data-role="status" role="status" aria-live="polite"></div>' +
                '<div class="sp-body">' +
                '<div class="sp-sidebar"><div class="sp-side-title">Unassigned (<span data-role="count">0</span>)</div>' +
                '<div class="sp-pool" data-role="pool"></div></div>' +
                '<div class="sp-canvas"><div class="sp-whiteboard">FRONT OF CLASSROOM / WHITEBOARD</div>' +
                '<div class="sp-grid" data-role="grid"></div></div>' +
                '</div>';

            ['layouts', 'fill', 'file', 'status', 'count', 'pool', 'grid'].forEach(function (r) {
                ui[r] = root.querySelector('[data-role="' + r + '"]');
            });

            root.addEventListener('click', onRootClick);
            ui.file.addEventListener('change', onFileChosen);
            ui.pool.addEventListener('dragover', function (e) { e.preventDefault(); });
            ui.pool.addEventListener('drop', onPoolDrop);
        }

        function setStatus(msg) {
            ui.status.textContent = msg || '';
            ui.status.classList.toggle('sp-show', !!msg);
        }

        function updateToolbar() {
            ui.fill.textContent = state.fillFromLast ? 'Fill: Last → First' : 'Fill: First → Last';
            var key = state.layout.join(',');
            Array.prototype.forEach.call(ui.layouts.querySelectorAll('[data-layout]'), function (b) {
                b.classList.toggle('sp-active', b.getAttribute('data-layout') === key);
            });
        }

        function onRootClick(e) {
            var t = e.target.closest('[data-action]');
            if (!t || !root.contains(t)) return;
            switch (t.getAttribute('data-action')) {
                case 'layout':
                    state.layout = t.getAttribute('data-layout').split(',').map(Number);
                    autoArrange(state.sortMode);
                    break;
                case 'fill':
                    state.fillFromLast = !state.fillFromLast;
                    autoArrange(state.sortMode);
                    break;
                case 'rules': openModal(); break;
                case 'import': ui.file.click(); break;
                case 'sort': autoArrange(t.getAttribute('data-mode')); break;
                case 'reverse': reverseSeating(); break;
                case 'clear': clearSeats(); break;
                case 'reset': resetToPage(); break;
                case 'print': printPlan(); break;
            }
        }

        /* ----- cards ----- */

        function buildBadges(student, flags) {
            var row = make('div', 'sp-badges');
            if (student.homeroom) row.appendChild(make('span', 'sp-badge sp-badge-hr', student.homeroom));
            if (flags.sep) row.appendChild(make('span', 'sp-badge sp-badge-sep sp-badge-rule', '⚠️ Sep'));
            if (flags.pair) row.appendChild(make('span', 'sp-badge sp-badge-pair sp-badge-rule', '🔗 Pair'));
            if (flags.front) row.appendChild(make('span', 'sp-badge sp-badge-pos sp-badge-rule', '⬆ Front'));
            else if (flags.back) row.appendChild(make('span', 'sp-badge sp-badge-pos sp-badge-rule', '⬇ Back'));
            return row;
        }

        function renderCard(card, student, isDesk) {
            var rs = rulesFor(student.id);
            var flags = {
                sep: rs.some(function (r) { return r.type === 'SEPARATE'; }),
                pair: rs.some(function (r) { return r.type === 'PAIR'; }),
                front: rs.some(function (r) { return r.type === 'FRONT_ROW'; }),
                back: rs.some(function (r) { return r.type === 'BACK_ROW'; })
            };
            card.classList.remove('sp-has-sep', 'sp-has-pair', 'sp-has-pos');
            if (flags.sep) card.classList.add('sp-has-sep');
            else if (flags.pair) card.classList.add('sp-has-pair');
            else if (flags.front || flags.back) card.classList.add('sp-has-pos');

            card.textContent = '';
            if (isDesk) {
                card.appendChild(make('span', 'sp-first', student.firstName));
                card.appendChild(make('span', 'sp-last', student.surname));
                card.appendChild(buildBadges(student, flags));
            } else {
                card.appendChild(make('span', 'sp-side-name', student.fullName));
                card.appendChild(buildBadges(student, flags));
            }
        }

        function createCard(student, isDesk) {
            var card = make('div', 'sp-card');
            card.dataset.sid = student.id;
            card.draggable = true;
            card.addEventListener('dragstart', function (e) {
                draggingId = student.id;
                e.dataTransfer.setData('text/plain', student.id);
                e.dataTransfer.effectAllowed = 'move';
            });
            card.addEventListener('dragend', function () { draggingId = null; });
            renderCard(card, student, isDesk);
            return card;
        }

        function cardFor(id) {
            return root.querySelector('.sp-card[data-sid="' + id + '"]');
        }

        function refreshCards() {
            Array.prototype.forEach.call(root.querySelectorAll('.sp-card'), function (card) {
                var s = studentById(card.dataset.sid);
                if (s) renderCard(card, s, !!card.parentElement.classList.contains('sp-desk'));
            });
        }

        function updateCount() {
            ui.count.textContent = ui.pool.querySelectorAll('.sp-card').length;
        }

        /* ----- grid ----- */

        function getDesks() {
            return Array.prototype.slice.call(ui.grid.querySelectorAll('.sp-desk'));
        }

        function initGrid() {
            ui.grid.innerHTML = '';
            ui.grid.style.minWidth = (Math.max.apply(null, state.layout) * 72) + 'px';
            var n = 1;
            state.layout.forEach(function (cols, r) {
                var row = make('div', 'sp-row');
                row.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
                for (var c = 0; c < cols; c++) {
                    var desk = make('div', 'sp-desk');
                    desk.dataset.row = r;
                    desk.dataset.col = c;
                    desk.appendChild(make('span', 'sp-desk-num', 'Desk ' + n));
                    desk.addEventListener('dragover', onDeskDragOver);
                    desk.addEventListener('dragleave', onDeskDragLeave);
                    desk.addEventListener('drop', onDeskDrop);
                    row.appendChild(desk);
                    n++;
                }
                ui.grid.appendChild(row);
            });
        }

        function validate() {
            var desks = getDesks();
            var lastRow = state.layout.length - 1;
            var seated = {};
            desks.forEach(function (d) {
                d.classList.remove('sp-conflict');
                var card = d.querySelector('.sp-card');
                if (card) seated[card.dataset.sid] = { desk: d, row: +d.dataset.row, col: +d.dataset.col };
            });
            state.rules.forEach(function (rule) {
                var a = seated[rule.student1Id];
                if (isPositionRule(rule.type)) {
                    if (a && a.row !== (rule.type === 'FRONT_ROW' ? 0 : lastRow)) a.desk.classList.add('sp-conflict');
                    return;
                }
                var b = seated[rule.student2Id];
                if (!a || !b) return;
                var near = adjacent(a, b);
                if ((rule.type === 'SEPARATE' && near) || (rule.type === 'PAIR' && !near)) {
                    a.desk.classList.add('sp-conflict');
                    b.desk.classList.add('sp-conflict');
                }
            });
        }

        /* ----- drag and drop ----- */

        function onDeskDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('sp-drag-over'); }
        function onDeskDragLeave(e) { e.currentTarget.classList.remove('sp-drag-over'); }

        function onDeskDrop(e) {
            e.preventDefault();
            var target = e.currentTarget;
            target.classList.remove('sp-drag-over');
            var id = draggingId || e.dataTransfer.getData('text/plain');
            var dragged = cardFor(id);
            if (!dragged) return;
            var student = studentById(id);
            var source = dragged.parentElement;
            var existing = target.querySelector('.sp-card');
            if (existing === dragged) return;

            if (existing) {
                var other = studentById(existing.dataset.sid);
                var sourceIsDesk = source.classList.contains('sp-desk');
                if (other) renderCard(existing, other, sourceIsDesk);
                source.appendChild(existing);
                if (sourceIsDesk) source.classList.add('sp-occupied');
            } else if (source.classList.contains('sp-desk')) {
                source.classList.remove('sp-occupied');
            }

            if (student) renderCard(dragged, student, true);
            target.classList.add('sp-occupied');
            target.appendChild(dragged);
            draggingId = null;
            validate();
            updateCount();
        }

        function onPoolDrop(e) {
            e.preventDefault();
            var id = draggingId || e.dataTransfer.getData('text/plain');
            var card = cardFor(id);
            if (!card) return;
            var parent = card.parentElement;
            if (parent.classList.contains('sp-desk')) parent.classList.remove('sp-occupied');
            var s = studentById(id);
            if (s) renderCard(card, s, false);
            ui.pool.appendChild(card);
            draggingId = null;
            validate();
            updateCount();
        }

        /* ----- seating actions ----- */

        function clearSeats() {
            setStatus('');
            initGrid();
            ui.pool.innerHTML = '';
            state.students.forEach(function (s) { ui.pool.appendChild(createCard(s, false)); });
            validate();
            updateCount();
        }

        function reverseSeating() {
            var desks = getDesks();
            var cards = desks.map(function (d) { return d.querySelector('.sp-card'); })
                .filter(function (c) { return c !== null; });
            if (!cards.length) return;
            cards.reverse();
            desks.forEach(function (d) {
                d.classList.remove('sp-occupied');
                var c = d.querySelector('.sp-card');
                if (c) d.removeChild(c);
            });
            var targets = state.fillFromLast ? desks.slice().reverse() : desks;
            cards.forEach(function (card, i) {
                if (i < targets.length) {
                    targets[i].classList.add('sp-occupied');
                    targets[i].appendChild(card);
                }
            });
            validate();
            updateCount();
        }

        // Backtracking search for students named in rules; everyone else is filled in afterwards.
        function solve(ruleStudents, deskSlots, randomise) {
            if (!ruleStudents.length) return {};
            if (ruleStudents.length > deskSlots.length) return null;

            var desks = deskSlots.map(function (d, i) { return { index: i, row: +d.dataset.row, col: +d.dataset.col }; });
            var ids = ruleStudents.map(function (s) { return s.id; });
            function shuffle(arr) {
                for (var i = arr.length - 1; i > 0; i--) {
                    var j = Math.floor(Math.random() * (i + 1));
                    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
                }
                return arr;
            }
            if (randomise) shuffle(ids);
            var lastRow = state.layout.length - 1;
            var assignment = {}, used = {}, nodes = 0, MAX_NODES = 120000;

            function has(id) { return Object.prototype.hasOwnProperty.call(assignment, id); }

            function positionOk(id, desk) {
                return state.rules.every(function (rule) {
                    if (rule.student1Id !== id) return true;
                    if (rule.type === 'FRONT_ROW') return desk.row === 0;
                    if (rule.type === 'BACK_ROW') return desk.row === lastRow;
                    return true;
                });
            }

            function allowed(id, desk) {
                if (!positionOk(id, desk)) return false;
                for (var other in assignment) {
                    if (!has(other)) continue;
                    var type = ruleTypeBetween(id, other);
                    if (!type) continue;
                    if (type === 'CONFLICT') return false;
                    var near = adjacent(desk, desks[assignment[other]]);
                    if (type === 'SEPARATE' && near) return false;
                    if (type === 'PAIR' && !near) return false;
                }
                return true;
            }

            function domain(id) {
                return desks.filter(function (d) { return !used[d.index] && allowed(id, d); });
            }

            function forwardCheck() {
                for (var i = 0; i < ids.length; i++) {
                    var id = ids[i];
                    if (has(id)) continue;
                    var dom = domain(id);
                    if (!dom.length) return false;
                    for (var j = 0; j < ids.length; j++) {
                        var o = ids[j];
                        if (o === id || has(o) || ruleTypeBetween(id, o) !== 'PAIR') continue;
                        var odom = domain(o);
                        var ok = dom.some(function (c) {
                            return odom.some(function (oc) { return c.index !== oc.index && adjacent(c, oc); });
                        });
                        if (!ok) return false;
                    }
                }
                return true;
            }

            function search() {
                if (++nodes > MAX_NODES) return false;
                if (Object.keys(assignment).length === ids.length) return true;

                var pick = null, pickDom = null, pickDeg = -1;
                ids.forEach(function (id) {
                    if (has(id)) return;
                    var dom = domain(id);
                    var deg = state.rules.filter(function (r) { return r.student1Id === id || r.student2Id === id; }).length;
                    if (pickDom === null || dom.length < pickDom.length || (dom.length === pickDom.length && deg > pickDeg)) {
                        pick = id; pickDom = dom; pickDeg = deg;
                    }
                });
                if (!pickDom || !pickDom.length) return false;

                function freeNeighbours(d) {
                    return desks.filter(function (x) { return x.index !== d.index && adjacent(d, x) && !used[x.index]; }).length;
                }
                if (randomise) shuffle(pickDom);
                else pickDom.sort(function (a, b) { return freeNeighbours(b) - freeNeighbours(a); });

                for (var k = 0; k < pickDom.length; k++) {
                    var cand = pickDom[k];
                    assignment[pick] = cand.index;
                    used[cand.index] = true;
                    if (forwardCheck() && search()) return true;
                    delete assignment[pick];
                    delete used[cand.index];
                    if (nodes > MAX_NODES) break;
                }
                return false;
            }

            return search() ? assignment : null;
        }

        function autoArrange(mode) {
            state.sortMode = mode || 'DEFAULT';
            setStatus('');
            updateToolbar();

            if (!state.students.length) {
                initGrid();
                ui.pool.innerHTML = '';
                updateCount();
                return;
            }

            var list = state.students.slice();
            if (mode === 'AZ' || mode === 'ZA') {
                var dir = mode === 'AZ' ? 1 : -1;
                list.sort(function (a, b) {
                    var r = String(a.surname).localeCompare(String(b.surname));
                    if (r === 0) r = String(a.firstName).localeCompare(String(b.firstName));
                    return r * dir;
                });
            } else if (mode === 'RANDOM') {
                for (var i = list.length - 1; i > 0; i--) {
                    var j = Math.floor(Math.random() * (i + 1));
                    var t = list[i]; list[i] = list[j]; list[j] = t;
                }
            }

            initGrid();
            ui.pool.innerHTML = '';

            var desks = getDesks();
            if (state.fillFromLast) desks.reverse();
            var capacity = desks.length;

            var byId = {};
            state.students.forEach(function (s) { byId[s.id] = s; });
            var constrainedIds = [];
            state.rules.forEach(function (r) {
                if (constrainedIds.indexOf(r.student1Id) === -1) constrainedIds.push(r.student1Id);
                if (r.student2Id && constrainedIds.indexOf(r.student2Id) === -1) constrainedIds.push(r.student2Id);
            });
            var constrained = constrainedIds.map(function (id) { return byId[id]; }).filter(Boolean);

            var placement = {}, failed = false;
            if (constrained.length > capacity) {
                failed = true;
            } else if (constrained.length) {
                var randomise = mode === 'RANDOM';
                placement = solve(constrained, desks, randomise);
                // A random search can run out of steps; fall back to the steady one before giving up.
                if (!placement && randomise) placement = solve(constrained, desks, false);
                if (!placement) { failed = true; placement = {}; }
            }

            var seatedByDesk = {}, seated = {};
            Object.keys(placement).forEach(function (id) {
                seatedByDesk[placement[id]] = byId[id];
                seated[id] = true;
            });

            var next = 0;
            list.forEach(function (s) {
                if (seated[s.id]) return;
                while (next < capacity && seatedByDesk[next]) next++;
                if (next < capacity) { seatedByDesk[next] = s; seated[s.id] = true; next++; }
            });

            desks.forEach(function (desk, idx) {
                var s = seatedByDesk[idx];
                if (!s) return;
                desk.classList.add('sp-occupied');
                desk.appendChild(createCard(s, true));
            });
            list.forEach(function (s) {
                if (!seated[s.id]) ui.pool.appendChild(createCard(s, false));
            });

            validate();
            updateCount();

            if (failed) {
                setStatus('The seating rules could not all be satisfied automatically (too many rule students for the desks, ' +
                    'or the rules contradict each other). Students are seated in the chosen order and desks breaking a rule are ' +
                    'highlighted red. Edit the rules or pick a larger layout, then arrange again.');
            }
        }

        function resetToPage() {
            if (!window.confirm('Reset this plan to the roster and rules written on the page? Your imported roster and rules will be removed.')) return;
            try { localStorage.removeItem(storageKey); } catch (e) { /* ignore */ }
            defaultsFromConfig();
            autoArrange(cfg.sort || 'DEFAULT');
        }

        /* ----- import ----- */

        function applyRows(rows) {
            if (state.students.length && state.rules.length) {
                if (!window.confirm('Importing a new class list will clear the existing seating rules. Continue?')) return;
            }
            var students = rowsToStudents(rows);
            if (!students.length) {
                setStatus('No students found in that file. It needs a header row with Preferred (or First Name), Surname (or Last Name) and optionally Homeroom.');
                return;
            }
            state.rules = [];
            state.students = students;
            save();
            autoArrange(state.sortMode);
        }

        function onFileChosen(e) {
            var file = e.target.files[0];
            if (!file) return;
            var input = e.target;
            var reader = new FileReader();
            reader.onerror = function () { setStatus('Could not read that file.'); input.value = ''; };
            reader.onload = function (evt) {
                if (/\.csv$/i.test(file.name)) {
                    applyRows(parseCSV(decodeBuffer(evt.target.result)));
                    input.value = '';
                } else {
                    loadXlsx().then(function (XLSX) {
                        var wb = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
                        applyRows(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
                    }).catch(function (err) {
                        setStatus(err.message || 'Could not read that Excel file.');
                    }).then(function () { input.value = ''; });
                }
            };
            reader.readAsArrayBuffer(file);
        }

        /* ----- print (opens just the plan in its own window, so no blank pages from the rest of the docs page) ----- */

        function printPlan() {
            var title = cfg.title || 'Seating Plan';
            var clone = ui.grid.cloneNode(true);
            Array.prototype.forEach.call(clone.querySelectorAll('.sp-badge-rule'), function (n) { n.parentNode.removeChild(n); });
            Array.prototype.forEach.call(clone.querySelectorAll('[class]'), function (n) {
                n.classList.remove('sp-conflict', 'sp-has-sep', 'sp-has-pair', 'sp-has-pos', 'sp-occupied', 'sp-drag-over');
                n.removeAttribute('draggable');
            });
            clone.style.minWidth = '0';
            var win = window.open('', '_blank');
            if (!win) { window.print(); return; }
            win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) +
                '</title><style>' + PRINT_CSS + '</style></head><body><h1>' + esc(title) +
                '</h1><div class="wb">FRONT OF CLASSROOM / WHITEBOARD</div>' + clone.outerHTML + '</body></html>');
            win.document.close();
            win.focus();
            setTimeout(function () { win.print(); }, 250);
        }

        /* ----- rules dialog ----- */

        function buildModal() {
            modal = make('div', 'sp-modal');
            modal.innerHTML =
                '<div class="sp-modal-card" role="dialog" aria-modal="true" aria-label="Seating rules">' +
                '<div class="sp-modal-head"><span>Student Seating Rules &amp; Constraints</span>' +
                '<button type="button" class="sp-modal-close" data-m="close" aria-label="Close">✕</button></div>' +
                '<div class="sp-modal-body">' +
                '<div class="sp-rule-form">' +
                '<div class="sp-c-s1"><select data-m="s1" aria-label="Select first student"></select></div>' +
                '<div class="sp-c-type"><select data-m="type" aria-label="Choose seating rule"></select></div>' +
                '<div class="sp-c-s2" data-m="s2wrap"><select data-m="s2" aria-label="Select second student"></select></div>' +
                '<button type="button" class="sp-btn sp-c-add" data-m="add">Add Rule</button>' +
                '</div>' +
                '<div class="sp-feedback" data-m="feedback" role="status" aria-live="polite"></div>' +
                '<div class="sp-modal-sub">Active Rules</div>' +
                '<div class="sp-rules-list" data-m="list"></div>' +
                '</div></div>';
            document.body.appendChild(modal);

            ['s1', 'type', 's2', 's2wrap', 'feedback', 'list'].forEach(function (k) {
                mui[k] = modal.querySelector('[data-m="' + k + '"]');
            });

            modal.addEventListener('click', function (e) {
                if (e.target === modal) { closeModal(); return; }
                var del = e.target.closest('[data-del]');
                if (del) { deleteRule(del.getAttribute('data-del')); return; }
                var btn = e.target.closest('[data-m]');
                if (!btn) return;
                if (btn.getAttribute('data-m') === 'close') closeModal();
                else if (btn.getAttribute('data-m') === 'add') addRule();
            });
            mui.s1.addEventListener('change', fillStudent2);
            mui.type.addEventListener('change', updateTypeUI);
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') closeModal();
            });
        }

        function openModal() {
            fillTypes();
            fillStudent1();
            renderRules();
            feedback('');
            modal.classList.add('sp-open');
        }

        function closeModal() { if (modal) modal.classList.remove('sp-open'); }

        function feedback(msg, kind) {
            mui.feedback.textContent = msg || '';
            mui.feedback.className = 'sp-feedback' + (kind ? ' sp-' + kind : '');
        }

        function updateTypeUI() {
            mui.s2wrap.style.display = isPositionRule(mui.type.value) ? 'none' : 'block';
        }

        function fillTypes() {
            var current = mui.type.value;
            mui.type.innerHTML = '';
            [
                ['SEPARATE', 'Must Separate From'],
                ['PAIR', 'Keep Together With'],
                ['FRONT_ROW', 'Must Sit In Front Row'],
                ['BACK_ROW', 'Must Sit In Back Row']
            ].forEach(function (o) {
                var opt = make('option', null, o[1]);
                opt.value = o[0];
                mui.type.appendChild(opt);
            });
            if (current) mui.type.value = current;
            updateTypeUI();
        }

        function studentOptions(select, placeholder, skipId) {
            select.innerHTML = '';
            var p = make('option', null, placeholder);
            p.value = '';
            select.appendChild(p);
            state.students.forEach(function (s) {
                if (s.id === skipId) return;
                var o = make('option', null, s.fullName);
                o.value = s.id;
                select.appendChild(o);
            });
        }

        function fillStudent1() {
            studentOptions(mui.s1, state.students.length ? 'Select Student 1...' : 'Import a class list first...', null);
            fillStudent2();
        }

        function fillStudent2() {
            var s1 = mui.s1.value;
            studentOptions(mui.s2, s1 ? 'Select Student 2...' : 'Select Student 1 first...', s1);
        }

        function newRule(s1, s2, type) {
            return {
                id: 'rule-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
                student1Id: s1, student2Id: s2, type: type
            };
        }

        function afterRuleChange(msg) {
            save();
            renderRules();
            refreshCards();
            validate();
            feedback(msg, 'success');
        }

        function addRule() {
            var s1 = mui.s1.value, s2 = mui.s2.value, type = mui.type.value;

            if (isPositionRule(type)) {
                if (!state.students.length) return feedback('Import a class list before adding rules.', 'error');
                if (!s1) return feedback('Please select a student.', 'error');
                if (state.rules.some(function (r) { return r.student1Id === s1 && r.type === type; }))
                    return feedback('That rule already exists.', 'error');
                if (state.rules.some(function (r) { return r.student1Id === s1 && isPositionRule(r.type) && r.type !== type; }))
                    return feedback('This student already has a front/back row rule. Remove it first, then add the new rule.', 'error');
                state.rules.push(newRule(s1, null, type));
                return afterRuleChange('Rule added.');
            }

            if (state.students.length < 2) return feedback('Import a class list with at least two students before adding rules.', 'error');
            if (!s1 || !s2) return feedback('Please select both students.', 'error');
            if (s1 === s2) return feedback('Choose two different students.', 'error');

            var between = state.rules.filter(function (r) {
                return (r.student1Id === s1 && r.student2Id === s2) || (r.student1Id === s2 && r.student2Id === s1);
            });
            if (between.some(function (r) { return r.type === type; })) return feedback('That rule already exists.', 'error');
            if (between.length) return feedback('These students already have the opposite rule. Remove it first, then add the new rule.', 'error');

            state.rules.push(newRule(s1, s2, type));
            afterRuleChange('Rule added.');
            mui.s2.value = '';
        }

        function deleteRule(id) {
            state.rules = state.rules.filter(function (r) { return r.id !== id; });
            afterRuleChange('Rule removed.');
        }

        function renderRules() {
            mui.list.innerHTML = '';
            var shown = 0;
            state.rules.forEach(function (r) {
                var s1 = studentById(r.student1Id);
                if (!s1) return;
                var item = make('div'), label = make('span');
                function strong(t) { var s = make('strong', null, t); label.appendChild(s); }
                function text(t) { label.appendChild(document.createTextNode(t)); }

                if (isPositionRule(r.type)) {
                    item.className = 'sp-rule-item sp-pos';
                    strong(s1.fullName);
                    text(r.type === 'FRONT_ROW' ? ' ⬆ must sit in the front row' : ' ⬇ must sit in the back row');
                } else {
                    var s2 = studentById(r.student2Id);
                    if (!s2) return;
                    var sep = r.type === 'SEPARATE';
                    item.className = 'sp-rule-item ' + (sep ? 'sp-sep' : 'sp-pair');
                    strong(s1.fullName);
                    text(sep ? ' ⚠️ separate from ' : ' 🔗 keep with ');
                    strong(s2.fullName);
                }
                var del = make('button', 'sp-del-rule', '✕');
                del.type = 'button';
                del.setAttribute('data-del', r.id);
                del.setAttribute('aria-label', 'Remove rule');
                item.appendChild(label);
                item.appendChild(del);
                mui.list.appendChild(item);
                shown++;
            });
            if (!shown) {
                mui.list.appendChild(make('div', 'sp-rules-empty',
                    'No rules defined yet. Add a rule above to flag students who should sit apart, together, or in the front or back row.'));
            }
        }

        /* ----- start ----- */

        defaultsFromConfig();
        load();
        build();
        buildModal();
        autoArrange(state.sortMode);
    }

    function init() {
        Array.prototype.forEach.call(document.querySelectorAll('.seatingplan[data-seatingplan]'), function (el) {
            if (el.getAttribute('data-sp-ready')) return;
            el.setAttribute('data-sp-ready', '1');
            try {
                new SeatingPlan(el, JSON.parse(el.getAttribute('data-seatingplan')));
            } catch (err) {
                if (window.console) console.error('seatingplan failed:', err);
                el.textContent = 'Seating plan failed to load: ' + (err && err.message ? err.message : err);
                el.style.padding = '12px';
                el.style.color = '#b91c1c';
            }
        });
    }

    if (window.console) console.log('seatingplan.js loaded');
    init();
    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('load', init);
})();