/* ============================================================
   Tauhid & Shaily — Wedding Invitation
   ============================================================ */

/* ============================================================
   CONFIG — the only values you should ever need to edit
   ============================================================ */

// Final site URL (no trailing slash). Also update the OG tags in index.html.
const SITE_URL = "https://tauhid-weds-shaily.github.io";

// Wedding date-time with explicit UTC offset (Bangladesh = +06:00).
const WEDDING_ISO = "2027-01-08T13:00:00+06:00";
const WEDDING_DURATION_HOURS = 4; // used for the calendar entry

const EVENT = {
  title: "Tauhid & Shaily — Wedding",
  description: "With the blessings of our families, we invite you to celebrate with us.",
  location: "BGB Banquet Hall, Shimanto Sombhar 4th Floor, Road No. 2, Dhaka 1205, Bangladesh"
};

/* ============================================================
   Setup
   ============================================================ */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let dustStarted = false;

/* ---------- Intro: build the ink letters, start when font is ready ---------- */
(function initIntro() {
  const NAME_TEXT = "Tauhid & Shaily";
  const textEl = document.getElementById("ink-names");
  const SVG_NS = "http://www.w3.org/2000/svg";

  // Wax-seal-only variant has no ink text — just fade the envelope in
  // (after Great Vibes loads, so the seal monogram renders in calligraphy).
  if (!textEl) {
    const intro = document.getElementById("intro");
    const start = () => intro.classList.add("ready");
    if (document.fonts && document.fonts.load) {
      Promise.race([
        document.fonts.load('400 40px "Great Vibes"'),
        new Promise((res) => setTimeout(res, 2000))
      ]).then(start);
    } else {
      setTimeout(start, 300);
    }
    return;
  }

  [...NAME_TEXT].forEach((ch, i) => {
    const tspan = document.createElementNS(SVG_NS, "tspan");
    tspan.textContent = ch === " " ? " " : ch;
    tspan.classList.add("ink-letter");
    tspan.style.setProperty("--i", i);
    textEl.appendChild(tspan);
  });

  const intro = document.getElementById("intro");
  const start = () => intro.classList.add("ready");

  if (document.fonts && document.fonts.load) {
    Promise.race([
      document.fonts.load('400 78px "Great Vibes"'),
      new Promise((res) => setTimeout(res, 2500)) // fallback if font stalls
    ]).then(start);
  } else {
    setTimeout(start, 600);
  }
})();

