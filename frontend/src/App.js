import { useState } from "react";

const API = "https://reportcheck-api.onrender.com";

const c = {
  bg: "#f5f5f5", white: "#ffffff", border: "#e5e5e5",
  text: "#1a1a1a", sub: "#666666", subtle: "#999999",
  pass: "#16a34a", passBg: "#f0fdf4",
  fail: "#dc2626", failBg: "#fef2f2",
  warn: "#d97706", warnBg: "#fffbeb",
  primary: "#1a1a1a", primaryText: "#ffffff",
  infoBg: "#eff6ff", info: "#2563eb",
};

const DEFAULT_RULES = [
  "Font must be consistent throughout the report",
  "No placeholder text like TBD, lorem ipsum, or brackets",
  "Every chart must have a title and axis labels",
  "Company logo must be visible somewhere in the report",
  "A date or time period must appear somewhere in the report"
];

function Card({ children, style }) {
  return (
    <div style={{
      background: c.white, border: `1px solid ${c.border}`,
      borderRadius: 12, padding: 20, ...style
    }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, disabled, secondary, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
      cursor: disabled ? "not-allowed" : "pointer",
      border: `1px solid ${c.border}`,
      background: secondary ? c.white : c.primary,
      color: secondary ? c.text : c.primaryText,
      opacity: disabled ? 0.5 : 1, ...style
    }}>
      {children}
    </button>
  );
}

function Input({ label, placeholder, value, onChange, type = "text" }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <p style={{ fontSize: 12, color: c.sub, margin: "0 0 5px", fontWeight: 500 }}>{label}</p>}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{
          width: "100%", boxSizing: "border-box", padding: "9px 12px",
          borderRadius: 8, border: `1px solid ${c.border}`, fontSize: 13, color: c.text, outline: "none"
        }} />
    </div>
  );
}

function Badge({ status }) {
  const map = {
    PASS: { bg: c.passBg, color: c.pass, label: "Pass" },
    FAIL: { bg: c.failBg, color: c.fail, label: "Fail" },
    WARN: { bg: c.warnBg, color: c.warn, label: "Warn" },
  };
  const s = map[status] || map.WARN;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 9px",
      borderRadius: 999, background: s.bg, color: s.color, whiteSpace: "nowrap"
    }}>
      {s.label}
    </span>
  );
}

function Toggle({ on, onClick }) {
  return (
    <div onClick={onClick} style={{
      width: 38, height: 21, borderRadius: 999, cursor: "pointer",
      background: on ? c.pass : c.border,
      position: "relative", flexShrink: 0, transition: "background 0.2s"
    }}>
      <div style={{
        position: "absolute", top: 2.5,
        left: on ? 19 : 2.5,
        width: 16, height: 16, borderRadius: "50%",
        background: "white", transition: "left 0.2s"
      }} />
    </div>
  );
}

function StepNumber({ num, done, active }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 600,
      background: done ? c.passBg : active ? c.primary : "#f0f0f0",
      color: done ? c.pass : active ? c.white : c.subtle,
      marginTop: 1
    }}>
      {done ? "✓" : num}
    </div>
  );
}

function TopBar({ user, onLogout }) {
  return (
    <div style={{
      background: c.white, borderBottom: `1px solid ${c.border}`,
      padding: "12px 24px", display: "flex",
      alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 10
    }}>
      <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>✦ ReportCheck</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <p style={{ fontSize: 13, color: c.sub, margin: 0 }}>{user?.name}</p>
        <Btn secondary onClick={onLogout} style={{ padding: "5px 12px", fontSize: 12 }}>
          Sign out
        </Btn>
      </div>
    </div>
  );
}

