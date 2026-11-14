import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { LangProvider } from './i18n';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <HashRouter>
        {/* animations run even when the phone asks to reduce motion */}
        <MotionConfig reducedMotion="never">
          <App />
        </MotionConfig>
      </HashRouter>
    </LangProvider>
  </StrictMode>,
);
