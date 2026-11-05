import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { en, type Dict } from './en';
import { lt } from './lt';

export type Lang = 'lt' | 'en';
const DICTS: Record<Lang, Dict> = { lt, en };

const Ctx = createContext<{ t: Dict; lang: Lang; setLang: (l: Lang) => void }>({ t: lt, lang: 'lt', setLang: () => {} });

function readLang(): Lang {
  try {
    const v = localStorage.getItem('vb-lang');
    if (v === 'lt' || v === 'en') return v;
  } catch {
    /* storage blocked */
  }
  return 'lt';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('vb-lang', l);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <Ctx.Provider value={{ t: DICTS[lang], lang, setLang }}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);


export { fmt } from '../logic/fmt';
