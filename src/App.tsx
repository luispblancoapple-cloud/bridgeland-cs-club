import { useState, useRef, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJqtx5OvDPp4Xr_rTvq4QvlJYWgj0MtFs",
  authDomain: "bridgeland-cs-club.firebaseapp.com",
  projectId: "bridgeland-cs-club",
  storageBucket: "bridgeland-cs-club.firebasestorage.app",
  messagingSenderId: "785020173255",
  appId: "1:785020173255:web:00b3b0b6147a3d478f77e2",
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const DATA_DOC = doc(db, "club", "data");

const DEV_ACCOUNT = { username: "LuisBlanco62", password: "Dinosaur#2010", role: "developer", name: "Luis Blanco" };
const LOGO_URL = "https://pbs.twimg.com/profile_images/1405677956082630657/5PhDfiOI_400x400.jpg";

const C = {
  bg: "#0f1117", bgCard: "#1a1d27", bgInput: "#12141c", border: "#2a2d3a",
  navy: "#1a3a6b", orange: "#f97316", text: "#e2e8f0", muted: "#94a3b8",
  green: "#22c55e", red: "#ef4444", blue: "#3b82f6",
};

const diffColor = { Easy: C.green, Medium: C.orange, Hard: C.red };

const initData = {
  users: [DEV_ACCOUNT],
  announcements: [
    { id: 1, title: "Welcome to Bridgeland CS Club!", body: "Our first meeting is this Friday at 3:30 PM in room 214.", date: "2025-08-28", image: "" },
    { id: 2, title: "UIL Competition Signups Open", body: "Sign up for UIL CS competition. Practice sessions start next week.", date: "2025-09-02", image: "" },
  ],
  events: [
    { id: 1, title: "Weekly Meeting", date: "2025-09-06", time: "3:30 PM", location: "Room 214", desc: "Regular weekly meeting. Bring your laptops!", image: "" },
    { id: 2, title: "Hackathon Prep", date: "2025-09-13", time: "3:30 PM", location: "Room 214", desc: "Prepare for upcoming hackathon season.", image: "" },
  ],
  resources: [
    { id: 1, title: "Meeting Notes — Aug 28", url: "https://docs.google.com", type: "meeting", image: "" },
    { id: 2, title: "Python Crash Course", url: "https://learnpython.org", type: "resource", image: "" },
    { id: 3, title: "LeetCode", url: "https://leetcode.com", type: "resource", image: "" },
  ],
  problems: [
    { id: 1, title: "FizzBuzz", difficulty: "Easy", desc: "What does FizzBuzz print for the number 15?", choices: ["Fizz", "Buzz", "FizzBuzz", "15"], answer: 2 },
    { id: 2, title: "Binary Basics", difficulty: "Easy", desc: "What is the decimal value of binary 1010?", choices: ["8", "10", "12", "14"], answer: 1 },
    { id: 3, title: "Big-O Notation", difficulty: "Medium", desc: "What is the time complexity of binary search?", choices: ["O(n)", "O(n²)", "O(log n)", "O(1)"], answer: 2 },
    { id: 4, title: "Stack vs Queue", difficulty: "Medium", desc: "Which data structure follows the LIFO principle?", choices: ["Queue", "Stack", "Heap", "Tree"], answer: 1 },
    { id: 5, title: "Sorting", difficulty: "Hard", desc: "What is the average time complexity of quicksort?", choices: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], answer: 1 },
  ],
  units: [{ id: 1, title: "Intro to CS Concepts", desc: "Foundational concepts every CS student should know.", problemIds: [1, 2, 3] }],
  completions: {},
  attempts: {},
  streaks: {},
  about: {
    heading: "About Bridgeland CS Club",
    body: "We are a community of students passionate about computer science, coding, and technology. Whether you're a beginner or an experienced programmer, there's a place for you here!\n\nWe meet every week to learn new concepts, practice for UIL competitions, work on projects, and have fun. Join us and be part of something great.",
    images: [],
    officers: [{ name: "President", role: "President", image: "" }, { name: "Vice President", role: "Officer", image: "" }],
  },
};

async function saveData(d) { try { await setDoc(DATA_DOC, d); } catch (e) { console.error("Save failed", e); } }
function toB64(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }

