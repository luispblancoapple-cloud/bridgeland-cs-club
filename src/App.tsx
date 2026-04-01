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
const GUEST_USER = { username: "__guest__", name: "Guest", role: "guest" };
const LOGO_URL = "https://pbs.twimg.com/profile_images/1405677956082630657/5PhDfiOI_400x400.jpg";

const C = {
  bg: "#0f1117", bgCard: "#1a1d27", bgInput: "#12141c", border: "#2a2d3a",
  navy: "#1a3a6b", orange: "#f97316", text: "#e2e8f0", muted: "#94a3b8",
  green: "#22c55e", red: "#ef4444", blue: "#3b82f6", guest: "#64748b",
};

const diffColor = { Easy: C.green, Medium: C.orange, Hard: C.red };

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const HOURS = ["12","1","2","3","4","5","6","7","8","9","10","11"];
const MINS = ["00","15","30","45"];
const AMPM = ["AM","PM"];

function DatePicker({ value, onChange }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(value ? parseInt(value.slice(0,4)) : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value ? parseInt(value.slice(5,7))-1 : today.getMonth());
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const selDay = value ? parseInt(value.slice(8,10)) : null;
  const selMonth = value ? parseInt(value.slice(5,7))-1 : null;
  const selYear = value ? parseInt(value.slice(0,4)) : null;
  const pad = n => String(n).padStart(2,"0");
  const pick = d => onChange(`${viewYear}-${pad(viewMonth+1)}-${pad(d)}`);
  const prevM = () => { if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); };
  const nextM = () => { if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); };
  return (
    <div style={{ background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, userSelect: "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button type="button" onClick={prevM} style={{ background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:18,padding:"0 6px" }}>‹</button>
        <span style={{ fontWeight:600, fontSize:14, color:C.text }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextM} style={{ background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:18,padding:"0 6px" }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:C.muted,padding:"2px 0"}}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {Array(firstDay).fill(null).map((_,i)=><div key={"e"+i}/>)}
        {Array(daysInMonth).fill(null).map((_,i)=>{
          const d=i+1;
          const sel=selDay===d&&selMonth===viewMonth&&selYear===viewYear;
          const isToday=d===today.getDate()&&viewMonth===today.getMonth()&&viewYear===today.getFullYear();
          return <button key={d} type="button" onClick={()=>pick(d)} style={{ background:sel?C.orange:isToday?`${C.orange}22`:"transparent", color:sel?"#fff":isToday?C.orange:C.text, border:sel?`1px solid ${C.orange}`:`1px solid transparent`, borderRadius:6, padding:"5px 0", fontSize:13, cursor:"pointer", fontWeight:sel?700:400 }}>{d}</button>;
        })}
      </div>
    </div>
  );
}

function TimePicker({ value, onChange }) {
  const parts = value ? value.match(/(\d+):(\d+)\s*(AM|PM)/i) : null;
  const [h, setH] = useState(parts ? parts[1] : "2");
  const [m, setM] = useState(parts ? parts[2] : "40");
  const [ap, setAp] = useState(parts ? parts[3].toUpperCase() : "PM");
  useEffect(() => { onChange(`${h}:${m} ${ap}`); }, [h, m, ap]);
  const pill = (active, label, onClick) => (
    <button type="button" onClick={onClick} style={{ padding:"5px 10px", fontSize:13, border:`1px solid ${active?C.orange:C.border}`, borderRadius:6, background:active?C.orange:C.bgCard, color:active?"#fff":C.muted, cursor:"pointer", fontWeight:active?700:400 }}>{label}</button>
  );
  return (
    <div style={{ background:C.bgInput, border:`1px solid ${C.border}`, borderRadius:8, padding:12 }}>
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>Hour</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
          {HOURS.map(hh=>pill(h===hh, hh, ()=>setH(hh)))}
        </div>
      </div>
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>Minutes</div>
        <div style={{ display:"flex", gap:4 }}>
          {MINS.map(mm=>pill(m===mm, mm, ()=>setM(mm)))}
        </div>
      </div>
      <div>
        <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>AM / PM</div>
        <div style={{ display:"flex", gap:4 }}>
          {AMPM.map(a=>pill(ap===a, a, ()=>setAp(a)))}
        </div>
      </div>
    </div>
  );
}

