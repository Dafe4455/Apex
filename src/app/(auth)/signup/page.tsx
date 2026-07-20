"use client";

import { useState } from "react";
import Link from "next/link";
import { signupAction } from "@/lib/actions";
import Logo from "@/components/Logo";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirm: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const result = await signupAction({
      name: form.name,
      email: form.email,
      phone: form.phone,
      country: form.country,
      password: form.password,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .auth-shell {
          min-height: 100vh;
          background: var(--bg);
          font-family: var(--sans);
          display: flex;
        }

        /* ── LEFT PANEL (DESKTOP) ── */
        .auth-left {
          width: 460px;
          flex-shrink: 0;
          background: var(--bg-3);
          border-right: 1px solid var(--line-strong);
          padding: 64px 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .auth-left::before {
          content: '';
          position: absolute;
          bottom: -80px; right: -80px;
          width: 320px; height: 320px;
          border: 1px solid var(--line-strong);
          border-radius: 50%;
          opacity: 0.5;
        }
        .auth-left::after {
          content: '';
          position: absolute;
          bottom: -40px; right: -40px;
          width: 220px; height: 220px;
          border: 1px solid var(--line);
          border-radius: 50%;
          opacity: 0.5;
        }

        .auth-brand {
          display: flex;
          align-items: center;
          text-decoration: none;
          flex-shrink: 0;
          z-index: 2;
        }

        .auth-panel-body { position: relative; z-index: 1; margin: auto 0; }

        .auth-panel-tag {
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--accent);
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .auth-panel-tag::before {
          content: '';
          display: inline-block;
          width: 24px; height: 1px;
          background: var(--accent);
        }

        .auth-panel-headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2.6rem;
          font-weight: 900;
          color: var(--ink);
          line-height: 1.15;
          margin-bottom: 24px;
        }
        .auth-panel-headline em {
          font-style: italic;
          color: var(--accent);
        }

        .auth-panel-desc {
          font-size: 0.9rem;
          line-height: 1.8;
          color: var(--ink-dim);
          font-weight: 300;
          margin-bottom: 44px;
        }

        .perks { display: flex; flex-direction: column; gap: 18px; }
        .perk { display: flex; align-items: flex-start; gap: 14px; }
        .perk-icon {
          width: 24px; height: 24px;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
          border-radius: 6px;
        }
        .perk-text {
          font-size: 0.85rem;
          color: var(--ink-dim);
          line-height: 1.5;
          font-weight: 300;
        }
        .perk-text strong {
          color: var(--ink);
          font-weight: 500;
          display: block;
          font-family: var(--mono);
          font-size: 0.72rem;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
          text-transform: uppercase;
        }

        .auth-panel-footer {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          color: var(--ink-faint);
          line-height: 1.7;
          z-index: 2;
        }

        /* ── RIGHT PANEL (FORM CONTAINER) ── */
        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 64px 48px;
          position: relative;
        }
        .auth-right::before {
          content: '';
          position: absolute;
          top: 32px; right: 32px; bottom: 32px; left: 32px;
          border: 1px solid var(--line-strong);
          pointer-events: none;
          opacity: 0.7;
          border-radius: 24px;
        }

        .auth-form-wrap { width: 100%; max-width: 420px; position: relative; z-index: 2; }

        .mobile-logo-wrap {
          display: none;
          margin-bottom: 40px;
          justify-content: center;
        }

        .auth-form-tag {
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .auth-form-tag::before {
          content: '';
          display: inline-block;
          width: 16px; height: 1px;
          background: var(--accent);
        }

        .auth-form-sub {
          font-size: 0.88rem;
          color: var(--ink-dim);
          font-weight: 300;
          margin-bottom: 32px;
        }
        .auth-form-sub a { color: var(--accent); text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .auth-form-sub a:hover { color: var(--ink); text-decoration: underline; }

        .field { margin-bottom: 20px; }

        .field label {
          display: block;
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--ink-dim);
          margin-bottom: 8px;
        }
        .field input,
        .field select {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          padding: 14px 16px;
          font-family: var(--mono);
          font-size: 0.88rem;
          color: var(--ink);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          appearance: none;
          border-radius: 14px;
        }
        .field input::placeholder { color: var(--ink-faint); opacity: 0.8; }
        .field input:focus,
        .field select:focus {
          background: var(--bg);
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(0, 214, 138, 0.12);
        }
        .field input.error-input { border-color: var(--red); }
        .field input.error-input:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12); }

        .field-row {
          display: flex;
          gap: 16px;
        }
        .field-row .field { flex: 1; }

        .select-wrap {
          position: relative;
        }
        .select-wrap::after {
          content: '▼';
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.6rem;
          color: var(--ink-dim);
          pointer-events: none;
        }
        .field select {
          padding-right: 40px;
          cursor: pointer;
        }
        .field select option {
          background: var(--surface);
          color: var(--ink);
        }

        .password-strength { display: flex; gap: 6px; margin-top: 10px; }
        .strength-bar {
          flex: 1; height: 3px;
          background: var(--line-strong);
          transition: background 0.3s;
          border-radius: 2px;
        }
        .strength-bar.active { background: var(--red); }
        .strength-bar.medium { background: var(--gold); }
        .strength-bar.strong { background: var(--green); }

        .error-msg {
          background: var(--red-l);
          border-left: 3px solid var(--red);
          padding: 12px 16px;
          font-family: var(--mono);
          font-size: 0.75rem;
          color: var(--red);
          letter-spacing: 0.02em;
          margin-bottom: 24px;
          border-radius: 0 12px 12px 0;
        }

        .submit-btn {
          width: 100%;
          background: var(--accent);
          color: var(--bg);
          border: 1px solid var(--accent);
          padding: 16px;
          font-family: var(--mono);
          font-size: 0.8rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s, color 0.2s, transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 28px;
          border-radius: 14px;
        }
        .submit-btn:hover:not(:disabled) { 
          background: transparent;
          color: var(--accent);
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .spinner {
          width: 14px; height: 14px;
          border: 1.5px solid rgba(0,0,0,0.15);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .terms-note {
          margin-top: 24px;
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.05em;
          color: var(--ink-faint);
          text-align: center;
          line-height: 1.6;
        }
        .terms-note a { color: var(--ink-dim); text-decoration: underline; transition: color 0.2s; }
        .terms-note a:hover { color: var(--accent); }

        /* ── RESPONSIVE OVERRIDES ── */
        @media (max-width: 960px) {
          .auth-left { width: 380px; padding: 48px 36px; }
          .auth-panel-headline { font-size: 2.2rem; }
        }

        @media (max-width: 768px) {
          .auth-left { display: none; }
          .auth-right { padding: 40px 24px; }
          .auth-right::before { display: none; }
          .auth-form-wrap { max-width: 100%; }
          .mobile-logo-wrap { display: flex; }
          .field-row { flex-direction: column; gap: 0; }
        }
      `}</style>

      <div className="auth-shell">
        {/* Left Side Branding Panel */}
        <div className="auth-left">
          <Link href="/" className="auth-brand">
            <Logo width={150} height={26} />
          </Link>

          <div className="auth-panel-body">
            <p className="auth-panel-tag">Get started</p>
            <h2 className="auth-panel-headline">
              Join <em>180,000+</em><br />active traders.
            </h2>
            <p className="auth-panel-desc">
              Everything you need to trade professionally — from day one.
            </p>

            <div className="perks">
              {[
                { title: "Free demo account", desc: "$100,000 virtual funds. No risk, real markets." },
                { title: "180+ instruments", desc: "Crypto, equities, FX, commodities." },
                { title: "0.2ms execution", desc: "Institutional-grade order routing." },
                { title: "FCA regulated", desc: "Segregated client funds. Always protected." },
              ].map((p) => (
                <div className="perk" key={p.title}>
                  <div className="perk-icon">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" style={{ color: "var(--accent)" }} />
                    </svg>
                  </div>
                  <div className="perk-text">
                    <strong>{p.title}</strong>
                    {p.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="auth-panel-footer">
            © 2026 Apex Markets Ltd.<br />
            FCA Regulated · Funds Segregated · 99.9% Uptime
          </p>
        </div>

        {/* Right Side Form Panel */}
        <div className="auth-right">
          <div className="auth-form-wrap">
            {/* Adaptive Mobile Branding Entry */}
            <div className="mobile-logo-wrap">
              <Link href="/">
                <Logo width={185} height={34} />
              </Link>
            </div>

            <p className="auth-form-tag">Create account</p>
            <p className="auth-form-sub">
              Already have an account?{" "}
              <Link href="/login">Sign in</Link>
            </p>

            <form onSubmit={handleSubmit}>
              {error && <div className="error-msg">{error}</div>}

              <div className="field">
                <label>Full name</label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="field">
                <label>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Country</label>
                  <div className="select-wrap">
                    <select
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      required
                    >
                      <option value="" disabled>Select country</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="JP">Japan</option>
                      <option value="SG">Singapore</option>
                      <option value="HK">Hong Kong</option>
                      <option value="CH">Switzerland</option>
                      <option value="NL">Netherlands</option>
                      <option value="SE">Sweden</option>
                      <option value="NO">Norway</option>
                      <option value="DK">Denmark</option>
                      <option value="FI">Finland</option>
                      <option value="IE">Ireland</option>
                      <option value="AE">UAE</option>
                      <option value="IN">India</option>
                      <option value="BR">Brazil</option>
                      <option value="MX">Mexico</option>
                      <option value="ZA">South Africa</option>
                      <option value="NZ">New Zealand</option>
                      <option value="AT">Austria</option>
                      <option value="BE">Belgium</option>
                      <option value="IT">Italy</option>
                      <option value="ES">Spain</option>
                      <option value="PT">Portugal</option>
                      <option value="PL">Poland</option>
                      <option value="CZ">Czech Republic</option>
                      <option value="KR">South Korea</option>
                      <option value="TW">Taiwan</option>
                      <option value="MY">Malaysia</option>
                      <option value="TH">Thailand</option>
                      <option value="ID">Indonesia</option>
                      <option value="PH">Philippines</option>
                      <option value="VN">Vietnam</option>
                      <option value="TR">Turkey</option>
                      <option value="SA">Saudi Arabia</option>
                      <option value="IL">Israel</option>
                      <option value="GR">Greece</option>
                      <option value="HU">Hungary</option>
                      <option value="RO">Romania</option>
                      <option value="BG">Bulgaria</option>
                      <option value="HR">Croatia</option>
                      <option value="SI">Slovenia</option>
                      <option value="SK">Slovakia</option>
                      <option value="LT">Lithuania</option>
                      <option value="LV">Latvia</option>
                      <option value="EE">Estonia</option>
                      <option value="LU">Luxembourg</option>
                      <option value="MT">Malta</option>
                      <option value="CY">Cyprus</option>
                      <option value="IS">Iceland</option>
                      <option value="LI">Liechtenstein</option>
                      <option value="MC">Monaco</option>
                      <option value="SM">San Marino</option>
                      <option value="AD">Andorra</option>
                      <option value="VA">Vatican City</option>
                      <option value="BY">Belarus</option>
                      <option value="UA">Ukraine</option>
                      <option value="MD">Moldova</option>
                      <option value="RU">Russia</option>
                      <option value="KZ">Kazakhstan</option>
                      <option value="UZ">Uzbekistan</option>
                      <option value="KG">Kyrgyzstan</option>
                      <option value="TJ">Tajikistan</option>
                      <option value="TM">Turkmenistan</option>
                      <option value="AZ">Azerbaijan</option>
                      <option value="AM">Armenia</option>
                      <option value="GE">Georgia</option>
                      <option value="MN">Mongolia</option>
                      <option value="CN">China</option>
                      <option value="PK">Pakistan</option>
                      <option value="BD">Bangladesh</option>
                      <option value="LK">Sri Lanka</option>
                      <option value="NP">Nepal</option>
                      <option value="BT">Bhutan</option>
                      <option value="MV">Maldives</option>
                      <option value="AF">Afghanistan</option>
                      <option value="IR">Iran</option>
                      <option value="IQ">Iraq</option>
                      <option value="SY">Syria</option>
                      <option value="JO">Jordan</option>
                      <option value="LB">Lebanon</option>
                      <option value="KW">Kuwait</option>
                      <option value="QA">Qatar</option>
                      <option value="BH">Bahrain</option>
                      <option value="OM">Oman</option>
                      <option value="YE">Yemen</option>
                      <option value="EG">Egypt</option>
                      <option value="LY">Libya</option>
                      <option value="TN">Tunisia</option>
                      <option value="DZ">Algeria</option>
                      <option value="MA">Morocco</option>
                      <option value="MR">Mauritania</option>
                      <option value="ML">Mali</option>
                      <option value="NE">Niger</option>
                      <option value="TD">Chad</option>
                      <option value="SD">Sudan</option>
                      <option value="ER">Eritrea</option>
                      <option value="DJ">Djibouti</option>
                      <option value="ET">Ethiopia</option>
                      <option value="SO">Somalia</option>
                      <option value="KE">Kenya</option>
                      <option value="UG">Uganda</option>
                      <option value="TZ">Tanzania</option>
                      <option value="RW">Rwanda</option>
                      <option value="BI">Burundi</option>
                      <option value="CD">DR Congo</option>
                      <option value="CG">Congo</option>
                      <option value="GA">Gabon</option>
                      <option value="GQ">Equatorial Guinea</option>
                      <option value="CM">Cameroon</option>
                      <option value="CF">Central African Republic</option>
                      <option value="ST">São Tomé and Príncipe</option>
                      <option value="CV">Cape Verde</option>
                      <option value="GW">Guinea-Bissau</option>
                      <option value="GN">Guinea</option>
                      <option value="SL">Sierra Leone</option>
                      <option value="LR">Liberia</option>
                      <option value="CI">Ivory Coast</option>
                      <option value="GH">Ghana</option>
                      <option value="TG">Togo</option>
                      <option value="BJ">Benin</option>
                      <option value="NG">Nigeria</option>
                      <option value="GM">Gambia</option>
                      <option value="SN">Senegal</option>
                      <option value="BF">Burkina Faso</option>
                      <option value="MW">Malawi</option>
                      <option value="ZM">Zambia</option>
                      <option value="ZW">Zimbabwe</option>
                      <option value="BW">Botswana</option>
                      <option value="NA">Namibia</option>
                      <option value="AO">Angola</option>
                      <option value="MZ">Mozambique</option>
                      <option value="MG">Madagascar</option>
                      <option value="MU">Mauritius</option>
                      <option value="SC">Seychelles</option>
                      <option value="KM">Comoros</option>
                      <option value="SZ">Eswatini</option>
                      <option value="LS">Lesotho</option>
                      <option value="AR">Argentina</option>
                      <option value="CL">Chile</option>
                      <option value="UY">Uruguay</option>
                      <option value="PY">Paraguay</option>
                      <option value="BO">Bolivia</option>
                      <option value="PE">Peru</option>
                      <option value="EC">Ecuador</option>
                      <option value="CO">Colombia</option>
                      <option value="VE">Venezuela</option>
                      <option value="GY">Guyana</option>
                      <option value="SR">Suriname</option>
                      <option value="GF">French Guiana</option>
                      <option value="PA">Panama</option>
                      <option value="CR">Costa Rica</option>
                      <option value="NI">Nicaragua</option>
                      <option value="HN">Honduras</option>
                      <option value="SV">El Salvador</option>
                      <option value="GT">Guatemala</option>
                      <option value="BZ">Belize</option>
                      <option value="JM">Jamaica</option>
                      <option value="HT">Haiti</option>
                      <option value="DO">Dominican Republic</option>
                      <option value="CU">Cuba</option>
                      <option value="BS">Bahamas</option>
                      <option value="TT">Trinidad and Tobago</option>
                      <option value="BB">Barbados</option>
                      <option value="GD">Grenada</option>
                      <option value="LC">Saint Lucia</option>
                      <option value="VC">Saint Vincent</option>
                      <option value="AG">Antigua and Barbuda</option>
                      <option value="DM">Dominica</option>
                      <option value="KN">Saint Kitts and Nevis</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>Phone number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
                <div className="password-strength">
                  {[1, 2, 3, 4].map((i) => {
                    const len = form.password.length;
                    const cls =
                      len === 0 ? "" :
                      len < 6 ? (i === 1 ? "active" : "") :
                      len < 10 ? (i <= 2 ? "medium" : "") :
                      len < 14 ? (i <= 3 ? "strong" : "") :
                      "strong";
                    return <div key={i} className={`strength-bar ${cls}`} />;
                  })}
                </div>
              </div>

              <div className="field">
                <label>Confirm password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  required
                  autoComplete="new-password"
                  className={form.confirm && form.confirm !== form.password ? "error-input" : ""}
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <><span className="spinner" />Creating account...</>
                ) : (
                  <>
                    Create Account
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="terms-note">
              By creating an account you agree to our{" "}
              <a href="#">Terms of Service</a> and{" "}
              <a href="#">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
