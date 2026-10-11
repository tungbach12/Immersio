// Adapted from the public Torn Postcard Portfolio by @kedhareswer. See SOURCE.md.
import * as React from "react";
import { LandingAccountLinks } from "./LandingAccountLinks";
import { siteContent } from "../content.js";
import { PaperPlane, WordCards, Headphones, LearningImage, StudyBackdrop, JournalLines, LearningBadge } from "./LearningIllustrations.jsx";
import { LessonPreview } from "./LessonPreview.jsx";
const clamp = (r, e, a) => Math.min(a, Math.max(e, r)),
  seededRandom = r => {
    let e = r >>> 0 || 1;
    return () => {
      e = e + 1831565813 >>> 0;
      let a = e;
      return a = Math.imul(a ^ a >>> 15, a | 1), a ^= a + Math.imul(a ^ a >>> 7, a | 61), ((a ^ a >>> 14) >>> 0) / 4294967296;
    };
  },
  smoothstep = r => {
    const e = clamp(r, 0, 1);
    return e * e * (3 - 2 * e);
  },
  formatNumber = r => String(Math.round(r * 100) / 100),
  createTornEdge = (r, e, a) => {
    const s = seededRandom(r),
      o = s() * 6.283,
      n = s() * 6.283,
      p = [];
    for (let d = 0; d <= e; d++) {
      const c = d / e;
      let h = Math.sin(c * 6.283 * 1.15 + o) * a * .55 + Math.sin(c * 6.283 * 3.4 + n) * a * .28 + (s() - .5) * a * .6;
      s() < .07 && (h += (s() - .5) * a * 1.5), p.push(Math.round(h * 10) / 10);
    }
    return p;
  },
  createPaperFibers = (r, e, a, s) => {
    const o = seededRandom(r),
      n = o() * 6.283,
      p = [];
    for (let d = 0; d <= e; d++) {
      const c = .5 + .5 * Math.sin(d / e * 6.283 * 2.3 + n);
      p.push(Math.round((a + (s - a) * (c * .7 + o() * .3)) * 10) / 10);
    }
    return p;
  },
  paperBleed = 40,
  edgeCoordinate = (r, e) => "calc(" + paperBleed + "px + (100% - " + paperBleed * 2 + "px) * " + formatNumber(r) + (e < 0 ? " - " + formatNumber(-e) : " + " + formatNumber(e)) + "px)",
  upperPaperClip = (r, e, a) => {
    const s = r.length - 1,
      o = ["0 0", "100% 0"];
    for (let n = s; n >= 0; n--) o.push(formatNumber(n / s * 100) + "% " + edgeCoordinate(e, r[n] + (a ? a[n] : 0)));
    return "polygon(" + o.join(",") + ")";
  },
  lowerPaperClip = (r, e, a) => {
    const s = r.length - 1,
      o = [];
    for (let n = 0; n <= s; n++) o.push(formatNumber(n / s * 100) + "% " + edgeCoordinate(e, r[n] - (a ? a[n] : 0)));
    return o.push("100% 100%", "0 100%"), "polygon(" + o.join(",") + ")";
  },
  getChapterTransition = (r, e, a) => {
    const s = clamp(r, 0, e - 1),
      o = Math.min(Math.floor(s), e - 1),
      n = o < e - 1 ? smoothstep((s - o - a) / (1 - a)) : 0,
      p = [];
    for (let d = 0; d < e; d++) p.push({
      s: d === o ? n : 0,
      p: d === o ? 1 : d === o + 1 ? n : 0,
      on: d === o || d === o + 1 && n > 0
    });
    return {
      k: o,
      split: n,
      active: n > .55 ? o + 1 : o,
      chapters: p
    };
  },
  getSnapTarget = (r, e, a, s) => {
    const o = clamp(r, 0, e - 1),
      n = Math.floor(o);
    if (n >= e - 1) return null;
    const p = smoothstep((o - n - a) / (1 - a));
    return p <= .002 || p >= .998 ? null : (s > 0 ? p > .12 : p > .88) ? n + 1 : n + a;
  },
  wrapIndex = (r, e) => (r % e + e) % e,
  initials = r => r.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(e => e[0].toUpperCase()).join("") || "·",
  createCurvePath = r => {
    if (r.length < 2) return "";
    let e = "M" + formatNumber(r[0][0]) + " " + formatNumber(r[0][1]);
    for (let a = 0; a < r.length - 1; a++) {
      const s = r[Math.max(0, a - 1)],
        o = r[a],
        n = r[a + 1],
        p = r[Math.min(r.length - 1, a + 2)];
      e += " C" + formatNumber(o[0] + (n[0] - s[0]) / 6) + " " + formatNumber(o[1] + (n[1] - s[1]) / 6) + " " + formatNumber(n[0] - (p[0] - o[0]) / 6) + " " + formatNumber(n[1] - (p[1] - o[1]) / 6) + " " + formatNumber(n[0]) + " " + formatNumber(n[1]);
    }
    return e;
  },
  measureCurve = r => {
    if (r.length < 2) return {
      fr: r.map(() => 0),
      total: 0
    };
    const e = [0];
    let a = 0;
    for (let s = 0; s < r.length - 1; s++) {
      const o = r[Math.max(0, s - 1)],
        n = r[s],
        p = r[s + 1],
        d = r[Math.min(r.length - 1, s + 2)],
        c = [n[0] + (p[0] - o[0]) / 6, n[1] + (p[1] - o[1]) / 6],
        h = [p[0] - (d[0] - n[0]) / 6, p[1] - (d[1] - n[1]) / 6];
      let u = n;
      for (let y = 1; y <= 24; y++) {
        const x = y / 24,
          m = 1 - x,
          L = [m * m * m * n[0] + 3 * m * m * x * c[0] + 3 * m * x * x * h[0] + x * x * x * p[0], m * m * m * n[1] + 3 * m * m * x * c[1] + 3 * m * x * x * h[1] + x * x * x * p[1]];
        a += Math.hypot(L[0] - u[0], L[1] - u[1]), u = L;
      }
      e.push(a);
    }
    return {
      fr: e.map(s => a ? s / a : 0),
      total: a
    };
  },
  defaultProjects = siteContent.projects,
  defaultRoute = siteContent.route,
  defaultAbout = siteContent.about,
  chapterCount = 5,
  transitionStart = .32,
  chapterTones = ["dark", "light", "dark", "light", "dark"],
  svgId = r => r.replace(/[^a-zA-Z0-9_-]/g, "");