const initData = {
  users: [DEV_ACCOUNT],
  announcements: [
    { id: 1, title: "Welcome to Bridgeland CS Club!", body: "We meet every Monday and Thursday from 2:40–3:50 PM. Come join us!", date: "2025-08-28", image: "" },
    { id: 2, title: "UIL Competition Signups Open", body: "Sign up for UIL CS competition. Practice sessions start next week.", date: "2025-09-02", image: "" },
  ],
  events: [
    { id: 1, title: "Weekly Meeting", date: "2025-09-06", time: "2:40 PM", location: "Room 214", desc: "Regular weekly meeting. Bring your laptops!", image: "" },
    { id: 2, title: "Hackathon Prep", date: "2025-09-13", time: "2:40 PM", location: "Room 214", desc: "Prepare for upcoming hackathon season.", image: "" },
  ],
  resources: [
    { id: "f1", title: "Meeting Notes", isFolder: true, items: [
      { id: 1, title: "Meeting Notes — Aug 28", url: "https://docs.google.com", image: "" }
    ]},
    { id: "f2", title: "Learning Resources", isFolder: true, items: [
      { id: 2, title: "Python Crash Course", url: "https://learnpython.org", image: "" },
      { id: 3, title: "LeetCode", url: "https://leetcode.com", image: "" },
    ]},
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
  officerTasks: [],
  officerEvents: [],
  googleCalendarId: "",
  about: {
    heading: "About Bridgeland CS Club",
    body: "We are a community of students passionate about computer science, coding, and technology. Whether you're a beginner or an experienced programmer, there's a place for you here!\n\nWe meet every Monday and Thursday from 2:40–3:50 PM to learn new concepts, practice for UIL competitions, work on projects, and have fun. Join us and be part of something great.",
    images: [],
    officers: [{ name: "President", role: "President", image: "" }, { name: "Vice President", role: "Officer", image: "" }],
    contacts: [],
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
        {user && <>
          <span style={{ fontSize: 13, color: "#cdd5e0" }}>{user.name || user.username}</span>
          {user.role !== "member" && user.role !== "guest" && <Tag c={user.role === "developer" ? C.orange : user.role === "officer" ? C.blue : C.guest}>{user.role}</Tag>}
          {user.role === "guest" && <Tag c={C.guest}>guest</Tag>}
          {isDev && <Btn color={C.orange} onClick={onManage} style={{ padding: "5px 12px", fontSize: 12 }}>Members</Btn>}
        </>}
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
  const isGuest = user && user.role === "guest";
  const myCompleted = user && !isGuest ? (data.completions[user.username] || []) : [];

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

  const allNavItems = ["home", "about", "announcements", "events", "resources", "problems", "leaderboard"];
  const officerNavItems = [...allNavItems, "officers"];
  const navItems = isOfficer ? officerNavItems : allNavItems;
  const navLabels = { home: "Home", about: "About Us", announcements: "Announcements", events: "Events", resources: "Resources", problems: "Problems", leaderboard: "Leaderboard", officers: "Officers" };
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: 12, color: C.muted }}>or</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>
            <button onClick={() => setUser(GUEST_USER)} style={{ width: "100%", padding: "10px", background: C.bgInput, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Inter','Segoe UI',sans-serif" }}>Continue as Guest</button>
            <p style={{ textAlign: "center", fontSize: 12, color: C.muted, marginTop: 8 }}>Guests can browse but cannot do problems or appear on the leaderboard.</p>
            <p style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 8 }}>No account? <span style={{ color: C.orange, cursor: "pointer" }} onClick={() => setShowReg(true)}>Register</span></p>
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

        {/* HOME */}
        {page === "home" && (
          <div>
            <div style={{ background: `linear-gradient(135deg,${C.navy}cc,#1a1d27)`, borderRadius: 12, padding: "1.5rem", marginBottom: 24, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 20 }}>
              <img src={LOGO_URL} alt="logo" style={{ width: 60, height: 60, borderRadius: "50%", border: `3px solid ${C.orange}`, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />
              <div>
                <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 22, fontWeight: 400, margin: "0 0 4px" }}>Welcome, {user.name?.split(" ")[0] || user.username}! 👋</h1>
                <p style={{ color: C.muted, margin: "0 0 8px", fontSize: 14 }}>Bridgeland High School Computer Science Club · Cypress, TX</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${C.orange}22`, border: `1px solid ${C.orange}44`, borderRadius: 8, padding: "6px 14px" }}>
                  <span style={{ fontSize: 15, color: C.orange, fontWeight: 700 }}>📅 Mon & Thu · 2:40 – 3:50 PM</span>
                </div>
              </div>
            </div>
            {!isGuest && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 24 }}>
                {[["Members", data.users.length], ["Events", data.events.length], ["Units", data.units.length], ["Problems Solved", myCompleted.length]].map(([l, v]) => (
                  <div key={l} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: C.orange }}>{v}</div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
            {isGuest && (
              <div style={{ ...cardS, borderLeft: `3px solid ${C.guest}`, marginBottom: 24 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.guest, marginBottom: 4 }}>Browsing as Guest</div>
                <div style={{ fontSize: 13, color: C.muted }}>Sign in or create an account to do practice problems and appear on the leaderboard.</div>
              </div>
            )}
            {!isGuest && (
              <>
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
              </>
            )}
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

        {/* ABOUT */}
        {page === "about" && <AboutPage data={data} upd={upd} isOfficer={isOfficer} />}

        {/* ANNOUNCEMENTS */}
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

        {/* EVENTS */}
        {page === "events" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Upcoming Events</h2>
              {isOfficer && <Btn onClick={() => setModal("evt")}>+ Add</Btn>}
            </div>
            {data.googleCalendarId && (
              <div style={{ marginBottom: 24, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <iframe
                  src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(data.googleCalendarId)}&ctz=America%2FChicago&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&mode=AGENDA&bgcolor=%230f1117&color=%23f97316`}
                  style={{ width: "100%", height: 400, border: 0, display: "block" }}
                  frameBorder="0"
                  scrolling="no"
                  title="Google Calendar"
                />
              </div>
            )}
            {!data.googleCalendarId && isDev && (
              <div style={{ ...cardS, marginBottom: 16, borderLeft: `3px solid ${C.blue}` }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Add Google Calendar</div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>Paste your Google Calendar ID to embed it here. Found in Calendar Settings → Integrate calendar.</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input style={{ ...inp }} placeholder="your_calendar@group.calendar.google.com" id="gcal-input" />
                  <Btn color={C.blue} onClick={() => { const v = document.getElementById("gcal-input").value.trim(); if(v) upd(d=>({...d,googleCalendarId:v})); }}>Save</Btn>
                </div>
              </div>
            )}
            {data.googleCalendarId && isDev && (
              <div style={{ marginBottom: 12, textAlign: "right" }}>
                <OutBtn danger onClick={() => upd(d => ({ ...d, googleCalendarId: "" }))}>Remove calendar</OutBtn>
              </div>
            )}
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

        {/* RESOURCES */}
        {page === "resources" && <ResourcesPage data={data} upd={upd} isOfficer={isOfficer} />}

        {/* PROBLEMS */}
        {page === "problems" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>Problems</h2>
              {isOfficer && <div style={{ display: "flex", gap: 8 }}><Btn color={C.blue} onClick={() => setModal("prob")}>+ New problem</Btn><Btn onClick={() => setModal("unit")}>+ New unit</Btn></div>}
            </div>
            {isGuest ? (
              <div style={{ ...cardS, borderLeft: `3px solid ${C.guest}`, textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Sign in to practice</div>
                <div style={{ fontSize: 14, color: C.muted }}>Create a free account to access all practice problems, track your progress, and appear on the leaderboard.</div>
              </div>
            ) : (
              <>
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
                        {isOfficer && <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
                          <Btn color={C.blue} onClick={() => setModal({ type: "editUnit", unit })}>Edit problems</Btn>
                          <OutBtn danger onClick={() => upd(d => ({ ...d, units: d.units.filter(x => x.id !== unit.id) }))}>Remove</OutBtn>
                        </div>}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* LEADERBOARD */}
        {page === "leaderboard" && (
          isGuest ? (
            <div style={{ ...cardS, borderLeft: `3px solid ${C.guest}`, textAlign: "center", padding: "2rem" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Sign in to view the leaderboard</div>
              <div style={{ fontSize: 14, color: C.muted }}>Create a free account to track your rank and compete with other members.</div>
            </div>
          ) : <LeaderboardPage data={data} user={user} />
        )}

        {/* OFFICERS (officer/dev only) */}
        {page === "officers" && isOfficer && <OfficersPage data={data} upd={upd} isDev={isDev} />}

        {/* MEMBERS (dev only) */}
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
                  {u.role === "officer" && <Btn color={C.muted} onClick={() => upd(d => ({ ...d, users: d.users.map(x => x.username === u.username ? { ...x, role: "member" } : x) }))}>Demote</Btn>}
                  <OutBtn danger onClick={() => upd(d => ({ ...d, users: d.users.filter(x => x.username !== u.username) }))}>Delete</OutBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {modal && <ModalBox modal={modal} setModal={setModal} data={data} upd={upd} isDev={isDev} />}
    </div>
  );
}

/* ---- RESOURCES PAGE ---- */
function ResourcesPage({ data, upd, isOfficer }) {
  const [openFolders, setOpenFolders] = useState({});
  const [addingTo, setAddingTo] = useState(null);
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const [newFolder, setNewFolder] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const folders = data.resources || [];

  const toggleFolder = id => setOpenFolders(o => ({ ...o, [id]: !o[id] }));
  const addFolder = () => {
    if (!newFolder.trim()) return;
    upd(d => ({ ...d, resources: [...(d.resources||[]), { id: `f${Date.now()}`, title: newFolder.trim(), isFolder: true, items: [] }] }));
    setNewFolder(""); setShowNewFolder(false);
  };
  const addItem = folderId => {
    if (!newLink.title || !newLink.url) return;
    upd(d => ({ ...d, resources: (d.resources||[]).map(f => f.id === folderId ? { ...f, items: [...(f.items||[]), { id: Date.now(), title: newLink.title, url: newLink.url, image: "" }] } : f) }));
    setNewLink({ title: "", url: "" }); setAddingTo(null);
  };
  const removeItem = (folderId, itemId) => upd(d => ({ ...d, resources: (d.resources||[]).map(f => f.id === folderId ? { ...f, items: (f.items||[]).filter(i => i.id !== itemId) } : f) }));
  const removeFolder = folderId => upd(d => ({ ...d, resources: (d.resources||[]).filter(f => f.id !== folderId) }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Resources</h2>
        {isOfficer && <Btn color={C.blue} onClick={() => setShowNewFolder(true)}>+ New folder</Btn>}
      </div>
      {showNewFolder && (
        <div style={{ ...cardS, display: "flex", gap: 8, alignItems: "center" }}>
          <input style={{ ...inp }} value={newFolder} onChange={e => setNewFolder(e.target.value)} placeholder="Folder name" onKeyDown={e => e.key === "Enter" && addFolder()} autoFocus />
          <Btn onClick={addFolder}>Create</Btn>
          <OutBtn onClick={() => { setShowNewFolder(false); setNewFolder(""); }}>Cancel</OutBtn>
        </div>
      )}
      {folders.length === 0 && <p style={{ color: C.muted, fontSize: 13 }}>No resources yet.</p>}
      {folders.map(folder => (
        <div key={folder.id} style={{ marginBottom: 8 }}>
          <div onClick={() => toggleFolder(folder.id)} style={{ ...cardS, marginBottom: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: openFolders[folder.id] ? "none" : undefined, borderRadius: openFolders[folder.id] ? "10px 10px 0 0" : 10 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, transition: "transform 0.15s", transform: openFolders[folder.id] ? "rotate(90deg)" : "rotate(0deg)" }}>
              <path d="M6 3.5L10.5 8L6 12.5" stroke={C.muted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontWeight: 600, flex: 1 }}>{folder.title}</span>
            <span style={{ fontSize: 12, color: C.muted }}>{(folder.items||[]).length} link{(folder.items||[]).length !== 1 ? "s" : ""}</span>
            {isOfficer && <button onClick={e => { e.stopPropagation(); removeFolder(folder.id); }} style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 16 }}>×</button>}
          </div>
          {openFolders[folder.id] && (
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 10px 10px", padding: "8px 12px" }}>
              {(folder.items||[]).length === 0 && <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 8px" }}>No links yet.</p>}
              {(folder.items||[]).map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{item.title}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <a href={item.url} target="_blank" rel="noreferrer" style={{ color: C.orange, fontSize: 13 }}>Open</a>
                    {isOfficer && <button onClick={() => removeItem(folder.id, item.id)} style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 15 }}>×</button>}
                  </div>
                </div>
              ))}
              {isOfficer && addingTo !== folder.id && (
                <button onClick={() => setAddingTo(folder.id)} style={{ background: "transparent", border: `1px dashed ${C.border}`, color: C.muted, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, marginTop: 8, width: "100%" }}>+ Add link</button>
              )}
              {isOfficer && addingTo === folder.id && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  <input style={inp} placeholder="Link title" value={newLink.title} onChange={e => setNewLink(l => ({ ...l, title: e.target.value }))} />
                  <input style={inp} placeholder="URL (https://...)" value={newLink.url} onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn onClick={() => addItem(folder.id)}>Add</Btn>
                    <OutBtn onClick={() => { setAddingTo(null); setNewLink({ title: "", url: "" }); }}>Cancel</OutBtn>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---- OFFICERS PAGE ---- */
function OfficersPage({ data, upd, isDev }) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", dueDate: "", assignees: [] });
  const [eventForm, setEventForm] = useState({ title: "", date: "", time: "2:40 PM", desc: "" });

  const tasks = data.officerTasks || [];
  const events = data.officerEvents || [];
  const officers = [...data.users.filter(u => u.role === "officer" || u.role === "developer"), DEV_ACCOUNT.username === DEV_ACCOUNT.username ? null : null].filter(Boolean);
  const officerUsers = data.users.filter(u => u.role === "officer" || u.role === "developer");
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...events].filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = [...events].filter(e => e.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const toggleTask = id => upd(d => ({ ...d, officerTasks: (d.officerTasks||[]).map(t => t.id === id ? { ...t, done: !t.done } : t) }));

  const addTask = () => {
    if (!taskForm.title) return;
    upd(d => ({ ...d, officerTasks: [...(d.officerTasks||[]), { id: Date.now(), title: taskForm.title, dueDate: taskForm.dueDate, assignees: taskForm.assignees, done: false }] }));
    setTaskForm({ title: "", dueDate: "", assignees: [] }); setShowTaskModal(false);
  };
  const addEvent = () => {
    if (!eventForm.title || !eventForm.date) return;
    upd(d => ({ ...d, officerEvents: [...(d.officerEvents||[]), { id: Date.now(), title: eventForm.title, date: eventForm.date, time: eventForm.time, desc: eventForm.desc }] }));
    setEventForm({ title: "", date: "", time: "2:40 PM", desc: "" }); setShowEventModal(false);
  };
  const toggleAssignee = username => setTaskForm(f => ({ ...f, assignees: f.assignees.includes(username) ? f.assignees.filter(a => a !== username) : [...f.assignees, username] }));

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
  const box = { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "1.5rem", width: "90%", maxWidth: 440, maxHeight: "88vh", overflowY: "auto" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Officer Portal</h2>
        {isDev && (
          <div style={{ display: "flex", gap: 8 }}>
            <Btn color={C.blue} onClick={() => setShowTaskModal(true)}>+ Task</Btn>
            <Btn onClick={() => setShowEventModal(true)}>+ Event</Btn>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* TASKS */}
        <div>
          <h3 style={{ fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>Officer Tasks</h3>
          {tasks.length === 0 && <p style={{ color: C.muted, fontSize: 13 }}>No tasks assigned yet.</p>}
          {tasks.map(t => {
            const isOverdue = t.dueDate && t.dueDate < today && !t.done;
            return (
              <div key={t.id} style={{ ...cardS, display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", opacity: t.done ? 0.6 : 1 }} onClick={() => toggleTask(t.id)}>
                <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${t.done ? C.green : C.border}`, background: t.done ? C.green : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                  {t.done && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, textDecoration: t.done ? "line-through" : "none", color: t.done ? C.muted : C.text }}>{t.title}</div>
                  {t.dueDate && <div style={{ fontSize: 11, color: isOverdue ? C.red : C.muted, marginTop: 3 }}>Due {t.dueDate}{isOverdue ? " — Overdue" : ""}</div>}
                  {(t.assignees||[]).length > 0 && <div style={{ fontSize: 11, color: C.blue, marginTop: 2 }}>👤 {t.assignees.join(", ")}</div>}
                </div>
                {isDev && <button onClick={e => { e.stopPropagation(); upd(d => ({ ...d, officerTasks: (d.officerTasks||[]).filter(x => x.id !== t.id) })); }} style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>}
              </div>
            );
          })}
          {tasks.length > 0 && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{tasks.filter(t => t.done).length}/{tasks.length} completed</div>}
        </div>

        {/* EVENTS */}
        <div>
          <h3 style={{ fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>Officer Events</h3>
          {upcoming.length === 0 && past.length === 0 && <p style={{ color: C.muted, fontSize: 13 }}>No officer events yet.</p>}
          {upcoming.length > 0 && <>
            <div style={{ fontSize: 11, color: C.green, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Upcoming</div>
            {upcoming.map(e => (
              <div key={e.id} style={{ ...cardS, borderLeft: `3px solid ${C.green}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{e.date}{e.time ? ` · ${e.time}` : ""}</div>
                    {e.desc && <div style={{ fontSize: 13, color: C.text, marginTop: 4 }}>{e.desc}</div>}
                  </div>
                  {isDev && <button onClick={() => upd(d => ({ ...d, officerEvents: (d.officerEvents||[]).filter(x => x.id !== e.id) }))} style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>}
                </div>
              </div>
            ))}
          </>}
          {past.length > 0 && <>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, margin: "12px 0 8px" }}>Past</div>
            {past.map(e => (
              <div key={e.id} style={{ ...cardS, opacity: 0.6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{e.date}{e.time ? ` · ${e.time}` : ""}</div>
                    {e.desc && <div style={{ fontSize: 13, marginTop: 4 }}>{e.desc}</div>}
                  </div>
                  {isDev && <button onClick={() => upd(d => ({ ...d, officerEvents: (d.officerEvents||[]).filter(x => x.id !== e.id) }))} style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>}
                </div>
              </div>
            ))}
          </>}
        </div>
      </div>

      {/* ADD TASK MODAL */}
      {showTaskModal && (
        <div style={overlay} onClick={() => setShowTaskModal(false)}>
          <div style={box} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>New Officer Task</h3>
            <label style={lbl}>Task title</label>
            <input style={{ ...inp, marginBottom: 12 }} value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Prepare meeting agenda" autoFocus />
            <label style={lbl}>Due date (optional)</label>
            <div style={{ marginBottom: 12 }}>
              <DatePicker value={taskForm.dueDate} onChange={v => setTaskForm(f => ({ ...f, dueDate: v }))} />
            </div>
            <label style={lbl}>Assign to officers (optional)</label>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, marginBottom: 16 }}>
              {officerUsers.length === 0 && <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>No officers yet.</p>}
              {officerUsers.map(u => {
                const sel = taskForm.assignees.includes(u.name || u.username);
                return (
                  <div key={u.username} onClick={() => toggleAssignee(u.name || u.username)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 6, cursor: "pointer", background: sel ? `${C.blue}18` : "transparent", marginBottom: 2 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? C.blue : C.border}`, background: sel ? C.blue : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {sel && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 14 }}>{u.name || u.username}</span>
                    <Tag c={C.blue}>{u.role}</Tag>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <OutBtn onClick={() => setShowTaskModal(false)}>Cancel</OutBtn>
              <Btn color={C.blue} onClick={addTask}>Add Task</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ADD EVENT MODAL */}
      {showEventModal && (
        <div style={overlay} onClick={() => setShowEventModal(false)}>
          <div style={box} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>New Officer Event</h3>
            <label style={lbl}>Event title</label>
            <input style={{ ...inp, marginBottom: 12 }} value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Officer planning meeting" autoFocus />
            <label style={lbl}>Date</label>
            <div style={{ marginBottom: 12 }}>
              <DatePicker value={eventForm.date} onChange={v => setEventForm(f => ({ ...f, date: v }))} />
            </div>
            <label style={lbl}>Time</label>
            <div style={{ marginBottom: 12 }}>
              <TimePicker value={eventForm.time} onChange={v => setEventForm(f => ({ ...f, time: v }))} />
            </div>
            <label style={lbl}>Description (optional)</label>
            <textarea style={{ ...inp, height: 70, resize: "vertical", marginBottom: 16 }} value={eventForm.desc} onChange={e => setEventForm(f => ({ ...f, desc: e.target.value }))} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <OutBtn onClick={() => setShowEventModal(false)}>Cancel</OutBtn>
              <Btn onClick={addEvent}>Add Event</Btn>
            </div>
          </div>
        </div>
      )}
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
  const addImg = async file => { const b = await toB64(file); setDraft(d => ({ ...d, images: [...(d.images||[]), b] })); };
  const about = editing ? draft : data.about;
  const contacts = about.contacts || [];

  const addContact = () => setDraft(d => ({ ...d, contacts: [...(d.contacts||[]), { id: Date.now(), label: "", url: "" }] }));
  const removeContact = i => setDraft(d => ({ ...d, contacts: (d.contacts||[]).filter((_,j) => j !== i) }));
  const updateContact = (i, field, val) => setDraft(d => { const cs = [...(d.contacts||[])]; cs[i] = { ...cs[i], [field]: val }; return { ...d, contacts: cs }; });

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

      {/* PHOTOS */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Photos</h3>
          {editing && <><Btn color={C.blue} onClick={() => ref.current.click()} style={{ fontSize: 12, padding: "5px 12px" }}>+ Add photo</Btn><input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) addImg(e.target.files[0]); }} /></>}
        </div>
        {(about.images||[]).length === 0 && !editing && <p style={{ color: C.muted, fontSize: 13 }}>No photos yet.</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
          {(about.images||[]).map((img, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={img} alt="" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}` }} />
              {editing && <button onClick={() => setDraft(d => ({ ...d, images: d.images.filter((_,j) => j !== i) }))} style={{ position: "absolute", top: 6, right: 6, background: C.red, color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>}
            </div>
          ))}
        </div>
      </div>

      {/* OFFICERS */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Officers</h3>
          {editing && <Btn color={C.blue} onClick={() => setDraft(d => ({ ...d, officers: [...(d.officers||[]), { name: "", role: "Officer", image: "" }] }))} style={{ fontSize: 12, padding: "5px 12px" }}>+ Add officer</Btn>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
          {(about.officers||[]).map((o, i) => (
            <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
              {o.image ? <img src={o.image} alt={o.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.orange}`, margin: "0 auto 8px", display: "block" }} />
                : <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${C.orange}33`, border: `2px solid ${C.orange}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontWeight: 700, fontSize: 20, color: C.orange }}>{(o.name||"?")[0]}</div>}
              {editing ? (
                <>
                  <OfficerImgPick image={o.image} onPick={v => { const os=[...draft.officers]; os[i]={...os[i],image:v}; setDraft(d=>({...d,officers:os})); }} />
                  <input style={{ ...inp, marginBottom: 6, textAlign: "center", fontSize: 13 }} value={o.name} placeholder="Name" onChange={e => { const os=[...draft.officers]; os[i]={...os[i],name:e.target.value}; setDraft(d=>({...d,officers:os})); }} />
                  <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
                    {["Officer","President"].map(r => (
                      <button key={r} type="button" onClick={() => { const os=[...draft.officers]; os[i]={...os[i],role:r}; setDraft(d=>({...d,officers:os})); }}
                        style={{ flex:1, padding:"7px 0", fontSize:12, fontWeight:o.role===r?700:400, border:"none", cursor:"pointer", background:o.role===r?C.orange:C.bgInput, color:o.role===r?"#fff":C.muted, transition:"all 0.15s" }}>{r}</button>
                    ))}
                  </div>
                  <button onClick={() => setDraft(d=>({...d,officers:d.officers.filter((_,j)=>j!==i)}))} style={{ marginTop:6,background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:12 }}>Remove</button>
                </>
              ) : (
                <><div style={{ fontWeight:600,fontSize:14 }}>{o.name||"—"}</div><div style={{ fontSize:12,color:C.orange,marginTop:2 }}>{o.role}</div></>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CONTACT */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Contact</h3>
          {editing && <Btn color={C.blue} onClick={addContact} style={{ fontSize: 12, padding: "5px 12px" }}>+ Add button</Btn>}
        </div>
        {contacts.length === 0 && !editing && <p style={{ color: C.muted, fontSize: 13 }}>No contact links yet.</p>}
        {!editing && contacts.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {contacts.map((c, i) => (
              <a key={i} href={c.url} target="_blank" rel="noreferrer" style={{ display: "inline-block", background: `${C.orange}18`, color: C.orange, border: `1px solid ${C.orange}44`, padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>{c.label || "Link"}</a>
            ))}
          </div>
        )}
        {editing && (
          <div>
            {contacts.map((c, i) => (
              <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input style={{ ...inp, width: 140 }} value={c.label} placeholder="Button label" onChange={e => updateContact(i, "label", e.target.value)} />
                <input style={inp} value={c.url} placeholder="https://..." onChange={e => updateContact(i, "url", e.target.value)} />
                <button onClick={() => removeContact(i)} style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 18, flexShrink: 0 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UnitView({ unit, data, user, upd, onBack, onFinish, onProblem }) {
  const probs = unit.problemIds.map(id => data.problems.find(p => p.id === id)).filter(Boolean);
  const myCompleted = user ? (data.completions[user.username]||[]) : [];
  const startUnit = () => {
    if (!probs.length) return;
    const go = idx => { if(idx>=probs.length){onFinish?onFinish():onBack();return;} onProblem(probs[idx].id,{unitTitle:unit.title,index:idx,total:probs.length,onNext:()=>go(idx+1)}); };
    go(0);
  };
  return (
    <div style={{ minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <Header user={user} onSignOut={()=>{}} isDev={false} onManage={()=>{}} />
      <div style={{ maxWidth:700,margin:"0 auto",padding:"2rem 1rem" }}>
        <OutBtn onClick={onBack} style={{ marginBottom:16 }}>← Back to Problems</OutBtn>
        <div style={{ background:`linear-gradient(135deg,${C.navy}99,#1a1d27)`,borderRadius:12,padding:"1.5rem",marginBottom:24,border:`1px solid ${C.border}` }}>
          <h2 style={{ margin:"0 0 6px",fontSize:22,fontFamily:"'Georgia',serif",fontWeight:400 }}>{unit.title}</h2>
          {unit.desc&&<p style={{ color:C.muted,margin:"0 0 16px",fontSize:14 }}>{unit.desc}</p>}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:13,color:C.muted }}>{probs.length} problems · {probs.filter(p=>myCompleted.includes(p.id)).length} solved</span>
            <Btn onClick={startUnit}>Start unit →</Btn>
          </div>
        </div>
        {probs.map((p,i)=>{
          const done=myCompleted.includes(p.id);
          return (
            <div key={p.id} style={{ ...cardS,display:"flex",alignItems:"center",gap:14 }}>
              <div style={{ width:28,height:28,borderRadius:"50%",border:`2px solid ${done?C.green:C.border}`,background:done?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:done?"#fff":C.muted,flexShrink:0 }}>{done?"✓":i+1}</div>
              <div style={{ flex:1,display:"flex",alignItems:"center",gap:8 }}><span style={{ fontWeight:600 }}>{p.title}</span><Tag c={diffColor[p.difficulty]}>{p.difficulty}</Tag></div>
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
  const completed = (data.completions[user.username]||[]).includes(prob.id);
  const submit = () => {
    if(selected===null)return;
    const correct=selected===prob.answer;
    setResult(correct);setSubmitted(true);
    upd(d=>{
      const today=new Date().toISOString().slice(0,10);
      const ua=d.attempts[user.username]||{total:0,correct:0};
      const na={total:ua.total+1,correct:ua.correct+(correct?1:0)};
      const s=d.streaks[user.username]||{lastDate:null,current:0,best:0};
      let ns={...s};
      if(correct){
        const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
        if(s.lastDate===today){}
        else if(s.lastDate===yesterday){ns.current=s.current+1;ns.lastDate=today;}
        else{ns.current=1;ns.lastDate=today;}
        if(ns.current>ns.best)ns.best=ns.current;
      }
      const completions=correct&&!completed?{...d.completions,[user.username]:[...(d.completions[user.username]||[]),prob.id]}:d.completions;
      return{...d,completions,attempts:{...d.attempts,[user.username]:na},streaks:{...d.streaks,[user.username]:ns}};
    });
  };
  return (
    <div style={{ minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <Header user={user} onSignOut={()=>{}} isDev={false} onManage={()=>{}} />
      {unitCtx&&(
        <div style={{ background:"#111827",padding:"8px 1.5rem",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12 }}>
          <span style={{ fontSize:13,color:C.muted }}>{unitCtx.unitTitle}</span>
          <span style={{ fontSize:12,color:C.muted }}>·</span>
          <span style={{ fontSize:13,color:C.orange,fontWeight:600 }}>Question {unitCtx.index+1} of {unitCtx.total}</span>
          <div style={{ flex:1,height:4,background:C.border,borderRadius:2,overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${((unitCtx.index+1)/unitCtx.total)*100}%`,background:C.orange,borderRadius:2 }}/>
          </div>
        </div>
      )}
      <div style={{ maxWidth:600,margin:"0 auto",padding:"2rem 1rem" }}>
        <OutBtn onClick={onBack} style={{ marginBottom:20 }}>← {unitCtx?unitCtx.unitTitle:"Back"}</OutBtn>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
          <span style={{ fontWeight:700,fontSize:20 }}>{prob.title}</span>
          <Tag c={diffColor[prob.difficulty]}>{prob.difficulty}</Tag>
          {completed&&!submitted&&<Tag c={C.green}>Already solved</Tag>}
        </div>
        <div style={{ ...cardS,fontSize:16,lineHeight:1.7,marginBottom:20 }}>{prob.desc}</div>
        <div style={{ marginBottom:24 }}>
          {prob.choices.map((ch,i)=>{
            let bg=C.bgCard,border=C.border,color=C.text;
            if(submitted){if(i===prob.answer){bg=`${C.green}22`;border=C.green;color=C.green;}else if(i===selected){bg=`${C.red}22`;border=C.red;color=C.red;}}
            else if(selected===i){bg=`${C.orange}22`;border=C.orange;color=C.orange;}
            return(
              <div key={i} onClick={()=>!submitted&&setSelected(i)} style={{ background:bg,border:`1.5px solid ${border}`,color,borderRadius:8,padding:"12px 16px",marginBottom:10,cursor:submitted?"default":"pointer",display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:26,height:26,borderRadius:"50%",border:`1.5px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0,color }}>{String.fromCharCode(65+i)}</div>
                <span style={{ fontSize:15 }}>{ch}</span>
                {submitted&&i===prob.answer&&<span style={{ marginLeft:"auto",fontWeight:700 }}>✓ Correct</span>}
                {submitted&&i===selected&&i!==prob.answer&&<span style={{ marginLeft:"auto",fontWeight:700 }}>✗ Wrong</span>}
              </div>
            );
          })}
        </div>
        {!submitted?<Btn disabled={selected===null} onClick={submit} style={{ padding:"10px 28px" }}>Submit answer</Btn>:(
          <div>
            <div style={{ background:result?`${C.green}22`:`${C.red}22`,border:`1px solid ${result?C.green:C.red}`,borderRadius:8,padding:"12px 16px",marginBottom:16,color:result?C.green:C.red,fontWeight:600 }}>
              {result?"Correct! +1 added to your score. 🎉":"Not quite — the correct answer is highlighted above."}
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <OutBtn onClick={onBack}>{unitCtx?"Back to unit":"Back to problems"}</OutBtn>
              {unitCtx&&onNext&&<Btn onClick={onNext}>{unitCtx.index+1<unitCtx.total?"Next question →":"Finish unit ✓"}</Btn>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardPage({ data, user }) {
  const [lbTab, setLbTab] = useState("solved");
  const medal = i => i===0?C.orange:i===1?C.blue:C.muted;
  const medalBg = i => i===0?`${C.orange}44`:i===1?`${C.blue}44`:C.border;
  const solvedRows = [...data.users].map(u=>({name:u.name||u.username,username:u.username,value:(data.completions[u.username]||[]).length,label:"solved"})).sort((a,b)=>b.value-a.value);
  const accuracyRows = [...data.users].map(u=>{const a=data.attempts[u.username]||{total:0,correct:0};return{name:u.name||u.username,username:u.username,value:a.total>0?Math.round((a.correct/a.total)*100):0,sub:`${a.correct||0}/${a.total||0} attempts`,label:"%"};}).sort((a,b)=>b.value-a.value);
  const streakRows = [...data.users].map(u=>{const s=data.streaks[u.username]||{current:0,best:0};return{name:u.name||u.username,username:u.username,value:s.current,sub:`Best: ${s.best}`,label:"day streak"};}).sort((a,b)=>b.value-a.value);
  const rows=lbTab==="solved"?solvedRows:lbTab==="accuracy"?accuracyRows:streakRows;
  const tabBtn=t=>({background:lbTab===t?`${C.orange}28`:"transparent",color:lbTab===t?C.orange:C.muted,border:`1px solid ${lbTab===t?C.orange:C.border}`,padding:"6px 16px",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:lbTab===t?700:400});
  return (
    <div>
      <h2 style={{ marginBottom:16 }}>Leaderboard</h2>
      <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
        <button style={tabBtn("solved")} onClick={()=>setLbTab("solved")}>Problems Solved</button>
        <button style={tabBtn("accuracy")} onClick={()=>setLbTab("accuracy")}>Accuracy</button>
        <button style={tabBtn("streak")} onClick={()=>setLbTab("streak")}>Daily Streak</button>
      </div>
      {rows.map((u,i)=>(
        <div key={u.username} style={{ ...cardS,display:"flex",alignItems:"center",gap:14,marginBottom:8 }}>
          <div style={{ width:32,height:32,borderRadius:"50%",background:medalBg(i),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:medal(i),flexShrink:0 }}>{i+1}</div>
          <div style={{ flex:1 }}>
            <span style={{ fontWeight:600 }}>{u.name}</span>
            {u.username===user.username&&<span style={{ fontSize:11,color:C.orange,marginLeft:8 }}>you</span>}
            {u.sub&&<div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{u.sub}</div>}
          </div>
          <div style={{ fontWeight:700,color:C.orange,fontSize:18 }}>{u.value}{u.label==="%"?"%":""}</div>
          {u.label!=="%"&&<div style={{ fontSize:12,color:C.muted }}>{u.label}</div>}
        </div>
      ))}
    </div>
  );
}

function ModalBox({ modal, setModal, data, upd, isDev }) {
  const isEditUnit = modal && modal.type === "editUnit";
  const editUnit = isEditUnit ? modal.unit : null;
  const [selProbs, setSelProbs] = useState(editUnit ? [...editUnit.problemIds] : []);
  const [f, setF] = useState({ difficulty:"Easy", choices:["","","",""], answer:0, image:"", selectedProblemIds:[], title:"", body:"", date:"", time:"2:40 PM", location:"", desc:"", url:"", name:"" });
  const set = patch => setF(prev=>({...prev,...patch}));
  const setChoice = (i,v) => setF(p=>{const c=[...p.choices];c[i]=v;return{...p,choices:c};});
  const toggleProb = id => setF(p=>({...p,selectedProblemIds:p.selectedProblemIds.includes(id)?p.selectedProblemIds.filter(x=>x!==id):[...p.selectedProblemIds,id]}));
  const close = () => setModal(null);

  if (isEditUnit) {
    const toggleSel = id => setSelProbs(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);
    const saveEdit = () => { upd(d=>({...d,units:d.units.map(u=>u.id===editUnit.id?{...u,problemIds:selProbs}:u)})); close(); };
    return (
      <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000 }} onClick={close}>
        <div style={{ background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:480,maxHeight:"88vh",overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
          <h3 style={{ margin:"0 0 4px",fontSize:16 }}>Edit unit problems</h3>
          <p style={{ color:C.muted,fontSize:13,margin:"0 0 14px" }}>{editUnit.title}</p>
          <div style={{ maxHeight:320,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:8,padding:8,marginBottom:14 }}>
            {data.problems.map(p=>{
              const sel=selProbs.includes(p.id);
              return(
                <div key={p.id} onClick={()=>toggleSel(p.id)} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:6,cursor:"pointer",background:sel?`${C.orange}18`:"transparent",border:`1px solid ${sel?C.orange:"transparent"}`,marginBottom:4 }}>
                  <div style={{ width:16,height:16,borderRadius:4,border:`2px solid ${sel?C.orange:C.border}`,background:sel?C.orange:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>{sel&&<span style={{ color:"#fff",fontSize:10,fontWeight:700 }}>✓</span>}</div>
                  <span style={{ flex:1,fontSize:14 }}>{p.title}</span>
                  <Tag c={diffColor[p.difficulty]}>{p.difficulty}</Tag>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize:12,color:C.orange,margin:"0 0 14px" }}>{selProbs.length} problem{selProbs.length!==1?"s":""} selected</p>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <OutBtn onClick={close}>Cancel</OutBtn>
            <Btn onClick={saveEdit}>Save changes</Btn>
          </div>
        </div>
      </div>
    );
  }

  const submit = () => {
    if(modal==="ann"){if(!f.title||!f.body)return;upd(d=>({...d,announcements:[...d.announcements,{id:Date.now(),title:f.title,body:f.body,date:new Date().toISOString().slice(0,10),image:f.image||""}]}));}
    else if(modal==="evt"){if(!f.title||!f.date)return;upd(d=>({...d,events:[...d.events,{id:Date.now(),title:f.title,date:f.date,time:f.time||"TBD",location:f.location||"TBD",desc:f.desc||"",image:f.image||""}]}));}
    else if(modal==="res"){if(!f.title||!f.url)return;upd(d=>({...d,resources:[...d.resources,{id:Date.now(),title:f.title,url:f.url,image:f.image||""}]}));}
    else if(modal==="prob"){if(!f.title||!f.desc||f.choices.some(c=>!c))return;upd(d=>({...d,problems:[...d.problems,{id:Date.now(),title:f.title,difficulty:f.difficulty,desc:f.desc,choices:f.choices,answer:Number(f.answer)}]}));}
    else if(modal==="unit"){if(!f.title||!f.selectedProblemIds.length)return;upd(d=>({...d,units:[...d.units,{id:Date.now(),title:f.title,desc:f.desc||"",problemIds:f.selectedProblemIds}]}));}
    close();
  };
  const titles = {ann:"New Announcement",evt:"New Event",res:"New Resource",prob:"New Problem",unit:"Create Unit"};
  const overlay = {position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000};
  const box = {background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:["prob","unit","evt"].includes(modal)?520:430,maxHeight:"88vh",overflowY:"auto"};
  return (
    <div style={overlay} onClick={close}>
      <div style={box} onClick={e=>e.stopPropagation()}>
        <h3 style={{ margin:"0 0 16px",fontSize:16 }}>{titles[modal]}</h3>
        {modal==="ann"&&<><label style={lbl}>Title</label><input style={{ ...inp,marginBottom:10 }} value={f.title} onChange={e=>set({title:e.target.value})} /><label style={lbl}>Body</label><textarea style={{ ...inp,height:80,resize:"vertical",marginBottom:10 }} value={f.body} onChange={e=>set({body:e.target.value})} /><ImgPick preview={f.image} onPick={v=>set({image:v})} /></>}
        {modal==="evt"&&<>
          <label style={lbl}>Title</label><input style={{ ...inp,marginBottom:12 }} value={f.title} onChange={e=>set({title:e.target.value})} />
          <label style={lbl}>Date</label><div style={{ marginBottom:12 }}><DatePicker value={f.date} onChange={v=>set({date:v})} /></div>
          <label style={lbl}>Time</label><div style={{ marginBottom:12 }}><TimePicker value={f.time} onChange={v=>set({time:v})} /></div>
          <label style={lbl}>Location</label><input style={{ ...inp,marginBottom:10 }} value={f.location} onChange={e=>set({location:e.target.value})} />
          <label style={lbl}>Description</label><input style={{ ...inp,marginBottom:10 }} value={f.desc} onChange={e=>set({desc:e.target.value})} />
          <ImgPick preview={f.image} onPick={v=>set({image:v})} />
        </>}
        {modal==="res"&&<><label style={lbl}>Title</label><input style={{ ...inp,marginBottom:10 }} value={f.title} onChange={e=>set({title:e.target.value})} /><label style={lbl}>URL</label><input style={{ ...inp,marginBottom:10 }} value={f.url} placeholder="https://..." onChange={e=>set({url:e.target.value})} /><ImgPick preview={f.image} onPick={v=>set({image:v})} /></>}
        {modal==="prob"&&<><label style={lbl}>Problem title</label><input style={{ ...inp,marginBottom:10 }} value={f.title} onChange={e=>set({title:e.target.value})} /><label style={lbl}>Difficulty</label><select style={{ ...inp,marginBottom:10 }} value={f.difficulty} onChange={e=>set({difficulty:e.target.value})}><option>Easy</option><option>Medium</option><option>Hard</option></select><label style={lbl}>Question</label><textarea style={{ ...inp,height:72,resize:"vertical",marginBottom:14 }} value={f.desc} onChange={e=>set({desc:e.target.value})} /><label style={lbl}>Answer choices — select the correct one</label>{[0,1,2,3].map(i=>(<div key={i} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}><input type="radio" name="ans" checked={Number(f.answer)===i} onChange={()=>set({answer:i})} style={{ accentColor:C.orange,flexShrink:0 }}/><div style={{ width:24,height:24,borderRadius:"50%",background:`${C.orange}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.orange,flexShrink:0 }}>{String.fromCharCode(65+i)}</div><input style={inp} value={f.choices[i]} placeholder={`Choice ${String.fromCharCode(65+i)}`} onChange={e=>setChoice(i,e.target.value)}/></div>))}</>}
        {modal==="unit"&&<><label style={lbl}>Unit title</label><input style={{ ...inp,marginBottom:10 }} value={f.title} placeholder="e.g. Intro to Data Structures" onChange={e=>set({title:e.target.value})} /><label style={lbl}>Description (optional)</label><input style={{ ...inp,marginBottom:14 }} value={f.desc} placeholder="Brief description" onChange={e=>set({desc:e.target.value})} /><label style={lbl}>Select problems</label><div style={{ maxHeight:220,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:8,padding:8,marginBottom:12 }}>{data.problems.length===0&&<p style={{ color:C.muted,fontSize:13,margin:0 }}>No problems yet.</p>}{data.problems.map(p=>{const sel=f.selectedProblemIds.includes(p.id);return(<div key={p.id} onClick={()=>toggleProb(p.id)} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:6,cursor:"pointer",background:sel?`${C.orange}18`:"transparent",border:`1px solid ${sel?C.orange:"transparent"}`,marginBottom:4 }}><div style={{ width:16,height:16,borderRadius:4,border:`2px solid ${sel?C.orange:C.border}`,background:sel?C.orange:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>{sel&&<span style={{ color:"#fff",fontSize:10,fontWeight:700 }}>✓</span>}</div><span style={{ flex:1,fontSize:14 }}>{p.title}</span><Tag c={diffColor[p.difficulty]}>{p.difficulty}</Tag></div>);})}</div>{f.selectedProblemIds.length>0&&<p style={{ fontSize:12,color:C.orange,margin:"0 0 4px" }}>{f.selectedProblemIds.length} problem{f.selectedProblemIds.length>1?"s":""} selected</p>}</>}
        <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:16 }}>
          <OutBtn onClick={close}>Cancel</OutBtn>
          <Btn onClick={submit}>{modal==="unit"?"Create unit":"Add"}</Btn>
        </div>
      </div>
    </div>
  );
}
