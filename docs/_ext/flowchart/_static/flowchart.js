/* flowchart directive: pseudocode -> interactive flowchart
 * Parts: 1 expressions, 2 pseudocode parser, 3 shapes + layout, 4 interpreter, 5 widget UI
 */
(function (root) {
  'use strict';

  var FONT_FAMILY = 'Arial, Helvetica, sans-serif';
  var FONT_SIZE = 14;
  var LINE_H = 18;
  var GAP = 30;
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------------
   * 1. Expressions
   * ------------------------------------------------------------------ */
  var TOKEN_RE = /\s*(?:(\d+\.\d+|\d+|\.\d+)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|“[^”]*”)|([A-Za-z_]\w*)|(<=|>=|<>|!=|==|[=<>+\-*\/^(),≠≤≥×÷%]))/y;
  var WORD_OPS = { AND: 1, OR: 1, NOT: 1, MOD: 1, DIV: 1, TRUE: 1, FALSE: 1 };

  function tokenize(text) {
    var out = [], m;
    TOKEN_RE.lastIndex = 0;
    var pos = 0;
    while (pos < text.length) {
      if (/^\s*$/.test(text.slice(pos))) break;
      TOKEN_RE.lastIndex = pos;
      m = TOKEN_RE.exec(text);
      if (!m) throw new Error('Cannot read: ' + text.slice(pos));
      pos = TOKEN_RE.lastIndex;
      if (m[1] !== undefined) out.push({ t: 'num', v: parseFloat(m[1]) });
      else if (m[2] !== undefined) out.push({ t: 'str', v: m[2].slice(1, -1) });
      else if (m[3] !== undefined) {
        var up = m[3].toUpperCase();
        if (WORD_OPS[up]) out.push({ t: 'op', v: up });
        else out.push({ t: 'id', v: m[3] });
      } else out.push({ t: 'op', v: m[4] });
    }
    return out;
  }

  function parseExpr(text) {
    var toks = tokenize(text), i = 0;
    function peek(v) { return i < toks.length && toks[i].t === 'op' && toks[i].v === v; }
    function peekAny(list) { return i < toks.length && toks[i].t === 'op' && list.indexOf(toks[i].v) >= 0; }
    function orE() { var a = andE(); while (peek('OR')) { i++; a = { k: 'bin', op: 'OR', a: a, b: andE() }; } return a; }
    function andE() { var a = notE(); while (peek('AND')) { i++; a = { k: 'bin', op: 'AND', a: a, b: notE() }; } return a; }
    function notE() { if (peek('NOT')) { i++; return { k: 'un', op: 'NOT', a: notE() }; } return cmpE(); }
    function cmpE() {
      var a = addE();
      if (peekAny(['=', '==', '≠', '<>', '!=', '<', '>', '<=', '>=', '≤', '≥'])) {
        var op = toks[i++].v;
        a = { k: 'bin', op: op, a: a, b: addE() };
      }
      return a;
    }
    function addE() { var a = mulE(); while (peekAny(['+', '-'])) { var op = toks[i++].v; a = { k: 'bin', op: op, a: a, b: mulE() }; } return a; }
    function mulE() { var a = unE(); while (peekAny(['*', '×', '/', '÷', 'MOD', 'DIV', '%'])) { var op = toks[i++].v; a = { k: 'bin', op: op, a: a, b: unE() }; } return a; }
    function unE() { if (peek('-')) { i++; return { k: 'un', op: '-', a: unE() }; } return powE(); }
    function powE() { var a = prim(); if (peek('^')) { i++; a = { k: 'bin', op: '^', a: a, b: unE() }; } return a; }
    function prim() {
      var t = toks[i];
      if (!t) throw new Error('Unexpected end');
      if (t.t === 'num') { i++; return { k: 'lit', v: t.v }; }
      if (t.t === 'str') { i++; return { k: 'lit', v: t.v }; }
      if (t.t === 'op' && (t.v === 'TRUE' || t.v === 'FALSE')) { i++; return { k: 'lit', v: t.v === 'TRUE' }; }
      if (t.t === 'id') {
        i++;
        if (peek('(')) {
          i++;
          var args = [];
          if (!peek(')')) { args.push(orE()); while (peek(',')) { i++; args.push(orE()); } }
          if (!peek(')')) throw new Error('Missing )');
          i++;
          return { k: 'call', n: t.v, args: args };
        }
        return { k: 'var', n: t.v };
      }
      if (peek('(')) { i++; var e = orE(); if (!peek(')')) throw new Error('Missing )'); i++; return e; }
      throw new Error('Unexpected ' + t.v);
    }
    var e = orE();
    if (i < toks.length) throw new Error('Unexpected ' + toks[i].v);
    return e;
  }

  function tryExpr(text) { try { return parseExpr(text); } catch (err) { return null; } }

  function fmt(v) {
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'number') return String(parseFloat(v.toFixed(10)));
    return String(v);
  }
  function show(v) { return typeof v === 'string' ? '"' + v + '"' : fmt(v); }

  function num(v, op) {
    if (typeof v !== 'number') throw new Error('Cannot use ' + op + ' with ' + show(v) + ' (it is not a number)');
    return v;
  }
  function truthy(v, what) {
    if (typeof v !== 'boolean') throw new Error((what || 'The condition') + ' must be TRUE or FALSE, but it is ' + show(v));
    return v;
  }
  var FUNCS = {
    str: function (a) { return fmt(a); },
    int: function (a) { var n = Math.trunc(Number(a)); if (isNaN(n)) throw new Error('int() needs a number'); return n; },
    float: function (a) { var n = Number(a); if (isNaN(n)) throw new Error('float() needs a number'); return n; },
    abs: function (a) { return Math.abs(num(a, 'abs')); },
    sqrt: function (a) { return Math.sqrt(num(a, 'sqrt')); },
    round: function (a, d) { var p = Math.pow(10, d || 0); return Math.round(num(a, 'round') * p) / p; },
    len: function (a) { return String(a).length; },
    upper: function (a) { return String(a).toUpperCase(); },
    lower: function (a) { return String(a).toLowerCase(); },
    max: function () { return Math.max.apply(null, arguments); },
    min: function () { return Math.min.apply(null, arguments); }
  };

  function valuesEqual(a, b) { return a === b; }

  function evalExpr(e, vars) {
    switch (e.k) {
      case 'lit': return e.v;
      case 'var':
        if (!Object.prototype.hasOwnProperty.call(vars, e.n)) throw new Error('The variable ' + e.n + ' has no value yet');
        return vars[e.n];
      case 'call':
        var f = FUNCS[e.n.toLowerCase()];
        if (!f) throw new Error('Unknown function ' + e.n + '()');
        return f.apply(null, e.args.map(function (a) { return evalExpr(a, vars); }));
      case 'un':
        var u = evalExpr(e.a, vars);
        return e.op === 'NOT' ? !truthy(u, 'NOT') : -num(u, '-');
      case 'bin':
        if (e.op === 'AND') return truthy(evalExpr(e.a, vars), 'AND') && truthy(evalExpr(e.b, vars), 'AND');
        if (e.op === 'OR') return truthy(evalExpr(e.a, vars), 'OR') || truthy(evalExpr(e.b, vars), 'OR');
        var a = evalExpr(e.a, vars), b = evalExpr(e.b, vars);
        switch (e.op) {
          case '+': return (typeof a === 'string' || typeof b === 'string') ? fmt(a) + fmt(b) : num(a, '+') + num(b, '+');
          case '-': return num(a, '-') - num(b, '-');
          case '*': case '×': return num(a, '*') * num(b, '*');
          case '/': case '÷':
            if (num(b, '/') === 0) throw new Error('Cannot divide by zero');
            return num(a, '/') / b;
          case 'DIV':
            if (num(b, 'DIV') === 0) throw new Error('Cannot divide by zero');
            return Math.floor(num(a, 'DIV') / b);
          case 'MOD': case '%':
            if (num(b, 'MOD') === 0) throw new Error('Cannot divide by zero');
            return ((num(a, 'MOD') % b) + b) % b;
          case '^': return Math.pow(num(a, '^'), num(b, '^'));
          case '=': case '==': return valuesEqual(a, b);
          case '≠': case '<>': case '!=': return !valuesEqual(a, b);
        }
        if (typeof a !== typeof b) throw new Error('Cannot compare ' + show(a) + ' with ' + show(b));
        switch (e.op) {
          case '<': return a < b;
          case '>': return a > b;
          case '<=': case '≤': return a <= b;
          case '>=': case '≥': return a >= b;
        }
    }
    throw new Error('Cannot work out this expression');
  }

  function parseInputValue(text) {
    var t = text.trim();
    if (/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return parseFloat(t);
    if (/^true$/i.test(t)) return true;
    if (/^false$/i.test(t)) return false;
    var m = /^"(.*)"$/.exec(t);
    return m ? m[1] : t;
  }

  /* ------------------------------------------------------------------
   * 2. Pseudocode parser
   * ------------------------------------------------------------------ */
  var RE = {
    header: /^(ALGORITHM|PROGRAM|MAIN PROGRAM)\b/,
    start: /^(BEGIN|START)$/,
    end: /^(END|STOP|END PROGRAM)$/,
    ifThen: /^IF\s+(.+?)(?:\s+THEN)?$/,
    elseif: /^(?:ELSEIF|ELSE\s+IF|ELIF)\s+(.+?)(?:\s+THEN)?$/,
    els: /^ELSE$/,
    endif: /^(ENDIF|END\s+IF)$/,
    whil: /^WHILE\s+(.+?)(?:\s+DO)?$/,
    endwhile: /^(ENDWHILE|END\s+WHILE)$/,
    repeat: /^REPEAT$/,
    until: /^UNTIL\s+(.+)$/,
    doo: /^DO$/,
    forr: /^FOR\s+([A-Za-z_]\w*)\s*(?:←|<-|=)\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/,
    endfor: /^(NEXT(\s+\w+)?|ENDFOR|END\s+FOR)$/,
    caseOf: /^CASE\s+(.+?)\s+OF$/,
    endcase: /^(ENDCASE|END\s+CASE)$/,
    label: /^(.*\S)\s*:$/,
    inputTo: /^([A-Za-z_]\w*)\s*(?:←|<-)\s*(INPUT|GET)\b\s*(.*)$/,
    input: /^(INPUT|GET|READ)\s+(.+)$/,
    output: /^(PRINT|OUTPUT|DISPLAY|WRITE|SHOW)\s+(.+)$/,
    assign: /^([A-Za-z_]\w*)\s*(←|<-|=)\s*(.+)$/
  };
  var CLOSER = /^(ELSEIF\b|ELSE\s+IF\b|ELIF\b|ELSE$|ENDIF$|END\s+IF$|ENDWHILE$|END\s+WHILE$|UNTIL\b|NEXT\b|ENDFOR$|END\s+FOR$|ENDCASE$|END\s+CASE$)/;

  function splitComment(line) {
    var inStr = null;
    for (var i = 0; i < line.length - 1; i++) {
      var c = line[i];
      if (inStr) { if (c === inStr) inStr = null; }
      else if (c === '"' || c === "'") inStr = c;
      else if (c === '/' && line[i + 1] === '/') return [line.slice(0, i).replace(/\s+$/, ''), line.slice(i + 2).trim()];
    }
    return [line, null];
  }

  function splitTop(text) {
    var parts = [], depth = 0, inStr = null, cur = '';
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inStr) { if (c === inStr) inStr = null; cur += c; continue; }
      if (c === '"' || c === "'") { inStr = c; cur += c; continue; }
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (c === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    parts.push(cur.trim());
    return parts;
  }

  function stripParens(t) {
    t = t.trim();
    if (t[0] !== '(' || t[t.length - 1] !== ')') return t;
    var depth = 0;
    for (var i = 0; i < t.length; i++) {
      if (t[i] === '(') depth++;
      if (t[i] === ')') { depth--; if (depth === 0 && i < t.length - 1) return t; }
    }
    return t.slice(1, -1).trim();
  }

  function parseProgram(src) {
    var raw = src.replace(/\t/g, '    ').split(/\r?\n/);
    while (raw.length && !raw[0].trim()) raw.shift();
    while (raw.length && !raw[raw.length - 1].trim()) raw.pop();
    var minIndent = Infinity;
    raw.forEach(function (l) { if (l.trim()) minIndent = Math.min(minIndent, l.match(/^ */)[0].length); });
    if (!isFinite(minIndent)) minIndent = 0;
    var L = raw.map(function (l, idx) {
      var sc = splitComment(l.slice(minIndent));
      return { n: idx, text: sc[0], label: sc[1], indent: sc[0].match(/^ */)[0].length, code: sc[0].trim() };
    });
    var prog = { lines: L, body: [], runnable: true, badLine: null, name: null };
    var p = 0;

    function bad(ln) { if (prog.runnable) { prog.runnable = false; prog.badLine = ln.n; } }
    function cond(text, ln) {
      var t = stripParens(text);
      var e = tryExpr(t);
      if (!e) bad(ln);
      return { text: t, expr: e };
    }

    function block(stop) {
      var out = [];
      while (p < L.length) {
        var ln = L[p];
        if (!ln.code) { p++; continue; }
        if (stop && stop(ln)) break;
        if (CLOSER.test(ln.code)) { p++; continue; } // stray closer: ignore
        out.push(statement(ln));
      }
      return out;
    }

    function statement(ln) {
      var c = ln.code, m;
      if (RE.header.test(c)) { p++; prog.name = c.replace(RE.header, '').trim(); return { t: 'header', line: ln.n }; }
      if (RE.start.test(c)) { p++; return { t: 'start', line: ln.n }; }
      if (RE.end.test(c)) { p++; return { t: 'end', line: ln.n }; }
      if (RE.caseOf.test(c)) return parseCase(ln);
      if ((m = RE.ifThen.exec(c))) return parseIf(ln, m[1]);
      if ((m = RE.whil.exec(c))) {
        p++;
        var w = { t: 'while', line: ln.n, cond: cond(m[1], ln), label: ln.label };
        w.body = block(function (l) { return RE.endwhile.test(l.code); });
        if (p < L.length) { w.endLine = L[p].n; p++; }
        return w;
      }
      if (RE.repeat.test(c) || RE.doo.test(c)) {
        var isDo = RE.doo.test(c);
        p++;
        var r = { t: 'post', kind: isDo ? 'dowhile' : 'until', line: ln.n };
        r.body = block(isDo
          ? function (l) { return /^WHILE\b/.test(l.code) && l.indent <= ln.indent; }
          : function (l) { return RE.until.test(l.code); });
        if (p < L.length) {
          var cl = L[p];
          var cm = isDo ? RE.whil.exec(cl.code) : RE.until.exec(cl.code);
          r.cond = cond(cm[1], cl); r.condLine = cl.n; r.label = cl.label; p++;
        } else { r.cond = { text: '?', expr: null }; r.condLine = ln.n; bad(ln); }
        return r;
      }
      if ((m = RE.forr.exec(c))) {
        p++;
        var f = { t: 'for', line: ln.n, v: m[1], fromText: m[2], toText: m[3], stepText: m[4] || null };
        f.from = tryExpr(m[2]); f.to = tryExpr(m[3]); f.step = m[4] ? tryExpr(m[4]) : { k: 'lit', v: 1 };
        if (!f.from || !f.to || !f.step) bad(ln);
        f.body = block(function (l) { return RE.endfor.test(l.code); });
        if (p < L.length) { f.endLine = L[p].n; p++; }
        return f;
      }
      p++;
      if ((m = RE.inputTo.exec(c))) {
        var pe = m[3] ? tryExpr(m[3]) : null;
        if (m[3] && !pe) bad(ln);
        return { t: 'input', line: ln.n, kw: m[2], vars: [m[1]], prompt: pe, promptText: m[3] || '', label: ln.label };
      }
      if ((m = RE.input.exec(c))) {
        var rest = m[2].trim();
        if (/^["'“]/.test(rest)) {
          var pr = tryExpr(rest);
          if (!pr) bad(ln);
          return { t: 'input', line: ln.n, kw: m[1], vars: [], prompt: pr, promptText: rest, label: ln.label };
        }
        var names = splitTop(rest);
        if (names.every(function (nm) { return /^[A-Za-z_]\w*$/.test(nm); })) {
          return { t: 'input', line: ln.n, kw: m[1], vars: names, prompt: null, promptText: '', label: ln.label };
        }
        bad(ln);
        return { t: 'generic', line: ln.n, kind: 'io', head: cap(m[1]), text: rest, label: ln.label };
      }
      if ((m = RE.output.exec(c))) {
        var oe = tryExpr(m[2]);
        if (!oe) bad(ln);
        return { t: 'output', line: ln.n, kw: m[1], expr: oe, text: m[2].trim(), label: ln.label };
      }
      if ((m = RE.assign.exec(c)) && !WORD_OPS[m[1].toUpperCase()]) {
        var ae = tryExpr(m[3]);
        if (!ae) bad(ln);
        return { t: 'assign', line: ln.n, v: m[1], expr: ae, text: m[3].trim(), label: ln.label };
      }
      bad(ln);
      return { t: 'generic', line: ln.n, kind: 'process', head: null, text: c, label: ln.label };
    }

    function isIfStop(l) { return RE.elseif.test(l.code) || RE.els.test(l.code) || RE.endif.test(l.code); }

    function parseIf(ln, condText) {
      var s = { t: 'if', line: ln.n, branches: [], els: null, endLine: null };
      p++;
      var br = { line: ln.n, cond: cond(condText, ln), label: ln.label };
      br.body = block(isIfStop);
      s.branches.push(br);
      while (p < L.length) {
        var l = L[p], m;
        if ((m = RE.elseif.exec(l.code))) {
          p++;
          var b2 = { line: l.n, cond: cond(m[1], l), label: l.label };
          b2.body = block(isIfStop);
          s.branches.push(b2);
        } else if (RE.els.test(l.code)) {
          p++;
          s.els = { line: l.n, body: block(isIfStop) };
        } else if (RE.endif.test(l.code)) {
          s.endLine = l.n; p++; break;
        } else break;
      }
      return s;
    }

    function parseCase(ln) {
      var m = RE.caseOf.exec(ln.code);
      var s = { t: 'case', line: ln.n, exprText: m[1], expr: tryExpr(m[1]), cases: [], otherwise: null, endLine: null };
      if (!s.expr) bad(ln);
      p++;
      function caseStop(l) { return RE.endcase.test(l.code) || (RE.label.test(l.code) && !CLOSER.test(l.code)); }
      while (p < L.length) {
        var l = L[p];
        if (!l.code) { p++; continue; }
        if (RE.endcase.test(l.code)) { s.endLine = l.n; p++; break; }
        var lm = RE.label.exec(l.code);
        if (!lm) { p++; continue; }
        p++;
        if (/^(OTHERWISE|DEFAULT|ELSE)$/.test(lm[1])) {
          s.otherwise = { line: l.n, body: block(caseStop) };
        } else {
          var labels = splitTop(lm[1]).map(tryExpr);
          if (labels.some(function (x) { return !x; })) bad(l);
          var cs = { line: l.n, labelText: lm[1], labels: labels, label: l.label };
          cs.body = block(caseStop);
          s.cases.push(cs);
        }
      }
      return s;
    }

    prog.body = block(null);
    return prog;
  }

  function cap(kw) { return kw.charAt(0) + kw.slice(1).toLowerCase(); }

  /* ------------------------------------------------------------------
   * 3. Shapes and layout
   * ------------------------------------------------------------------ */
  var _ctx = null;
  function measure(text, size) {
    size = size || FONT_SIZE;
    if (_ctx === null) {
      try { _ctx = document.createElement('canvas').getContext('2d'); } catch (e) { _ctx = false; }
    }
    if (_ctx) { _ctx.font = size + 'px ' + FONT_FAMILY; return _ctx.measureText(text).width; }
    return text.length * size * 0.52;
  }

  function wrap(text, maxW, size) {
    var out = [];
    String(text).split('\n').forEach(function (para) {
      var words = para.split(/\s+/).filter(Boolean), cur = '';
      words.forEach(function (w) {
        var t = cur ? cur + ' ' + w : w;
        if (cur && measure(t, size) > maxW) { out.push(cur); cur = w; } else cur = t;
      });
      out.push(cur);
    });
    return out;
  }

  function prettyOps(t) {
    // multiplication sign outside strings
    return t.split(/("(?:[^"\\]|\\.)*")/).map(function (part, i) {
      return i % 2 ? part : part.replace(/\s*\*\s*/g, ' × ');
    }).join('');
  }
  function hasArithmetic(e) {
    if (!e) return false;
    if (e.k === 'bin') return true;
    if (e.k === 'un') return true;
    return e.k === 'call';
  }
  function userLabel(label) { return label.replace(/\\n/g, '\n'); }

  /* Build: attach node objects to statements. */
  function buildNodes(prog) {
    var nodes = [];
    function mk(kind, head, body, srcLines, custom) {
      var n = { id: nodes.length, kind: kind, head: head, body: body, lines: srcLines, custom: custom || null };
      n.answer = custom ? custom.replace(/\s+/g, ' ') : ((head ? head + ' ' : '') + body).trim();
      nodes.push(n);
      return n;
    }
    function decision(text, line, custom) {
      return mk('decision', null, text + '?', [line], custom ? userLabel(custom) : null);
    }
    function walk(list) {
      list.forEach(function (s) {
        var cl = s.label ? userLabel(s.label) : null;
        switch (s.t) {
          case 'start': s.node = mk('start', null, 'Start', [s.line]); break;
          case 'end': s.node = mk('end', null, 'End', [s.line]); break;
          case 'input':
            s.node = mk('io', cap(s.kw), s.vars.length ? s.vars.join(', ') : s.promptText, [s.line], cl); break;
          case 'output': s.node = mk('io', cap(s.kw), s.text, [s.line], cl); break;
          case 'assign':
            s.node = mk('process', hasArithmetic(s.expr) ? 'Calculate' : 'Set', s.v + ' = ' + prettyOps(s.text), [s.line], cl); break;
          case 'generic': s.node = mk(s.kind, s.head, s.text, [s.line], cl); break;
          case 'if':
            s.branches.forEach(function (b) { b.node = decision(b.cond.text, b.line, b.label); walk(b.body); });
            if (s.els) walk(s.els.body);
            break;
          case 'while': s.node = decision(s.cond.text, s.line, s.label); walk(s.body); break;
          case 'post': walk(s.body); s.node = decision(s.cond.text, s.condLine, s.label); break;
          case 'for':
            s.nInit = mk('process', 'Set', s.v + ' = ' + s.fromText, [s.line]);
            s.nCond = mk('decision', null, s.v + ' ≤ ' + s.toText + '?', [s.line]);
            walk(s.body);
            s.nIncr = mk('process', 'Calculate', s.v + ' = ' + s.v + ' + ' + (s.stepText || '1'), [s.endLine !== undefined ? s.endLine : s.line]);
            break;
          case 'case':
            s.cases.forEach(function (c) { c.node = decision(s.exprText + ' = ' + c.labelText, c.line, c.label); walk(c.body); });
            if (s.otherwise) walk(s.otherwise.body);
            break;
        }
      });
    }
    walk(prog.body);
    return nodes;
  }

  var WRAP = { decision: 165, io: 190, process: 190, start: 120, end: 120 };

  function nodeTextLines(n) {
    if (n.custom) return wrap(n.custom, WRAP[n.kind]);
    if (n.kind === 'decision') {
      var t = n.body;
      if (measure(t) > WRAP.decision) t = t.replace(/\b(AND|OR)\s+/g, '$1\n');
      return wrap(t, WRAP.decision);
    }
    var lines = n.head ? [n.head] : [];
    return lines.concat(wrap(n.body, WRAP[n.kind]));
  }

  function sizeFor(kind, lines) {
    var tw = 0;
    lines.forEach(function (l) { tw = Math.max(tw, measure(l)); });
    var th = Math.max(1, lines.length) * LINE_H;
    if (kind === 'start' || kind === 'end') return { w: Math.max(90, tw + 36), h: 40 };
    if (kind === 'process') return { w: Math.max(110, tw + 28), h: Math.max(44, th + 18) };
    if (kind === 'io') return { w: Math.max(120, tw + 56), h: Math.max(44, th + 18) };
    var a = tw / 2 + th * 0.9 + 12;
    var b = (th / 2) / (1 - (tw / 2) / a) + 4;
    return { w: Math.max(110, Math.round(2 * a)), h: Math.max(60, Math.round(2 * b)) };
  }

  function sizeNodes(nodes) {
    nodes.forEach(function (n) {
      n.text = nodeTextLines(n);
      var s = sizeFor(n.kind, n.text);
      n.w = s.w; n.h = s.h;
    });
    // blanked shapes of one kind share a size, so size does not give the answer away
    var maxes = {};
    nodes.forEach(function (n) {
      if (!n.blank) return;
      var m = maxes[n.kind] || (maxes[n.kind] = { w: 0, h: 0 });
      m.w = Math.max(m.w, n.w); m.h = Math.max(m.h, n.h);
    });
    nodes.forEach(function (n) { if (n.blank) { n.w = maxes[n.kind].w; n.h = maxes[n.kind].h; } });
  }

  function blk(w, h, ax) { return { w: w, h: h, ax: ax, nodes: [], edges: [], joinTop: false }; }
  function emptyBlk() { var b = blk(0, 0, 0); b.empty = true; return b; }
  function shift(b, dx, dy) {
    b.nodes.forEach(function (n) { n.x += dx; n.y += dy; });
    b.edges.forEach(function (e) {
      e.pts.forEach(function (pt) { pt[0] += dx; pt[1] += dy; });
      if (e.label) { e.label.x += dx; e.label.y += dy; }
    });
  }
  function absorb(dst, b) {
    Array.prototype.push.apply(dst.nodes, b.nodes);
    Array.prototype.push.apply(dst.edges, b.edges);
  }
  function leaf(n) {
    var b = blk(n.w, n.h, n.w / 2);
    n.x = n.w / 2; n.y = 0;
    b.nodes.push(n);
    return b;
  }
  function edge(pts, opts) {
    var e = { pts: pts, head: false };
    if (opts) for (var k in opts) e[k] = opts[k];
    return e;
  }
  function lab(text, x, y, anchor) { return { text: text, x: x, y: y, anchor: anchor || 'start' }; }

  function seq(blocks) {
    blocks = blocks.filter(function (b) { return !b.empty; });
    if (!blocks.length) return emptyBlk();
    var Lx = 0, Rx = 0;
    blocks.forEach(function (b) { Lx = Math.max(Lx, b.ax); Rx = Math.max(Rx, b.w - b.ax); });
    var out = blk(Lx + Rx, 0, Lx), y = 0;
    blocks.forEach(function (b, i) {
      if (i > 0) out.edges.push(edge([[Lx, y - GAP], [Lx, y]], { head: !b.joinTop }));
      shift(b, Lx - b.ax, y);
      absorb(out, b);
      y += b.h + GAP;
    });
    out.h = y - GAP;
    out.joinTop = blocks[0].joinTop;
    return out;
  }

  /* IF ... ELSE ... (one condition): Yes to the left, No to the right. */
  function layoutIfElse(d, T, E, elseLine, endLine) {
    var tl = Math.max(d.w / 2 + 26, (T.w - T.ax) + 14);
    var tr = Math.max(d.w / 2 + 26, E.ax + 14);
    var ax = tl + T.ax;
    var out = blk(ax + tr + (E.w - E.ax), 0, ax);
    d.x = ax; d.y = 0; out.nodes.push(d);
    var cy = d.h / 2, yb = d.h + 14, xT = ax - tl, xE = ax + tr;
    var ym = yb + Math.max(T.h, E.h) + 18;
    function side(B, x, vx, text, anchor, branch, line) {
      var l = lab(text, vx + (anchor === 'end' ? -6 : 6), cy - 6, anchor);
      if (B.empty) {
        out.edges.push(edge([[vx, cy], [x, cy], [x, ym], [ax, ym]], { label: l, from: d.id, branch: branch, line: line }));
        return;
      }
      out.edges.push(edge([[vx, cy], [x, cy], [x, yb]], { head: !B.joinTop, label: l, from: d.id, branch: branch, line: line }));
      shift(B, x - B.ax, yb);
      absorb(out, B);
      out.edges.push(edge([[x, yb + B.h], [x, ym], [ax, ym]], { line: endLine }));
    }
    side(T, xT, ax - d.w / 2, 'Yes', 'end', 'yes');
    side(E, xE, ax + d.w / 2, 'No', 'start', 'no', elseLine);
    out.h = ym;
    return out;
  }

  /* IF with ELSEIFs (or a lone IF): diamonds in a row, Yes down, No across. */
  function layoutChain(ds, Ts, E, elseLine, endLine) {
    var n = ds.length, dh = 0, xs = [], Ls = [], Rs = [], i;
    for (i = 0; i < n; i++) {
      dh = Math.max(dh, ds[i].h);
      Ls.push(Math.max(ds[i].w / 2, Ts[i].ax));
      Rs.push(Math.max(ds[i].w / 2, Ts[i].w - Ts[i].ax));
    }
    xs.push(Ls[0]);
    for (i = 1; i < n; i++) xs.push(xs[i - 1] + Rs[i - 1] + 46 + Ls[i]);
    var cy = dh / 2, yb = dh + GAP, maxH = 0;
    Ts.forEach(function (t) { maxH = Math.max(maxH, t.h); });
    if (E) maxH = Math.max(maxH, E.h);
    var ym = yb + maxH + 18;
    var out = blk(0, ym, xs[0]);
    var right = xs[0];
    for (i = 0; i < n; i++) {
      var d = ds[i], T = Ts[i], x = xs[i];
      d.x = x; d.y = cy - d.h / 2; out.nodes.push(d);
      var yl = lab('Yes', x + 7, cy + d.h / 2 + 15);
      if (T.empty) {
        out.edges.push(edge([[x, cy + d.h / 2], [x, ym]], { label: yl, from: d.id, branch: 'yes' }));
      } else {
        out.edges.push(edge([[x, cy + d.h / 2], [x, yb]], { head: !T.joinTop, label: yl, from: d.id, branch: 'yes' }));
        shift(T, x - T.ax, yb);
        absorb(out, T);
        out.edges.push(edge([[x, yb + T.h], [x, ym]], { line: endLine }));
      }
      var nl = lab('No', x + d.w / 2 + 6, cy - 6);
      if (i < n - 1) {
        out.edges.push(edge([[x + d.w / 2, cy], [xs[i + 1] - ds[i + 1].w / 2, cy]], { head: true, label: nl, from: d.id, branch: 'no' }));
      } else if (E && !E.empty) {
        var xE = x + Math.max(Rs[i] + 24 + E.ax, d.w / 2 + 34);
        out.edges.push(edge([[x + d.w / 2, cy], [xE, cy], [xE, yb]], { head: !E.joinTop, label: nl, from: d.id, branch: 'no', line: elseLine }));
        shift(E, xE - E.ax, yb);
        absorb(out, E);
        out.edges.push(edge([[xE, yb + E.h], [xE, ym]], { line: endLine }));
        right = xE;
        out.w = xE + (E.w - E.ax);
      } else {
        var xo = x + Math.max(Rs[i] + 24, d.w / 2 + 34);
        out.edges.push(edge([[x + d.w / 2, cy], [xo, cy], [xo, ym]], { label: nl, from: d.id, branch: 'no', line: elseLine }));
        right = xo;
        out.w = xo + 8;
      }
    }
    out.edges.push(edge([[xs[0], ym], [right, ym]], { line: endLine }));
    return out;
  }

  /* Pre-test loop (WHILE, FOR). */
  function layoutWhile(d, Bd, backLine) {
    var lead = 20;
    var Lx = Math.max(d.w / 2, Bd.ax), Rx = Math.max(d.w / 2, Bd.w - Bd.ax);
    var xb = 4, ax = Lx + 28;
    var out = blk(0, 0, ax);
    out.joinTop = true;
    out.edges.push(edge([[ax, 0], [ax, lead]], { head: true }));
    d.x = ax; d.y = lead; out.nodes.push(d);
    var y0 = lead + d.h + GAP;
    out.edges.push(edge([[ax, lead + d.h], [ax, y0]], { head: !Bd.joinTop && !Bd.empty, label: lab('Yes', ax + 7, lead + d.h + 15), from: d.id, branch: 'yes' }));
    if (!Bd.empty) { shift(Bd, ax - Bd.ax, y0); absorb(out, Bd); }
    var yB = y0 + Bd.h;
    out.edges.push(edge([[ax, yB], [ax, yB + 14], [xb, yB + 14], [xb, 7], [ax, 7]], { head: true, line: backLine }));
    var xo = ax + Math.max(Rx + 24, d.w / 2 + 34);
    out.edges.push(edge([[ax + d.w / 2, lead + d.h / 2], [xo, lead + d.h / 2], [xo, yB + 32], [ax, yB + 32]],
      { label: lab('No', ax + d.w / 2 + 6, lead + d.h / 2 - 6), from: d.id, branch: 'no' }));
    out.h = yB + 32;
    out.w = xo + 8;
    return out;
  }

  /* Post-test loop (REPEAT..UNTIL, DO..WHILE). */
  function layoutPost(Bd, d, loopText, exitText, loopBranch, startLine) {
    var lead = 20;
    var Lx = Math.max(d.w / 2 + 14, Bd.ax), Rx = Math.max(d.w / 2, Bd.w - Bd.ax);
    var xb = 4, ax = Lx + 28;
    var out = blk(ax + Rx, 0, ax);
    out.joinTop = true;
    out.edges.push(edge([[ax, 0], [ax, lead]], { head: !Bd.joinTop && !Bd.empty, line: startLine }));
    var yd = lead;
    if (!Bd.empty) {
      shift(Bd, ax - Bd.ax, lead); absorb(out, Bd);
      out.edges.push(edge([[ax, lead + Bd.h], [ax, lead + Bd.h + GAP]], { head: true }));
      yd = lead + Bd.h + GAP;
    }
    d.x = ax; d.y = yd; out.nodes.push(d);
    out.edges.push(edge([[ax - d.w / 2, yd + d.h / 2], [xb, yd + d.h / 2], [xb, 7], [ax, 7]],
      { head: true, label: lab(loopText, ax - d.w / 2 - 6, yd + d.h / 2 - 6, 'end'), from: d.id, branch: loopBranch }));
    out.edges.push(edge([[ax, yd + d.h], [ax, yd + d.h + 22]],
      { label: lab(exitText, ax + 7, yd + d.h + 15), from: d.id, branch: loopBranch === 'yes' ? 'no' : 'yes' }));
    out.h = yd + d.h + 22;
    return out;
  }

  function layoutList(list) { return seq(list.map(layoutStmt)); }

  function layoutStmt(s) {
    switch (s.t) {
      case 'header': return emptyBlk();
      case 'if':
        if (s.branches.length === 1 && s.els) {
          return layoutIfElse(s.branches[0].node, layoutList(s.branches[0].body), layoutList(s.els.body), s.els.line, s.endLine);
        }
        return layoutChain(s.branches.map(function (b) { return b.node; }),
          s.branches.map(function (b) { return layoutList(b.body); }),
          s.els ? layoutList(s.els.body) : null, s.els ? s.els.line : undefined, s.endLine);
      case 'case':
        return layoutChain(s.cases.map(function (c) { return c.node; }),
          s.cases.map(function (c) { return layoutList(c.body); }),
          s.otherwise ? layoutList(s.otherwise.body) : null, s.otherwise ? s.otherwise.line : undefined, s.endLine);
      case 'while': return layoutWhile(s.node, layoutList(s.body), s.endLine);
      case 'post':
        return s.kind === 'until'
          ? layoutPost(layoutList(s.body), s.node, 'No', 'Yes', 'no', s.line)
          : layoutPost(layoutList(s.body), s.node, 'Yes', 'No', 'yes', s.line);
      case 'for':
        return seq([leaf(s.nInit), layoutWhile(s.nCond, seq([layoutList(s.body), leaf(s.nIncr)]), s.endLine)]);
      default: return leaf(s.node);
    }
  }

  function layoutProgram(prog) {
    var b = layoutList(prog.body);
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    function grow(x, y) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    b.nodes.forEach(function (n) { grow(n.x - n.w / 2, n.y); grow(n.x + n.w / 2, n.y + n.h); });
    b.edges.forEach(function (e) {
      e.pts.forEach(function (pt) { grow(pt[0], pt[1]); });
      if (e.label) {
        var w = measure(e.label.text, 12);
        grow(e.label.anchor === 'end' ? e.label.x - w : e.label.x, e.label.y - 12);
        grow(e.label.anchor === 'end' ? e.label.x : e.label.x + w, e.label.y + 3);
      }
    });
    if (!isFinite(x0)) { x0 = y0 = 0; x1 = y1 = 10; }
    var pad = 8;
    shift(b, pad - x0, pad - y0);
    b.w = x1 - x0 + 2 * pad; b.h = y1 - y0 + 2 * pad;
    return b;
  }

  /* ------------------------------------------------------------------
   * 4. Interpreter (a generator: one yield per shape visited)
   * ------------------------------------------------------------------ */
  function* runProgram(prog, vars, out) {
    function* list(L) { for (var i = 0; i < L.length; i++) { if (yield* stmt(L[i])) return true; } return false; }
    function decide(node, c, extra) {
      var r = truthy(evalExpr(c.expr, vars));
      return { ev: { node: node.id, branch: r ? 'yes' : 'no', msg: c.text + ' is ' + (r ? 'TRUE' : 'FALSE') + ', so follow ' + (r ? 'Yes' : 'No') + (extra || '') + '.' }, r: r };
    }
    function* stmt(s) {
      var d, i;
      switch (s.t) {
        case 'header': return false;
        case 'start': yield { node: s.node.id, msg: 'Start of the algorithm.' }; return false;
        case 'end': yield { node: s.node.id, msg: 'End of the algorithm.', done: true }; return true;
        case 'input':
          var promptText = s.prompt ? fmt(evalExpr(s.prompt, vars)) : '';
          if (!s.vars.length) { out.push(promptText); yield { node: s.node.id, msg: 'Asks: ' + promptText }; return false; }
          var vals = yield { node: s.node.id, input: { vars: s.vars, prompt: promptText }, msg: 'Type ' + (s.vars.length > 1 ? 'values' : 'a value') + ' for ' + s.vars.join(', ') + '.' };
          s.vars.forEach(function (v, k) { vars[v] = vals[k]; });
          yield { node: s.node.id, changed: s.vars, msg: s.vars.map(function (v) { return v + ' is now ' + show(vars[v]); }).join(', ') + '.' };
          return false;
        case 'output':
          var o = fmt(evalExpr(s.expr, vars));
          out.push(o);
          yield { node: s.node.id, msg: 'Prints: ' + o };
          return false;
        case 'assign':
          vars[s.v] = evalExpr(s.expr, vars);
          yield { node: s.node.id, changed: [s.v], msg: s.v + ' gets ' + show(vars[s.v]) + '.' };
          return false;
        case 'if':
          for (i = 0; i < s.branches.length; i++) {
            d = decide(s.branches[i].node, s.branches[i].cond);
            yield d.ev;
            if (d.r) return yield* list(s.branches[i].body);
          }
          return s.els ? yield* list(s.els.body) : false;
        case 'case':
          var val = evalExpr(s.expr, vars);
          for (i = 0; i < s.cases.length; i++) {
            var c = s.cases[i];
            var hit = c.labels.some(function (l) { return valuesEqual(evalExpr(l, vars), val); });
            yield { node: c.node.id, branch: hit ? 'yes' : 'no', msg: s.exprText + ' is ' + show(val) + ', so follow ' + (hit ? 'Yes' : 'No') + '.' };
            if (hit) return yield* list(c.body);
          }
          return s.otherwise ? yield* list(s.otherwise.body) : false;
        case 'while':
          for (;;) {
            d = decide(s.node, s.cond);
            yield d.ev;
            if (!d.r) return false;
            if (yield* list(s.body)) return true;
          }
        case 'post':
          for (;;) {
            if (yield* list(s.body)) return true;
            d = decide(s.node, s.cond);
            yield d.ev;
            if (s.kind === 'until' ? d.r : !d.r) return false;
          }
        case 'for':
          vars[s.v] = evalExpr(s.from, vars);
          yield { node: s.nInit.id, changed: [s.v], msg: s.v + ' gets ' + show(vars[s.v]) + '.' };
          for (;;) {
            var to = evalExpr(s.to, vars), step = evalExpr(s.step, vars);
            var go = step >= 0 ? vars[s.v] <= to : vars[s.v] >= to;
            yield { node: s.nCond.id, branch: go ? 'yes' : 'no', msg: s.v + ' is ' + show(vars[s.v]) + ', so follow ' + (go ? 'Yes' : 'No') + '.' };
            if (!go) return false;
            if (yield* list(s.body)) return true;
            vars[s.v] = num(vars[s.v], '+') + step;
            yield { node: s.nIncr.id, changed: [s.v], msg: s.v + ' gets ' + show(vars[s.v]) + '.' };
          }
        default:
          throw new Error('This line cannot be run');
      }
    }
    yield* list(prog.body);
  }

  /* Flow graph of the answer: which shape leads to which (used to check drawings). */
  function flowEdges(prog) {
    var edges = [];
    function add(from, to, label) { if (to !== null) edges.push({ from: from, to: to, label: label || '' }); }
    function list(L, follow) {
      for (var i = L.length - 1; i >= 0; i--) follow = one(L[i], follow);
      return follow;
    }
    function chain(branches, elseBody, follow) {
      var next = elseBody ? list(elseBody, follow) : follow;
      for (var i = branches.length - 1; i >= 0; i--) {
        add(branches[i].node.id, list(branches[i].body, follow), 'yes');
        add(branches[i].node.id, next, 'no');
        next = branches[i].node.id;
      }
      return next;
    }
    function one(s, follow) {
      var entry;
      switch (s.t) {
        case 'header': return follow;
        case 'end': return s.node.id;
        case 'if': return chain(s.branches, s.els ? s.els.body : null, follow);
        case 'case': return chain(s.cases, s.otherwise ? s.otherwise.body : null, follow);
        case 'while':
          add(s.node.id, list(s.body, s.node.id), 'yes');
          add(s.node.id, follow, 'no');
          return s.node.id;
        case 'post':
          entry = list(s.body, s.node.id);
          add(s.node.id, entry, s.kind === 'until' ? 'no' : 'yes');
          add(s.node.id, follow, s.kind === 'until' ? 'yes' : 'no');
          return entry;
        case 'for':
          add(s.nInit.id, s.nCond.id);
          add(s.nIncr.id, s.nCond.id);
          add(s.nCond.id, list(s.body, s.nIncr.id), 'yes');
          add(s.nCond.id, follow, 'no');
          return s.nInit.id;
        default:
          add(s.node.id, follow);
          return s.node.id;
      }
    }
    list(prog.body, null);
    return edges;
  }

  /* Orthogonal route between two ports. Sides: t r b l. */
  var SIDE = { t: [0, -1], r: [1, 0], b: [0, 1], l: [-1, 0] };
  function port(sh, side) {
    var cy = sh.y + sh.h / 2;
    if (side === 't') return [sh.x, sh.y];
    if (side === 'b') return [sh.x, sh.y + sh.h];
    if (side === 'l') return [sh.x - sh.w / 2 + (sh.kind === 'io' ? 7 : 0), cy];
    return [sh.x + sh.w / 2 - (sh.kind === 'io' ? 7 : 0), cy];
  }
  function routeArrow(p1, s1, p2, s2) {
    var d1 = SIDE[s1], d2 = SIDE[s2], stub = 18;
    var a = [p1[0] + d1[0] * stub, p1[1] + d1[1] * stub];
    var b = [p2[0] + d2[0] * stub, p2[1] + d2[1] * stub];
    function cost(c) {
      var v = 0;
      if ((c[0] - a[0]) * d1[0] + (c[1] - a[1]) * d1[1] < 0) v++;
      if ((b[0] - c[0]) * d2[0] + (b[1] - c[1]) * d2[1] > 0) v++;
      return v;
    }
    var c1 = [b[0], a[1]], c2 = [a[0], b[1]];
    var c = cost(c1) <= cost(c2) ? c1 : c2;
    return tidyPath([p1, a, c, b, p2]);
  }
  /* Drop repeated points and points in the middle of a straight run. */
  function tidyPath(pts) {
    var out = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var q = pts[i], last = out[out.length - 1];
      if (q[0] === last[0] && q[1] === last[1]) continue;
      if (out.length > 1) {
        var prev = out[out.length - 2];
        if ((prev[0] === last[0] && last[0] === q[0]) || (prev[1] === last[1] && last[1] === q[1])) { out[out.length - 1] = q; continue; }
      }
      out.push(q);
    }
    if (out.length < 2) out.push([out[0][0], out[0][1]]);
    return out;
  }
  /* Route through the corner points a student clicked.
     end is { pt, side } for a port on a shape, { pt, axis } to meet another line at right angles
     (axis is the direction of the last segment, 'h' or 'v'), or { pt } for a loose end. */
  function routeVia(p1, s1, via, end) {
    var d1 = SIDE[s1], cur = [p1[0] + d1[0] * 18, p1[1] + d1[1] * 18];
    var pts = [p1, cur], lastAxis = d1[0] ? 'h' : 'v', firstLeg = true;
    function leg(q, arrive) {
      if (cur[0] !== q[0] && cur[1] !== q[1]) {
        var first = arrive ? (arrive === 'h' ? 'v' : 'h') : (firstLeg ? lastAxis : (lastAxis === 'h' ? 'v' : 'h'));
        pts.push(first === 'h' ? [q[0], cur[1]] : [cur[0], q[1]]);
        lastAxis = first === 'h' ? 'v' : 'h';
      } else if (cur[0] !== q[0]) lastAxis = 'h';
      else if (cur[1] !== q[1]) lastAxis = 'v';
      pts.push(q);
      cur = q;
      firstLeg = false;
    }
    via.forEach(function (v) { leg(v); });
    if (end.side) {
      var d2 = SIDE[end.side];
      leg([end.pt[0] + d2[0] * 18, end.pt[1] + d2[1] * 18], d2[0] ? 'h' : 'v');
      pts.push(end.pt);
    } else leg(end.pt, end.axis);
    return tidyPath(pts);
  }
  /* A point part-way along a path (t from 0 to 1), and the direction of the path there. */
  function pointAt(pts, t) {
    var lens = [], total = 0, i;
    for (i = 1; i < pts.length; i++) { lens.push(Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1])); total += lens[i - 1]; }
    var want = Math.max(0, Math.min(1, t)) * total;
    for (i = 0; i < lens.length; i++) {
      if (want <= lens[i] || i === lens.length - 1) {
        var f = lens[i] ? Math.min(1, want / lens[i]) : 0, a = pts[i], b = pts[i + 1];
        return { pt: [Math.round(a[0] + (b[0] - a[0]) * f), Math.round(a[1] + (b[1] - a[1]) * f)], axis: a[1] === b[1] && a[0] !== b[0] ? 'h' : 'v' };
      }
      want -= lens[i];
    }
    return { pt: pts[0], axis: 'v' };
  }
  /* How far along a path (0 to 1) the point nearest to x, y is. */
  function nearestOn(pts, x, y) {
    var total = 0, best = Infinity, bestAt = 0, i, lens = [];
    for (i = 1; i < pts.length; i++) { lens.push(Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1])); total += lens[i - 1]; }
    var run = 0;
    for (i = 0; i < lens.length; i++) {
      var a = pts[i], b = pts[i + 1];
      var cx = Math.max(Math.min(a[0], b[0]), Math.min(Math.max(a[0], b[0]), x));
      var cy = Math.max(Math.min(a[1], b[1]), Math.min(Math.max(a[1], b[1]), y));
      var d = Math.abs(cx - x) + Math.abs(cy - y);
      if (d < best) { best = d; bestAt = run + Math.abs(cx - a[0]) + Math.abs(cy - a[1]); }
      run += lens[i];
    }
    return total ? bestAt / total : 0;
  }

  /* ------------------------------------------------------------------
   * 5. Widget
   * ------------------------------------------------------------------ */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function svg(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function highlightCode(text) {
    return text.split(/("(?:[^"\\]|\\.)*")/).map(function (part, i) {
      if (i % 2) return '<span class="fc-str">' + escapeHtml(part) + '</span>';
      return escapeHtml(part).replace(/\b[A-Z]{2,}\b/g, '<span class="fc-kw">$&</span>');
    }).join('');
  }
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
      .replace(/×/g, '*').replace(/\s+/g, '').replace(/\?+$/, '');
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function chooseBlanks(nodes, spec) {
    var parts = String(spec || 'all').toLowerCase().split(/[\s,]+/).filter(Boolean);
    var kinds = {}, lines = {}, all = false;
    parts.forEach(function (p) {
      if (p === 'all') all = true;
      else if (/^\d+$/.test(p)) lines[parseInt(p, 10) - 1] = true;
      else if (/^decision/.test(p)) kinds.decision = true;
      else if (p === 'io' || /^input/.test(p) || /^output/.test(p)) kinds.io = true;
      else if (/^process/.test(p)) kinds.process = true;
    });
    nodes.forEach(function (n) {
      if (n.kind === 'start' || n.kind === 'end') return;
      n.blank = all || !!kinds[n.kind] || n.lines.some(function (l) { return lines[l]; });
    });
  }

  function shapeFor(n) {
    var x = n.x - n.w / 2, y = n.y, w = n.w, h = n.h, sk = 14;
    if (n.kind === 'start' || n.kind === 'end') return svg('rect', { x: x, y: y, width: w, height: h, rx: h / 2, ry: h / 2 });
    if (n.kind === 'process') return svg('rect', { x: x, y: y, width: w, height: h, rx: 2 });
    if (n.kind === 'io') return svg('polygon', { points: [[x + sk, y], [x + w, y], [x + w - sk, y + h], [x, y + h]].join(' ') });
    return svg('polygon', { points: [[n.x, y], [x + w, y + h / 2], [n.x, y + h], [x, y + h / 2]].join(' ') });
  }

  function drawText(g, n, lines, size) {
    var old = g.querySelector('text');
    if (old) g.removeChild(old);
    if (!lines || !lines.length) return;
    size = size || FONT_SIZE;
    var lh = size + 4;
    var t = svg('text', { 'text-anchor': 'middle', 'font-size': size, 'font-family': FONT_FAMILY });
    var top = n.y + n.h / 2 - (lines.length * lh) / 2 + size * 0.82 + 1;
    lines.forEach(function (l, i) {
      var ts = svg('tspan', { x: n.x, y: top + i * lh });
      ts.textContent = l;
      t.appendChild(ts);
    });
    g.appendChild(t);
  }

  function innerWidth(n) {
    if (n.kind === 'decision') return n.w * 0.58;
    if (n.kind === 'io') return n.w - 50;
    return n.w - 20;
  }

  function Widget(host) {
    var cfg = {};
    try { cfg = JSON.parse(host.getAttribute('data-fc') || '{}'); } catch (e) { /* keep defaults */ }
    var srcEl = host.querySelector('.fc-source');
    var srcText = srcEl ? srcEl.textContent : '';
    var prog = parseProgram(srcText);

    /* Work in progress is kept in this browser, so refreshing the page does not lose it.
       The key includes the pseudocode and options, so changing the task starts students afresh. */
    var store = (function () {
      var text = srcText + '|' + cfg.mode + '|' + cfg.blank + '|' + cfg.entry, h = 5381, i;
      for (i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
      var index = Array.prototype.indexOf.call(document.querySelectorAll('.fc-widget'), host);
      var key = 'flowchart:' + root.location.pathname + ':' + index + ':' + (h >>> 0).toString(36);
      return {
        load: function () { try { var v = root.localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
        save: function (data) { try { root.localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* storage not available */ } },
        clear: function () { try { root.localStorage.removeItem(key); } catch (e) { /* storage not available */ } }
      };
    })();
    var nodes = buildNodes(prog);
    var mode = cfg.mode || 'step';
    if (mode === 'step' && !prog.runnable) {
      mode = 'view';
      if (root.console) console.info('flowchart: line ' + (prog.badLine + 1) + ' cannot be run, so this chart is view only: ' + prog.lines[prog.badLine].code);
    }
    if (mode === 'blanks') chooseBlanks(nodes, cfg.blank);
    sizeNodes(nodes);
    var chart = layoutProgram(prog);

    var answerLines = {};
    nodes.forEach(function (n) { answerLines[norm(n.answer)] = n.text; });

    var state = {
      mode: mode, linking: mode !== 'blanks' && mode !== 'draw', pinned: null,
      gen: null, vars: {}, out: [], steps: 0, done: false, waiting: null, timer: null,
      presets: cfg.inputs ? splitTop(cfg.inputs) : [], presetIdx: 0,
      selChip: null, solved: false
    };

    /* ---- DOM skeleton ---- */
    host.textContent = '';
    host.classList.add('fc-ready', 'fc-mode-' + mode);
    var toolbar = el('div', 'fc-toolbar');
    var body = el('div', 'fc-body');
    var left = el('div', 'fc-left');
    var right = el('div', 'fc-right');
    var codeBox = el('ol', 'fc-code');
    var status = el('div', 'fc-status');
    status.setAttribute('aria-live', 'polite');
    var inputForm = el('form', 'fc-inputform');
    var panels = el('div', 'fc-panels');
    var bank = el('div', 'fc-bank');
    var chartBox = el('div', 'fc-chart');
    host.appendChild(toolbar);
    host.appendChild(body);
    body.appendChild(left);
    body.appendChild(right);
    if (!cfg.hideCode) left.appendChild(codeBox);
    if (mode === 'draw' && !cfg.showCode) codeBox.classList.add('fc-code-secret');
    left.appendChild(status);
    left.appendChild(inputForm);
    left.appendChild(panels);
    if (cfg.title) right.appendChild(el('div', 'fc-title', cfg.title));
    right.appendChild(chartBox);
    right.appendChild(bank);

    var layoutMode = mode === 'draw' ? 'stacked' : cfg.layout && cfg.layout !== 'auto' ? cfg.layout : (chart.w > 430 ? 'stacked' : 'side');
    body.classList.add('fc-' + layoutMode);

    /* ---- pseudocode ---- */
    var lineEls = [];
    prog.lines.forEach(function (ln) {
      var li = el('li', 'fc-line');
      li.setAttribute('data-line', ln.n);
      li.innerHTML = ln.text ? highlightCode(ln.text) : '&nbsp;';
      codeBox.appendChild(li);
      lineEls.push(li);
    });

    /* ---- chart ---- */
    var svgEl = svg('svg', {
      'class': 'fc-svg', viewBox: '0 0 ' + chart.w + ' ' + chart.h,
      width: Math.round(chart.w), height: Math.round(chart.h), role: 'img'
    });
    svgEl.setAttribute('aria-label', (cfg.title || prog.name || 'Flowchart') + ' flowchart');
    var edgeLayer = svg('g'), nodeLayer = svg('g');
    svgEl.appendChild(edgeLayer);
    svgEl.appendChild(nodeLayer);
    chartBox.appendChild(svgEl);

    var edgeEls = [];
    chart.edges.forEach(function (e) {
      var g = svg('g', { 'class': 'fc-edge' });
      g.appendChild(svg('polyline', { points: e.pts.map(function (p) { return p.join(','); }).join(' ') }));
      if (e.head) {
        var a = e.pts[e.pts.length - 2], b = e.pts[e.pts.length - 1];
        var dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]);
        var bx = b[0] - dx * 9, by = b[1] - dy * 9;
        g.appendChild(svg('polygon', {
          'class': 'fc-head',
          points: [b, [bx - dy * 4.5, by - dx * 4.5], [bx + dy * 4.5, by + dx * 4.5]].map(function (p) { return p.join(','); }).join(' ')
        }));
      }
      if (e.label) {
        var t = svg('text', { x: e.label.x, y: e.label.y, 'text-anchor': e.label.anchor, 'font-size': 12, 'font-family': FONT_FAMILY });
        t.textContent = e.label.text;
        g.appendChild(t);
      }
      edgeLayer.appendChild(g);
      edgeEls.push({ e: e, g: g });
    });

    var nodeEls = {};
    nodes.forEach(function (n) {
      if (n.x === undefined) return;
      var g = svg('g', { 'class': 'fc-node fc-' + n.kind, 'data-id': n.id });
      g.appendChild(shapeFor(n));
      if (n.blank) { g.classList.add('fc-blank'); n.fill = null; } else drawText(g, n, n.text);
      nodeLayer.appendChild(g);
      nodeEls[n.id] = g;
    });

    /* ---- line <-> shape linking ---- */
    function linked(line) {
      var out = [];
      nodes.forEach(function (n) { if (nodeEls[n.id] && n.lines.indexOf(line) >= 0) out.push(nodeEls[n.id]); });
      edgeEls.forEach(function (x) { if (x.e.line === line) out.push(x.g); });
      return out;
    }
    function clearClass(cls) {
      Array.prototype.forEach.call(host.querySelectorAll('.' + cls), function (x) { x.classList.remove(cls); });
    }
    function markLines(lines, cls) {
      lines.forEach(function (l) {
        if (lineEls[l]) lineEls[l].classList.add(cls);
        linked(l).forEach(function (x) { x.classList.add(cls); });
      });
    }
    function hover(lines) { clearClass('fc-hover'); if (lines && state.linking) markLines(lines, 'fc-hover'); }
    function pin(lines) {
      if (!state.linking) return;
      var key = lines.join(',');
      clearClass('fc-pin');
      if (state.pinned === key) { state.pinned = null; return; }
      state.pinned = key;
      markLines(lines, 'fc-pin');
    }
    lineEls.forEach(function (li, idx) {
      li.addEventListener('mouseenter', function () { hover([idx]); });
      li.addEventListener('mouseleave', function () { hover(null); });
      li.addEventListener('click', function () { pin([idx]); });
    });
    nodes.forEach(function (n) {
      var g = nodeEls[n.id];
      if (!g) return;
      g.addEventListener('mouseenter', function () { hover(n.lines); });
      g.addEventListener('mouseleave', function () { hover(null); });
      g.addEventListener('click', function () { if (!(n.blank && !state.solved)) pin(n.lines); });
    });

    /* ---- toolbar ---- */
    var hintEl = null;
    function button(label, title, fn) {
      var b = el('button', 'fc-btn', label);
      b.type = 'button';
      if (title) b.title = title;
      b.addEventListener('click', fn);
      if (hintEl && hintEl.parentNode === toolbar) toolbar.insertBefore(b, hintEl); else toolbar.appendChild(b);
      return b;
    }
    function setStatus(text, kind) {
      status.textContent = text || '';
      status.className = 'fc-status' + (kind ? ' fc-status-' + kind : '');
    }

    /* ================= step-through ================= */
    var btnStep, btnRun, btnReset, varsBody, outPre;

    function buildStepUI() {
      btnStep = button('Step ▶', 'Go to the next shape', function () { stopRun(); step(); });
      btnRun = button('Run ▶▶', 'Step automatically', function () { state.timer ? stopRun() : startRun(); });
      btnReset = button('Reset', 'Start again', resetRun);
      [btnStep, btnRun, btnReset].forEach(function (b) { b.classList.add('fc-stepui'); });
      inputForm.classList.add('fc-stepui'); panels.classList.add('fc-stepui');
      var vbox = el('div', 'fc-vars');
      vbox.appendChild(el('div', 'fc-panel-title', 'Variables'));
      var table = el('table');
      table.innerHTML = '<thead><tr><th>Name</th><th>Value</th></tr></thead>';
      varsBody = el('tbody');
      table.appendChild(varsBody);
      vbox.appendChild(table);
      var obox = el('div', 'fc-out');
      obox.appendChild(el('div', 'fc-panel-title', 'Output'));
      outPre = el('pre');
      obox.appendChild(outPre);
      panels.appendChild(vbox);
      panels.appendChild(obox);
      inputForm.addEventListener('submit', function (ev) { ev.preventDefault(); submitInput(); });
      resetRun();
    }

    function resetRun() {
      stopRun();
      state.vars = {}; state.out = []; state.steps = 0; state.done = false; state.waiting = null; state.presetIdx = 0;
      state.gen = runProgram(prog, state.vars, state.out);
      clearClass('fc-cur'); clearClass('fc-taken');
      inputForm.textContent = '';
      btnStep.disabled = false; btnRun.disabled = false;
      renderVars([]); renderOut();
      setStatus('Press Step to begin.');
    }

    function renderVars(changed) {
      varsBody.textContent = '';
      var names = Object.keys(state.vars);
      if (!names.length) {
        var tr0 = el('tr'); var td0 = el('td', 'fc-none', 'none yet'); td0.colSpan = 2; tr0.appendChild(td0); varsBody.appendChild(tr0);
      }
      names.forEach(function (nm) {
        var tr = el('tr', changed.indexOf(nm) >= 0 ? 'fc-changed' : '');
        tr.appendChild(el('td', '', nm));
        tr.appendChild(el('td', '', show(state.vars[nm])));
        varsBody.appendChild(tr);
      });
    }
    function renderOut() { outPre.textContent = state.out.join('\n'); outPre.scrollTop = outPre.scrollHeight; }

    function showEvent(ev) {
      clearClass('fc-cur'); clearClass('fc-taken');
      var n = nodes[ev.node];
      if (nodeEls[n.id]) nodeEls[n.id].classList.add('fc-cur');
      n.lines.forEach(function (l) { if (lineEls[l]) lineEls[l].classList.add('fc-cur'); });
      if (ev.branch) edgeEls.forEach(function (x) { if (x.e.from === n.id && x.e.branch === ev.branch) x.g.classList.add('fc-taken'); });
      renderVars(ev.changed || []);
      renderOut();
      setStatus(ev.msg);
    }

    function finish(msg, kind) {
      state.done = true;
      stopRun();
      btnStep.disabled = true; btnRun.disabled = true;
      if (msg) setStatus(msg, kind);
    }

    function advance(sendValue) {
      var r;
      try { r = state.gen.next(sendValue); }
      catch (err) { finish('Stopped: ' + err.message + '.', 'error'); return; }
      if (r.done) { finish(status.textContent + ' Finished.'); return; }
      var ev = r.value;
      state.steps++;
      showEvent(ev);
      if (ev.input) { askInput(ev.input); return; }
      if (ev.done) finish('End of the algorithm. Press Reset to run it again.');
    }

    function step() {
      if (state.done) return;
      if (state.waiting) { submitInput(); return; }
      advance();
    }

    function askInput(info) {
      state.waiting = info;
      inputForm.textContent = '';
      if (info.prompt) inputForm.appendChild(el('div', 'fc-prompt', info.prompt));
      info.vars.forEach(function (v) {
        var lab_ = el('label', 'fc-field');
        lab_.appendChild(el('span', '', v + ' ='));
        var inp = el('input');
        inp.type = 'text'; inp.name = v; inp.autocomplete = 'off';
        if (state.presetIdx < state.presets.length) inp.value = state.presets[state.presetIdx++];
        lab_.appendChild(inp);
        inputForm.appendChild(lab_);
      });
      var ok = el('button', 'fc-btn fc-enter', 'Enter');
      ok.type = 'submit';
      inputForm.appendChild(ok);
      var first = inputForm.querySelector('input');
      var filled = Array.prototype.every.call(inputForm.querySelectorAll('input'), function (i) { return i.value.trim() !== ''; });
      if (state.timer && filled) { submitInput(); return; }
      stopRun();
      if (first && state.steps > 1) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
    }

    function submitInput() {
      if (!state.waiting) return;
      var inputs = inputForm.querySelectorAll('input'), vals = [], okAll = true;
      Array.prototype.forEach.call(inputs, function (i) {
        var empty = i.value.trim() === '';
        i.classList.toggle('fc-missing', empty);
        if (empty) okAll = false;
        vals.push(parseInputValue(i.value));
      });
      if (!okAll) { setStatus('Type a value in each box, then press Enter.', 'error'); return; }
      state.waiting = null;
      inputForm.textContent = '';
      advance(vals);
    }

    function startRun() {
      if (state.done) return;
      btnRun.textContent = 'Pause ⏸';
      var count = 0;
      state.timer = setInterval(function () {
        if (state.done) { stopRun(); return; }
        if (++count > 400) { stopRun(); setStatus('Paused after 400 steps. This loop may never end.', 'error'); return; }
        step();
      }, 650);
      step();
    }
    function stopRun() {
      if (state.timer) { clearInterval(state.timer); state.timer = null; }
      if (btnRun) btnRun.textContent = 'Run ▶▶';
    }

    /* ================= fill in the blanks ================= */
    var chips = [], blanks = [], editor = null;

    function fitText(n, text) {
      var known = answerLines[norm(text)];
      var size = FONT_SIZE, lines = known || wrap(text, innerWidth(n), size);
      var tooWide = function () { return lines.some(function (l) { return measure(l, size) > innerWidth(n) + 24; }); };
      if (known && tooWide()) lines = wrap(text, innerWidth(n), size);
      var roomH = n.kind === 'decision' ? n.h * 0.62 : n.h - 6;
      while (size > 8 && (lines.length * (size + 4) > roomH || tooWide())) {
        size -= 1;
        lines = wrap(text, innerWidth(n), size);
      }
      return { lines: lines, size: size };
    }
    function renderBlank(n) {
      var g = nodeEls[n.id];
      g.classList.remove('fc-correct', 'fc-wrong');
      g.classList.toggle('fc-filled', !!n.fill);
      if (n.fill) { var f = fitText(n, n.fill); drawText(g, n, f.lines, f.size); } else drawText(g, n, null);
    }
    function renderBank() {
      bank.textContent = '';
      if (cfg.entry === 'type') return;
      var free = chips.filter(function (c) { return !c.used; });
      bank.appendChild(el('div', 'fc-panel-title', free.length ? 'Drag each label onto its shape (or tap a label, then a shape)' : 'All labels placed. Press Check.'));
      free.forEach(function (c) {
        var b = el('button', 'fc-chip' + (state.selChip === c ? ' fc-chip-sel' : ''), c.text);
        b.type = 'button';
        b.addEventListener('pointerdown', function (ev) { startDrag(ev, c, b); });
        b.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectChip(c); } });
        bank.appendChild(b);
      });
    }
    function selectChip(c) { state.selChip = state.selChip === c ? null : c; renderBank(); }
    function clearBlank(n) {
      if (n.chip) { n.chip.used = false; n.chip = null; }
      n.fill = null;
      renderBlank(n);
    }
    function place(n, c) {
      if (state.solved) return;
      clearBlank(n);
      n.fill = c.text; n.chip = c; c.used = true;
      state.selChip = null;
      renderBlank(n); renderBank();
      setStatus('');
      saveBlanks();
    }
    function saveBlanks() {
      var fills = {}, any = false;
      blanks.forEach(function (n) { if (n.fill) { fills[n.id] = n.fill; any = true; } });
      if (any) store.save({ fills: fills }); else store.clear();
    }
    function restoreBlanks(saved) {
      if (!saved || !saved.fills) return false;
      var any = false;
      blanks.forEach(function (n) {
        var text = saved.fills[n.id];
        if (typeof text !== 'string' || !text) return;
        if (cfg.entry !== 'type') {
          var c = chips.filter(function (x) { return !x.used && x.text === text; })[0];
          if (!c) return;
          c.used = true; n.chip = c;
        }
        n.fill = text; any = true;
        renderBlank(n);
      });
      renderBank();
      saveBlanks();
      return any;
    }
    var dnd = {
      find: function (x, y) { return blankAt(x, y); },
      mark: function (n, on) { nodeEls[n.id].classList.toggle('fc-drop', on); },
      drop: function (n, c) { place(n, c); }
    };
    function blankAt(x, y) {
      var t = document.elementFromPoint(x, y);
      var g = t && t.closest ? t.closest('.fc-node.fc-blank') : null;
      if (!g || !host.contains(g)) return null;
      return nodes[parseInt(g.getAttribute('data-id'), 10)];
    }
    function startDrag(ev, c, btn) {
      if (ev.button) return;
      var sx = ev.clientX, sy = ev.clientY, ghost = null, over = null;
      function move(e) {
        if (!ghost) {
          if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < 6) return;
          ghost = el('div', 'fc-chip fc-ghost', c.text);
          document.body.appendChild(ghost);
          btn.classList.add('fc-chip-dragging');
        }
        ghost.style.left = e.clientX + 'px';
        ghost.style.top = e.clientY + 'px';
        var n = dnd.find(e.clientX, e.clientY);
        if (over && over !== n) dnd.mark(over, false);
        if (n) dnd.mark(n, true);
        over = n;
        e.preventDefault();
      }
      function up(e) {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        if (over) dnd.mark(over, false);
        if (!ghost) { selectChip(c); return; }
        document.body.removeChild(ghost);
        btn.classList.remove('fc-chip-dragging');
        var n = dnd.find(e.clientX, e.clientY);
        if (n) dnd.drop(n, c);
      }
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    }

    function openEditor(n) {
      editText(nodeEls[n.id], chartBox, n.fill, function (v) { n.fill = v; renderBlank(n); saveBlanks(); });
    }
    function editText(target, chartBox, value, done) {
      closeEditor();
      var r = target.getBoundingClientRect(), c = chartBox.getBoundingClientRect();
      var inp = el('input', 'fc-editor');
      inp.type = 'text'; inp.value = value || '';
      inp.setAttribute('aria-label', 'Text for this shape');
      var w = Math.max(150, r.width * 0.8);
      inp.style.width = w + 'px';
      inp.style.left = (r.left - c.left + chartBox.scrollLeft + r.width / 2 - w / 2) + 'px';
      inp.style.top = (r.top - c.top + chartBox.scrollTop + r.height / 2 - 15) + 'px';
      chartBox.appendChild(inp);
      editor = inp;
      function commit() {
        if (editor !== inp) return;
        var v = inp.value.trim() || null;
        closeEditor();
        done(v);
      }
      inp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
        if (ev.key === 'Escape') closeEditor();
      });
      inp.addEventListener('blur', commit);
      inp.focus();
    }
    function closeEditor() { if (editor) { var e = editor; editor = null; if (e.parentNode) e.parentNode.removeChild(e); } }

    function accepted(n) {
      var list = [norm(n.answer)];
      if (n.kind === 'process' && !n.custom) {
        list.push(norm(n.body));
        list.push(norm(n.body.replace(/=/, '\u2190')));
        list.push(norm(n.body.replace(/=/, '<-')));
      }
      return list;
    }
    function check() {
      var right_ = 0, empty = 0;
      blanks.forEach(function (n) {
        var g = nodeEls[n.id];
        g.classList.remove('fc-correct', 'fc-wrong');
        if (!n.fill) { empty++; return; }
        var ok = accepted(n).indexOf(norm(n.fill)) >= 0;
        g.classList.add(ok ? 'fc-correct' : 'fc-wrong');
        if (ok) right_++;
      });
      if (right_ === blanks.length) { solved('All ' + blanks.length + ' correct. Well done!'); return; }
      setStatus(right_ + ' of ' + blanks.length + ' correct' + (empty ? ', ' + empty + ' still empty' : '') + '. ' +
        (cfg.entry === 'type' ? 'Click a shape to change it.' : 'Tap a shape to send its label back.'), 'error');
    }
    function solved(msg) {
      state.solved = true;
      state.linking = true;
      state.selChip = null;
      host.classList.add('fc-solved');
      bank.textContent = '';
      Array.prototype.forEach.call(toolbar.querySelectorAll('.fc-blank-btn'), function (b) { b.disabled = b.getAttribute('data-keep') !== '1'; });
      setStatus(msg, 'ok');
      if (prog.runnable) {
        var keep = status.textContent;
        if (!btnStep) {
          var sep = el('span', 'fc-sep fc-stepui');
          toolbar.insertBefore(sep, hintEl);
          buildStepUI();
        } else resetRun();
        setStatus(keep + ' Now press Step to run it.', 'ok');
      }
    }
    function resetBlanks() {
      closeEditor();
      state.solved = false; state.linking = false; state.selChip = null;
      host.classList.remove('fc-solved');
      stopRun();
      clearClass('fc-pin'); clearClass('fc-cur'); clearClass('fc-taken'); state.pinned = null;
      chips.forEach(function (c) { c.used = false; });
      shuffle(chips);
      blanks.forEach(function (n) { n.fill = null; n.chip = null; renderBlank(n); });
      Array.prototype.forEach.call(toolbar.querySelectorAll('.fc-blank-btn'), function (b) { b.disabled = false; });
      renderBank();
      setStatus(cfg.entry === 'type' ? 'Click a shape and type what belongs in it.' : '');
      saveBlanks();
    }
    function showAnswers() {
      closeEditor();
      blanks.forEach(function (n) { n.fill = n.answer; n.chip = null; renderBlank(n); });
      chips.forEach(function (c) { c.used = true; });
      solved('Answers shown.');
    }

    function buildBlanksUI() {
      blanks = nodes.filter(function (n) { return n.blank && nodeEls[n.id]; });
      chips = shuffle(blanks.map(function (n) { return { text: n.answer, used: false }; }));
      var b1 = button('Check', 'Check your answers', check); b1.classList.add('fc-blank-btn');
      var b2 = button('Start again', 'Clear the shapes', resetBlanks); b2.classList.add('fc-blank-btn'); b2.setAttribute('data-keep', '1');
      if (cfg.answers) { var b3 = button('Show answers', '', showAnswers); b3.classList.add('fc-blank-btn'); }
      blanks.forEach(function (n) {
        var g = nodeEls[n.id];
        g.setAttribute('tabindex', '0');
        function act() {
          if (state.solved) return;
          if (cfg.entry === 'type') { openEditor(n); return; }
          if (state.selChip) place(n, state.selChip);
          else if (n.fill) { clearBlank(n); renderBank(); saveBlanks(); }
        }
        g.addEventListener('click', act);
        g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); act(); } });
      });
      var savedBlanks = store.load();
      resetBlanks();
      if (restoreBlanks(savedBlanks)) setStatus('Your earlier work is back. Press Start again to clear it.');
    }

    /* ================= draw it yourself ================= */
    function buildDrawUI() {
      var answer = nodes.filter(function (n) { return n.x !== undefined; });
      var ansEdges = flowEdges(prog);
      var ansKeys = {};
      ansEdges.forEach(function (e) { ansKeys[e.from + '|' + e.label + '|' + e.to] = true; });
      var KINDS = ['start', 'io', 'process', 'decision', 'end'];
      var NAME = { start: 'Start', end: 'End', io: 'Input / Output', process: 'Process', decision: 'Decision' };
      var size = { start: { w: 90, h: 40 }, end: { w: 90, h: 40 }, io: { w: 150, h: 50 }, process: { w: 150, h: 50 }, decision: { w: 170, h: 80 } };
      var sized = {};
      answer.forEach(function (n) {
        if (n.kind === 'start' || n.kind === 'end') return;
        if (!sized[n.kind]) { sized[n.kind] = true; size[n.kind] = { w: 0, h: 0 }; }
        size[n.kind].w = Math.max(size[n.kind].w, n.w);
        size[n.kind].h = Math.max(size[n.kind].h, n.h);
      });
      function countKind(list, k) { return list.filter(function (x) { return x.kind === k; }).length; }
      var MIN_W = Math.ceil((chart.w + 40) / 10) * 10;
      var W = Math.max(660, MIN_W);
      var H = cfg.height || Math.max(480, Math.ceil((chart.h + 160) / 10) * 10);
      var typing = cfg.entry === 'type';
      var INTRO = 'Click or drag a shape from the palette. ' +
        (typing ? 'Double-click a shape to type its text. ' : 'Drag a label onto each shape. ') +
        'Drag from a dot on a shape to another shape to draw an arrow, or click a dot and then click where the line should turn.';
      var PEN_HELP = 'Click to add a corner. Click a shape or another line to finish. Press Esc, or click the starting shape, to cancel.';

      var shapes = [], arrows = [], sel = null, nextId = 1, locked = false, lastTap = { id: null, time: 0 }, pen = null;
      var origNodeEls = {}, origEdgeEls = edgeEls.slice(), k;
      for (k in nodeEls) origNodeEls[k] = nodeEls[k];

      /* ---- DOM ---- */
      var palette = el('div', 'fc-palette');
      var canvasBox = el('div', 'fc-canvas');
      var gid = 'fcgrid' + Math.random().toString(36).slice(2, 8);
      var dsvg = svg('svg', { 'class': 'fc-dsvg', width: W, height: H, tabindex: 0 });
      dsvg.setAttribute('aria-label', 'Drawing area');
      var defs = svg('defs'), pat = svg('pattern', { id: gid, width: 20, height: 20, patternUnits: 'userSpaceOnUse' });
      pat.appendChild(svg('circle', { cx: 1, cy: 1, r: 1, 'class': 'fc-dot' }));
      defs.appendChild(pat);
      dsvg.appendChild(defs);
      var gridRect = svg('rect', { 'class': 'fc-grid', width: W, height: H, fill: 'url(#' + gid + ')' });
      dsvg.appendChild(gridRect);
      var gA = svg('g'), gS = svg('g'), gT = svg('g');
      dsvg.appendChild(gA); dsvg.appendChild(gS); dsvg.appendChild(gT);
      canvasBox.appendChild(dsvg);
      right.insertBefore(palette, chartBox);
      right.insertBefore(bank, chartBox);
      right.insertBefore(canvasBox, chartBox);
      chartBox.style.display = 'none';

      KINDS.forEach(function (kind) {
        if ((kind === 'start' || kind === 'end') && !countKind(answer, kind)) return;
        var b = el('button', 'fc-pal');
        b.type = 'button';
        b.title = 'Add a ' + NAME[kind] + ' shape';
        var icon = svg('svg', { width: 40, height: 22, viewBox: '0 0 40 22', 'aria-hidden': 'true' });
        var ig = svg('g', { 'class': 'fc-node fc-' + kind });
        ig.appendChild(shapeFor({ kind: kind, x: 20, y: 2, w: kind === 'io' ? 38 : 36, h: 18 }));
        icon.appendChild(ig);
        b.appendChild(icon);
        b.appendChild(el('span', '', NAME[kind]));
        b.addEventListener('pointerdown', function (ev) { paletteDown(ev, kind); });
        b.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); if (!locked) addShape(kind); } });
        palette.appendChild(b);
      });

      /* the drawing area is as wide as the space available (wider if the answer needs it) */
      function fitCanvas() {
        var cw = canvasBox.clientWidth || W;
        var need = MIN_W;
        shapes.forEach(function (s) { need = Math.max(need, s.x + s.w / 2 + 12); });
        var nw = Math.max(cw, need);
        if (nw === W) return;
        W = nw;
        dsvg.setAttribute('width', W);
        gridRect.setAttribute('width', W);
      }
      if (root.ResizeObserver) new ResizeObserver(fitCanvas).observe(canvasBox);
      else root.addEventListener('resize', fitCanvas);

      /* ---- model ---- */
      function shapeById(id) { for (var i = 0; i < shapes.length; i++) if (shapes[i].id === id) return shapes[i]; return null; }
      function arrowById(id) { for (var i = 0; i < arrows.length; i++) if (arrows[i].id === id) return arrows[i]; return null; }
      function snap(v) { return Math.round(v / 10) * 10; }
      function clampShape(s) {
        s.x = Math.max(s.w / 2 + 12, Math.min(W - s.w / 2 - 12, snap(s.x)));
        s.y = Math.max(10, Math.min(H - s.h - 10, snap(s.y)));
      }
      function isTerminal(s) { return s.kind === 'start' || s.kind === 'end'; }
      function edited(msg) {
        shapes.forEach(function (s) { s.mark = null; });
        arrows.forEach(function (a) { a.mark = null; });
        render();
        setStatus(msg || '');
        saveDraw();
      }
      function saveDraw() {
        if (!shapes.length) { store.clear(); return; }
        store.save({
          nextId: nextId,
          shapes: shapes.map(function (s) { return { id: s.id, kind: s.kind, x: s.x, y: s.y, text: s.text }; }),
          arrows: arrows.map(function (a) { return { id: a.id, from: a.from, fs: a.fs, to: a.to, ts: a.ts, label: a.label, via: a.via || [], join: a.join || null }; })
        });
      }
      function restoreDraw(saved) {
        if (!saved || !Array.isArray(saved.shapes) || !saved.shapes.length) return false;
        saved.shapes.forEach(function (d) {
          if (!size[d.kind] || typeof d.x !== 'number' || typeof d.y !== 'number') return;
          var s = { id: d.id, kind: d.kind, x: d.x, y: d.y, w: size[d.kind].w, h: size[d.kind].h, chip: null, text: null };
          if (d.kind === 'start') s.text = 'Start';
          else if (d.kind === 'end') s.text = 'End';
          else if (typeof d.text === 'string' && d.text) {
            if (typing) s.text = d.text;
            else {
              var c = chips.filter(function (x) { return !x.used && x.text === d.text; })[0];
              if (c) { c.used = true; s.chip = c; s.text = d.text; }
            }
          }
          shapes.push(s);
        });
        (saved.arrows || []).forEach(function (d) {
          var join = d.join && typeof d.join.arrow === 'number' && typeof d.join.t === 'number' ? { arrow: d.join.arrow, t: d.join.t } : null;
          if (!shapeById(d.from) || !SIDE[d.fs] || (!join && (!shapeById(d.to) || !SIDE[d.ts]))) return;
          var via = (Array.isArray(d.via) ? d.via : []).filter(function (v) { return Array.isArray(v) && typeof v[0] === 'number' && typeof v[1] === 'number'; })
            .map(function (v) { return [v[0], v[1]]; });
          arrows.push({ id: d.id, from: d.from, fs: d.fs, to: join ? null : d.to, ts: join ? null : d.ts, via: via, join: join,
            label: d.label === 'yes' || d.label === 'no' || d.label === '?' ? d.label : '' });
        });
        prune();
        shapes.concat(arrows).forEach(function (o) { nextId = Math.max(nextId, o.id + 1); });
        fitCanvas();
        shapes.forEach(clampShape);
        renderBank();
        render();
        saveDraw();
        return shapes.length > 0;
      }
      function addShape(kind, cx, cy) {
        var z = size[kind];
        var s = { id: nextId++, kind: kind, w: z.w, h: z.h, chip: null, text: kind === 'start' ? 'Start' : kind === 'end' ? 'End' : null };
        if (cx === undefined) {
          var low = 0;
          shapes.forEach(function (o) { low = Math.max(low, o.y + o.h); });
          s.x = W / 2; s.y = shapes.length ? low + 30 : 20;
          if (s.y + s.h > H - 10) { s.x = W - z.w / 2 - 20; s.y = 20 + (shapes.length % 6) * 30; }
        } else { s.x = cx; s.y = cy - z.h / 2; }
        clampShape(s);
        shapes.push(s);
        sel = { t: 's', id: s.id };
        edited();
      }
      function setText(s, text, chip) {
        if (s.chip) s.chip.used = false;
        s.text = text; s.chip = chip || null;
        if (chip) chip.used = true;
      }
      function removeSelected() {
        if (!sel || locked) return;
        if (sel.t === 's') {
          var s = shapeById(sel.id);
          if (s) setText(s, null, null);
          shapes = shapes.filter(function (o) { return o.id !== sel.id; });
          renderBank();
        } else arrows = arrows.filter(function (a) { return a.id !== sel.id; });
        prune();
        sel = null;
        edited();
      }
      /* drop arrows whose shape, or the line they join, has gone */
      function prune() {
        var changed = true;
        function ok(a) {
          if (!shapeById(a.from)) return false;
          return a.join ? a.join.arrow !== a.id && !!arrowById(a.join.arrow) : !!shapeById(a.to);
        }
        while (changed) {
          var before = arrows.length;
          arrows = arrows.filter(ok);
          changed = arrows.length !== before;
        }
      }
      /* the shape an arrow finally leads to (following any lines it joins) */
      function targetOf(a, depth) {
        if (!a) return null;
        if (!a.join) return a.to;
        return (depth || 0) > 8 ? null : targetOf(arrowById(a.join.arrow), (depth || 0) + 1);
      }
      function arrowPts(a, depth) {
        var p1 = port(shapeById(a.from), a.fs), via = a.via || [];
        if (a.join) {
          var other = (depth || 0) < 8 ? arrowById(a.join.arrow) : null;
          if (!other) return [p1, [p1[0], p1[1]]];
          var j = pointAt(arrowPts(other, (depth || 0) + 1), a.join.t);
          return routeVia(p1, a.fs, via, { pt: j.pt, axis: j.axis === 'v' ? 'h' : 'v' });
        }
        var p2 = port(shapeById(a.to), a.ts);
        return via.length ? routeVia(p1, a.fs, via, { pt: p2, side: a.ts }) : routeArrow(p1, a.fs, p2, a.ts);
      }
      function sideFacing(t, pt) {
        var dx = pt[0] - t.x, dy = pt[1] - (t.y + t.h / 2);
        if (Math.abs(dx) / t.w > Math.abs(dy) / t.h) return dx < 0 ? 'l' : 'r';
        return dy < 0 ? 't' : 'b';
      }
      function autoSide(s, side, t) {
        var p1 = port(s, side), cy = t.y + t.h / 2;
        if (cy - p1[1] > t.h / 2 + 8) return 't';
        if (p1[1] - cy > t.h / 2 + 8) return side === 'l' ? 'l' : side === 'r' ? 'r' : 'b';
        return t.x > p1[0] ? 'l' : 'r';
      }
      /* dest is { shape, side } or { arrow, t } (join another line part-way along it) */
      function connect(s, side, dest, via) {
        via = via || [];
        var t = dest.shape, toSide = dest.side;
        if (t && t.kind === 'start') { setStatus('Arrows cannot go into Start.', 'error'); return; }
        if (dest.arrow && dest.arrow.from === s.id) { setStatus('A line cannot join another line from the same shape.', 'error'); return; }
        var outs = arrows.filter(function (a) { return a.from === s.id; });
        var same = t ? outs.filter(function (a) { return !a.join && a.to === t.id; })[0] : null;
        if (same) { same.fs = side; same.ts = toSide; same.via = via; sel = { t: 'a', id: same.id }; edited(); return; }
        var label = '';
        if (s.kind === 'decision') {
          if (outs.length >= 2) { setStatus('A decision has two arrows, Yes and No. Delete one of them first.', 'error'); return; }
          label = outs.length && outs[0].label !== '?' ? (outs[0].label === 'yes' ? 'no' : 'yes') : '?';
        } else if (outs.length) {
          arrows = arrows.filter(function (a) { return a.from !== s.id; });
        }
        var a = { id: nextId++, from: s.id, fs: side, to: t ? t.id : null, ts: t ? toSide : null, label: label, via: via,
          join: dest.arrow ? { arrow: dest.arrow.id, t: dest.t } : null };
        arrows.push(a);
        prune();
        if (!arrowById(a.id)) { edited(); return; }
        sel = { t: 'a', id: a.id };
        edited(label === '?' ? 'Click the ? on the arrow to make it Yes or No.' : '');
      }
      function toggleLabel(a) {
        a.label = a.label === 'yes' ? 'no' : 'yes';
        arrows.forEach(function (o) { if (o !== a && o.from === a.from) o.label = a.label === 'yes' ? 'no' : 'yes'; });
        sel = { t: 'a', id: a.id };
        edited();
      }

      /* ---- drawing ---- */
      function render() {
        gA.textContent = ''; gS.textContent = '';
        arrows.forEach(function (a) {
          var f = shapeById(a.from);
          var pts = arrowPts(a);
          a.pts = pts;
          var str = pts.map(function (p) { return p.join(','); }).join(' ');
          var g = svg('g', {
            'class': 'fc-edge fc-darrow' + (sel && sel.t === 'a' && sel.id === a.id ? ' fc-sel' : '') + (a.mark === 'bad' ? ' fc-abad' : ''),
            'data-aid': a.id
          });
          g.appendChild(svg('polyline', { 'class': 'fc-hit', points: str }));
          g.appendChild(svg('polyline', { points: str }));
          var p0 = pts[pts.length - 2], p1 = pts[pts.length - 1];
          var dx = Math.sign(p1[0] - p0[0]), dy = Math.sign(p1[1] - p0[1]);
          var bx = p1[0] - dx * 9, by = p1[1] - dy * 9;
          g.appendChild(svg('polygon', {
            'class': 'fc-head',
            points: [p1, [bx - dy * 4.5, by - dx * 4.5], [bx + dy * 4.5, by + dx * 4.5]].map(function (p) { return p.join(','); }).join(' ')
          }));
          if (a.label) {
            var d = SIDE[a.fs], pp = port(f, a.fs);
            var lx = pp[0] + d[0] * 24 + (d[0] === 0 ? 20 : 0), ly = pp[1] + d[1] * 18 + (d[1] === 0 ? -12 : 0);
            var lg = svg('g', { 'class': 'fc-alabel' + (a.label === '?' ? ' fc-aq' : '') });
            lg.appendChild(svg('rect', { x: lx - 17, y: ly - 10, width: 34, height: 20, rx: 10 }));
            var lt = svg('text', { x: lx, y: ly + 4, 'text-anchor': 'middle', 'font-size': 12, 'font-family': FONT_FAMILY });
            lt.textContent = a.label === 'yes' ? 'Yes' : a.label === 'no' ? 'No' : '?';
            lg.appendChild(lt);
            g.appendChild(lg);
          }
          gA.appendChild(g);
        });
        shapes.forEach(function (s) {
          var g = svg('g', {
            'class': 'fc-node fc-dshape fc-' + s.kind + (sel && sel.t === 's' && sel.id === s.id ? ' fc-sel' : '') +
              (s.mark === 'bad' ? ' fc-wrong' : '') + (!s.text ? ' fc-blank' : ''),
            'data-sid': s.id
          });
          g.appendChild(shapeFor(s));
          if (s.text) { var f = fitText(s, s.text); drawText(g, s, f.lines, f.size); }
          if (s.kind !== 'end') ['t', 'r', 'b', 'l'].forEach(function (side) {
            var p = port(s, side);
            var h = svg('g', { 'class': 'fc-handle', 'data-side': side });
            h.appendChild(svg('circle', { cx: p[0], cy: p[1], r: 12, 'class': 'fc-handle-hit' }));
            h.appendChild(svg('circle', { cx: p[0], cy: p[1], r: 5 }));
            g.appendChild(h);
          });
          gS.appendChild(g);
        });
        bDel.disabled = !sel || locked;
        if (bEdit) { var ss = sel && sel.t === 's' ? shapeById(sel.id) : null; bEdit.disabled = locked || !ss || isTerminal(ss); }
      }
      function shapeEl(s) { return gS.querySelector('[data-sid="' + s.id + '"]'); }
      function local(ev) { var r = dsvg.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
      function shapeAt(x, y) {
        var t = document.elementFromPoint(x, y);
        var g = t && t.closest ? t.closest('.fc-dshape') : null;
        if (!g || !dsvg.contains(g)) return null;
        return { shape: shapeById(parseInt(g.getAttribute('data-sid'), 10)), el: g, hit: t };
      }

      /* ---- pointer work ---- */
      function track(move, up) {
        function mv(e) { move(e); e.preventDefault(); }
        function done(e) {
          document.removeEventListener('pointermove', mv);
          document.removeEventListener('pointerup', done);
          document.removeEventListener('pointercancel', done);
          up(e);
        }
        document.addEventListener('pointermove', mv, { passive: false });
        document.addEventListener('pointerup', done);
        document.addEventListener('pointercancel', done);
      }
      function paletteDown(ev, kind) {
        if (locked || ev.button) return;
        var sx = ev.clientX, sy = ev.clientY, ghost = null;
        track(function (e) {
          if (!ghost) {
            if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < 6) return;
            ghost = el('div', 'fc-chip fc-ghost', NAME[kind]);
            document.body.appendChild(ghost);
          }
          ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
        }, function (e) {
          if (!ghost) { addShape(kind); return; }
          document.body.removeChild(ghost);
          var r = dsvg.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) addShape(kind, e.clientX - r.left, e.clientY - r.top);
        });
      }
      function startMove(ev, s) {
        if (state.selChip && !isTerminal(s)) {
          setText(s, state.selChip.text, state.selChip);
          state.selChip = null;
          renderBank();
          edited();
          return;
        }
        sel = { t: 's', id: s.id };
        render();
        var p = local(ev), ox = p.x - s.x, oy = p.y - s.y, moved = false;
        track(function (e) {
          var q = local(e), nx = s.x, ny = s.y;
          s.x = q.x - ox; s.y = q.y - oy;
          clampShape(s);
          if (s.x !== nx || s.y !== ny) { moved = true; render(); }
        }, function () {
          /* only a tap that did not drag the shape can be the first half of a double tap */
          if (moved) { lastTap.id = null; edited(); } else lastTap = { id: s.id, time: Date.now() };
        });
      }
      function startConnect(ev, s, side) {
        sel = { t: 's', id: s.id };
        render();
        dsvg.classList.add('fc-connecting');
        var p = port(s, side);
        var line = svg('line', { 'class': 'fc-rubber', x1: p[0], y1: p[1], x2: p[0], y2: p[1] });
        gT.appendChild(line);
        var over = null, sx = ev.clientX, sy = ev.clientY, dragged = false;
        track(function (e) {
          var q = local(e);
          if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 6) dragged = true;
          line.setAttribute('x2', q.x); line.setAttribute('y2', q.y);
          var h = shapeAt(e.clientX, e.clientY);
          if (over && (!h || h.el !== over)) over.classList.remove('fc-drop');
          over = h && h.shape !== s ? h.el : null;
          if (over) over.classList.add('fc-drop');
        }, function (e) {
          gT.textContent = '';
          dsvg.classList.remove('fc-connecting');
          if (over) over.classList.remove('fc-drop');
          if (!dragged) { penStart(s, side); return; }
          var h = shapeAt(e.clientX, e.clientY);
          if (h && h.shape !== s) {
            var hs = h.hit.closest('[data-side]');
            connect(s, side, { shape: h.shape, side: hs ? hs.getAttribute('data-side') : autoSide(s, side, h.shape) });
            return;
          }
          var line2 = h ? null : arrowAt(e.clientX, e.clientY);
          if (line2) { var q = local(e); connect(s, side, { arrow: line2, t: nearestOn(line2.pts, q.x, q.y) }); }
        });
      }
      function arrowAt(x, y) {
        var t = document.elementFromPoint(x, y);
        var g = t && t.closest ? t.closest('.fc-darrow') : null;
        if (!g || !dsvg.contains(g)) return null;
        return arrowById(parseInt(g.getAttribute('data-aid'), 10));
      }
      /* click-by-click line: each click on the drawing area adds a corner */
      function penPoint(q) {
        var prev = pen.via.length ? pen.via[pen.via.length - 1] : port(pen.s, pen.side);
        var x = snap(q.x), y = snap(q.y);
        if (Math.abs(q.x - prev[0]) <= 12) x = prev[0]; else if (Math.abs(q.y - prev[1]) <= 12) y = prev[1];
        return [x, y];
      }
      function penPreview(q) {
        gT.textContent = '';
        var pts = routeVia(port(pen.s, pen.side), pen.side, pen.via, { pt: q });
        gT.appendChild(svg('polyline', { 'class': 'fc-rubber', points: pts.map(function (p) { return p.join(','); }).join(' ') }));
        pen.via.forEach(function (v) { gT.appendChild(svg('circle', { 'class': 'fc-via', cx: v[0], cy: v[1], r: 4 })); });
      }
      function penStart(s, side) {
        pen = { s: s, side: side, via: [] };
        dsvg.classList.add('fc-connecting', 'fc-pen');
        setStatus(PEN_HELP);
        var p = port(s, side), d = SIDE[side];
        penPreview([p[0] + d[0] * 18, p[1] + d[1] * 18]);
      }
      function penStop() {
        if (!pen) return;
        pen = null;
        gT.textContent = '';
        dsvg.classList.remove('fc-connecting', 'fc-pen');
      }
      function penClick(ev) {
        var P = pen, q = local(ev), h = shapeAt(ev.clientX, ev.clientY);
        if (h) {
          penStop();
          if (h.shape === P.s) { setStatus(''); render(); return; }
          var hs = h.hit.closest('[data-side]');
          var side = hs ? hs.getAttribute('data-side') : P.via.length ? sideFacing(h.shape, P.via[P.via.length - 1]) : autoSide(P.s, P.side, h.shape);
          connect(P.s, P.side, { shape: h.shape, side: side }, P.via);
          return;
        }
        var other = arrowAt(ev.clientX, ev.clientY);
        if (other) { penStop(); connect(P.s, P.side, { arrow: other, t: nearestOn(other.pts, q.x, q.y) }, P.via); return; }
        pen.via.push(penPoint(q));
        penPreview(penPoint(q));
      }
      dsvg.addEventListener('pointermove', function (ev) { if (pen) penPreview(penPoint(local(ev))); });
      dsvg.addEventListener('pointerdown', function (ev) {
        if (locked || ev.button) return;
        if (pen) { ev.preventDefault(); penClick(ev); return; }
        var t = ev.target;
        var sg = t.closest('.fc-dshape'), hs = t.closest('[data-side]'), ag = t.closest('.fc-darrow'), lg = t.closest('.fc-alabel');
        if (sg) {
          var s = shapeById(parseInt(sg.getAttribute('data-sid'), 10));
          ev.preventDefault();
          dsvg.focus({ preventScroll: true });
          if (hs) { startConnect(ev, s, hs.getAttribute('data-side')); return; }
          var now = Date.now();
          if (lastTap.id === s.id && now - lastTap.time < 450) { lastTap.id = null; setTimeout(function () { doubleTap(s); }, 30); return; }
          startMove(ev, s);
          return;
        }
        if (ag) {
          var a = arrowById(parseInt(ag.getAttribute('data-aid'), 10));
          if (lg) toggleLabel(a); else { sel = { t: 'a', id: a.id }; render(); }
          return;
        }
        sel = null;
        render();
      });
      function editShape(s) {
        if (!s || isTerminal(s) || locked) return;
        editText(shapeEl(s), canvasBox, s.text, function (v) { setText(s, v, null); edited(); });
      }
      function doubleTap(s) {
        if (locked || isTerminal(s) || !shapeById(s.id)) return;
        if (typing) editShape(s);
        else if (s.text) { setText(s, null, null); renderBank(); edited(); }
      }
      dsvg.addEventListener('mousedown', function (ev) { if (ev.target.closest('.fc-dshape')) ev.preventDefault(); });
      dsvg.addEventListener('keydown', function (ev) {
        if (pen && ev.key === 'Escape') { penStop(); setStatus(''); render(); return; }
        if (locked || !sel) return;
        if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); removeSelected(); return; }
        var step = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[ev.key];
        var s = sel.t === 's' ? shapeById(sel.id) : null;
        if (step && s) { ev.preventDefault(); s.x += step[0]; s.y += step[1]; clampShape(s); edited(); }
        if (ev.key === 'Enter' && s && typing) { ev.preventDefault(); editShape(s); }
      });

      /* labels from the bank land on drawn shapes */
      dnd = {
        find: function (x, y) { var h = locked ? null : shapeAt(x, y); return h && !isTerminal(h.shape) ? h.shape : null; },
        mark: function (s, on) { var g = shapeEl(s); if (g) g.classList.toggle('fc-drop', on); },
        drop: function (s, c) { setText(s, c.text, c); state.selChip = null; renderBank(); edited(); }
      };

      /* ---- checking ---- */
      function matchShapes() {
        var cands = shapes.map(function (s) {
          if (!s.text) return [];
          var t = norm(s.text);
          return answer.filter(function (n) { return n.kind === s.kind && accepted(n).indexOf(t) >= 0; }).map(function (n) { return n.id; });
        });
        var best = {}, bestScore = -1, tries = 0, cur = {}, used = {};
        function score() {
          var sc = Object.keys(cur).length * 100;
          arrows.forEach(function (a) {
            var to = targetOf(a);
            if (cur[a.from] !== undefined && cur[to] !== undefined && ansKeys[cur[a.from] + '|' + a.label + '|' + cur[to]]) sc++;
          });
          return sc;
        }
        function go(i) {
          if (tries > 4000) return;
          if (i === shapes.length) {
            tries++;
            var sc = score();
            if (sc > bestScore) { bestScore = sc; best = {}; for (var key in cur) best[key] = cur[key]; }
            return;
          }
          var any = false;
          cands[i].forEach(function (id) {
            if (used[id]) return;
            any = true; used[id] = true; cur[shapes[i].id] = id;
            go(i + 1);
            delete cur[shapes[i].id]; used[id] = false;
          });
          if (!any) go(i + 1);
        }
        go(0);
        return best;
      }
      function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
      function checkDraw() {
        if (locked) return;
        penStop();
        closeEditor();
        shapes.forEach(function (s) { s.mark = null; });
        arrows.forEach(function (a) { a.mark = null; });
        if (!shapes.length) { setStatus('Add some shapes from the palette first.', 'error'); return; }
        var msgs = [];
        KINDS.forEach(function (kd) {
          var need = countKind(answer, kd), have = countKind(shapes, kd);
          if (need === have) return;
          if (kd === 'start' || kd === 'end') msgs.push(have < need ? 'Add ' + (kd === 'start' ? 'a Start' : 'an End') + ' shape.' : 'Only one ' + NAME[kd] + ' shape is needed.');
          else if (!need) msgs.push('This flowchart does not need a ' + NAME[kd] + ' shape.');
          else msgs.push('This flowchart needs ' + plural(need, NAME[kd] + ' shape') + '. You have ' + have + '.');
        });
        var map = matchShapes();
        var empty = shapes.filter(function (s) { return !s.text; }).length;
        if (empty) msgs.push(plural(empty, 'shape') + (empty === 1 ? ' has' : ' have') + ' no text yet.');
        var badText = 0;
        shapes.forEach(function (s) { if (s.text && map[s.id] === undefined) { s.mark = 'bad'; badText++; } });
        if (badText) msgs.push('The text in ' + (badText === 1 ? 'the red shape does' : 'the red shapes does') + ' not belong in that kind of shape.');
        if (arrows.some(function (a) { return a.label === '?'; })) msgs.push('Click the ? on each decision arrow to make it Yes or No.');
        var good = 0, bad = 0;
        arrows.forEach(function (a) {
          var to = targetOf(a);
          if (map[a.from] === undefined || map[to] === undefined || a.label === '?') return;
          if (ansKeys[map[a.from] + '|' + a.label + '|' + map[to]]) good++; else { a.mark = 'bad'; bad++; }
        });
        var allMapped = shapes.length === answer.length && shapes.every(function (s) { return map[s.id] !== undefined; });
        if (bad) msgs.push(plural(bad, 'arrow') + ' in red ' + (bad === 1 ? 'does' : 'do') + ' not go to the right place, or ' + (bad === 1 ? 'has' : 'have') + ' the wrong Yes or No.');
        if (!bad && allMapped && good < ansEdges.length && !msgs.length) {
          var miss = ansEdges.length - good;
          msgs.push(plural(miss, 'arrow') + (miss === 1 ? ' is' : ' are') + ' missing.');
        }
        if (!msgs.length && allMapped && good === ansEdges.length && arrows.length === ansEdges.length) { finish(map); return; }
        render();
        setStatus(msgs.slice(0, 3).join(' ') || 'Not quite. Check where each arrow goes.', 'error');
      }
      function revealCode(on) { if (!cfg.showCode) codeBox.classList.toggle('fc-code-secret', !on); }
      function finish(map) {
        locked = true; sel = null;
        render();
        shapes.forEach(function (s) { nodeEls[map[s.id]] = shapeEl(s); });
        edgeEls.length = 0;
        arrows.forEach(function (a) {
          edgeEls.push({ e: { from: map[a.from], branch: a.label }, g: gA.querySelector('[data-aid="' + a.id + '"]') });
        });
        host.classList.add('fc-locked');
        revealCode(true);
        solved('Correct! Your flowchart matches the algorithm.');
      }
      function restoreAnswerEls() {
        for (var key in origNodeEls) nodeEls[key] = origNodeEls[key];
        edgeEls.length = 0;
        Array.prototype.push.apply(edgeEls, origEdgeEls);
      }
      function showAnswer() {
        closeEditor();
        locked = true; sel = null;
        restoreAnswerEls();
        host.classList.add('fc-locked', 'fc-answer');
        chartBox.style.display = '';
        revealCode(true);
        solved('Answer shown.');
      }
      function resetDraw() {
        penStop();
        closeEditor();
        stopRun();
        shapes = []; arrows = []; sel = null; locked = false;
        state.solved = false; state.linking = false; state.selChip = null; state.pinned = null;
        clearClass('fc-pin'); clearClass('fc-cur'); clearClass('fc-taken');
        host.classList.remove('fc-solved', 'fc-locked', 'fc-answer');
        restoreAnswerEls();
        chartBox.style.display = 'none';
        revealCode(false);
        chips.forEach(function (c) { c.used = false; });
        shuffle(chips);
        Array.prototype.forEach.call(toolbar.querySelectorAll('.fc-blank-btn'), function (b) { b.disabled = false; });
        renderBank();
        fitCanvas();
        render();
        setStatus(INTRO);
        saveDraw();
      }

      /* ---- toolbar ---- */
      chips = typing ? [] : shuffle(answer.filter(function (n) { return n.kind !== 'start' && n.kind !== 'end'; })
        .map(function (n) { return { text: n.answer, used: false }; }));
      var bCheck = button('Check', 'Check your flowchart', checkDraw); bCheck.classList.add('fc-blank-btn');
      var bDel = button('Delete', 'Delete the selected shape or arrow', removeSelected); bDel.classList.add('fc-blank-btn');
      var bEdit = null;
      if (typing) {
        bEdit = button('Edit text', 'Type the text for the selected shape', function () { if (sel && sel.t === 's') editShape(shapeById(sel.id)); });
        bEdit.classList.add('fc-blank-btn');
      }
      var armed = false;
      var bAgain = button('Start again', 'Clear the drawing', function () {
        if (shapes.length && !locked && !armed) {
          armed = true; bAgain.textContent = 'Really start again?';
          setTimeout(function () { armed = false; bAgain.textContent = 'Start again'; }, 3000);
          return;
        }
        armed = false; bAgain.textContent = 'Start again';
        resetDraw();
      });
      bAgain.classList.add('fc-blank-btn'); bAgain.setAttribute('data-keep', '1');
      if (cfg.answers) { var bAns = button('Show answer', '', showAnswer); bAns.classList.add('fc-blank-btn'); }
      var savedDraw = store.load();
      resetDraw();
      if (restoreDraw(savedDraw)) setStatus('Your earlier drawing is back. Press Start again to clear it.');
    }


    /* ---- go ---- */
    if (mode === 'step') buildStepUI();
    else if (mode === 'blanks') buildBlanksUI();
    else if (mode === 'draw') buildDrawUI();
    else setStatus('');

    var spacer = el('span', 'fc-spacer');
    toolbar.appendChild(spacer);
    if (host.requestFullscreen) {
      var fs = el('button', 'fc-btn fc-fs', '⛶');
      fs.type = 'button'; fs.title = 'Full screen';
      fs.setAttribute('aria-label', 'Full screen');
      fs.addEventListener('click', function () {
        if (document.fullscreenElement === host) document.exitFullscreen(); else host.requestFullscreen();
      });
      toolbar.appendChild(fs);
    }
    hintEl = el('span', 'fc-hint', mode === 'draw' ? 'Draw the flowchart' : mode === 'blanks' ? 'Fill in the flowchart'
      : mode === 'step' ? 'Step through the algorithm' : 'Point at a line or a shape to see how they match');
    toolbar.insertBefore(hintEl, spacer);
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.fc-widget:not(.fc-ready)'), function (host) {
      try { Widget(host); }
      catch (err) { if (root.console) console.error('flowchart:', err); }
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseProgram: parseProgram, buildNodes: buildNodes, sizeNodes: sizeNodes, layoutProgram: layoutProgram,
      runProgram: runProgram, flowEdges: flowEdges, routeArrow: routeArrow, routeVia: routeVia, pointAt: pointAt, nearestOn: nearestOn, parseExpr: parseExpr, evalExpr: evalExpr, parseInputValue: parseInputValue, norm: norm };
  } else if (root.document) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