function GrainTexture({
  light: r = !1,
  opacity: e = .35
}) {
  return <div className="tpp-grain" data-light={r ? "" : void 0} aria-hidden="true" style={{
    opacity: e
  }} />;
}
function Postmark({
  text: r,
  date: e
}) {
  const a = svgId(React.useId());
  return <svg className="tpp-svg" width="120" height="78" viewBox="0 0 120 78" aria-hidden="true" style={{
    color: "#256B56"
  }}><defs><path id={a} d="M14 39 a25 25 0 1 1 50 0 a25 25 0 1 1 -50 0" /></defs><circle cx="39" cy="39" r="31" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="39" cy="39" r="20" fill="none" stroke="currentColor" strokeWidth="1" /><text fontSize="7.5" letterSpacing="2" fill="currentColor" fontFamily="Georgia,serif" fontWeight="700"><textPath href={"#" + a}>{r}</textPath></text><text x="39" y="42" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="Georgia,serif" fontWeight="700">{e}</text>{[30, 39, 48].map(s => <path key={s} d={"M72 " + s + " q8 -5 16 0 t16 0 t16 0"} fill="none" stroke="currentColor" strokeWidth="1.4" />)}</svg>;
}
function PaperChapter({
  index: r,
  seam: e,
  seed: a,
  label: s,
  last: o,
  setRef: n,
  uid: p,
  upperBg: d,
  upper: c,
  lowerBg: h,
  lower: u
}) {
  const y = React.useMemo(() => {
    const m = createTornEdge(a, 84, 16),
      L = createPaperFibers(a + 1, 84, 6, 22),
      w = createPaperFibers(a + 2, 84, 4, 16);
    return {
      upper: upperPaperClip(m, e),
      upperFib: upperPaperClip(m, e, L),
      upperShade: upperPaperClip(m, e, L.map(j => j + 7)),
      lower: lowerPaperClip(m, e),
      lowerFib: lowerPaperClip(m, e, w),
      lowerShade: lowerPaperClip(m, e, w.map(j => j + 5))
    };
  }, [a, e]);
  return <div ref={x => n(r, x)} className="tpp-ch" data-on={r === 0 ? "" : void 0} data-seam={o ? 1 : e} role="region" aria-label={s} style={{
    "--seam": o ? 1 : e,
    zIndex: 10 - r
  }}><div className="tpp-in">{!o && <div className="tpp-lo"><div className="tpp-shade" style={{
          clipPath: y.lowerShade
        }} /><div className="tpp-fib" style={{
          clipPath: y.lowerFib
        }}><GrainTexture uid={p} opacity={.4} /></div><div className="tpp-sh" style={{
          clipPath: y.lower
        }}><div className="tpp-box">{h}<div className="tpp-lb">{u}</div></div></div></div>}<div className="tpp-up">{!o && <div className="tpp-shade" style={{
          clipPath: y.upperShade
        }} />}{!o && <div className="tpp-fib" style={{
          clipPath: y.upperFib
        }}><GrainTexture uid={p} opacity={.4} /></div>}<div className="tpp-sh" style={o ? void 0 : {
          clipPath: y.upper
        }}><div className="tpp-box">{d}<div className="tpp-ub">{c}</div></div></div></div></div></div>;
}
function Reveal({
  d: r = 0,
  r: e = 0,
  className: a = "",
  style: s,
  children: o
}) {
  return <div className={"tpp-pop " + a} data-d={r} data-r={e} style={s}>{o}</div>;
}
function updateChapter(r, e, a, s) {
  const o = Number(r.dataset.seam) || 1,
    n = r.firstElementChild;
  if (!n) return;
  const p = n.querySelector(":scope > .tpp-lo"),
    d = n.querySelector(":scope > .tpp-up");
  n.style.transform = a < 1 ? "translateY(" + formatNumber((1 - a) * 3) + "%)" : "", d && (d.style.transform = e > 0 ? "translateY(" + formatNumber(-e * (o * (s + 80) + 70)) + "px) rotate(" + (-1.4 * e).toFixed(3) + "deg)" : ""), p && (p.style.transform = e > 0 ? "translateY(" + formatNumber(e * ((1 - o) * (s + 80) + 80)) + "px) rotate(" + (1 * e).toFixed(3) + "deg)" : ""), r.querySelectorAll(".tpp-pop").forEach(c => {
    const h = c,
      u = clamp((a - (Number(h.dataset.d) || 0)) * 2.6, 0, 1);
    u >= 1 ? (h.style.opacity = "", h.style.transform = "") : (h.style.opacity = u.toFixed(3), h.style.transform = "translateY(" + formatNumber((1 - u) * 46) + "px) rotate(" + formatNumber((1 - u) * (Number(h.dataset.r) || 0)) + "deg) scale(" + (.94 + .06 * u).toFixed(3) + ")");
  });
}
function ImmersioLanding({
  name = siteContent.name,
  role = siteContent.role,
  location = siteContent.location,
  since = siteContent.since,
  headline = siteContent.headline,
  intro = siteContent.intro,
  note: p,
  about = siteContent.about,
  projects = siteContent.projects,
  route = siteContent.route,
  labels = siteContent.labels,
  workTitle = siteContent.workTitle,
  routeTitle = siteContent.routeTitle,
  contactTitle = siteContent.contactTitle,
  palette: j = {},
  scrollPerChapter = 1.4,
  smooth = !0,
  snap = !0,
  animateIn = !0,
  height = "100svh",
  className = ""
}) {
  const v = svgId(React.useId()),
    k = {
      navy: "#145B50",
      deep: "#0C3E35",
      fog: "#DDE5CF",
      paper: "#FBF7ED",
      ink: "#234D40",
      accent: "#9B502F",
      tape: "#C7D5AA",
      ...j
    },
    Q = {
      ...defaultAbout,
      ...about
    },
    V = projects.length ? projects : defaultProjects,
    J = route.length ? route : defaultRoute,
    It = initials(name),
    wt = React.useRef(null),
    mt = React.useRef(null),
    Y = React.useRef(null),
    Nt = React.useRef([]),
    ct = React.useCallback((i, l) => {
      Nt.current[i] = l;
    }, []),
    [Ct, ke] = React.useState(0),
    [we, Ne] = React.useState(!1),
    H = we;
  React.useEffect(() => {
    const i = window.matchMedia("(prefers-reduced-motion: reduce)"),
      l = () => Ne(i.matches);
    return l(), i.addEventListener("change", l), () => i.removeEventListener("change", l);
  }, []), React.useEffect(() => {
    var ne;
    const i = Nt.current;
    if (H) {
      (ne = Y.current) == null || ne.setAttribute("data-tone", "dark"), i.forEach(S => {
        S && (updateChapter(S, 0, 1, 0), S.setAttribute("data-on", ""), S.inert = !1, S.removeAttribute("aria-hidden"));
      });
      return;
    }
    let l = 0,
      b = 0,
      M = 0,
      R = performance.now(),
      z = -1,
      I = -1,
      B = window.scrollY,
      et = 1,
      G = !1,
      _ = 0;
    const $t = () => (Y.current ? Y.current.offsetHeight : window.innerHeight) * scrollPerChapter,
      te = () => {
        const S = mt.current;
        S && (l = clamp(-S.getBoundingClientRect().top / $t(), 0, chapterCount - 1));
      },
      ht = i.map(() => ({
        s: -1,
        p: -1
      })),
      ee = S => {
        const T = getChapterTransition(S, chapterCount, transitionStart),
          Rt = Y.current ? Y.current.offsetHeight : window.innerHeight;
        T.chapters.forEach((D, X) => {
          const bt = i[X];
          if (!bt || (D.on ? bt.setAttribute("data-on", "") : bt.removeAttribute("data-on"), !D.on && ht[X].s === 0 && ht[X].p === 0)) return;
          const Ot = D.on ? D.s : 0,
            Ft = D.on ? D.p : 0;
          ht[X].s === Ot && ht[X].p === Ft || (ht[X] = {
            s: Ot,
            p: Ft
          }, updateChapter(bt, Ot, Ft, Rt));
        });
        const Bt = T.split > .82 ? T.k + 1 : T.k;
        Bt !== I && Y.current && (I = Bt, Y.current.setAttribute("data-tone", chapterTones[Bt] || "dark")), T.active !== z && (z = T.active, i.forEach((D, X) => {
          D && (D.inert = X !== z, X !== z ? D.setAttribute("aria-hidden", "true") : D.removeAttribute("aria-hidden"));
        }), ke(z));
      },
      se = S => {
        const T = Math.min(64, S - R);
        R = S, b = smooth ? b + (l - b) * (1 - Math.exp(-T / 110)) : l, Math.abs(l - b) < 4e-4 && (b = l), ee(b), M = b !== l ? requestAnimationFrame(se) : 0;
      },
      At = () => {
        te(), M || (R = performance.now(), M = requestAnimationFrame(se));
      },
      ae = () => {
        if (!snap || G) return;
        const S = mt.current;
        if (!S) return;
        const T = getSnapTarget(l, chapterCount, transitionStart, et);
        if (T === null) return;
        const Rt = S.getBoundingClientRect().top + window.scrollY + T * $t();
        window.scrollTo({
          top: Math.ceil(Rt) + 1,
          behavior: "smooth"
        });
      },
      re = () => {
        const S = window.scrollY;
        S !== B && (et = S > B ? 1 : -1), B = S, At(), window.clearTimeout(_), _ = window.setTimeout(ae, 170);
      },
      oe = () => {
        G = !0;
      },
      ie = () => {
        G = !1, window.clearTimeout(_), _ = window.setTimeout(ae, 260);
      };
    return te(), b = l, ee(b), addEventListener("scroll", re, {
      passive: !0
    }), addEventListener("resize", At), addEventListener("touchstart", oe, {
      passive: !0
    }), addEventListener("touchend", ie, {
      passive: !0
    }), () => {
      cancelAnimationFrame(M), window.clearTimeout(_), removeEventListener("scroll", re), removeEventListener("resize", At), removeEventListener("touchstart", oe), removeEventListener("touchend", ie);
    };
  }, [H, smooth, snap, scrollPerChapter]), React.useEffect(() => {
    const i = wt.current;
    if (!i) return;
    const l = (b, M, R) => {
      const z = document.createElement("canvas");
      z.width = z.height = 128;
      const I = z.getContext("2d");
      if (!I) return "none";
      const B = I.createImageData(128, 128),
        et = seededRandom(R);
      for (let G = 0; G < B.data.length; G += 4) {
        const _ = et();
        B.data[G] = b[0], B.data[G + 1] = b[1], B.data[G + 2] = b[2], B.data[G + 3] = Math.round(_ * _ * _ * M);
      }
      return I.putImageData(B, 0, 0), "url(" + z.toDataURL() + ")";
    };
    i.style.setProperty("--tpp-gd", l([40, 32, 24], 46, 1)), i.style.setProperty("--tpp-gl", l([255, 255, 255], 44, 2));
  }, []), React.useEffect(() => {
    const i = wt.current;
    if (!i || H) return;
    let l = 0,
      b = 0,
      M = 0;
    const R = z => {
      z.pointerType === "mouse" && (b = z.clientX / window.innerWidth * 2 - 1, M = z.clientY / window.innerHeight * 2 - 1, l || (l = requestAnimationFrame(() => {
        l = 0, i.querySelectorAll(".tpp-ch[data-on] .tpp-par").forEach(I => {
          const B = I,
            et = Number(B.dataset.dp) || 0;
          B.style.transform = "translate3d(" + formatNumber(b * et) + "px," + formatNumber(M * et * .5) + "px,0)";
        });
      })));
    };
    return i.addEventListener("pointermove", R), () => {
      i.removeEventListener("pointermove", R), cancelAnimationFrame(l);
    };
  }, [H]);
  const Z = React.useCallback(i => {
      if (H) {
        const R = Nt.current[i];
        R && R.scrollIntoView({
          behavior: "auto",
          block: "start"
        });
        return;
      }
      const l = mt.current,
        b = Y.current;
      if (!l || !b) return;
      const M = l.getBoundingClientRect().top + window.scrollY + i * b.offsetHeight * scrollPerChapter;
      window.scrollTo({
        top: Math.ceil(M) + 1,
        behavior: "smooth"
      });
    }, [H, scrollPerChapter]),
    [Mt, Gt] = React.useState(!1),
    [$, Ce] = React.useState(0),
    [ut, Me] = React.useState({
      out: -1,
      into: -1,
      n: 0
    }),
    [gt, dt] = React.useState(0),
    [lessonGoal, setLessonGoal] = React.useState("everyday"),
    ot = i => {
      const l = V.length,
        b = wrapIndex($ + i, l);
      Me(M => ({
        out: i > 0 ? $ : -1,
        into: i < 0 ? b : -1,
        n: M.n + 1
      })), Ce(b);
    },
    We = i => {
      setLessonGoal(i.goal || "everyday");
      Z(4);
    },
    [N, Be] = React.useState(!1),
    [Wt, Oe] = React.useState(1.8),
    [Fe, Ee] = React.useState(500),
    Vt = React.useRef(null);
  React.useEffect(() => {
    const i = Y.current,
      l = Vt.current;
    if (!i) return;
    const b = new ResizeObserver(() => {
      Be(i.offsetWidth <= 760), l && l.offsetHeight && (Oe(l.offsetWidth / l.offsetHeight), Ee(l.offsetHeight));
    });
    return b.observe(i), l && b.observe(l), () => b.disconnect();
  }, []);
  const ft = React.useMemo(() => {
      const i = J.length;
      return J.map((l, b) => {
        const M = i > 1 ? b / (i - 1) : .5;
        return N ? [b % 2 ? 72 : 26, 8 + M * 58] : [8 + M * 84, 62 - Math.sin(M * Math.PI * 2.2 + .4) * 26];
      });
    }, [J, N]),
    tt = React.useMemo(() => {
      const i = ft.map(b => [b[0] * Wt, b[1]]),
        l = measureCurve(i);
      return {
        d: createCurvePath(i),
        fr: l.fr,
        total: l.total,
        w: 100 * Wt
      };
    }, [ft, Wt]),
    Te = V.length,
    De = new Date().getFullYear(),
    A = V[$] || V[0],
    He = {
      "--tpp-navy": k.navy,
      "--tpp-deep": k.deep,
      "--tpp-fog": "color-mix(in oklab, " + k.fog + " 92%, var(--color-background, #fff))",
      "--tpp-paper": "color-mix(in oklab, " + k.paper + " 94%, var(--color-background, #fff))",
      "--tpp-fiber": "color-mix(in oklab, #f7f4ee 94%, var(--color-background, #fff))",
      "--tpp-ink": k.ink,
      "--tpp-accent": k.accent,
      "--tpp-tape": k.tape,
      "--tpp-h": height
    },
    Ze = <PaperChapter index={0} seam={.79} seed={101} label={labels[0]} setRef={ct} uid={v} upperBg={<><StudyBackdrop hero /><GrainTexture opacity={.23} /></>} upper={<div className="tpp-fill">
        <div className="tpp-hero-copy learn-hero-copy">
          <Reveal d={0}><p className="learn-eyebrow">ENGLISH FOR THE EVERYDAY <span aria-hidden="true">✦</span></p></Reveal>
          <Reveal d={.08}><h1 className="tpp-h tpp-hero-h">{headline.map((line, index) => <span key={line} className={"block " + (animateIn ? "tpp-rise" : "")} style={{
              "--rd": .15 + index * .18 + "s"
            }}>{line}</span>)}</h1></Reveal>
          <Reveal d={.15}><p className={"learn-hero-intro " + (animateIn ? "tpp-rise" : "")} style={{
            "--rd": ".55s"
          }}>{intro}</p></Reveal>
          <Reveal d={.25} className={"learn-hero-actions " + (animateIn ? "tpp-rise" : "")} style={{
          "--rd": ".75s"
        }}>
            <button type="button" className="tpp-tag learn-primary" onClick={() => Z(4)}>Try a little English <span aria-hidden="true">↗</span></button>
            <button type="button" className="learn-text-link" onClick={() => Z(1)}>Explore the approach <span aria-hidden="true">↓</span></button>
          </Reveal>
          <Reveal d={.3}><p className="learn-hero-footnote">A small beginning. No sign-up needed.</p></Reveal>
        </div>
        <div className="tpp-par learn-hero-plane" data-dp={-14}><div className={animateIn ? "tpp-flyin" : ""}><div className="tpp-glide"><PaperPlane /></div></div></div>
        <button type="button" className="tpp-note tpp-paper learn-hero-note" onClick={() => Z(2)}><span>{p}</span><span className="learn-note-label">a note to your future self</span></button>
      </div>} lowerBg={<><StudyBackdrop tone="light" /><JournalLines /></>} lower={<div className="learn-hero-bottom"><button type="button" className="tpp-label" onClick={() => Z(1)}><span className="tpp-hint" aria-hidden="true">↓</span> A new chapter, just below</button><span className="tpp-label tpp-wide">Listen. Speak. Stay curious.</span></div>} />,
    Ie = <div className="tpp-paper relative h-full overflow-clip learn-about-front">
      <GrainTexture opacity={.3} /><div className="tpp-pc-grid relative">
        <div className="learn-about-art"><div className="learn-about-picture"><LearningImage src={Q.photo} kind="conversation" alt="Two learners sharing an everyday conversation" /></div><div className="learn-about-mini"><LearningImage kind="words" /><span className="tpp-tape" /></div><span className="learn-hand-note learn-about-art-note">Good words. Good company.</span></div>
        <div className="learn-postcard-divider"><span className="tpp-label tpp-wide">a little note from Immersio</span></div>
        <div className="learn-about-copy"><p className="tpp-label learn-small-heading">A FRIENDLIER WAY TO LEARN</p><h2 className="tpp-h">{Q.title}</h2><p className="learn-about-subtitle">{Q.subtitle}</p><div className="tpp-rule tpp-hw learn-about-letter">{Q.text}</div><div className="learn-about-signoff"><span className="tpp-hand">— Immersio</span><button type="button" className="tpp-label" onClick={() => Gt(true)}>Our approach ↻</button></div></div>
      </div></div>,
    Ge = <div className="tpp-paper relative h-full overflow-clip" style={{
      borderRadius: 3
    }}><GrainTexture uid={v} opacity={.35} /><div className="relative flex h-full flex-col p-[clamp(16px,2.4cqw,30px)]"><div className="flex items-start justify-between gap-4"><div><p className="tpp-label" style={{
              color: k.accent,
              fontSize: 10
            }}>{"Make yourself at home"}</p><h3 className="tpp-h mt-1" style={{
              fontSize: "clamp(22px, min(3cqw, 5cqh), 38px)",
              fontWeight: 400
            }}>{"Learn a little. Live a little."}</h3><p className="mt-1 text-[13px]" style={{
              opacity: .75
            }}>{role}</p></div><div style={{
            transform: "rotate(-10deg)",
            flexShrink: 0
          }} className="tpp-wide"><Postmark text={"· " + location.toUpperCase() + " · " + since + " "} date={since} /></div></div><dl className="mt-4 grid min-h-0 flex-1 content-center gap-x-6 gap-y-3" style={{
          gridTemplateColumns: N ? "1fr" : "1fr 1fr"
        }}>{(Q.facts || []).map(i => <div key={i.label} className="tpp-rule" style={{
            borderBottom: "1px solid rgba(35,77,64,.18)",
            paddingBottom: 4
          }}><dt className="tpp-label" style={{
              fontSize: 9,
              opacity: .6
            }}>{i.label}</dt><dd className="tpp-hand m-0" style={{
              fontSize: "clamp(16px,1.7cqw,22px)",
              color: "#256B56"
            }}>{i.value}</dd></div>)}</dl><div className="mt-3 flex flex-wrap gap-2">{(Q.skills || []).map(i => <span key={i} className="tpp-chip">{i}</span>)}</div><div className="mt-3 flex items-center justify-between"><button type="button" className="tpp-label" style={{
            fontSize: 10,
            color: k.accent
          }} onClick={() => Z(4)}>Try a conversation →</button><button type="button" className="tpp-label" style={{
            fontSize: 10,
            color: k.accent
          }} onClick={() => Gt(!1)}>{"↺ Front"}</button></div></div></div>,
    Ue = <PaperChapter index={1} seam={.86} seed={202} label={labels[1]} setRef={ct} uid={v} upperBg={<><StudyBackdrop tone="light" /><JournalLines /></>} upper={<div className="tpp-fill flex items-center justify-center" style={{
      paddingTop: 56
    }}><Reveal d={.05} r={-4} className="tpp-wide absolute" style={{
        right: "7%",
        top: "15%",
        width: "clamp(80px,9cqw,130px)"
      }}><div className="tpp-envelope relative" style={{
          aspectRatio: "1.45",
          transform: "rotate(8deg)"
        }} aria-hidden="true"><div className="tpp-letter absolute" style={{
            left: "10%",
            right: "10%",
            top: "-10%",
            height: "80%",
            background: "#fbfaf6",
            boxShadow: "0 2px 4px rgba(0,0,0,.15)"
          }}><div className="tpp-rule absolute" style={{
              inset: "18% 12%",
              fontSize: 6
            }} /></div><svg className="tpp-svg tpp-fill" viewBox="0 0 145 100" preserveAspectRatio="none"><rect y="20" width="145" height="80" fill="#efe7d6" /><path d="M0 20 L72 66 L145 20 L145 100 L0 100 Z" fill="#e6dcc6" /><path d="M0 100 L60 58 M145 100 L85 58" stroke="#cdbf9f" /><rect x="104" y="72" width="30" height="22" fill="#AFCAAD" /></svg></div></Reveal><Reveal d={.12} r={-3}><div className="tpp-card3d tpp-postcard" style={{
          transform: "rotate(-1.2deg)"
        }}><div className="tpp-flip" data-back={Mt ? "" : void 0}><div aria-hidden={Mt} inert={Mt ? true : undefined} style={{
              minHeight: 0
            }}>{Ie}</div><div className="tpp-back" aria-hidden={!Mt} inert={!Mt ? true : undefined} style={{
              minHeight: 0
            }}>{Ge}</div></div><span className="tpp-tape" style={{
            left: -18,
            top: 14,
            transform: "rotate(-38deg)"
          }} /></div></Reveal></div>} lowerBg={<StudyBackdrop />} lower={<div className="relative h-full"><div className="absolute" style={{
        left: "-2%",
        top: -30,
        width: "clamp(160px,20cqw,300px)",
        aspectRatio: "1.5"
      }}><WordCards /></div><span className="tpp-label absolute" style={{
        right: "clamp(16px,4cqw,44px)",
        top: "clamp(10px,3cqh,26px)",
        color: "#e8e4da"
      }}>{"Next — "}{workTitle}</span></div>} />,
    _e = V.map((i, l) => {
      const b = V.length,
        M = wrapIndex(l - $, b),
        R = M === 0 ? "rotate(-3deg)" : M === 1 ? "translate(7%, 3%) rotate(5deg) scale(.95)" : M === 2 ? "translate(-7%, 5%) rotate(-8deg) scale(.9)" : "translate(0, 6%) rotate(2deg) scale(.86)",
        z = ut.out === l ? ut.n % 2 ? "1" : "2" : void 0,
        I = ut.into === l ? ut.n % 2 ? "1" : "2" : void 0;
      return <div key={l} className="tpp-polaroid" data-f={z} data-in={I} aria-hidden={M !== 0} style={{
        transform: R,
        zIndex: 20 - M,
        opacity: M > 2 ? 0 : 1
      }}><div className="relative w-full overflow-clip" style={{
          aspectRatio: "1",
          background: "#ccc"
        }}><LearningImage src={i.image} kind={i.scene || "conversation"} seed={l + 2} alt={i.name} /></div><p className="tpp-hand m-0 px-1 pt-3 text-center" style={{
          color: "#234D40",
          fontSize: "clamp(14px,1.6cqw,21px)",
          lineHeight: 1.1
        }}>{i.note || i.name}</p></div>;
    }),
    Xe = <PaperChapter index={2} seam={.9} seed={303} label={labels[2]} setRef={ct} uid={v} upperBg={<StudyBackdrop />} upper={<div className="tpp-fill flex flex-col" style={{
      paddingTop: "clamp(64px, 10cqh, 96px)",
      color: "#f3eee4"
    }}><div className="absolute learn-practice-cards" style={{
        left: "-3%",
        top: "-4%",
        width: "clamp(150px,18cqw,280px)",
        aspectRatio: "1.5",
        transform: "rotate(10deg)"
      }}><WordCards /></div><Reveal d={.05} className="learn-headphones-wrap absolute" style={{
        right: "-1%",
        top: "4%",
        width: "clamp(110px,15cqw,220px)",
        aspectRatio: "1.1"
      }}><Headphones /></Reveal><Reveal d={0} className="text-center"><h2 className="tpp-h tpp-sec-h" style={{
          color: "#f3eee4"
        }}>{workTitle}</h2><p className="tpp-label mt-3" style={{
          opacity: .6
        }}>{String($ + 1).padStart(2, "0")}{" / "}{String(V.length).padStart(2, "0")}</p></Reveal><div className="relative mx-auto flex w-full min-h-0 flex-1 items-center justify-center gap-[clamp(20px,5cqw,80px)] px-[clamp(16px,5cqw,64px)]" style={{
        flexDirection: N ? "column" : "row",
        maxWidth: 1100,
        paddingBottom: N ? 8 : "6cqh",
        gap: N ? 14 : void 0
      }} onKeyDown={i => {
        i.key === "ArrowRight" && ot(1), i.key === "ArrowLeft" && ot(-1);
      }}><svg className="tpp-svg tpp-wide pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path className="tpp-dash" d="M30 72 C42 92 50 40 62 46" fill="none" stroke="#f3eee4" strokeOpacity=".55" strokeWidth="1.4" vectorEffect="non-scaling-stroke" /></svg><Reveal d={.1} r={-6}><button type="button" className="relative block" aria-label={"Next practice (showing " + A.name + ")"} onClick={() => ot(1)} style={{
            width: N ? "min(50cqw, calc(34cqh * .88))" : "min(28cqw, calc(54cqh * .88), 360px)",
            aspectRatio: "0.86"
          }}>{_e}<span className="tpp-tape" style={{
              left: "50%",
              top: -10,
              marginLeft: -38,
              transform: "rotate(-4deg)",
              zIndex: 40
            }} /></button></Reveal><Reveal d={.22} r={3} style={{
          width: N ? "100%" : "min(420px, 40cqw)",
          maxWidth: 460
        }}><div className="tpp-ncard" aria-live="polite"><div className="flex items-baseline justify-between gap-3"><h3 className="tpp-h" style={{
                fontSize: "clamp(22px,2.6cqw,34px)",
                fontWeight: 400,
                letterSpacing: ".04em"
              }}>{A.name}</h3><span className="tpp-serif shrink-0" style={{
                fontSize: 15,
                opacity: .7
              }}>{A.year}</span></div>{A.role && <p className="tpp-label mt-1" style={{
              fontSize: 9.5,
              color: k.accent
            }}>{A.role}</p>}{A.description && <p className="mt-3 text-[13px] leading-relaxed sm:text-[14px]" style={{
              display: "-webkit-box",
              WebkitLineClamp: N ? 3 : 5,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}>{A.description}</p>}{A.tags && A.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{A.tags.map(i => <span key={i} className="tpp-chip">{i}</span>)}</div>}<div className="mt-4">{A.url ? <a href={A.url} target="_blank" rel="noreferrer" className="tpp-label" style={{
                fontSize: 10,
                color: k.accent,
                borderBottom: "1px solid currentColor",
                paddingBottom: 2
              }}>{"Explore this activity ↗"}</a> : <button type="button" className="tpp-label" style={{
                fontSize: 10,
                color: k.accent,
                borderBottom: "1px solid currentColor",
                paddingBottom: 2
              }} onClick={() => We(A)}>{"Try a conversation →"}</button>}</div></div><div className="mt-4 flex items-center justify-between gap-3" style={{
            color: "#f3eee4"
          }}><div className="flex items-center gap-2"><button type="button" className="tpp-round" aria-label="Previous practice" onClick={() => ot(-1)}>{"←"}</button><button type="button" className="tpp-round" aria-label="Next practice" onClick={() => ot(1)}>{"→"}</button></div><div className="flex items-center gap-1.5" role="group" aria-label="Practice activities">{V.map((i, l) => <button key={l} type="button" className="tpp-pip" aria-label={i.name} aria-current={l === $} onClick={() => l !== $ && ot(l - $)} />)}</div></div></Reveal></div></div>} lowerBg={<StudyBackdrop />} lower={<div className="relative h-full"><span className="tpp-label absolute" style={{
        left: "clamp(16px,4cqw,44px)",
        top: "clamp(8px,2cqh,22px)",
        color: "#e8e4da",
        opacity: .8
      }}>{"Next — "}{routeTitle}</span></div>} />,
    jt = 100 / Math.max(1, Fe),
    it = J[gt] || J[0],
    nt = ft[gt] || [50, 50],
    Ke = N ? void 0 : "calc(50% - min(150px,20cqw))",
    Qe = N ? void 0 : "6%",
    Ve = <PaperChapter index={3} seam={.88} seed={404} label={labels[3]} setRef={ct} uid={v} upperBg={<div className="tpp-fill" aria-hidden="true" style={{
      background: "var(--tpp-paper)"
    }}><JournalLines /><GrainTexture uid={v} opacity={.45} /></div>} upper={<div className="tpp-fill flex flex-col" style={{
      paddingTop: "clamp(64px, 10cqh, 96px)",
      color: k.ink
    }}><Reveal d={0} className="learn-journey-heading flex items-end justify-between gap-4 px-[clamp(16px,5cqw,64px)]"><div><p className="tpp-label" style={{
            color: k.accent
          }}>{"YOUR LEARNING JOURNAL · ONE STEP AT A TIME"}</p><h2 className="tpp-h tpp-sec-h mt-2">{routeTitle}</h2></div><div className="tpp-wide" style={{
          color: k.ink,
          opacity: .7
        }}><LearningBadge /></div></Reveal><div ref={Vt} className="relative mx-[clamp(16px,5cqw,64px)] mb-[3cqh] mt-[2cqh] min-h-0 flex-1" onKeyDown={i => {
        (i.key === "ArrowRight" || i.key === "ArrowDown") && dt(l => Math.min(J.length - 1, l + 1)), (i.key === "ArrowLeft" || i.key === "ArrowUp") && dt(l => Math.max(0, l - 1));
      }}><svg className="tpp-svg tpp-fill" viewBox={"0 0 " + formatNumber(tt.w) + " 100"} preserveAspectRatio="none" aria-hidden="true" style={{
          overflow: "visible"
        }}><path d={tt.d} fill="none" stroke={k.ink} strokeOpacity=".5" strokeWidth={1.6 * jt} strokeDasharray={formatNumber(2 * jt) + " " + formatNumber(8 * jt)} strokeLinecap="round" /><path className="tpp-progress" d={tt.d} fill="none" stroke={k.accent} strokeWidth={2.6 * jt} strokeLinecap="round" strokeDasharray={formatNumber(tt.total + 1) + " " + formatNumber(tt.total + 1)} strokeDashoffset={formatNumber(tt.total * (1 - (tt.fr[gt] || 0)))} /></svg><span className="tpp-walker" style={{
          left: nt[0] + "%",
          top: nt[1] + "%"
        }} aria-hidden="true" />{J.map((i, l) => <Reveal key={l} d={.08 + l * .05} style={{
          position: "absolute",
          left: ft[l][0] + "%",
          top: ft[l][1] + "%"
        }}><button type="button" className="tpp-pin" aria-pressed={l === gt} aria-label={i.year + " — " + i.title} onClick={() => dt(l)} onMouseEnter={() => dt(l)} onFocus={() => dt(l)} style={{
            left: 0,
            top: 0
          }}><span className="tpp-pin-y">{i.year}</span><span className="tpp-pin-dot" /></button></Reveal>)}<Reveal d={.3} className="tpp-stop" style={N ? {
          left: 0,
          right: 0,
          bottom: 0
        } : {
          left: Ke,
          top: Qe
        }}><div className="tpp-ncard" aria-live="polite" style={{
            transform: "rotate(-1deg)"
          }}><p className="tpp-label" style={{
              fontSize: 9.5,
              color: k.accent
            }}>{it.year}{it.place ? " · " + it.place : ""}</p><h3 className="tpp-serif mt-1" style={{
              fontSize: "clamp(19px,1.9cqw,25px)",
              margin: "4px 0 0",
              fontWeight: 600,
              lineHeight: 1.15
            }}>{it.title}</h3>{it.text && <p className="mt-2 text-[13px] leading-relaxed">{it.text}</p>}</div></Reveal></div></div>} lowerBg={<StudyBackdrop />} lower={<div className="relative h-full"><span className="tpp-label absolute" style={{
        right: "clamp(16px,4cqw,44px)",
        top: "clamp(8px,2cqh,22px)",
        color: "#e8e4da",
        opacity: .8
      }}>{"Last stop — "}{contactTitle}</span></div>} />,
    $e = <PaperChapter index={4} seam={1} seed={505} label={labels[4]} last setRef={ct} uid={v} upperBg={<><StudyBackdrop /><GrainTexture opacity={.25} /></>} upper={<div className="tpp-fill learn-final">
        <Reveal d={0} className="learn-final-heading"><p className="learn-eyebrow">LET’S START WITH A CONVERSATION</p><h2 className="tpp-h tpp-sec-h">{contactTitle}</h2><p>A small taste of Immersio. Pick a moment, find your words.</p></Reveal>
        <Reveal d={.12} r={-2} className="learn-demo-wrap"><LessonPreview goal={lessonGoal} onGoalChange={setLessonGoal} /></Reveal>
        <Reveal d={.25} className="learn-final-note"><span className="tpp-hand">You don’t have to be perfect. You just have to begin.</span></Reveal>
        <footer className="learn-footer"><span>© {De} {name} <span className="tpp-wide-i">· A little English, every day.</span></span><button type="button" className="tpp-label" onClick={() => Z(0)}>Back to the beginning ↑</button></footer>
      </div>} />;
  return <div ref={wt} className={"tpp-root " + className} data-mode={H ? "stack" : "pin"} style={He}>{null}<div ref={mt} className="tpp-track" style={{
      height: H ? "auto" : "calc(" + height + " * " + formatNumber(1 + (chapterCount - 1) * scrollPerChapter + .35) + ")"
    }}><div ref={Y} className="tpp-stage" data-tone="dark" data-chapter={Ct} style={{
        height: H ? "auto" : height
      }}>{Ze}{Ue}{Xe}{Ve}{$e}<nav className="tpp-nav" aria-label="Chapters"><button type="button" className="tpp-brand" onClick={() => Z(0)}>{name}</button><div className="tpp-links">{labels.map((i, l) => <button key={i} type="button" className="tpp-link" aria-current={l === Ct} onClick={() => Z(l)}>{i}</button>)}</div><LandingAccountLinks /></nav>{!H && <div className="tpp-rail" role="group" aria-label="Chapter progress">{labels.map((i, l) => <button key={i} type="button" className="tpp-dot" aria-label={i} aria-current={l === Ct} onClick={() => Z(l)} />)}</div>}</div></div></div>;
}
export { ImmersioLanding };
