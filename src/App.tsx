import { useState, useRef, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, collection, addDoc } from "firebase/firestore";

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

const DEV_ACCOUNT: any = { username:"LuisBlanco62",password:"Dinosaur#2010",role:"developer",name:"Luis Blanco" };
const GUEST_USER: any = { username:"__guest__",name:"Guest",role:"guest" };
const LOGO_URL = "https://pbs.twimg.com/profile_images/1405677956082630657/5PhDfiOI_400x400.jpg";

const C = {
  bg:"#0f1117",bgCard:"#1a1d27",bgInput:"#12141c",border:"#2a2d3a",
  navy:"#1a3a6b",orange:"#f97316",text:"#e2e8f0",muted:"#94a3b8",
  green:"#22c55e",red:"#ef4444",blue:"#3b82f6",guest:"#64748b",purple:"#a855f7",
};
const diffColor: any = { Easy:C.green,Medium:C.orange,Hard:C.red };
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const HOURS=["12","1","2","3","4","5","6","7","8","9","10","11"];
const MINS=["00","15","30","45"];
const AMPM=["AM","PM"];
const LANGS=["JavaScript","Python","Java","C++"];

function DatePicker({value,onChange}:any){
  const today=new Date();
  const [vy,setVy]=useState(value?parseInt(value.slice(0,4)):today.getFullYear());
  const [vm,setVm]=useState(value?parseInt(value.slice(5,7))-1:today.getMonth());
  const dim=new Date(vy,vm+1,0).getDate();
  const fd=new Date(vy,vm,1).getDay();
  const sd=value?parseInt(value.slice(8,10)):null;
  const sm=value?parseInt(value.slice(5,7))-1:null;
  const sy=value?parseInt(value.slice(0,4)):null;
  const pad=(n:number)=>String(n).padStart(2,"0");
  const pick=(d:number)=>onChange(`${vy}-${pad(vm+1)}-${pad(d)}`);
  const prev=()=>{if(vm===0){setVm(11);setVy((y:number)=>y-1);}else setVm((m:number)=>m-1);};
  const next=()=>{if(vm===11){setVm(0);setVy((y:number)=>y+1);}else setVm((m:number)=>m+1);};
  return(
    <div style={{background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:8,padding:12,userSelect:"none"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button type="button" onClick={prev} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:18,padding:"0 6px"}}>‹</button>
        <span style={{fontWeight:600,fontSize:14,color:C.text}}>{MONTHS[vm]} {vy}</span>
        <button type="button" onClick={next} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:18,padding:"0 6px"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:C.muted,padding:"2px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {Array(fd).fill(null).map((_,i)=><div key={"e"+i}/>)}
        {Array(dim).fill(null).map((_,i)=>{
          const d=i+1,sel=sd===d&&sm===vm&&sy===vy,isT=d===today.getDate()&&vm===today.getMonth()&&vy===today.getFullYear();
          return <button key={d} type="button" onClick={()=>pick(d)} style={{background:sel?C.orange:isT?`${C.orange}22`:"transparent",color:sel?"#fff":isT?C.orange:C.text,border:sel?`1px solid ${C.orange}`:`1px solid transparent`,borderRadius:6,padding:"5px 0",fontSize:13,cursor:"pointer",fontWeight:sel?700:400}}>{d}</button>;
        })}
      </div>
    </div>
  );
}

function TimePicker({value,onChange}:any){
  const parts=value?value.match(/(\d+):(\d+)\s*(AM|PM)/i):null;
  const [h,setH]=useState(parts?parts[1]:"2");
  const [m,setM]=useState(parts?parts[2]:"40");
  const [ap,setAp]=useState(parts?parts[3].toUpperCase():"PM");
  useEffect(()=>{onChange(`${h}:${m} ${ap}`);},[h,m,ap]);
  const pill=(active:boolean,label:string,onClick:any)=>(
    <button type="button" onClick={onClick} style={{padding:"5px 10px",fontSize:13,border:`1px solid ${active?C.orange:C.border}`,borderRadius:6,background:active?C.orange:C.bgCard,color:active?"#fff":C.muted,cursor:"pointer",fontWeight:active?700:400}}>{label}</button>
  );
  return(
    <div style={{background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:8,padding:12}}>
      <div style={{marginBottom:8}}><div style={{fontSize:11,color:C.muted,marginBottom:6}}>Hour</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{HOURS.map(hh=>pill(h===hh,hh,()=>setH(hh)))}</div></div>
      <div style={{marginBottom:8}}><div style={{fontSize:11,color:C.muted,marginBottom:6}}>Minutes</div><div style={{display:"flex",gap:4}}>{MINS.map(mm=>pill(m===mm,mm,()=>setM(mm)))}</div></div>
      <div><div style={{fontSize:11,color:C.muted,marginBottom:6}}>AM / PM</div><div style={{display:"flex",gap:4}}>{AMPM.map(a=>pill(ap===a,a,()=>setAp(a)))}</div></div>
    </div>
  );
}

const initData:any={
  users:[DEV_ACCOUNT],
  announcements:[
    {id:1,title:"Welcome to Bridgeland CS Club!",body:"We meet every Monday and Thursday from 2:40–3:50 PM. Come join us!",date:"2025-08-28",image:""},
    {id:2,title:"UIL Competition Signups Open",body:"Sign up for UIL CS competition. Practice sessions start next week.",date:"2025-09-02",image:""},
  ],
  events:[
    {id:1,title:"Weekly Meeting",date:"2025-09-06",time:"2:40 PM",location:"Room 214",desc:"Regular weekly meeting. Bring your laptops!",image:""},
    {id:2,title:"Hackathon Prep",date:"2025-09-13",time:"2:40 PM",location:"Room 214",desc:"Prepare for upcoming hackathon season.",image:""},
  ],
  resources:[
    {id:"f1",title:"Meeting Notes",isFolder:true,children:[],items:[{id:1,title:"Meeting Notes — Aug 28",url:"https://docs.google.com",image:""}]},
    {id:"f2",title:"Learning Resources",isFolder:true,children:[],items:[
      {id:2,title:"Python Crash Course",url:"https://learnpython.org",image:""},
      {id:3,title:"LeetCode",url:"https://leetcode.com",image:""},
    ]},
  ],
  problems:[
    {id:1,title:"FizzBuzz",difficulty:"Easy",desc:"What does FizzBuzz print for the number 15?",choices:["Fizz","Buzz","FizzBuzz","15"],answer:2},
    {id:2,title:"Binary Basics",difficulty:"Easy",desc:"What is the decimal value of binary 1010?",choices:["8","10","12","14"],answer:1},
    {id:3,title:"Big-O Notation",difficulty:"Medium",desc:"What is the time complexity of binary search?",choices:["O(n)","O(n²)","O(log n)","O(1)"],answer:2},
    {id:4,title:"Stack vs Queue",difficulty:"Medium",desc:"Which data structure follows the LIFO principle?",choices:["Queue","Stack","Heap","Tree"],answer:1},
    {id:5,title:"Sorting",difficulty:"Hard",desc:"What is the average time complexity of quicksort?",choices:["O(n)","O(n log n)","O(n²)","O(log n)"],answer:1},
  ],
  codingQuestions:[
    {id:1,title:"Sum Two Numbers",difficulty:"Easy",language:"JavaScript",
      desc:"Write a function called `solution` that takes two numbers and returns their sum.\n\nExample: solution(2, 3) → 5",
      starterCode:"function solution(a, b) {\n  // your code here\n}",
      testCases:[{input:"2,3",expected:"5"},{input:"0,0",expected:"0"},{input:"-1,1",expected:"0"},{input:"10,20",expected:"30"}]},
    {id:2,title:"Reverse a String",difficulty:"Easy",language:"JavaScript",
      desc:"Write a function called `solution` that takes a string and returns it reversed.\n\nExample: solution('hello') → 'olleh'",
      starterCode:"function solution(s) {\n  // your code here\n}",
      testCases:[{input:"'hello'",expected:"'olleh'"},{input:"'world'",expected:"'dlrow'"},{input:"''",expected:"''"},{input:"'a'",expected:"'a'"}]},
    {id:3,title:"Is Palindrome",difficulty:"Medium",language:"JavaScript",
      desc:"Write a function called `solution` that returns true if a string is a palindrome, false otherwise.\n\nExample: solution('racecar') → true",
      starterCode:"function solution(s) {\n  // your code here\n}",
      testCases:[{input:"'racecar'",expected:"true"},{input:"'hello'",expected:"false"},{input:"'level'",expected:"true"},{input:"'a'",expected:"true"}]},
  ],
  units:[{id:1,title:"Intro to CS Concepts",desc:"Foundational concepts every CS student should know.",problemIds:[1,2,3]}],
  completions:{},codingSubmissions:{},attempts:{},streaks:{},
  officerTasks:[],officerEvents:[],googleCalendarId:"",
  about:{
    heading:"About Bridgeland CS Club",
    body:"We are a community of students passionate about computer science, coding, and technology. Whether you're a beginner or an experienced programmer, there's a place for you here!\n\nWe meet every Monday and Thursday from 2:40–3:50 PM to learn new concepts, practice for UIL competitions, work on projects, and have fun. Join us and be part of something great.",
    images:[],
    officers:[{name:"President",role:"President",image:""},{name:"Vice President",role:"Officer",image:""}],
    contacts:[],
  },
};

async function saveData(d:any){try{await setDoc(DATA_DOC,d);}catch(e){console.error("Save failed",e);}}
function toB64(file:File):Promise<string>{return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result as string);r.onerror=rej;r.readAsDataURL(file);});}

function ImgPick({label="Add image (optional)",onPick,preview}:any){
  const ref=useRef<any>();
  return(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:12,color:C.muted,marginBottom:6}}>{label}</div>
      <button type="button" onClick={()=>ref.current.click()} style={{background:C.bgInput,border:`1px dashed ${C.border}`,color:C.muted,padding:"8px 14px",borderRadius:6,cursor:"pointer",fontSize:13,width:"100%"}}>Click to upload image</button>
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={async(e:any)=>{if(e.target.files[0])onPick(await toB64(e.target.files[0]));}}/>
      {preview&&<img src={preview} alt="" style={{marginTop:8,width:"100%",maxHeight:110,objectFit:"cover",borderRadius:6,border:`1px solid ${C.border}`}}/>}
    </div>
  );
}

const inp:any={background:C.bgInput,border:`1px solid ${C.border}`,color:C.text,padding:"8px 12px",borderRadius:6,fontSize:14,width:"100%",boxSizing:"border-box",fontFamily:"'Inter','Segoe UI',sans-serif"};
const lbl:any={fontSize:12,color:C.muted,marginBottom:4,display:"block"};
const cardS:any={background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:"1rem 1.25rem",marginBottom:12};
const Btn=({color=C.orange,children,onClick,style={},disabled}:any)=>(
  <button onClick={onClick} disabled={disabled} style={{background:disabled?C.border:color,color:"#fff",border:"none",padding:"8px 16px",borderRadius:6,cursor:disabled?"not-allowed":"pointer",fontSize:13,fontWeight:600,...style}}>{children}</button>
);
const OutBtn=({children,onClick,style={},danger}:any)=>(
  <button onClick={onClick} style={{background:"transparent",color:danger?C.red:C.muted,border:`1px solid ${danger?C.red:C.border}`,padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:13,...style}}>{children}</button>
);
const SecBtn=({children,onClick,style={}}:any)=>(
  <button onClick={onClick} style={{background:C.bgInput,color:C.text,border:`1px solid ${C.border}`,padding:"8px 16px",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600,...style}}>{children}</button>
);
const Tag=({c,children}:any)=><span style={{background:`${c}22`,color:c,fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:600}}>{children}</span>;

