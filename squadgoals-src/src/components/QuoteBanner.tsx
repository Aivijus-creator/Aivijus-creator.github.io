import React, { useState } from 'react';
import { Sparkles, RefreshCw, Quote as QuoteIcon } from 'lucide-react';
import { MOTIVATIONAL_QUOTES, Quote } from '../data/quotes';

export const QuoteBanner: React.FC = () => {
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  );
  const [isRotating, setIsRotating] = useState(false);

  const currentQuote: Quote = MOTIVATIONAL_QUOTES[quoteIndex];

  const handleNextQuote = () => {
    setIsRotating(true);
    setTimeout(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
      setIsRotating(false);
    }, 200);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FFF5EB] via-[#FFF9F3] to-[#FFF0EB] dark:from-[#1D1916] dark:via-[#1A1715] dark:to-[#211917] border border-[#F2E4D2] dark:border-[#332B24] p-4 sm:p-5 shadow-xs transition-colors">
      {/* Decorative subtle warm glow in top-right */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 w-44 h-44 rounded-full bg-[#FF7A00]/10 dark:bg-[#FF7A00]/15 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#26221E] border border-[#EDE0CE] dark:border-[#3A322B] text-[#FF7A00] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <QuoteIcon className="w-4 h-4 fill-current opacity-80" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FF7A00]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Daily Fuel & Inspiration</span>
              <span className="text-[#9B9386] dark:text-[#787066] font-normal">·</span>
              <span className="text-[#736C61] dark:text-[#A69E93] font-normal">{currentQuote.category}</span>
            </div>

            <p className="text-sm sm:text-base font-medium text-[#2C2C2C] dark:text-[#F5F2EB] italic leading-snug">
              "{currentQuote.text}"
            </p>

            <p className="text-xs text-[#736C61] dark:text-[#A69E93] font-medium tracking-wide">
              — {currentQuote.author}
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleNextQuote}
          title="Get another quote"
          className="self-end sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-[#26221E] hover:bg-white dark:hover:bg-[#302B26] text-xs font-medium text-[#736C61] dark:text-[#C4BCB0] hover:text-[#2C2C2C] dark:hover:text-white border border-[#E8DCcb] dark:border-[#3A322B] transition-all hover:shadow-2xs active:scale-95 shrink-0 cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#FF7A00] transition-transform duration-300 ${
              isRotating ? 'rotate-180' : ''
            }`}
          />
          <span>New Spark</span>
        </button>
      </div>
    </div>
  );
};
