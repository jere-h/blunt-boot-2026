/*
 * The Blunt Boot Index — rendering + logic.
 * Reads window.BLUNT_BOOT_DATA (official FIFA attacking stats, see data/
 * players.js). The Index keeps only GOALLESS attackers (players with shots but
 * no goals) and ranks them by shots taken — most shots with nothing to show for
 * it first. Also renders the own-goal register and other inefficiencies.
 */
(function () {
  "use strict";

  var DATA = window.BLUNT_BOOT_DATA || {};
  var MIN_SHOTS = typeof DATA.min_shots === "number" ? DATA.min_shots : 3;
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Goalless attackers only, above the shot floor.
  var ALL = (DATA.shooters || [])
    .filter(function (p) {
      return typeof p.shots === "number" && p.shots >= MIN_SHOTS && (p.goals || 0) === 0;
    })
    .map(function (p) {
      return {
        name: p.name, nation: p.nation, pos: p.pos,
        shots: p.shots, ontarget: (typeof p.ontarget === "number") ? p.ontarget : null
      };
    });

  var MAX_SHOTS = ALL.reduce(function (m, r) { return r.shots > m ? r.shots : m; }, 0) || 1;

  var POS_LABEL = { FW: "Forwards", MF: "Midfielders", DF: "Defenders", GK: "Goalkeepers" };
  var sortKey = "shots", sortDir = -1, filter = "all";

  function passesFilter(r) { return filter === "all" || r.pos === filter; }

  function cmp(a, b) {
    var va = a[sortKey], vb = b[sortKey];
    var na = (va == null), nb = (vb == null);
    if (na && nb) return tiebreak(a, b);
    if (na) return 1;
    if (nb) return -1;
    var d = (typeof va === "string") ? va.localeCompare(vb) * sortDir : (va - vb) * sortDir;
    return d !== 0 ? d : tiebreak(a, b);
  }
  function tiebreak(a, b) { return (b.shots || 0) - (a.shots || 0); }

  function appendCell(tr, text, cls) {
    var td = document.createElement("td");
    if (cls) td.className = cls;
    if (text != null && text !== "") td.textContent = text;
    tr.appendChild(td);
    return td;
  }
  function flagImg(nation) {
    if (!nation) return "";
    return '<img class="flag" src="img/flags/' + nation + '.png" alt="' + nation +
      '" loading="lazy" width="21" height="14" />';
  }

  function renderShooting() {
    var body = document.getElementById("shootingBody");
    var note = document.getElementById("shootingCount");
    body.innerHTML = "";
    var rows = ALL.filter(passesFilter).slice().sort(cmp);
    var stagger = rows.length <= 40 && !reduceMotion;

    rows.forEach(function (r, i) {
      var tr = document.createElement("tr");
      tr.className = "reveal" + (i < 3 ? " row-podium" : "");
      if (stagger) tr.style.animationDelay = (i * 35) + "ms";
      else tr.style.animation = "none";

      appendCell(tr, String(i + 1), "col-rank");

      var player = appendCell(tr, "", "col-player");
      player.innerHTML = flagImg(r.nation) +
        '<span class="p-text"><span class="p-name"></span><span class="p-nation"></span></span>';
      player.querySelector(".p-name").textContent = r.name;
      player.querySelector(".p-nation").textContent =
        (r.nation || "") + (r.pos ? " · " + r.pos : "");

      appendCell(tr, r.ontarget == null ? "—" : String(r.ontarget), "col-num col-soft");

      // Shots: the headline number, with a magnitude bar.
      var shotsTd = appendCell(tr, "", "col-num col-shots");
      var pct = Math.max(6, Math.round((r.shots / MAX_SHOTS) * 100));
      shotsTd.innerHTML = '<span class="shots-val"></span>' +
        '<span class="shots-bar"><span class="shots-fill"></span></span>';
      shotsTd.querySelector(".shots-val").textContent = String(r.shots);
      var fill = shotsTd.querySelector(".shots-fill");
      if (reduceMotion) fill.style.width = pct + "%";
      else requestAnimationFrame(function () { fill.style.width = pct + "%"; });

      body.appendChild(tr);
    });

    note.textContent = rows.length + " goalless attacker" + (rows.length === 1 ? "" : "s") +
      (filter === "all" ? " with " + MIN_SHOTS + "+ shots" : " (" + (POS_LABEL[filter] || filter) + ")");
  }

  function wireSort() {
    var heads = document.querySelectorAll("#shootingTable th.sortable");
    Array.prototype.forEach.call(heads, function (th) {
      th.addEventListener("click", function () {
        var key = th.dataset.key;
        if (sortKey === key) sortDir = -sortDir;
        else { sortKey = key; sortDir = (key === "name") ? 1 : -1; }
        Array.prototype.forEach.call(heads, function (h) {
          h.classList.toggle("is-sorted", h === th);
          h.classList.toggle("asc", h === th && sortDir === 1);
          h.classList.toggle("desc", h === th && sortDir === -1);
        });
        renderShooting();
      });
    });
  }

  function buildKpis() {
    var host = document.getElementById("kpis");
    var totalShots = ALL.reduce(function (s, r) { return s + (r.shots || 0); }, 0);
    var mostShots = ALL.reduce(function (m, r) { return r.shots > m ? r.shots : m; }, 0);
    var onTarget = ALL.reduce(function (s, r) { return s + (r.ontarget || 0); }, 0);
    var tiles = [
      { v: ALL.length, dp: 0, label: "Goalless attackers", sub: "shots, but no goals" },
      { v: mostShots, dp: 0, label: "Most shots, no goal", sub: "the blunt-boot leader" },
      { v: totalShots, dp: 0, label: "Shots, all wasted", sub: "not one found the net" },
      { v: onTarget, dp: 0, label: "On target, still nothing", sub: "keepers and woodwork obliged" }
    ];
    tiles.forEach(function (t) {
      var el = document.createElement("div");
      el.className = "kpi";
      el.innerHTML = '<span class="kpi-num" data-target="' + t.v + '" data-dp="' + t.dp + '">0</span>' +
        '<span class="kpi-label"></span><span class="kpi-sub"></span>';
      el.querySelector(".kpi-label").textContent = t.label;
      el.querySelector(".kpi-sub").textContent = t.sub;
      host.appendChild(el);
    });
  }

  function countUp() {
    Array.prototype.forEach.call(document.querySelectorAll(".kpi-num"), function (el) {
      var target = parseFloat(el.dataset.target), dp = parseInt(el.dataset.dp, 10) || 0;
      if (reduceMotion) { el.textContent = target.toFixed(dp); return; }
      var start = null, dur = 950;
      function step(ts) {
        if (start == null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dp);
        if (p < 1) requestAnimationFrame(step); else el.textContent = target.toFixed(dp);
      }
      requestAnimationFrame(step);
    });
  }

  function fillChrome() {
    document.getElementById("dateline").textContent = DATA.as_of || "";
    document.getElementById("methodology").textContent =
      "The Blunt Boot Index keeps only goalless attackers — players who have taken at " +
      "least " + MIN_SHOTS + " shots at the 2026 World Cup without scoring a single goal — " +
      "and ranks them by shots taken, most first. Figures are the official FIFA attacking " +
      "statistics; On Target counts the goalless shots that still forced a save or hit the " +
      "frame. Filter by position, or sort any column.";
    document.getElementById("sources").innerHTML = "<strong>Sources:</strong> " +
      (DATA.sources || []).join("; ") + ".";
  }

  function init() {
    fillChrome();
    buildKpis();
    wireSort();
    document.getElementById("filter").addEventListener("change", function (e) {
      filter = e.target.value;
      renderShooting();
    });
    renderShooting();
    countUp();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