// ─── Rules Setup Flow ─────────────────────────────────────
function RulesSetupScreen({ user, setUser, workspace, onComplete }) {
  const [step, setStep] = useState("landing");
  const [customRules, setCustomRules] = useState([]);
  const [newRule, setNewRule] = useState("");
  const [uploading, setUploading] = useState(false);
  const [extractError, setExtractError] = useState("");

  function addRule() {
    if (!newRule.trim()) return;
    setCustomRules(prev => [...prev, newRule.trim()]);
    setNewRule("");
  }

  function deleteRule(i) {
    setCustomRules(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setExtractError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/extract-rules`, { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.rules && data.rules.length > 0) {
        setCustomRules(data.rules);
        setStep("upload");
      } else {
        setExtractError("No rules found in document. Try a different file or add rules manually.");
      }
    } catch {
      setExtractError("Could not extract rules. Try again or add rules manually.");
    } finally { setUploading(false); }
  }

  function saveAndContinue() {
    const updatedWs = { ...workspace, rules: { ...workspace.rules, custom_rules: customRules } };
    const updatedWorkspaces = (user.workspaces || []).map(w => w.id === workspace.id ? updatedWs : w);
    const updatedUser = { ...user, workspaces: updatedWorkspaces };
    const users = JSON.parse(localStorage.getItem("rc_users") || "[]");
    const idx = users.findIndex(u => u.id === updatedUser.id);
    if (idx > -1) { users[idx] = updatedUser; localStorage.setItem("rc_users", JSON.stringify(users)); }
    onComplete(updatedUser);
  }

  function StepBar({ current }) {
    const currentNum = current === "review" ? 4 : 3;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        {[1, 2, 3, 4].map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, flex: i < 3 ? 1 : "none" }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600,
              background: s < currentNum ? c.passBg : s === currentNum ? c.primary : "#f0f0f0",
              color: s < currentNum ? c.pass : s === currentNum ? c.white : c.subtle,
            }}>
              {s < currentNum ? "✓" : s}
            </div>
            {i < 3 && <div style={{ flex: 1, height: 1, background: s < currentNum ? c.pass : c.border }} />}
          </div>
        ))}
      </div>
    );
  }

  const pageStyle = {
    minHeight: "100vh", background: c.bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  };
  const innerStyle = { width: "100%", maxWidth: 520, padding: "0 20px" };

  if (step === "landing") return (
    <div style={pageStyle}>
      <div style={innerStyle}>
        <Card>
          <StepBar current="landing" />
          <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Set up your quality rules</p>
          <p style={{ fontSize: 13, color: c.sub, margin: "0 0 16px" }}>
            How would you like to define rules for <strong>{workspace.name}</strong>?
          </p>

          <div style={{ background: "#f8f8f8", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: c.sub, margin: "0 0 8px" }}>
              ✓ Default rules — always applied to every report
            </p>
            {workspace.rules.default_rules.map((rule, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 0",
                borderBottom: i < workspace.rules.default_rules.length - 1 ? `1px solid ${c.border}` : "none"
              }}>
                <span style={{ fontSize: 11, color: c.pass }}>✓</span>
                <span style={{ fontSize: 12, color: c.sub }}>{rule}</span>
              </div>
            ))}
            <p style={{ fontSize: 11, color: c.subtle, margin: "8px 0 0" }}>
              Your custom rules will be added on top of these.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div onClick={() => setStep("manual")} style={{
              border: `1px solid ${c.border}`, borderRadius: 10,
              padding: "20px 16px", cursor: "pointer", textAlign: "center"
            }}>
              <p style={{ fontSize: 28, margin: "0 0 8px" }}>✏️</p>
              <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>Type manually</p>
              <p style={{ fontSize: 12, color: c.sub, margin: "0 0 10px" }}>Add rules one by one in plain English</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                {["Quick start", "Plain English"].map(t => (
                  <span key={t} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "#f0f0f0", color: c.sub }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{
              border: `2px solid ${c.primary}`, borderRadius: 10,
              padding: "20px 16px", cursor: "pointer", textAlign: "center", position: "relative"
            }} onClick={() => document.getElementById("rulesFile").click()}>
              <div style={{
                position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                background: c.primary, color: c.white, fontSize: 10, fontWeight: 600,
                padding: "2px 8px", borderRadius: 999
              }}>RECOMMENDED</div>
              <p style={{ fontSize: 28, margin: "0 0 8px" }}>📄</p>
              <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>Upload rules sheet</p>
              <p style={{ fontSize: 12, color: c.sub, margin: "0 0 10px" }}>AI extracts rules from your document automatically</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                {["PDF", "Word", "Text"].map(t => (
                  <span key={t} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "#f0f0f0", color: c.sub }}>{t}</span>
                ))}
              </div>
              <input id="rulesFile" type="file" accept=".pdf,.doc,.docx,.txt"
                style={{ display: "none" }} onChange={handleFileUpload} />
            </div>
          </div>
          {uploading && <p style={{ textAlign: "center", fontSize: 13, color: c.sub, margin: "0 0 12px" }}>⏳ Reading document and extracting rules...</p>}
          {extractError && <p style={{ fontSize: 12, color: c.fail, textAlign: "center", margin: "0 0 12px" }}>{extractError}</p>}
          <p style={{ textAlign: "center", fontSize: 12, color: c.subtle, cursor: "pointer", margin: 0 }}
            onClick={saveAndContinue}>Skip for now — use default rules only</p>
        </Card>
      </div>
    </div>
  );

  if (step === "manual") return (
    <div style={pageStyle}>
      <div style={innerStyle}>
        <Card>
          <StepBar current="manual" />
          <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Add your rules</p>
          <p style={{ fontSize: 13, color: c.sub, margin: "0 0 16px" }}>Type each rule in plain English. The AI will check every report against these.</p>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: c.sub, fontWeight: 500, margin: "0 0 8px" }}>Default rules — always applied</p>
            {workspace.rules.default_rules.slice(0, 2).map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#f8f8f8", borderRadius: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: c.pass }}>✓</span>
                <span style={{ fontSize: 13, color: c.sub, flex: 1 }}>{r}</span>
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 999, background: "#ececec", color: c.subtle }}>Default</span>
              </div>
            ))}
            <p style={{ fontSize: 11, color: c.subtle, margin: "4px 0 0 10px" }}>+ {workspace.rules.default_rules.length - 2} more default rules</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: c.sub, fontWeight: 500, margin: "0 0 8px" }}>Your custom rules {customRules.length > 0 && `(${customRules.length})`}</p>
            {customRules.length === 0 && <p style={{ fontSize: 13, color: c.subtle, marginBottom: 8 }}>No custom rules yet. Add your first one below.</p>}
            {customRules.map((rule, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: `1px solid ${c.border}`, borderRadius: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: c.pass }}>✓</span>
                <span style={{ fontSize: 13, flex: 1 }}>{rule}</span>
                <button onClick={() => deleteRule(i)} style={{ background: "none", border: "none", cursor: "pointer", color: c.fail, fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input placeholder="Type a rule in plain English..."
                value={newRule} onChange={e => setNewRule(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addRule()}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${c.border}`, fontSize: 13, outline: "none" }} />
              <Btn onClick={addRule}>Add</Btn>
            </div>
          </div>
          <Btn onClick={() => setStep("review")} style={{ width: "100%" }}>Continue to review →</Btn>
          <p style={{ textAlign: "center", fontSize: 12, color: c.subtle, cursor: "pointer", margin: "10px 0 0" }} onClick={() => setStep("landing")}>← Back</p>
        </Card>
      </div>
    </div>
  );

  if (step === "upload") return (
    <div style={pageStyle}>
      <div style={innerStyle}>
        <Card>
          <StepBar current="upload" />
          <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Rules extracted ✨</p>
          <p style={{ fontSize: 13, color: c.sub, margin: "0 0 16px" }}>AI found {customRules.length} rules from your document. Review and edit before continuing.</p>
          <div style={{ background: c.passBg, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: c.pass, margin: 0 }}>✓ {customRules.length} rules extracted — delete any that don't apply</p>
          </div>
          {customRules.map((rule, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", background: "#f8f8f8", borderRadius: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: c.pass }}>✓</span>
              <span style={{ fontSize: 13, flex: 1 }}>{rule}</span>
              <button onClick={() => deleteRule(i)} style={{ background: "none", border: "none", cursor: "pointer", color: c.fail, fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, margin: "10px 0 16px" }}>
            <input placeholder="Add any missing rule manually..."
              value={newRule} onChange={e => setNewRule(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addRule()}
              style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${c.border}`, fontSize: 13, outline: "none" }} />
            <Btn onClick={addRule}>Add</Btn>
          </div>
          <Btn onClick={() => setStep("review")} style={{ width: "100%" }}>Continue to review →</Btn>
          <p style={{ textAlign: "center", fontSize: 12, color: c.subtle, cursor: "pointer", margin: "10px 0 0" }} onClick={() => setStep("landing")}>← Back</p>
        </Card>
      </div>
    </div>
  );

  if (step === "review") return (
    <div style={pageStyle}>
      <div style={innerStyle}>
        <Card>
          <StepBar current="review" />
          <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Review your rules</p>
          <p style={{ fontSize: 13, color: c.sub, margin: "0 0 16px" }}>
            These rules will be checked against every report in <strong>{workspace.name}</strong>. You can edit anytime from workspace settings.
          </p>
          <div style={{ background: c.infoBg, borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, color: c.info, margin: 0 }}>
              <strong>{workspace.rules.default_rules.length + customRules.length} rules total</strong> — {workspace.rules.default_rules.length} default + {customRules.length} custom
            </p>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: c.passBg, color: c.pass, fontWeight: 500 }}>Ready</span>
          </div>
          <div style={{ border: `1px solid ${c.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "8px 12px", background: "#f8f8f8", borderBottom: `1px solid ${c.border}` }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: c.subtle, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>Default rules</p>
            </div>
            {workspace.rules.default_rules.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderBottom: i < workspace.rules.default_rules.length - 1 ? `1px solid ${c.border}` : "none" }}>
                <span style={{ fontSize: 12, color: c.pass }}>✓</span>
                <span style={{ fontSize: 13, color: c.sub, flex: 1 }}>{r}</span>
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 999, background: "#ececec", color: c.subtle }}>Default</span>
              </div>
            ))}
          </div>
          {customRules.length > 0 && (
            <div style={{ border: `1px solid ${c.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "8px 12px", background: "#f8f8f8", borderBottom: `1px solid ${c.border}` }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: c.subtle, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>Your custom rules</p>
              </div>
              {customRules.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderBottom: i < customRules.length - 1 ? `1px solid ${c.border}` : "none" }}>
                  <span style={{ fontSize: 12, color: c.pass }}>✓</span>
                  <span style={{ fontSize: 13, color: c.text, flex: 1 }}>{r}</span>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 999, background: c.passBg, color: c.pass }}>Custom</span>
                </div>
              ))}
            </div>
          )}
          {customRules.length === 0 && (
            <div style={{ background: c.warnBg, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: c.warn, margin: 0 }}>
                ⚠️ No custom rules added. Only default rules will apply.{" "}
                <span onClick={() => setStep("manual")} style={{ cursor: "pointer", textDecoration: "underline" }}>Add rules now</span>
              </p>
            </div>
          )}
          <Btn onClick={saveAndContinue} style={{ width: "100%", marginBottom: 8 }}>Save rules and go to dashboard →</Btn>
          <p style={{ textAlign: "center", fontSize: 12, color: c.subtle, cursor: "pointer", margin: 0 }} onClick={() => setStep("manual")}>← Go back and edit rules</p>
        </Card>
      </div>
    </div>
  );

  return null;
}

// ─── Login ────────────────────────────────────────────────
function LoginScreen({ onLogin, goSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    const users = JSON.parse(localStorage.getItem("rc_users") || "[]");
    const found = users.find(u => u.email === email && u.password === password);
    if (found) { onLogin(found); }
    else { setError("Email or password is incorrect."); }
  }

  return (
    <div style={{ minHeight: "100vh", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380, padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>✦ ReportCheck</p>
          <p style={{ fontSize: 14, color: c.sub, margin: 0 }}>Sign in to your account</p>
        </div>
        <Card>
          <Input label="Email" placeholder="you@email.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Password" placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <p style={{ fontSize: 12, color: c.fail, margin: "-4px 0 10px" }}>{error}</p>}
          <Btn onClick={handleLogin} style={{ width: "100%", marginTop: 4 }}>Sign in</Btn>
          <p style={{ textAlign: "center", fontSize: 13, color: c.sub, margin: "14px 0 0" }}>
            No account?{" "}
            <span onClick={goSignup} style={{ color: c.primary, fontWeight: 500, cursor: "pointer" }}>Sign up</span>
          </p>
        </Card>
      </div>
    </div>
  );
}

// ─── Signup ───────────────────────────────────────────────
function SignupScreen({ onLogin, goLogin }) {
  const [accountType, setAccountType] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", brandName: "", jobTitle: "", password: "", confirm: "" });
  const [error, setError] = useState("");

  function handleSignup() {
    if (!form.name || !form.email || !form.brandName || !form.password) { setError("Please fill in all fields."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    const users = JSON.parse(localStorage.getItem("rc_users") || "[]");
    if (users.find(u => u.email === form.email)) { setError("An account with this email already exists."); return; }
    const newUser = { id: Date.now(), name: form.name, email: form.email, brandName: form.brandName, jobTitle: form.jobTitle, password: form.password, type: accountType, workspaces: [] };
    users.push(newUser);
    localStorage.setItem("rc_users", JSON.stringify(users));
    onLogin(newUser);
  }

  return (
    <div style={{ minHeight: "100vh", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440, padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>✦ ReportCheck</p>
          <p style={{ fontSize: 14, color: c.sub, margin: 0 }}>{!accountType ? "Create your account" : accountType === "solo" ? "Solo account" : "Company / Team account"}</p>
        </div>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", background: accountType ? c.passBg : c.primary, color: accountType ? c.pass : c.white }}>
              {accountType ? "✓" : "1"}
            </div>
            <div style={{ flex: 1, height: 1, background: c.border }} />
            <div style={{ width: 22, height: 22, borderRadius: "50%", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", background: accountType ? c.primary : "#f0f0f0", color: accountType ? c.white : c.subtle }}>
              2
            </div>
          </div>

          {!accountType && (
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>How will you use ReportCheck?</p>
              <p style={{ fontSize: 13, color: c.sub, margin: "0 0 16px" }}>Pick the option that fits you best.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div onClick={() => setAccountType("solo")} style={{ border: `1.5px solid ${c.border}`, borderRadius: 10, padding: "16px 12px", cursor: "pointer", textAlign: "center" }}>
                  <p style={{ fontSize: 24, margin: "0 0 6px" }}>👤</p>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>Just me</p>
                  <p style={{ fontSize: 11, color: c.sub, margin: "0 0 10px" }}>I work alone — no team needed</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                    {["Freelancer", "Student", "Solo"].map(t => (<span key={t} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "#f0f0f0", color: c.sub }}>{t}</span>))}
                  </div>
                </div>
                <div onClick={() => setAccountType("company")} style={{ border: `1.5px solid ${c.border}`, borderRadius: 10, padding: "16px 12px", cursor: "pointer", textAlign: "center" }}>
                  <p style={{ fontSize: 24, margin: "0 0 6px" }}>🏢</p>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>Company / Team</p>
                  <p style={{ fontSize: 11, color: c.sub, margin: "0 0 10px" }}>I work with others who need access</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                    {["Organisation", "Department", "Team"].map(t => (<span key={t} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "#f0f0f0", color: c.sub }}>{t}</span>))}
                  </div>
                </div>
              </div>
              <p style={{ textAlign: "center", fontSize: 13, color: c.sub, margin: "4px 0 0" }}>
                Already have an account?{" "}
                <span onClick={goLogin} style={{ color: c.primary, fontWeight: 500, cursor: "pointer" }}>Sign in</span>
              </p>
            </div>
          )}

          {accountType && (
            <div>
              <div style={{ background: accountType === "solo" ? c.infoBg : c.passBg, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: accountType === "solo" ? c.info : c.pass, margin: 0 }}>
                  {accountType === "solo" ? "👤 Solo account — full control, no team needed" : "🏢 Company account — you will be set as admin"}
                </p>
              </div>
              <Input label="Your name" placeholder="e.g. Alex Johnson" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <Input label="Email" placeholder="you@email.com" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <Input label={accountType === "solo" ? "Brand or business name" : "Company name"} placeholder={accountType === "solo" ? "e.g. AJ Studio, ABC Freelance" : "e.g. Acme Corp"} value={form.brandName} onChange={e => setForm({ ...form, brandName: e.target.value })} />
              {accountType === "company" && (
                <Input label="Your job title" placeholder="e.g. Head of Reporting" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} />
              )}
              <Input label="Password" placeholder="Min 8 characters" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <Input label="Confirm password" placeholder="Repeat password" type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
              {error && <p style={{ fontSize: 12, color: c.fail, margin: "-4px 0 10px" }}>{error}</p>}
              <Btn onClick={handleSignup} style={{ width: "100%", marginTop: 4 }}>Create account</Btn>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                <span onClick={() => { setAccountType(null); setError(""); }} style={{ fontSize: 12, color: c.sub, cursor: "pointer" }}>← Change account type</span>
                <span onClick={goLogin} style={{ fontSize: 12, color: c.sub, cursor: "pointer" }}>Sign in instead</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────
function DashboardScreen({ user, setUser, setScreen, setActiveWorkspace, setResults }) {
  const [selectedWsId, setSelectedWsId] = useState(null);
  const [file, setFile] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [creatingWs, setCreatingWs] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [showRulesSetup, setShowRulesSetup] = useState(false);
  const [newWorkspaceData, setNewWorkspaceData] = useState(null);
  const [showDefaultRules, setShowDefaultRules] = useState(false);
  const [editingWsId, setEditingWsId] = useState(null);
  const [editWsName, setEditWsName] = useState("");

  const workspaces = user.workspaces || [];
  const selectedWs = workspaces.find(w => w.id === selectedWsId);

  function saveUser(updated) {
    setUser(updated);
    const users = JSON.parse(localStorage.getItem("rc_users") || "[]");
    const idx = users.findIndex(u => u.id === updated.id);
    if (idx > -1) { users[idx] = updated; localStorage.setItem("rc_users", JSON.stringify(users)); }
  }

  function createWorkspace(name) {
    if (!name?.trim()) return;
    const ws = {
      id: Date.now(), name: name.trim(),
      rules: {
        company_name: user.brandName, primary_font: "",
        brand_colours: [], logo_position: "",
        custom_rules: [], ignored_rules: [],
        default_rules: DEFAULT_RULES
      },
      history: []
    };
    const updated = { ...user, workspaces: [...workspaces, ws] };
    saveUser(updated);
    setNewWorkspaceData(ws);
    setShowRulesSetup(true);
    setCreatingWs(false);
    setNewWsName("");
  }

  function startRenameWs(ws) {
    setEditingWsId(ws.id);
    setEditWsName(ws.name);
  }

  function saveRenameWs(ws) {
    if (!editWsName.trim()) return;
    const updatedWorkspaces = workspaces.map(w => w.id === ws.id ? { ...w, name: editWsName.trim() } : w);
    saveUser({ ...user, workspaces: updatedWorkspaces });
    setEditingWsId(null);
    setEditWsName("");
  }

  function deleteWorkspace(ws) {
    if (!window.confirm(`Delete workspace "${ws.name}"? This will also remove its rules and check history. This cannot be undone.`)) return;
    const updatedWorkspaces = workspaces.filter(w => w.id !== ws.id);
    saveUser({ ...user, workspaces: updatedWorkspaces });
    if (selectedWsId === ws.id) setSelectedWsId(null);
    if (editingWsId === ws.id) setEditingWsId(null);
  }

  async function runCheck() {
    if (!file || !selectedWs) return;
    setChecking(true); setError("");
    try {
      await fetch(`${API}/rules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(selectedWs.rules) });
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/check`, { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const entry = {
        id: Date.now(), filename: file.name,
        score: data.pages?.[0]?.summary?.score || "—",
        passed: data.pages?.[0]?.summary?.passed || "0",
        failed: data.pages?.[0]?.summary?.failed || "0",
        warnings: data.pages?.[0]?.summary?.warnings || "0",
        date: new Date().toLocaleString(), data
      };
      const updatedWs = { ...selectedWs, history: [entry, ...(selectedWs.history || [])] };
      const updatedWorkspaces = workspaces.map(w => w.id === selectedWs.id ? updatedWs : w);
      saveUser({ ...user, workspaces: updatedWorkspaces });
      setResults({ entry, wsName: selectedWs.name });
      setScreen("results");
    } catch { setError("Check failed. Make sure your backend is running."); }
    finally { setChecking(false); }
  }

  const allHistory = workspaces.flatMap(ws => (ws.history || []).map(h => ({ ...h, wsName: ws.name }))).sort((a, b) => b.id - a.id).slice(0, 4);
  const step1Done = !!selectedWs;
  const step2Done = !!file;
  const activeRules = selectedWs ? [...(selectedWs.rules.default_rules || []), ...(selectedWs.rules.custom_rules || [])].filter(r => !(selectedWs.rules.ignored_rules || []).includes(r)) : [];

  if (showRulesSetup && newWorkspaceData) {
    return (
      <RulesSetupScreen
        user={user}
        setUser={setUser}
        workspace={newWorkspaceData}
        onComplete={(updatedUser) => {
          setUser(updatedUser);
          setShowRulesSetup(false);
          setNewWorkspaceData(null);
          const ws = updatedUser.workspaces.find(w => w.id === newWorkspaceData.id);
          if (ws) setSelectedWsId(ws.id);
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 20, fontWeight: 600, margin: "0 0 2px" }}>Welcome back, {user.name.split(" ")[0]} 👋</p>
          <p style={{ fontSize: 13, color: c.sub, margin: 0 }}>{user.brandName} · {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 }}>
          <Card>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 20px" }}>Check a report</p>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <StepNumber num={1} done={step1Done} active={!step1Done} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 3px" }}>What kind of report are you checking?</p>
                <p style={{ fontSize: 12, color: c.sub, margin: "0 0 10px" }}>Select a workspace or create a new one</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {workspaces.map(ws => (
                    <div key={ws.id} onClick={() => setSelectedWsId(ws.id)} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontSize: 13, padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                      border: selectedWsId === ws.id ? `2px solid ${c.primary}` : `1px solid ${c.border}`,
                      background: selectedWsId === ws.id ? c.primary : c.white,
                      color: selectedWsId === ws.id ? c.white : c.text,
                      fontWeight: selectedWsId === ws.id ? 500 : 400
                    }}>
                      📁 {ws.name}
                    </div>
                  ))}
                  {!creatingWs ? (
                    <div onClick={() => setCreatingWs(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: `1px dashed ${c.border}`, color: c.sub }}>
                      ＋ New workspace
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 6, width: "100%", marginTop: 4 }}>
                      <input autoFocus placeholder="Workspace name..."
                        value={newWsName} onChange={e => setNewWsName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && createWorkspace(newWsName)}
                        style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: `1px solid ${c.border}`, fontSize: 13, outline: "none" }} />
                      <Btn onClick={() => createWorkspace(newWsName)} style={{ padding: "7px 14px" }}>Create</Btn>
                      <Btn secondary onClick={() => { setCreatingWs(false); setNewWsName(""); }} style={{ padding: "7px 14px" }}>Cancel</Btn>
                    </div>
                  )}
                </div>
                <p onClick={() => setShowDefaultRules(s => !s)} style={{ fontSize: 12, color: c.sub, cursor: "pointer", margin: "10px 0 0", textDecoration: "underline", display: "inline-block" }}>
                  {showDefaultRules ? "Hide" : "View"} the {DEFAULT_RULES.length} default rules applied to every report
                </p>
                {showDefaultRules && (
                  <div style={{ background: "#f8f8f8", borderRadius: 10, padding: "10px 14px", marginTop: 8 }}>
                    {DEFAULT_RULES.map((rule, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "5px 0",
                        borderBottom: i < DEFAULT_RULES.length - 1 ? `1px solid ${c.border}` : "none"
                      }}>
                        <span style={{ fontSize: 11, color: c.pass }}>✓</span>
                        <span style={{ fontSize: 12, color: c.sub }}>{rule}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ height: 1, background: c.border, margin: "0 0 20px 38px" }} />
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <StepNumber num={2} done={step2Done} active={step1Done && !step2Done} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 3px" }}>Upload your report</p>
                <p style={{ fontSize: 12, color: c.sub, margin: "0 0 10px" }}>PDF, PNG or JPG</p>
                <div onClick={() => step1Done && document.getElementById("dashFile").click()} style={{
                  border: `2px dashed ${file ? c.pass : c.border}`, borderRadius: 10,
                  padding: "20px 16px", textAlign: "center", cursor: step1Done ? "pointer" : "not-allowed",
                  background: file ? c.passBg : step1Done ? c.white : "#fafafa", opacity: step1Done ? 1 : 0.5
                }}>
                  <p style={{ fontSize: 24, margin: "0 0 6px" }}>{file ? "📄" : "⬆️"}</p>
                  <p style={{ fontSize: 13, color: file ? c.pass : c.sub, margin: "0 0 2px", fontWeight: file ? 500 : 400 }}>
                    {file ? file.name : step1Done ? "Click to select your report" : "Select a workspace first"}
                  </p>
                  <p style={{ fontSize: 11, color: c.subtle, margin: 0 }}>
                    {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · Ready to check` : "PDF, PNG, JPG supported"}
                  </p>
                  <input id="dashFile" type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: c.border, margin: "0 0 20px 38px" }} />
            <div style={{ display: "flex", gap: 12 }}>
              <StepNumber num={3} done={false} active={step1Done && step2Done} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 3px" }}>Run quality check</p>
                <p style={{ fontSize: 12, color: c.sub, margin: "0 0 10px" }}>
                  {step1Done && step2Done ? `Checking against ${activeRules.length} active rules for ${selectedWs?.name}` : "Complete steps 1 and 2 first"}
                </p>
                {error && <p style={{ fontSize: 12, color: c.fail, margin: "0 0 8px" }}>{error}</p>}
                <Btn onClick={runCheck} disabled={!step1Done || !step2Done || checking} style={{ width: "100%" }}>
                  {checking ? "Checking... this takes about 20 seconds ⏳" : "Check report quality"}
                </Btn>
              </div>
            </div>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>Your workspaces</p>
              {workspaces.length === 0 && <p style={{ fontSize: 13, color: c.subtle, textAlign: "center", padding: "12px 0" }}>No workspaces yet. Create one in Step 1.</p>}
              {workspaces.map(ws => {
                const isEditing = editingWsId === ws.id;
                return (
                  <div key={ws.id} onClick={() => { if (!isEditing) { setActiveWorkspace(ws); setScreen("workspace"); } }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: isEditing ? "default" : "pointer", marginBottom: 6, border: `1px solid ${c.border}`, background: c.white }}>
                    <span style={{ fontSize: 16 }}>📁</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isEditing ? (
                        <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 6 }}>
                          <input autoFocus value={editWsName} onChange={e => setEditWsName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") saveRenameWs(ws); if (e.key === "Escape") setEditingWsId(null); }}
                            style={{ flex: 1, padding: "5px 8px", borderRadius: 6, border: `1px solid ${c.border}`, fontSize: 13, outline: "none" }} />
                          <button onClick={() => saveRenameWs(ws)} style={{ background: "none", border: "none", cursor: "pointer", color: c.pass, fontSize: 14, padding: "0 2px" }}>✓</button>
                          <button onClick={() => setEditingWsId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: c.subtle, fontSize: 16, padding: "0 2px" }}>×</button>
                        </div>
                      ) : (
                        <>
                          <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 1px" }}>{ws.name}</p>
                          <p style={{ fontSize: 11, color: c.subtle, margin: 0 }}>{(ws.rules?.default_rules?.length || 0) + (ws.rules?.custom_rules?.length || 0)} rules · {ws.history?.length || 0} checks</p>
                        </>
                      )}
                    </div>
                    {!isEditing && (
                      <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <button onClick={() => startRenameWs(ws)} title="Rename workspace" style={{ background: "none", border: "none", cursor: "pointer", color: c.subtle, fontSize: 13, padding: 4 }}>✏️</button>
                        <button onClick={() => deleteWorkspace(ws)} title="Delete workspace" style={{ background: "none", border: "none", cursor: "pointer", color: c.subtle, fontSize: 13, padding: 4 }}>🗑️</button>
                        <span
                        onClick={() => { setActiveWorkspace(ws); setScreen("workspace"); }}
                        style={{ fontSize: 18, color: c.sub, marginLeft: 2, cursor: "pointer", padding: "0 4px" }}
                        >›</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
            {allHistory.length > 0 && (
              <Card>
                <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>Recent checks</p>
                {allHistory.map((h, i) => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < allHistory.length - 1 ? `1px solid ${c.border}` : "none" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: parseInt(h.score) >= 8 ? c.passBg : parseInt(h.score) >= 6 ? c.warnBg : c.failBg, color: parseInt(h.score) >= 8 ? c.pass : parseInt(h.score) >= 6 ? c.warn : c.fail }}>{h.score}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.filename}</p>
                      <p style={{ fontSize: 11, color: c.subtle, margin: 0 }}>{h.wsName}</p>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Workspace Screen ─────────────────────────────────────
function WorkspaceScreen({ user, setUser, workspace, setScreen, setResults }) {
  const [tab, setTab] = useState("overview");
  const [ws, setWs] = useState(workspace);
  const [newRule, setNewRule] = useState("");
  const [file, setFile] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  function saveUser(updatedWs) {
    const updatedWorkspaces = (user.workspaces || []).map(w => w.id === updatedWs.id ? updatedWs : w);
    const updatedUser = { ...user, workspaces: updatedWorkspaces };
    setUser(updatedUser);
    const users = JSON.parse(localStorage.getItem("rc_users") || "[]");
    const idx = users.findIndex(u => u.id === updatedUser.id);
    if (idx > -1) { users[idx] = updatedUser; localStorage.setItem("rc_users", JSON.stringify(users)); }
  }

  function toggleRule(rule) {
    const ignored = ws.rules.ignored_rules || [];
    const updated = ignored.includes(rule) ? ignored.filter(r => r !== rule) : [...ignored, rule];
    const updatedWs = { ...ws, rules: { ...ws.rules, ignored_rules: updated } };
    setWs(updatedWs); saveUser(updatedWs);
  }

  function addCustomRule() {
    if (!newRule.trim()) return;
    const updatedWs = { ...ws, rules: { ...ws.rules, custom_rules: [...(ws.rules.custom_rules || []), newRule.trim()] } };
    setWs(updatedWs); saveUser(updatedWs); setNewRule("");
  }

  function deleteCustomRule(i) {
    const updated = ws.rules.custom_rules.filter((_, idx) => idx !== i);
    const updatedWs = { ...ws, rules: { ...ws.rules, custom_rules: updated } };
    setWs(updatedWs); saveUser(updatedWs);
  }

  async function runCheck() {
    if (!file) return;
    setChecking(true); setError("");
    try {
      await fetch(`${API}/rules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ws.rules) });
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/check`, { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const entry = { id: Date.now(), filename: file.name, score: data.pages?.[0]?.summary?.score || "—", passed: data.pages?.[0]?.summary?.passed || "0", failed: data.pages?.[0]?.summary?.failed || "0", warnings: data.pages?.[0]?.summary?.warnings || "0", date: new Date().toLocaleString(), data };
      const updatedWs = { ...ws, history: [entry, ...(ws.history || [])] };
      setWs(updatedWs); saveUser(updatedWs);
      setResults({ entry, wsName: ws.name });
      setScreen("results");
    } catch { setError("Check failed. Make sure backend is running."); }
    finally { setChecking(false); }
  }

  const activeRules = [...(ws.rules.default_rules || []), ...(ws.rules.custom_rules || [])].filter(r => !(ws.rules.ignored_rules || []).includes(r));
  const tabs = [{ id: "overview", label: "Overview" }, { id: "rules", label: "Rules" }, { id: "checks", label: "Recent checks" }, { id: "upload", label: "Upload report" }];

  return (
    <div style={{ minHeight: "100vh", background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span onClick={() => setScreen("dashboard")} style={{ fontSize: 13, color: c.sub, cursor: "pointer" }}>← Dashboard</span>
          <span style={{ color: c.border }}>/</span>
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{ws.name}</p>
        </div>
        <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${c.border}`, marginBottom: 20 }}>
          {tabs.map(t => (
            <div key={t.id} onClick={() => setTab(t.id)} style={{ fontSize: 13, padding: "8px 14px", cursor: "pointer", color: tab === t.id ? c.text : c.sub, fontWeight: tab === t.id ? 600 : 400, borderBottom: tab === t.id ? `2px solid ${c.text}` : "2px solid transparent", marginBottom: -1 }}>
              {t.label}
            </div>
          ))}
        </div>

        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
              {[
                { label: "Total checks", value: ws.history?.length || 0 },
                { label: "Active rules", value: activeRules.length },
                { label: "Avg score", value: ws.history?.length ? (ws.history.reduce((a, h) => a + (parseInt(h.score) || 0), 0) / ws.history.length).toFixed(1) : "—" }
              ].map(s => (
                <Card key={s.label} style={{ textAlign: "center", padding: 16 }}>
                  <p style={{ fontSize: 22, fontWeight: 600, margin: "0 0 2px" }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: c.subtle, margin: 0 }}>{s.label}</p>
                </Card>
              ))}
            </div>
            <Card>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>Active rules — {activeRules.length} rules will be checked</p>
              {activeRules.length === 0 && <p style={{ fontSize: 13, color: c.subtle }}>No active rules. Go to Rules tab to set them up.</p>}
              {activeRules.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < activeRules.length - 1 ? `1px solid ${c.border}` : "none" }}>
                  <span style={{ fontSize: 12, color: c.pass }}>✓</span>
                  <p style={{ fontSize: 13, margin: 0 }}>{r}</p>
                </div>
              ))}
            </Card>
            {ws.history?.length > 0 && (
              <Card>
                <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>Recent checks</p>
                {ws.history.slice(0, 3).map((h, i) => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < 2 && i < ws.history.length - 1 ? `1px solid ${c.border}` : "none" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: parseInt(h.score) >= 8 ? c.passBg : parseInt(h.score) >= 6 ? c.warnBg : c.failBg, color: parseInt(h.score) >= 8 ? c.pass : parseInt(h.score) >= 6 ? c.warn : c.fail }}>{h.score}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 1px" }}>{h.filename}</p>
                      <p style={{ fontSize: 11, color: c.subtle, margin: 0 }}>{h.date}</p>
                    </div>
                    <span style={{ fontSize: 11, color: parseInt(h.failed) > 0 ? c.fail : c.pass, fontWeight: 500 }}>{h.passed} passed · {h.failed} failed</span>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>Custom rules</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => document.getElementById("wsRulesFile").click()}
                    style={{
                      fontSize: 12, padding: "5px 10px", borderRadius: 8,
                      border: `1px solid ${c.border}`, background: c.white,
                      color: c.sub, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                    }}
                  >
                    📄 Upload rules sheet
                  </button>
                  <input
                    id="wsRulesFile" type="file" accept=".pdf,.doc,.docx,.txt"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const extractBtn = document.getElementById("wsRulesFile");
                      if (extractBtn) extractBtn.disabled = true;
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        const res = await fetch(`${API}/extract-rules`, { method: "POST", body: form });
                        if (!res.ok) throw new Error();
                        const data = await res.json();
                        if (!data.rules?.length) { alert("No rules found in document."); return; }
                        const existing = ws.rules.custom_rules || [];
                        const duplicates = [];
                        const newOnes = [];
                        data.rules.forEach(r => {
                          const isDupe = existing.some(e => e.toLowerCase().trim() === r.toLowerCase().trim());
                          if (isDupe) duplicates.push(r);
                          else newOnes.push(r);
                        });
                        let message = `Found ${data.rules.length} rules in document.\n`;
                        if (newOnes.length) message += `\n✅ ${newOnes.length} new rules will be added.`;
                        if (duplicates.length) message += `\n⚠️ ${duplicates.length} already exist and will be skipped:\n${duplicates.map(d => `• ${d}`).join("\n")}`;
                        message += "\n\nProceed?";
                        if (window.confirm(message)) {
                          const updatedWs = { ...ws, rules: { ...ws.rules, custom_rules: [...existing, ...newOnes] } };
                          setWs(updatedWs); saveUser(updatedWs);
                          alert(`Added ${newOnes.length} new rules.${duplicates.length ? ` Skipped ${duplicates.length} duplicates.` : ""}`);
                        }
                      } catch { alert("Could not extract rules. Try again."); }
                      finally { e.target.value = ""; }
                    }}
                  />
                </div>
              </div>
              <p style={{ fontSize: 12, color: c.sub, margin: "0 0 14px" }}>Add your own rules in plain English.</p>
              {(ws.rules.custom_rules || []).length === 0 && <p style={{ fontSize: 13, color: c.subtle, marginBottom: 12 }}>No custom rules yet.</p>}
              {(ws.rules.custom_rules || []).map((rule, i) => {
                const ignored = (ws.rules.ignored_rules || []).includes(rule);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < ws.rules.custom_rules.length - 1 ? `1px solid ${c.border}` : "none", opacity: ignored ? 0.5 : 1 }}>
                    <span style={{ flex: 1, fontSize: 13, textDecoration: ignored ? "line-through" : "none" }}>{rule}</span>
                    <Toggle on={!ignored} onClick={() => toggleRule(rule)} />
                    <button onClick={() => deleteCustomRule(i)} style={{ background: "none", border: "none", cursor: "pointer", color: c.fail, fontSize: 18, padding: "0 2px", lineHeight: 1 }}>×</button>
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <input
                  placeholder="Type a rule in plain English..."
                  value={newRule}
                  onChange={e => setNewRule(e.target.value)}
                  onKeyDown={e => {
                    if (e.key !== "Enter") return;
                    if (!newRule.trim()) return;
                    const existing = ws.rules.custom_rules || [];
                    const isDupe = existing.some(r => r.toLowerCase().trim() === newRule.toLowerCase().trim());
                    if (isDupe) {
                      if (window.confirm(`This rule already exists:\n"${newRule}"\n\nDo you want to add it anyway?`)) {
                        addCustomRule();
                      }
                    } else {
                      addCustomRule();
                    }
                  }}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${c.border}`, fontSize: 13, outline: "none" }}
                />
                <Btn onClick={() => {
                  if (!newRule.trim()) return;
                  const existing = ws.rules.custom_rules || [];
                  const isDupe = existing.some(r => r.toLowerCase().trim() === newRule.toLowerCase().trim());
                  if (isDupe) {
                    if (window.confirm(`This rule already exists:\n"${newRule}"\n\nDo you want to add it anyway?`)) {
                      addCustomRule();
                    }
                  } else {
                    addCustomRule();
                  }
                }}>Add</Btn>
              </div>
            </Card>

        {tab === "checks" && (
          <div>
            {(!ws.history || ws.history.length === 0) ? (
              <Card style={{ textAlign: "center", padding: 40 }}>
                <p style={{ fontSize: 32, margin: "0 0 8px" }}>📋</p>
                <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>No checks yet</p>
                <p style={{ fontSize: 13, color: c.sub, margin: "0 0 16px" }}>Upload your first report to see results here.</p>
                <Btn onClick={() => setTab("upload")}>Upload a report</Btn>
              </Card>
            ) : (
              <Card>
                {ws.history.map((h, i) => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < ws.history.length - 1 ? `1px solid ${c.border}` : "none" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: parseInt(h.score) >= 8 ? c.passBg : parseInt(h.score) >= 6 ? c.warnBg : c.failBg, color: parseInt(h.score) >= 8 ? c.pass : parseInt(h.score) >= 6 ? c.warn : c.fail }}>{h.score}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 1px" }}>{h.filename}</p>
                      <p style={{ fontSize: 11, color: c.subtle, margin: 0 }}>{h.date}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 12, color: c.pass, margin: "0 0 1px" }}>{h.passed} passed</p>
                      <p style={{ fontSize: 12, color: c.fail, margin: 0 }}>{h.failed} failed</p>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        {tab === "upload" && (
          <Card>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>Upload report</p>
            <p style={{ fontSize: 12, color: c.sub, margin: "0 0 14px" }}>Checking against {activeRules.length} active rules for {ws.name}.</p>
            <div onClick={() => document.getElementById("wsFile").click()} style={{ border: `2px dashed ${file ? c.pass : c.border}`, borderRadius: 10, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: file ? c.passBg : c.bg, marginBottom: 14 }}>
              <p style={{ fontSize: 28, margin: "0 0 8px" }}>{file ? "📄" : "⬆️"}</p>
              <p style={{ fontSize: 14, color: file ? c.pass : c.sub, margin: "0 0 4px", fontWeight: file ? 500 : 400 }}>{file ? file.name : "Click to select your report"}</p>
              <p style={{ fontSize: 12, color: c.subtle, margin: 0 }}>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · Ready` : "PDF, PNG, JPG"}</p>
              <input id="wsFile" type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
            </div>
            {error && <p style={{ fontSize: 12, color: c.fail, marginBottom: 10 }}>{error}</p>}
            <Btn onClick={runCheck} disabled={!file || checking} style={{ width: "100%" }}>{checking ? "Checking... about 20 seconds ⏳" : "Check report quality"}</Btn>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Results Screen ───────────────────────────────────────
function ResultsScreen({ results, setScreen }) {
  const { entry, wsName } = results;
  const pages = entry.data?.pages || [];
  const [ignored, setIgnored] = useState([]);

  const totalPassed = pages.reduce((a, p) => a + (parseInt(p.summary?.passed) || 0), 0);
  const totalFailed = pages.reduce((a, p) => a + (parseInt(p.summary?.failed) || 0), 0);
  const totalWarnings = pages.reduce((a, p) => a + (parseInt(p.summary?.warnings) || 0), 0);
  const totalRules = pages.reduce((a, p) => a + (parseInt(p.summary?.total) || 0), 0);
  const overallScore = totalRules > 0 ? Math.round((totalPassed / totalRules) * 10) : 0;
  const scoreColor = overallScore >= 8 ? c.pass : overallScore >= 6 ? c.warn : c.fail;

  return (
    <div style={{ minHeight: "100vh", background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span onClick={() => setScreen("dashboard")} style={{ fontSize: 13, color: c.sub, cursor: "pointer" }}>← Dashboard</span>
          <span style={{ color: c.border }}>/</span>
          <span style={{ fontSize: 13, color: c.sub }}>{wsName}</span>
          <span style={{ color: c.border }}>/</span>
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Results</p>
        </div>
        <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 2px" }}>Quality check results</p>
        <p style={{ fontSize: 13, color: c.sub, margin: "0 0 18px" }}>{entry.filename} · {pages.length} page{pages.length !== 1 ? "s" : ""} checked</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Overall score", value: `${overallScore}/10`, color: scoreColor },
            { label: "Passed", value: totalPassed, color: c.pass },
            { label: "Failed", value: totalFailed, color: c.fail },
            { label: "Warnings", value: totalWarnings, color: c.warn },
          ].map(s => (
            <Card key={s.label} style={{ textAlign: "center", padding: 14 }}>
              <p style={{ fontSize: 22, fontWeight: 700, margin: "0 0 2px", color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 11, color: c.subtle, margin: 0 }}>{s.label}</p>
            </Card>
          ))}
        </div>
        {pages.map((page, pageIndex) => {
          const checks = page.results || [];
          const pageSummary = page.summary || {};
          const pageScore = pageSummary.score || "—";
          const pageScoreNum = parseInt(pageScore) || 0;
          const pageScoreColor = pageScoreNum >= 8 ? c.pass : pageScoreNum >= 6 ? c.warn : c.fail;
          const pageScoreBg = pageScoreNum >= 8 ? c.passBg : pageScoreNum >= 6 ? c.warnBg : c.failBg;
          return (
            <div key={pageIndex} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: pageScoreBg, color: pageScoreColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{pageScore}</div>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                    Page {page.page}
                    {pages.length === 1 && <span style={{ fontSize: 12, color: c.sub, fontWeight: 400, marginLeft: 6 }}>(single page)</span>}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                  <span style={{ color: c.pass }}>✓ {pageSummary.passed || 0} passed</span>
                  <span style={{ color: c.fail }}>✗ {pageSummary.failed || 0} failed</span>
                  {parseInt(pageSummary.warnings) > 0 && <span style={{ color: c.warn }}>⚠ {pageSummary.warnings} warned</span>}
                </div>
              </div>
              <Card style={{ marginBottom: 0 }}>
                {checks.map((check, i) => {
                  const key = `p${pageIndex}-${i}`;
                  const isIgnored = ignored.includes(key);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", opacity: isIgnored ? 0.4 : 1, borderBottom: i < checks.length - 1 ? `1px solid ${c.border}` : "none" }}>
                      <Badge status={check.status} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, color: c.text, margin: "0 0 4px", lineHeight: 1.5 }}>
                          {check.explanation}
                        </p>
                        {check.suggestion && (
                          <div style={{
                            background: c.infoBg, borderRadius: 8,
                            padding: "8px 12px", marginTop: 6, marginBottom: 4
                          }}>
                            <p style={{ fontSize: 12, color: c.info, margin: 0 }}>
                              💡 <strong>How to fix:</strong> {check.suggestion}
                            </p>
                          </div>
                        )}
                        {(check.status === "FAIL" || check.status === "WARN") && !isIgnored && (
                          <button onClick={() => setIgnored(p => [...p, key])} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: c.subtle, padding: 0 }}>Ignore this result →</button>
                        )}
                        {isIgnored && <span style={{ fontSize: 12, color: c.subtle }}>✓ Ignored</span>}
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          );
        })}
        {pages.length > 1 && (
          <div style={{ background: c.infoBg, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: c.info, margin: 0 }}>💡 Each page is checked independently. Fix issues page by page then re-upload for a fresh check.</p>
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn secondary onClick={() => setScreen("dashboard")} style={{ flex: 1 }}>← Back to dashboard</Btn>
          <Btn onClick={() => setScreen("dashboard")} style={{ flex: 1 }}>Check another report</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [results, setResults] = useState(null);

  function handleLogin(u) { setUser(u); setScreen("dashboard"); }
  function handleLogout() { setUser(null); setScreen("login"); }

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {user && screen !== "login" && screen !== "signup" && (
        <TopBar user={user} onLogout={handleLogout} />
      )}
      {screen === "login" && <LoginScreen onLogin={handleLogin} goSignup={() => setScreen("signup")} />}
      {screen === "signup" && <SignupScreen onLogin={handleLogin} goLogin={() => setScreen("login")} />}
      {screen === "dashboard" && user && (
        <DashboardScreen user={user} setUser={setUser} setScreen={setScreen} setActiveWorkspace={setActiveWorkspace} setResults={setResults} />
      )}
      {screen === "workspace" && user && activeWorkspace && (
        <WorkspaceScreen user={user} setUser={setUser} workspace={activeWorkspace} setScreen={setScreen} setResults={setResults} />
      )}
      {screen === "results" && results && (
        <ResultsScreen results={results} setScreen={setScreen} />
      )}
    </div>
  );
}