function Header({user,onSignOut,onManage,isDev}:any){
  return(
    <div style={{background:C.navy,borderBottom:`3px solid ${C.orange}`,padding:"0 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <img src={LOGO_URL} alt="logo" style={{width:38,height:38,borderRadius:"50%",border:`2px solid ${C.orange}`,objectFit:"cover"}} onError={(e:any)=>e.target.style.display="none"}/>
        <span style={{fontFamily:"'Georgia',serif",fontWeight:400,fontSize:20,color:"#fff",letterSpacing:1}}>Bridgeland CS Club</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {user&&<>
          <span style={{fontSize:13,color:"#cdd5e0"}}>{user.name||user.username}</span>
          {user.role!=="member"&&user.role!=="guest"&&<Tag c={C.orange}>{user.role==="developer"?"Developer":"Officer"}</Tag>}
          {user.role==="guest"&&<Tag c={C.guest}>guest</Tag>}
          {isDev&&<Btn color={C.orange} onClick={onManage} style={{padding:"5px 12px",fontSize:12}}>Members</Btn>}
        </>}
        <OutBtn onClick={onSignOut} style={{borderColor:"#ffffff33",color:"#cdd5e0"}}>{user?"Sign out":""}</OutBtn>
      </div>
    </div>
  );
}

function BugReportBtn({user}:any){
  const [open,setOpen]=useState(false);
  const [text,setText]=useState("");
  const [sent,setSent]=useState(false);
  const submit=async()=>{
    if(!text.trim())return;
    try{
      await addDoc(collection(db,"bugReports"),{text:text.trim(),username:user?.username||"anonymous",name:user?.name||"Guest",timestamp:new Date().toISOString()});
      setSent(true);setTimeout(()=>{setSent(false);setText("");setOpen(false);},2000);
    }catch(e){console.error(e);}
  };
  return(
    <>
      <button onClick={()=>setOpen(true)} style={{position:"fixed",bottom:24,right:24,zIndex:500,background:C.bgCard,border:`1px solid ${C.border}`,color:C.muted,borderRadius:12,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:600,boxShadow:"0 4px 12px rgba(0,0,0,0.4)",display:"flex",alignItems:"center",gap:6}}>
        Report a bug
      </button>
      {open&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setOpen(false)}>
          <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:420}} onClick={(e:any)=>e.stopPropagation()}>
            <h3 style={{margin:"0 0 8px",fontSize:16}}>Report a Bug</h3>
            <p style={{color:C.muted,fontSize:13,margin:"0 0 12px"}}>Describe what went wrong and we'll look into it.</p>
            {sent?(<div style={{textAlign:"center",padding:"1rem",color:C.green,fontWeight:600}}>✓ Report sent! Thanks!</div>):(
              <>
                <textarea style={{...inp,height:100,resize:"vertical",marginBottom:12}} placeholder="e.g. The submit button doesn't work..." value={text} onChange={(e:any)=>setText(e.target.value)} autoFocus/>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                  <OutBtn onClick={()=>setOpen(false)}>Cancel</OutBtn>
                  <Btn onClick={submit} disabled={!text.trim()}>Send report</Btn>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function runCode(code:string,testCases:any[]){
  return testCases.map(tc=>{
    try{
      const fn=new Function(code+`\nreturn solution(${tc.input});`);
      const result=fn();
      const got=JSON.stringify(result);
      const expected=tc.expected.trim();
      let pass=false;
      try{pass=JSON.stringify(JSON.parse(expected))===got;}catch{pass=String(result)===expected.replace(/^['"]|['"]$/g,"");}
      return{input:tc.input,expected:tc.expected,got:String(result),pass};
    }catch(e:any){return{input:tc.input,expected:tc.expected,got:`Error: ${e.message}`,pass:false};}
  });
}

export default function App(){
  const [data,setData]=useState(initData);
  const [loading,setLoading]=useState(true);
  const [user,setUser]=useState<any>(null);
  const [page,setPage]=useState("home");
  const [loginForm,setLoginForm]=useState({username:"",password:""});
  const [loginErr,setLoginErr]=useState("");
  const [regForm,setRegForm]=useState({username:"",password:"",name:""});
  const [regErr,setRegErr]=useState("");
  const [showReg,setShowReg]=useState(false);
  const [modal,setModal]=useState<any>(null);
  const [activeProblem,setActiveProblem]=useState<any>(null);
  const [activeUnit,setActiveUnit]=useState<any>(null);
  const [activeCoding,setActiveCoding]=useState<any>(null);

  useEffect(()=>{
    const unsub=onSnapshot(DATA_DOC,snap=>{
      if(snap.exists()){setData({...initData,...snap.data()});}
      else{setDoc(DATA_DOC,initData);}
      setLoading(false);
    },err=>{console.error("Firestore error",err);setLoading(false);});
    return()=>unsub();
  },[]);

  const upd=(fn:any)=>setData((prev:any)=>{const next=fn(prev);saveData(next);return next;});
  const isOfficer=user&&(user.role==="officer"||user.role==="developer");
  const isDev=user&&user.role==="developer";
  const isGuest=user&&user.role==="guest";
  const myCompleted=user&&!isGuest?(data.completions[user.username]||[]):[];

  const login=()=>{
    if(loginForm.username===DEV_ACCOUNT.username&&loginForm.password===DEV_ACCOUNT.password){setUser(DEV_ACCOUNT);setLoginErr("");return;}
    const f=data.users.find((u:any)=>u.username===loginForm.username&&u.password===loginForm.password);
    if(f){setUser(f);setLoginErr("");}else setLoginErr("Invalid username or password.");
  };
  const register=()=>{
    if(!regForm.username||!regForm.password||!regForm.name){setRegErr("All fields required.");return;}
    if(data.users.find((u:any)=>u.username===regForm.username)||regForm.username===DEV_ACCOUNT.username){setRegErr("Username taken.");return;}
    const nu={username:regForm.username,password:regForm.password,name:regForm.name,role:"member"};
    upd((d:any)=>({...d,users:[...d.users,nu]}));
    setUser(nu);setRegErr("");
  };

  const allNav=["home","about","announcements","events","resources","problems","coding","leaderboard"];
  const navItems=isOfficer?[...allNav,"officers"]:allNav;
  const navLabels:any={home:"Home",about:"About Us",announcements:"Announcements",events:"Events",resources:"Resources",problems:"Problems",coding:"Coding",leaderboard:"Leaderboard",officers:"Officers"};
  const navBtn=(active:boolean)=>({background:active?`${C.orange}28`:"transparent",color:active?C.orange:C.muted,border:"none",padding:"8px 14px",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:active?700:400,whiteSpace:"nowrap" as const});

  if(loading)return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter','Segoe UI',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <img src={LOGO_URL} alt="logo" style={{width:60,height:60,borderRadius:"50%",border:`3px solid ${C.orange}`,objectFit:"cover"}} onError={(e:any)=>e.target.style.display="none"}/>
      <div style={{color:C.muted,fontSize:15}}>Loading Bridgeland CS Club…</div>
    </div>
  );

  if(!user)return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <div style={{background:`linear-gradient(135deg,${C.navy} 0%,#0f1117 70%)`,padding:"3rem 1rem 2.5rem",textAlign:"center",borderBottom:`3px solid ${C.orange}`}}>
        <img src={LOGO_URL} alt="logo" style={{width:80,height:80,borderRadius:"50%",border:`3px solid ${C.orange}`,marginBottom:14,objectFit:"cover"}} onError={(e:any)=>e.target.style.display="none"}/>
        <h1 style={{fontFamily:"'Georgia',serif",fontSize:28,fontWeight:400,margin:0,letterSpacing:1,color:"#fff",textAlign:"center"}}>Bridgeland CS Club</h1>
        <p style={{color:C.muted,fontSize:14,marginTop:8}}>Bridgeland High School · Cypress, TX</p>
      </div>
      <div style={{maxWidth:380,margin:"0 auto",padding:"2rem 1rem"}}>
        {!showReg?(
          <div style={cardS}>
            <h2 style={{fontSize:17,fontWeight:600,marginTop:0,marginBottom:16}}>Sign in</h2>
            <label style={lbl}>Username</label>
            <input style={{...inp,marginBottom:12}} value={loginForm.username} onChange={(e:any)=>setLoginForm((f:any)=>({...f,username:e.target.value}))} placeholder="Username"/>
            <label style={lbl}>Password</label>
            <input style={{...inp,marginBottom:16}} type="password" value={loginForm.password} onChange={(e:any)=>setLoginForm((f:any)=>({...f,password:e.target.value}))} placeholder="Password" onKeyDown={(e:any)=>e.key==="Enter"&&login()}/>
            {loginErr&&<p style={{color:C.red,fontSize:13,margin:"0 0 12px"}}>{loginErr}</p>}
            <Btn style={{width:"100%",padding:"10px"}} onClick={login}>Sign in</Btn>
            <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0"}}>
              <div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:12,color:C.muted}}>or</span><div style={{flex:1,height:1,background:C.border}}/>
            </div>
            <button onClick={()=>setUser(GUEST_USER)} style={{width:"100%",padding:"10px",background:C.bgInput,border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'Inter','Segoe UI',sans-serif"}}>Continue as Guest</button>
            <p style={{textAlign:"center",fontSize:12,color:C.muted,marginTop:8}}>Guests can browse but cannot do problems or appear on the leaderboard.</p>
            <p style={{textAlign:"center",fontSize:13,color:C.muted,marginTop:8}}>No account? <span style={{color:C.orange,cursor:"pointer"}} onClick={()=>setShowReg(true)}>Register</span></p>
          </div>
        ):(
          <div style={cardS}>
            <h2 style={{fontSize:17,fontWeight:600,marginTop:0,marginBottom:16}}>Create account</h2>
            <label style={lbl}>Full name</label>
            <input style={{...inp,marginBottom:12}} value={regForm.name} onChange={(e:any)=>setRegForm((f:any)=>({...f,name:e.target.value}))} placeholder="Your name"/>
            <label style={lbl}>Username</label>
            <input style={{...inp,marginBottom:12}} value={regForm.username} onChange={(e:any)=>setRegForm((f:any)=>({...f,username:e.target.value}))} placeholder="Choose a username"/>
            <label style={lbl}>Password</label>
            <input style={{...inp,marginBottom:16}} type="password" value={regForm.password} onChange={(e:any)=>setRegForm((f:any)=>({...f,password:e.target.value}))} placeholder="Choose a password"/>
            {regErr&&<p style={{color:C.red,fontSize:13,margin:"0 0 12px"}}>{regErr}</p>}
            <Btn style={{width:"100%",padding:"10px"}} onClick={register}>Create account</Btn>
            <p style={{textAlign:"center",fontSize:13,color:C.muted,marginTop:12}}><span style={{color:C.orange,cursor:"pointer"}} onClick={()=>setShowReg(false)}>Back to sign in</span></p>
          </div>
        )}
      </div>
      <BugReportBtn user={null}/>
    </div>
  );

  if(activeCoding!==null){
    const cq=(data.codingQuestions||[]).find((q:any)=>q.id===activeCoding);
    if(!cq){setActiveCoding(null);return null;}
    return <CodingView cq={cq} user={user} data={data} upd={upd} onBack={()=>setActiveCoding(null)}/>;
  }
  if(activeProblem!==null){
    const prob=data.problems.find((p:any)=>p.id===activeProblem.id);
    if(!prob){setActiveProblem(null);return null;}
    return <ProblemView prob={prob} user={user} data={data} upd={upd} onBack={()=>setActiveProblem(null)} unitCtx={activeProblem.unitCtx} onNext={activeProblem.onNext}/>;
  }
  if(activeUnit!==null){
    const unit=data.units.find((u:any)=>u.id===activeUnit);
    if(!unit){setActiveUnit(null);return null;}
    return <UnitView unit={unit} data={data} user={user} upd={upd} onBack={()=>setActiveUnit(null)}
      onFinish={()=>{setActiveProblem(null);setActiveUnit(null);}}
      onProblem={(pid:any,ctx:any)=>setActiveProblem({id:pid,unitCtx:ctx,onNext:ctx.onNext})}/>;
  }

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <Header user={user} onSignOut={()=>{setUser(null);setPage("home");}} isDev={isDev} onManage={()=>setPage("members")}/>
      <div style={{background:"#111827",borderBottom:`1px solid ${C.border}`,padding:"0 1rem",display:"flex",gap:2,overflowX:"auto"}}>
        {navItems.map(p=><button key={p} style={navBtn(page===p)} onClick={()=>setPage(p)}>{navLabels[p]}</button>)}
      </div>
      <div style={{maxWidth:780,margin:"0 auto",padding:"1.5rem 1rem"}}>

        {page==="home"&&(
          <div>
            <div style={{background:`linear-gradient(135deg,${C.navy}cc,#1a1d27)`,borderRadius:12,padding:"1.5rem",marginBottom:24,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:20}}>
              <img src={LOGO_URL} alt="logo" style={{width:60,height:60,borderRadius:"50%",border:`3px solid ${C.orange}`,objectFit:"cover",flexShrink:0}} onError={(e:any)=>e.target.style.display="none"}/>
              <div>
                <h1 style={{fontFamily:"'Georgia',serif",fontSize:22,fontWeight:400,margin:"0 0 4px"}}>Welcome, {user.name?.split(" ")[0]||user.username}! 👋</h1>
                <p style={{color:C.muted,margin:"0 0 8px",fontSize:14}}>Bridgeland High School Computer Science Club · Cypress, TX</p>
                <div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${C.orange}22`,border:`1px solid ${C.orange}44`,borderRadius:8,padding:"6px 14px"}}>
                  <span style={{fontSize:15,color:C.orange,fontWeight:700}}>📅 Mon & Thu · 2:40 – 3:50 PM</span>
                </div>
              </div>
            </div>
            {!isGuest&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:24}}>
                {[["Members",data.users.length],["Events",data.events.length],["Units",data.units.length],["Problems Solved",myCompleted.length]].map(([l,v]:any)=>(
                  <div key={l} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:"1rem",textAlign:"center"}}>
                    <div style={{fontSize:26,fontWeight:700,color:C.orange}}>{v}</div>
                    <div style={{fontSize:13,color:C.muted,marginTop:4}}>{l}</div>
                  </div>
                ))}
              </div>
            )}
            {isGuest&&(<div style={{...cardS,borderLeft:`3px solid ${C.guest}`,marginBottom:24}}><div style={{fontWeight:600,fontSize:14,color:C.guest,marginBottom:4}}>Browsing as Guest</div><div style={{fontSize:13,color:C.muted}}>Sign in or create an account to do practice problems and appear on the leaderboard.</div></div>)}
            {!isGuest&&(
              <><h3 style={{fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Top solvers</h3>
              <div style={{...cardS,marginBottom:24,padding:"0.75rem 1rem"}}>
                {[...data.users].map((u:any)=>({name:u.name||u.username,username:u.username,count:(data.completions[u.username]||[]).length})).sort((a:any,b:any)=>b.count-a.count).slice(0,3).map((u:any,i:number)=>(
                  <div key={u.username} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
                    <div style={{width:26,height:26,borderRadius:"50%",background:i===0?`${C.orange}44`:i===1?`${C.blue}44`:`${C.muted}22`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:i===0?C.orange:i===1?C.blue:C.muted,flexShrink:0}}>{i+1}</div>
                    <div style={{flex:1,fontWeight:600,fontSize:14}}>{u.name}{u.username===user.username&&<span style={{fontSize:11,color:C.orange,marginLeft:6}}>you</span>}</div>
                    <div style={{fontWeight:700,color:C.orange}}>{u.count}</div><div style={{fontSize:12,color:C.muted}}>solved</div>
                  </div>
                ))}
                {data.users.length===0&&<p style={{color:C.muted,fontSize:13,margin:0}}>No solvers yet.</p>}
              </div></>
            )}
            <h3 style={{fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Latest announcements</h3>
            {data.announcements.slice(-2).reverse().map((a:any)=>(
              <div key={a.id} style={{...cardS,borderLeft:`3px solid ${C.orange}`}}>
                {a.image&&<img src={a.image} alt="" style={{width:"100%",maxHeight:160,objectFit:"cover",borderRadius:6,marginBottom:10}}/>}
                <div style={{fontWeight:600,marginBottom:4}}>{a.title}</div>
                <div style={{fontSize:13,color:C.muted}}>{a.body}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:8}}>{a.date}</div>
              </div>
            ))}
          </div>
        )}

        {page==="about"&&<AboutPage data={data} upd={upd} isOfficer={isOfficer}/>}

        {page==="announcements"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{margin:0}}>Announcements</h2>
              {isOfficer&&<Btn onClick={()=>setModal("ann")}>+ Add</Btn>}
            </div>
            {[...data.announcements].reverse().map((a:any)=>(
              <div key={a.id} style={{...cardS,borderLeft:`3px solid ${C.orange}`}}>
                {a.image&&<img src={a.image} alt="" style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:6,marginBottom:10}}/>}
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div style={{fontWeight:600,fontSize:15}}>{a.title}</div>
                  {isOfficer&&<OutBtn danger onClick={()=>upd((d:any)=>({...d,announcements:d.announcements.filter((x:any)=>x.id!==a.id)}))}>Remove</OutBtn>}
                </div>
                <div style={{fontSize:14,color:C.muted,margin:"8px 0"}}>{a.body}</div>
                <div style={{fontSize:11,color:C.muted}}>{a.date}</div>
              </div>
            ))}
          </div>
        )}

        {page==="events"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{margin:0}}>Upcoming Events</h2>
              {isOfficer&&<Btn onClick={()=>setModal("evt")}>+ Add</Btn>}
            </div>
            {data.googleCalendarId&&(
              <div style={{marginBottom:24,borderRadius:10,overflow:"hidden",border:`1px solid ${C.border}`}}>
                <iframe src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(data.googleCalendarId)}&ctz=America%2FChicago&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&mode=MONTH&bgcolor=%230f1117&color=%23f97316`}
                  style={{width:"100%",height:600,border:0,display:"block"}} frameBorder="0" scrolling="no" title="Google Calendar"/>
              </div>
            )}
            {!data.googleCalendarId&&isDev&&(
              <div style={{...cardS,marginBottom:16,borderLeft:`3px solid ${C.orange}`}}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:6}}>Add Google Calendar</div>
                <div style={{fontSize:13,color:C.muted,marginBottom:10}}>Paste your Google Calendar ID to embed it here.</div>
                <div style={{display:"flex",gap:8}}>
                  <input style={inp} placeholder="your_calendar@group.calendar.google.com" id="gcal-input"/>
                  <Btn color={C.orange} onClick={()=>{const v=(document.getElementById("gcal-input") as any).value.trim();if(v)upd((d:any)=>({...d,googleCalendarId:v}));}}>Save</Btn>
                </div>
              </div>
            )}
            {data.googleCalendarId&&isDev&&<div style={{marginBottom:12,textAlign:"right"}}><OutBtn danger onClick={()=>upd((d:any)=>({...d,googleCalendarId:""}))}>Remove calendar</OutBtn></div>}
            {data.events.map((e:any)=>(
              <div key={e.id} style={cardS}>
                {e.image&&<img src={e.image} alt="" style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:6,marginBottom:10}}/>}
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:15}}>{e.title}</div>
                    <div style={{fontSize:13,color:C.muted,marginTop:4}}>{e.date} · {e.time} · {e.location}</div>
                    <div style={{fontSize:13,marginTop:6}}>{e.desc}</div>
                  </div>
                  {isOfficer&&<OutBtn danger onClick={()=>upd((d:any)=>({...d,events:d.events.filter((x:any)=>x.id!==e.id)}))}>Remove</OutBtn>}
                </div>
              </div>
            ))}
          </div>
        )}

        {page==="resources"&&<ResourcesPage data={data} upd={upd} isOfficer={isOfficer}/>}

        {page==="problems"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <h2 style={{margin:0}}>Problems</h2>
              {isOfficer&&<div style={{display:"flex",gap:8}}>
                <SecBtn onClick={()=>setModal("importSheet")}>+Import from Sheets</SecBtn>
                <SecBtn onClick={()=>setModal("prob")}>+ New problem</SecBtn>
                <Btn onClick={()=>setModal("unit")}>+ New unit</Btn>
              </div>}
            </div>
            {isGuest?(
              <div style={{...cardS,borderLeft:`3px solid ${C.guest}`,textAlign:"center",padding:"2rem"}}>
                <div style={{fontSize:32,marginBottom:12}}>🔒</div>
                <div style={{fontWeight:600,fontSize:16,marginBottom:8}}>Sign in to practice</div>
                <div style={{fontSize:14,color:C.muted}}>Create a free account to access all practice problems, track your progress, and appear on the leaderboard.</div>
              </div>
            ):(
              <>
                <div style={{background:`${C.orange}18`,borderRadius:8,padding:"8px 14px",marginBottom:16,fontSize:13,color:C.orange}}>Units group problems together. Start a unit to go through them back-to-back.</div>
                {data.units.length===0&&<p style={{color:C.muted}}>No units yet.</p>}
                {data.units.map((unit:any)=>{
                  const probs=unit.problemIds.map((id:any)=>data.problems.find((p:any)=>p.id===id)).filter(Boolean);
                  const solved=probs.filter((p:any)=>myCompleted.includes(p.id)).length;
                  return(
                    <div key={unit.id} style={{...cardS,cursor:"pointer"}} onClick={()=>setActiveUnit(unit.id)}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{unit.title}</div>
                          {unit.desc&&<div style={{fontSize:13,color:C.muted,marginBottom:10}}>{unit.desc}</div>}
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{probs.map((p:any)=><Tag key={p.id} c={diffColor[p.difficulty]}>{p.title}</Tag>)}</div>
                        </div>
                        <div style={{textAlign:"right",marginLeft:16,flexShrink:0}}>
                          <div style={{fontSize:22,fontWeight:700,color:C.orange}}>{solved}/{probs.length}</div>
                          <div style={{fontSize:11,color:C.muted}}>solved</div>
                        </div>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}>
                        <Btn onClick={(e:any)=>{e.stopPropagation();setActiveUnit(unit.id);}}>Start unit c</Btn>
                        {isOfficer&&<div style={{display:"flex",gap:8}} onClick={(e:any)=>e.stopPropagation()}>
                          <SecBtn onClick={()=>setModal({type:"editUnit",unit})}>Edit problems</SecBtn>
                          <OutBtn danger onClick={()=>upd((d:any)=>({...d,units:d.units.filter((x:any)=>x.id!==unit.id)}))}>Remove</OutBtn>
                        </div>}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {page==="coding"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{margin:0}}>Coding Questions</h2>
              {isOfficer&&<Btn onClick={()=>setModal("codingQ")}>+ New question</Btn>}
            </div>
            {isGuest?(
              <div style={{...cardS,borderLeft:`3px solid ${C.guest}`,textAlign:"center",padding:"2rem"}}>
                <div style={{fontSize:32,marginBottom:12}}>🔒</div>
                <div style={{fontWeight:600,fontSize:16,marginBottom:8}}>Sign in to code</div>
                <div style={{fontSize:14,color:C.muted}}>Create a free account to access coding challenges.</div>
              </div>
            ):(
              <>
                <div style={{background:`${C.orange}18`,border:`1px solid ${C.orange}33`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:C.blue}}>
                  💡 Write your solution as a JavaScript function named <code style={{background:C.bgInput,padding:"1px 5px",borderRadius:3}}>solution</code>. Code runs directly in your browser against the test cases. Python/Java/C++ shown for reference only.
                </div>
                {(data.codingQuestions||[]).length===0&&<p style={{color:C.muted}}>No coding questions yet.</p>}
                {(data.codingQuestions||[]).map((cq:any)=>{
                  const sub=data.codingSubmissions?.[user.username]?.[cq.id];
                  const pct=sub?sub.score:null;
                  return(
                    <div key={cq.id} style={{...cardS,cursor:"pointer"}} onClick={()=>setActiveCoding(cq.id)}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                            <span style={{fontWeight:700,fontSize:16}}>{cq.title}</span>
                            <Tag c={diffColor[cq.difficulty]||C.muted}>{cq.difficulty}</Tag>
                            {cq.language&&<Tag c={C.orange}>{cq.language}</Tag>}
                          </div>
                          <div style={{fontSize:13,color:C.muted}}>{cq.desc?.split("\n")[0]}</div>
                          <div style={{fontSize:12,color:C.muted,marginTop:6}}>{cq.testCases?.length||0} test cases</div>
                        </div>
                        <div style={{textAlign:"right",marginLeft:16,flexShrink:0}}>
                          {pct!==null?<><div style={{fontSize:22,fontWeight:700,color:pct===100?C.green:pct>0?C.orange:C.red}}>{pct}%</div><div style={{fontSize:11,color:C.muted}}>best score</div></>:<div style={{fontSize:12,color:C.muted,marginTop:8}}>Not attempted</div>}
                        </div>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}>
                        <Btn color={C.orange} onClick={(e:any)=>{e.stopPropagation();setActiveCoding(cq.id);}}>Open→</Btn>
                        {isOfficer&&<div style={{display:"flex",gap:8}} onClick={(e:any)=>e.stopPropagation()}>
                          <SecBtn onClick={()=>setModal({type:"editCodingQ",cq})}>Edit</SecBtn>
                          <OutBtn danger onClick={()=>upd((d:any)=>({...d,codingQuestions:(d.codingQuestions||[]).filter((x:any)=>x.id!==cq.id)}))}>Remove</OutBtn>
                        </div>}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {page==="leaderboard"&&(isGuest?(
          <div style={{...cardS,borderLeft:`3px solid ${C.guest}`,textAlign:"center",padding:"2rem"}}>
            <div style={{fontSize:32,marginBottom:12}}>🔒</div>
            <div style={{fontWeight:600,fontSize:16,marginBottom:8}}>Sign in to view the leaderboard</div>
            <div style={{fontSize:14,color:C.muted}}>Create a free account to track your rank and compete with other members.</div>
          </div>
        ):<LeaderboardPage data={data} user={user}/>)}

        {page==="officers"&&isOfficer&&<OfficersPage data={data} upd={upd} isDev={isDev}/>}

        {page==="members"&&isDev&&(
          <div>
            <h2>Manage Members</h2>
            {data.users.filter((u:any)=>u.username!==DEV_ACCOUNT.username).map((u:any)=>(
              <div key={u.username} style={{...cardS,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontWeight:600}}>{u.name||u.username}</span>
                  <span style={{fontSize:12,color:C.muted,marginLeft:8}}>@{u.username}</span>
                  <Tag c={u.role==="officer"?C.orange:C.muted}>{u.role}</Tag>
                </div>
                <div style={{display:"flex",gap:8}}>
                  {u.role==="member"&&<SecBtn onClick={()=>upd((d:any)=>({...d,users:d.users.map((x:any)=>x.username===u.username?{...x,role:"officer"}:x)}))}>Make officer</SecBtn>}
                  {u.role==="officer"&&<Btn color={C.muted} onClick={()=>upd((d:any)=>({...d,users:d.users.map((x:any)=>x.username===u.username?{...x,role:"member"}:x)}))}>Demote</Btn>}
                  <OutBtn danger onClick={()=>upd((d:any)=>({...d,users:d.users.filter((x:any)=>x.username!==u.username)}))}>Delete</OutBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {modal&&<ModalBox modal={modal} setModal={setModal} data={data} upd={upd} isDev={isDev}/>}
      <BugReportBtn user={user}/>
    </div>
  );
}

function CodingView({cq,user,data,upd,onBack}:any){
  const [lang,setLang]=useState(cq.language||"JavaScript");
  const [code,setCode]=useState(cq.starterCode||"function solution() {\n  // your code here\n}");
  const [results,setResults]=useState<any>(null);
  const [running,setRunning]=useState(false);
  const myBest=data.codingSubmissions?.[user.username]?.[cq.id]?.score??null;

  const run=()=>{
    setRunning(true);
    setTimeout(()=>{
      const res=runCode(code,cq.testCases||[]);
      setResults(res);
      const passed=res.filter((r:any)=>r.pass).length;
      const score=cq.testCases?.length?Math.round((passed/cq.testCases.length)*100):0;
      if(score>(myBest??-1)){
        upd((d:any)=>({...d,codingSubmissions:{...(d.codingSubmissions||{}),[user.username]:{...((d.codingSubmissions||{})[user.username]||{}),[cq.id]:{score,code,timestamp:new Date().toISOString()}}}}));
      }
      setRunning(false);
    },100);
  };

  const passed=results?.filter((r:any)=>r.pass).length??0;
  const total=results?.length??0;
  const score=total>0?Math.round((passed/total)*100):0;

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <Header user={user} onSignOut={()=>{}} isDev={false} onManage={()=>{}}/>
      <div style={{maxWidth:1000,margin:"0 auto",padding:"1.5rem 1rem"}}>
        <OutBtn onClick={onBack} style={{marginBottom:16}}>← Back to Coding</OutBtn>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <span style={{fontWeight:700,fontSize:22}}>{cq.title}</span>
          <Tag c={diffColor[cq.difficulty]||C.muted}>{cq.difficulty}</Tag>
          {myBest!==null&&<Tag c={myBest===100?C.green:myBest>0?C.orange:C.red}>Best: {myBest}%</Tag>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div>
            <div style={{...cardS,marginBottom:12}}>
              <h3 style={{margin:"0 0 10px",fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Problem</h3>
              <div style={{fontSize:14,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{cq.desc}</div>
            </div>
            <div style={cardS}>
              <h3 style={{margin:"0 0 10px",fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Test Cases ({cq.testCases?.length||0})</h3>
              {(cq.testCases||[]).map((tc:any,i:number)=>(
                <div key={i} style={{padding:"8px 10px",borderRadius:6,marginBottom:6,background:C.bgInput,fontSize:13}}>
                  <div style={{color:C.muted,marginBottom:2}}>Input: <code style={{color:C.text}}>{tc.input}</code></div>
                  <div style={{color:C.muted}}>Expected: <code style={{color:C.green}}>{tc.expected}</code></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{...cardS,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <h3 style={{margin:0,fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Your Solution</h3>
                <div style={{display:"flex",gap:4}}>
                  {LANGS.map(l=>(
                    <button key={l} onClick={()=>setLang(l)} style={{padding:"3px 9px",fontSize:11,border:`1px solid ${lang===l?C.blue:C.border}`,borderRadius:5,background:lang===l?`${C.blue}22`:"transparent",color:lang===l?C.blue:C.muted,cursor:"pointer",fontWeight:lang===l?700:400}}>{l}</button>
                  ))}
                </div>
              </div>
              {lang!=="JavaScript"&&(
                <div style={{background:`${C.purple}18`,border:`1px solid ${C.purple}33`,borderRadius:6,padding:"6px 10px",fontSize:12,color:C.purple,marginBottom:8}}>
                  ⚠ Showing {lang} syntax. Execution runs as JavaScript — write your logic using the same function structure.
                </div>
              )}
              <textarea value={code} onChange={(e:any)=>setCode(e.target.value)} spellCheck={false}
                style={{...inp,height:280,resize:"vertical",fontFamily:"'Courier New',monospace",fontSize:13,lineHeight:1.6}}/>
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
                <Btn color={C.orange} onClick={run} disabled={running} style={{minWidth:120}}>{running?"Running…":"▶ Run code"}</Btn>
              </div>
            </div>
            {results&&(
              <div style={cardS}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <div style={{fontSize:28,fontWeight:700,color:score===100?C.green:score>0?C.orange:C.red}}>{score}%</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{passed}/{total} test cases passed</div>
                    <div style={{fontSize:12,color:C.muted}}>{score===100?"All tests passed! 🎉":score>0?"Keep going!":"No tests passed yet"}</div>
                  </div>
                </div>
                {results.map((r:any,i:number)=>(
                  <div key={i} style={{padding:"8px 10px",borderRadius:6,marginBottom:6,background:r.pass?`${C.green}15`:`${C.red}15`,border:`1px solid ${r.pass?C.green:C.red}33`,fontSize:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{color:r.pass?C.green:C.red,fontWeight:700}}>{r.pass?"✓":"✗"}</span>
                      <span style={{color:C.muted}}>Input: <code style={{color:C.text}}>{r.input}</code></span>
                    </div>
                    <div style={{color:C.muted}}>Expected: <code style={{color:C.green}}>{r.expected}</code></div>
                    {!r.pass&&<div style={{color:C.muted,marginTop:2}}>Got: <code style={{color:C.red}}>{r.got}</code></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FolderNode({node,depth=0,upd,isOfficer}:any){
  const [open,setOpen]=useState(depth===0);
  const [addingLink,setAddingLink]=useState(false);
  const [addingFolder,setAddingFolder]=useState(false);
  const [newLink,setNewLink]=useState({title:"",url:""});
  const [newFolderName,setNewFolderName]=useState("");

  const updateNode=(fn:any)=>upd((d:any)=>{
    const clone=(items:any[]):any[]=>{
      return items.map(item=>{
        if(item.id===node.id)return fn(item);
        if(item.isFolder)return{...item,children:clone(item.children||[]),items:(item.items||[])};
        return item;
      });
    };
    return{...d,resources:clone(d.resources||[])};
  });

  const removeFromParent=()=>upd((d:any)=>{
    const remove=(items:any[]):any[]=>items.filter((x:any)=>x.id!==node.id).map((item:any)=>
      item.isFolder?{...item,children:remove(item.children||[])}:item
    );
    return{...d,resources:remove(d.resources||[])};
  });

  const addLink=()=>{
    if(!newLink.title||!newLink.url)return;
    updateNode((f:any)=>({...f,items:[...(f.items||[]),{id:Date.now(),title:newLink.title,url:newLink.url}]}));
    setNewLink({title:"",url:""});setAddingLink(false);
  };
  const addSubFolder=()=>{
    if(!newFolderName.trim())return;
    updateNode((f:any)=>({...f,children:[...(f.children||[]),{id:`f${Date.now()}`,title:newFolderName.trim(),isFolder:true,children:[],items:[]}]}));
    setNewFolderName("");setAddingFolder(false);
  };
  const removeLink=(id:any)=>updateNode((f:any)=>({...f,items:(f.items||[]).filter((i:any)=>i.id!==id)}));

  const totalCount=(node.items||[]).length+(node.children||[]).length;

  return(
    <div style={{marginBottom:depth===0?8:4}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:open?"10px 10px 0 0":"10px",cursor:"pointer",marginLeft:depth*12}}>
        <span style={{fontSize:12,color:C.muted,transition:"transform 0.15s",display:"inline-block",transform:open?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
        <span style={{fontWeight:600,flex:1,fontSize:depth===0?14:13}}>📁 {node.title}</span>
        <span style={{fontSize:11,color:C.muted}}>{totalCount} item{totalCount!==1?"s":""}</span>
        {isOfficer&&<button onClick={(e:any)=>{e.stopPropagation();removeFromParent();}} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:16,padding:"0 2px"}}>×</button>}
      </div>
      {open&&(
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 10px 10px",padding:"8px 12px 10px",marginLeft:depth*12}}>
          {(node.children||[]).map((child:any)=>(
            <div key={child.id} style={{marginLeft:8,marginTop:6}}>
              <FolderNode node={child} depth={depth+1} upd={upd} isOfficer={isOfficer}/>
            </div>
          ))}
          {(node.items||[]).map((item:any)=>(
            <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 4px",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontWeight:500,fontSize:13}}>{item.title}</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <a href={item.url} target="_blank" rel="noreferrer" style={{color:C.orange,fontSize:13}}>Open</a>
                {isOfficer&&<button onClick={()=>removeLink(item.id)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:15}}>×</button>}
              </div>
            </div>
          ))}
          {(node.items||[]).length===0&&(node.children||[]).length===0&&<p style={{color:C.muted,fontSize:13,margin:"6px 0 4px"}}>Empty folder</p>}
          {isOfficer&&(
            <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
              {!addingLink&&!addingFolder&&(
                <>
                  <button onClick={()=>setAddingLink(true)} style={{background:"transparent",border:`1px dashed ${C.border}`,color:C.muted,padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:12}}>+ Add link</button>
                  <button onClick={()=>setAddingFolder(true)} style={{background:"transparent",border:`1px dashed ${C.border}`,color:C.muted,padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:12}}>+ Subfolder</button>
                </>
              )}
              {addingLink&&(
                <div style={{display:"flex",flexDirection:"column",gap:5,flex:1}}>
                  <input style={inp} placeholder="Link title" value={newLink.title} onChange={(e:any)=>setNewLink((l:any)=>({...l,title:e.target.value}))}/>
                  <input style={inp} placeholder="URL (https://...)" value={newLink.url} onChange={(e:any)=>setNewLink((l:any)=>({...l,url:e.target.value}))}/>
                  <div style={{display:"flex",gap:5}}><Btn onClick={addLink} style={{padding:"5px 12px",fontSize:12}}>Add</Btn><OutBtn onClick={()=>{setAddingLink(false);setNewLink({title:"",url:""}); }} style={{padding:"5px 10px",fontSize:12}}>Cancel</OutBtn></div>
                </div>
              )}
              {addingFolder&&(
                <div style={{display:"flex",gap:5,flex:1,alignItems:"center"}}>
                  <input style={inp} placeholder="Subfolder name" value={newFolderName} onChange={(e:any)=>setNewFolderName(e.target.value)} onKeyDown={(e:any)=>e.key==="Enter"&&addSubFolder()} autoFocus/>
                  <Btn onClick={addSubFolder} style={{padding:"5px 12px",fontSize:12,whiteSpace:"nowrap"}}>Create</Btn>
                  <OutBtn onClick={()=>{setAddingFolder(false);setNewFolderName("");}} style={{padding:"5px 10px",fontSize:12}}>Cancel</OutBtn>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResourcesPage({data,upd,isOfficer}:any){
  const [showNew,setShowNew]=useState(false);
  const [name,setName]=useState("");
  const add=()=>{
    if(!name.trim())return;
    upd((d:any)=>({...d,resources:[...(d.resources||[]),{id:`f${Date.now()}`,title:name.trim(),isFolder:true,children:[],items:[]}]}));
    setName("");setShowNew(false);
  };
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{margin:0}}>Resources</h2>
        {isOfficer&&<SecBtn onClick={()=>setShowNew(true)}>+ New folder</SecBtn>}
      </div>
      {showNew&&(
        <div style={{...cardS,display:"flex",gap:8,alignItems:"center"}}>
          <input style={inp} value={name} onChange={(e:any)=>setName(e.target.value)} placeholder="Folder name" onKeyDown={(e:any)=>e.key==="Enter"&&add()} autoFocus/>
          <Btn onClick={add}>Create</Btn>
          <OutBtn onClick={()=>{setShowNew(false);setName("");}}>Cancel</OutBtn>
        </div>
      )}
      {(data.resources||[]).length===0&&<p style={{color:C.muted,fontSize:13}}>No resources yet.</p>}
      {(data.resources||[]).map((folder:any)=>(
        <FolderNode key={folder.id} node={folder} upd={upd} isOfficer={isOfficer}/>
      ))}
    </div>
  );
}

function OfficersPage({data,upd,isDev}:any){
  const [showTask,setShowTask]=useState(false);
  const [showEvent,setShowEvent]=useState(false);
  const [taskForm,setTaskForm]=useState({title:"",dueDate:"",assignees:[] as string[]});
  const [eventForm,setEventForm]=useState({title:"",date:"",time:"2:40 PM",desc:""});
  const officerUsers=data.users.filter((u:any)=>u.role==="officer"||u.role==="developer");
  const tasks=data.officerTasks||[];
  const events=data.officerEvents||[];
  const today=new Date().toISOString().slice(0,10);
  const upcoming=[...events].filter((e:any)=>e.date>=today).sort((a:any,b:any)=>a.date.localeCompare(b.date));
  const past=[...events].filter((e:any)=>e.date<today).sort((a:any,b:any)=>b.date.localeCompare(a.date));
  const toggleTask=(id:any)=>upd((d:any)=>({...d,officerTasks:(d.officerTasks||[]).map((t:any)=>t.id===id?{...t,done:!t.done}:t)}));
  const addTask=()=>{
    if(!taskForm.title)return;
    upd((d:any)=>({...d,officerTasks:[...(d.officerTasks||[]),{id:Date.now(),title:taskForm.title,dueDate:taskForm.dueDate,assignees:taskForm.assignees,done:false}]}));
    setTaskForm({title:"",dueDate:"",assignees:[]});setShowTask(false);
  };
  const addEvent=()=>{
    if(!eventForm.title||!eventForm.date)return;
    upd((d:any)=>({...d,officerEvents:[...(d.officerEvents||[]),{id:Date.now(),...eventForm}]}));
    setEventForm({title:"",date:"",time:"2:40 PM",desc:""});setShowEvent(false);
  };
  const toggleAssignee=(name:string)=>setTaskForm((f:any)=>({...f,assignees:f.assignees.includes(name)?f.assignees.filter((a:string)=>a!==name):[...f.assignees,name]}));
  const overlay:any={position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000};
  const box:any={background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:440,maxHeight:"88vh",overflowY:"auto"};
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{margin:0}}>Officer Portal</h2>
        {isDev&&<div style={{display:"flex",gap:8}}><SecBtn onClick={()=>setShowTask(true)}>+ Task</SecBtn><SecBtn onClick={()=>setShowEvent(true)}>+ Event</SecBtn></div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <h3 style={{fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1,margin:"0 0 12px"}}>Officer Tasks</h3>
          {tasks.length===0&&<p style={{color:C.muted,fontSize:13}}>No tasks assigned yet.</p>}
          {tasks.map((t:any)=>{
            const overdue=t.dueDate&&t.dueDate<today&&!t.done;
            return(
              <div key={t.id} style={{...cardS,display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer",opacity:t.done?0.6:1}} onClick={()=>toggleTask(t.id)}>
                <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${t.done?C.green:C.border}`,background:t.done?C.green:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}>
                  {t.done&&<span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:500,textDecoration:t.done?"line-through":"none",color:t.done?C.muted:C.text}}>{t.title}</div>
                  {t.dueDate&&<div style={{fontSize:11,color:overdue?C.red:C.muted,marginTop:3}}>Due {t.dueDate}{overdue?" — Overdue":""}</div>}
                  {(t.assignees||[]).length>0&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>👤 {t.assignees.join(", ")}</div>}
                </div>
                {isDev&&<button onClick={(e:any)=>{e.stopPropagation();upd((d:any)=>({...d,officerTasks:(d.officerTasks||[]).filter((x:any)=>x.id!==t.id)}));}} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:16,lineHeight:1,padding:0}}>×</button>}
              </div>
            );
          })}
          {tasks.length>0&&<div style={{fontSize:12,color:C.muted,marginTop:4}}>{tasks.filter((t:any)=>t.done).length}/{tasks.length} completed</div>}
        </div>
        <div>
          <h3 style={{fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1,margin:"0 0 12px"}}>Officer Events</h3>
          {upcoming.length===0&&past.length===0&&<p style={{color:C.muted,fontSize:13}}>No officer events yet.</p>}
          {upcoming.length>0&&<>
            <div style={{fontSize:11,color:C.green,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Upcoming</div>
            {upcoming.map((e:any)=>(
              <div key={e.id} style={{...cardS,borderLeft:`3px solid ${C.green}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><div style={{fontWeight:600,fontSize:14}}>{e.title}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{e.date}{e.time?` · ${e.time}`:""}</div>{e.desc&&<div style={{fontSize:13,color:C.text,marginTop:4}}>{e.desc}</div>}</div>
                  {isDev&&<button onClick={()=>upd((d:any)=>({...d,officerEvents:(d.officerEvents||[]).filter((x:any)=>x.id!==e.id)}))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:16,lineHeight:1,padding:0,flexShrink:0}}>×</button>}
                </div>
              </div>
            ))}
          </>}
          {past.length>0&&<>
            <div style={{fontSize:11,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,margin:"12px 0 8px"}}>Past</div>
            {past.map((e:any)=>(
              <div key={e.id} style={{...cardS,opacity:0.6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><div style={{fontWeight:600,fontSize:14}}>{e.title}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{e.date}{e.time?` · ${e.time}`:""}</div>{e.desc&&<div style={{fontSize:13,marginTop:4}}>{e.desc}</div>}</div>
                  {isDev&&<button onClick={()=>upd((d:any)=>({...d,officerEvents:(d.officerEvents||[]).filter((x:any)=>x.id!==e.id)}))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:16,lineHeight:1,padding:0,flexShrink:0}}>×</button>}
                </div>
              </div>
            ))}
          </>}
        </div>
      </div>
      {showTask&&(
        <div style={overlay} onClick={()=>setShowTask(false)}>
          <div style={box} onClick={(e:any)=>e.stopPropagation()}>
            <h3 style={{margin:"0 0 16px",fontSize:16}}>New Officer Task</h3>
            <label style={lbl}>Task title</label>
            <input style={{...inp,marginBottom:12}} value={taskForm.title} onChange={(e:any)=>setTaskForm((f:any)=>({...f,title:e.target.value}))} placeholder="e.g. Prepare meeting agenda" autoFocus/>
            <label style={lbl}>Due date (optional)</label>
            <div style={{marginBottom:12}}><DatePicker value={taskForm.dueDate} onChange={(v:string)=>setTaskForm((f:any)=>({...f,dueDate:v}))}/></div>
            <label style={lbl}>Assign to officers (optional)</label>
            <div style={{border:`1px solid ${C.border}`,borderRadius:8,padding:8,marginBottom:16}}>
              {officerUsers.length===0&&<p style={{color:C.muted,fontSize:13,margin:0}}>No officers yet.</p>}
              {officerUsers.map((u:any)=>{const sel=taskForm.assignees.includes(u.name||u.username);return(
                <div key={u.username} onClick={()=>toggleAssignee(u.name||u.username)} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 8px",borderRadius:6,cursor:"pointer",background:sel?C.bgInput:"transparent",marginBottom:2}}>
                  <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${sel?C.orange:C.border}`,background:sel?C.orange:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{sel&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}</div>
                  <span style={{fontSize:14}}>{u.name||u.username}</span><Tag c={C.muted}>{u.role}</Tag>
                </div>
              );})}
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><OutBtn onClick={()=>setShowTask(false)}>Cancel</OutBtn><Btn onClick={addTask}>Add Task</Btn></div>
          </div>
        </div>
      )}
      {showEvent&&(
        <div style={overlay} onClick={()=>setShowEvent(false)}>
          <div style={box} onClick={(e:any)=>e.stopPropagation()}>
            <h3 style={{margin:"0 0 16px",fontSize:16}}>New Officer Event</h3>
            <label style={lbl}>Event title</label>
            <input style={{...inp,marginBottom:12}} value={eventForm.title} onChange={(e:any)=>setEventForm((f:any)=>({...f,title:e.target.value}))} autoFocus/>
            <label style={lbl}>Date</label><div style={{marginBottom:12}}><DatePicker value={eventForm.date} onChange={(v:string)=>setEventForm((f:any)=>({...f,date:v}))}/></div>
            <label style={lbl}>Time</label><div style={{marginBottom:12}}><TimePicker value={eventForm.time} onChange={(v:string)=>setEventForm((f:any)=>({...f,time:v}))}/></div>
            <label style={lbl}>Description (optional)</label>
            <textarea style={{...inp,height:70,resize:"vertical",marginBottom:16}} value={eventForm.desc} onChange={(e:any)=>setEventForm((f:any)=>({...f,desc:e.target.value}))}/>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><OutBtn onClick={()=>setShowEvent(false)}>Cancel</OutBtn><Btn onClick={addEvent}>Add Event</Btn></div>
          </div>
        </div>
      )}
    </div>
  );
}

function OfficerImgPick({image,onPick}:any){
  const ref=useRef<any>();
  return(
    <div style={{marginBottom:8}}>
      <button type="button" onClick={()=>ref.current.click()} style={{background:C.bgInput,border:`1px dashed ${C.border}`,color:C.muted,padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:12,width:"100%"}}>{image?"Change photo":"Upload photo"}</button>
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={async(e:any)=>{if(e.target.files[0])onPick(await toB64(e.target.files[0]));}}/>
    </div>
  );
}

function AboutPage({data,upd,isOfficer}:any){
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState<any>(null);
  const ref=useRef<any>();
  const startEdit=()=>{setDraft(JSON.parse(JSON.stringify(data.about)));setEditing(true);};
  const save=()=>{upd((d:any)=>({...d,about:draft}));setEditing(false);};
  const addImg=async(file:File)=>{const b=await toB64(file);setDraft((d:any)=>({...d,images:[...(d.images||[]),b]}));};
  const about=editing?draft:data.about;
  const contacts=about.contacts||[];
  const addContact=()=>setDraft((d:any)=>({...d,contacts:[...(d.contacts||[]),{id:Date.now(),label:"",url:""}]}));
  const removeContact=(i:number)=>setDraft((d:any)=>({...d,contacts:(d.contacts||[]).filter((_:any,j:number)=>j!==i)}));
  const updateContact=(i:number,field:string,val:string)=>setDraft((d:any)=>{const cs=[...(d.contacts||[])];cs[i]={...cs[i],[field]:val};return{...d,contacts:cs};});
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{margin:0}}>About Us</h2>
        {isOfficer&&!editing&&<Btn onClick={startEdit}>Edit page</Btn>}
        {editing&&<div style={{display:"flex",gap:8}}><OutBtn onClick={()=>setEditing(false)}>Cancel</OutBtn><Btn onClick={save}>Save</Btn></div>}
      </div>
      <div style={{...cardS,marginBottom:20}}>
        {editing?(<><label style={lbl}>Heading</label><input style={{...inp,marginBottom:12}} value={draft.heading} onChange={(e:any)=>setDraft((d:any)=>({...d,heading:e.target.value}))}/><label style={lbl}>Body text</label><textarea style={{...inp,minHeight:140,resize:"vertical"}} value={draft.body} onChange={(e:any)=>setDraft((d:any)=>({...d,body:e.target.value}))}/></>)
        :(<><h3 style={{fontFamily:"'Georgia',serif",fontSize:20,fontWeight:400,marginTop:0,marginBottom:12,color:C.orange}}>{about.heading}</h3>{about.body.split("\n").map((line:string,i:number)=>line?<p key={i} style={{margin:"0 0 10px",lineHeight:1.7}}>{line}</p>:<br key={i}/>)}</>)}
      </div>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0,fontSize:14,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Photos</h3>
          {editing&&<><SecBtn onClick={()=>ref.current.click()} style={{fontSize:12,padding:"5px 12px"}}>+ Add photo</SecBtn><input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={(e:any)=>{if(e.target.files[0])addImg(e.target.files[0]);}}/></>}
        </div>
        {(about.images||[]).length===0&&!editing&&<p style={{color:C.muted,fontSize:13}}>No photos yet.</p>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
          {(about.images||[]).map((img:string,i:number)=>(
            <div key={i} style={{position:"relative"}}><img src={img} alt="" style={{width:"100%",height:140,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}`}}/>
              {editing&&<button onClick={()=>setDraft((d:any)=>({...d,images:d.images.filter((_:any,j:number)=>j!==i)}))} style={{position:"absolute",top:6,right:6,background:C.red,color:"#fff",border:"none",borderRadius:"50%",width:24,height:24,cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>}
            </div>
          ))}
        </div>
      </div>
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0,fontSize:14,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Officers</h3>
          {editing&&<SecBtn onClick={()=>setDraft((d:any)=>({...d,officers:[...(d.officers||[]),{name:"",role:"Officer",image:""}]}))} style={{fontSize:12,padding:"5px 12px"}}>+ Add officer</SecBtn>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}}>
          {(about.officers||[]).map((o:any,i:number)=>(
            <div key={i} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",textAlign:"center"}}>
              {o.image?<img src={o.image} alt={o.name} style={{width:56,height:56,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.orange}`,margin:"0 auto 8px",display:"block"}}/>
                :<div style={{width:56,height:56,borderRadius:"50%",background:`${C.orange}33`,border:`2px solid ${C.orange}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",fontWeight:700,fontSize:20,color:C.orange}}>{(o.name||"?")[0]}</div>}
              {editing?(<>
                <OfficerImgPick image={o.image} onPick={(v:string)=>{const os=[...draft.officers];os[i]={...os[i],image:v};setDraft((d:any)=>({...d,officers:os}));}}/>
                <input style={{...inp,marginBottom:6,textAlign:"center",fontSize:13}} value={o.name} placeholder="Name" onChange={(e:any)=>{const os=[...draft.officers];os[i]={...os[i],name:e.target.value};setDraft((d:any)=>({...d,officers:os}));}}/>
                <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`}}>
                  {["Officer","President"].map(r=><button key={r} type="button" onClick={()=>{const os=[...draft.officers];os[i]={...os[i],role:r};setDraft((d:any)=>({...d,officers:os}));}} style={{flex:1,padding:"7px 0",fontSize:12,fontWeight:o.role===r?700:400,border:"none",cursor:"pointer",background:o.role===r?C.orange:C.bgInput,color:o.role===r?"#fff":C.muted,transition:"all 0.15s"}}>{r}</button>)}
                </div>
                <button onClick={()=>setDraft((d:any)=>({...d,officers:d.officers.filter((_:any,j:number)=>j!==i)}))} style={{marginTop:6,background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:12}}>Remove</button>
              </>):(<><div style={{fontWeight:600,fontSize:14}}>{o.name||"—"}</div><div style={{fontSize:12,color:C.orange,marginTop:2}}>{o.role}</div></>)}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0,fontSize:14,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Contact</h3>
          {editing&&<SecBtn onClick={addContact} style={{fontSize:12,padding:"5px 12px"}}>+ Add button</SecBtn>}
        </div>
        {contacts.length===0&&!editing&&<p style={{color:C.muted,fontSize:13}}>No contact links yet.</p>}
        {!editing&&contacts.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:10}}>{contacts.map((c:any,i:number)=><a key={i} href={c.url} target="_blank" rel="noreferrer" style={{display:"inline-block",background:`${C.orange}18`,color:C.orange,border:`1px solid ${C.orange}44`,padding:"8px 18px",borderRadius:8,fontSize:14,fontWeight:600,textDecoration:"none"}}>{c.label||"Link"}</a>)}</div>}
        {editing&&<div>{contacts.map((c:any,i:number)=><div key={c.id} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}><input style={{...inp,width:140}} value={c.label} placeholder="Button label" onChange={(e:any)=>updateContact(i,"label",e.target.value)}/><input style={inp} value={c.url} placeholder="https://..." onChange={(e:any)=>updateContact(i,"url",e.target.value)}/><button onClick={()=>removeContact(i)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:18,flexShrink:0}}>×</button></div>)}</div>}
      </div>
    </div>
  );
}

function UnitView({unit,data,user,upd,onBack,onFinish,onProblem}:any){
  const probs=unit.problemIds.map((id:any)=>data.problems.find((p:any)=>p.id===id)).filter(Boolean);
  const myCompleted=user?(data.completions[user.username]||[]):[];
  const startUnit=()=>{
    if(!probs.length)return;
    const go=(idx:number)=>{if(idx>=probs.length){onFinish?onFinish():onBack();return;}onProblem(probs[idx].id,{unitTitle:unit.title,index:idx,total:probs.length,onNext:()=>go(idx+1)});};
    go(0);
  };
  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <Header user={user} onSignOut={()=>{}} isDev={false} onManage={()=>{}}/>
      <div style={{maxWidth:700,margin:"0 auto",padding:"2rem 1rem"}}>
        <OutBtn onClick={onBack} style={{marginBottom:16}}>← Back to Problems</OutBtn>
        <div style={{background:`linear-gradient(135deg,${C.navy}99,#1a1d27)`,borderRadius:12,padding:"1.5rem",marginBottom:24,border:`1px solid ${C.border}`}}>
          <h2 style={{margin:"0 0 6px",fontSize:22,fontFamily:"'Georgia',serif",fontWeight:400}}>{unit.title}</h2>
          {unit.desc&&<p style={{color:C.muted,margin:"0 0 16px",fontSize:14}}>{unit.desc}</p>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,color:C.muted}}>{probs.length} problems · {probs.filter((p:any)=>myCompleted.includes(p.id)).length} solved</span>
            <Btn onClick={startUnit}>Start unit →</Btn>
          </div>
        </div>
        {probs.map((p:any,i:number)=>{const done=myCompleted.includes(p.id);return(
          <div key={p.id} style={{...cardS,display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${done?C.green:C.border}`,background:done?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:done?"#fff":C.muted,flexShrink:0}}>{done?"✓":i+1}</div>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:600}}>{p.title}</span><Tag c={diffColor[p.difficulty]}>{p.difficulty}</Tag></div>
          </div>
        );})}
      </div>
    </div>
  );
}

function ProblemView({prob,user,data,upd,onBack,unitCtx,onNext}:any){
  const [selected,setSelected]=useState<any>(null);
  const [submitted,setSubmitted]=useState(false);
  const [result,setResult]=useState<any>(null);
  const completed=(data.completions[user.username]||[]).includes(prob.id);
  const submit=()=>{
    if(selected===null)return;
    const correct=selected===prob.answer;
    setResult(correct);setSubmitted(true);
    upd((d:any)=>{
      const today=new Date().toISOString().slice(0,10);
      const ua=d.attempts[user.username]||{total:0,correct:0};
      const na={total:ua.total+1,correct:ua.correct+(correct?1:0)};
      const s=d.streaks[user.username]||{lastDate:null,current:0,best:0};
      let ns={...s};
      if(correct){const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
        if(s.lastDate===today){}else if(s.lastDate===yesterday){ns.current=s.current+1;ns.lastDate=today;}else{ns.current=1;ns.lastDate=today;}
        if(ns.current>ns.best)ns.best=ns.current;}
      const completions=correct&&!completed?{...d.completions,[user.username]:[...(d.completions[user.username]||[]),prob.id]}:d.completions;
      return{...d,completions,attempts:{...d.attempts,[user.username]:na},streaks:{...d.streaks,[user.username]:ns}};
    });
  };
  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <Header user={user} onSignOut={()=>{}} isDev={false} onManage={()=>{}}/>
      {unitCtx&&<div style={{background:"#111827",padding:"8px 1.5rem",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:13,color:C.muted}}>{unitCtx.unitTitle}</span><span style={{fontSize:12,color:C.muted}}>·</span>
        <span style={{fontSize:13,color:C.orange,fontWeight:600}}>Question {unitCtx.index+1} of {unitCtx.total}</span>
        <div style={{flex:1,height:4,background:C.border,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${((unitCtx.index+1)/unitCtx.total)*100}%`,background:C.orange,borderRadius:2}}/></div>
      </div>}
      <div style={{maxWidth:600,margin:"0 auto",padding:"2rem 1rem"}}>
        <OutBtn onClick={onBack} style={{marginBottom:20}}>← {unitCtx?unitCtx.unitTitle:"Back"}</OutBtn>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <span style={{fontWeight:700,fontSize:20}}>{prob.title}</span>
          <Tag c={diffColor[prob.difficulty]}>{prob.difficulty}</Tag>
          {completed&&!submitted&&<Tag c={C.green}>Already solved</Tag>}
        </div>
        <div style={{...cardS,fontSize:16,lineHeight:1.7,marginBottom:20}}>{prob.desc}</div>
        <div style={{marginBottom:24}}>
          {prob.choices.map((ch:string,i:number)=>{
            let bg=C.bgCard,border=C.border,color=C.text;
            if(submitted){if(i===prob.answer){bg=`${C.green}22`;border=C.green;color=C.green;}else if(i===selected){bg=`${C.red}22`;border=C.red;color=C.red;}}
            else if(selected===i){bg=`${C.orange}22`;border=C.orange;color=C.orange;}
            return(<div key={i} onClick={()=>!submitted&&setSelected(i)} style={{background:bg,border:`1.5px solid ${border}`,color,borderRadius:8,padding:"12px 16px",marginBottom:10,cursor:submitted?"default":"pointer",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:26,height:26,borderRadius:"50%",border:`1.5px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0,color}}>{String.fromCharCode(65+i)}</div>
              <span style={{fontSize:15}}>{ch}</span>
              {submitted&&i===prob.answer&&<span style={{marginLeft:"auto",fontWeight:700}}>✓ Correct</span>}
              {submitted&&i===selected&&i!==prob.answer&&<span style={{marginLeft:"auto",fontWeight:700}}>✗ Wrong</span>}
            </div>);
          })}
        </div>
        {!submitted?<Btn disabled={selected===null} onClick={submit} style={{padding:"10px 28px"}}>Submit answer</Btn>:(
          <div>
            <div style={{background:result?`${C.green}22`:`${C.red}22`,border:`1px solid ${result?C.green:C.red}`,borderRadius:8,padding:"12px 16px",marginBottom:16,color:result?C.green:C.red,fontWeight:600}}>
              {result?"Correct! +1 added to your score. 🎉":"Not quite — the correct answer is highlighted above."}
            </div>
            <div style={{display:"flex",gap:10}}>
              <OutBtn onClick={onBack}>{unitCtx?"Back to unit":"Back to problems"}</OutBtn>
              {unitCtx&&onNext&&<Btn onClick={onNext}>{unitCtx.index+1<unitCtx.total?"Next question →":"Finish unit ✓"}</Btn>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardPage({data,user}:any){
  const [lbTab,setLbTab]=useState("solved");
  const medal=(i:number)=>i===0?C.orange:i===1?C.blue:C.muted;
  const medalBg=(i:number)=>i===0?`${C.orange}44`:i===1?`${C.blue}44`:C.border;
  const solvedRows=[...data.users].map((u:any)=>({name:u.name||u.username,username:u.username,value:(data.completions[u.username]||[]).length,label:"solved"})).sort((a:any,b:any)=>b.value-a.value);
  const accuracyRows=[...data.users].map((u:any)=>{const a=data.attempts[u.username]||{total:0,correct:0};return{name:u.name||u.username,username:u.username,value:a.total>0?Math.round((a.correct/a.total)*100):0,sub:`${a.correct||0}/${a.total||0} attempts`,label:"%"};}).sort((a:any,b:any)=>b.value-a.value);
  const streakRows=[...data.users].map((u:any)=>{const s=data.streaks[u.username]||{current:0,best:0};return{name:u.name||u.username,username:u.username,value:s.current,sub:`Best: ${s.best}`,label:"day streak"};}).sort((a:any,b:any)=>b.value-a.value);
  const rows=lbTab==="solved"?solvedRows:lbTab==="accuracy"?accuracyRows:streakRows;
  const tabBtn=(t:string)=>({background:lbTab===t?`${C.orange}28`:"transparent",color:lbTab===t?C.orange:C.muted,border:`1px solid ${lbTab===t?C.orange:C.border}`,padding:"6px 16px",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:lbTab===t?700:400});
  return(
    <div>
      <h2 style={{marginBottom:16}}>Leaderboard</h2>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        <button style={tabBtn("solved")} onClick={()=>setLbTab("solved")}>Problems Solved</button>
        <button style={tabBtn("accuracy")} onClick={()=>setLbTab("accuracy")}>Accuracy</button>
        <button style={tabBtn("streak")} onClick={()=>setLbTab("streak")}>Daily Streak</button>
      </div>
      {rows.map((u:any,i:number)=>(
        <div key={u.username} style={{...cardS,display:"flex",alignItems:"center",gap:14,marginBottom:8}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:medalBg(i),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:medal(i),flexShrink:0}}>{i+1}</div>
          <div style={{flex:1}}><span style={{fontWeight:600}}>{u.name}</span>{u.username===user.username&&<span style={{fontSize:11,color:C.orange,marginLeft:8}}>you</span>}{u.sub&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{u.sub}</div>}</div>
          <div style={{fontWeight:700,color:C.orange,fontSize:18}}>{u.value}{u.label==="%"?"%":""}</div>
          {u.label!=="%"&&<div style={{fontSize:12,color:C.muted}}>{u.label}</div>}
        </div>
      ))}
    </div>
  );
}

function ModalBox({modal,setModal,data,upd,isDev}:any){
  const isEditUnit=modal&&modal.type==="editUnit";
  const isEditCodingQ=modal&&modal.type==="editCodingQ";
  const isImportSheet=modal==="importSheet";
  const editUnit=isEditUnit?modal.unit:null;
  const editCQ=isEditCodingQ?modal.cq:null;
  const [selProbs,setSelProbs]=useState(editUnit?[...editUnit.problemIds]:[]);
  const [f,setF]=useState<any>({difficulty:"Easy",choices:["","","",""],answer:0,image:"",selectedProblemIds:[],title:"",body:"",date:"",time:"2:40 PM",location:"",desc:"",url:""});
  const [cqForm,setCqForm]=useState<any>(editCQ?{...editCQ,testCases:[...(editCQ.testCases||[])]}:{title:"",difficulty:"Easy",language:"JavaScript",desc:"",starterCode:"function solution() {\n  // your code here\n}",testCases:[{input:"",expected:""}]});
  const [sheetUrl,setSheetUrl]=useState("");
  const [importing,setImporting]=useState(false);
  const [importErr,setImportErr]=useState("");
  const set=(patch:any)=>setF((prev:any)=>({...prev,...patch}));
  const setChoice=(i:number,v:string)=>setF((p:any)=>{const c=[...p.choices];c[i]=v;return{...p,choices:c};});
  const toggleProb=(id:any)=>setF((p:any)=>({...p,selectedProblemIds:p.selectedProblemIds.includes(id)?p.selectedProblemIds.filter((x:any)=>x!==id):[...p.selectedProblemIds,id]}));
  const close=()=>setModal(null);

  if(isEditUnit){
    const toggleSel=(id:any)=>setSelProbs((s:any)=>s.includes(id)?s.filter((x:any)=>x!==id):[...s,id]);
    const saveEdit=()=>{upd((d:any)=>({...d,units:d.units.map((u:any)=>u.id===editUnit.id?{...u,problemIds:selProbs}:u)}));close();};
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={close}>
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:480,maxHeight:"88vh",overflowY:"auto"}} onClick={(e:any)=>e.stopPropagation()}>
          <h3 style={{margin:"0 0 4px",fontSize:16}}>Edit unit problems</h3>
          <p style={{color:C.muted,fontSize:13,margin:"0 0 14px"}}>{editUnit.title}</p>
          <div style={{maxHeight:320,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:8,padding:8,marginBottom:14}}>
            {data.problems.map((p:any)=>{const sel=selProbs.includes(p.id);return(
              <div key={p.id} onClick={()=>toggleSel(p.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:6,cursor:"pointer",background:sel?`${C.orange}18`:"transparent",border:`1px solid ${sel?C.orange:"transparent"}`,marginBottom:4}}>
                <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${sel?C.orange:C.border}`,background:sel?C.orange:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{sel&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}</div>
                <span style={{flex:1,fontSize:14}}>{p.title}</span><Tag c={diffColor[p.difficulty]}>{p.difficulty}</Tag>
              </div>
            );})}
          </div>
          <p style={{fontSize:12,color:C.orange,margin:"0 0 14px"}}>{selProbs.length} problem{selProbs.length!==1?"s":""} selected</p>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><OutBtn onClick={close}>Cancel</OutBtn><Btn onClick={saveEdit}>Save changes</Btn></div>
        </div>
      </div>
    );
  }

  if(isEditCodingQ||modal==="codingQ"){
    const addTC=()=>setCqForm((f:any)=>({...f,testCases:[...f.testCases,{input:"",expected:""}]}));
    const removeTC=(i:number)=>setCqForm((f:any)=>({...f,testCases:f.testCases.filter((_:any,j:number)=>j!==i)}));
    const setTC=(i:number,field:string,v:string)=>setCqForm((f:any)=>{const tc=[...f.testCases];tc[i]={...tc[i],[field]:v};return{...f,testCases:tc};});
    const saveCQ=()=>{
      if(!cqForm.title||!cqForm.desc)return;
      if(isEditCodingQ){upd((d:any)=>({...d,codingQuestions:(d.codingQuestions||[]).map((q:any)=>q.id===editCQ.id?{...cqForm,id:editCQ.id}:q)}));}
      else{upd((d:any)=>({...d,codingQuestions:[...(d.codingQuestions||[]),{...cqForm,id:Date.now()}]}));}
      close();
    };
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={close}>
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:580,maxHeight:"90vh",overflowY:"auto"}} onClick={(e:any)=>e.stopPropagation()}>
          <h3 style={{margin:"0 0 16px",fontSize:16}}>{isEditCodingQ?"Edit Coding Question":"New Coding Question"}</h3>
          <label style={lbl}>Title</label>
          <input style={{...inp,marginBottom:10}} value={cqForm.title} onChange={(e:any)=>setCqForm((f:any)=>({...f,title:e.target.value}))} placeholder="e.g. Sum Two Numbers"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={lbl}>Difficulty</label><select style={inp} value={cqForm.difficulty} onChange={(e:any)=>setCqForm((f:any)=>({...f,difficulty:e.target.value}))}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
            <div><label style={lbl}>Language hint</label><select style={inp} value={cqForm.language} onChange={(e:any)=>setCqForm((f:any)=>({...f,language:e.target.value}))}>{LANGS.map(l=><option key={l}>{l}</option>)}</select></div>
          </div>
          <label style={lbl}>Problem description</label>
          <textarea style={{...inp,height:100,resize:"vertical",marginBottom:10}} value={cqForm.desc} onChange={(e:any)=>setCqForm((f:any)=>({...f,desc:e.target.value}))} placeholder="Describe the problem. Include examples."/>
          <label style={lbl}>Starter code (JavaScript function named solution)</label>
          <textarea style={{...inp,height:80,resize:"vertical",fontFamily:"monospace",fontSize:13,marginBottom:14}} value={cqForm.starterCode} onChange={(e:any)=>setCqForm((f:any)=>({...f,starterCode:e.target.value}))}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <label style={{...lbl,margin:0}}>Test cases</label>
            <button onClick={addTC} style={{background:"transparent",border:`1px dashed ${C.border}`,color:C.muted,padding:"3px 10px",borderRadius:5,cursor:"pointer",fontSize:12}}>+ Add test case</button>
          </div>
          <div style={{background:C.bgInput,borderRadius:8,padding:10,marginBottom:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:6,marginBottom:6}}>
              <span style={{fontSize:11,color:C.muted}}>Input (comma-sep args)</span>
              <span style={{fontSize:11,color:C.muted}}>Expected output</span><span/>
            </div>
            {cqForm.testCases.map((tc:any,i:number)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:6,marginBottom:6}}>
                <input style={{...inp,fontSize:12,fontFamily:"monospace"}} value={tc.input} onChange={(e:any)=>setTC(i,"input",e.target.value)} placeholder="e.g. 2,3"/>
                <input style={{...inp,fontSize:12,fontFamily:"monospace"}} value={tc.expected} onChange={(e:any)=>setTC(i,"expected",e.target.value)} placeholder="e.g. 5"/>
                <button onClick={()=>removeTC(i)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:18,padding:"0 4px"}}>×</button>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><OutBtn onClick={close}>Cancel</OutBtn><Btn onClick={saveCQ}>{isEditCodingQ?"Save changes":"Create question"}</Btn></div>
        </div>
      </div>
    );
  }

  if(isImportSheet){
    const doImport=async()=>{
      setImporting(true);setImportErr("");
      try{
        const match=sheetUrl.trim().match(/\/d\/([\w-]+)/);
        if(!match)throw new Error("Invalid Google Sheets URL");
        const csvUrl=`https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=0`;
        const resp=await fetch(csvUrl);
        if(!resp.ok)throw new Error("Could not fetch sheet. Make sure it is shared publicly (Anyone with the link can view).");
        const text=await resp.text();
        const lines=text.split("\n").map((l:string)=>l.trim()).filter((l:string)=>l);
        const rows=lines.slice(1);
        let cnt=0;
        const newProbs=rows.map((row:string)=>{
          const cols=row.match(/(".*?"|[^,]+)(?=,|$)/g)?.map((c:string)=>c.replace(/^"|"$/g,"").trim())||row.split(",").map((c:string)=>c.trim());
          if(cols.length<7)return null;
          const [title,difficulty,desc,a,b,c,d,ansRaw]=cols;
          let answer=parseInt(ansRaw);
          if(isNaN(answer)){const m:any={"A":0,"B":1,"C":2,"D":3};answer=m[ansRaw?.toUpperCase()]??0;}
          cnt++;
          return{id:Date.now()+cnt,title,difficulty:["Easy","Medium","Hard"].includes(difficulty)?difficulty:"Easy",desc,choices:[a,b,c,d],answer};
        }).filter(Boolean);
        if(newProbs.length===0)throw new Error("No valid rows found. Expected columns: Title, Difficulty, Question, A, B, C, D, Answer");
        upd((d:any)=>({...d,problems:[...d.problems,...newProbs]}));
        close();
      }catch(e:any){setImportErr(e.message);}
      setImporting(false);
    };
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={close}>
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:480}} onClick={(e:any)=>e.stopPropagation()}>
          <h3 style={{margin:"0 0 8px",fontSize:16}}>+Import from Google Sheets</h3>
          <p style={{color:C.muted,fontSize:13,margin:"0 0 12px"}}>Sheet must be <strong>publicly viewable</strong> with these columns in order:</p>
          <div style={{background:C.bgInput,borderRadius:6,padding:"8px 12px",fontSize:12,fontFamily:"monospace",color:C.green,marginBottom:12}}>Title | Difficulty | Question | A | B | C | D | Answer</div>
          <p style={{color:C.muted,fontSize:12,margin:"0 0 12px"}}>Answer column: 0–3 or A–D (0/A = first choice). Row 1 is the header and is skipped.</p>
          <label style={lbl}>Google Sheets URL</label>
          <input style={{...inp,marginBottom:10}} value={sheetUrl} onChange={(e:any)=>setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..."/>
          {importErr&&<p style={{color:C.red,fontSize:13,margin:"0 0 10px"}}>⚠ {importErr}</p>}
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><OutBtn onClick={close}>Cancel</OutBtn><Btn onClick={doImport} disabled={importing||!sheetUrl.trim()}>{importing?"Importing…":"Import"}</Btn></div>
        </div>
      </div>
    );
  }

  const submit=()=>{
    if(modal==="ann"){if(!f.title||!f.body)return;upd((d:any)=>({...d,announcements:[...d.announcements,{id:Date.now(),title:f.title,body:f.body,date:new Date().toISOString().slice(0,10),image:f.image||""}]}));}
    else if(modal==="evt"){if(!f.title||!f.date)return;upd((d:any)=>({...d,events:[...d.events,{id:Date.now(),title:f.title,date:f.date,time:f.time||"TBD",location:f.location||"TBD",desc:f.desc||"",image:f.image||""}]}));}
    else if(modal==="prob"){if(!f.title||!f.desc||f.choices.some((c:string)=>!c))return;upd((d:any)=>({...d,problems:[...d.problems,{id:Date.now(),title:f.title,difficulty:f.difficulty,desc:f.desc,choices:f.choices,answer:Number(f.answer)}]}));}
    else if(modal==="unit"){if(!f.title||!f.selectedProblemIds.length)return;upd((d:any)=>({...d,units:[...d.units,{id:Date.now(),title:f.title,desc:f.desc||"",problemIds:f.selectedProblemIds}]}));}
    close();
  };
  const titles:any={ann:"New Announcement",evt:"New Event",prob:"New Problem",unit:"Create Unit"};
  const overlay:any={position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000};
  const box:any={background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:["prob","unit","evt"].includes(modal)?520:430,maxHeight:"88vh",overflowY:"auto"};
  return(
    <div style={overlay} onClick={close}>
      <div style={box} onClick={(e:any)=>e.stopPropagation()}>
        <h3 style={{margin:"0 0 16px",fontSize:16}}>{titles[modal]}</h3>
        {modal==="ann"&&<><label style={lbl}>Title</label><input style={{...inp,marginBottom:10}} value={f.title} onChange={(e:any)=>set({title:e.target.value})}/><label style={lbl}>Body</label><textarea style={{...inp,height:80,resize:"vertical",marginBottom:10}} value={f.body} onChange={(e:any)=>set({body:e.target.value})}/><ImgPick preview={f.image} onPick={(v:string)=>set({image:v})}/></>}
        {modal==="evt"&&<>
          <label style={lbl}>Title</label><input style={{...inp,marginBottom:12}} value={f.title} onChange={(e:any)=>set({title:e.target.value})}/>
          <label style={lbl}>Date</label><div style={{marginBottom:12}}><DatePicker value={f.date} onChange={(v:string)=>set({date:v})}/></div>
          <label style={lbl}>Time</label><div style={{marginBottom:12}}><TimePicker value={f.time} onChange={(v:string)=>set({time:v})}/></div>
          <label style={lbl}>Location</label><input style={{...inp,marginBottom:10}} value={f.location} onChange={(e:any)=>set({location:e.target.value})}/>
          <label style={lbl}>Description</label><input style={{...inp,marginBottom:10}} value={f.desc} onChange={(e:any)=>set({desc:e.target.value})}/>
          <ImgPick preview={f.image} onPick={(v:string)=>set({image:v})}/>
        </>}
        {modal==="prob"&&<><label style={lbl}>Problem title</label><input style={{...inp,marginBottom:10}} value={f.title} onChange={(e:any)=>set({title:e.target.value})}/><label style={lbl}>Difficulty</label><select style={{...inp,marginBottom:10}} value={f.difficulty} onChange={(e:any)=>set({difficulty:e.target.value})}><option>Easy</option><option>Medium</option><option>Hard</option></select><label style={lbl}>Question</label><textarea style={{...inp,height:72,resize:"vertical",marginBottom:14}} value={f.desc} onChange={(e:any)=>set({desc:e.target.value})}/><label style={lbl}>Answer choices — select the correct one</label>{[0,1,2,3].map(i=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><input type="radio" name="ans" checked={Number(f.answer)===i} onChange={()=>set({answer:i})} style={{accentColor:C.orange,flexShrink:0}}/><div style={{width:24,height:24,borderRadius:"50%",background:`${C.orange}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.orange,flexShrink:0}}>{String.fromCharCode(65+i)}</div><input style={inp} value={f.choices[i]} placeholder={`Choice ${String.fromCharCode(65+i)}`} onChange={(e:any)=>setChoice(i,e.target.value)}/></div>))}</>}
        {modal==="unit"&&<><label style={lbl}>Unit title</label><input style={{...inp,marginBottom:10}} value={f.title} placeholder="e.g. Intro to Data Structures" onChange={(e:any)=>set({title:e.target.value})}/><label style={lbl}>Description (optional)</label><input style={{...inp,marginBottom:14}} value={f.desc} placeholder="Brief description" onChange={(e:any)=>set({desc:e.target.value})}/><label style={lbl}>Select problems</label><div style={{maxHeight:220,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:8,padding:8,marginBottom:12}}>{data.problems.length===0&&<p style={{color:C.muted,fontSize:13,margin:0}}>No problems yet.</p>}{data.problems.map((p:any)=>{const sel=f.selectedProblemIds.includes(p.id);return(<div key={p.id} onClick={()=>toggleProb(p.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:6,cursor:"pointer",background:sel?`${C.orange}18`:"transparent",border:`1px solid ${sel?C.orange:"transparent"}`,marginBottom:4}}><div style={{width:16,height:16,borderRadius:4,border:`2px solid ${sel?C.orange:C.border}`,background:sel?C.orange:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{sel&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}</div><span style={{flex:1,fontSize:14}}>{p.title}</span><Tag c={diffColor[p.difficulty]}>{p.difficulty}</Tag></div>);})}</div>{f.selectedProblemIds.length>0&&<p style={{fontSize:12,color:C.orange,margin:"0 0 4px"}}>{f.selectedProblemIds.length} problem{f.selectedProblemIds.length>1?"s":""} selected</p>}</>}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
          <OutBtn onClick={close}>Cancel</OutBtn>
          <Btn onClick={submit}>{modal==="unit"?"Create unit":"Add"}</Btn>
        </div>
      </div>
    </div>
  );
}