/* ---------- Open: lift the overlay, unlock scroll, wake the page ---------- */
(function initOpen() {
  const intro = document.getElementById("intro");
  const btn = document.getElementById("open-btn");
  const hasSeal = Boolean(intro.querySelector(".seal-btn"));
  let opened = false;

  function open() {
    if (opened) return;
    opened = true;

    intro.classList.add("open");
    document.body.classList.remove("locked");

    startDust();
    initReveals();

    // Remove the overlay from the tree after its exit transition.
    setTimeout(() => intro.remove(), 1400);
  }

  function beginOpen() {
    if (opened || intro.classList.contains("cracking")) return;
    if (hasSeal && !reducedMotion) {
      // Choreography: seal cracks → flap opens like a real envelope →
      // card slides fully out and floats, readable → overlay lifts.
      intro.classList.add("cracking");
      setTimeout(open, 2500);
    } else {
      open();
    }
  }

  btn.addEventListener("click", beginOpen);

  // Dev/preview shortcut: #crack freezes the intro in its opened-envelope state.
  if (location.hash === "#crack") intro.classList.add("cracking");

  // Dev/preview shortcut: #peek skips the intro and shows everything at once
  // (useful while designing; guests never see this). #peek2 also jumps to
  // section index 2, etc.
  const peek = location.hash.match(/^#peek(\d+)?$/);
  if (peek) {
    open();
    document.querySelectorAll(".reveal").forEach((el) => {
      el.style.transition = "none";
      el.classList.add("in");
    });
    if (peek[1] !== undefined) {
      const section = document.querySelectorAll("section")[Number(peek[1])];
      if (section) section.scrollIntoView({ behavior: "instant" });
    }
  }
})();

/* ---------- Scroll reveals (staggered within each section) ---------- */
function initReveals() {
  const els = document.querySelectorAll(".reveal");

  // Stagger siblings: each revealed element in a section gets a small delay
  // based on its order among that section's reveal elements.
  document.querySelectorAll("section").forEach((section) => {
    section.querySelectorAll(".reveal").forEach((el, i) => {
      el.style.setProperty("--reveal-delay", (i * 0.15).toFixed(2) + "s");
    });
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );

  els.forEach((el) => io.observe(el));
}

/* ---------- Countdown ---------- */
(function initCountdown() {
  const target = new Date(WEDDING_ISO).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const els = {
    days: document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    mins: document.getElementById("cd-mins"),
    secs: document.getElementById("cd-secs"),
    grid: document.getElementById("countdown"),
    today: document.getElementById("countdown-today")
  };

  const pad = (n) => String(n).padStart(2, "0");

  // Update a digit with a small tick animation when its value changes.
  function setNum(el, value) {
    const str = String(value);
    if (el.textContent === str) return;
    el.textContent = str;
    if (!reducedMotion) {
      el.classList.remove("tick");
      void el.offsetWidth; // restart the animation
      el.classList.add("tick");
    }
  }

  function tick() {
    const diff = target - Date.now();

    if (diff <= 0) {
      els.grid.hidden = true;
      els.today.hidden = false;
      els.today.textContent =
        diff > -dayMs ? "Today is the day." : "Married — 8 January 2027";
      clearInterval(timer);
      return;
    }

    setNum(els.days, Math.floor(diff / dayMs));
    setNum(els.hours, pad(Math.floor((diff % dayMs) / 3600000)));
    setNum(els.mins, pad(Math.floor((diff % 3600000) / 60000)));
    setNum(els.secs, pad(Math.floor((diff % 60000) / 1000)));
  }

  tick();
  const timer = setInterval(tick, 1000);
})();

/* ---------- Ambient dust (canvas) ---------- */
function startDust() {
  if (dustStarted || reducedMotion) return;
  dustStarted = true;

  const canvas = document.getElementById("dust");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w, h, particles;

  const COLORS = [
    [183, 110, 121], // dusty rose
    [201, 162, 105], // warm gold
    [158, 90, 101]   // deep rose
  ];

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeParticle(spawnAnywhere) {
    const [r, g, b] = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: Math.random() * w,
      y: spawnAnywhere ? Math.random() * h : h + 10,
      radius: 0.6 + Math.random() * 1.4,
      speed: 0.08 + Math.random() * 0.18,   // slow upward drift
      swayAmp: 12 + Math.random() * 24,
      swayFreq: 0.0004 + Math.random() * 0.0006,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.12 + Math.random() * 0.22,
      color: `${r}, ${g}, ${b}`
    };
  }

  function populate() {
    const count = Math.min(Math.round(w / 24), 26); // sparse by design
    particles = Array.from({ length: count }, () => makeParticle(true));
  }

  resize();
  populate();
  window.addEventListener("resize", () => { resize(); populate(); });

  let last = performance.now();

  function frame(now) {
    const dt = Math.min(now - last, 50);
    last = now;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y -= p.speed * dt * 0.06;
      const x = p.x + Math.sin(now * p.swayFreq + p.phase) * p.swayAmp;
      const twinkle = 0.75 + 0.25 * Math.sin(now * 0.001 + p.phase * 3);

      ctx.beginPath();
      ctx.arc(x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${(p.alpha * twinkle).toFixed(3)})`;
      ctx.fill();

      if (p.y < -12) particles[i] = makeParticle(false);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

/* ---------- Add to Calendar (.ics download) ---------- */
(function initCalendar() {
  const btn = document.getElementById("calendar-btn");

  function toICSDate(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  btn.addEventListener("click", () => {
    const start = new Date(WEDDING_ISO);
    const end = new Date(start.getTime() + WEDDING_DURATION_HOURS * 3600000);

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Tauhid and Shaily//Wedding//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:" + Date.now() + "@tauhid-shaily-wedding",
      "DTSTAMP:" + toICSDate(new Date()),
      "DTSTART:" + toICSDate(start),
      "DTEND:" + toICSDate(end),
      "SUMMARY:" + EVENT.title,
      "DESCRIPTION:" + EVENT.description,
      "LOCATION:" + EVENT.location,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tauhid-shaily-wedding.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
})();
