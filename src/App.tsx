import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useT } from './i18n';
import Home from './pages/Home';
import Rules from './pages/Rules';
import SystemPage from './pages/SystemPage';
import Compare from './pages/Compare';
import Sandbox from './pages/Sandbox';
import Quiz from './pages/Quiz';
import Beach from './pages/Beach';

function Header() {
  const { t, lang, setLang } = useT();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  const isBeach = loc.pathname.startsWith('/beach');
  const links: [string, string][] = [
    ['/5-1', '5-1'],
    ['/6-2', '6-2'],
    ['/4-2', '4-2'],
    ['/rules', t.nav.rules],
    ['/compare', t.nav.compare],
    ['/sandbox', t.nav.sandbox],
    ['/quiz', t.nav.quiz],
  ];
  const Lang = (
    <div className="lang" role="group" aria-label="Language">
      <button type="button" aria-pressed={lang === 'lt'} onClick={() => setLang('lt')} title="Lietuvių">LT</button>
      <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} title="English">EN</button>
    </div>
  );
  return (
    <header className={`header ${isBeach ? 'is-beach' : ''}`}>
      <div className="header__beach-layer" />
      <div className="header__in">
        <Link to="/" className="brand" aria-label={t.siteName}>
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
            <circle cx="16" cy="16" r="14" fill="#FFC72C" stroke="#fff" strokeWidth="2" />
            <path d="M4 13c8 1 16 6 20 14M16 2c-3 8-2 18 6 26M29 12c-8 0-15 4-20 15" fill="none" stroke="#1565C0" strokeWidth="2.6" />
          </svg>
          {t.siteName}
        </Link>
        {Lang}
        <nav className="nav" aria-label="Main">
          {links.map(([to, l]) => <NavLink key={to} to={to}>{l}</NavLink>)}
          <NavLink to="/beach" className="nav__beach">🏖 {t.nav.beach}</NavLink>
        </nav>
        <button className="burger" aria-label={t.nav.menu} aria-expanded={open} onClick={() => setOpen(!open)}>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden><path d={open ? 'M5 5l14 14M19 5L5 19' : 'M3 7h18M3 12h18M3 17h18'} stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav className="mobile-menu" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <NavLink to="/">{t.nav.home}</NavLink>
            {links.map(([to, l]) => <NavLink key={to} to={to}>{l}</NavLink>)}
            <NavLink to="/beach" style={{ color: '#FFC72C' }}>🏖 {t.nav.beach}</NavLink>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export default function App() {
  const { t } = useT();
  const loc = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  return (
    <>
      <Header />
      {!loc.pathname.startsWith('/beach') && (
        <Link to="/beach" className="beach-tab">🏖 {t.beach.button}</Link>
      )}
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
          <Route path="/beach" element={<Beach />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <footer className="footer">{t.siteName} · FIVB · 5-1 · 6-2 · 4-2 · 2×2</footer>
    </>
  );
}
