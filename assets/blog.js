/* =========================================================================
   How LLMs Really Work — shared behaviour
   - sidebar + on-page TOC + prev/next navigation (from CHAPTERS)
   - reading progress bar
   - .stepper figures: step-by-step animated diagrams
   - .reveal elements: fade in when scrolled into view
   ========================================================================= */
(function () {
  "use strict";

  var CHAPTERS = [
    { n: "P1", file: "p1-machine-learning.html", title: "What Machine Learning Is", part: "Part 0 · Primer" },
    { n: "P2", file: "p2-vectors-and-matrices.html", title: "Vectors & Matrices", part: "Part 0 · Primer" },
    { n: "P3", file: "p3-derivatives-and-backprop.html", title: "Derivatives & Backprop", part: "Part 0 · Primer" },
    { n: "P4", file: "p4-probability-and-information.html", title: "Probability & Information", part: "Part 0 · Primer" },
    { n: "P5", file: "p5-tools.html", title: "Tools: NumPy, PyTorch & Hugging Face", part: "Part 0 · Primer" },
    { n: "P6", file: "p6-before-transformers.html", title: "Language Models Before Transformers", part: "Part 0 · Primer" },
    { n: "01", file: "01-big-picture.html", title: "The Big Picture", part: "Part I · Foundations" },
    { n: "02", file: "02-numbers-and-hardware.html", title: "Numbers & the Machine", part: "Part I · Foundations" },
    { n: "03", file: "03-tokens.html", title: "Tokens", part: "Part I · Foundations" },
    { n: "04", file: "04-neural-net-toolkit.html", title: "The Neural-Net Toolkit", part: "Part I · Foundations" },
    { n: "05", file: "05-attention.html", title: "Attention", part: "Part II · The Architecture" },
    { n: "06", file: "06-transformer.html", title: "The Transformer, End to End", part: "Part II · The Architecture" },
    { n: "07", file: "07-mixture-of-experts.html", title: "Mixture of Experts", part: "Part II · The Architecture" },
    { n: "08", file: "08-pretraining.html", title: "Pretraining", part: "Part III · Training" },
    { n: "09", file: "09-post-training.html", title: "Post-Training & Fine-Tuning", part: "Part III · Training" },
    { n: "10", file: "10-reasoning.html", title: "Reasoning, Thinking & Effort", part: "Part III · Training" },
    { n: "11", file: "11-inference.html", title: "Inference: Prefill, Decode & Memory", part: "Part IV · Inference" },
    { n: "12", file: "12-kv-cache.html", title: "The KV Cache", part: "Part IV · Inference" },
    { n: "13", file: "13-quantization.html", title: "Quantization", part: "Part IV · Inference" },
    { n: "14", file: "14-sampling.html", title: "Sampling & Temperature", part: "Part IV · Inference" },
    { n: "15", file: "15-serving.html", title: "Serving at Scale", part: "Part IV · Inference" },
    { n: "16", file: "16-life-of-a-request.html", title: "Life of a Request & Cheat Sheet", part: "Part V · Synthesis" }
  ];

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function slug(s) {
    return s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  }

  /* ---------------- navigation ---------------- */
  function buildNav() {
    var current = document.body.getAttribute("data-chapter") || "";
    var side = document.getElementById("sidebar");
    if (!side) {
      side = el("nav", { id: "sidebar" });
      var layout = document.querySelector(".layout") || document.body;
      layout.insertBefore(side, layout.firstChild);
    }
    var html = '<a class="brand" href="index.html">How LLMs Really Work</a>' +
      '<div class="brand-sub">From transistors to tokens</div>';
    var lastPart = null;
    CHAPTERS.forEach(function (c, i) {
      if (c.part !== lastPart) {
        if (lastPart !== null) html += "</ol>";
        html += '<div class="part">' + c.part + "</div><ol>";
        lastPart = c.part;
      }
      var cur = c.n === current;
      html += '<li class="' + (cur ? "current" : "") + '"><a href="' + c.file + '"><span class="n">' + c.n +
        "</span><span>" + c.title + "</span></a>" + (cur ? '<div class="onpage" id="onpage"></div>' : "") + "</li>";
    });
    html += "</ol>";
    side.innerHTML = html;

    // on-page TOC from h2
    var onpage = document.getElementById("onpage");
    var heads = Array.prototype.slice.call(document.querySelectorAll("main.article h2"));
    heads.forEach(function (h) {
      if (!h.id) h.id = slug(h.textContent);
      if (onpage) {
        var a = el("a", { href: "#" + h.id }, h.textContent);
        onpage.appendChild(a);
      }
    });
    if (onpage && "IntersectionObserver" in window) {
      var links = onpage.querySelectorAll("a");
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            links.forEach(function (l) { l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id); });
          }
        });
      }, { rootMargin: "0px 0px -70% 0px" });
      heads.forEach(function (h) { spy.observe(h); });
    }

    // prev / next
    var idx = -1;
    CHAPTERS.forEach(function (c, i) { if (c.n === current) idx = i; });
    var foot = document.getElementById("chapter-nav");
    if (foot && idx >= 0) {
      var s = "";
      if (idx > 0) s += '<a class="prev" href="' + CHAPTERS[idx - 1].file + '"><small>&larr; Previous</small>' + CHAPTERS[idx - 1].n + " · " + CHAPTERS[idx - 1].title + "</a>";
      else s += '<a class="prev" href="index.html"><small>&larr; Back</small>Contents</a>';
      if (idx < CHAPTERS.length - 1) s += '<a class="next" href="' + CHAPTERS[idx + 1].file + '"><small>Next &rarr;</small>' + CHAPTERS[idx + 1].n + " · " + CHAPTERS[idx + 1].title + "</a>";
      else s += '<a class="next" href="index.html"><small>Done &rarr;</small>Contents</a>';
      foot.innerHTML = s;
    }

    // mobile toggle
    var btn = el("button", { id: "menu-toggle", type: "button" }, "&#9776; Chapters");
    btn.addEventListener("click", function () { document.body.classList.toggle("nav-open"); });
    document.body.appendChild(btn);
    side.addEventListener("click", function (e) { if (e.target.closest("a")) document.body.classList.remove("nav-open"); });
  }

  /* ---------------- progress bar ---------------- */
  function buildProgress() {
    var bar = el("div", { id: "progress" });
    document.body.appendChild(bar);
    function upd() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
    window.addEventListener("scroll", upd, { passive: true });
    upd();
  }

  /* ---------------- reveal on view ---------------- */
  function onInView(node, cb, opts) {
    if (!("IntersectionObserver" in window)) { cb(node); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { cb(en.target); if (!(opts && opts.repeat)) io.unobserve(en.target); }
      });
    }, { threshold: (opts && opts.threshold) || 0.25 });
    io.observe(node);
    return io;
  }
  function initReveal() {
    document.querySelectorAll(".reveal, [data-inview]").forEach(function (n) {
      onInView(n, function (t) { t.classList.add("in-view"); });
    });
  }

  /* ---------------- stepper figures ----------------
     <figure class="stepper" data-steps="5" data-interval="2600" data-autoplay data-loop>
       <svg> <g data-step="2">visible from step 2 on</g>
             <g data-step-only="3">visible only at step 3</g>
             <g data-step-range="2-4">visible at steps 2..4</g> </svg>
       <div class="step-captions"><p data-step-only="1">...</p>...</div>
       <figcaption>...</figcaption>
     </figure>
     The figure also gets class "at-step-K" and data-current="K", and fires a
     "stepchange" CustomEvent with detail {step, total}. Steps are 1-based. */
  function initSteppers() {
    document.querySelectorAll(".stepper").forEach(function (fig) {
      var items = Array.prototype.slice.call(fig.querySelectorAll("[data-step],[data-step-only],[data-step-range]"));
      var total = parseInt(fig.getAttribute("data-steps"), 10);
      if (!total) {
        total = 1;
        items.forEach(function (n) {
          var v = n.getAttribute("data-step") || n.getAttribute("data-step-only") || (n.getAttribute("data-step-range") || "").split("-")[1];
          total = Math.max(total, parseInt(v, 10) || 1);
        });
      }
      var interval = parseInt(fig.getAttribute("data-interval"), 10) || 2600;
      var loop = fig.hasAttribute("data-loop");
      var cur = parseInt(fig.getAttribute("data-start"), 10) || 1;
      var timer = null;

      var bar = el("div", { class: "stepper-controls" });
      var bReset = el("button", { type: "button", class: "btn", title: "Restart" }, "&#8634;");
      var bPrev = el("button", { type: "button", class: "btn" }, "&#9664; Prev");
      var bPlay = el("button", { type: "button", class: "btn primary" }, "&#9654; Play");
      var bNext = el("button", { type: "button", class: "btn" }, "Next &#9654;");
      var dots = el("div", { class: "dots" });
      var count = el("span", { class: "step-count" });
      for (var i = 1; i <= total; i++) {
        (function (k) {
          var d = el("span", { title: "Step " + k });
          d.addEventListener("click", function () { stop(); go(k); });
          dots.appendChild(d);
        })(i);
      }
      [bReset, bPrev, bPlay, bNext, dots, count].forEach(function (b) { bar.appendChild(b); });
      var cap = fig.querySelector(":scope > figcaption");
      if (cap) fig.insertBefore(bar, cap); else fig.appendChild(bar);

      function visible(n, k) {
        var a = n.getAttribute("data-step");
        if (a != null) return k >= parseInt(a, 10);
        a = n.getAttribute("data-step-only");
        if (a != null) return a.split(",").map(function (x) { return parseInt(x, 10); }).indexOf(k) >= 0;
        a = n.getAttribute("data-step-range");
        if (a != null) { var p = a.split("-"); return k >= parseInt(p[0], 10) && k <= parseInt(p[1], 10); }
        return true;
      }
      function go(k) {
        k = Math.max(1, Math.min(total, k));
        fig.classList.remove("at-step-" + cur);
        cur = k;
        fig.classList.add("at-step-" + cur);
        fig.setAttribute("data-current", cur);
        items.forEach(function (n) { n.classList.toggle("step-hidden", !visible(n, cur)); });
        Array.prototype.forEach.call(dots.children, function (d, i) { d.classList.toggle("on", i + 1 === cur); });
        count.textContent = "Step " + cur + " / " + total;
        bPrev.disabled = cur === 1;
        bNext.disabled = cur === total && !loop;
        fig.dispatchEvent(new CustomEvent("stepchange", { detail: { step: cur, total: total } }));
      }
      function play() {
        if (timer) return;
        if (cur === total) go(1);
        bPlay.innerHTML = "&#10074;&#10074; Pause";
        timer = setInterval(function () {
          if (cur < total) go(cur + 1);
          else if (loop) go(1);
          else stop();
        }, interval);
      }
      function stop() {
        if (timer) clearInterval(timer);
        timer = null;
        bPlay.innerHTML = "&#9654; Play";
      }
      bPlay.addEventListener("click", function () { timer ? stop() : play(); });
      bNext.addEventListener("click", function () { stop(); go(cur < total ? cur + 1 : 1); });
      bPrev.addEventListener("click", function () { stop(); go(cur - 1); });
      bReset.addEventListener("click", function () { stop(); go(1); });
      fig.setAttribute("tabindex", "0");
      fig.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { stop(); go(cur + 1); e.preventDefault(); }
        if (e.key === "ArrowLeft") { stop(); go(cur - 1); e.preventDefault(); }
        if (e.key === " ") { timer ? stop() : play(); e.preventDefault(); }
      });
      fig._stepper = { go: go, play: play, stop: stop, get step() { return cur; }, total: total };
      fig.classList.add("stepper-init");
      go(cur);
      requestAnimationFrame(function () { requestAnimationFrame(function () { fig.classList.remove("stepper-init"); }); });
      if (fig.hasAttribute("data-autoplay")) onInView(fig, function () { play(); }, { threshold: 0.5 });
    });
  }

  /* ---------------- small helpers for widgets ---------------- */
  function fmtBytes(b) {
    var u = ["B", "KB", "MB", "GB", "TB", "PB"], i = 0;
    while (Math.abs(b) >= 1000 && i < u.length - 1) { b /= 1000; i++; }
    return (b >= 100 || i === 0 ? b.toFixed(0) : b >= 10 ? b.toFixed(1) : b.toFixed(2)) + " " + u[i];
  }
  function fmtBytesBin(b) {
    var u = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"], i = 0;
    while (Math.abs(b) >= 1024 && i < u.length - 1) { b /= 1024; i++; }
    return (b >= 100 || i === 0 ? b.toFixed(0) : b >= 10 ? b.toFixed(1) : b.toFixed(2)) + " " + u[i];
  }
  function fmtNum(x, digits) {
    var abs = Math.abs(x), d = digits == null ? 2 : digits;
    if (abs >= 1e15) return (x / 1e15).toFixed(d) + "P";
    if (abs >= 1e12) return (x / 1e12).toFixed(d) + "T";
    if (abs >= 1e9) return (x / 1e9).toFixed(d) + "B";
    if (abs >= 1e6) return (x / 1e6).toFixed(d) + "M";
    if (abs >= 1e3) return (x / 1e3).toFixed(d) + "K";
    return x.toFixed(abs < 10 ? d : 0);
  }

  window.Blog = { CHAPTERS: CHAPTERS, onInView: onInView, fmtBytes: fmtBytes, fmtBytesBin: fmtBytesBin, fmtNum: fmtNum };

  function init() { buildNav(); buildProgress(); initReveal(); initSteppers(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
