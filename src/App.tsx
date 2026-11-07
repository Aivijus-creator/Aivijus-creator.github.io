import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useT } from './i18n';
import { Logo } from './components/Logo';
import { Court } from './components/Court';
import Home from './pages/Home';
import Rules from './pages/Rules';
import SystemPage from './pages/SystemPage';
import Compare from './pages/Compare';
import Sandbox from './pages/Sandbox';
import Quiz from './pages/Quiz';
import { withGone } from './pages/SystemPage';
import { SYSTEMS } from './data/systems';
import { DEFAULT_META, toCourtPlayer } from './components/view';
import type { PlayerId, SystemId } from './data/types';

const SYS: SystemId[] = ['5-1', '6-2', '4-2'];
const Chev = () => (
  <svg className="chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden>
    <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 5-1, rotation 1, serve receive: the picture on the rules card in the menu. */
function RulesCourt() {
  const { t } = useT();
  const S = SYSTEMS['5-1'];
  const all: PlayerId[] = [...S.lineup, 'L'];
  const players = withGone(S.formation(0, 'receive'), all, S.lineup, 0)
    .map((p) => toCourtPlayer(p, { t, sys: '5-1', k: 0, phase: 'receive', labelMode: 'role', meta: DEFAULT_META, showIcons: false }));
  return <Court players={players} showZoneBadge={false} ariaLabel={t.rules.title} />;
}

function Header() {
  const { t, lang, setLang } = useT();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOff, setMenuOff] = useState(false);
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  const onSystem = SYS.some((s) => loc.pathname === `/${s}`);
  const tools: [string, string, string][] = [
    ['/sandbox', t.nav.sandbox, t.nav.desc.sandbox],
    ['/quiz', t.nav.quiz, t.nav.desc.quiz],
    ['/compare', t.nav.compare, t.nav.desc.compare],
  ];
  const Lang = (
    <div className="lang" role="group" aria-label="Language">
      <button type="button" aria-pressed={lang === 'lt'} onClick={() => setLang('lt')} title="Lietuvių">LT</button>
      <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} title="English">EN</button>
    </div>
  );
  return (
    <header className="header">
      <div className="wrap header__in">
        <Link to="/" className="brand" aria-label={t.siteName}>
          <Logo size={30} />
        </Link>
        <nav className="nav" aria-label="Main">
          <div className={`nav__item ${menuOff ? 'is-off' : ''}`} onMouseLeave={() => setMenuOff(false)}>
            <Link to="/5-1" className={`nav__link ${onSystem ? 'active' : ''}`} onClick={() => setMenuOff(true)}>
              {t.nav.systems} <Chev />
            </Link>
            <div className="nav__menu" onClick={() => setMenuOff(true)}>
              <div className="wrap menu-grid">
                <div className="menu-col">
                  <p>{t.nav.systems}</p>
                  {SYS.map((s) => (
                    <Link key={s} to={`/${s}`}>{s}<span>{t.nav.desc[s]}</span></Link>
                  ))}
                </div>
                <div className="menu-col">
                  <p>{t.nav.tools}</p>
                  {tools.map(([to, l, d]) => (
                    <Link key={to} to={to}>{l}<span>{d}</span></Link>
                  ))}
                </div>
                <Link className="menu-card" to="/rules">
                  <div className="menu-card__pic"><RulesCourt /></div>
                  <b>{t.rules.title}</b>
                  <span>{t.nav.desc.rules}</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="nav__item"><NavLink to="/rules" className="nav__link">{t.nav.rules}</NavLink></div>
          <div className="nav__item"><NavLink to="/quiz" className="nav__link">{t.nav.quiz}</NavLink></div>
          <div className="nav__item"><NavLink to="/compare" className="nav__link">{t.nav.compare}</NavLink></div>
        </nav>
        <div className="header__actions">
          {Lang}
          <Link className="btn header__cta" to="/5-1">{t.home.cta}</Link>
          <button className="burger" aria-label={t.nav.menu} aria-expanded={open} onClick={() => setOpen(!open)}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path d={open ? 'M4 4l10 10M14 4L4 14' : 'M2 6h14M2 12h14'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav className="mobile-menu" aria-label="Menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}>
            <NavLink to="/" end>{t.nav.home}</NavLink>
            {SYS.map((s) => <NavLink key={s} to={`/${s}`}>{s}<span>{t.nav.desc[s]}</span></NavLink>)}
            <NavLink to="/rules">{t.nav.rules}</NavLink>
            {tools.map(([to, l, d]) => <NavLink key={to} to={to}>{l}<span>{d}</span></NavLink>)}
            <Link className="btn btn--xl" to="/5-1">{t.home.cta}</Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  const { t } = useT();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__close">
          <div>
            <h2>{t.home.closeTitle}</h2>
            <p>{t.home.closeLead}</p>
          </div>
          <Link className="btn" to="/5-1">{t.home.cta}</Link>
        </div>
        <p className="footer__word" aria-hidden>Vollearn</p>
        <div className="footer__links">
          <div className="footer__brand">
            <Link to="/" className="brand" aria-label={t.siteName}><Logo size={28} /></Link>
            <p>{t.home.footLede}</p>
          </div>
          <div className="footer__col">
            <h4>{t.home.footSystems}</h4>
            <ul>{SYS.map((s) => <li key={s}><Link to={`/${s}`}>{s}</Link></li>)}</ul>
          </div>
          <div className="footer__col">
            <h4>{t.home.footLearn}</h4>
            <ul>
              <li><Link to="/rules">{t.nav.rules}</Link></li>
              <li><Link to="/quiz">{t.nav.quiz}</Link></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>{t.nav.tools}</h4>
            <ul>
              <li><Link to="/sandbox">{t.nav.sandbox}</Link></li>
              <li><Link to="/compare">{t.nav.compare}</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer__legal">
          <span>&copy; 2026 Vollearn</span>
          <span>5-1 · 6-2 · 4-2</span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const loc = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  return (
    <>
      <Header />
      <main>
        <Routes location={loc}>
          <Route path="/" element={<Home />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/5-1" element={<SystemPage key="5-1" sys="5-1" />} />
          <Route path="/6-2" element={<SystemPage key="6-2" sys="6-2" />} />
          <Route path="/4-2" element={<SystemPage key="4-2" sys="4-2" />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