function ImgPick({ label = "Add image (optional)", onPick, preview }) {
  const ref = useRef();
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{label}</div>
      <button type="button" onClick={() => ref.current.click()} style={{ background: C.bgInput, border: `1px dashed ${C.border}`, color: C.muted, padding: "8px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, width: "100%" }}>Click to upload image</button>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={async e => { if (e.target.files[0]) onPick(await toB64(e.target.files[0])); }} />
      {preview && <img src={preview} alt="" style={{ marginTop: 8, width: "100%", maxHeight: 110, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.border}` }} />}
    </div>
  );
}

const inp = { background: C.bgInput, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", borderRadius: 6, fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "'Inter', 'Segoe UI', sans-serif" };
const lbl = { fontSize: 12, color: C.muted, marginBottom: 4, display: "block" };
const cardS = { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "1rem 1.25rem", marginBottom: 12 };
const Btn = ({ color = C.orange, children, onClick, style = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ background: disabled ? C.border : color, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, ...style }}>{children}</button>
);
const OutBtn = ({ children, onClick, style = {}, danger }) => (
  <button onClick={onClick} style={{ background: "transparent", color: danger ? C.red : C.muted, border: `1px solid ${danger ? C.red : C.border}`, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, ...style }}>{children}</button>
);
const Tag = ({ c, children }) => <span style={{ background: `${c}22`, color: c, fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{children}</span>;

function Header({ user, onSignOut, onManage, isDev }) {
  return (
    <div style={{ background: C.navy, borderBottom: `3px solid ${C.orange}`, padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src={LOGO_URL} alt="logo" style={{ width: 38, height: 38, borderRadius: "50%", border: `2px solid ${C.orange}`, objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
        <span style={{ fontFamily: "'Georgia', serif", fontWeight: 400, fontSize: 20, color: "#fff", letterSpacing: 1 }}>Bridgeland CS Club</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {user && <><span style={{ fontSize: 13, color: "#cdd5e0" }}>{user.name || user.username}</span>
          {user.role !== "member" && <Tag c={user.role === "developer" ? C.orange : C.blue}>{user.role}</Tag>}
          {isDev && <Btn color={C.orange} onClick={onManage} style={{ padding: "5px 12px", fontSize: 12 }}>Members</Btn>}</>}
        <OutBtn onClick={onSignOut} style={{ borderColor: "#ffffff33", color: "#cdd5e0" }}>{user ? "Sign out" : ""}</OutBtn>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(initData);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginErr, setLoginErr] = useState("");
  const [regForm, setRegForm] = useState({ username: "", password: "", name: "" });
  const [regErr, setRegErr] = useState("");
  const [showReg, setShowReg] = useState(false);
  const [modal, setModal] = useState(null);
  const [activeProblem, setActiveProblem] = useState(null);
  const [activeUnit, setActiveUnit] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(DATA_DOC, snap => {
      if (snap.exists()) { setData({ ...initData, ...snap.data() }); }
      else { setDoc(DATA_DOC, initData); }
      setLoading(false);
    }, err => { console.error("Firestore error", err); setLoading(false); });
    return () => unsub();
  }, []);

  const upd = fn => setData(prev => { const next = fn(prev); saveData(next); return next; });
  const isOfficer = user && (user.role === "officer" || user.role === "developer");
  const isDev = user && user.role === "developer";
  const myCompleted = user ? (data.completions[user.username] || []) : [];

  const login = () => {
    if (loginForm.username === DEV_ACCOUNT.username && loginForm.password === DEV_ACCOUNT.password) { setUser(DEV_ACCOUNT); setLoginErr(""); return; }
    const f = data.users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (f) { setUser(f); setLoginErr(""); } else setLoginErr("Invalid username or password.");
  };
  const register = () => {
    if (!regForm.username || !regForm.password || !regForm.name) { setRegErr("All fields required."); return; }
    if (data.users.find(u => u.username === regForm.username) || regForm.username === DEV_ACCOUNT.username) { setRegErr("Username taken."); return; }
    const nu = { username: regForm.username, password: regForm.password, name: regForm.name, role: "member" };
    upd(d => ({ ...d, users: [...d.users, nu] }));
    setUser(nu); setRegErr("");
  };

  const navItems = ["home", "about", "announcements", "events", "resources", "problems", "leaderboard"];
  const navLabels = { home: "Home", about: "About Us", announcements: "Announcements", events: "Events", resources: "Resources", problems: "Problems", leaderboard: "Leaderboard" };
  const navBtn = active => ({ background: active ? `${C.orange}28` : "transparent", color: active ? C.orange : C.muted, border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 400, whiteSpace: "nowrap" });

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter','Segoe UI',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <img src={LOGO_URL} alt="logo" style={{ width: 60, height: 60, borderRadius: "50%", border: `3px solid ${C.orange}`, objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
      <div style={{ color: C.muted, fontSize: 15 }}>Loading Bridgeland CS Club…</div>
    </div>
  );

  if (!user) return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ background: `linear-gradient(135deg,${C.navy} 0%,#0f1117 70%)`, padding: "3rem 1rem 2.5rem", textAlign: "center", borderBottom: `3px solid ${C.orange}` }}>
        <img src={LOGO_URL} alt="logo" style={{ width: 80, height: 80, borderRadius: "50%", border: `3px solid ${C.orange}`, marginBottom: 14, objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
        <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, fontWeight: 400, margin: 0, letterSpacing: 1, color: "#fff", textAlign: "center" }}>Bridgeland CS Club</h1>
        <p style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>Bridgeland High School · Cypress, TX</p>
      </div>
      <div style={{ maxWidth: 380, margin: "0 auto", padding: "2rem 1rem" }}>
        {!showReg ? (
          <div style={cardS}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Sign in</h2>
            <label style={lbl}>Username</label>
            <input style={{ ...inp, marginBottom: 12 }} value={loginForm.username} onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))} placeholder="Username" />
            <label style={lbl}>Password</label>
            <input style={{ ...inp, marginBottom: 16 }} type="password" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} placeholder="Password" onKeyDown={e => e.key === "Enter" && login()} />
            {loginErr && <p style={{ color: C.red, fontSize: 13, margin: "0 0 12px" }}>{loginErr}</p>}
            <Btn style={{ width: "100%", padding: "10px" }} onClick={login}>Sign in</Btn>
            <p style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 12 }}>No account? <span style={{ color: C.orange, cursor: "pointer" }} onClick={() => setShowReg(true)}>Register</span></p>
          </div>
        ) : (
          <div style={cardS}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Create account</h2>
            <label style={lbl}>Full name</label>
            <input style={{ ...inp, marginBottom: 12 }} value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
            <label style={lbl}>Username</label>
            <input style={{ ...inp, marginBottom: 12 }} value={regForm.username} onChange={e => setRegForm(f => ({ ...f, username: e.target.value }))} placeholder="Choose a username" />
            <label style={lbl}>Password</label>
            <input style={{ ...inp, marginBottom: 16 }} type="password" value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} placeholder="Choose a password" />
            {regErr && <p style={{ color: C.red, fontSize: 13, margin: "0 0 12px" }}>{regErr}</p>}
            <Btn style={{ width: "100%", padding: "10px" }} onClick={register}>Create account</Btn>
            <p style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 12 }}><span style={{ color: C.orange, cursor: "pointer" }} onClick={() => setShowReg(false)}>Back to sign in</span></p>
          </div>
        )}
      </div>
    </div>
  );

  if (activeProblem !== null) {
    const prob = data.problems.find(p => p.id === activeProblem.id);
    if (!prob) { setActiveProblem(null); return null; }
    return <ProblemView prob={prob} user={user} data={data} upd={upd} onBack={() => setActiveProblem(null)} unitCtx={activeProblem.unitCtx} onNext={activeProblem.onNext} />;
  }
  if (activeUnit !== null) {
    const unit = data.units.find(u => u.id === activeUnit);
    if (!unit) { setActiveUnit(null); return null; }
    return <UnitView unit={unit} data={data} user={user} upd={upd} onBack={() => setActiveUnit(null)}
      onFinish={() => { setActiveProblem(null); setActiveUnit(null); }}
      onProblem={(pid, ctx) => setActiveProblem({ id: pid, unitCtx: ctx, onNext: ctx.onNext })} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Header user={user} onSignOut={() => { setUser(null); setPage("home"); }} isDev={isDev} onManage={() => setPage("members")} />
      <div style={{ background: "#111827", borderBottom: `1px solid ${C.border}`, padding: "0 1rem", display: "flex", gap: 2, overflowX: "auto" }}>
        {navItems.map(p => <button key={p} style={navBtn(page === p)} onClick={() => setPage(p)}>{navLabels[p]}</button>)}
      </div>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "1.5rem 1rem" }}>

        {page === "home" && (
          <div>
            <div style={{ background: `linear-gradient(135deg,${C.navy}cc,#1a1d27)`, borderRadius: 12, padding: "1.5rem", marginBottom: 24, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 20 }}>
              <img src={LOGO_URL} alt="logo" style={{ width: 60, height: 60, borderRadius: "50%", border: `3px solid ${C.orange}`, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />
              <div>
                <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 22, fontWeight: 400, margin: "0 0 4px" }}>Welcome, {user.name?.split(" ")[0] || user.username}! 👋</h1>
                <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>Bridgeland High School Computer Science Club · Cypress, TX</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 24 }}>
              {[["Members", data.users.length], ["Events", data.events.length], ["Units", data.units.length], ["Problems Solved", myCompleted.length]].map(([l, v]) => (
                <div key={l} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "1rem", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.orange }}>{v}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Top solvers</h3>
            <div style={{ ...cardS, marginBottom: 24, padding: "0.75rem 1rem" }}>
              {[...data.users].map(u => ({ name: u.name || u.username, username: u.username, count: (data.completions[u.username] || []).length }))
                .sort((a, b) => b.count - a.count).slice(0, 3).map((u, i) => (
                  <div key={u.username} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: i === 0 ? `${C.orange}44` : i === 1 ? `${C.blue}44` : `${C.muted}22`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: i === 0 ? C.orange : i === 1 ? C.blue : C.muted, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{u.name}{u.username === user.username && <span style={{ fontSize: 11, color: C.orange, marginLeft: 6 }}>you</span>}</div>
                    <div style={{ fontWeight: 700, color: C.orange }}>{u.count}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>solved</div>
                  </div>
                ))}
              {data.users.length === 0 && <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>No solvers yet.</p>}
            </div>
            <h3 style={{ fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Latest announcements</h3>
            {data.announcements.slice(-2).reverse().map(a => (
              <div key={a.id} style={{ ...cardS, borderLeft: `3px solid ${C.orange}` }}>
                {a.image && <img src={a.image} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 6, marginBottom: 10 }} />}
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: C.muted }}>{a.body}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>{a.date}</div>
              </div>
            ))}
          </div>
        )}

        {page === "about" && <AboutPage data={data} upd={upd} isOfficer={isOfficer} />}

        {page === "announcements" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Announcements</h2>
              {isOfficer && <Btn onClick={() => setModal("ann")}>+ Add</Btn>}
            </div>
            {[...data.announcements].reverse().map(a => (
              <div key={a.id} style={{ ...cardS, borderLeft: `3px solid ${C.orange}` }}>
                {a.image && <img src={a.image} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 6, marginBottom: 10 }} />}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{a.title}</div>
                  {isOfficer && <OutBtn danger onClick={() => upd(d => ({ ...d, announcements: d.announcements.filter(x => x.id !== a.id) }))}>Remove</OutBtn>}
                </div>
                <div style={{ fontSize: 14, color: C.muted, margin: "8px 0" }}>{a.body}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{a.date}</div>
              </div>
            ))}
          </div>
        )}

        {page === "events" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Upcoming Events</h2>
              {isOfficer && <Btn onClick={() => setModal("evt")}>+ Add</Btn>}
            </div>
            {data.events.map(e => (
              <div key={e.id} style={cardS}>
                {e.image && <img src={e.image} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 6, marginBottom: 10 }} />}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{e.title}</div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{e.date} · {e.time} · {e.location}</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>{e.desc}</div>
                  </div>
                  {isOfficer && <OutBtn danger onClick={() => upd(d => ({ ...d, events: d.events.filter(x => x.id !== e.id) }))}>Remove</OutBtn>}
                </div>
              </div>
            ))}
          </div>
        )}

        {page === "resources" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Resources</h2>
              {isOfficer && <Btn onClick={() => setModal("res")}>+ Add</Btn>}
            </div>
            {["meeting", "resource"].map(type => (
              <div key={type}>
                <h3 style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1, margin: "16px 0 8px" }}>{type === "meeting" ? "Past Meetings" : "Helpful Resources"}</h3>
                {data.resources.filter(r => r.type === type).map(r => (
                  <div key={r.id} style={cardS}>
                    {r.image && <img src={r.image} alt="" style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 6, marginBottom: 10 }} />}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 500 }}>{r.title}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <a href={r.url} target="_blank" rel="noreferrer" style={{ color: C.orange, fontSize: 13 }}>Open</a>
                        {isOfficer && <OutBtn danger onClick={() => upd(d => ({ ...d, resources: d.resources.filter(x => x.id !== r.id) }))}>Remove</OutBtn>}
                      </div>
                    </div>
                  </div>
                ))}
                {data.resources.filter(r => r.type === type).length === 0 && <p style={{ color: C.muted, fontSize: 13 }}>None yet.</p>}
              </div>
            ))}
          </div>
        )}

        {page === "problems" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>Problems</h2>
              {isOfficer && <div style={{ display: "flex", gap: 8 }}><Btn color={C.blue} onClick={() => setModal("prob")}>+ New problem</Btn><Btn onClick={() => setModal("unit")}>+ New unit</Btn></div>}
            </div>
            <div style={{ background: `${C.orange}18`, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: C.orange }}>Units group problems together. Start a unit to go through them back-to-back.</div>
            {data.units.length === 0 && <p style={{ color: C.muted }}>No units yet.</p>}
            {data.units.map(unit => {
              const probs = unit.problemIds.map(id => data.problems.find(p => p.id === id)).filter(Boolean);
              const solved = probs.filter(p => myCompleted.includes(p.id)).length;
              return (
                <div key={unit.id} style={{ ...cardS, cursor: "pointer" }} onClick={() => setActiveUnit(unit.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{unit.title}</div>
                      {unit.desc && <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>{unit.desc}</div>}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{probs.map(p => <Tag key={p.id} c={diffColor[p.difficulty]}>{p.title}</Tag>)}</div>
                    </div>
                    <div style={{ textAlign: "right", marginLeft: 16, flexShrink: 0 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: C.orange }}>{solved}/{probs.length}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>solved</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                    <Btn onClick={e => { e.stopPropagation(); setActiveUnit(unit.id); }}>Start unit →</Btn>
                    {isOfficer && <OutBtn danger onClick={e => { e.stopPropagation(); upd(d => ({ ...d, units: d.units.filter(x => x.id !== unit.id) })); }}>Remove</OutBtn>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {page === "leaderboard" && <LeaderboardPage data={data} user={user} />}

        {page === "members" && isDev && (
          <div>
            <h2>Manage Members</h2>
            {data.users.filter(u => u.username !== DEV_ACCOUNT.username).map(u => (
              <div key={u.username} style={{ ...cardS, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{u.name || u.username}</span>
                  <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>@{u.username}</span>
                  <Tag c={u.role === "officer" ? C.blue : C.muted}>{u.role}</Tag>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {u.role === "member" && <Btn color={C.blue} onClick={() => upd(d => ({ ...d, users: d.users.map(x => x.username === u.username ? { ...x, role: "officer" } : x) }))}>Make officer</Btn>}
                  {u.role === "officer" && <Btn onClick={() => upd(d => ({ ...d, users: d.users.map(x => x.username === u.username ? { ...x, role: "member" } : x) }))}>Demote</Btn>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {modal && <ModalBox modal={modal} setModal={setModal} data={data} upd={upd} />}
    </div>
  );
}

function OfficerImgPick({ image, onPick }) {
  const ref = useRef();
  return (
    <div style={{ marginBottom: 8 }}>
      <button type="button" onClick={() => ref.current.click()} style={{ background: C.bgInput, border: `1px dashed ${C.border}`, color: C.muted, padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, width: "100%" }}>{image ? "Change photo" : "Upload photo"}</button>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={async e => { if (e.target.files[0]) onPick(await toB64(e.target.files[0])); }} />
    </div>
  );
}

function AboutPage({ data, upd, isOfficer }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const ref = useRef();
  const startEdit = () => { setDraft(JSON.parse(JSON.stringify(data.about))); setEditing(true); };
  const save = () => { upd(d => ({ ...d, about: draft })); setEditing(false); };
  const addImg = async file => { const b = await toB64(file); setDraft(d => ({ ...d, images: [...(d.images || []), b] })); };
  const about = editing ? draft : data.about;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>About Us</h2>
        {isOfficer && !editing && <Btn onClick={startEdit}>Edit page</Btn>}
        {editing && <div style={{ display: "flex", gap: 8 }}><OutBtn onClick={() => setEditing(false)}>Cancel</OutBtn><Btn onClick={save}>Save</Btn></div>}
      </div>
      <div style={{ ...cardS, marginBottom: 20 }}>
        {editing ? (
          <>
            <label style={lbl}>Heading</label>
            <input style={{ ...inp, marginBottom: 12 }} value={draft.heading} onChange={e => setDraft(d => ({ ...d, heading: e.target.value }))} />
            <label style={lbl}>Body text</label>
            <textarea style={{ ...inp, minHeight: 140, resize: "vertical" }} value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))} />
          </>
        ) : (
          <>
            <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 20, fontWeight: 400, marginTop: 0, marginBottom: 12, color: C.orange }}>{about.heading}</h3>
            {about.body.split("\n").map((line, i) => line ? <p key={i} style={{ margin: "0 0 10px", lineHeight: 1.7 }}>{line}</p> : <br key={i} />)}
          </>
        )}
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Photos</h3>
          {editing && <><Btn color={C.blue} onClick={() => ref.current.click()} style={{ fontSize: 12, padding: "5px 12px" }}>+ Add photo</Btn><input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) addImg(e.target.files[0]); }} /></>}
        </div>
        {(about.images || []).length === 0 && !editing && <p style={{ color: C.muted, fontSize: 13 }}>No photos yet.</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
          {(about.images || []).map((img, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={img} alt="" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}` }} />
              {editing && <button onClick={() => setDraft(d => ({ ...d, images: d.images.filter((_, j) => j !== i) }))} style={{ position: "absolute", top: 6, right: 6, background: C.red, color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Officers</h3>
          {editing && <Btn color={C.blue} onClick={() => setDraft(d => ({ ...d, officers: [...(d.officers || []), { name: "", role: "Officer", image: "" }] }))} style={{ fontSize: 12, padding: "5px 12px" }}>+ Add officer</Btn>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
          {(about.officers || []).map((o, i) => (
            <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
              {o.image ? <img src={o.image} alt={o.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.orange}`, margin: "0 auto 8px", display: "block" }} />
                : <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${C.orange}33`, border: `2px solid ${C.orange}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontWeight: 700, fontSize: 20, color: C.orange }}>{(o.name || "?")[0]}</div>}
              {editing ? (
                <>
                  <OfficerImgPick image={o.image} onPick={v => { const os = [...draft.officers]; os[i] = { ...os[i], image: v }; setDraft(d => ({ ...d, officers: os })); }} />
                  <input style={{ ...inp, marginBottom: 6, textAlign: "center", fontSize: 13 }} value={o.name} placeholder="Name" onChange={e => { const os = [...draft.officers]; os[i] = { ...os[i], name: e.target.value }; setDraft(d => ({ ...d, officers: os })); }} />
                  <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
                    {["Officer", "President"].map(r => (
                      <button key={r} type="button" onClick={() => { const os = [...draft.officers]; os[i] = { ...os[i], role: r }; setDraft(d => ({ ...d, officers: os })); }}
                        style={{ flex: 1, padding: "7px 0", fontSize: 12, fontWeight: o.role === r ? 700 : 400, border: "none", cursor: "pointer", background: o.role === r ? C.orange : C.bgInput, color: o.role === r ? "#fff" : C.muted, transition: "all 0.15s" }}>{r}</button>
                    ))}
                  </div>
                  <button onClick={() => setDraft(d => ({ ...d, officers: d.officers.filter((_, j) => j !== i) }))} style={{ marginTop: 6, background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 12 }}>Remove</button>
                </>
              ) : (
                <><div style={{ fontWeight: 600, fontSize: 14 }}>{o.name || "—"}</div><div style={{ fontSize: 12, color: C.orange, marginTop: 2 }}>{o.role}</div></>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UnitView({ unit, data, user, upd, onBack, onFinish, onProblem }) {
  const probs = unit.problemIds.map(id => data.problems.find(p => p.id === id)).filter(Boolean);
  const myCompleted = user ? (data.completions[user.username] || []) : [];
  const startUnit = () => {
    if (!probs.length) return;
    const go = idx => { if (idx >= probs.length) { onFinish ? onFinish() : onBack(); return; } onProblem(probs[idx].id, { unitTitle: unit.title, index: idx, total: probs.length, onNext: () => go(idx + 1) }); };
    go(0);
  };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Header user={user} onSignOut={() => {}} isDev={false} onManage={() => {}} />
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>
        <OutBtn onClick={onBack} style={{ marginBottom: 16 }}>← Back to Problems</OutBtn>
        <div style={{ background: `linear-gradient(135deg,${C.navy}99,#1a1d27)`, borderRadius: 12, padding: "1.5rem", marginBottom: 24, border: `1px solid ${C.border}` }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 22, fontFamily: "'Georgia',serif", fontWeight: 400 }}>{unit.title}</h2>
          {unit.desc && <p style={{ color: C.muted, margin: "0 0 16px", fontSize: 14 }}>{unit.desc}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: C.muted }}>{probs.length} problems · {probs.filter(p => myCompleted.includes(p.id)).length} solved</span>
            <Btn onClick={startUnit}>Start unit →</Btn>
          </div>
        </div>
        {probs.map((p, i) => {
          const done = myCompleted.includes(p.id);
          return (
            <div key={p.id} style={{ ...cardS, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${done ? C.green : C.border}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: done ? "#fff" : C.muted, flexShrink: 0 }}>{done ? "✓" : i + 1}</div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontWeight: 600 }}>{p.title}</span><Tag c={diffColor[p.difficulty]}>{p.difficulty}</Tag></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProblemView({ prob, user, data, upd, onBack, unitCtx, onNext }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const completed = (data.completions[user.username] || []).includes(prob.id);
  const submit = () => {
    if (selected === null) return;
    const correct = selected === prob.answer;
    setResult(correct); setSubmitted(true);
    upd(d => {
      const today = new Date().toISOString().slice(0, 10);
      const userAttempts = d.attempts[user.username] || { total: 0, correct: 0 };
      const newAttempts = { total: userAttempts.total + 1, correct: userAttempts.correct + (correct ? 1 : 0) };
      const s = d.streaks[user.username] || { lastDate: null, current: 0, best: 0 };
      let newStreak = { ...s };
      if (correct) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (s.lastDate === today) {}
        else if (s.lastDate === yesterday) { newStreak.current = s.current + 1; newStreak.lastDate = today; }
        else { newStreak.current = 1; newStreak.lastDate = today; }
        if (newStreak.current > newStreak.best) newStreak.best = newStreak.current;
      }
      const completions = correct && !completed ? { ...d.completions, [user.username]: [...(d.completions[user.username] || []), prob.id] } : d.completions;
      return { ...d, completions, attempts: { ...d.attempts, [user.username]: newAttempts }, streaks: { ...d.streaks, [user.username]: newStreak } };
    });
  };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Header user={user} onSignOut={() => {}} isDev={false} onManage={() => {}} />
      {unitCtx && (
        <div style={{ background: "#111827", padding: "8px 1.5rem", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: C.muted }}>{unitCtx.unitTitle}</span>
          <span style={{ fontSize: 12, color: C.muted }}>·</span>
          <span style={{ fontSize: 13, color: C.orange, fontWeight: 600 }}>Question {unitCtx.index + 1} of {unitCtx.total}</span>
          <div style={{ flex: 1, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((unitCtx.index + 1) / unitCtx.total) * 100}%`, background: C.orange, borderRadius: 2 }} />
          </div>
        </div>
      )}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>
        <OutBtn onClick={onBack} style={{ marginBottom: 20 }}>← {unitCtx ? unitCtx.unitTitle : "Back"}</OutBtn>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 20 }}>{prob.title}</span>
          <Tag c={diffColor[prob.difficulty]}>{prob.difficulty}</Tag>
          {completed && !submitted && <Tag c={C.green}>Already solved</Tag>}
        </div>
        <div style={{ ...cardS, fontSize: 16, lineHeight: 1.7, marginBottom: 20 }}>{prob.desc}</div>
        <div style={{ marginBottom: 24 }}>
          {prob.choices.map((ch, i) => {
            let bg = C.bgCard, border = C.border, color = C.text;
            if (submitted) { if (i === prob.answer) { bg = `${C.green}22`; border = C.green; color = C.green; } else if (i === selected) { bg = `${C.red}22`; border = C.red; color = C.red; } }
            else if (selected === i) { bg = `${C.orange}22`; border = C.orange; color = C.orange; }
            return (
              <div key={i} onClick={() => !submitted && setSelected(i)} style={{ background: bg, border: `1.5px solid ${border}`, color, borderRadius: 8, padding: "12px 16px", marginBottom: 10, cursor: submitted ? "default" : "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", border: `1.5px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0, color }}>{String.fromCharCode(65 + i)}</div>
                <span style={{ fontSize: 15 }}>{ch}</span>
                {submitted && i === prob.answer && <span style={{ marginLeft: "auto", fontWeight: 700 }}>✓ Correct</span>}
                {submitted && i === selected && i !== prob.answer && <span style={{ marginLeft: "auto", fontWeight: 700 }}>✗ Wrong</span>}
              </div>
            );
          })}
        </div>
        {!submitted ? <Btn disabled={selected === null} onClick={submit} style={{ padding: "10px 28px" }}>Submit answer</Btn> : (
          <div>
            <div style={{ background: result ? `${C.green}22` : `${C.red}22`, border: `1px solid ${result ? C.green : C.red}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: result ? C.green : C.red, fontWeight: 600 }}>
              {result ? "Correct! +1 added to your score. 🎉" : "Not quite — the correct answer is highlighted above."}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <OutBtn onClick={onBack}>{unitCtx ? "Back to unit" : "Back to problems"}</OutBtn>
              {unitCtx && onNext && <Btn onClick={onNext}>{unitCtx.index + 1 < unitCtx.total ? "Next question →" : "Finish unit ✓"}</Btn>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardPage({ data, user }) {
  const [lbTab, setLbTab] = useState("solved");
  const medal = i => i === 0 ? C.orange : i === 1 ? C.blue : C.muted;
  const medalBg = i => i === 0 ? `${C.orange}44` : i === 1 ? `${C.blue}44` : C.border;
  const solvedRows = [...data.users].map(u => ({ name: u.name || u.username, username: u.username, value: (data.completions[u.username] || []).length, label: "solved" })).sort((a, b) => b.value - a.value);
  const accuracyRows = [...data.users].map(u => { const a = data.attempts[u.username] || { total: 0, correct: 0 }; return { name: u.name || u.username, username: u.username, value: a.total > 0 ? Math.round((a.correct / a.total) * 100) : 0, sub: `${a.correct || 0}/${a.total || 0} attempts`, label: "%" }; }).sort((a, b) => b.value - a.value);
  const streakRows = [...data.users].map(u => { const s = data.streaks[u.username] || { current: 0, best: 0 }; return { name: u.name || u.username, username: u.username, value: s.current, sub: `Best: ${s.best}`, label: "day streak" }; }).sort((a, b) => b.value - a.value);
  const rows = lbTab === "solved" ? solvedRows : lbTab === "accuracy" ? accuracyRows : streakRows;
  const tabBtn = t => ({ background: lbTab === t ? `${C.orange}28` : "transparent", color: lbTab === t ? C.orange : C.muted, border: `1px solid ${lbTab === t ? C.orange : C.border}`, padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: lbTab === t ? 700 : 400 });
  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Leaderboard</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button style={tabBtn("solved")} onClick={() => setLbTab("solved")}>Problems Solved</button>
        <button style={tabBtn("accuracy")} onClick={() => setLbTab("accuracy")}>Accuracy</button>
        <button style={tabBtn("streak")} onClick={() => setLbTab("streak")}>Daily Streak</button>
      </div>
      {rows.map((u, i) => (
        <div key={u.username} style={{ ...cardS, display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: medalBg(i), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: medal(i), flexShrink: 0 }}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600 }}>{u.name}</span>
            {u.username === user.username && <span style={{ fontSize: 11, color: C.orange, marginLeft: 8 }}>you</span>}
            {u.sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{u.sub}</div>}
          </div>
          <div style={{ fontWeight: 700, color: C.orange, fontSize: 18 }}>{u.value}{u.label === "%" ? "%" : ""}</div>
          {u.label !== "%" && <div style={{ fontSize: 12, color: C.muted }}>{u.label}</div>}
        </div>
      ))}
    </div>
  );
}

function ModalBox({ modal, setModal, data, upd }) {
  const [f, setF] = useState({ type: "resource", difficulty: "Easy", choices: ["", "", "", ""], answer: 0, image: "", selectedProblemIds: [], title: "", body: "", date: "", time: "", location: "", desc: "", url: "", name: "" });
  const set = patch => setF(prev => ({ ...prev, ...patch }));
  const setChoice = (i, v) => setF(p => { const c = [...p.choices]; c[i] = v; return { ...p, choices: c }; });
  const toggleProb = id => setF(p => ({ ...p, selectedProblemIds: p.selectedProblemIds.includes(id) ? p.selectedProblemIds.filter(x => x !== id) : [...p.selectedProblemIds, id] }));
  const close = () => setModal(null);
  const submit = () => {
    if (modal === "ann") { if (!f.title || !f.body) return; upd(d => ({ ...d, announcements: [...d.announcements, { id: Date.now(), title: f.title, body: f.body, date: new Date().toISOString().slice(0, 10), image: f.image || "" }] })); }
    else if (modal === "evt") { if (!f.title || !f.date) return; upd(d => ({ ...d, events: [...d.events, { id: Date.now(), title: f.title, date: f.date, time: f.time || "TBD", location: f.location || "TBD", desc: f.desc || "", image: f.image || "" }] })); }
    else if (modal === "res") { if (!f.title || !f.url) return; upd(d => ({ ...d, resources: [...d.resources, { id: Date.now(), title: f.title, url: f.url, type: f.type, image: f.image || "" }] })); }
    else if (modal === "prob") { if (!f.title || !f.desc || f.choices.some(c => !c)) return; upd(d => ({ ...d, problems: [...d.problems, { id: Date.now(), title: f.title, difficulty: f.difficulty, desc: f.desc, choices: f.choices, answer: Number(f.answer) }] })); }
    else if (modal === "unit") { if (!f.title || !f.selectedProblemIds.length) return; upd(d => ({ ...d, units: [...d.units, { id: Date.now(), title: f.title, desc: f.desc || "", problemIds: f.selectedProblemIds }] })); }
    close();
  };
  const titles = { ann: "New Announcement", evt: "New Event", res: "New Resource", prob: "New Problem", unit: "Create Unit" };
  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
  const box = { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "1.5rem", width: "90%", maxWidth: ["prob", "unit"].includes(modal) ? 520 : 430, maxHeight: "88vh", overflowY: "auto" };
  return (
    <div style={overlay} onClick={close}>
      <div style={box} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>{titles[modal]}</h3>
        {modal === "ann" && <><label style={lbl}>Title</label><input style={{ ...inp, marginBottom: 10 }} value={f.title} onChange={e => set({ title: e.target.value })} /><label style={lbl}>Body</label><textarea style={{ ...inp, height: 80, resize: "vertical", marginBottom: 10 }} value={f.body} onChange={e => set({ body: e.target.value })} /><ImgPick preview={f.image} onPick={v => set({ image: v })} /></>}
        {modal === "evt" && <><label style={lbl}>Title</label><input style={{ ...inp, marginBottom: 10 }} value={f.title} onChange={e => set({ title: e.target.value })} /><label style={lbl}>Date</label><input type="date" style={{ ...inp, marginBottom: 10 }} value={f.date} onChange={e => set({ date: e.target.value })} /><label style={lbl}>Time</label><input style={{ ...inp, marginBottom: 10 }} value={f.time} placeholder="e.g. 3:30 PM" onChange={e => set({ time: e.target.value })} /><label style={lbl}>Location</label><input style={{ ...inp, marginBottom: 10 }} value={f.location} onChange={e => set({ location: e.target.value })} /><label style={lbl}>Description</label><input style={{ ...inp, marginBottom: 10 }} value={f.desc} onChange={e => set({ desc: e.target.value })} /><ImgPick preview={f.image} onPick={v => set({ image: v })} /></>}
        {modal === "res" && <><label style={lbl}>Title</label><input style={{ ...inp, marginBottom: 10 }} value={f.title} onChange={e => set({ title: e.target.value })} /><label style={lbl}>URL</label><input style={{ ...inp, marginBottom: 10 }} value={f.url} placeholder="https://..." onChange={e => set({ url: e.target.value })} /><label style={lbl}>Type</label><select style={{ ...inp, marginBottom: 10 }} value={f.type} onChange={e => set({ type: e.target.value })}><option value="resource">Helpful resource</option><option value="meeting">Meeting notes</option></select><ImgPick preview={f.image} onPick={v => set({ image: v })} /></>}
        {modal === "prob" && <><label style={lbl}>Problem title</label><input style={{ ...inp, marginBottom: 10 }} value={f.title} onChange={e => set({ title: e.target.value })} /><label style={lbl}>Difficulty</label><select style={{ ...inp, marginBottom: 10 }} value={f.difficulty} onChange={e => set({ difficulty: e.target.value })}><option>Easy</option><option>Medium</option><option>Hard</option></select><label style={lbl}>Question</label><textarea style={{ ...inp, height: 72, resize: "vertical", marginBottom: 14 }} value={f.desc} onChange={e => set({ desc: e.target.value })} /><label style={lbl}>Answer choices — select the correct one</label>{[0,1,2,3].map(i => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><input type="radio" name="ans" checked={Number(f.answer)===i} onChange={() => set({ answer: i })} style={{ accentColor: C.orange, flexShrink: 0 }} /><div style={{ width: 24, height: 24, borderRadius: "50%", background: `${C.orange}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.orange, flexShrink: 0 }}>{String.fromCharCode(65+i)}</div><input style={inp} value={f.choices[i]} placeholder={`Choice ${String.fromCharCode(65+i)}`} onChange={e => setChoice(i, e.target.value)} /></div>))}</>}
        {modal === "unit" && <><label style={lbl}>Unit title</label><input style={{ ...inp, marginBottom: 10 }} value={f.title} placeholder="e.g. Intro to Data Structures" onChange={e => set({ title: e.target.value })} /><label style={lbl}>Description (optional)</label><input style={{ ...inp, marginBottom: 14 }} value={f.desc} placeholder="Brief description" onChange={e => set({ desc: e.target.value })} /><label style={lbl}>Select problems</label><div style={{ maxHeight: 220, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, marginBottom: 12 }}>{data.problems.length === 0 && <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>No problems yet. Create some first.</p>}{data.problems.map(p => { const sel = f.selectedProblemIds.includes(p.id); return (<div key={p.id} onClick={() => toggleProb(p.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, cursor: "pointer", background: sel ? `${C.orange}18` : "transparent", border: `1px solid ${sel ? C.orange : "transparent"}`, marginBottom: 4 }}><div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? C.orange : C.border}`, background: sel ? C.orange : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{sel && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}</div><span style={{ flex: 1, fontSize: 14 }}>{p.title}</span><Tag c={diffColor[p.difficulty]}>{p.difficulty}</Tag></div>); })}</div>{f.selectedProblemIds.length > 0 && <p style={{ fontSize: 12, color: C.orange, margin: "0 0 4px" }}>{f.selectedProblemIds.length} problem{f.selectedProblemIds.length > 1 ? "s" : ""} selected</p>}</>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <OutBtn onClick={close}>Cancel</OutBtn>
          <Btn onClick={submit}>{modal === "unit" ? "Create unit" : "Add"}</Btn>
        </div>
      </div>
    </div>
  );
}
