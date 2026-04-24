import Link from "next/link";
import { Play, Star, ArrowRight, CheckCircle, Users, Clock, Award, BookOpen, Sparkles, Radio, Video, TrendingUp } from "lucide-react";

async function getPublishedCourses() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://api:8080"}/api/courses?pageSize=6&published=true`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

const MOCK_COURSES = [
  { id: "1", title: "Unhas de Gel — Do Zero ao Avançado", level: "Iniciante", totalModules: 8, totalLessons: 42, isForSale: true, price: 297, currency: "BRL", shortDescription: "Aprenda todas as técnicas de gel desde os fundamentos até aplicações avançadas." },
  { id: "2", title: "Nail Art Criativa — Técnicas Exclusivas", level: "Intermediário", totalModules: 6, totalLessons: 28, isForSale: true, price: 197, currency: "BRL", shortDescription: "Designs únicos, flores 3D, degradê e muito mais para se destacar no mercado." },
  { id: "3", title: "Baby Boomer Perfeito — Passo a Passo", level: "Avançado", totalModules: 4, totalLessons: 18, isForSale: true, price: 147, currency: "BRL", shortDescription: "O técnica queridinha das clientes dominada em profundidade." },
];

export default async function LandingPage() {
  const rawCourses = await getPublishedCourses();
  const courses = Array.isArray(rawCourses) && rawCourses.length > 0 ? rawCourses : MOCK_COURSES;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --rose:        #D4437C;
          --rose-2:      #B82E66;
          --rose-light:  #FCE8F1;
          --rose-pale:   #FDF3F8;
          --gold:        #C9A87C;
          --cream:       #FEF8F5;
          --white:       #FFFFFF;
          --ink:         #1A0A12;
          --ink-soft:    #3D1A28;
          --muted:       #8B6676;
          --line:        #F0D5E2;
          --serif:       'Playfair Display', Georgia, serif;
          --sans:        'Inter', system-ui, sans-serif;
        }

        /* ── Keyframes ─────────────────────────────── */
        @keyframes heroIn {
          from { opacity:0; transform: translateY(32px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes floatA {
          0%,100% { transform: translateY(0)   rotate(-2deg); }
          50%      { transform: translateY(-18px) rotate(1deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0)   rotate(1deg); }
          50%      { transform: translateY(-12px) rotate(-1.5deg); }
        }
        @keyframes floatC {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes shimmer {
          0%   { background-position: -300% center; }
          100% { background-position:  300% center; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse2 {
          0%,100% { opacity:1; }
          50%      { opacity:.4; }
        }
        @keyframes scaleIn {
          from { opacity:0; transform: scale(0.92); }
          to   { opacity:1; transform: scale(1); }
        }

        /* ── Utilities ─────────────────────────────── */
        .btn-rose {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 100px; border: none;
          background: linear-gradient(110deg, var(--rose) 0%, var(--rose-2) 45%, var(--rose) 100%);
          background-size: 300% auto;
          color: #fff; font-family: var(--sans); font-size: 15px; font-weight: 700;
          letter-spacing: -.01em; text-decoration: none; cursor: pointer;
          box-shadow: 0 8px 32px rgba(212,67,124,.36), 0 2px 6px rgba(212,67,124,.2);
          transition: transform .2s, box-shadow .2s;
          animation: shimmer 5s linear infinite;
        }
        .btn-rose:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 48px rgba(212,67,124,.48), 0 4px 12px rgba(212,67,124,.24);
        }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 100px;
          border: 1.5px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.06);
          color: rgba(254,248,245,.82); font-family: var(--sans); font-size: 15px; font-weight: 600;
          letter-spacing: -.01em; text-decoration: none; cursor: pointer;
          transition: border-color .2s, background .2s, transform .2s;
        }
        .btn-outline:hover {
          border-color: rgba(255,255,255,.35); background: rgba(255,255,255,.1);
          transform: translateY(-2px);
        }
        .btn-light {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 100px;
          border: 1.5px solid var(--line); background: var(--white);
          color: var(--ink); font-family: var(--sans); font-size: 14px; font-weight: 600;
          letter-spacing: -.01em; text-decoration: none; cursor: pointer;
          transition: border-color .2s, background .2s, transform .2s, box-shadow .2s;
        }
        .btn-light:hover {
          border-color: var(--rose); background: var(--rose-pale); transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(212,67,124,.12);
        }

        /* Course card */
        .course-card {
          background: var(--white); border-radius: 20px;
          border: 1px solid var(--line); overflow: hidden;
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s, border-color .3s;
          box-shadow: 0 2px 12px rgba(26,10,18,.06);
          display: flex; flex-direction: column; height: 100%;
        }
        .course-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 32px 64px rgba(212,67,124,.16), 0 8px 24px rgba(26,10,18,.08);
          border-color: #F0AECB;
        }
        .course-card-thumb { transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .course-card:hover .course-card-thumb { transform: scale(1.08); }

        /* Feature card */
        .feat-card {
          background: var(--white); border-radius: 20px;
          border: 1px solid var(--line);
          padding: 32px 28px;
          transition: transform .25s, box-shadow .25s, border-color .25s;
          box-shadow: 0 2px 12px rgba(26,10,18,.05);
        }
        .feat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 52px rgba(212,67,124,.12);
          border-color: #F0AECB;
        }

        /* Testimonial card */
        .testi-card {
          background: rgba(255,255,255,.04); border-radius: 20px;
          border: 1px solid rgba(255,255,255,.07);
          padding: 32px;
          transition: background .25s, border-color .25s, transform .25s;
        }
        .testi-card:hover {
          background: rgba(212,67,124,.07);
          border-color: rgba(212,67,124,.25);
          transform: translateY(-4px);
        }

        /* Nav link */
        .nav-link {
          color: var(--muted); font-size: 14px; font-weight: 500;
          text-decoration: none; padding: 6px 2px;
          position: relative; transition: color .2s;
        }
        .nav-link::after {
          content:''; position:absolute; left:0; bottom:-2px;
          width:0; height:2px; border-radius:2px;
          background: var(--rose); transition: width .22s;
        }
        .nav-link:hover { color: var(--ink); }
        .nav-link:hover::after { width:100%; }

        /* Nav entrar */
        .nav-entrar {
          color: var(--muted); font-size: 14px; font-weight: 500;
          text-decoration: none; padding: 8px 14px; border-radius: 8px;
          transition: color .2s;
        }
        .nav-entrar:hover { color: var(--ink); }

        /* Footer links */
        .footer-link {
          font-size: 13px; color: rgba(254,248,245,.38);
          text-decoration: none; transition: color .2s;
        }
        .footer-link:hover { color: rgba(254,248,245,.7); }

        /* Stats row separator */
        .stat-sep { border-right: 1px solid var(--line); }

        /* Responsive */
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-visual { display: none !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .feat-row-reverse { direction: ltr !important; }
          .stats-row { grid-template-columns: repeat(2,1fr) !important; }
          .stat-sep { border-right: none; border-bottom: 1px solid var(--line); }
        }
        @media (max-width: 640px) {
          .nav-links { display: none !important; }
          .stats-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ background: "var(--cream)", color: "var(--ink)", fontFamily: "var(--sans)", overflowX: "hidden", lineHeight: 1 }}>

        {/* ═══════════════════════════════ NAVBAR ══════════════════════════════ */}
        <header style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(254,248,245,0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--line)",
        }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {/* SVG gem logo */}
              <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: "linear-gradient(140deg, #E05890 0%, #D4437C 50%, #8B1A42 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(212,67,124,.4), inset 0 1px 0 rgba(255,255,255,.2)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 3L2 9l10 12L22 9l-4-6H6z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(255,255,255,0.15)"/>
                  <path d="M2 9h20M6 3l3 6M18 3l-3 6M12 21L9 9M12 21l3-12" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 20, color: "var(--ink)", letterSpacing: "-0.03em" }}>
                Nail<span style={{ color: "var(--rose)" }}>Class</span>
              </span>
            </Link>

            {/* Center nav */}
            <nav className="nav-links" style={{ display: "flex", gap: 28, alignItems: "center" }}>
              {[["Cursos", "/courses"], ["Sobre", "#sobre"], ["Depoimentos", "#depoimentos"]].map(([l, h]) => (
                <Link key={h} href={h} className="nav-link">{l}</Link>
              ))}
            </nav>

            {/* Right CTAs */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              <Link href="/login" className="nav-entrar">Entrar</Link>
              <Link href="/login" className="btn-rose" style={{ padding: "10px 22px", fontSize: 14 }}>
                Começar grátis
              </Link>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════ HERO ════════════════════════════════ */}
        <section style={{
          minHeight: "92vh",
          display: "flex", alignItems: "center",
          background: "linear-gradient(148deg, #150810 0%, #210D18 40%, #1C0D14 70%, #140A0F 100%)",
          position: "relative", overflow: "hidden",
          padding: "80px 24px",
        }}>
          {/* Gradient orbs */}
          <div style={{ position: "absolute", top: -200, left: -200, width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,67,124,.22) 0%, transparent 60%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -100, right: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,124,.14) 0%, transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "35%", right: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,67,124,.1) 0%, transparent 70%)", pointerEvents: "none" }} />

          {/* Dot grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none" }} />

          {/* Thin diagonal lines decoration */}
          <svg style={{ position: "absolute", right: 0, top: 0, opacity: .04, pointerEvents: "none" }} width="600" height="600" fill="none">
            {[0,1,2,3,4,5,6,7].map(i => (
              <line key={i} x1={i*80} y1="0" x2={i*80+600} y2="600" stroke="white" strokeWidth="1"/>
            ))}
          </svg>

          <div className="hero-grid" style={{ maxWidth: 1180, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 480px", gap: 60, alignItems: "center", position: "relative", zIndex: 1 }}>

            {/* ── LEFT TEXT ── */}
            <div style={{ animation: "heroIn .9s cubic-bezier(.22,1,.36,1) forwards" }}>

              {/* Eyebrow badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px 5px 8px", borderRadius: 100, background: "rgba(212,67,124,.12)", border: "1px solid rgba(212,67,124,.28)", marginBottom: 32 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#E05890,#D4437C)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={11} color="white" />
                </div>
                <span style={{ color: "#F4B8CF", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
                  A escola de nail art nº 1
                </span>
              </div>

              {/* Headline */}
              <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(46px, 5.5vw, 82px)", fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.035em", color: "#FEF8F5", marginBottom: 26 }}>
                Transforme sua{" "}
                <span style={{ display: "inline-block", position: "relative" }}>
                  <em style={{ fontStyle: "italic", background: "linear-gradient(120deg, #F08EB0, var(--gold))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    paixão
                  </em>
                  {/* underline decoration */}
                  <svg style={{ position: "absolute", bottom: -4, left: 0, width: "100%", pointerEvents: "none" }} height="6" viewBox="0 0 200 6" preserveAspectRatio="none">
                    <path d="M0 4 Q50 0 100 4 Q150 8 200 4" stroke="#D4437C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  </svg>
                </span>
                {" "}em profissão.
              </h1>

              <p style={{ fontSize: 17, color: "rgba(254,248,245,.52)", lineHeight: 1.78, maxWidth: 480, marginBottom: 44 }}>
                Cursos de nail art, gel, fibra de vidro, esmaltação e nail design com as maiores referências do Brasil. Do básico ao avançado, no seu ritmo.
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 52 }}>
                <Link href="/courses" className="btn-rose">
                  <Play size={15} fill="white" /> Explorar cursos
                </Link>
                <Link href="/login" className="btn-outline">
                  Criar conta grátis <ArrowRight size={15} />
                </Link>
              </div>

              {/* Social proof */}
              <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                {/* Avatar stack */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  {["#E05890","#D4437C","#B82E66","#C9A87C","#8B4460"].map((c, i) => (
                    <div key={i} style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${c}, ${c}aa)`,
                      border: "2.5px solid #150810",
                      marginLeft: i === 0 ? 0 : -10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color: "white",
                      boxShadow: "0 2px 8px rgba(0,0,0,.3)",
                      zIndex: 5-i,
                    }}>
                      {["M","J","A","P","L"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} color="#C9A87C" fill="#C9A87C" />)}
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(254,248,245,.45)" }}>
                    <strong style={{ color: "rgba(254,248,245,.8)", fontWeight: 700 }}>2.400+ alunas</strong> transformadas
                  </span>
                </div>
              </div>
            </div>

            {/* ── RIGHT VISUAL ── */}
            <div className="hero-visual" style={{ position: "relative", height: 540 }}>

              {/* Main course card */}
              <div style={{
                position: "absolute", width: 280, top: "50%", left: "50%",
                transform: "translate(-50%,-50%) rotate(-3deg)",
                borderRadius: 24, overflow: "hidden",
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.1)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 32px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.07)",
                animation: "floatA 7s ease-in-out infinite",
              }}>
                {/* Thumbnail */}
                <div style={{ height: 152, background: "linear-gradient(135deg, #D4437C 0%, #8B1A42 60%, #C9A87C 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                    <path d="M6 3L2 9l10 12L22 9l-4-6H6z" fill="rgba(255,255,255,.25)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M2 9h20M6 3l3 6M18 3l-3 6" stroke="rgba(255,255,255,.6)" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.35)", backdropFilter: "blur(8px)", borderRadius: 8, padding: "3px 9px", fontSize: 10, fontWeight: 700, color: "white", letterSpacing: ".04em" }}>
                    DESTAQUE
                  </div>
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(254,248,245,.35)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Gel UV</div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 16, fontWeight: 700, color: "#FEF8F5", lineHeight: 1.3, marginBottom: 14 }}>Unhas de Gel Completo</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "rgba(254,248,245,.35)" }}>8 módulos · 42 aulas</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#F08EB0" }}>R$ 297</span>
                  </div>
                </div>
              </div>

              {/* Badge — students */}
              <div style={{
                position: "absolute", top: 56, right: 0,
                background: "rgba(201,168,124,.12)", border: "1px solid rgba(201,168,124,.25)",
                borderRadius: 16, padding: "14px 18px", backdropFilter: "blur(16px)",
                animation: "floatB 6s ease-in-out infinite .8s",
                boxShadow: "0 8px 32px rgba(0,0,0,.3)",
              }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#C9A87C", letterSpacing: "-.04em", lineHeight: 1 }}>2.4k+</div>
                <div style={{ fontSize: 11, color: "rgba(254,248,245,.4)", marginTop: 3 }}>Alunas ativas</div>
              </div>

              {/* Badge — rating */}
              <div style={{
                position: "absolute", bottom: 100, left: -10,
                background: "rgba(212,67,124,.12)", border: "1px solid rgba(212,67,124,.22)",
                borderRadius: 16, padding: "12px 16px", backdropFilter: "blur(16px)",
                animation: "floatC 8s ease-in-out infinite 1.5s",
                boxShadow: "0 8px 32px rgba(0,0,0,.3)",
                maxWidth: 180,
              }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 5 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={11} color="#C9A87C" fill="#C9A87C" />)}
                </div>
                <div style={{ fontSize: 11, color: "rgba(254,248,245,.55)", lineHeight: 1.5 }}>
                  "Melhor investimento da minha carreira!"
                </div>
              </div>

              {/* Badge — live now */}
              <div style={{
                position: "absolute", top: 140, left: -20,
                background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)",
                borderRadius: 14, padding: "10px 14px", backdropFilter: "blur(16px)",
                animation: "floatB 9s ease-in-out infinite 2.2s",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 8px 32px rgba(0,0,0,.3)",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", animation: "pulse2 1.5s infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(254,248,245,.7)", whiteSpace: "nowrap" }}>Live agora · 318 assistindo</span>
              </div>

              {/* Badge — last enrollment */}
              <div style={{
                position: "absolute", bottom: 60, right: 10,
                background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 12, padding: "9px 13px", backdropFilter: "blur(12px)",
                animation: "floatC 5s ease-in-out infinite .3s",
              }}>
                <div style={{ fontSize: 10, color: "rgba(254,248,245,.35)", marginBottom: 2 }}>Última matrícula</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#FEF8F5" }}>há 2 minutos ✓</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ TICKER ══════════════════════════════ */}
        <div style={{ background: "var(--rose)", overflow: "hidden", padding: "13px 0", borderTop: "1px solid #B82E66", borderBottom: "1px solid #B82E66" }}>
          <div style={{ display: "flex", animation: "ticker 28s linear infinite", width: "max-content", willChange: "transform" }}>
            {[0, 1].map(s => (
              <div key={s} style={{ display: "flex" }}>
                {["Nail Art","Gel UV","Fibra de Vidro","Esmaltação em Gel","Unhas Acrílicas","Alongamento","Baby Boomer","French Clássica","Nail Design","Decoração 3D","Degradê Perfeito","Técnicas Pro"].map(t => (
                  <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 20, padding: "0 24px", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(255,255,255,.9)" }}>
                    {t}
                    <span style={{ opacity: .4, fontSize: 10 }}>✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════ FEATURES ════════════════════════════ */}
        <section id="sobre" style={{ background: "var(--white)", padding: "108px 24px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>

            {/* Section header */}
            <div style={{ textAlign: "center", marginBottom: 80 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 18 }}>
                <div style={{ height: 1, width: 32, background: "var(--rose)" }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--rose)", textTransform: "uppercase", letterSpacing: ".12em" }}>Por que NailClass</span>
                <div style={{ height: 1, width: 32, background: "var(--rose)" }} />
              </div>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(34px, 4vw, 56px)", fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.04em", lineHeight: 1.08, marginBottom: 18 }}>
                Tudo que você precisa para{" "}
                <em style={{ fontStyle: "italic", color: "var(--rose)" }}>crescer</em>
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 16, maxWidth: 500, margin: "0 auto", lineHeight: 1.75 }}>
                Uma plataforma construída especialmente para quem vive da beleza e quer transformar talento em carreira.
              </p>
            </div>

            {/* 3-column feature cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 72 }}>
              {[
                { icon: Video, title: "Vídeos em HD", desc: "Cada detalhe da técnica filmado de perto. Pause, volte e reveja quantas vezes precisar em qualquer dispositivo.", color: "#D4437C" },
                { icon: Radio, title: "Lives ao Vivo", desc: "Tire dúvidas em tempo real direto do navegador. Transmissão com câmera e tela sem instalar nada.", color: "#8B1A42" },
                { icon: TrendingUp, title: "Progresso Salvo", desc: "Continue de onde parou. Acompanhe seu avanço por módulo e veja quanto falta para o certificado.", color: "#C9A87C" },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="feat-card">
                  <div style={{
                    width: 50, height: 50, borderRadius: 14,
                    background: `${color}18`,
                    border: `1px solid ${color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 22,
                  }}>
                    <Icon size={22} color={color} />
                  </div>
                  <h3 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 700, color: "var(--ink)", letterSpacing: "-.03em", marginBottom: 12 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.75 }}>{desc}</p>
                </div>
              ))}
            </div>

            {/* Big feature row */}
            <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, alignItems: "center" }}>
              {/* Illustration */}
              <div style={{
                borderRadius: 28, overflow: "hidden",
                background: "linear-gradient(148deg, #150810 0%, #21141C 100%)",
                aspectRatio: "4/3",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                position: "relative",
                border: "1px solid rgba(212,67,124,.12)",
                boxShadow: "0 24px 72px rgba(0,0,0,.24)",
              }}>
                {/* Glow ring */}
                <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,67,124,.25) 0%, transparent 70%)" }} />

                {/* Concentric circles */}
                {[180,140,100].map((s, i) => (
                  <div key={i} style={{
                    position: "absolute", width: s, height: s, borderRadius: "50%",
                    border: `1px solid rgba(212,67,124,${.08 - i*.02})`,
                  }} />
                ))}

                {/* Center icon */}
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "linear-gradient(135deg, #E05890, #8B1A42)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 0 12px rgba(212,67,124,.12), 0 16px 48px rgba(212,67,124,.4)",
                  zIndex: 1, position: "relative",
                }}>
                  <Play size={28} color="white" fill="white" />
                </div>

                <div style={{ position: "relative", zIndex: 1, textAlign: "center", marginTop: 24 }}>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 18, color: "#FEF8F5", fontWeight: 700, marginBottom: 4 }}>500+ horas de conteúdo</div>
                  <div style={{ fontSize: 12, color: "rgba(254,248,245,.35)" }}>Qualidade 1080p em todos os cursos</div>
                </div>

                {/* Live badge */}
                <div style={{ position: "absolute", top: 20, left: 20, background: "rgba(212,67,124,.85)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white", animation: "pulse2 1.5s infinite" }} />
                  <span style={{ color: "white", fontSize: 10, fontWeight: 800, letterSpacing: ".06em" }}>AO VIVO</span>
                </div>
              </div>

              {/* Text */}
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 20 }}>
                  <div style={{ height: 1, width: 28, background: "var(--rose)" }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: "var(--rose)", textTransform: "uppercase", letterSpacing: ".12em" }}>Plataforma Completa</span>
                </div>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: "clamp(28px, 3vw, 42px)", fontWeight: 700, color: "var(--ink)", letterSpacing: "-.04em", lineHeight: 1.12, marginBottom: 20 }}>
                  Aprenda no seu ritmo,<br />
                  <em style={{ fontStyle: "italic", color: "var(--rose)" }}>quando quiser</em>
                </h3>
                <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.8, marginBottom: 28 }}>
                  Acesse as aulas pelo celular, tablet ou computador. O progresso é salvo automaticamente e você pode retomar de onde parou a qualquer momento.
                </p>
                {[
                  "Mais de 50 cursos completos disponíveis",
                  "Player HLS com qualidade adaptativa",
                  "Certificado de conclusão digital",
                  "Acesso vitalício após compra",
                ].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--rose-pale)", border: "1px solid var(--rose-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CheckCircle size={12} color="var(--rose)" />
                    </div>
                    <span style={{ fontSize: 14, color: "var(--ink-soft)" }}>{item}</span>
                  </div>
                ))}
                <div style={{ marginTop: 36 }}>
                  <Link href="/courses" className="btn-rose" style={{ fontSize: 14, padding: "12px 26px" }}>
                    Ver todos os cursos <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ STATS ═══════════════════════════════ */}
        <div style={{ background: "var(--cream)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
              {[
                { n: "50+", label: "Cursos publicados", icon: BookOpen },
                { n: "2.4k+", label: "Alunas matriculadas", icon: Users },
                { n: "500h", label: "De conteúdo em vídeo", icon: Clock },
                { n: "98%", label: "Índice de satisfação", icon: Award },
              ].map(({ n, label, icon: Icon }, i) => (
                <div key={label} className={i < 3 ? "stat-sep" : ""} style={{ padding: "44px 24px", textAlign: "center" }}>
                  <Icon size={18} color="var(--rose)" style={{ margin: "0 auto 14px", display: "block" }} />
                  <div style={{ fontFamily: "var(--serif)", fontSize: 44, fontWeight: 700, color: "var(--ink)", letterSpacing: "-.05em", lineHeight: 1, marginBottom: 8 }}>{n}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════ COURSES ═════════════════════════════ */}
        <section style={{ background: "var(--white)", padding: "108px 24px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 56, flexWrap: "wrap", gap: 20 }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
                  <div style={{ height: 1, width: 28, background: "var(--rose)" }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: "var(--rose)", textTransform: "uppercase", letterSpacing: ".12em" }}>Cursos</span>
                </div>
                <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(30px, 4vw, 50px)", fontWeight: 700, color: "var(--ink)", letterSpacing: "-.04em", lineHeight: 1.1 }}>
                  Escolha seu{" "}
                  <em style={{ fontStyle: "italic", color: "var(--rose)" }}>próximo nível</em>
                </h2>
              </div>
              <Link href="/courses" className="btn-light" style={{ fontSize: 13 }}>
                Ver todos os cursos <ArrowRight size={14} />
              </Link>
            </div>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 24 }}>
              {courses.slice(0, 6).map((course: {
                id: string; title: string; thumbnailUrl?: string; level?: string;
                shortDescription?: string; totalLessons: number; totalModules: number;
                isForSale: boolean; price?: number; currency: string;
              }, i: number) => {
                const gradients = [
                  "linear-gradient(140deg, #D4437C 0%, #8B1A42 100%)",
                  "linear-gradient(140deg, #8B1A42 0%, #C9A87C 100%)",
                  "linear-gradient(140deg, #C9A87C 0%, #D4437C 100%)",
                  "linear-gradient(140deg, #4A1A2E 0%, #D4437C 100%)",
                  "linear-gradient(140deg, #D4437C 0%, #4A1A2E 100%)",
                  "linear-gradient(140deg, #1A0A12 0%, #D4437C 100%)",
                ];
                return (
                  <Link key={course.id} href={`/courses/${course.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="course-card">
                      {/* Thumbnail */}
                      <div style={{ aspectRatio: "16/9", overflow: "hidden", background: gradients[i % gradients.length], position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.title} className="course-card-thumb" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <svg className="course-card-thumb" width="52" height="52" viewBox="0 0 24 24" fill="none">
                            <path d="M6 3L2 9l10 12L22 9l-4-6H6z" fill="rgba(255,255,255,.2)" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
                            <path d="M2 9h20M6 3l3 6M18 3l-3 6M12 21L9 9M12 21l3-12" stroke="rgba(255,255,255,.5)" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                        )}
                        {course.level && (
                          <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,.4)", backdropFilter: "blur(8px)", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 100, letterSpacing: ".04em", border: "1px solid rgba(255,255,255,.1)" }}>
                            {course.level}
                          </div>
                        )}
                        {/* Play overlay on hover */}
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", transition: "background .3s", display: "flex", alignItems: "center", justifyContent: "center" }} className="card-play-overlay">
                          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.9)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transform: "scale(0.8)", transition: "opacity .25s, transform .25s" }} className="play-btn">
                            <Play size={18} color="var(--rose)" fill="var(--rose)" />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ padding: "22px 22px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <h3 style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 700, color: "var(--ink)", lineHeight: 1.38, marginBottom: 10, letterSpacing: "-.025em" }}>{course.title}</h3>
                        {course.shortDescription && (
                          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, marginBottom: 16, flex: 1 }}>{course.shortDescription}</p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--line)", marginTop: "auto" }}>
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>{course.totalModules} módulos · {course.totalLessons} aulas</span>
                          <span style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 700, color: "var(--rose)" }}>
                            {course.isForSale && course.price
                              ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: course.currency || "BRL" }).format(course.price)
                              : "Gratuito"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ TESTIMONIALS ════════════════════════ */}
        <section id="depoimentos" style={{ background: "#150810", padding: "108px 24px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 68 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 18 }}>
                <div style={{ height: 1, width: 28, background: "var(--rose)" }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--rose)", textTransform: "uppercase", letterSpacing: ".12em" }}>Depoimentos</span>
                <div style={{ height: 1, width: 28, background: "var(--rose)" }} />
              </div>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(32px, 4vw, 54px)", fontWeight: 700, color: "#FEF8F5", letterSpacing: "-.04em", lineHeight: 1.08 }}>
                O que nossas alunas{" "}
                <em style={{ fontStyle: "italic", color: "var(--rose)" }}>dizem</em>
              </h2>
            </div>

            {/* Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
              {[
                { name: "Mariana S.", role: "Nail Designer", text: "Em 3 meses aprendi tudo sobre gel e hoje atendo mais de 40 clientes por mês. A qualidade das aulas é incomparável — cada técnica é mostrada em detalhe.", init: "M", c: "#D4437C" },
                { name: "Juliana R.", role: "Manicure Profissional", text: "As técnicas de nail art transformaram meu trabalho. Minhas clientes ficam apaixonadas com os resultados e sempre indicam para amigas.", init: "J", c: "#C9A87C" },
                { name: "Priscila M.", role: "Estudante", text: "Comecei do zero sem saber nada. Em poucos meses já estou atendendo e gerando renda. Os vídeos são detalhados e as lives tiram todas as dúvidas.", init: "P", c: "#E05890" },
              ].map(({ name, role, text, init, c }) => (
                <div key={name} className="testi-card">
                  {/* Quote mark */}
                  <div style={{ fontFamily: "var(--serif)", fontSize: 72, color: c, lineHeight: .7, opacity: .5, marginBottom: 20, fontStyle: "italic" }}>"</div>
                  <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={13} color="#C9A87C" fill="#C9A87C" />)}
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(254,248,245,.65)", lineHeight: 1.8, fontStyle: "italic", marginBottom: 26 }}>"{text}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${c}, ${c}88)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 800, color: "white", flexShrink: 0,
                    }}>{init}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#FEF8F5", letterSpacing: "-.01em" }}>{name}</div>
                      <div style={{ fontSize: 12, color: "rgba(254,248,245,.3)", marginTop: 2 }}>{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ CTA ═════════════════════════════════ */}
        <section style={{ padding: "108px 24px", background: "var(--white)", position: "relative", overflow: "hidden" }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -120, right: -120, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,67,124,.07) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,124,.06) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
            {/* Diamond icon */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(140deg, #E05890, #8B1A42)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 28px",
              boxShadow: "0 16px 48px rgba(212,67,124,.36)",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M6 3L2 9l10 12L22 9l-4-6H6z" fill="rgba(255,255,255,.25)" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
                <path d="M2 9h20M6 3l3 6M18 3l-3 6" stroke="rgba(255,255,255,.6)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>

            <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(36px, 5vw, 62px)", fontWeight: 700, color: "var(--ink)", letterSpacing: "-.045em", lineHeight: 1.06, marginBottom: 20 }}>
              Comece sua transformação{" "}
              <em style={{ fontStyle: "italic", color: "var(--rose)" }}>hoje.</em>
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.75, maxWidth: 480, margin: "0 auto 44px" }}>
              Junte-se a mais de 2.400 alunas que já transformaram a paixão por unhas em uma carreira de sucesso.
            </p>

            <Link href="/login" className="btn-rose" style={{ fontSize: 16, padding: "16px 44px" }}>
              Criar minha conta — é grátis <ArrowRight size={18} />
            </Link>

            <p style={{ marginTop: 18, fontSize: 13, color: "var(--muted)" }}>
              Sem cartão de crédito · Acesso imediato · Cancele quando quiser
            </p>

            {/* Mini trust badges */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, marginTop: 40, flexWrap: "wrap" }}>
              {["✦ 2.400+ alunas", "✦ 50+ cursos", "✦ Suporte dedicado"].map(t => (
                <span key={t} style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ FOOTER ══════════════════════════════ */}
        <footer style={{ background: "#150810", padding: "56px 24px 32px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, paddingBottom: 32, marginBottom: 28, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              {/* Logo */}
              <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "linear-gradient(140deg, #E05890 0%, #D4437C 50%, #8B1A42 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(212,67,124,.35)",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 3L2 9l10 12L22 9l-4-6H6z" fill="rgba(255,255,255,.2)" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M2 9h20M6 3l3 6M18 3l-3 6" stroke="rgba(255,255,255,.6)" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 18, color: "#FEF8F5" }}>
                  Nail<span style={{ color: "var(--rose)" }}>Class</span>
                </span>
              </Link>

              <p style={{ fontSize: 13, color: "rgba(254,248,245,.28)" }}>A escola de nail art mais completa do Brasil</p>

              <div style={{ display: "flex", gap: 24 }}>
                {[["Cursos", "/courses"], ["Entrar", "/login"]].map(([l, h]) => (
                  <Link key={h} href={h} className="footer-link">{l}</Link>
                ))}
              </div>
            </div>

            <p style={{ textAlign: "center", fontSize: 12, color: "rgba(254,248,245,.18)" }}>
              © {new Date().getFullYear()} NailClass · Todos os direitos reservados
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
