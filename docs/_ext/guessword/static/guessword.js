/* guessword.js - classroom word-guessing game for the Sphinx guessword directive.
 *
 * Each theme is an SVG with 12 stages, one per wrong guess at :lives: 12.
 * With fewer lives, each wrong guess moves the picture on several stages.
 * Elements are tagged:
 *   gw-hK  -> hidden once stage >= K (parts that disappear)
 *   gw-sK  -> shown once stage >= K (parts that appear)
 *   gw-oK  -> shown only while stage == K (a brief effect, e.g. a pop)
 */
(function () {
  "use strict";

  var STAGES = 12;
  var uid = 0;

  function wrap(inner) {
    return '<svg class="gw-svg" viewBox="0 0 200 220" aria-hidden="true" focusable="false">' +
      inner + "</svg>";
  }

  /* ---------- Theme: melting snowman (12 parts) ----------
   * 1 hat, 2 scarf tail, 3 scarf, 4 left arm, 5 right arm, 6 buttons,
   * 7 nose, 8 left eye, 9 right eye, 10 mouth, 11 head, 12 body.
   * The puddle grows as it melts. */
  function snowmanSVG() {
    return wrap(
      '<line class="gw-ground" x1="10" y1="209" x2="190" y2="209"/>' +
      '<ellipse class="gw-puddle gw-s4" cx="100" cy="209" rx="22" ry="3"/>' +
      '<ellipse class="gw-puddle gw-s8" cx="100" cy="209" rx="40" ry="4.5"/>' +
      '<ellipse class="gw-puddle gw-s11" cx="100" cy="209" rx="60" ry="6"/>' +
      '<ellipse class="gw-puddle gw-s12" cx="100" cy="209" rx="84" ry="8"/>' +
      '<circle class="gw-snow gw-h12" cx="100" cy="168" r="40"/>' +
      '<g class="gw-h6"><circle class="gw-coal" cx="100" cy="152" r="3"/>' +
        '<circle class="gw-coal" cx="100" cy="166" r="3"/><circle class="gw-coal" cx="100" cy="180" r="3"/></g>' +
      '<circle class="gw-snow gw-h11" cx="100" cy="108" r="28"/>' +
      '<path class="gw-twig gw-h4" d="M64 152 L30 128 M42 136 L36 122"/>' +
      '<path class="gw-twig gw-h5" d="M136 152 L170 128 M158 136 L164 122"/>' +
      '<circle class="gw-coal gw-h8" cx="91" cy="101" r="3.2"/>' +
      '<circle class="gw-coal gw-h9" cx="109" cy="101" r="3.2"/>' +
      '<polygon class="gw-carrot gw-h7" points="100,107 124,112 100,115"/>' +
      '<path class="gw-smile gw-h10" d="M89 120 Q100 127 111 120"/>' +
      '<rect class="gw-scarf gw-h3" x="73" y="128" width="54" height="10" rx="4"/>' +
      '<rect class="gw-scarf gw-h2" x="108" y="133" width="11" height="26" rx="3"/>' +
      '<g class="gw-h1"><rect class="gw-hat" x="76" y="77" width="48" height="6" rx="2"/>' +
        '<rect class="gw-hat" x="85" y="48" width="30" height="31" rx="2"/>' +
        '<rect class="gw-hatband" x="85" y="70" width="30" height="5"/></g>'
    );
  }

  /* ---------- Theme: overflowing beaker (12 parts) ----------
   * Stages 1-11 fill the beaker to the brim; stage 12 spills over. */
  function beakerSVG(id) {
    var bottom = 208, top = 38, n = 11;
    var step = (bottom - top) / n;
    var bands = "";
    for (var k = 1; k <= n; k++) {
      var y = bottom - step * k;
      bands += '<rect class="gw-liquid gw-s' + k + '" x="55" y="' + y.toFixed(1) +
        '" width="90" height="' + (step + 0.6).toFixed(1) + '"/>';
    }
    var marks = "";
    for (var m = 1; m <= n; m++) {
      var my = (bottom - step * m).toFixed(1);
      marks += '<line class="gw-mark" x1="' + (m % 2 ? 132 : 122) + '" y1="' + my + '" x2="143" y2="' + my + '"/>';
    }
    return wrap(
      '<defs><clipPath id="gw-clip-' + id + '">' +
        '<path d="M55 38 L55 200 Q55 208 63 208 L137 208 Q145 208 145 200 L145 38 Z"/>' +
      "</clipPath></defs>" +
      '<line class="gw-ground" x1="10" y1="211" x2="190" y2="211"/>' +
      '<path class="gw-glass-fill" d="M55 38 L55 200 Q55 208 63 208 L137 208 Q145 208 145 200 L145 38 Z"/>' +
      '<g clip-path="url(#gw-clip-' + id + ')">' + bands +
        '<circle class="gw-bubble gw-s3" cx="78" cy="196" r="3"/>' +
        '<circle class="gw-bubble gw-s5" cx="112" cy="178" r="4"/>' +
        '<circle class="gw-bubble gw-s7" cx="88" cy="150" r="3"/>' +
        '<circle class="gw-bubble gw-s9" cx="120" cy="120" r="5"/>' +
        '<circle class="gw-bubble gw-s11" cx="80" cy="84" r="3.5"/>' +
      "</g>" +
      '<g class="gw-s12">' +
        '<path class="gw-liquid" d="M147 36 Q162 38 160 62 L160 150 Q157 162 153 150 L153 64 Q153 48 145 46 Z"/>' +
        '<path class="gw-liquid" d="M53 36 Q40 38 42 60 L42 120 Q45 132 48 120 L48 62 Q48 48 55 46 Z"/>' +
        '<ellipse class="gw-liquid" cx="100" cy="36" rx="48" ry="5"/>' +
        '<ellipse class="gw-liquid" cx="168" cy="209" rx="22" ry="4"/>' +
        '<ellipse class="gw-liquid" cx="34" cy="209" rx="18" ry="3.5"/>' +
      "</g>" +
      marks +
      '<path class="gw-glass" d="M48 30 L55 38 L55 200 Q55 208 63 208 L137 208 Q145 208 145 200 L145 38 L152 30"/>'
    );
  }

  /* ---------- Theme: popping balloons (12 balloons) ---------- */
  function star(cx, cy, cls) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var r = i % 2 ? 6 : 15;
      var a = (Math.PI / 5) * i - Math.PI / 2;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1));
    }
    return '<polygon class="gw-burst ' + cls + '" points="' + pts.join(" ") + '"/>';
  }

  function balloonsSVG() {
    // Popped top row first, so the lower balloons (drawn on top) go last.
    var spots = [
      [40, 30], [80, 30], [120, 30], [160, 30],
      [60, 58], [100, 58], [140, 58],
      [40, 86], [80, 86], [120, 86], [160, 86],
      [100, 114]
    ];
    var strings = "", balloons = "", bursts = "";
    spots.forEach(function (p, i) {
      var x = p[0], y = p[1], k = i + 1;
      strings += '<path class="gw-string gw-h' + k + '" d="M' + x + " " + (y + 20) +
        " Q" + ((x + 100) / 2) + " " + (y + 60) + ' 100 194"/>';
      bursts += star(x, y, "gw-o" + k);
      balloons += '<g class="gw-h' + k + '">' +
        '<ellipse class="gw-balloon gw-tone-' + (i % 6 + 1) + '" cx="' + x + '" cy="' + y + '" rx="15" ry="18"/>' +
        '<path class="gw-balloon gw-tone-' + (i % 6 + 1) + '" d="M' + (x - 3) + " " + (y + 21) +
          " L" + (x + 3) + " " + (y + 21) + " L" + x + " " + (y + 16) + ' Z"/>' +
        '<ellipse class="gw-shine" cx="' + (x - 5) + '" cy="' + (y - 7) + '" rx="3.5" ry="5.5"/></g>';
    });
    return wrap(
      '<line class="gw-ground" x1="10" y1="211" x2="190" y2="211"/>' +
      strings + balloons + bursts +
      '<circle class="gw-hand" cx="100" cy="198" r="6"/>' +
      '<line class="gw-post" x1="100" y1="204" x2="100" y2="211"/>'
    );
  }

  // Start picture: hide the parts that only appear after wrong guesses.
  function setStage(container, s) {
    for (var k = 1; k <= STAGES; k++) {
      container.querySelectorAll(".gw-h" + k).forEach(function (n) { n.classList.toggle("gw-off", s >= k); });
      container.querySelectorAll(".gw-s" + k).forEach(function (n) { n.classList.toggle("gw-off", s < k); });
      container.querySelectorAll(".gw-o" + k).forEach(function (n) { n.classList.toggle("gw-off", s !== k); });
    }
  }

  /* ---------- Theme: wilting flower (12 petals) ----------
   * A petal drops for each stage and lands beside the pot. On the last
   * stage the flower droops. */
  function flowerSVG() {
    var cx = 100, cy = 78, petals = "", fallen = "";
    // Ground spots for fallen petals, alternating left and right of the pot.
    var spots = [[52, 206], [150, 207], [38, 208], [163, 206], [60, 209], [140, 209],
                 [28, 206], [174, 208], [46, 210], [156, 210], [20, 209], [182, 210]];
    for (var k = 1; k <= 12; k++) {
      var a = (k - 1) * 30;
      // Rotation sits on a wrapper group (gw-rot) so the CSS transform-origin
      // used for the falling animation doesn't shift the petal.
      petals += '<g class="gw-rot" transform="rotate(' + a + " " + cx + " " + cy + ')">' +
        '<ellipse class="gw-petal gw-h' + k + '" cx="' + cx + '" cy="' + (cy - 27) + '" rx="8" ry="19"/></g>';
      var s = spots[k - 1];
      fallen += '<g class="gw-rot" transform="rotate(' + (k % 2 ? -15 : 15) + " " + s[0] + " " + s[1] + ')">' +
        '<ellipse class="gw-petal gw-fallen gw-s' + k + '" cx="' + s[0] + '" cy="' + s[1] + '" rx="7" ry="3"/></g>';
    }
    return wrap(
      '<line class="gw-ground" x1="10" y1="211" x2="190" y2="211"/>' +
      fallen +
      '<g class="gw-h12">' +
        '<path class="gw-stem" d="M100 172 C98 150 102 120 100 92"/>' +
        '<path class="gw-leaf" d="M100 140 C82 128 70 132 64 140 C76 148 90 148 100 140 Z"/>' +
        '<path class="gw-leaf" d="M100 124 C118 112 130 116 136 124 C124 132 110 132 100 124 Z"/>' +
        petals +
        '<circle class="gw-flower-centre" cx="' + cx + '" cy="' + cy + '" r="13"/>' +
      "</g>" +
      '<g class="gw-s12">' +
        '<path class="gw-stem gw-stem-droop" d="M100 172 C98 150 104 128 114 118 C124 110 132 116 134 128"/>' +
        '<circle class="gw-flower-centre gw-centre-dead" cx="134" cy="136" r="10"/>' +
      "</g>" +
      '<path class="gw-pot" d="M72 170 L128 170 L122 210 L78 210 Z"/>' +
      '<rect class="gw-pot-rim" x="68" y="164" width="64" height="10" rx="2"/>'
    );
  }

  /* ---------- Theme: draining battery (12 bars) ----------
   * Bars empty from the top; the last ones are red. Stage 12 is flat. */
  function batterySVG() {
    var bars = "";
    for (var k = 1; k <= 12; k++) {
      var y = 52 + (k - 1) * 12.5;
      var tone = k <= 6 ? "gw-bar-good" : (k <= 9 ? "gw-bar-mid" : "gw-bar-low");
      bars += '<rect class="gw-bar ' + tone + ' gw-h' + k + '" x="70" y="' + y.toFixed(1) +
        '" width="60" height="10" rx="2"/>';
    }
    return wrap(
      '<line class="gw-ground" x1="10" y1="211" x2="190" y2="211"/>' +
      '<rect class="gw-bat-cap" x="84" y="28" width="32" height="14" rx="3"/>' +
      '<rect class="gw-bat-case" x="60" y="40" width="80" height="166" rx="10"/>' +
      bars +
      '<g class="gw-s12">' +
        '<rect class="gw-bat-flat" x="60" y="40" width="80" height="166" rx="10"/>' +
        '<line class="gw-bat-x" x1="80" y1="100" x2="120" y2="146"/>' +
        '<line class="gw-bat-x" x1="120" y1="100" x2="80" y2="146"/>' +
      "</g>" +
      '<text class="gw-bat-sign" x="100" y="38" text-anchor="middle">+</text>'
    );
  }

  /* ---------- Theme: rising thermometer (12 steps) ----------
   * The red liquid climbs one step per stage into the danger zone, and
   * heat waves appear on the last stage. */
  function thermometerSVG() {
    var top = 34, base = 166, n = 12, step = (base - top) / n, col = "", marks = "";
    for (var k = 1; k <= n; k++) {
      var y = base - step * k;
      col += '<rect class="gw-mercury gw-s' + k + '" x="94" y="' + y.toFixed(1) +
        '" width="12" height="' + (step + 0.6).toFixed(1) + '"/>';
    }
    for (var m = 0; m <= n; m++) {
      var my = (base - step * m).toFixed(1);
      marks += '<line class="gw-mark" x1="112" y1="' + my + '" x2="' + (m % 3 ? 119 : 126) + '" y2="' + my + '"/>';
    }
    return wrap(
      '<line class="gw-ground" x1="10" y1="211" x2="190" y2="211"/>' +
      '<rect class="gw-danger" x="88" y="' + top + '" width="24" height="' + (step * 3).toFixed(1) + '" rx="2"/>' +
      '<path class="gw-thermo-fill" d="M90 30 Q90 18 100 18 Q110 18 110 30 L110 168 A24 24 0 1 1 90 168 Z"/>' +
      '<rect class="gw-mercury" x="94" y="160" width="12" height="16"/>' +
      col +
      '<circle class="gw-mercury" cx="100" cy="186" r="17"/>' +
      '<path class="gw-thermo-glass" d="M90 30 Q90 18 100 18 Q110 18 110 30 L110 168 A24 24 0 1 1 90 168 Z"/>' +
      marks +
      '<g class="gw-s12">' +
        '<path class="gw-heat" d="M58 60 q-8 10 0 20 q8 10 0 20 q-8 10 0 20"/>' +
        '<path class="gw-heat" d="M142 60 q-8 10 0 20 q8 10 0 20 q-8 10 0 20"/>' +
        '<path class="gw-heat" d="M40 80 q-6 8 0 16 q6 8 0 16"/>' +
        '<path class="gw-heat" d="M160 80 q-6 8 0 16 q6 8 0 16"/>' +
      "</g>"
    );
  }

  /* ---------- Theme: Rube Goldberg machine (12 steps) ----------
   * 1-3 ball rolls down two ramps, 4 lands on the shelf, 5-8 dominoes
   * fall, 9 second ball drops onto the seesaw, 10 seesaw tips and flings
   * the weight, 11 weight flies up, 12 weight hits the bell: DING! */
  function machineSVG() {
    function ball(cx, cy, cls, tone) {
      return '<g class="' + cls + '"><circle class="gw-mball ' + tone + '" cx="' + cx + '" cy="' + cy + '" r="7"/>' +
        '<circle class="gw-shine" cx="' + (cx - 2.5) + '" cy="' + (cy - 2.5) + '" r="2"/></g>';
    }
    var dominoes = "";
    [56, 70, 84, 98].forEach(function (x, i) {
      var k = 5 + i;
      dominoes += '<rect class="gw-domino gw-h' + k + '" x="' + x + '" y="130" width="5" height="20" rx="1"/>' +
        '<g class="gw-rot" transform="rotate(55 ' + (x + 5) + ' 150)">' +
          '<rect class="gw-domino gw-s' + k + '" x="' + x + '" y="130" width="5" height="20" rx="1"/></g>';
    });
    return wrap(
      '<line class="gw-ground" x1="6" y1="211" x2="196" y2="211"/>' +
      // frame: top shelf, ramps, domino shelf
      '<line class="gw-wood" x1="8" y1="40" x2="44" y2="40"/>' +
      '<line class="gw-wood" x1="44" y1="40" x2="150" y2="62"/>' +
      '<line class="gw-wood" x1="184" y1="80" x2="60" y2="108"/>' +
      '<line class="gw-wood" x1="12" y1="150" x2="116" y2="150"/>' +
      '<line class="gw-support" x1="20" y1="40" x2="20" y2="150"/>' +
      '<line class="gw-support" x1="150" y1="62" x2="150" y2="84"/>' +
      '<line class="gw-support" x1="90" y1="150" x2="90" y2="211"/>' +
      // bell on a post
      '<line class="gw-support" x1="194" y1="211" x2="194" y2="108"/>' +
      '<line class="gw-support" x1="194" y1="108" x2="172" y2="108"/>' +
      '<line class="gw-support" x1="172" y1="108" x2="172" y2="117"/>' +
      '<path class="gw-bell" d="M159 139 Q160 119 172 116 Q184 119 185 139 Z"/>' +
      '<circle class="gw-bell" cx="172" cy="141" r="3"/>' +
      dominoes +
      // seesaw: level, then tipped
      '<polygon class="gw-pivot" points="150,191 141,211 159,211"/>' +
      '<rect class="gw-plank gw-h10" x="116" y="187" width="68" height="5" rx="2"/>' +
      '<g class="gw-rot" transform="rotate(-18 150 190)">' +
        '<rect class="gw-plank gw-s10" x="116" y="187" width="68" height="5" rx="2"/></g>' +
      // weight: at rest, flying, hitting the bell
      '<rect class="gw-weight gw-h10" x="170" y="175" width="12" height="12" rx="2"/>' +
      '<rect class="gw-weight gw-o10" x="172" y="164" width="12" height="12" rx="2"/>' +
      '<rect class="gw-weight gw-o11" x="170" y="152" width="12" height="12" rx="2"/>' +
      '<rect class="gw-weight gw-s12" x="166" y="144" width="12" height="12" rx="2"/>' +
      // first ball: top shelf -> ramp A -> ramp B -> shelf
      ball(26, 33, "gw-h1", "gw-ball-a") +
      ball(96, 44, "gw-o1", "gw-ball-a") +
      ball(166, 77, "gw-o2", "gw-ball-a") +
      ball(110, 90, "gw-o3", "gw-ball-a") +
      ball(44, 143, "gw-s4", "gw-ball-a") +
      // second ball: end of shelf -> seesaw
      ball(110, 143, "gw-h9", "gw-ball-b") +
      ball(124, 180, "gw-o9", "gw-ball-b") +
      ball(123, 191, "gw-s10", "gw-ball-b") +
      // motion lines and the ding
      '<g class="gw-o10"><path class="gw-motion" d="M186 186 l4 -8 M180 184 l2 -9"/></g>' +
      '<g class="gw-o11"><path class="gw-motion" d="M184 170 l3 -8 M178 170 l1 -8"/></g>' +
      '<g class="gw-s12">' +
        '<path class="gw-ring" d="M154 122 q-6 8 0 16 M148 118 q-8 12 0 24 M190 122 q6 8 0 16"/>' +
        '<text class="gw-ding" x="116" y="132" text-anchor="middle">DING!</text>' +
      "</g>"
    );
  }

  /* ---------- Theme: rocket launch (12 steps) ----------
   * The countdown board ticks from T-12. 1-3 gantry arms swing away,
   * 4 fuel hose detaches, 5 cabin lights on, 6-8 smoke builds, 9-10 engines
   * ignite, 11 rocket lifts off the pad, 12 LIFT OFF: it's gone without you. */
  function rocketBody(extra) {
    return '<path class="gw-rk-body" d="M112 70 Q126 30 140 70 L140 168 L112 168 Z"/>' +
      '<path class="gw-rk-nose" d="M112 70 Q126 30 140 70 Z"/>' +
      '<path class="gw-rk-fin" d="M112 140 L98 172 L112 168 Z"/>' +
      '<path class="gw-rk-fin" d="M140 140 L154 172 L140 168 Z"/>' +
      '<rect class="gw-rk-band" x="112" y="118" width="28" height="6"/>' +
      '<circle class="gw-rk-window" cx="126" cy="90" r="8"/>' + (extra || "");
  }

  function flame(len, cls) {
    return '<g class="' + (cls || "") + '"><path class="gw-rk-flame" d="M116 168 Q126 ' + (168 + len) +
      ' 136 168 Z"/><path class="gw-rk-flame-core" d="M120 168 Q126 ' + (168 + len * 0.6) + ' 132 168 Z"/></g>';
  }

  function rocketSVG() {
    var board = '<text class="gw-count gw-h1" x="47" y="53" text-anchor="middle">T-12</text>';
    for (var k = 1; k <= 11; k++) {
      board += '<text class="gw-count gw-o' + k + '" x="47" y="53" text-anchor="middle">T-' + (12 - k) + "</text>";
    }
    board += '<text class="gw-count gw-count-go gw-s12" x="47" y="53" text-anchor="middle">LIFT OFF!</text>';
    return wrap(
      '<line class="gw-ground" x1="6" y1="211" x2="196" y2="211"/>' +
      // countdown board on a stand
      '<line class="gw-support" x1="47" y1="64" x2="47" y2="211"/>' +
      '<rect class="gw-board" x="12" y="32" width="70" height="32" rx="4"/>' + board +
      // launch pad and gantry tower
      '<rect class="gw-pad" x="88" y="198" width="76" height="13"/>' +
      '<rect class="gw-tower" x="168" y="46" width="12" height="165"/>' +
      '<path class="gw-tower-x" d="M168 60 L180 80 M180 60 L168 80 M168 100 L180 120 M180 100 L168 120 M168 140 L180 160 M180 140 L168 160"/>' +
      '<rect class="gw-arm gw-h1" x="141" y="76" width="27" height="5"/>' +
      '<rect class="gw-arm gw-h2" x="141" y="106" width="27" height="5"/>' +
      '<rect class="gw-arm gw-h3" x="141" y="146" width="27" height="5"/>' +
      '<rect class="gw-arm gw-arm-up gw-s1" x="178" y="50" width="5" height="27"/>' +
      '<rect class="gw-arm gw-arm-up gw-s2" x="178" y="80" width="5" height="27"/>' +
      '<rect class="gw-arm gw-arm-up gw-s3" x="178" y="120" width="5" height="27"/>' +
      '<path class="gw-hose gw-h4" d="M141 160 Q156 170 168 186"/>' +
      '<path class="gw-hose gw-s4" d="M168 186 Q160 194 156 198"/>' +
      // rocket on the pad (until stage 11)
      '<g class="gw-h11">' + rocketBody('<circle class="gw-rk-glow gw-s5" cx="126" cy="90" r="5"/>') +
        flame(14, "gw-s9") + flame(26, "gw-s10") + "</g>" +
      // lifting off
      '<g class="gw-o11" transform="translate(0 -16)">' +
        rocketBody('<circle class="gw-rk-glow" cx="126" cy="90" r="5"/>') + flame(34) + "</g>" +
      // gone: high up with a long trail
      '<g class="gw-s12" transform="translate(0 -44)">' +
        rocketBody('<circle class="gw-rk-glow" cx="126" cy="90" r="5"/>') + flame(80) + "</g>" +
      // smoke builds at the base
      '<g class="gw-s6"><circle class="gw-smoke" cx="98" cy="196" r="10"/><circle class="gw-smoke" cx="154" cy="196" r="9"/></g>' +
      '<g class="gw-s7"><circle class="gw-smoke" cx="84" cy="200" r="12"/><circle class="gw-smoke" cx="168" cy="199" r="11"/></g>' +
      '<g class="gw-s8"><circle class="gw-smoke" cx="110" cy="203" r="12"/><circle class="gw-smoke" cx="142" cy="203" r="12"/>' +
        '<circle class="gw-smoke" cx="126" cy="206" r="10"/></g>'
    );
  }

  // Helper: one copy of an element per stage 0-12, each shown only at its
  // own stage (stage 0 = gw-h1, stages 1-11 = gw-oK, stage 12 = gw-s12).
  function perStage(make) {
    var out = "";
    for (var k = 0; k <= 12; k++) {
      var cls = k === 0 ? "gw-h1" : (k === 12 ? "gw-s12" : "gw-o" + k);
      out += make(k, cls);
    }
    return out;
  }

  /* ---------- Theme: electric circuit (12 steps) ----------
   * Current flows (animated dashes) and travels round the loop: the
   * pulse reaches a bulb (odd stages), then it lights (even stages).
   * Stage 12: the last bulb overloads and blows - everything goes dark. */
  function circuitSVG() {
    var bulbs = [[65, 50], [135, 50], [170, 100], [170, 150], [130, 180], [70, 180]];
    var pulse = [[42, 50], [100, 50], [170, 70], [170, 126], [150, 180], [100, 180]];
    var out = "", glows = "", dots = "";
    bulbs.forEach(function (b, i) {
      var x = b[0], y = b[1];
      out += '<circle class="gw-bulb" cx="' + x + '" cy="' + y + '" r="10"/>' +
        '<path class="gw-filament" d="M' + (x - 5) + " " + y + " l2.5 -4 l2.5 8 l2.5 -8 l2.5 4" + '"/>';
      if (i < 5) {
        glows += '<g class="gw-s' + (2 * i + 2) + '"><circle class="gw-glow" cx="' + x + '" cy="' + y + '" r="16"/>' +
          '<circle class="gw-bulb gw-bulb-on" cx="' + x + '" cy="' + y + '" r="10"/></g>';
      }
      var p = pulse[i];
      dots += '<circle class="gw-pulse gw-o' + (2 * i + 1) + '" cx="' + p[0] + '" cy="' + p[1] + '" r="5"/>';
    });
    return wrap(
      '<path class="gw-wire" d="M30 104 V50 H170 V180 H30 V126"/>' +
      '<path class="gw-current gw-s1 gw-flow" d="M30 104 V50 H170 V180 H30 V126"/>' +
      // battery (long plate = +)
      '<line class="gw-cell-pos" x1="18" y1="108" x2="42" y2="108"/>' +
      '<line class="gw-cell-neg" x1="24" y1="122" x2="36" y2="122"/>' +
      '<text class="gw-cell-label" x="50" y="112">+</text>' +
      out +
      '<g class="gw-h12">' + glows + "</g>" + dots +
      '<g class="gw-s12">' +
        '<circle class="gw-bulb gw-bulb-dead" cx="70" cy="180" r="10"/>' +
        '<path class="gw-spark-line" d="M70 162 l0 -10 M84 168 l8 -7 M56 168 l-8 -7 M88 182 l10 0 M52 182 l-10 0"/>' +
        '<text class="gw-pop" x="100" y="130" text-anchor="middle">POP!</text>' +
      "</g>"
    );
  }

  /* ---------- Theme: pendulum (cuckoo) clock (12 hours) ----------
   * The pendulum swings continuously; the hour hand moves one hour per
   * stage and the weight drops. At midnight (stage 12) the cuckoo pops out. */
  function pendulumSVG() {
    var ticks = "";
    for (var h = 0; h < 12; h++) {
      var a = h * Math.PI / 6;
      ticks += '<line class="gw-tick" x1="' + (100 + 26 * Math.sin(a)).toFixed(1) + '" y1="' + (84 - 26 * Math.cos(a)).toFixed(1) +
        '" x2="' + (100 + 30 * Math.sin(a)).toFixed(1) + '" y2="' + (84 - 30 * Math.cos(a)).toFixed(1) + '"/>';
    }
    var hands = perStage(function (k, cls) {
      var a = k * 30;
      return '<g class="' + cls + '"><g class="gw-rot" transform="rotate(' + a + ' 100 84)">' +
        '<line class="gw-hand-hour" x1="100" y1="84" x2="100" y2="66"/></g></g>';
    });
    var weights = perStage(function (k, cls) {
      var y = 150 + k * 4;
      return '<g class="' + cls + '"><line class="gw-chain" x1="74" y1="128" x2="74" y2="' + y + '"/>' +
        '<rect class="gw-cone" x="69" y="' + y + '" width="10" height="16" rx="4"/></g>';
    });
    return wrap(
      '<line class="gw-ground" x1="10" y1="211" x2="190" y2="211"/>' +
      // pendulum (animated swing) behind the case
      '<g class="gw-swing"><line class="gw-rod" x1="100" y1="120" x2="100" y2="184"/>' +
        '<circle class="gw-bob" cx="100" cy="188" r="10"/></g>' +
      // the other weight stays up
      '<line class="gw-chain" x1="126" y1="128" x2="126" y2="146"/>' +
      '<rect class="gw-cone" x="121" y="146" width="10" height="16" rx="4"/>' +
      weights +
      // case and roof
      '<polygon class="gw-roof" points="44,46 100,8 156,46"/>' +
      '<rect class="gw-case" x="56" y="44" width="88" height="84" rx="4"/>' +
      '<circle class="gw-face" cx="100" cy="84" r="32"/>' + ticks +
      '<line class="gw-hand-min" x1="100" y1="84" x2="100" y2="58"/>' + hands +
      '<circle class="gw-hub" cx="100" cy="84" r="3"/>' +
      // cuckoo door: closed, then open with the bird out
      '<rect class="gw-door gw-h12" x="92" y="24" width="16" height="16" rx="2"/>' +
      '<g class="gw-s12"><rect class="gw-door-open" x="92" y="24" width="16" height="16" rx="2"/>' +
        '<line class="gw-perch" x1="100" y1="34" x2="100" y2="44"/>' +
        '<ellipse class="gw-bird" cx="100" cy="30" rx="12" ry="8"/>' +
        '<polygon class="gw-beak" points="111,28 120,30 111,33"/>' +
        '<circle class="gw-coal" cx="105" cy="27" r="1.6"/>' +
        '<text class="gw-cuckoo" x="150" y="22" text-anchor="middle">CUCKOO!</text></g>'
    );
  }

  /* ---------- Theme: day to night (12 steps) ----------
   * The sun arcs across the sky and sets as the sky darkens; the moon
   * rises and the stars come out. Stage 12 is night. */
  // Southern hemisphere (the default): the sun crosses the northern sky
  // from right to left, and a waning moon is lit on the right. The
  // northern view is the mirror image. gw-rot keeps the CSS transform
  // origin from shifting the mirror.
  function mirrored(cfg, inner) {
    if (cfg && cfg.hemisphere === "north") return inner;
    return '<g class="gw-rot" transform="translate(200 0) scale(-1 1)">' + inner + "</g>";
  }

  function daynightSVG(id, cfg) {
    var skies = ["#87ceeb", "#8fd3f0", "#9bd8f2", "#a8dcf0", "#b9dbe6", "#f6c48b", "#f39c6b",
                 "#c9707f", "#7b5c8f", "#4a4a80", "#2f3770", "#222a5c", "#161d45"];
    var sky = perStage(function (k, cls) {
      return '<rect class="' + cls + '" x="0" y="0" width="200" height="220" fill="' + skies[k] + '"/>';
    });
    var sun = "", moon = "";
    for (var k = 0; k <= 7; k++) {
      var t = Math.PI * k / 7;
      var x = 100 - 80 * Math.cos(t), y = 165 - 115 * Math.sin(t);
      var cls = k === 0 ? "gw-h1" : "gw-o" + k;
      sun += '<circle class="gw-sun ' + cls + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="14"/>';
    }
    for (var m = 8; m <= 12; m++) {
      var tm = Math.PI / 2 * (m - 7) / 5;
      var mx = 100 - 80 * Math.cos(tm), my = 165 - 115 * Math.sin(tm);
      var mc = m === 12 ? "gw-s12" : "gw-o" + m;
      moon += '<circle class="gw-moon-lit ' + mc + '" cx="' + mx.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="12"/>';
    }
    function stars(list, cls) {
      return '<g class="' + cls + '">' + list.map(function (p, i) {
        return '<circle class="gw-star gw-twinkle" style="animation-delay:' + (i * 0.4) + 's" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (p[2] || 1.6) + '"/>';
      }).join("") + "</g>";
    }
    return '<svg class="gw-svg gw-svg-sky" viewBox="0 0 200 220" aria-hidden="true" focusable="false">' +
      '<defs><clipPath id="gw-sky-' + id + '"><rect x="0" y="0" width="200" height="220" rx="6"/></clipPath></defs>' +
      '<g clip-path="url(#gw-sky-' + id + ')">' + mirrored(cfg, sky +
      stars([[30, 30], [160, 24], [120, 60, 1.2]], "gw-s10") +
      stars([[60, 50, 1.2], [180, 70], [90, 22]], "gw-s11") +
      stars([[20, 80, 1.2], [140, 40, 1.2], [70, 90], [175, 110, 1.2]], "gw-s12") +
      sun + moon +
      '<path class="gw-hill gw-h8" d="M0 175 Q50 150 100 168 Q150 186 200 160 L200 220 L0 220 Z"/>' +
      '<path class="gw-hill gw-hill-night gw-s8" d="M0 175 Q50 150 100 168 Q150 186 200 160 L200 220 L0 220 Z"/>' +
      '<rect class="gw-house" x="128" y="150" width="34" height="28"/>' +
      '<polygon class="gw-house-roof" points="124,151 145,134 166,151"/>' +
      '<rect class="gw-window" x="134" y="156" width="9" height="9"/>' +
      '<rect class="gw-window gw-window-lit gw-s9" x="134" y="156" width="9" height="9"/>' +
      '<rect class="gw-house-door" x="148" y="162" width="9" height="16"/>' +
      "") + "</g></svg>";
  }

  /* ---------- Theme: moon phases (12 steps) ----------
   * Starts at full moon and wanes through gibbous, third quarter and
   * crescent to a new moon at stage 12. The phase name is shown. */
  function moonPath(k, cx, cy, R) {
    var phi = Math.PI * k / 12;
    var rx = Math.max(0.01, R * Math.abs(Math.cos(phi)));
    var sweep = phi < Math.PI / 2 ? 0 : 1;
    // lit limb on the left (waning), terminator back to the top
    return "M" + cx + " " + (cy - R) + " A" + R + " " + R + " 0 0 0 " + cx + " " + (cy + R) +
      " A" + rx.toFixed(2) + " " + R + " 0 0 " + sweep + " " + cx + " " + (cy - R) + " Z";
  }

  function moonSVG(id, cfg) {
    var cx = 100, cy = 92, R = 58;
    var names = ["Full moon", "Waning gibbous", "Waning gibbous", "Waning gibbous", "Waning gibbous",
      "Waning gibbous", "Third quarter", "Waning crescent", "Waning crescent", "Waning crescent",
      "Waning crescent", "Waning crescent", "New moon"];
    var lit = perStage(function (k, cls) {
      if (k === 12) return "";
      return '<path class="gw-moon-face ' + cls + '" d="' + moonPath(k, cx, cy, R) + '"/>';
    });
    var labels = perStage(function (k, cls) {
      return '<text class="gw-phase ' + cls + '" x="100" y="190" text-anchor="middle">' + names[k] + "</text>";
    });
    var bg = "";
    [[18, 20], [180, 30], [24, 150], [176, 140], [40, 60, 1], [165, 90, 1], [150, 168, 1], [50, 172, 1]].forEach(function (p, i) {
      bg += '<circle class="gw-star gw-twinkle" style="animation-delay:' + (i * 0.35) + 's" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (p[2] || 1.5) + '"/>';
    });
    return '<svg class="gw-svg gw-svg-sky" viewBox="0 0 200 220" aria-hidden="true" focusable="false">' +
      '<rect class="gw-night" x="0" y="0" width="200" height="220" rx="6"/>' + bg +
      '<circle class="gw-moon-dark" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>' + mirrored(cfg, lit) +
      '<circle class="gw-crater" cx="80" cy="75" r="8"/><circle class="gw-crater" cx="112" cy="110" r="11"/>' +
      '<circle class="gw-crater" cx="92" cy="124" r="5"/><circle class="gw-crater" cx="120" cy="70" r="5"/>' +
      labels + "</svg>";
  }

  /* ---------- Theme: burning fuse (12 steps) ----------
   * A flickering spark burns along a wiggly fuse; at stage 12 it reaches
   * the firework, which launches and bursts: BANG! */
  function fuseSVG() {
    var pts = [[14, 196], [30, 170], [52, 190], [66, 160], [48, 138], [70, 118], [98, 132],
               [90, 162], [112, 188], [128, 164], [114, 140], [134, 124], [158, 186]];
    var seg = "", sparks = "";
    for (var k = 1; k <= 12; k++) {
      var a = pts[k - 1], b = pts[k];
      var mx = ((a[0] + b[0]) / 2 + (k % 2 ? 8 : -8)).toFixed(0), my = ((a[1] + b[1]) / 2).toFixed(0);
      var d = "M" + a[0] + " " + a[1] + " Q" + mx + " " + my + " " + b[0] + " " + b[1];
      seg += '<path class="gw-fuse gw-h' + k + '" d="' + d + '"/><path class="gw-fuse-burnt gw-s' + k + '" d="' + d + '"/>';
      if (k < 12) {
        sparks += '<g class="gw-o' + k + '"><g class="gw-spark">' +
          '<circle class="gw-spark-glow" cx="' + b[0] + '" cy="' + b[1] + '" r="8"/>' +
          '<path class="gw-spark-line" d="M' + (b[0] - 7) + " " + b[1] + " h14 M" + b[0] + " " + (b[1] - 7) + " v14" + '"/></g></g>';
      }
    }
    var rays = "";
    var colours = ["gw-tone-1", "gw-tone-2", "gw-tone-3", "gw-tone-4", "gw-tone-5", "gw-tone-6"];
    for (var r = 0; r < 12; r++) {
      var ang = r * Math.PI / 6;
      rays += '<line class="gw-ray ' + colours[r % 6] + '" x1="' + (140 + 10 * Math.cos(ang)).toFixed(1) + '" y1="' + (52 + 10 * Math.sin(ang)).toFixed(1) +
        '" x2="' + (140 + 34 * Math.cos(ang)).toFixed(1) + '" y2="' + (52 + 34 * Math.sin(ang)).toFixed(1) + '"/>' +
        '<circle class="' + colours[(r + 3) % 6] + '" cx="' + (140 + 40 * Math.cos(ang)).toFixed(1) + '" cy="' + (52 + 40 * Math.sin(ang)).toFixed(1) + '" r="3"/>';
    }
    return wrap(
      '<line class="gw-ground" x1="6" y1="211" x2="196" y2="211"/>' +
      seg + sparks +
      '<g class="gw-h12"><rect class="gw-fw-body" x="152" y="118" width="14" height="62" rx="2"/>' +
        '<polygon class="gw-fw-nose" points="150,120 159,100 168,120"/>' +
        '<line class="gw-fw-stick" x1="159" y1="180" x2="159" y2="210"/>' +
        '<rect class="gw-fw-band" x="152" y="140" width="14" height="6"/></g>' +
      '<g class="gw-s12"><line class="gw-fw-trail" x1="159" y1="210" x2="146" y2="70"/>' +
        '<g class="gw-burst-pop">' + rays + "</g>" +
        '<text class="gw-bang" x="60" y="60" text-anchor="middle">BANG!</text></g>'
    );
  }

  /* ---------- Theme: volcano (12 steps) ----------
   * 1 crater glows, 2-4 smoke builds, 5 the ground rumbles, 6-10 lava
   * creeps down both sides, 11 ash cloud and rocks, 12 ERUPTION. */
  function volcanoSVG() {
    function lava(d, cls) {
      return '<path class="gw-lava ' + cls + '" d="' + d + '"/>';
    }
    var rocks = "";
    [[-38, -30], [-22, -46], [0, -54], [24, -44], [40, -26], [-46, -8], [48, -6]].forEach(function (v, i) {
      var x = 100 + v[0], y = 62 + v[1];
      rocks += '<polygon class="gw-rock" points="' + (x - 4) + "," + y + " " + x + "," + (y - 5) + " " + (x + 5) + "," + (y - 1) +
        " " + (x + 2) + "," + (y + 4) + '"/>';
    });
    return wrap(
      '<line class="gw-ground" x1="6" y1="207" x2="196" y2="207"/>' +
      // ash cloud behind everything
      '<g class="gw-s11"><g class="gw-drift">' +
        '<circle class="gw-ash" cx="70" cy="30" r="22"/><circle class="gw-ash" cx="100" cy="20" r="26"/>' +
        '<circle class="gw-ash" cx="132" cy="30" r="22"/><circle class="gw-ash" cx="100" cy="42" r="18"/></g></g>' +
      // smoke puffs
      '<g class="gw-s2"><circle class="gw-smoke gw-drift" cx="100" cy="54" r="8"/></g>' +
      '<g class="gw-s3"><circle class="gw-smoke gw-drift gw-drift-2" cx="110" cy="38" r="11"/></g>' +
      '<g class="gw-s4"><circle class="gw-smoke gw-drift gw-drift-3" cx="92" cy="22" r="14"/></g>' +
      // lava fountain (behind the cone so it rises out of the crater)
      '<g class="gw-s12"><path class="gw-fountain" d="M88 74 Q80 40 100 8 Q120 40 112 74 Z"/>' +
        '<path class="gw-fountain-core" d="M94 74 Q90 46 100 24 Q110 46 106 74 Z"/></g>' +
      // the cone
      '<path class="gw-cone-rock" d="M14 206 L82 72 Q100 64 118 72 L186 206 Z"/>' +
      '<path class="gw-cone-shade" d="M100 70 L118 72 L186 206 L120 206 Z"/>' +
      '<ellipse class="gw-crater-rim" cx="100" cy="72" rx="18" ry="5"/>' +
      '<g class="gw-s1"><ellipse class="gw-crater-glow gw-pulse-glow" cx="100" cy="72" rx="15" ry="4"/></g>' +
      // lava streams, left then right
      lava("M90 73 Q86 90 82 105", "gw-s6") +
      lava("M82 105 Q72 126 66 150", "gw-s7") +
      lava("M66 150 Q58 176 46 202", "gw-s9") +
      lava("M110 73 Q116 96 122 118", "gw-s8") +
      lava("M122 118 Q136 160 152 202", "gw-s10") +
      // rumble lines either side of the base
      '<g class="gw-s5"><g class="gw-shake">' +
        '<path class="gw-rumble" d="M6 190 q4 -6 8 0 q4 6 8 0 M178 190 q4 -6 8 0 q4 6 8 0"/>' +
        '<path class="gw-rumble" d="M10 176 q3 -4 6 0 q3 4 6 0 M182 176 q3 -4 6 0 q3 4 6 0"/></g></g>' +
      // eruption: rocks fly, lava pools, BOOM
      '<g class="gw-s11"><g class="gw-rocks-pop">' + rocks + "</g></g>" +
      '<g class="gw-s12">' +
        '<ellipse class="gw-lava-pool" cx="42" cy="205" rx="22" ry="4"/>' +
        '<ellipse class="gw-lava-pool" cx="156" cy="205" rx="22" ry="4"/>' +
        '<text class="gw-boom" x="38" y="56" text-anchor="middle">BOOM!</text></g>'
    );
  }

  var THEMES = {
    snowman: { svg: snowmanSVG, lose: "Oh no, the snowman melted!" },
    beaker: { svg: beakerSVG, lose: "Oh no, the beaker overflowed!" },
    balloons: { svg: balloonsSVG, lose: "Oh no, all the balloons popped!" },
    flower: { svg: flowerSVG, lose: "Oh no, the flower wilted!" },
    battery: { svg: batterySVG, lose: "Oh no, the battery went flat!" },
    thermometer: { svg: thermometerSVG, lose: "Oh no, the thermometer overheated!" },
    machine: { svg: machineSVG, lose: "Oh no, the machine rang the bell!" },
    rocket: { svg: rocketSVG, lose: "Oh no, the rocket launched without you!" },
    circuit: { svg: circuitSVG, lose: "Oh no, the bulb blew!" },
    pendulum: { svg: pendulumSVG, lose: "Oh no, the clock struck midnight!" },
    daynight: { svg: daynightSVG, lose: "Oh no, night has fallen!" },
    moon: { svg: moonSVG, lose: "Oh no, the moon has gone dark: it's a new moon!" },
    fuse: { svg: fuseSVG, lose: "Oh no, the firework went off!" },
    volcano: { svg: volcanoSVG, lose: "Oh no, the volcano erupted!" }
  };

  var PICTURE_LABELS = {
    snowman: "Snowman", beaker: "Beaker", balloons: "Balloons", flower: "Flower",
    battery: "Battery", thermometer: "Thermometer", machine: "Machine",
    rocket: "Rocket", circuit: "Circuit", pendulum: "Pendulum clock",
    daynight: "Day and night", moon: "Moon phases", fuse: "Fuse", volcano: "Volcano"
  };
  var LOOKS = [["light", "Light"], ["dark", "Dark"], ["auto", "Auto"],
    ["ocean", "Ocean"], ["forest", "Forest"], ["sunset", "Sunset"], ["contrast", "High contrast"]];

  function storeGet(k) {
    try { return JSON.parse(window.localStorage.getItem(k) || "null"); } catch (e) { return null; }
  }
  function storeSet(k, v) {
    try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ }
  }
  function storeDel(k) {
    try { window.localStorage.removeItem(k); } catch (e) { /* ignore */ }
  }

  /* ---------- helpers ---------- */
  function decode(s) {
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function button(text, cls) {
    var b = el("button", cls || "gw-btn", text);
    b.type = "button";
    return b;
  }

  // Strip accents and upper-case, so "é" counts as E.
  function norm(c) {
    return c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  }

  function isLetter(c) {
    return /^[A-Z]$/.test(norm(c));
  }

  /* ---------- the game ---------- */
  function GuessWord(root) {
    var cfg = decode(root.getAttribute("data-gw"));
    var allowSettings = cfg.settings !== false;
    var gameIndex = Array.prototype.indexOf.call(document.querySelectorAll(".guessword[data-gw]"), root);
    var settingsKey = "guessword-settings:" + location.pathname + ":" + gameIndex;
    var teacherPool = [].concat(cfg.theme || "snowman").filter(function (t) { return THEMES[t]; });
    if (!teacherPool.length) teacherPool = ["snowman"];
    var teacherLook = cfg.look || "light";
    // Student settings (only used when settings are allowed).
    var saved = (allowSettings && storeGet(settingsKey)) || {};
    var set = {
      image: saved.image || "teacher",
      lives: saved.lives || cfg.lives || 6,
      look: saved.look || teacherLook,
      hints: saved.hints !== false
    };
    if (set.image !== "teacher" && set.image !== "random" && !THEMES[set.image]) set.image = "teacher";
    if (set.lives < 3 || set.lives > 12) set.lives = cfg.lives || 6;
    function poolFor(image) {
      if (image === "random") return Object.keys(THEMES);
      if (THEMES[image]) return [image];
      return teacherPool.slice();
    }
    // cfg.theme is a list: one theme, a shortlist, or every theme ("random").
    // With more than one, each word gets a random picture (never the same
    // one twice in a row).
    var pool = poolFor(set.image);
    var themeName = pool[Math.floor(Math.random() * pool.length)];
    var theme = THEMES[themeName];

    function pickTheme(first) {
      if (pool.length < 2 || first) return;
      var choices = pool.filter(function (t) { return t !== themeName; });
      root.classList.remove("gw-theme-" + themeName);
      themeName = choices[Math.floor(Math.random() * choices.length)];
      theme = THEMES[themeName];
      root.classList.add("gw-theme-" + themeName);
    }
    var firstRound = true;
    var lives = set.lives;
    var pendingLives = null;
    var words = cfg.shuffle ? shuffle(cfg.words.slice()) : cfg.words.slice();

    var round = 0, answer = "", guessed = {}, wrong = 0, over = false;

    root.innerHTML = "";
    root.classList.add("gw-theme-" + themeName);
    if (pool.length > 1) root.classList.add("gw-random");
    applyLook(set.look);

    function applyLook(look) {
      LOOKS.forEach(function (l) { root.classList.remove("gw-look-" + l[0]); });
      root.classList.add("gw-look-" + look);
    }

    var head = el("div", "gw-head");
    var counter = el("span", "gw-round");
    head.append(el("span", "gw-title", cfg.title || "Guess the word"), counter);

    var body = el("div", "gw-body");
    var picCol = el("div", "gw-piccol");
    var pic = el("div", "gw-pic");
    var main = el("div", "gw-main");
    var wordBox = el("div", "gw-word");
    var hintBox = el("div", "gw-hint gw-hint-off");
    // The hint line always takes up its space (just invisible until shown),
    // so revealing it doesn't push the keyboard down.
    var hintShown = false;
    function showHint(on) {
      hintShown = on;
      hintBox.classList.toggle("gw-hint-off", !on);
    }
    var livesBox = el("div", "gw-lives");
    var msg = el("div", "gw-msg");
    msg.setAttribute("aria-live", "polite");
    var keys = el("div", "gw-keys");
    var ctrl = el("div", "gw-ctrl");
    var hintBtn = button("Show hint");
    var revealBtn = button("Reveal");
    var nextBtn = button("Next word", "gw-btn gw-btn-main");
    var printBtn = button("🖨 Print", "gw-btn gw-btn-print");
    printBtn.title = "Print this game as a worksheet";
    var setBtn = button("\u2699", "gw-btn gw-btn-settings");
    setBtn.title = "Settings";
    setBtn.setAttribute("aria-label", "Settings");
    setBtn.setAttribute("aria-expanded", "false");
    var panel = buildSettings();

    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (L) {
      var b = button(L, "gw-key");
      b.setAttribute("data-letter", L);
      b.setAttribute("aria-label", "Guess " + L);
      b.addEventListener("click", function () { guess(L); });
      keys.append(b);
    });

    ctrl.append(revealBtn, hintBtn, nextBtn, printBtn);
    if (allowSettings) ctrl.append(setBtn);
    printBtn.addEventListener("click", function () {
      // Print what's on screen: the current picture and wrong guesses allowed.
      printSheet(Object.assign({}, cfg, { lives: lives }), themeName);
    });
    main.append(wordBox, hintBox, msg, keys, ctrl);
    picCol.append(pic, livesBox);
    body.append(picCol, main);
    root.append(head, body);
    if (allowSettings) root.append(panel);
    setBtn.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
      setBtn.setAttribute("aria-expanded", String(!panel.hidden));
    });

    function saveSet() { storeSet(settingsKey, set); }

    function buildSettings() {
      var p = el("div", "gw-settings");
      p.hidden = true;

      // Picture
      var picRow = el("label", "gw-set-row");
      var picSel = el("select", "gw-set-select gw-in-image");
      var allPictures = teacherPool.length === Object.keys(THEMES).length;
      var teacherNames = teacherPool.map(function (t) { return PICTURE_LABELS[t]; }).join(", ");
      var teacherLabel = teacherPool.length === 1 ? "Default (" + teacherNames + ")"
        : allPictures ? "Default (random)"
        : "Default (" + teacherPool.length + " pictures)";
      [["teacher", teacherLabel], ["random", "Random each word"]].concat(
        Object.keys(THEMES).map(function (t) { return [t, PICTURE_LABELS[t] || t]; })
      ).forEach(function (o) {
        var opt = el("option", null, o[1]); opt.value = o[0]; picSel.append(opt);
      });
      picSel.value = set.image;
      if (teacherPool.length > 1 && !allPictures) picSel.options[0].title = teacherNames;
      picSel.addEventListener("change", function () {
        set.image = picSel.value; saveSet();
        changePicture();
      });
      picRow.title = "Which picture is drawn";
      picRow.append(el("span", "gw-set-label", "Picture"), picSel);

      // Lives
      var livesRow = el("label", "gw-set-row");
      var livesIn = el("input", "gw-in-lives");
      livesIn.type = "range"; livesIn.min = "3"; livesIn.max = "12"; livesIn.step = "1";
      livesIn.value = String(set.lives);
      var livesVal = el("span", "gw-set-val", String(set.lives));
      livesIn.addEventListener("input", function () {
        set.lives = +livesIn.value; livesVal.textContent = livesIn.value; saveSet();
        changeLives();
      });
      livesRow.title = "Wrong guesses allowed";
      var livesCtl = el("span", "gw-set-ctl");
      livesCtl.append(livesIn, livesVal);
      livesRow.append(el("span", "gw-set-label", "Lives"), livesCtl);
      var livesNote = el("div", "gw-set-note");
      livesNote.hidden = true;

      // Colour theme
      var lookRow = el("label", "gw-set-row");
      var lookSel = el("select", "gw-set-select gw-in-look");
      LOOKS.forEach(function (l) { var o = el("option", null, l[1]); o.value = l[0]; lookSel.append(o); });
      lookSel.value = set.look;
      lookSel.addEventListener("change", function () {
        set.look = lookSel.value; saveSet(); applyLook(set.look);
      });
      lookRow.append(el("span", "gw-set-label", "Theme"), lookSel);

      // Hint button
      var hintRow = el("label", "gw-set-row gw-set-check");
      var hintIn = el("input", "gw-in-hints");
      hintIn.type = "checkbox"; hintIn.checked = set.hints;
      hintIn.addEventListener("change", function () {
        set.hints = hintIn.checked; saveSet();
        if (!over) hintBtn.hidden = !(set.hints && words[round].h && !hintShown);
      });
      hintRow.title = "Show the hint button";
      // No word in this game has a hint, so there's nothing to switch on.
      if (!words.some(function (w) { return w.h; })) {
        hintIn.disabled = true;
        hintRow.classList.add("gw-set-disabled");
        hintRow.title = "None of these words has a hint";
      }
      hintRow.append(hintIn, el("span", null, "Hint button"));

      // Reset
      var resetBtn = el("button", "gw-set-reset", "Reset settings");
      resetBtn.type = "button";
      resetBtn.addEventListener("click", function () {
        storeDel(settingsKey);
        set = { image: "teacher", lives: cfg.lives || 6, look: teacherLook, hints: true };
        picSel.value = set.image; livesIn.value = String(set.lives);
        livesVal.textContent = String(set.lives); lookSel.value = set.look; hintIn.checked = true;
        applyLook(set.look); changePicture(); changeLives();
        if (!over) hintBtn.hidden = !(words[round].h && !hintShown);
      });

      // Two rows: picture, lives and theme; then hint button, any note, reset.
      var line1 = el("div", "gw-set-line");
      var line2 = el("div", "gw-set-line gw-set-line2");
      // Picture and Theme share the first column so Theme sits under Picture.
      line1.append(picRow, livesRow, livesNote);
      line2.append(lookRow, hintRow, resetBtn);
      p.append(line1, line2);
      p.livesNote = livesNote;
      return p;
    }

    // Swap the picture straight away, keeping how far the game has got.
    function changePicture() {
      pool = poolFor(set.image);
      root.classList.remove("gw-theme-" + themeName);
      if (pool.indexOf(themeName) === -1 || pool.length === 1) {
        themeName = pool[Math.floor(Math.random() * pool.length)];
      }
      theme = THEMES[themeName];
      root.classList.add("gw-theme-" + themeName);
      root.classList.toggle("gw-random", pool.length > 1);
      pic.innerHTML = theme.svg(++uid, cfg);
      setStage(pic, over && root.classList.contains("gw-lost") ? STAGES : stageFor(wrong));
    }

    // New lives apply now if nothing has been guessed yet in this word,
    // otherwise from the next word (so a game can't be won or lost by
    // moving the slider).
    function changeLives() {
      var guessedAny = Object.keys(guessed).length > 0;
      if (over || !guessedAny) {
        lives = set.lives; pendingLives = null;
        panel.livesNote.hidden = true;
        if (!over) { setStage(pic, stageFor(wrong)); drawLives(); }
      } else {
        pendingLives = set.lives;
        panel.livesNote.textContent = "New lives start with the next word.";
        panel.livesNote.hidden = pendingLives === lives;
      }
    }

    hintBtn.addEventListener("click", function () {
      showHint(true);
      hintBtn.hidden = true;
    });
    revealBtn.addEventListener("click", function () { finish("revealed"); });
    nextBtn.addEventListener("click", function () {
      if (round < words.length - 1) {
        start(round + 1);
      } else {
        if (cfg.shuffle) shuffle(words);
        start(0);
      }
      root.focus({ preventScroll: true });
    });

    // Physical keyboard: handled at page level (see the bottom of this file)
    // so typing works without clicking the game first, and keeps working
    // after an on-screen key is clicked and disabled.
    GAMES.push({
      root: root,
      key: function (e) {
        if (e.key === "Enter") {
          if (!over) return false;
          // Let a focused button handle its own Enter.
          if (e.target && e.target.tagName === "BUTTON" && root.contains(e.target)) return false;
          nextBtn.click();
          return true;
        }
        if (e.key && e.key.length === 1) {
          var k = norm(e.key);
          if (/^[A-Z]$/.test(k)) {
            guess(k);
            return true;
          }
        }
        return false;
      }
    });
    root.addEventListener("pointerdown", function () { setActive(root); });
    root.addEventListener("focusin", function () { setActive(root); });

    function stageFor(w) {
      if (w <= 0) return 0;
      if (w >= lives) return STAGES;
      return Math.min(STAGES - 1, Math.max(1, Math.round(w * STAGES / lives)));
    }

    function drawWord(reveal) {
      wordBox.innerHTML = "";
      answer.split(/(\s+)/).forEach(function (token) {
        if (!token) return;
        if (/^\s+$/.test(token)) return; // gap between words handled by CSS gap
        var wd = el("span", "gw-wd");
        Array.from(token).forEach(function (c) {
          var ch = el("span", "gw-ch");
          if (isLetter(c)) {
            var known = guessed[norm(c)];
            if (known || reveal) ch.textContent = c.toUpperCase();
            if (!known && reveal) ch.classList.add("gw-missed");
            if (!known && !reveal) ch.setAttribute("aria-label", "blank");
          } else {
            ch.textContent = c;
            ch.classList.add("gw-fixed");
          }
          wd.append(ch);
        });
        wordBox.append(wd);
      });
    }

    function drawLives() {
      var left = Math.max(0, lives - wrong);
      livesBox.innerHTML = "";
      livesBox.append(el("span", "gw-lives-label", "Guesses left: " + left));
      var dots = el("span", "gw-dots");
      for (var i = 0; i < lives; i++) dots.append(el("span", i < left ? "gw-dot" : "gw-dot gw-dot-used"));
      livesBox.append(dots);
    }

    function solved() {
      return Array.from(answer).every(function (c) { return !isLetter(c) || guessed[norm(c)]; });
    }

    function guess(L) {
      if (over || guessed[L]) return;
      guessed[L] = true;
      var hit = Array.from(answer).some(function (c) { return norm(c) === L; });
      var key = keys.querySelector('[data-letter="' + L + '"]');
      if (key) {
        key.disabled = true;
        key.classList.add(hit ? "gw-hit" : "gw-miss");
      }
      if (!hit) {
        wrong++;
        setStage(pic, stageFor(wrong));
      }
      drawWord(false);
      drawLives();
      if (solved()) finish("won");
      else if (wrong >= lives) finish("lost");
    }

    function finish(state) {
      over = true;
      root.classList.add(state === "won" ? "gw-won" : "gw-lost");
      var shown = answer.toUpperCase();
      if (state === "won") {
        msg.textContent = "Well done! You got it.";
      } else if (state === "lost") {
        setStage(pic, STAGES);
        msg.textContent = theme.lose + " The word was " + shown + ".";
      } else {
        msg.textContent = "The word was " + shown + ".";
      }
      drawWord(state !== "won");
      keys.querySelectorAll(".gw-key").forEach(function (b) { b.disabled = true; });
      revealBtn.hidden = true;
      hintBtn.hidden = true;
      if (words[round].h) showHint(true);
      nextBtn.textContent = round < words.length - 1 ? "Next word" : "Play again";
      nextBtn.hidden = false;
    }

    function start(i) {
      if (pendingLives !== null) { lives = pendingLives; pendingLives = null; panel.livesNote.hidden = true; }
      round = i;
      answer = words[i].w;
      guessed = {};
      wrong = 0;
      over = false;
      root.classList.remove("gw-won", "gw-lost");
      pickTheme(firstRound);
      firstRound = false;
      pic.innerHTML = theme.svg(++uid, cfg);
      setStage(pic, 0);
      hintBox.textContent = words[i].h ? "Hint: " + words[i].h : "";
      showHint(false);
      hintBtn.hidden = !(words[i].h && set.hints);
      counter.textContent = words.length > 1 ? "Word " + (i + 1) + " of " + words.length : "";
      msg.textContent = "";
      keys.querySelectorAll(".gw-key").forEach(function (b) {
        b.disabled = false;
        b.className = "gw-key";
      });
      revealBtn.hidden = false;
      nextBtn.hidden = true;
      drawWord(false);
      drawLives();
    }

    // Keep the keyboard still: reserve room for the tallest hint and the
    // longest end-of-word message in this game, so nothing above the
    // keyboard changes height when a hint shows, a word ends or the next
    // word starts.
    function fitSpace() {
      if (!root.offsetWidth) return;
      var curHint = hintBox.textContent, curMsg = msg.textContent;
      var curAnswer = answer, curWord = Array.from(wordBox.childNodes);
      hintBox.style.minHeight = ""; msg.style.minHeight = ""; wordBox.style.minHeight = "";
      var maxHint = 0, maxMsg = 0, maxWord = 0;
      var allPics = Object.keys(THEMES);
      words.forEach(function (w) {
        if (w.h) {
          hintBox.textContent = "Hint: " + w.h;
          maxHint = Math.max(maxHint, hintBox.offsetHeight);
        }
        // long words can wrap onto a second line of letter boxes
        answer = w.w;
        drawWord(true);
        maxWord = Math.max(maxWord, wordBox.offsetHeight);
        var shown = String(w.w).toUpperCase();
        // every picture, so changing the picture in settings can't move things
        allPics.forEach(function (t) {
          msg.textContent = THEMES[t].lose + " The word was " + shown + ".";
          maxMsg = Math.max(maxMsg, msg.offsetHeight);
        });
      });
      hintBox.textContent = curHint; msg.textContent = curMsg;
      answer = curAnswer;
      wordBox.replaceChildren.apply(wordBox, curWord);
      if (maxHint) hintBox.style.minHeight = maxHint + "px";
      if (maxMsg) msg.style.minHeight = maxMsg + "px";
      if (maxWord) wordBox.style.minHeight = maxWord + "px";
    }

    start(0);
    fitSpace();
    var fitTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(fitTimer);
      fitTimer = setTimeout(fitSpace, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSpace);
  }

  /* ---------- printable worksheet ---------- */
  // Words print in the order written in the RST (not shuffled), so the
  // worksheet and answer key always line up.
  function sheetWord(word, fill) {
    var row = el("div", "gw-pw");
    word.split(/\s+/).forEach(function (token) {
      if (!token) return;
      var wd = el("span", "gw-pwd");
      Array.from(token).forEach(function (c) {
        var box = el("span", isLetter(c) ? "gw-pbox" : "gw-pbox gw-pfixed");
        if (!isLetter(c) || fill) box.textContent = c.toUpperCase();
        wd.append(box);
      });
      row.append(wd);
    });
    return row;
  }

  function buildSheet(cfg, themeName, fill) {
    var page = el("section", fill ? "gw-page gw-page-key" : "gw-page");
    page.append(el("h2", "gw-ptitle", (cfg.title || "Guess the word") + (fill ? ": answers" : "")));
    if (!fill) {
      page.append(el("div", "gw-pname", "Name: ______________________________   Date: ______________"));
      var n = cfg.words.length;
      page.append(el("p", "gw-pinstr", n > 1
        ? "Work out each missing word. Use the hints to help you."
        : "Work out the missing word. Use the hint to help you."));
    }
    var list = el("ol", "gw-plist");
    cfg.words.forEach(function (w) {
      var li = el("li", "gw-pitem");
      if (w.h) li.append(el("div", "gw-phint", w.h));
      li.append(sheetWord(w.w, fill));
      if (!fill) {
        li.append(el("div", "gw-palpha", "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z"));
      }
      list.append(li);
    });
    page.append(list);
    if (!fill) {
      var pic = el("div", "gw-ppic");
      pic.innerHTML = THEMES[themeName].svg("p" + (++uid), cfg);
      setStage(pic, 0);
      page.append(pic);
      page.append(el("p", "gw-pnote",
        "Playing with a partner? Cross off letters as they are guessed, and " +
        "count the wrong guesses (" + (cfg.lives || 6) + " allowed)."));
    }
    return page;
  }

  // The worksheet prints from its own hidden frame, so print rules from
  // other extensions on the page (e.g. ones that hide everything but
  // themselves) can't blank it out.
  function cssHref() {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      if (/guessword\.css(\?|$)/.test(links[i].getAttribute("href") || "")) return links[i].href;
    }
    return null;
  }

  function printSheet(cfg, themeName) {
    var old = document.querySelector("iframe.gw-print-frame");
    if (old) old.remove();

    var host = el("div", "gw-print-host");
    host.append(buildSheet(cfg, themeName, false));
    if (cfg.answers === "print") host.append(buildSheet(cfg, themeName, true));

    var href = cssHref();
    var doc = '<!doctype html><html><head><meta charset="utf-8">' +
      "<title>" + (cfg.title || "Guess the word").replace(/[<&]/g, "") + "</title>" +
      (href ? '<link rel="stylesheet" href="' + href.replace(/"/g, "&quot;") + '">' : "") +
      "<style>@page{margin:15mm}html,body{margin:0;background:#fff}" +
      ".gw-print-host{display:block!important}</style>" +
      "</head><body>" + host.outerHTML + "</body></html>";

    var frame = document.createElement("iframe");
    frame.className = "gw-print-frame";
    frame.setAttribute("aria-hidden", "true");
    frame.setAttribute("tabindex", "-1");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    var printed = false;
    frame.onload = function () {
      if (printed) return;
      printed = true;
      var win = frame.contentWindow;
      // Tidy up after the dialog closes. A leftover frame is also removed
      // the next time Print is pressed.
      win.addEventListener("afterprint", function () { setTimeout(function () { frame.remove(); }, 100); });
      win.focus();
      win.print();
    };
    frame.srcdoc = doc;
    document.body.append(frame);
  }

  /* ---------- page-level keyboard ---------- */
  var GAMES = [];
  var activeRoot = null;

  function setActive(root) {
    if (activeRoot === root) return;
    if (activeRoot) activeRoot.classList.remove("gw-active");
    activeRoot = root;
    if (root) root.classList.add("gw-active");
  }

  // How much of an element is on screen (0 = none).
  function visibleArea(el) {
    var r = el.getBoundingClientRect();
    var w = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0);
    var h = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    return w > 0 && h > 0 ? w * h : 0;
  }

  function targetGame(e) {
    // 1. the game the key was pressed inside
    for (var i = 0; i < GAMES.length; i++) {
      if (GAMES[i].root.contains(e.target)) return GAMES[i];
    }
    // 2. the last game used, if it is still on screen
    for (var j = 0; j < GAMES.length; j++) {
      if (GAMES[j].root === activeRoot && visibleArea(activeRoot) > 0) return GAMES[j];
    }
    // 3. otherwise the game most visible on screen
    var best = null, bestArea = 0;
    GAMES.forEach(function (g) {
      var a = visibleArea(g.root);
      if (a > bestArea) { best = g; bestArea = a; }
    });
    return best;
  }

  document.addEventListener("keydown", function (e) {
    if (!GAMES.length || e.defaultPrevented) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    // Never steal keys from text boxes or other editable content.
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var game = targetGame(e);
    if (game && game.key(e)) {
      setActive(game.root);
      e.preventDefault();
    }
  });

  function init() {
    document.querySelectorAll(".guessword[data-gw]").forEach(function (root) {
      if (root.getAttribute("data-gw-ready")) return;
      root.setAttribute("data-gw-ready", "1");
      try {
        GuessWord(root);
      } catch (err) {
        console.error("guessword:", err);
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
