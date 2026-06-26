'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HomePage() {
  // Scroll reveal
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Mono:wght@300;400;500&family=Manrope:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --cream: #C9F5F7;
          --cream-dark: #062526;
          --cream-darker: #e0d9cc;
          --ink: #1a1512;
          --ink-mid: #3d352e;
          --ink-light: #7a6e65;
          --red: #c9170a;
          --red-dark: #9e1108;
          --red-glow: rgba(201,23,10,0.12);
          --serif: 'Playfair Display', Georgia, serif;
          --mono: 'DM Mono', monospace;
          --sans: 'Manrope', sans-serif;
        }

        .lp-root {
          background: var(--cream);
          color: var(--ink);
          font-family: var(--sans);
          overflow-x: hidden;
        }

        /* noise overlay */
        .lp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
          opacity: 0.6;
        }

        /* ── NAV ── */
        .lp-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 60px;
          background: linear-gradient(to bottom, var(--cream) 60%, transparent);
        }
        .lp-logo {
          font-family: var(--serif);
          font-size: 1.3rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: var(--ink);
          text-transform: uppercase;
          text-decoration: none;
        }
        .lp-logo span { color: var(--red); }
        .lp-nav-links {
          display: flex;
          gap: 40px;
          list-style: none;
        }
        .lp-nav-links a {
          font-family: var(--mono);
          font-size: 0.72rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--ink-mid);
          text-decoration: none;
          position: relative;
          transition: color 0.2s;
        }
        .lp-nav-links a::after {
          content: '';
          position: absolute;
          bottom: -3px; left: 0;
          width: 0; height: 1px;
          background: var(--red);
          transition: width 0.25s ease;
        }
        .lp-nav-links a:hover { color: var(--ink); }
        .lp-nav-links a:hover::after { width: 100%; }
        .lp-nav-cta {
          font-family: var(--mono);
          font-size: 0.72rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          background: var(--ink);
          color: var(--cream);
          padding: 10px 22px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        .lp-nav-cta:hover { background: var(--red); }

        /* ── HERO ── */
        .lp-hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          padding: 120px 60px 80px;
          position: relative;
          gap: 60px;
        }
        .lp-hero::after {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 45%; height: 100%;
          background: linear-gradient(135deg, transparent 40%, var(--cream-dark) 40%);
          z-index: 0;
        }
        .lp-hero-left { position: relative; z-index: 2; }

        .lp-hero-tag {
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--red);
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
          opacity: 0;
          animation: fadeUp 0.7s ease 0.2s forwards;
        }
        .lp-hero-tag::before {
          content: '';
          display: inline-block;
          width: 28px; height: 1px;
          background: var(--red);
        }
        .lp-h1 {
          font-family: var(--serif);
          font-size: clamp(3.2rem, 5.5vw, 5.2rem);
          line-height: 1.05;
          font-weight: 900;
          color: var(--ink);
          margin-bottom: 32px;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.35s forwards;
        }
        .lp-h1 em { font-style: italic; color: var(--red); }
        .lp-hero-sub {
          font-size: 1rem;
          line-height: 1.7;
          color: var(--ink-light);
          max-width: 440px;
          margin-bottom: 50px;
          font-weight: 300;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.5s forwards;
        }
        .lp-hero-actions {
          display: flex;
          align-items: center;
          gap: 24px;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.65s forwards;
        }
        .lp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--red);
          color: #fff;
          font-family: var(--mono);
          font-size: 0.78rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 16px 32px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          position: relative;
          overflow: hidden;
        }
        .lp-btn-primary:hover { background: var(--red-dark); transform: translateY(-1px); }
        .lp-btn-ghost {
          font-family: var(--mono);
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-mid);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 2px;
          border-bottom: 1px solid var(--cream-darker);
          transition: color 0.2s, border-color 0.2s;
        }
        .lp-btn-ghost:hover { color: var(--red); border-color: var(--red); }

        /* ── HERO RIGHT — chart card ── */
        .lp-hero-right {
          position: relative;
          z-index: 2;
          opacity: 0;
          animation: fadeIn 1s ease 0.8s forwards;
        }
        .lp-chart-card {
          background: var(--ink);
          padding: 28px 28px 20px;
          box-shadow: 0 40px 80px rgba(26,21,18,0.18), 0 8px 20px rgba(26,21,18,0.1);
          position: relative;
        }
        .lp-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .lp-chart-ticker {
          font-family: var(--mono);
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          color: #888;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .lp-chart-price {
          font-family: var(--serif);
          font-size: 2rem;
          font-weight: 700;
          color: #f5f0e8;
          line-height: 1;
        }
        .lp-chart-change {
          font-family: var(--mono);
          font-size: 0.72rem;
          color: #4ade80;
          margin-top: 4px;
          letter-spacing: 0.05em;
        }
        .lp-chart-period { display: flex; gap: 6px; }
        .lp-period-btn {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          color: #555;
          background: transparent;
          border: 1px solid #333;
          padding: 4px 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .lp-period-btn.active { color: var(--cream); border-color: var(--red); background: rgba(201,23,10,0.15); }
        .lp-chart-path {
          stroke-dasharray: 700;
          stroke-dashoffset: 700;
          animation: drawLine 2s ease 1.2s forwards;
        }
        .lp-chart-dot { animation: blink 1.2s ease infinite 3s; }
        .lp-chart-footer {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 1px;
          margin-top: 20px;
          background: #2a2420;
        }
        .lp-chart-stat {
          background: #1e1916;
          padding: 12px 14px;
        }
        .lp-chart-stat-label {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          color: #555;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .lp-chart-stat-val {
          font-family: var(--mono);
          font-size: 0.85rem;
          color: #d0c8be;
          font-weight: 500;
        }
        .lp-float-badge {
          position: absolute;
          bottom: -24px; left: -28px;
          background: #fff;
          border-left: 3px solid var(--red);
          padding: 14px 18px;
          box-shadow: 0 12px 30px rgba(26,21,18,0.12);
          opacity: 0;
          animation: fadeUp 0.6s ease 2s forwards;
        }
        .lp-float-badge-label {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: var(--ink-light);
          text-transform: uppercase;
        }
        .lp-float-badge-val {
          font-family: var(--serif);
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--ink);
          margin-top: 2px;
        }
        .lp-float-badge-sub {
          font-family: var(--mono);
          font-size: 0.62rem;
          color: #4ade80;
        }

        /* ── TICKER ── */
        .lp-ticker {
          background: var(--ink);
          padding: 14px 0;
          overflow: hidden;
          position: relative;
          z-index: 2;
        }
        .lp-ticker-inner {
          display: flex;
          animation: scrollTicker 30s linear infinite;
          white-space: nowrap;
        }
        .lp-ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 0 36px;
          font-family: var(--mono);
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          color: #888;
          border-right: 1px solid #2d2a27;
        }
        .lp-ticker-item .sym { color: var(--cream); font-weight: 500; }
        .lp-ticker-item .up { color: #4ade80; }
        .lp-ticker-item .dn { color: #f87171; }

        /* ── STATS BAND ── */
        .lp-stats-band {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--cream-darker);
          position: relative;
          z-index: 2;
        }
        .lp-stat-cell {
          background: var(--cream);
          padding: 40px 36px;
          position: relative;
          overflow: hidden;
          transition: background 0.2s;
        }
        .lp-stat-cell:hover { background: var(--cream-dark); }
        .lp-stat-cell::before {
          content: attr(data-n);
          position: absolute;
          top: 16px; right: 20px;
          font-family: var(--mono);
          font-size: 0.6rem;
          color: var(--cream-darker);
          letter-spacing: 0.1em;
        }
        .lp-stat-n {
          font-family: var(--serif);
          font-size: 3rem;
          font-weight: 900;
          color: var(--ink);
          line-height: 1;
          margin-bottom: 8px;
        }
        .lp-stat-n span { color: var(--red); }
        .lp-stat-label {
          font-family: var(--sans);
          font-size: 0.78rem;
          color: var(--ink-light);
          font-weight: 400;
          line-height: 1.5;
        }
        .lp-stat-bar {
          position: absolute;
          bottom: 0; left: 0;
          height: 2px;
          background: var(--red);
          width: 0;
          transition: width 1s ease;
        }
        .lp-stat-cell:hover .lp-stat-bar { width: 100%; }

        /* ── FEATURES ── */
        .lp-features { padding: 100px 60px; position: relative; }
        .lp-section-label {
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--red);
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .lp-section-label::before {
          content: '';
          display: inline-block;
          width: 24px; height: 1px;
          background: var(--red);
        }
        .lp-section-title {
          font-family: var(--serif);
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 900;
          color: var(--ink);
          line-height: 1.1;
          margin-bottom: 16px;
          max-width: 520px;
        }
        .lp-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--cream-darker);
          margin-top: 60px;
        }
        .lp-feature-card {
          background: var(--cream);
          padding: 44px 40px;
          position: relative;
          overflow: hidden;
          transition: background 0.2s;
        }
        .lp-feature-card:hover { background: var(--cream-dark); }
        .lp-feature-card:first-child { grid-row: span 2; }
        .lp-feature-icon {
          width: 44px; height: 44px;
          border: 1px solid var(--cream-darker);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 28px;
          color: var(--red);
          transition: border-color 0.2s, background 0.2s;
        }
        .lp-feature-card:hover .lp-feature-icon {
          border-color: var(--red);
          background: var(--red-glow);
        }
        .lp-feature-title {
          font-family: var(--serif);
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 14px;
          line-height: 1.2;
        }
        .lp-feature-card:first-child .lp-feature-title { font-size: 2rem; margin-bottom: 20px; }
        .lp-feature-desc {
          font-size: 0.88rem;
          line-height: 1.75;
          color: var(--ink-light);
          font-weight: 300;
        }
        .lp-feature-tag {
          display: inline-block;
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--red);
          border: 1px solid rgba(201,23,10,0.3);
          padding: 4px 10px;
          margin-top: 24px;
        }

        /* ── MARQUEE ── */
        .lp-marquee {
          padding: 60px 0;
          overflow: hidden;
          border-top: 1px solid var(--cream-darker);
          border-bottom: 1px solid var(--cream-darker);
        }
        .lp-marquee-inner {
          display: flex;
          animation: scrollMarquee 18s linear infinite;
          white-space: nowrap;
        }
        .lp-marquee-item {
          display: inline-flex;
          align-items: center;
          gap: 32px;
          padding: 0 48px;
          font-family: var(--serif);
          font-size: 2.6rem;
          font-weight: 900;
          color: var(--cream-dark);
          letter-spacing: -0.01em;
          user-select: none;
        }
        .lp-marquee-dot {
          width: 10px; height: 10px;
          background: var(--red);
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ── INSTRUMENTS ── */
        .lp-instruments {
          padding: 100px 60px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .lp-asset-rows {
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: var(--cream-darker);
        }
        .lp-asset-row {
          background: var(--cream);
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          align-items: center;
          padding: 16px 20px;
          gap: 16px;
          transition: background 0.15s;
          cursor: default;
        }
        .lp-asset-row:hover { background: #f0ebe0; }
        .lp-asset-row.header { background: var(--ink); pointer-events: none; }
        .lp-asset-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--red); }
        .lp-asset-sym {
          font-family: var(--mono);
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: 0.08em;
          min-width: 52px;
        }
        .lp-asset-name { font-size: 0.78rem; color: var(--ink-light); }
        .lp-asset-price { font-family: var(--mono); font-size: 0.82rem; color: var(--ink); text-align: right; }
        .lp-asset-chg { font-family: var(--mono); font-size: 0.72rem; text-align: right; min-width: 52px; }
        .lp-asset-row.header .lp-asset-sym,
        .lp-asset-row.header .lp-asset-name,
        .lp-asset-row.header .lp-asset-price,
        .lp-asset-row.header .lp-asset-chg { color: #555 !important; font-size: 0.62rem; }
        .lp-asset-row.header .lp-asset-dot { background: #555; }
        .up { color: #16a34a; }
        .dn { color: var(--red); }

        /* ── TESTIMONIALS ── */
        .lp-testimonials {
          background: var(--ink);
          padding: 100px 60px;
          position: relative;
          overflow: hidden;
        }
        .lp-testimonials::before {
          content: '"';
          position: absolute;
          top: -20px; left: 40px;
          font-family: var(--serif);
          font-size: 28rem;
          color: rgba(255,255,255,0.02);
          line-height: 1;
          pointer-events: none;
        }
        .lp-testimonial-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1px;
          background: #2d2a27;
        }
        .lp-tcard {
          background: #1e1916;
          padding: 40px 36px;
          position: relative;
        }
        .lp-tcard::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 40px; height: 2px;
          background: var(--red);
        }
        .lp-tcard-quote {
          font-family: var(--serif);
          font-size: 1.05rem;
          font-style: italic;
          color: #c8bfb5;
          line-height: 1.7;
          margin-bottom: 28px;
        }
        .lp-tcard-author { display: flex; align-items: center; gap: 12px; }
        .lp-tcard-avatar {
          width: 36px; height: 36px;
          background: var(--red);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--mono);
          font-size: 0.7rem;
          font-weight: 500;
          color: white;
          flex-shrink: 0;
        }
        .lp-tcard-name {
          font-family: var(--mono);
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          color: #d0c8be;
          text-transform: uppercase;
        }
        .lp-tcard-role { font-size: 0.72rem; color: #555; margin-top: 2px; }

        /* ── CTA ── */
        .lp-cta {
          padding: 120px 60px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 80px;
          position: relative;
        }
        .lp-cta::before {
          content: '';
          position: absolute;
          left: 60px; top: 60px; bottom: 60px; right: 60px;
          border: 1px solid var(--cream-darker);
          pointer-events: none;
        }
        .lp-cta-inner { padding: 40px; }
        .lp-cta-h2 {
          font-family: var(--serif);
          font-size: clamp(2rem, 3.5vw, 3.2rem);
          font-weight: 900;
          color: var(--ink);
          line-height: 1.1;
          margin-bottom: 20px;
        }
        .lp-cta-h2 em { font-style: italic; color: var(--red); }
        .lp-cta-p {
          font-size: 0.92rem;
          line-height: 1.75;
          color: var(--ink-light);
          font-weight: 300;
          margin-bottom: 36px;
          max-width: 420px;
        }
        .lp-cta-form { display: flex; }
        .lp-cta-input {
          flex: 1;
          background: transparent;
          border: 1px solid var(--cream-darker);
          border-right: none;
          padding: 14px 18px;
          font-family: var(--mono);
          font-size: 0.78rem;
          color: var(--ink);
          outline: none;
          transition: border-color 0.2s;
        }
        .lp-cta-input::placeholder { color: var(--ink-light); }
        .lp-cta-input:focus { border-color: var(--ink); }
        .lp-cta-submit {
          background: var(--red);
          color: white;
          border: none;
          padding: 14px 28px;
          font-family: var(--mono);
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
        }
        .lp-cta-submit:hover { background: var(--red-dark); }
        .lp-cta-right { padding: 40px; border-left: 1px solid var(--cream-darker); }
        .lp-trust-items { display: flex; flex-direction: column; gap: 20px; }
        .lp-trust-item { display: flex; gap: 16px; align-items: flex-start; }
        .lp-trust-num {
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--red);
          letter-spacing: 0.08em;
          margin-top: 2px;
          min-width: 24px;
        }
        .lp-trust-text { font-size: 0.88rem; line-height: 1.6; color: var(--ink-mid); font-weight: 300; }
        .lp-trust-text strong { font-weight: 600; color: var(--ink); }

        /* ── FOOTER ── */
        .lp-footer { background: var(--ink); padding: 60px 60px 40px; }
        .lp-footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 60px;
          padding-bottom: 48px;
          border-bottom: 1px solid #2a2420;
          margin-bottom: 32px;
        }
        .lp-footer-brand {
          font-family: var(--serif);
          font-size: 1.2rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: var(--cream);
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .lp-footer-brand span { color: var(--red); }
        .lp-footer-desc { font-size: 0.82rem; line-height: 1.7; color: #555; font-weight: 300; }
        .lp-footer-col-title {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 16px;
        }
        .lp-footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .lp-footer-links a { font-size: 0.8rem; color: #666; text-decoration: none; transition: color 0.2s; }
        .lp-footer-links a:hover { color: var(--cream); }
        .lp-footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          color: #444;
        }
        .lp-footer-legal { display: flex; gap: 24px; }
        .lp-footer-legal a { color: #444; text-decoration: none; transition: color 0.2s; }
        .lp-footer-legal a:hover { color: #888; }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        @keyframes blink {
          0%,100% { opacity: 1; } 50% { opacity: 0.2; }
        }
        @keyframes scrollTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scrollMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal.visible { opacity: 1; transform: none; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .lp-nav { padding: 20px 24px; }
          .lp-nav-links { display: none; }
          .lp-hero { grid-template-columns: 1fr; padding: 100px 24px 60px; }
          .lp-hero::after { display: none; }
          .lp-hero-right { display: none; }
          .lp-stats-band { grid-template-columns: 1fr 1fr; }
          .lp-features { padding: 60px 24px; }
          .lp-features-grid { grid-template-columns: 1fr; }
          .lp-feature-card:first-child { grid-row: span 1; }
          .lp-instruments { grid-template-columns: 1fr; padding: 60px 24px; gap: 40px; }
          .lp-testimonial-grid { grid-template-columns: 1fr; }
          .lp-cta { grid-template-columns: 1fr; padding: 60px 24px; }
          .lp-cta::before { inset: 20px; }
          .lp-cta-right { border-left: none; border-top: 1px solid var(--cream-darker); }
          .lp-footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
          .lp-footer { padding: 40px 24px 32px; }
          .lp-footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
        }
      `}</style>

      <div className="lp-root">

        {/* NAV */}
        <nav className="lp-nav">
          <Link href="/" className="lp-logo">Apex<span>•</span>Markets</Link>
          <ul className="lp-nav-links">
            <li><a href="#markets">Markets</a></li>
            <li><a href="#platform">Platform</a></li>
            <li><a href="#research">Research</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
          <Link href="/login" className="lp-nav-cta">Open Account</Link>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-left">
            <p className="lp-hero-tag">Professional-grade execution</p>
            <h1 className="lp-h1">Trade with<br /><em>Surgical</em><br />Precision.</h1>
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
          </div>

          <div className="lp-hero-right">
            <div className="lp-chart-card">
              <div className="lp-chart-header">
                <div>
                  <div className="lp-chart-ticker">BTC / USD</div>
                  <div className="lp-chart-price">67,420.50</div>
                  <div className="lp-chart-change">▲ +2.38% today</div>
                </div>
                <div className="lp-chart-period">
                  <button className="lp-period-btn">1H</button>
                  <button className="lp-period-btn active">1D</button>
                  <button className="lp-period-btn">1W</button>
                  <button className="lp-period-btn">1M</button>
                </div>
              </div>

              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <svg viewBox="0 0 520 160" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c9170a" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#c9170a" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="40" x2="520" y2="40" stroke="#2a2420" strokeWidth="0.5" />
                  <line x1="0" y1="80" x2="520" y2="80" stroke="#2a2420" strokeWidth="0.5" />
                  <line x1="0" y1="120" x2="520" y2="120" stroke="#2a2420" strokeWidth="0.5" />
                  <text x="5" y="38" fill="#444" fontFamily="DM Mono,monospace" fontSize="8">68.2k</text>
                  <text x="5" y="78" fill="#444" fontFamily="DM Mono,monospace" fontSize="8">67.4k</text>
                  <text x="5" y="118" fill="#444" fontFamily="DM Mono,monospace" fontSize="8">66.6k</text>
                  <path className="lp-chart-path"
                    d="M30,120 C60,115 80,95 110,88 C140,82 160,90 190,75 C220,62 240,70 270,58 C300,46 320,55 350,48 C380,40 400,52 430,42 C460,32 480,45 500,38 L500,155 L30,155 Z"
                    fill="url(#areaGrad)" stroke="none" />
                  <path className="lp-chart-path"
                    d="M30,120 C60,115 80,95 110,88 C140,82 160,90 190,75 C220,62 240,70 270,58 C300,46 320,55 350,48 C380,40 400,52 430,42 C460,32 480,45 500,38"
                    fill="none" stroke="#c9170a" strokeWidth="1.5" />
                  <circle className="lp-chart-dot" cx="500" cy="38" r="4" fill="#c9170a" />
                  <circle cx="500" cy="38" r="8" fill="rgba(201,23,10,0.2)" />
                  <line x1="500" y1="12" x2="500" y2="150" stroke="#333" strokeWidth="0.5" strokeDasharray="3,3" />
                </svg>
              </div>

              <div className="lp-chart-footer">
                <div className="lp-chart-stat">
                  <div className="lp-chart-stat-label">Volume 24h</div>
                  <div className="lp-chart-stat-val">$38.2B</div>
                </div>
                <div className="lp-chart-stat">
                  <div className="lp-chart-stat-label">Open</div>
                  <div className="lp-chart-stat-val">65,820</div>
                </div>
                <div className="lp-chart-stat">
                  <div className="lp-chart-stat-label">High / Low</div>
                  <div className="lp-chart-stat-val">68.1 / 65.4</div>
                </div>
              </div>
            </div>

            <div className="lp-float-badge">
              <div className="lp-float-badge-label">Order filled</div>
              <div className="lp-float-badge-val">BTC — Long</div>
              <div className="lp-float-badge-sub">▲ +$1,240 unrealized</div>
            </div>
          </div>
        </section>

        {/* TICKER */}
        <div className="lp-ticker">
          <div className="lp-ticker-inner">
            {[...Array(2)].map((_, d) =>
              [
                { sym: 'AAPL', price: '189.42', chg: '+1.24%', up: true },
                { sym: 'BTC/USD', price: '67,420', chg: '+2.38%', up: true },
                { sym: 'TSLA', price: '248.10', chg: '−0.87%', up: false },
                { sym: 'EUR/USD', price: '1.0842', chg: '+0.12%', up: true },
                { sym: 'ETH/USD', price: '3,512', chg: '+3.01%', up: true },
                { sym: 'NVDA', price: '875.40', chg: '+4.62%', up: true },
                { sym: 'GOLD', price: '2,318.50', chg: '−0.23%', up: false },
                { sym: 'S&P 500', price: '5,241.33', chg: '+0.56%', up: true },
                { sym: 'WTI OIL', price: '79.14', chg: '−1.10%', up: false },
              ].map((item) => (
                <span key={`${d}-${item.sym}`} className="lp-ticker-item">
                  <span className="sym">{item.sym}</span>
                  {item.price}
                  <span className={item.up ? 'up' : 'dn'}>{item.chg}</span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="lp-stats-band">
          {[
            { n: '01', val: '$4.8B', label: 'Daily trading volume processed ' },
            { n: '02', val: '0.2ms', label: 'Average order execution latency' },
            { n: '03', val: '180+', label: 'Global markets and instruments available' },
            { n: '04', val: '99.9%', label: 'Platform uptime guaranteed by SLA' },
          ].map(({ n, val, label }) => (
            <div key={n} className="lp-stat-cell" data-n={n}>
              <div className="lp-stat-n"><span>{val}</span></div>
              <div className="lp-stat-label">{label}</div>
              <div className="lp-stat-bar" />
            </div>
          ))}
        </div>

        {/* FEATURES */}
        <section className="lp-features" id="platform">
          <div className="reveal">
            <p className="lp-section-label">Built for performance</p>
            <h2 className="lp-section-title">Every edge, engineered.</h2>
          </div>
          <div className="lp-features-grid reveal">
            <div className="lp-feature-card">
              <div className="lp-feature-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2 10h3l3-6 4 12 3-8 2 2h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>
              </div>
              <div className="lp-feature-title">Advanced Order Routing & Smart Execution</div>
              <div className="lp-feature-desc">Our proprietary smart-order router splits and routes your orders across multiple liquidity pools in real time — minimizing slippage and maximizing fill rates on every trade, regardless of market conditions or instrument type.</div>
              <div className="lp-feature-tag">Learn more →</div>
            </div>
            {[
              {
                icon: <path d="M2 2h7v7H2zM11 2h7v7h-7zM2 11h7v7H2zM11 11h7v7h-7z" stroke="currentColor" strokeWidth="1.2" />,
                title: 'Multi-Asset Dashboard',
                desc: 'Monitor your entire portfolio — equities, crypto, FX, and commodities — from a single unified workspace.',
              },
              {
                icon: <><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.2" /><path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" /></>,
                title: 'Real-time Risk Engine',
                desc: 'Automatic position monitoring, margin alerts, and drawdown controls — so you stay in the game longer.',
              },
              {
                icon: <path d="M10 2L2 18h16L10 2zM10 9v4M10 15v.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="miter" strokeLinecap="square" />,
                title: 'Institutional-grade API',
                desc: 'Full REST and WebSocket API access for algorithmic traders. Low-latency data feeds with co-location options.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="lp-feature-card">
                <div className="lp-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">{icon}</svg>
                </div>
                <div className="lp-feature-title">{title}</div>
                <div className="lp-feature-desc">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* MARQUEE */}
        <div className="lp-marquee">
          <div className="lp-marquee-inner">
            {[...Array(2)].map((_, d) =>
              ['Equities', 'Derivatives', 'Cryptocurrency', 'Foreign Exchange', 'Commodities', 'Indices'].map((item) => (
                <span key={`${d}-${item}`} className="lp-marquee-item">
                  {item} <span className="lp-marquee-dot" />
                </span>
              ))
            )}
          </div>
        </div>

        {/* INSTRUMENTS */}
        <section className="lp-instruments" id="markets">
          <div className="reveal">
            <p className="lp-section-label">Live markets</p>
            <h2 className="lp-section-title">Everything moves. Capture it.</h2>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--ink-light)', fontWeight: 300, marginTop: 16, marginBottom: 36, maxWidth: 400 }}>
              Trade across 180+ instruments spanning crypto, equities, FX, and commodities.
            </p>
            <Link href="/signup" className="lp-btn-primary" style={{ display: 'inline-flex' }}>
              Browse All Markets
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
              </svg>
            </Link>
          </div>

          <div className="lp-asset-rows reveal">
            <div className="lp-asset-row header">
              <div className="lp-asset-dot" />
              <div className="lp-asset-sym">SYMBOL</div>
              <div className="lp-asset-price">PRICE</div>
              <div className="lp-asset-chg">CHG%</div>
            </div>
            {[
              { dot: '#c9170a', sym: 'BTC', name: 'Bitcoin', price: '67,420', chg: '+2.38%', up: true },
              { dot: '#6366f1', sym: 'ETH', name: 'Ethereum', price: '3,512', chg: '+3.01%', up: true },
              { dot: '#10b981', sym: 'NVDA', name: 'NVIDIA Corp', price: '875.40', chg: '+4.62%', up: true },
              { dot: '#f59e0b', sym: 'GOLD', name: 'Gold Spot', price: '2,318.50', chg: '−0.23%', up: false },
              { dot: '#3b82f6', sym: 'EUR/USD', name: 'Euro / Dollar', price: '1.0842', chg: '+0.12%', up: true },
              { dot: '#ec4899', sym: 'TSLA', name: 'Tesla Inc', price: '248.10', chg: '−0.87%', up: false },
            ].map(({ dot, sym, name, price, chg, up }) => (
              <div key={sym} className="lp-asset-row">
                <div className="lp-asset-dot" style={{ background: dot }} />
                <div className="lp-asset-sym">{sym}</div>
                <div className="lp-asset-price">{price}</div>
                <div className={`lp-asset-chg ${up ? 'up' : 'dn'}`}>{chg}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="lp-testimonials">
          <div style={{ marginBottom: 52 }} className="reveal">
            <p className="lp-section-label" style={{ color: '#c9170a' }}>What traders say</p>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem,3.5vw,2.8rem)', fontWeight: 900, color: 'var(--cream)', lineHeight: 1.1 }}>
              Built on trust.<br />Proven in markets.
            </h2>
          </div>
          <div className="lp-testimonial-grid reveal">
            {[
              { initials: 'MK', name: 'Marcus K.', role: 'Prop trader, London', quote: 'The execution speed alone puts Apex Miles ahead of anything else I\'ve used. My scalp strategies work the way they\'re supposed to.' },
              { initials: 'SN', name: 'Sofia N.', role: 'Portfolio manager, Dubai', quote: 'Having crypto, equities, and FX all in one dashboard with a clean interface is rare. Apex makes it feel obvious in hindsight.' },
              { initials: 'RO', name: 'Ryo O.', role: 'Quantitative developer, Tokyo', quote: 'The API documentation is impeccable. Integrated our quant system in two days. Fill rates are noticeably better than our previous broker.' },
            ].map(({ initials, name, role, quote }) => (
              <div key={name} className="lp-tcard">
                <p className="lp-tcard-quote">{quote}</p>
                <div className="lp-tcard-author">
                  <div className="lp-tcard-avatar">{initials}</div>
                  <div>
                    <div className="lp-tcard-name">{name}</div>
                    <div className="lp-tcard-role">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta">
          <div className="lp-cta-inner reveal">
            <p className="lp-section-label">Start today</p>
            <h2 className="lp-cta-h2">Your edge<br />starts <em>here.</em></h2>
            <p className="lp-cta-p">Open a funded account in under 5 minutes. No minimums on demo. Live markets from day one.</p>
            <div className="lp-cta-form">
              <input className="lp-cta-input" type="email" placeholder="Enter your email address" />
              <button className="lp-cta-submit">Get Started</button>
            </div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--ink-light)', marginTop: 14, letterSpacing: '0.06em' }}>
              Free demo · No credit card · Regulated platform
            </p>
          </div>
          <div className="lp-cta-right reveal">
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-light)', marginBottom: 28 }}>Why Apex Markets</p>
            <div className="lp-trust-items">
              {[
                { n: '01', strong: 'FCA & CySEC regulated.', text: ' Your funds are held in segregated client accounts with Tier-1 banking partners.' },
                { n: '02', strong: 'Negative balance protection.', text: ' You can never lose more than your deposited capital.' },
                { n: '03', strong: '24/5 professional support.', text: ' Reach a real trading desk specialist in under 2 minutes.' },
                { n: '04', strong: 'Transparent pricing.', text: ' No hidden fees. Spreads from 0.0 pips. Commission from $2.50/lot.' },
              ].map(({ n, strong, text }) => (
                <div key={n} className="lp-trust-item">
                  <span className="lp-trust-num">{n}</span>
                  <span className="lp-trust-text"><strong>{strong}</strong>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-brand">Apex<span>•</span>Markets</div>
              <p className="lp-footer-desc">Professional trading infrastructure for serious market participants. Access global markets with institutional-grade technology.</p>
            </div>
            {[
              { title: 'Platform', links: ['Web Terminal', 'Mobile App', 'API Access', 'TradingView'] },
              { title: 'Markets', links: ['Crypto CFDs', 'Equities', 'Forex', 'Commodities'] },
              { title: 'Company', links: ['About', 'Careers', 'Press', 'Contact'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="lp-footer-col-title">{title}</p>
                <ul className="lp-footer-links">
                  {links.map((l) => <li key={l}><a href="#">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="lp-footer-bottom">
            <span>© 2026 Apex Markets Ltd. All rights reserved.</span>
            <div className="lp-footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Risk Disclosure</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
