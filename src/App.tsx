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
import Beach from './pages/Beach';
import type { SystemId } from './data/types';

const SYS: SystemId[] = ['5-1', '6-2', '4-2'];
const Chev = () => (
  <svg className="chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden>
    <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Header({ lastIndoor }: { lastIndoor: string }) {
  const { t, lang, setLang } = useT();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOff, setMenuOff] = useState(false);
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  const isBeach = loc.pathname.startsWith('/beach');
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
                <Link className="menu-card" to={isBeach ? lastIndoor : '/beach'}>
                  <div className="menu-card__pic" data-theme-scope={isBeach ? undefined : 'beach'}>
                    <Court players={[]} beach={!isBeach} hideZones ariaLabel={isBeach ? t.nav.indoor : t.nav.beach} />
                  </div>
                  <b>{isBeach ? t.nav.indoor : t.home.pill}</b>
                  <span>{isBeach ? t.nav.desc.indoor : t.nav.desc.beach}</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="nav__item"><NavLink to="/rules" className="nav__link">{t.nav.rules}</NavLink></div>
          <div className="nav__item"><NavLink to="/quiz" className="nav__link">{t.nav.quiz}</NavLink></div>
          <div className="nav__item">
            {isBeach ? (
              <Link to={lastIndoor} className="nav__link nav__mode">{t.nav.indoor}</Link>
            ) : (
              <NavLink to="/beach" className="nav__link">{t.nav.beach}</NavLink>
            )}
          </div>
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
            {isBeach ? (
              <Link to={lastIndoor} className="mobile-menu__mode">{t.nav.indoor}<span>{t.nav.desc.indoor}</span></Link>
            ) : (
              <NavLink to="/beach" className="mobile-menu__mode">{t.nav.beach}<span>{t.nav.desc.beach}</span></NavLink>
            )}
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
              <li><Link to="/compare">{t.nav.compare}</Link></li>
              <li><Link to="/sandbox">{t.nav.sandbox}</Link></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>{t.home.footBeach}</h4>
            <ul>
              <li><Link to="/beach">2×2</Link></li>
              <li><Link to="/beach">{t.home.footSignals}</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer__legal">
          <span>&copy; 2026 Vollearn</span>
          <span>5-1 · 6-2 · 4-2 · 2×2</span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const { t } = useT();
  const loc = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  // remember the last indoor page so "Indoor volleyball" returns exactly there
  const isBeach = loc.pathname.startsWith('/beach');
  const [lastIndoor, setLastIndoor] = useState('/');
  useEffect(() => { if (!isBeach) setLastIndoor(loc.pathname); }, [isBeach, loc.pathname]);
  return (
    <>
      <Header lastIndoor={lastIndoor} />
      {isBeach ? (
        <Link to={lastIndoor} className="beach-tab indoor-tab">{t.nav.indoorTab}</Link>
      ) : (
        <Link to="/beach" className="beach-tab">{t.beach.button}</Link>
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
      <Footer />
    </>
  );
}
