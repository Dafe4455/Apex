'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const revealRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const asks = [
    { price: '67,430.10', size: '0.842', pct: 30 },
    { price: '67,427.85', size: '0.615', pct: 22 },
    { price: '67,425.40', size: '1.203', pct: 45 },
    { price: '67,423.15', size: '0.392', pct: 14 },
    { price: '67,421.00', size: '0.558', pct: 20 },
  ];
  const bids = [
    { price: '67,419.80', size: '0.674', pct: 24 },
    { price: '67,417.55', size: '1.488', pct: 53 },
    { price: '67,415.30', size: '0.291', pct: 11 },
    { price: '67,412.90', size: '0.926', pct: 33 },
    { price: '67,410.60', size: '0.512', pct: 19 },
  ];

  const tickerItems = [
    { sym: 'AAPL', price: '189.42', chg: '+1.24%', up: true },
    { sym: 'BTC/USD', price: '67,420', chg: '+2.38%', up: true },
    { sym: 'TSLA', price: '248.10', chg: '−0.87%', up: false },
    { sym: 'EUR/USD', price: '1.0842', chg: '+0.12%', up: true },
    { sym: 'ETH/USD', price: '3,512', chg: '+3.01%', up: true },
    { sym: 'NVDA', price: '875.40', chg: '+4.62%', up: true },
    { sym: 'GOLD', price: '2,318.50', chg: '−0.23%', up: false },
    { sym: 'S&P 500', price: '5,241.33', chg: '+0.56%', up: true },
  ];

  const trustLine = [
    'FCA & CySEC regulated',
    'Negative balance protection',
    '24/5 desk support',
    'Spreads from 0.0 pips',
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --paper: #f0f7f7;
          --paper-deep: #d8d6cb;
          --paper-text: #1c1a17;
          --paper-text-dim: #6b6a62;
          --line: #c7c4b7;

          --graphite: #1b1815;
          --graphite-deep: #131110;
          --graphite-raised: #221e1a;
          --line-dark: #322d27;
          --on-graphite: #ece8de;
          --on-graphite-dim: #8c867a;

          --brass: #b9893a;
          --brass-deep: #8f6a2b;
          --bid: #7c9c84;
          --ask: #b15c43;

          --display: 'Space Grotesk', sans-serif;
          --body: 'IBM Plex Sans', sans-serif;
          --mono: 'IBM Plex Mono', monospace;
        }

        .lp-root {
          background: var(--paper);
          color: var(--paper-text);
          font-family: var(--body);
          overflow-x: hidden;
        }

        a:focus-visible, button:focus-visible, input:focus-visible {
          outline: 2px solid var(--brass);
          outline-offset: 2px;
        }

        .lp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: repeating-linear-gradient(
            to bottom, transparent 0px, transparent 35px, rgba(28,26,23,0.03) 36px
          );
          pointer-events: none;
          z-index: 1;
        }

        /* ── NAV (ticker folded in, no separate strip) ── */
        .lp-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 28px;
          padding: 16px 60px;
          background: var(--paper);
          border-bottom: 1px solid var(--line);
        }
        .lp-logo {
          font-family: var(--display);
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--paper-text);
          text-transform: uppercase;
          text-decoration: none;
          flex-shrink: 0;
        }
        .lp-logo span { color: var(--brass); }

        .lp-nav-ticker {
          flex: 1;
          overflow: hidden;
          height: 14px;
          position: relative;
          -webkit-mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
          mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
        }
        .lp-nav-ticker-inner {
          display: flex;
          position: absolute;
          white-space: nowrap;
          animation: scrollTicker 42s linear infinite;
        }
        .lp-nav-ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 22px;
          font-family: var(--mono);
          font-size: 0.66rem;
          color: var(--paper-text-dim);
          font-variant-numeric: tabular-nums;
          border-right: 1px solid var(--line);
        }
        .lp-nav-ticker-item .sym { color: var(--paper-text); font-weight: 500; }
        .lp-nav-ticker-item .up { color: var(--bid); }
        .lp-nav-ticker-item .dn { color: var(--ask); }

        .lp-nav-links {
          display: flex;
          gap: 28px;
          list-style: none;
          flex-shrink: 0;
        }
        .lp-nav-links a {
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--paper-text-dim);
          text-decoration: none;
          transition: color 0.2s;
        }
        .lp-nav-links a:hover { color: var(--brass-deep); }
        .lp-nav-cta {
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: var(--graphite);
          color: var(--on-graphite);
          padding: 9px 18px;
          border: none;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          text-decoration: none;
          flex-shrink: 0;
        }
        .lp-nav-cta:hover { background: var(--brass); color: var(--graphite-deep); }

        /* ── shared row pattern: margin label + content ── */
        .lp-row {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 56px;
          padding: 84px 60px;
          border-top: 1px solid var(--line);
        }
        .lp-row.hero { border-top: none; padding: 158px 60px 90px; }
        .lp-row.dark { background: var(--graphite-deep); border-top-color: var(--line-dark); }

        .lp-row-margin {
          font-family: var(--mono);
        }
        .lp-row-margin .num {
          font-family: var(--display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--paper-text);
          line-height: 1;
          margin-bottom: 8px;
        }
        .lp-row.dark .lp-row-margin .num { color: var(--on-graphite); }
        .lp-row-margin .lbl {
          font-size: 0.66rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--brass-deep);
        }
        .lp-row.dark .lp-row-margin .lbl { color: var(--brass); }

        /* ── HERO ── */
        .lp-hero-tag {
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--brass-deep);
          margin-bottom: 24px;
          opacity: 0;
          animation: fadeUp 0.7s ease 0.15s forwards;
        }
        .lp-h1 {
          font-family: var(--display);
          font-size: clamp(2.6rem, 5vw, 4.4rem);
          line-height: 1.05;
          font-weight: 700;
          color: var(--paper-text);
          margin-bottom: 26px;
          letter-spacing: -0.01em;
          max-width: 700px;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.3s forwards;
        }
        .lp-h1 em {
          font-style: normal;
          color: inherit;
          text-decoration: underline;
          text-decoration-color: var(--brass);
          text-decoration-thickness: 3px;
          text-underline-offset: 7px;
        }
        .lp-hero-sub {
          font-size: 1rem;
          line-height: 1.7;
          color: var(--paper-text-dim);
          max-width: 460px;
          margin-bottom: 36px;
          font-weight: 300;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.45s forwards;
        }
        .lp-hero-actions {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 44px;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.6s forwards;
        }
        .lp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--brass);
          color: var(--graphite-deep);
          font-family: var(--mono);
          font-size: 0.76rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 15px 30px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .lp-btn-primary:hover { background: var(--brass-deep); transform: translateY(-1px); }
        .lp-btn-ghost {
          font-family: var(--mono);
          font-size: 0.74rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--paper-text-dim);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 2px;
          border-bottom: 1px solid var(--line);
          transition: color 0.2s, border-color 0.2s;
        }
        .lp-btn-ghost:hover { color: var(--brass-deep); border-color: var(--brass-deep); }

        .lp-stat-strip {
          display: flex;
          flex-wrap: wrap;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          opacity: 0;
          animation: fadeUp 0.8s ease 0.75s forwards;
        }
        .lp-stat-item {
          flex: 1;
          min-width: 130px;
          padding: 14px 22px 14px 0;
          border-right: 1px solid var(--line);
        }
        .lp-stat-item:last-child { border-right: none; }
        .lp-stat-val {
          font-family: var(--mono);
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--paper-text);
          font-variant-numeric: tabular-nums;
        }
        .lp-stat-lbl {
          font-size: 0.72rem;
          color: var(--paper-text-dim);
          margin-top: 4px;
          line-height: 1.4;
        }

        .lp-hero-book-wrap {
          max-width: 440px;
          margin: 56px 0 0 auto;
          opacity: 0;
          animation: fadeIn 1s ease 0.9s forwards;
        }
        .lp-book-card {
          background: var(--graphite);
          border: 1px solid var(--line-dark);
          padding: 22px 22px 16px;
          box-shadow: 0 26px 52px rgba(19,17,16,0.22);
        }
        .lp-book-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--line-dark);
        }
        .lp-book-eyebrow {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: var(--mono);
          font-size: 0.64rem;
          letter-spacing: 0.13em;
          color: var(--on-graphite-dim);
          text-transform: uppercase;
          margin-bottom: 9px;
        }
        .lp-live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--bid); animation: pulse 2s ease-in-out infinite; }
        .lp-book-price { font-family: var(--mono); font-size: 1.5rem; font-weight: 500; color: var(--on-graphite); line-height: 1; font-variant-numeric: tabular-nums; }
        .lp-book-change { font-family: var(--mono); font-size: 0.68rem; color: var(--bid); margin-top: 5px; }
        .lp-book-controls { display: flex; flex-direction: column; align-items: flex-end; gap: 7px; }
        .lp-book-controls-label { font-family: var(--mono); font-size: 0.56rem; letter-spacing: 0.1em; color: var(--on-graphite-dim); text-transform: uppercase; }
        .lp-tick-row { display: flex; gap: 4px; }
        .lp-tick-btn { font-family: var(--mono); font-size: 0.6rem; color: #6b665c; background: transparent; border: 1px solid var(--line-dark); padding: 3px 7px; cursor: pointer; }
        .lp-tick-btn.active { color: var(--on-graphite); border-color: var(--brass); background: rgba(185,137,58,0.12); }

        .lp-book { font-family: var(--mono); font-size: 0.7rem; font-variant-numeric: tabular-nums; }
        .lp-book-row { display: grid; grid-template-columns: 74px 1fr 54px; align-items: center; gap: 9px; padding: 2.5px 0; }
        .lp-book-price-ask { color: var(--ask); }
        .lp-book-price-bid { color: var(--bid); }
        .lp-book-size { color: var(--on-graphite-dim); text-align: right; }
        .lp-book-track { position: relative; height: 13px; background: rgba(255,255,255,0.025); }
        .lp-book-fill { position: absolute; top: 0; height: 100%; opacity: 0.3; }
        .lp-book-fill.ask { right: 0; background: var(--ask); }
        .lp-book-fill.bid { left: 0; background: var(--bid); }
        .lp-book-spread {
          display: flex; justify-content: space-between; padding: 8px 1px; margin: 4px 0;
          border-top: 1px dashed var(--line-dark); border-bottom: 1px dashed var(--line-dark);
          font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.05em; text-transform: uppercase; color: var(--on-graphite-dim);
        }
        .lp-book-spread strong { color: var(--on-graphite); font-weight: 500; }
        .lp-book-footer { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; margin-top: 16px; background: var(--line-dark); }
        .lp-book-stat { background: var(--graphite-raised); padding: 10px 12px; }
        .lp-book-stat-label { font-family: var(--mono); font-size: 0.56rem; letter-spacing: 0.1em; color: #6b665c; text-transform: uppercase; margin-bottom: 4px; }
        .lp-book-stat-val { font-family: var(--mono); font-size: 0.78rem; color: var(--on-graphite); font-weight: 500; }

        /* ── FEATURE LIST (replaces the card grid) ── */
        .lp-row-intro {
          font-family: var(--display);
          font-size: clamp(1.6rem, 2.6vw, 2.2rem);
          font-weight: 700;
          color: var(--paper-text);
          line-height: 1.2;
          max-width: 480px;
          margin-bottom: 36px;
          letter-spacing: -0.01em;
        }
        .lp-feat-list { border-top: 1px solid var(--line); }
        .lp-feat-row {
          display: grid;
          grid-template-columns: 40px 1fr 24px;
          align-items: start;
          gap: 22px;
          padding: 26px 0;
          border-bottom: 1px solid var(--line);
          transition: padding-left 0.2s;
        }
        .lp-feat-row:hover { padding-left: 8px; }
        .lp-feat-letter { font-family: var(--mono); font-size: 0.82rem; color: var(--brass-deep); padding-top: 3px; transition: color 0.2s; }
        .lp-feat-row:hover .lp-feat-letter { color: var(--brass); }
        .lp-feat-title { font-family: var(--display); font-size: 1.1rem; font-weight: 600; color: var(--paper-text); margin-bottom: 8px; line-height: 1.3; }
        .lp-feat-row.lead .lp-feat-title { font-size: 1.4rem; }
        .lp-feat-desc { font-size: 0.86rem; line-height: 1.7; color: var(--paper-text-dim); font-weight: 300; max-width: 580px; }
        .lp-feat-arrow { font-family: var(--mono); color: var(--paper-text-dim); transition: transform 0.2s, color 0.2s; padding-top: 3px; }
        .lp-feat-row:hover .lp-feat-arrow { color: var(--brass-deep); transform: translateX(4px); }

        /* ── INSTRUMENTS ── */
        .lp-asset-rows { display: flex; flex-direction: column; gap: 1px; background: var(--line); margin-top: 8px; }
        .lp-asset-row {
          background: var(--paper);
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          align-items: center;
          padding: 14px 18px;
          gap: 16px;
          transition: background 0.15s;
        }
        .lp-asset-row:hover { background: var(--paper-deep); }
        .lp-asset-row.header { background: var(--graphite-deep); }
        .lp-asset-dot { width: 6px; height: 6px; background: var(--brass); }
        .lp-asset-sym { font-family: var(--mono); font-size: 0.74rem; font-weight: 500; color: var(--paper-text); letter-spacing: 0.06em; min-width: 56px; }
        .lp-asset-name { font-size: 0.78rem; color: var(--paper-text-dim); }
        .lp-asset-price { font-family: var(--mono); font-size: 0.8rem; color: var(--paper-text); text-align: right; font-variant-numeric: tabular-nums; }
        .lp-asset-chg { font-family: var(--mono); font-size: 0.72rem; text-align: right; min-width: 56px; font-variant-numeric: tabular-nums; }
        .lp-asset-row.header .lp-asset-sym, .lp-asset-row.header .lp-asset-name,
        .lp-asset-row.header .lp-asset-price, .lp-asset-row.header .lp-asset-chg { color: #6b665c !important; font-size: 0.6rem; letter-spacing: 0.1em; }
        .lp-asset-row.header .lp-asset-dot { background: #6b665c; }
        .up { color: var(--bid); }
        .dn { color: var(--ask); }
        .lp-inline-link {
          display: inline-flex; align-items: center; gap: 8px; margin-top: 22px;
          font-family: var(--mono); font-size: 0.74rem; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--paper-text-dim); text-decoration: none; border-bottom: 1px solid var(--line); padding-bottom: 2px;
          transition: color 0.2s, border-color 0.2s;
        }
        .lp-inline-link:hover { color: var(--brass-deep); border-color: var(--brass-deep); }

        /* ── TESTIMONIALS — one pull-quote, not a card grid ── */
        .lp-pull-quote {
          font-family: var(--body);
          font-style: italic;
          font-size: clamp(1.25rem, 2.1vw, 1.6rem);
          line-height: 1.55;
          color: var(--on-graphite);
          max-width: 700px;
        }
        .lp-pull-attr {
          margin-top: 18px;
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--brass);
        }
        .lp-secondary-quotes { margin-top: 40px; border-top: 1px solid var(--line-dark); padding-top: 28px; display: flex; flex-direction: column; gap: 24px; max-width: 700px; }
        .lp-secondary-quote { font-size: 0.86rem; line-height: 1.65; color: var(--on-graphite-dim); font-style: italic; }
        .lp-secondary-quote-attr { margin-top: 8px; font-family: var(--mono); font-size: 0.66rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--on-graphite-dim); font-style: normal; }

        /* ── CLOSING ── */
        .lp-close-h2 {
          font-family: var(--display);
          font-size: clamp(1.9rem, 3.2vw, 2.8rem);
          font-weight: 700;
          color: var(--paper-text);
          line-height: 1.15;
          margin-bottom: 18px;
          letter-spacing: -0.01em;
          max-width: 560px;
        }
        .lp-close-h2 em {
          font-style: normal; color: inherit;
          text-decoration: underline; text-decoration-color: var(--brass);
          text-decoration-thickness: 3px; text-underline-offset: 6px;
        }
        .lp-close-p { font-size: 0.94rem; line-height: 1.75; color: var(--paper-text-dim); font-weight: 300; margin-bottom: 30px; max-width: 460px; }
        .lp-cta-form { display: flex; max-width: 480px; }
        .lp-cta-input {
          flex: 1; background: transparent; border: 1px solid var(--line); border-right: none;
          padding: 14px 18px; font-family: var(--mono); font-size: 0.78rem; color: var(--paper-text); outline: none; transition: border-color 0.2s;
        }
        .lp-cta-input::placeholder { color: var(--paper-text-dim); }
        .lp-cta-input:focus { border-color: var(--graphite); }
        .lp-cta-submit {
          background: var(--brass); color: var(--graphite-deep); border: none; padding: 14px 26px;
          font-family: var(--mono); font-size: 0.72rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: background 0.2s;
        }
        .lp-cta-submit:hover { background: var(--brass-deep); }
        .lp-trust-line { margin-top: 30px; display: flex; flex-wrap: wrap; gap: 7px 10px; font-size: 0.8rem; color: var(--paper-text-dim); align-items: center; }
        .lp-trust-line strong { color: var(--paper-text); font-weight: 500; }
        .lp-trust-dot { color: var(--brass-deep); }

        /* ── FOOTER — one slim bar ── */
        .lp-footer {
          background: var(--graphite-deep);
          border-top: 1px solid var(--line-dark);
          padding: 28px 60px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .lp-footer-brand {
          font-family: var(--display); font-size: 0.92rem; font-weight: 700; letter-spacing: 0.08em;
          color: var(--on-graphite); text-transform: uppercase;
        }
        .lp-footer-brand span { color: var(--brass); }
        .lp-footer-links { display: flex; gap: 22px; flex-wrap: wrap; list-style: none; }
        .lp-footer-links a {
          font-family: var(--mono); font-size: 0.66rem; letter-spacing: 0.08em; text-transform: uppercase;
          color: #6b665c; text-decoration: none; transition: color 0.2s;
        }
        .lp-footer-links a:hover { color: var(--on-graphite); }
        .lp-footer-legal { font-family: var(--mono); font-size: 0.62rem; color: #5a564d; }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes scrollTicker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.visible { opacity: 1; transform: none; }

        @media (prefers-reduced-motion: reduce) {
          .lp-hero-tag, .lp-h1, .lp-hero-sub, .lp-hero-actions, .lp-stat-strip, .lp-hero-book-wrap, .reveal {
            animation: none !important; opacity: 1 !important; transform: none !important;
          }
          .lp-live-dot, .lp-nav-ticker-inner { animation: none !important; }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .lp-nav-ticker { display: none; }
        }
        @media (max-width: 768px) {
          .lp-nav { padding: 16px 24px; gap: 16px; }
          .lp-nav-links { display: none; }
          .lp-row { grid-template-columns: 1fr; gap: 18px; padding: 56px 24px; }
          .lp-row.hero { padding: 110px 24px 56px; }
          .lp-row-margin { display: flex; align-items: baseline; gap: 10px; }
          .lp-hero-book-wrap { margin: 40px 0 0; max-width: 100%; }
          .lp-stat-strip { border-top: none; }
          .lp-stat-item { min-width: 45%; border-right: none; border-top: 1px solid var(--line); padding: 12px 0; }
          .lp-footer { padding: 24px 24px; flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="lp-root">

        {/* NAV */}
        <nav className="lp-nav">
          <Link href="/" className="lp-logo">Apex<span>·</span>Markets</Link>
          <div className="lp-nav-ticker">
            <div className="lp-nav-ticker-inner">
              {[...Array(3)].map((_, d) =>
                tickerItems.map((item) => (
                  <span key={`${d}-${item.sym}`} className="lp-nav-ticker-item">
                    <span className="sym">{item.sym}</span>
                    {item.price}
                    <span className={item.up ? 'up' : 'dn'}>{item.chg}</span>
                  </span>
                ))
              )}
            </div>
          </div>
          <ul className="lp-nav-links">
            <li><a href="#platform">Platform</a></li>
            <li><a href="#markets">Markets</a></li>
            <li><a href="#trust">Trust</a></li>
            <li><a href="#begin">Begin</a></li>
          </ul>
          <Link href="/login" className="lp-nav-cta">Open Account</Link>
        </nav>

        {/* HERO */}
        <section className="lp-row hero">
          <div className="lp-row-margin">
            <span className="num">00</span>
            <span className="lbl">Cover</span>
          </div>
          <div>
            <p className="lp-hero-tag">Professional-grade execution</p>
            <h1 className="lp-h1">Trade with <em>surgical</em> precision.</h1>
            <p className="lp-hero-sub">Institutional-quality access to equities, derivatives, crypto, and FX — wrapped in an interface built for the serious trader.</p>
            <div className="lp-hero-actions">
              <Link href="/signup" className="lp-btn-primary">
                Start Trading
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
                </svg>
              </Link>
              <Link href="/login" className="lp-btn-ghost">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
                  <path d="M4.5 6l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
                </svg>
                Sign In
              </Link>
            </div>
            <div className="lp-stat-strip">
              <div className="lp-stat-item"><div className="lp-stat-val">$4.8B</div><div className="lp-stat-lbl">Daily volume</div></div>
              <div className="lp-stat-item"><div className="lp-stat-val">0.2ms</div><div className="lp-stat-lbl">Avg. latency</div></div>
              <div className="lp-stat-item"><div className="lp-stat-val">180+</div><div className="lp-stat-lbl">Markets</div></div>
              <div className="lp-stat-item"><div className="lp-stat-val">99.9%</div><div className="lp-stat-lbl">Uptime SLA</div></div>
            </div>

            <div className="lp-hero-book-wrap">
              <div className="lp-book-card">
                <div className="lp-book-header">
                  <div>
                    <div className="lp-book-eyebrow"><span className="lp-live-dot" />Order book — BTC/USD</div>
                    <div className="lp-book-price">67,420.50</div>
                    <div className="lp-book-change">▲ +2.38% today</div>
                  </div>
                  <div className="lp-book-controls">
                    <span className="lp-book-controls-label">Tick size</span>
                    <div className="lp-tick-row">
                      <button className="lp-tick-btn">0.01</button>
                      <button className="lp-tick-btn active">0.1</button>
                      <button className="lp-tick-btn">1</button>
                    </div>
                  </div>
                </div>
                <div className="lp-book">
                  {asks.map((row) => (
                    <div className="lp-book-row" key={row.price}>
                      <span className="lp-book-price-ask">{row.price}</span>
                      <span className="lp-book-track"><span className="lp-book-fill ask" style={{ width: `${row.pct}%` }} /></span>
                      <span className="lp-book-size">{row.size}</span>
                    </div>
                  ))}
                  <div className="lp-book-spread"><span>Spread <strong>0.50</strong></span><span>Mid <strong>67,420.50</strong></span></div>
                  {bids.map((row) => (
                    <div className="lp-book-row" key={row.price}>
                      <span className="lp-book-price-bid">{row.price}</span>
                      <span className="lp-book-track"><span className="lp-book-fill bid" style={{ width: `${row.pct}%` }} /></span>
                      <span className="lp-book-size">{row.size}</span>
                    </div>
                  ))}
                </div>
                <div className="lp-book-footer">
                  <div className="lp-book-stat"><div className="lp-book-stat-label">Spread</div><div className="lp-book-stat-val">0.0007%</div></div>
                  <div className="lp-book-stat"><div className="lp-book-stat-label">24h Vol</div><div className="lp-book-stat-val">$38.2B</div></div>
                  <div className="lp-book-stat"><div className="lp-book-stat-label">Depth ±1%</div><div className="lp-book-stat-val">$14.2M</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM — list, not a card grid */}
        <section className="lp-row" id="platform">
          <div className="lp-row-margin reveal">
            <span className="num">01</span>
            <span className="lbl">Platform</span>
          </div>
          <div className="reveal">
            <h2 className="lp-row-intro">Every edge, engineered.</h2>
            <div className="lp-feat-list">
              {[
                { letter: 'A', title: 'Advanced Order Routing & Smart Execution', desc: 'Our proprietary smart-order router splits and routes your orders across multiple liquidity pools in real time — minimizing slippage and maximizing fill rates on every trade.', lead: true },
                { letter: 'B', title: 'Multi-Asset Dashboard', desc: 'Monitor your entire portfolio — equities, crypto, FX, and commodities — from a single unified workspace.' },
                { letter: 'C', title: 'Real-time Risk Engine', desc: 'Automatic position monitoring, margin alerts, and drawdown controls — so you stay in the game longer.' },
                { letter: 'D', title: 'Institutional-grade API', desc: 'Full REST and WebSocket API access for algorithmic traders. Low-latency data feeds with co-location options.' },
              ].map(({ letter, title, desc, lead }) => (
                <div key={letter} className={`lp-feat-row${lead ? ' lead' : ''}`}>
                  <span className="lp-feat-letter">{letter}</span>
                  <div>
                    <div className="lp-feat-title">{title}</div>
                    <div className="lp-feat-desc">{desc}</div>
                  </div>
                  <span className="lp-feat-arrow">→</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MARKETS */}
        <section className="lp-row" id="markets">
          <div className="lp-row-margin reveal">
            <span className="num">02</span>
            <span className="lbl">Markets</span>
          </div>
          <div className="reveal">
            <h2 className="lp-row-intro">Everything moves. Capture it.</h2>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--paper-text-dim)', fontWeight: 300, marginBottom: 8, maxWidth: 460 }}>
              Trade across 180+ instruments spanning crypto, equities, FX, and commodities.
            </p>
            <div className="lp-asset-rows">
              <div className="lp-asset-row header">
                <div className="lp-asset-dot" />
                <div className="lp-asset-sym">SYMBOL</div>
                <div className="lp-asset-price">PRICE</div>
                <div className="lp-asset-chg">CHG%</div>
              </div>
              {[
                { sym: 'BTC', name: 'Bitcoin', price: '67,420', chg: '+2.38%', up: true },
                { sym: 'ETH', name: 'Ethereum', price: '3,512', chg: '+3.01%', up: true },
                { sym: 'NVDA', name: 'NVIDIA Corp', price: '875.40', chg: '+4.62%', up: true },
                { sym: 'GOLD', name: 'Gold Spot', price: '2,318.50', chg: '−0.23%', up: false },
                { sym: 'EUR/USD', name: 'Euro / Dollar', price: '1.0842', chg: '+0.12%', up: true },
                { sym: 'TSLA', name: 'Tesla Inc', price: '248.10', chg: '−0.87%', up: false },
              ].map(({ sym, name, price, chg, up }) => (
                <div key={sym} className="lp-asset-row">
                  <div className="lp-asset-dot" />
                  <div className="lp-asset-sym">{sym}</div>
                  <div className="lp-asset-price">{price}</div>
                  <div className={`lp-asset-chg ${up ? 'up' : 'dn'}`}>{chg}</div>
                </div>
              ))}
            </div>
            <Link href="/signup" className="lp-inline-link">
              View all 180+ instruments →
            </Link>
          </div>
        </section>

        {/* TRUST — one pull-quote, not a card grid */}
        <section className="lp-row dark" id="trust">
          <div className="lp-row-margin reveal">
            <span className="num">03</span>
            <span className="lbl">Trust</span>
          </div>
          <div className="reveal">
            <p className="lp-pull-quote">
              "The execution speed alone puts Apex Markets ahead of anything else I've used. My scalp strategies work the way they're supposed to."
            </p>
            <p className="lp-pull-attr">Marcus K. — Prop Trader, London</p>

            <div className="lp-secondary-quotes">
              <div>
                <p className="lp-secondary-quote">"Having crypto, equities, and FX all in one dashboard with a clean interface is rare. Apex makes it feel obvious in hindsight."</p>
                <p className="lp-secondary-quote-attr">Sofia N. — Portfolio Manager, Dubai</p>
              </div>
              <div>
                <p className="lp-secondary-quote">"The API documentation is impeccable. Integrated our quant system in two days — fill rates are noticeably better than our previous broker."</p>
                <p className="lp-secondary-quote-attr">Ryo O. — Quantitative Developer, Tokyo</p>
              </div>
            </div>
          </div>
        </section>

        {/* BEGIN */}
        <section className="lp-row" id="begin">
          <div className="lp-row-margin reveal">
            <span className="num">04</span>
            <span className="lbl">Begin</span>
          </div>
          <div className="reveal">
            <h2 className="lp-close-h2">Your edge starts <em>here.</em></h2>
            <p className="lp-close-p">Open a funded account in under 5 minutes. No minimums on demo. Live markets from day one.</p>
            <div className="lp-cta-form">
              <input className="lp-cta-input" type="email" placeholder="Enter your email address" />
              <button className="lp-cta-submit">Get Started</button>
            </div>
            <p className="lp-trust-line">
              {trustLine.map((item, i) => (
                <span key={item}>
                  {i > 0 && <span className="lp-trust-dot"> · </span>}
                  <strong>{item}</strong>
                </span>
              ))}
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="lp-footer-brand">Apex<span>·</span>Markets</div>
          <ul className="lp-footer-links">
            <li><a href="#">Web Terminal</a></li>
            <li><a href="#">API Access</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Risk Disclosure</a></li>
          </ul>
          <span className="lp-footer-legal">© 2026 Apex Markets Ltd.</span>
        </footer>

      </div>
    </>
  );
}
