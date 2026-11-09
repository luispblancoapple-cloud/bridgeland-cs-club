import { useState, useRef, useEffect } from "react";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, collection, addDoc, getDocs, getDoc, query, orderBy, updateDoc, deleteDoc, arrayUnion, limit } from "firebase/firestore";
import { FIRST_15_TIPS, UIL_TESTS, UIL_TOPIC_UNITS } from "./uilPrepData";
import UIL_PAPER_MAP from "./uilPaperMap.json";


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
// ARCHITECTURE: previously EVERYTHING (every user, problem, announcement, event...)
// lived in one single document (club/data). That has two serious failure modes:
// 1) that one document has a hard 1MB Firestore size limit shared by the whole club,
//    and 2) any single write touches the whole document, so a bug (or a transient
// error) in any one save could wipe unrelated data for everyone. Splitting each kind
// of item into its own collection/document removes both problems structurally: a
// new member registering can never touch problems, events, or other members' data,
// and each entity has effectively its own size budget.
const ABOUT_DOC = doc(db, "settings", "about");
const SITE_DOC = doc(db, "settings", "site");
const PLANNER_DOC = doc(db, "settings", "officerPlanner");
const LEGACY_DATA_DOC = doc(db, "club", "data"); // old single-document location — read-only now, used only for one-time migration

// SECURITY NOTE: passwords are never stored or shipped in plaintext. We only ever
// keep/compare a salted SHA-256 hash. See hashPassword() below. The dev account's
// password hash was generated once, offline — the real password is not in this file
// or in the Firestore document, so it can no longer be read via "View Source" or by
// reading the database.
const PW_SALT = "bcs-club-static-salt-v1";
// Date.now() alone can collide if two items are created within the same millisecond
// (e.g. quickly adding several MCQ choices/problems), which can cause id lookups to
// grab the wrong item. uid() adds a random component to make that effectively impossible.
function uid():number{ return Date.now()*1000+Math.floor(Math.random()*1000); }

// Minimal CSV parser (handles quoted fields containing commas/newlines) used by the
// "Import from Google Sheets" feature. Expects a Google Sheet published as CSV
// (File > Share > Publish to web > choose the sheet > CSV).
function parseCSV(text:string):string[][]{
  const rows:string[][]=[]; let row:string[]=[]; let field=""; let inQuotes=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQuotes){
      if(c==='"'){ if(text[i+1]==='"'){field+='"';i++;} else inQuotes=false; }
      else field+=c;
    }else{
      if(c==='"')inQuotes=true;
      else if(c===','){row.push(field);field="";}
      else if(c==='\n'){row.push(field);rows.push(row);row=[];field="";}
      else if(c==='\r'){/*skip*/}
      else field+=c;
    }
  }
  if(field.length||row.length){row.push(field);rows.push(row);}
  return rows.filter(r=>r.some(c=>c.trim()!==""));
}
async function hashPassword(pw:string):Promise<string>{
  const enc = new TextEncoder().encode(pw + PW_SALT);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
function showOnFirstVisit(key:string):boolean{
  try{
    if(localStorage.getItem(key)==="1")return false;
    localStorage.setItem(key,"1");
    return true;
  }catch{return true;}
}
const DEV_ACCOUNT: any = { username:"LuisBlanco62",passwordHash:"d76b58cc21175bccfb07399a4531e3a0141dce781c16f4e96ed05e29c5452d5f",role:"developer",name:"Luis Blanco" };
const GUEST_USER: any = { username:"__guest__",name:"Guest",role:"guest" };
const LOGO_URL = "https://pbs.twimg.com/profile_images/941019066268971008/x4ZldzQq.jpg";

const C = {
  bg:"var(--canvas)",bgCard:"var(--surface)",bgInput:"var(--surface-strong)",border:"var(--line)",
  navy:"var(--navy)",orange:"var(--orange)",orangeText:"var(--orange-text)",text:"var(--text)",muted:"var(--muted)",
  green:"var(--green)",red:"var(--red)",blue:"var(--blue)",blueText:"var(--blue-text)",guest:"var(--guest)",purple:"var(--purple)",
  navy99:"var(--navy-60)",navycc:"var(--navy-78)",bg88:"var(--canvas-88)",
  green15:"var(--green-15)",green18:"var(--green-18)",green22:"var(--green-22)",
  green33:"var(--green-33)",green44:"var(--green-44)",red33:"var(--red-33)",red44:"var(--red-44)",
  muted22:"var(--muted-22)",blue18:"var(--blue-18)",blue33:"var(--blue-33)",orange14:"var(--orange-14)",orange15:"var(--orange-15)",
  orange18:"var(--orange-18)",orange1f:"var(--orange-12)",orange22:"var(--orange-22)",
  orange28:"var(--orange-28)",orange33:"var(--orange-33)",orange44:"var(--orange-44)",orange66:"var(--orange-66)",
  red15:"var(--red-15)",red18:"var(--red-18)",red22:"var(--red-22)",
};
const diffColor: any = { Easy:C.green,Medium:C.orange,Hard:C.red };
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
function getNextClubMeeting(now=new Date()):Date{
  const meetingDays=[1,4]; // Monday and Thursday
  for(let offset=0;offset<7;offset++){
    const candidate=new Date(now.getFullYear(),now.getMonth(),now.getDate()+offset,14,40,0,0);
    if(meetingDays.includes(candidate.getDay())&&candidate.getTime()>=now.getTime())return candidate;
  }
  return new Date(now.getFullYear(),now.getMonth(),now.getDate()+7,14,40,0,0);
}
const HOURS=["12","1","2","3","4","5","6","7","8","9","10","11"];
const MINS=["00","15","30","45"];
const AMPM=["AM","PM"];
const LANGS=["Java","Python","C++"];

const LANG_IDS:any={"Python":71,"Java":62,"C++":54};

// Students write a complete, runnable program (their own main/entry point) that
// reads input via stdin — e.g. `Scanner input = new Scanner(System.in);` in Java,
// `input()`/`sys.stdin` in Python, `cin` in C++ — and prints the answer. Test case
// "input" is the raw text fed to the program's stdin; "expected" is the raw text the
// program should print. No source-code wrapping/injection needed, since the program
// is already complete — Judge0 runs it directly with that test case's stdin.
// Runs the code ONCE against arbitrary custom input and returns the raw output —
// used for the "test with your own input" panel, as opposed to runWithJudge0()
// above which grades against the problem's hidden test cases.
async function runCustom(code:string,lang:string,stdin:string):Promise<any>{
  const langId=LANG_IDS[lang]||93;
  const PUBLIC="https://ce.judge0.com";
  try{
    const sub=await fetch(`${PUBLIC}/submissions?base64_encoded=false&wait=true`,{
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify({source_code:code,language_id:langId,stdin:stdin||"",cpu_time_limit:5,memory_limit:262144}),
    });
    if(!sub.ok)throw new Error(`Judge0 error ${sub.status}`);
    const result=await sub.json();
    const stdout=(result.stdout||"").trim();
    const stderr=(result.stderr||"").trim();
    const compileErr=(result.compile_output||"").trim();
    if(result.status?.id===6)return{kind:"compile_error",text:compileErr||"Compile error"};
    if(result.status?.id===5)return{kind:"timeout",text:"Time limit exceeded"};
    if(result.status?.id!==3)return{kind:"runtime_error",text:stderr||compileErr||result.status?.description||"Runtime error"};
    return{kind:"ok",text:stdout,stderr};
  }catch(e:any){
    return{kind:"error",text:"Connection error — Judge0 may be temporarily unavailable. Try again in a moment."};
  }
}

async function runWithJudge0(code:string,lang:string,testCases:any[]):Promise<any[]>{
  const langId=LANG_IDS[lang]||93;
  const PUBLIC="https://ce.judge0.com";
  const results=await Promise.all(testCases.map(async(tc:any)=>{
    try{
      const sub=await fetch(`${PUBLIC}/submissions?base64_encoded=false&wait=true`,{
        method:"POST",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify({source_code:code,language_id:langId,stdin:tc.input||"",cpu_time_limit:5,memory_limit:262144}),
      });
      if(!sub.ok)throw new Error(`Judge0 error ${sub.status}`);
      const result=await sub.json();
      const stdout=(result.stdout||"").trim();
      const stderr=(result.stderr||"").trim();
      const compileErr=(result.compile_output||"").trim();
      if(result.status?.id===6)return{input:tc.input,expected:tc.expected,got:`Compile error: ${compileErr}`,pass:false};
      if(result.status?.id===5)return{input:tc.input,expected:tc.expected,got:"Time limit exceeded",pass:false};
      if(result.status?.id!==3){
        const errMsg=stderr||compileErr||result.status?.description||"Runtime error";
        return{input:tc.input,expected:tc.expected,got:`Error: ${errMsg}`,pass:false};
      }
      const got=stdout.trim();
      const expected=(tc.expected||"").trim();
      const pass=got===expected
        ||(parseFloat(got)===parseFloat(expected)&&!isNaN(parseFloat(got))&&!isNaN(parseFloat(expected)))
        ||got.toLowerCase()===expected.toLowerCase();
      return{input:tc.input,expected:tc.expected,got,pass};
    }catch(e:any){
      return{input:tc.input,expected:tc.expected,got:`Connection error — Judge0 may be temporarily unavailable. Try again in a moment.`,pass:false};
    }
  }));
  return results;
}

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
          return <button key={d} type="button" onClick={()=>pick(d)} style={{background:sel?C.orange:isT?C.orange22:"transparent",color:sel?"var(--accent-ink)":isT?C.orangeText:C.text,border:sel?`1px solid ${C.orange}`:`1px solid transparent`,borderRadius:6,padding:"5px 0",fontSize:13,cursor:"pointer",fontWeight:sel?700:400}}>{d}</button>;
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
  pinnedAnnouncementId:null,
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
    {id:1,title:"Sum Two Numbers",difficulty:"Easy",language:"Java",
      desc:"Read two integers from input (space-separated) and print their sum.\n\nExample input: 2 3\nExample output: 5",
      starterCodes:{
        "Java":"import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n        int a = input.nextInt();\n        int b = input.nextInt();\n\n        // your code here\n\n    }\n}",
        "Python":"a, b = map(int, input().split())\n\n# your code here\n",
        "C++":"#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n\n    // your code here\n\n    return 0;\n}",
      },
      testCases:[{input:"2 3",expected:"5"},{input:"0 0",expected:"0"},{input:"-1 1",expected:"0"},{input:"10 20",expected:"30"}]},
    {id:2,title:"Reverse a String",difficulty:"Easy",language:"Java",
      desc:"Read a single line of text and print it reversed.\n\nExample input: hello\nExample output: olleh",
      starterCodes:{
        "Java":"import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n        String s = input.nextLine();\n\n        // your code here\n\n    }\n}",
        "Python":"s = input()\n\n# your code here\n",
        "C++":"#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    string s;\n    getline(cin, s);\n\n    // your code here\n\n    return 0;\n}",
      },
      testCases:[{input:"hello",expected:"olleh"},{input:"world",expected:"dlrow"},{input:"a",expected:"a"}]},
    {id:3,title:"Is Palindrome",difficulty:"Medium",language:"Java",
      desc:"Read a single line of text and print `true` if it's a palindrome, `false` otherwise.\n\nExample input: racecar\nExample output: true",
      starterCodes:{
        "Java":"import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n        String s = input.nextLine();\n\n        // your code here\n\n    }\n}",
        "Python":"s = input()\n\n# your code here\n",
        "C++":"#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    string s;\n    getline(cin, s);\n\n    // your code here\n\n    return 0;\n}",
      },
      testCases:[{input:"racecar",expected:"true"},{input:"hello",expected:"false"},{input:"level",expected:"true"},{input:"a",expected:"true"}]},
  ],
  units:[{id:1,title:"Intro to CS Concepts",desc:"Foundational concepts every CS student should know.",problemIds:[1,2,3]}],
  codingUnits:[],
  completions:{},codingSubmissions:{},attempts:{},streaks:{},
  officerTasks:[],officerEvents:[],googleCalendarId:"",
  about:{
    heading:"About Bridgeland CS Club",
    body:"We are a community of students passionate about computer science, coding, and technology. Whether you're a beginner or an experienced programmer, there's a place for you here!\n\nWe meet every Monday and Thursday from 2:40–3:50 PM to learn new concepts, practice for UIL competitions, work on projects, and have fun. Join us and be part of something great.",
    images:[],
    officers:[{name:"President",role:"President",image:""},{name:"Vice President",role:"Vice President",image:""}],
    contacts:[],
  },
};

// Each kind of item (problems, units, announcements, events, coding questions, users)
// lives in its own Firestore collection, one document per item, keyed by that item's
// id (username for users). "about", "site settings" (resources + pinned announcement),
// and "officer planner" data are small and only ever touched by officers, so they each
// get one small isolated settings document. saveData() diffs the previous vs next
// app-shaped state and only writes the specific documents that actually changed —
// never a blind whole-collection or whole-app overwrite.
const ARRAY_COLLECTIONS:[string,string,string][]=[
  ["problems","problems","id"],
  ["codingQuestions","codingQuestions","id"],
  ["units","units","id"],
  ["codingUnits","codingUnits","id"],
  ["announcements","announcements","id"],
  ["events","events","id"],
  ["users","users","username"],
];
const PROGRESS_FIELDS:[string,string][]=[
  ["completions","completedProblemIds"],
  ["codingSubmissions","codingSubmissions"],
  ["attempts","attempts"],
  ["streaks","streak"],
];
async function saveData(prev:any,next:any){
  if(!next)return;
  const ops:Promise<any>[]=[];

  ARRAY_COLLECTIONS.forEach(([key,collName,idField])=>{
    const prevArr=prev?.[key]||[];
    const nextArr=next[key]||[];
    if(JSON.stringify(prevArr)===JSON.stringify(nextArr))return;
    const prevMap=new Map(prevArr.map((x:any)=>[String(x[idField]),x]));
    const nextMap=new Map(nextArr.map((x:any)=>[String(x[idField]),x]));
    prevMap.forEach((_v,id)=>{ if(!nextMap.has(id))ops.push(deleteDoc(doc(db,collName,id as string))); });
    nextMap.forEach((item,id)=>{
      const before=prevMap.get(id);
      if(!before||JSON.stringify(before)!==JSON.stringify(item))ops.push(setDoc(doc(db,collName,id as string),item as any,{merge:true}));
    });
  });

  // Per-user progress (completed problems, coding submissions, attempts, streak)
  // lives as fields on that user's own document — never on anyone else's.
  PROGRESS_FIELDS.forEach(([key,fieldName])=>{
    const prevMap=prev?.[key]||{};
    const nextMap=next[key]||{};
    if(JSON.stringify(prevMap)===JSON.stringify(nextMap))return;
    const usernames=new Set([...Object.keys(prevMap),...Object.keys(nextMap)]);
    usernames.forEach(uname=>{
      if(JSON.stringify(prevMap[uname])!==JSON.stringify(nextMap[uname])){
        ops.push(setDoc(doc(db,"users",uname),{[fieldName]:nextMap[uname]??null},{merge:true}));
      }
    });
  });

  // Small, isolated settings documents — each only ever edited by officers, and each
  // fully separate from everything above, so even a full overwrite here can't touch
  // problems, units, announcements, events, or any member's account.
  if(JSON.stringify(prev?.about)!==JSON.stringify(next.about)){
    ops.push(setDoc(ABOUT_DOC,next.about||{},{merge:true}));
  }
  const prevSite={resources:prev?.resources,pinnedAnnouncementId:prev?.pinnedAnnouncementId};
  const nextSite={resources:next.resources,pinnedAnnouncementId:next.pinnedAnnouncementId};
  if(JSON.stringify(prevSite)!==JSON.stringify(nextSite)){
    ops.push(setDoc(SITE_DOC,nextSite,{merge:true}));
  }
  const prevPlanner={officerTasks:prev?.officerTasks,officerEvents:prev?.officerEvents,googleCalendarId:prev?.googleCalendarId};
  const nextPlanner={officerTasks:next.officerTasks,officerEvents:next.officerEvents,googleCalendarId:next.googleCalendarId};
  if(JSON.stringify(prevPlanner)!==JSON.stringify(nextPlanner)){
    ops.push(setDoc(PLANNER_DOC,nextPlanner,{merge:true}));
  }

  if(ops.length===0)return;
  try{
    await Promise.all(ops);
  }catch(e){
    console.error("Save failed — some changes may not have been written:",e);
    if(typeof window!=="undefined")window.alert("⚠ Your last change could not be saved. Please refresh and try again, or contact the developer.");
  }
}

// One-time setup: if this is a brand-new deployment (no users yet anywhere), either
// migrate data out of the old single "club/data" document if it still has anything
// in it, or seed the small set of default demo content. Safe to call on every load —
// it only ever writes if the new users collection is genuinely empty.
async function bootstrapClubData(){
  try{
    // Runs at most ONCE, ever, tracked by this marker doc — NOT by "is the users
    // collection empty", which stays true forever if a club genuinely has zero
    // members right now (e.g. right after everyone was deleted), causing this to
    // re-run on every single page load and silently overwrite fresh edits.
    const marker=await getDoc(doc(db,"settings","bootstrapStatus"));
    if(marker.exists()&&marker.data()?.done)return;

    const [usersSnap,problemsSnap,cqSnap,unitSnap,annSnap,evtSnap]=await Promise.all([
      getDocs(collection(db,"users")),getDocs(collection(db,"problems")),getDocs(collection(db,"codingQuestions")),
      getDocs(collection(db,"units")),getDocs(collection(db,"announcements")),getDocs(collection(db,"events")),
    ]);
    const alreadyHasRealData=![usersSnap,problemsSnap,cqSnap,unitSnap,annSnap,evtSnap].every(s=>s.empty);
    if(alreadyHasRealData){
      // Someone's already been actively using/rebuilding the site — never touch it,
      // just mark this done so we stop checking.
      await setDoc(doc(db,"settings","bootstrapStatus"),{done:true,completedAt:new Date().toISOString(),source:"already-had-data"});
      return;
    }
    const legacySnap=await getDoc(LEGACY_DATA_DOC);
    const ops:Promise<any>[]=[];
    if(legacySnap.exists()&&(legacySnap.data()?.users?.length||legacySnap.data()?.problems?.length)){
      const legacy:any=legacySnap.data();
      (legacy.problems||[]).forEach((p:any)=>ops.push(setDoc(doc(db,"problems",String(p.id)),p,{merge:true})));
      (legacy.codingQuestions||[]).forEach((q:any)=>ops.push(setDoc(doc(db,"codingQuestions",String(q.id)),q,{merge:true})));
      (legacy.units||[]).forEach((u:any)=>ops.push(setDoc(doc(db,"units",String(u.id)),u,{merge:true})));
      (legacy.codingUnits||[]).forEach((u:any)=>ops.push(setDoc(doc(db,"codingUnits",String(u.id)),u,{merge:true})));
      (legacy.announcements||[]).forEach((a:any)=>ops.push(setDoc(doc(db,"announcements",String(a.id)),a,{merge:true})));
      (legacy.events||[]).forEach((e:any)=>ops.push(setDoc(doc(db,"events",String(e.id)),e,{merge:true})));
      (legacy.users||[]).filter((u:any)=>u.username!==DEV_ACCOUNT.username).forEach((u:any)=>{
        const merged={...u,
          completedProblemIds:(legacy.completions||{})[u.username]||[],
          codingSubmissions:(legacy.codingSubmissions||{})[u.username]||{},
          attempts:(legacy.attempts||{})[u.username]||{total:0,correct:0},
          streak:(legacy.streaks||{})[u.username]||{current:0,best:0,lastDate:null},
        };
        ops.push(setDoc(doc(db,"users",u.username),merged,{merge:true}));
      });
      if(legacy.about)ops.push(setDoc(ABOUT_DOC,legacy.about,{merge:true}));
      ops.push(setDoc(SITE_DOC,{resources:legacy.resources||[],pinnedAnnouncementId:legacy.pinnedAnnouncementId||null},{merge:true}));
      ops.push(setDoc(PLANNER_DOC,{officerTasks:legacy.officerTasks||[],officerEvents:legacy.officerEvents||[],googleCalendarId:legacy.googleCalendarId||""},{merge:true}));
      await Promise.all(ops);
      console.log("Migrated legacy club/data into per-item collections.");
    }else{
      (initData.problems||[]).forEach((p:any)=>ops.push(setDoc(doc(db,"problems",String(p.id)),p,{merge:true})));
      (initData.codingQuestions||[]).forEach((q:any)=>ops.push(setDoc(doc(db,"codingQuestions",String(q.id)),q,{merge:true})));
      (initData.units||[]).forEach((u:any)=>ops.push(setDoc(doc(db,"units",String(u.id)),u,{merge:true})));
      (initData.codingUnits||[]).forEach((u:any)=>ops.push(setDoc(doc(db,"codingUnits",String(u.id)),u,{merge:true})));
      (initData.announcements||[]).forEach((a:any)=>ops.push(setDoc(doc(db,"announcements",String(a.id)),a,{merge:true})));
      (initData.events||[]).forEach((e:any)=>ops.push(setDoc(doc(db,"events",String(e.id)),e,{merge:true})));
      ops.push(setDoc(ABOUT_DOC,initData.about,{merge:true}));
      ops.push(setDoc(SITE_DOC,{resources:initData.resources,pinnedAnnouncementId:null},{merge:true}));
      ops.push(setDoc(PLANNER_DOC,{officerTasks:[],officerEvents:[],googleCalendarId:""},{merge:true}));
      await Promise.all(ops);
    }
    await setDoc(doc(db,"settings","bootstrapStatus"),{done:true,completedAt:new Date().toISOString(),source:legacySnap.exists()?"migrated-legacy":"seeded-default"});
  }catch(e){console.error("Bootstrap check failed",e);}
}

// BACKUPS. Two layers, both free (no Blaze plan needed):
// 1) Manual export — an officer downloads the whole club as a .json file, on demand.
// 2) Automatic snapshots — the app itself writes a full copy into Firestore roughly
//    once a day (checked whenever an officer is signed in), so there's always a
//    recent recovery point even if nobody remembers to export.
// A snapshot is NOT one document (that's the bug we just fixed) — it mirrors the same
// per-item structure as the live data, under backups/{backupId}/{collection}/{itemId},
// so a snapshot can never hit the 1MB limit either, no matter how big the club gets.
const BACKUP_COLLECTIONS=["problems","codingQuestions","units","codingUnits","announcements","events"];
async function fetchAllForBackup(){
  const [probSnap,cqSnap,unitSnap,cuSnap,annSnap,evtSnap,userSnap,aboutSnap,siteSnap,plannerSnap]=await Promise.all([
    getDocs(collection(db,"problems")),getDocs(collection(db,"codingQuestions")),getDocs(collection(db,"units")),getDocs(collection(db,"codingUnits")),
    getDocs(collection(db,"announcements")),getDocs(collection(db,"events")),getDocs(collection(db,"users")),
    getDoc(ABOUT_DOC),getDoc(SITE_DOC),getDoc(PLANNER_DOC),
  ]);
  return{
    exportedAt:new Date().toISOString(),
    problems:probSnap.docs.map(d=>d.data()),codingQuestions:cqSnap.docs.map(d=>d.data()),units:unitSnap.docs.map(d=>d.data()),codingUnits:cuSnap.docs.map(d=>d.data()),
    announcements:annSnap.docs.map(d=>d.data()),events:evtSnap.docs.map(d=>d.data()),users:userSnap.docs.map(d=>({...d.data(),username:d.id})),
    about:aboutSnap.exists()?aboutSnap.data():null,site:siteSnap.exists()?siteSnap.data():null,officerPlanner:plannerSnap.exists()?plannerSnap.data():null,
  };
}
async function createBackupSnapshot(triggeredBy:string){
  const payload=await fetchAllForBackup();
  const backupId=payload.exportedAt.replace(/[:.]/g,"-");
  const ops:Promise<any>[]=[setDoc(doc(db,"backups",backupId),{
    createdAt:payload.exportedAt,triggeredBy,
    counts:{problems:payload.problems.length,codingQuestions:payload.codingQuestions.length,units:payload.units.length,codingUnits:payload.codingUnits.length,announcements:payload.announcements.length,events:payload.events.length,users:payload.users.length},
  })];
  payload.problems.forEach((p:any)=>ops.push(setDoc(doc(db,"backups",backupId,"problems",String(p.id)),p)));
  payload.codingQuestions.forEach((q:any)=>ops.push(setDoc(doc(db,"backups",backupId,"codingQuestions",String(q.id)),q)));
  payload.units.forEach((u:any)=>ops.push(setDoc(doc(db,"backups",backupId,"units",String(u.id)),u)));
  payload.codingUnits.forEach((u:any)=>ops.push(setDoc(doc(db,"backups",backupId,"codingUnits",String(u.id)),u)));
  payload.announcements.forEach((a:any)=>ops.push(setDoc(doc(db,"backups",backupId,"announcements",String(a.id)),a)));
  payload.events.forEach((e:any)=>ops.push(setDoc(doc(db,"backups",backupId,"events",String(e.id)),e)));
  payload.users.forEach((u:any)=>ops.push(setDoc(doc(db,"backups",backupId,"users",u.username),u)));
  if(payload.about)ops.push(setDoc(doc(db,"backups",backupId,"settings","about"),payload.about));
  if(payload.site)ops.push(setDoc(doc(db,"backups",backupId,"settings","site"),payload.site));
  if(payload.officerPlanner)ops.push(setDoc(doc(db,"backups",backupId,"settings","officerPlanner"),payload.officerPlanner));
  await Promise.all(ops);
  return backupId;
}
async function pruneOldBackups(keep=14){
  const snap=await getDocs(query(collection(db,"backups"),orderBy("createdAt","desc")));
  const toDelete=snap.docs.slice(keep);
  for(const d of toDelete){
    const backupId=d.id;
    for(const c of BACKUP_COLLECTIONS){
      const sub=await getDocs(collection(db,"backups",backupId,c));
      await Promise.all(sub.docs.map(sd=>deleteDoc(doc(db,"backups",backupId,c,sd.id))));
    }
    const usersSub=await getDocs(collection(db,"backups",backupId,"users"));
    await Promise.all(usersSub.docs.map(sd=>deleteDoc(doc(db,"backups",backupId,"users",sd.id))));
    await Promise.all([
      deleteDoc(doc(db,"backups",backupId,"settings","about")).catch(()=>{}),
      deleteDoc(doc(db,"backups",backupId,"settings","site")).catch(()=>{}),
      deleteDoc(doc(db,"backups",backupId,"settings","officerPlanner")).catch(()=>{}),
    ]);
    await deleteDoc(doc(db,"backups",backupId));
  }
}
// Checked once whenever an officer is signed in — creates a new snapshot only if the
// most recent one is more than ~20 hours old, so this is effectively once a day
// without needing a paid Cloud Functions schedule.
async function maybeAutoBackup(triggeredBy:string){
  try{
    const snap=await getDocs(query(collection(db,"backups"),orderBy("createdAt","desc"),limit(1)));
    const last:any=snap.docs[0]?.data();
    const lastTime=last?new Date(last.createdAt).getTime():0;
    if(Date.now()-lastTime<20*60*60*1000)return;
    await createBackupSnapshot(triggeredBy);
    pruneOldBackups(14).catch(e=>console.error("Prune failed",e));
  }catch(e){console.error("Auto backup failed",e);}
}
// Restores the live site to exactly match a given snapshot: anything in the backup
// is written back, and anything currently live that ISN'T in the backup is removed
// (a true point-in-time restore, not just an overlay).
async function restoreBackup(backupId:string){
  const ops:Promise<any>[]=[];
  for(const collName of [...BACKUP_COLLECTIONS,"users"]){
    const [liveSnap,backupSnap]=await Promise.all([getDocs(collection(db,collName)),getDocs(collection(db,"backups",backupId,collName))]);
    const backupIds=new Set(backupSnap.docs.map(d=>d.id));
    liveSnap.docs.forEach(d=>{ if(!backupIds.has(d.id))ops.push(deleteDoc(doc(db,collName,d.id))); });
    backupSnap.docs.forEach(d=>ops.push(setDoc(doc(db,collName,d.id),d.data())));
  }
  const [aboutSnap,siteSnap,plannerSnap]=await Promise.all([
    getDoc(doc(db,"backups",backupId,"settings","about")),
    getDoc(doc(db,"backups",backupId,"settings","site")),
    getDoc(doc(db,"backups",backupId,"settings","officerPlanner")),
  ]);
  if(aboutSnap.exists())ops.push(setDoc(ABOUT_DOC,aboutSnap.data()));
  if(siteSnap.exists())ops.push(setDoc(SITE_DOC,siteSnap.data()));
  if(plannerSnap.exists())ops.push(setDoc(PLANNER_DOC,plannerSnap.data()));
  await Promise.all(ops);
}
// Images are stored as base64 text inside one shared Firestore document, which has a
// hard 1 MiB total size limit shared across EVERY problem/user/announcement/event in
// the club. A handful of full-size photos can blow past that and start failing every
// save for everyone. To keep this safe, downscale/compress every image client-side
// before it's ever stored — this keeps a typical photo to roughly 30-80 KB instead of
// several MB.
function toB64(file:File):Promise<string>{
  return new Promise((res,rej)=>{
    if(!file.type.startsWith("image/")){rej(new Error("Please choose an image file."));return;}
    if(file.size>15*1024*1024){rej(new Error("Image too large (max 15MB before compression).") );return;}
    const reader=new FileReader();
    reader.onerror=rej;
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>rej(new Error("Could not read that image."));
      img.onload=()=>{
        const MAX_DIM=900;
        let{width,height}=img;
        if(width>MAX_DIM||height>MAX_DIM){
          const scale=MAX_DIM/Math.max(width,height);
          width=Math.round(width*scale);height=Math.round(height*scale);
        }
        const canvas=document.createElement("canvas");
        canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext("2d");
        if(!ctx){res(reader.result as string);return;}
        ctx.drawImage(img,0,0,width,height);
        res(canvas.toDataURL("image/jpeg",0.75));
      };
      img.src=reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function ImgPick({label="Add image (optional)",onPick,preview}:any){
  const ref=useRef<any>();
  return(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:12,color:C.muted,marginBottom:6}}>{label}</div>
      <button type="button" onClick={()=>ref.current.click()} style={{background:C.bgInput,border:`1px dashed ${C.border}`,color:C.muted,padding:"8px 14px",borderRadius:6,cursor:"pointer",fontSize:13,width:"100%"}}>Click to upload image</button>
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={async(e:any)=>{if(e.target.files[0]){try{onPick(await toB64(e.target.files[0]));}catch(err:any){alert(err.message);}}}}/>
      {preview&&<img src={preview} alt="" style={{marginTop:8,width:"100%",maxHeight:110,objectFit:"cover",borderRadius:6,border:`1px solid ${C.border}`}}/>}
    </div>
  );
}

const inp:any={background:C.bgInput,border:`1px solid ${C.border}`,color:C.text,padding:"8px 12px",borderRadius:6,fontSize:14,width:"100%",boxSizing:"border-box",fontFamily:"'DM Sans','Segoe UI',sans-serif"};
const lbl:any={fontSize:12,color:C.muted,marginBottom:4,display:"block"};
const cardS:any={background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:"1rem 1.25rem",marginBottom:12};
const Btn=({color=C.orange,children,onClick,style={},disabled}:any)=>(
  <button onClick={onClick} disabled={disabled} style={{background:disabled?C.border:color,color:color===C.orange?"var(--accent-ink)":"#fff",border:"none",padding:"8px 16px",borderRadius:10,cursor:disabled?"not-allowed":"pointer",fontSize:13,fontWeight:700,...style}}>{children}</button>
);
const OutBtn=({children,onClick,style={},danger}:any)=>(
  <button onClick={onClick} style={{background:"transparent",color:danger?C.red:C.muted,border:`1px solid ${danger?C.red:C.border}`,padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:13,...style}}>{children}</button>
);
const SecBtn=({children,onClick,style={}}:any)=>(
  <button onClick={onClick} style={{background:C.bgInput,color:C.text,border:`1px solid ${C.border}`,padding:"8px 16px",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600,...style}}>{children}</button>
);
const Tag=({c,children}:any)=><span style={{background:`color-mix(in srgb, ${c} 16%, transparent)`,color:c===C.orange?C.orangeText:c,fontSize:11,padding:"4px 9px",borderRadius:7,fontWeight:700}}>{children}</span>;

function NotificationBell({user}:any){
  const [notifs,setNotifs]=useState<any[]>([]);
  const [open,setOpen]=useState(false);
  const isOfficer=user&&(user.role==="officer"||user.role==="developer");
  useEffect(()=>{
    if(!user||user.role==="guest")return;
    const q=query(collection(db,"notifications"),orderBy("createdAt","desc"),limit(30));
    const unsub=onSnapshot(q,snap=>{
      setNotifs(snap.docs.map((d:any)=>({id:d.id,...d.data()})));
    },err=>console.error("Notifications error",err));
    return()=>unsub();
  },[user?.username]);
  if(!user||user.role==="guest")return null;
  const relevant=notifs.filter((n:any)=>n.audience==="all"||(n.audience==="officers"&&isOfficer)||n.audience===user.username);
  const unread=relevant.filter((n:any)=>!(n.readBy||[]).includes(user.username));
  const markRead=(n:any)=>{
    if((n.readBy||[]).includes(user.username))return;
    updateDoc(doc(db,"notifications",n.id),{readBy:arrayUnion(user.username)}).catch((e:any)=>console.error(e));
  };
  const markAllRead=()=>{
    unread.forEach((n:any)=>markRead(n));
  };
  const timeAgo=(iso:string)=>{
    const diff=Date.now()-new Date(iso).getTime();
    const mins=Math.floor(diff/60000);
    if(mins<1)return"just now";
    if(mins<60)return`${mins}m ago`;
    const hrs=Math.floor(mins/60);
    if(hrs<24)return`${hrs}h ago`;
    return`${Math.floor(hrs/24)}d ago`;
  };
  return(
    <div style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:"transparent",border:"none",cursor:"pointer",position:"relative",padding:"6px 4px",fontSize:19,color:C.muted,display:"flex",alignItems:"center"}} aria-label="Notifications">
        🔔
        {unread.length>0&&<span style={{position:"absolute",top:0,right:0,background:C.red,color:"#fff",fontSize:10,fontWeight:700,borderRadius:"50%",minWidth:15,height:15,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px"}}>{unread.length>9?"9+":unread.length}</span>}
      </button>
      {open&&(
        <>
          <div style={{position:"fixed",inset:0,zIndex:998}} onClick={()=>setOpen(false)}/>
          <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:320,maxHeight:400,overflowY:"auto",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:"var(--shadow)",zIndex:999}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontWeight:700,fontSize:13,color:C.text}}>Notifications</span>
              {unread.length>0&&<button onClick={markAllRead} style={{background:"transparent",border:"none",color:C.orangeText,fontSize:11,cursor:"pointer",fontWeight:600}}>Mark all read</button>}
            </div>
            {relevant.length===0&&<div style={{padding:"20px 14px",color:C.muted,fontSize:13,textAlign:"center"}}>No notifications yet.</div>}
            {relevant.slice(0,20).map((n:any)=>{
              const isUnread=!(n.readBy||[]).includes(user.username);
              return(
                <div key={n.id} onClick={()=>markRead(n)} style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:isUnread?C.orange14:"transparent"}}>
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    {isUnread&&<span style={{width:7,height:7,borderRadius:"50%",background:C.orange,marginTop:5,flexShrink:0}}/>}
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13,color:C.text}}>{n.title}</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>{n.body}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:4}}>{timeAgo(n.createdAt)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Header({user,onSignOut,onManage,isDev,page,navItems,navLabels,onNavigate,onHome,theme,onToggleTheme}:any){
  return(
    <header className="site-header">
      <button type="button" className="brand-link" onClick={onHome} aria-label="Bridgeland CS Club home" aria-current={page==="home"?"page":undefined}>
        <img src={LOGO_URL} alt="" className="brand-logo" onError={(e:any)=>e.target.style.display="none"}/>
        <span>Bridgeland CS Club</span>
      </button>
      {user&&<nav className="site-nav" aria-label="Main navigation">
        {navItems.map((p:string)=><button key={p} className={`nav-link${page===p?" active":""}`} aria-current={page===p?"page":undefined} onClick={()=>onNavigate(p)}>{navLabels[p]}</button>)}
      </nav>}
      <div className="header-actions">
        <button type="button" className="theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme==="light"?"dark":"light"} mode`} title={`Switch to ${theme==="light"?"dark":"light"} mode`}>
          <span aria-hidden="true">{theme==="light"?"☾":"☀"}</span><span className="theme-label">{theme==="light"?"Dark":"Light"}</span>
        </button>
        {user&&<>
          <NotificationBell user={user}/>
          {user.role!=="guest"&&<span className="header-user">{user.name||user.username}</span>}
          {user.role!=="member"&&user.role!=="guest"&&<Tag c={C.orange}>{user.role==="developer"?"Developer":"Officer"}</Tag>}
          {user.role==="guest"&&<Tag c={C.guest}>Guest</Tag>}
          {isDev&&<Btn color={C.orange} onClick={onManage} style={{padding:"7px 12px",fontSize:12}}>Members</Btn>}
          <OutBtn onClick={onSignOut}>{user.role==="guest"?"Sign in":"Sign out"}</OutBtn>
        </>}
      </div>
    </header>
  );
}

function UILExamHeader({status}:any){
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{
    if(!status||status.submitted)return;
    const timer=window.setInterval(()=>setNow(Date.now()),1000);
    return()=>window.clearInterval(timer);
  },[status?.startedAt,status?.submitted]);
  const remaining=status?Math.max(0,status.minutes*60-Math.floor((now-status.startedAt)/1000)):0;
  const clock=`${Math.floor(remaining/60).toString().padStart(2,"0")}:${(remaining%60).toString().padStart(2,"0")}`;
  return <header className="uil-exam-header">
    <div className="uil-exam-heading">
      <button type="button" className="uil-exit-test" onClick={status?.onBack}>← All UIL tests</button>
      <div><strong>{status?`${status.year} · ${status.level}`:"Starting UIL test…"}</strong><span>{status?.submitted?"Your submitted test diagnostics are below.":"Tap a bubble to answer; type in written responses."}</span></div>
    </div>
    <div className="uil-exam-status">
      <span className={`uil-exam-clock${remaining<300?" urgent":""}`}>{status?.submitted?"Submitted":`Time ${clock}`}</span>
      <span className="uil-exam-answered">{status?`${status.answered}/${status.questions} answered`:"Preparing test"}</span>
      {status?.submitted?<button type="button" className="uil-exam-submit secondary" onClick={status.reset}>New attempt</button>:<button type="button" className="uil-exam-submit" disabled={!status?.submit} onClick={status?.submit}>Submit test</button>}
    </div>
  </header>;
}

/* ---- FORUM PAGE ---- */
function ForumPage({user,isGuest,isOfficer}:any){
  const [threads,setThreads]=useState<any[]>([]);
  const [activeThread,setActiveThread]=useState<any>(null);
  const [newTitle,setNewTitle]=useState("");
  const [newBody,setNewBody]=useState("");
  const [showNew,setShowNew]=useState(false);
  const [loading,setLoading]=useState(true);
  const [formErr,setFormErr]=useState<string>("");
  const [editingThread,setEditingThread]=useState<any>(null);
  const [editTitle,setEditTitle]=useState("");
  const [editBody,setEditBody]=useState("");
  const [search,setSearch]=useState("");

  const loadThreads=async()=>{
    setLoading(true);
    try{
      const q=query(collection(db,"forumThreads"),orderBy("createdAt","desc"));
      const snap=await getDocs(q);
      setThreads(snap.docs.map((d:any)=>({id:d.id,...d.data()})));
    }catch(e:any){
      try{
        const snap=await getDocs(collection(db,"forumThreads"));
        const docs=snap.docs.map((d:any)=>({id:d.id,...d.data()}));
        docs.sort((a:any,b:any)=>((b.createdAt||"")>(a.createdAt||"")?1:-1));
        setThreads(docs);
      }catch(e2){console.error(e2);}
    }
    setLoading(false);
  };

  useEffect(()=>{loadThreads();},[]);

  const createThread=async()=>{
    setFormErr("");
    if(!newTitle.trim()){setFormErr("Title is required.");return;}
    if(!newBody.trim()){setFormErr("Body is required.");return;}
    const t={title:newTitle.trim(),body:newBody.trim(),author:user.name||user.username,username:user.username,createdAt:new Date().toISOString(),replyCount:0};
    const ref=await addDoc(collection(db,"forumThreads"),t);
    setThreads((prev:any)=>[{id:ref.id,...t},...prev]);
    setNewTitle("");setNewBody("");setShowNew(false);
  };

  const startEditThread=(t:any,e:any)=>{
    e.stopPropagation();
    setEditingThread(t.id);setEditTitle(t.title);setEditBody(t.body);
  };

  const saveEditThread=async(id:string,e:any)=>{
    e.stopPropagation();
    if(!editTitle.trim()||!editBody.trim())return;
    await updateDoc(doc(db,"forumThreads",id),{title:editTitle.trim(),body:editBody.trim(),edited:true});
    setThreads((prev:any)=>prev.map((t:any)=>t.id===id?{...t,title:editTitle.trim(),body:editBody.trim(),edited:true}:t));
    setEditingThread(null);
  };

  const deleteThread=async(id:string,e:any)=>{
    e.stopPropagation();
    if(!window.confirm("Delete this thread and all its replies?"))return;
    await deleteDoc(doc(db,"forumThreads",id));
    setThreads((prev:any)=>prev.filter((t:any)=>t.id!==id));
  };

  if(activeThread) return <ThreadView thread={activeThread} user={user} isOfficer={isOfficer} onBack={()=>{setActiveThread(null);loadThreads();}}/>;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{margin:0}}>Discussion Forum</h2>
        {!isGuest&&<Btn onClick={()=>{setShowNew(s=>!s);setFormErr("");}}>{ showNew?"Cancel":"+ New thread"}</Btn>}
      </div>
      {isGuest&&(<div style={{...cardS,borderLeft:`3px solid ${C.guest}`,marginBottom:16}}><div style={{fontWeight:600,fontSize:14,color:C.guest,marginBottom:4}}>Sign in to participate</div><div style={{fontSize:13,color:C.muted}}>You can read threads as a guest, but sign in to post.</div></div>)}
      {showNew&&(
        <div style={{...cardS,marginBottom:16,borderLeft:`3px solid ${C.orange}`}}>
          <h3 style={{margin:"0 0 12px",fontSize:15}}>New discussion thread</h3>
          {formErr&&<div style={{background:C.red18,border:`1px solid ${C.red44}`,borderRadius:6,padding:"8px 12px",fontSize:13,color:C.red,marginBottom:10}}>⚠ {formErr}</div>}
          <label style={lbl}>Title <span style={{color:C.red}}>*</span></label>
          <input style={{...inp,marginBottom:10}} value={newTitle} onChange={(e:any)=>setNewTitle(e.target.value)} placeholder="What do you want to discuss?" autoFocus/>
          <label style={lbl}>Body <span style={{color:C.red}}>*</span></label>
          <textarea style={{...inp,height:100,resize:"vertical",marginBottom:12}} value={newBody} onChange={(e:any)=>setNewBody(e.target.value)} placeholder="Share your thoughts, ask a question..."/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <OutBtn onClick={()=>{setShowNew(false);setFormErr("");}}>Cancel</OutBtn>
            <Btn onClick={createThread}>Post thread</Btn>
          </div>
        </div>
      )}
      <input style={{...inp,marginBottom:16}} value={search} onChange={(e:any)=>setSearch(e.target.value)} placeholder="🔍 Search discussions..."/>
      {loading&&<p style={{color:C.muted}}>Loading threads…</p>}
      {!loading&&threads.length===0&&<p style={{color:C.muted}}>No threads yet. Be the first to start a discussion!</p>}
      {!loading&&threads.length>0&&threads.filter((t:any)=>!search||t.title.toLowerCase().includes(search.toLowerCase())||t.body.toLowerCase().includes(search.toLowerCase())).length===0&&<p style={{color:C.muted}}>No discussions match "{search}".</p>}
      {threads.filter((t:any)=>!search||t.title.toLowerCase().includes(search.toLowerCase())||t.body.toLowerCase().includes(search.toLowerCase())).map((t:any)=>(
        <div key={t.id} style={{...cardS,cursor:"pointer"}} onClick={()=>editingThread!==t.id&&setActiveThread(t)}>
          {editingThread===t.id?(
            <div onClick={(e:any)=>e.stopPropagation()}>
              <input style={{...inp,marginBottom:8,fontWeight:600}} value={editTitle} onChange={(e:any)=>setEditTitle(e.target.value)}/>
              <textarea style={{...inp,height:80,resize:"vertical",marginBottom:8}} value={editBody} onChange={(e:any)=>setEditBody(e.target.value)}/>
              <div style={{display:"flex",gap:6}}>
                <Btn onClick={(e:any)=>saveEditThread(t.id,e)} style={{padding:"5px 12px",fontSize:12}}>Save</Btn>
                <OutBtn onClick={(e:any)=>{e.stopPropagation();setEditingThread(null);}} style={{padding:"5px 10px",fontSize:12}}>Cancel</OutBtn>
              </div>
            </div>
          ):(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{t.title}{t.edited&&<span style={{fontSize:10,color:C.muted,marginLeft:6}}>(edited)</span>}</div>
                  <div style={{fontSize:13,color:C.muted,lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{t.body}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontWeight:700,color:C.orangeText,fontSize:18}}>{t.replyCount||0}</div>
                  <div style={{fontSize:11,color:C.muted}}>replies</div>
                </div>
              </div>
              <div style={{marginTop:8,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:11,color:C.muted}}>by <strong style={{color:C.text}}>{t.author}</strong></span>
                <span style={{fontSize:11,color:C.muted}}>·</span>
                <span style={{fontSize:11,color:C.muted}}>{new Date(t.createdAt).toLocaleDateString()}</span>
                <div style={{marginLeft:"auto",display:"flex",gap:6}} onClick={(e:any)=>e.stopPropagation()}>
                  {(user?.username===t.username)&&<button onClick={(e:any)=>startEditThread(t,e)} style={{background:"transparent",border:"none",color:C.orangeText,cursor:"pointer",fontSize:12,padding:"2px 6px"}}>Edit</button>}
                  {(user?.username===t.username||isOfficer)&&<button onClick={(e:any)=>deleteThread(t.id,e)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:12,padding:"2px 6px"}}>Delete</button>}
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function ThreadView({thread,user,onBack,isOfficer}:any){
  const [replies,setReplies]=useState<any[]>([]);
  const [newReply,setNewReply]=useState("");
  const [loading,setLoading]=useState(true);
  const [replyErr,setReplyErr]=useState("");
  const [editingReply,setEditingReply]=useState<any>(null);
  const [editText,setEditText]=useState("");
  const isGuest=user?.role==="guest";

  useEffect(()=>{
    const loadReplies=async()=>{
      try{
        const q=query(collection(db,"forumThreads",thread.id,"replies"),orderBy("createdAt","asc"));
        const snap=await getDocs(q);
        setReplies(snap.docs.map((d:any)=>({id:d.id,...d.data()})));
      }catch(e:any){
        try{
          const snap=await getDocs(collection(db,"forumThreads",thread.id,"replies"));
          const docs=snap.docs.map((d:any)=>({id:d.id,...d.data()}));
          docs.sort((a:any,b:any)=>((a.createdAt||"")>(b.createdAt||"")?1:-1));
          setReplies(docs);
        }catch(e2){console.error(e2);}
      }
      setLoading(false);
    };
    loadReplies();
  },[thread.id]);

  const postReply=async()=>{
    setReplyErr("");
    if(!newReply.trim()){setReplyErr("Reply cannot be empty.");return;}
    if(isGuest)return;
    const r={body:newReply.trim(),author:user.name||user.username,username:user.username,createdAt:new Date().toISOString()};
    const ref=await addDoc(collection(db,"forumThreads",thread.id,"replies"),r);
    await updateDoc(doc(db,"forumThreads",thread.id),{replyCount:replies.length+1});
    setReplies((prev:any)=>[...prev,{id:ref.id,...r}]);
    setNewReply("");
    if(thread.username&&thread.username!==user.username){
      addDoc(collection(db,"notifications"),{
        audience:thread.username,
        title:"New reply to your discussion",
        body:`${user.name||user.username} replied to "${thread.title}"`,
        createdAt:new Date().toISOString(),
        readBy:[],
      }).catch((e:any)=>console.error("Notify failed",e));
    }
  };

  const startEditReply=(r:any)=>{setEditingReply(r.id);setEditText(r.body);};

  const saveEditReply=async(id:string)=>{
    if(!editText.trim())return;
    await updateDoc(doc(db,"forumThreads",thread.id,"replies",id),{body:editText.trim(),edited:true});
    setReplies((prev:any)=>prev.map((r:any)=>r.id===id?{...r,body:editText.trim(),edited:true}:r));
    setEditingReply(null);
  };

  const deleteReply=async(id:string)=>{
    if(!window.confirm("Delete this reply?"))return;
    await deleteDoc(doc(db,"forumThreads",thread.id,"replies",id));
    setReplies((prev:any)=>prev.filter((r:any)=>r.id!==id));
    await updateDoc(doc(db,"forumThreads",thread.id),{replyCount:Math.max(0,replies.length-1)});
  };

  return(
    <div>
      <OutBtn onClick={onBack} style={{marginBottom:16}}>← Back to Forum</OutBtn>
      <div style={{...cardS,borderLeft:`3px solid ${C.orange}`,marginBottom:20}}>
        <h2 style={{margin:"0 0 8px",fontSize:20}}>{thread.title}</h2>
        <div style={{fontSize:14,lineHeight:1.7,marginBottom:10,whiteSpace:"pre-wrap"}}>{thread.body}</div>
        <div style={{fontSize:12,color:C.muted}}>by <strong>{thread.author}</strong> · {new Date(thread.createdAt).toLocaleDateString()}</div>
      </div>
      <h3 style={{fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1,margin:"0 0 12px"}}>{replies.length} {replies.length===1?"reply":"replies"}</h3>
      {loading&&<p style={{color:C.muted,fontSize:13}}>Loading replies…</p>}
      {replies.map((r:any,i:number)=>(
        <div key={r.id} style={{...cardS,borderLeft:`3px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:C.orange33,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:C.orangeText,flexShrink:0}}>{(r.author||"?")[0].toUpperCase()}</div>
            <span style={{fontWeight:600,fontSize:13}}>{r.author}</span>
            <span style={{fontSize:11,color:C.muted}}>·</span>
            <span style={{fontSize:11,color:C.muted}}>{new Date(r.createdAt).toLocaleDateString()}</span>
            <span style={{fontSize:11,color:C.muted}}>#{i+1}</span>
            {r.edited&&<span style={{fontSize:10,color:C.muted}}>(edited)</span>}
            <div style={{marginLeft:"auto",display:"flex",gap:6}}>
              {user?.username===r.username&&editingReply!==r.id&&<button onClick={()=>startEditReply(r)} style={{background:"transparent",border:"none",color:C.orangeText,cursor:"pointer",fontSize:12,padding:"2px 6px"}}>Edit</button>}
              {(user?.username===r.username||isOfficer)&&<button onClick={()=>deleteReply(r.id)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:12,padding:"2px 6px"}}>Delete</button>}
            </div>
          </div>
          {editingReply===r.id?(
            <div>
              <textarea style={{...inp,height:70,resize:"vertical",marginBottom:8}} value={editText} onChange={(e:any)=>setEditText(e.target.value)} autoFocus/>
              <div style={{display:"flex",gap:6}}>
                <Btn onClick={()=>saveEditReply(r.id)} style={{padding:"5px 12px",fontSize:12}}>Save</Btn>
                <OutBtn onClick={()=>setEditingReply(null)} style={{padding:"5px 10px",fontSize:12}}>Cancel</OutBtn>
              </div>
            </div>
          ):(
            <div style={{fontSize:14,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{r.body}</div>
          )}
        </div>
      ))}
      {!isGuest?(
        <div style={{...cardS,marginTop:8}}>
          <label style={lbl}>Add a reply</label>
          {replyErr&&<div style={{background:C.red18,border:`1px solid ${C.red44}`,borderRadius:6,padding:"6px 10px",fontSize:13,color:C.red,marginBottom:8}}>⚠ {replyErr}</div>}
          <textarea style={{...inp,height:90,resize:"vertical",marginBottom:10}} value={newReply} onChange={(e:any)=>setNewReply(e.target.value)} placeholder="Share your thoughts..." onKeyDown={(e:any)=>{if(e.key==="Enter"&&e.ctrlKey)postReply();}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:C.muted}}>Ctrl+Enter to submit</span>
            <Btn onClick={postReply}>Post reply</Btn>
          </div>
        </div>
      ):(
        <div style={{...cardS,borderLeft:`3px solid ${C.guest}`,textAlign:"center",padding:"1.5rem"}}><div style={{fontSize:13,color:C.muted}}>Sign in to reply to this thread.</div></div>
      )}
    </div>
  );
}

function BugReportBtn({user}:any){
  const [open,setOpen]=useState(false);
  const [text,setText]=useState("");
  const [image,setImage]=useState("");
  const [sent,setSent]=useState(false);
  const imgRef=useRef<any>();

  const pickImage=async(e:any)=>{
    if(e.target.files[0]){
      try{setImage(await toB64(e.target.files[0]));}
      catch(err:any){alert(err.message);}
    }
  };

  const submit=async()=>{
    if(!text.trim())return;
    try{
      await addDoc(collection(db,"bugReports"),{
        text:text.trim(),
        image:image||"",
        username:user?.username||"anonymous",
        name:user?.name||"Guest",
        timestamp:new Date().toISOString(),
        resolved:false,
      });
      setSent(true);
      setTimeout(()=>{setSent(false);setText("");setImage("");setOpen(false);},2500);
    }catch(e){console.error(e);}
  };

  return(
    <>
      <button onClick={()=>setOpen(true)} style={{position:"fixed",bottom:24,right:24,zIndex:500,background:C.bgCard,border:`1px solid ${C.border}`,color:C.muted,borderRadius:12,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:600,boxShadow:"var(--shadow)",display:"flex",alignItems:"center",gap:6}}>
        Report a bug
      </button>
      {open&&(
        <div style={{position:"fixed",inset:0,background:"var(--overlay)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setOpen(false)}>
          <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:440}} onClick={(e:any)=>e.stopPropagation()}>
            <h3 style={{margin:"0 0 8px",fontSize:16}}>Report a Bug</h3>
            <p style={{color:C.muted,fontSize:13,margin:"0 0 12px"}}>Describe what went wrong and we'll look into it.</p>
            {sent?(
              <div style={{textAlign:"center",padding:"1.5rem",color:C.green,fontWeight:600,fontSize:15}}>✓ Report sent! Thanks!</div>
            ):(
              <>
                <textarea style={{...inp,height:90,resize:"vertical",marginBottom:10}}
                  placeholder="e.g. The submit button doesn't work on the FizzBuzz problem..."
                  value={text} onChange={(e:any)=>setText(e.target.value)} autoFocus/>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Attach a screenshot (optional)</div>
                  <input ref={imgRef} type="file" accept="image/*" style={{display:"none"}} onChange={pickImage}/>
                  {image?(
                    <div style={{position:"relative",display:"inline-block"}}>
                      <img src={image} alt="screenshot" style={{maxWidth:"100%",maxHeight:140,borderRadius:6,border:`1px solid ${C.border}`}}/>
                      <button onClick={()=>setImage("")} style={{position:"absolute",top:4,right:4,background:C.red,color:"#fff",border:"none",borderRadius:"50%",width:20,height:20,cursor:"pointer",fontSize:12,lineHeight:1}}>×</button>
                    </div>
                  ):(
                    <button type="button" onClick={()=>imgRef.current.click()} style={{background:C.bgInput,border:`1px dashed ${C.border}`,color:C.muted,padding:"7px 14px",borderRadius:6,cursor:"pointer",fontSize:12,width:"100%"}}>📎 Upload screenshot</button>
                  )}
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                  <OutBtn onClick={()=>{setOpen(false);setImage("");}}>Cancel</OutBtn>
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
  // Each of these mirrors one Firestore collection or settings document — see the
  // ARCHITECTURE note near the top of the file. `data` below reassembles them into
  // the exact same shape the rest of the app already expects, so nothing downstream
  // needs to change.
  const [problems,setProblems]=useState<any[]>([]);
  const [codingQuestions,setCodingQuestions]=useState<any[]>([]);
  const [units,setUnits]=useState<any[]>([]);
  const [codingUnits,setCodingUnits]=useState<any[]>([]);
  const [announcements,setAnnouncements]=useState<any[]>([]);
  const [events,setEvents]=useState<any[]>([]);
  const [usersList,setUsersList]=useState<any[]>([]);
  const [about,setAboutState]=useState<any>(initData.about);
  const [site,setSite]=useState<any>({resources:initData.resources,pinnedAnnouncementId:null});
  const [officerPlanner,setOfficerPlanner]=useState<any>({officerTasks:[],officerEvents:[],googleCalendarId:""});
  const [loadedFlags,setLoadedFlags]=useState<any>({});
  const [loading,setLoading]=useState(true);
  const [user,setUser]=useState<any>(null);
  const [page,setPage]=useState("home");
  const [uilExamActive,setUilExamActive]=useState(false);
  const [uilExamStatus,setUilExamStatus]=useState<any>(null);
  const [theme,setTheme]=useState<"light"|"dark">(()=>{
    try{return localStorage.getItem("bridgeland-cs-club-theme")==="dark"?"dark":"light";}catch{return "light";}
  });
  const [showUnitsHint,setShowUnitsHint]=useState(false);
  const unitsHintVisitKey=useRef<string|null>(null);
  const [loginForm,setLoginForm]=useState({username:"",password:""});
  const [loginErr,setLoginErr]=useState("");
  const [regForm,setRegForm]=useState({username:"",password:"",name:""});
  const [regErr,setRegErr]=useState("");
  const [showReg,setShowReg]=useState(false);
  const [modal,setModal]=useState<any>(null);
  const [activeProblem,setActiveProblem]=useState<any>(null);
  const [activeUnit,setActiveUnit]=useState<any>(null);
  const [activeCodingUnit,setActiveCodingUnit]=useState<any>(null);
  const [activeCoding,setActiveCoding]=useState<any>(null);
  const [problemSearch,setProblemSearch]=useState("");
  const [dismissedAnnId,setDismissedAnnId]=useState<any>(null);

  useEffect(()=>{
    document.documentElement.dataset.theme=theme;
    try{localStorage.setItem("bridgeland-cs-club-theme",theme);}catch{/* Theme still works for this session. */}
  },[theme]);

  const data:any={
    problems,codingQuestions,units,codingUnits,announcements,events,users:usersList,
    completions:Object.fromEntries(usersList.map((u:any)=>[u.username,u.completedProblemIds||[]])),
    codingSubmissions:Object.fromEntries(usersList.map((u:any)=>[u.username,u.codingSubmissions||{}])),
    attempts:Object.fromEntries(usersList.map((u:any)=>[u.username,u.attempts||{}])),
    streaks:Object.fromEntries(usersList.map((u:any)=>[u.username,u.streak||{}])),
    about:about||initData.about,
    resources:site.resources||[],
    pinnedAnnouncementId:site.pinnedAnnouncementId??null,
    officerTasks:officerPlanner.officerTasks||[],
    officerEvents:officerPlanner.officerEvents||[],
    googleCalendarId:officerPlanner.googleCalendarId||"",
  };

  useEffect(()=>{
    bootstrapClubData();
    const mark=(k:string)=>setLoadedFlags((f:any)=>({...f,[k]:true}));
    const onErr=(k:string)=>(err:any)=>{console.error(`Firestore error (${k})`,err);mark(k);};
    const unsubs=[
      onSnapshot(collection(db,"problems"),snap=>{setProblems(snap.docs.map(d=>d.data()));mark("problems");},onErr("problems")),
      onSnapshot(collection(db,"codingQuestions"),snap=>{setCodingQuestions(snap.docs.map(d=>d.data()));mark("codingQuestions");},onErr("codingQuestions")),
      onSnapshot(collection(db,"units"),snap=>{setUnits(snap.docs.map(d=>d.data()));mark("units");},onErr("units")),
      onSnapshot(collection(db,"codingUnits"),snap=>{setCodingUnits(snap.docs.map(d=>d.data()));mark("codingUnits");},onErr("codingUnits")),
      onSnapshot(collection(db,"announcements"),snap=>{setAnnouncements(snap.docs.map(d=>d.data()));mark("announcements");},onErr("announcements")),
      onSnapshot(collection(db,"events"),snap=>{setEvents(snap.docs.map(d=>d.data()));mark("events");},onErr("events")),
      onSnapshot(collection(db,"users"),snap=>{setUsersList(snap.docs.map(d=>({...d.data(),username:d.id})));mark("users");},onErr("users")),
      onSnapshot(ABOUT_DOC,snap=>{setAboutState(snap.exists()?snap.data():initData.about);mark("about");},onErr("about")),
      onSnapshot(SITE_DOC,snap=>{setSite(snap.exists()?snap.data():{resources:initData.resources,pinnedAnnouncementId:null});mark("site");},onErr("site")),
      onSnapshot(PLANNER_DOC,snap=>{setOfficerPlanner(snap.exists()?snap.data():{officerTasks:[],officerEvents:[],googleCalendarId:""});mark("planner");},onErr("planner")),
    ];
    return()=>unsubs.forEach(u=>u());
  },[]);

  useEffect(()=>{
    const needed=["problems","codingQuestions","units","codingUnits","announcements","events","users","about","site","planner"];
    if(needed.every(k=>loadedFlags[k]))setLoading(false);
  },[loadedFlags]);

  const upd=(fn:any,logMeta?:any)=>{
    const next=fn(data);
    saveData(data,next);
    if(logMeta){
      addDoc(collection(db,"auditLog"),{
        action:logMeta.action,
        actor:logMeta.actorUsername||user?.username||"system",
        actorName:logMeta.actorName||user?.name||user?.username||"System",
        createdAt:new Date().toISOString(),
      }).catch((e:any)=>console.error("Audit log failed",e));
    }
  };
  const isOfficer=user&&(user.role==="officer"||user.role==="developer");
  const isDev=user&&user.role==="developer";
  const isGuest=user&&user.role==="guest";
  const myCompleted=user&&!isGuest?((data.completions||{})[user.username]||[]):[];
  const nextMeeting=getNextClubMeeting();
  const nextMeetingDate=nextMeeting.toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"});

  useEffect(()=>{
    if(!user?.username||isGuest||page!=="problems"){
      setShowUnitsHint(false);
      return;
    }
    const key=`bridgeland-cs-club:units-hint-seen:${user.username}`;
    if(unitsHintVisitKey.current===key)return;
    unitsHintVisitKey.current=key;
    setShowUnitsHint(showOnFirstVisit(key));
  },[page,user?.username,isGuest]);

  useEffect(()=>{
    if(isOfficer)maybeAutoBackup(user.username);
  },[user?.username]);

  const login=async()=>{
    const attemptHash=await hashPassword(loginForm.password);
    if(loginForm.username===DEV_ACCOUNT.username&&attemptHash===DEV_ACCOUNT.passwordHash){setUser(DEV_ACCOUNT);setLoginErr("");return;}
    let f=data.users.find((u:any)=>u.username===loginForm.username&&u.passwordHash===attemptHash);
    // MIGRATION: accounts created before this security update stored a plaintext
    // `password` field instead of `passwordHash`. If we find one, log the member in
    // as normal, then silently upgrade their record to a hash and drop the plaintext
    // field — no action needed from them, and their old password keeps working once.
    if(!f){
      const legacy=data.users.find((u:any)=>u.username===loginForm.username&&u.password&&u.password===loginForm.password);
      if(legacy){
        f={...legacy,passwordHash:attemptHash};
        delete f.password;
        upd((d:any)=>({...d,users:d.users.map((u:any)=>u.username===legacy.username?f:u)}));
      }
    }
    if(f){setUser(f);setLoginErr("");}else setLoginErr("Invalid username or password.");
  };
  const register=async()=>{
    const uname=regForm.username.trim();
    const fullName=regForm.name.trim();
    if(!uname||!regForm.password||!fullName){setRegErr("All fields required.");return;}
    if(regForm.password.length<8){setRegErr("Password must be at least 8 characters.");return;}
    if(uname.toLowerCase()===DEV_ACCOUNT.username.toLowerCase()||data.users.some((u:any)=>(u.username||"").toLowerCase()===uname.toLowerCase())){setRegErr("That username is already taken.");return;}
    if(fullName.toLowerCase()===DEV_ACCOUNT.name.toLowerCase()||data.users.some((u:any)=>(u.name||"").trim().toLowerCase()===fullName.toLowerCase())){setRegErr("Someone is already registered with that name. If that's you, contact an officer — otherwise try adding a middle initial or last name.");return;}
    const passwordHash=await hashPassword(regForm.password);
    const nu={username:uname,passwordHash,name:fullName,role:"member",createdAt:new Date().toISOString(),completedProblemIds:[],codingSubmissions:{},attempts:{total:0,correct:0},streak:{current:0,best:0,lastDate:null}};
    upd((d:any)=>({...d,users:[...d.users,nu]}),{action:`${nu.name} (@${nu.username}) joined the club`,actorName:nu.name,actorUsername:nu.username});
    setUser(nu);setRegErr("");
  };

  const allNav=["about","announcements","events","resources","uilPrep","problems","coding","leaderboard","forum"];
  const navItems=isOfficer?[...allNav,"officers"]:allNav;
  const navLabels:any={home:"Home",about:"About Us",announcements:"Announcements",events:"Events",resources:"Resources",uilPrep:"UIL Prep",problems:"Problems",coding:"Coding",leaderboard:"Leaderboard",forum:"Forum",officers:"Officers"};
  const clearActiveView=()=>{setActiveCoding(null);setActiveCodingUnit(null);setActiveProblem(null);setActiveUnit(null);};
  const goHome=()=>{setPage("home");clearActiveView();};
  const navigateTo=(nextPage:string)=>{setPage(nextPage);clearActiveView();};
  const headerProps={user,onSignOut:()=>{setUser(null);setPage("home");clearActiveView();},isDev,onManage:()=>navigateTo("members"),page,navItems,navLabels,onNavigate:navigateTo,onHome:goHome,theme,onToggleTheme:()=>setTheme(t=>t==="light"?"dark":"light")};
  const withHeader=(content:any)=><div className="app-shell" data-theme={theme}><Header {...headerProps}/>{content}</div>;

  if(loading)return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Segoe UI',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <img src={LOGO_URL} alt="logo" style={{width:60,height:60,borderRadius:"50%",border:`3px solid ${C.orange}`,objectFit:"cover"}} onError={(e:any)=>e.target.style.display="none"}/>
      <div style={{color:C.muted,fontSize:15}}>Loading Bridgeland CS Club…</div>
    </div>
  );

  if(!user)return(
    <div className="app-shell" data-theme={theme}>
      <Header theme={theme} onToggleTheme={()=>setTheme(t=>t==="light"?"dark":"light")} onHome={()=>setShowReg(false)}/>
      <main className="auth-stage">
        <aside className="auth-art auth-bear-art" aria-hidden="true">
          <div className="auth-bear-orbit"><img src="/bridgeland-bears-logo.png" alt="" /></div>
          <span className="auth-art-caption">BRIDGELAND<br/>COMPUTER SCIENCE</span>
          <span className="auth-art-spark auth-spark-one">✳</span>
          <span className="auth-art-spark auth-spark-two">＋</span>
        </aside>
        <div className="auth-wrap">
          <div className="auth-intro"><span className="eyebrow">Bridgeland High School · Cypress, TX</span><h1>Learn. Practice. Build.</h1></div>
        {!showReg?(
          <div className="auth-panel" style={{...cardS,padding:"1.6rem 1.75rem"}}>
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
            <button onClick={()=>setUser(GUEST_USER)} style={{width:"100%",padding:"10px",background:C.bgInput,border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>Continue as Guest</button>
            <p style={{textAlign:"center",fontSize:12,color:C.muted,marginTop:8}}>Guests can browse but cannot do problems or appear on the leaderboard.</p>
            <p style={{textAlign:"center",fontSize:13,color:C.muted,marginTop:8}}>No account? <span style={{color:C.orangeText,cursor:"pointer"}} onClick={()=>setShowReg(true)}>Register</span></p>
          </div>
        ):(
          <div className="auth-panel" style={{...cardS,padding:"1.6rem 1.75rem"}}>
            <h2 style={{fontSize:17,fontWeight:600,marginTop:0,marginBottom:16}}>Create account</h2>
            <label style={lbl}>Full name</label>
            <input style={{...inp,marginBottom:12}} value={regForm.name} onChange={(e:any)=>setRegForm((f:any)=>({...f,name:e.target.value}))} placeholder="Your name"/>
            <label style={lbl}>Username</label>
            <input style={{...inp,marginBottom:12}} value={regForm.username} onChange={(e:any)=>setRegForm((f:any)=>({...f,username:e.target.value}))} placeholder="Choose a username"/>
            <label style={lbl}>Password</label>
            <input style={{...inp,marginBottom:16}} type="password" value={regForm.password} onChange={(e:any)=>setRegForm((f:any)=>({...f,password:e.target.value}))} placeholder="At least 8 characters"/>
            {regErr&&<p style={{color:C.red,fontSize:13,margin:"0 0 12px"}}>{regErr}</p>}
            <Btn style={{width:"100%",padding:"10px"}} onClick={register}>Create account</Btn>
            <p style={{textAlign:"center",fontSize:13,color:C.muted,marginTop:12}}><span style={{color:C.orangeText,cursor:"pointer"}} onClick={()=>setShowReg(false)}>Back to sign in</span></p>
          </div>
        )}
        </div>
        <aside className="auth-art auth-code-art" aria-hidden="true">
          <div className="auth-code-card">
            <div className="auth-code-top"><span className="auth-code-dots"><i/><i/><i/></span><span>python.py</span></div>
            <pre><code><span className="code-purple">def</span> <span className="code-blue">solve</span>(problem):<br/>  <span className="code-purple">for</span> idea <span className="code-purple">in</span> practice:<br/>    <span className="code-purple">if</span> idea.<span className="code-blue">works</span>():<br/>      <span className="code-purple">return</span> <span className="code-green">"success"</span><br/>  <span className="code-purple">return</span> <span className="code-green">"keep learning"</span></code></pre>
            <span className="auth-code-prompt">&gt; build something brilliant<span className="auth-cursor">_</span></span>
          </div>
          <span className="auth-art-caption">LEARN · PRACTICE · BUILD</span>
          <span className="auth-art-spark auth-spark-three">{ }</span>
        </aside>
        <section className="auth-feature-band" aria-hidden="true">
          <div className="auth-feature-band-intro">
            <span>THE CLUB TOOLKIT</span>
            <h2>Find your next challenge.</h2>
            <div className="auth-learning-path"><i/><i/><i/><i/><i/><i/></div>
            <p>Learn a concept. Solve a problem. See how far you can go.</p>
          </div>
          <div className="auth-feature-card auth-topic-preview">
            <div className="auth-feature-heading"><strong>UIL topic guide</strong><span>UNIT 1 OF 6</span></div>
            <span className="auth-topic-kicker">START HERE</span>
            <strong className="auth-topic-title">Java foundations</strong>
            <div className="auth-topic-progress"><i/></div>
            <div className="auth-topic-tags"><span>Primitive types</span><span>Branching</span><span>Loops</span></div>
          </div>
          <div className="auth-feature-card auth-leaderboard-preview">
            <div className="auth-feature-heading"><strong>Leaderboard</strong><span>SAMPLE</span></div>
            <div className="auth-leader-row"><b>01</b><span>Club member</span><strong>320 pts</strong></div>
            <div className="auth-leader-meter"><i style={{width:"88%"}}/></div>
            <div className="auth-leader-row"><b>02</b><span>Club member</span><strong>285 pts</strong></div>
            <div className="auth-leader-meter"><i style={{width:"72%"}}/></div>
            <div className="auth-leader-row"><b>03</b><span>Club member</span><strong>260 pts</strong></div>
            <div className="auth-leader-meter"><i style={{width:"58%"}}/></div>
          </div>
          <div className="auth-feature-card auth-test-preview">
            <div className="auth-feature-heading"><strong>UIL practice</strong><span>40 QUESTIONS</span></div>
            <div className="auth-test-meta"><span>2026</span><span>District</span><span>45:00</span></div>
            <div className="auth-test-paper"><b>1.</b><span>Choose your answer</span></div>
            <div className="auth-test-bubbles"><i>A</i><i className="chosen">B</i><i>C</i><i>D</i><i>E</i></div>
          </div>
        </section>
      </main>
      <BugReportBtn user={null}/>
    </div>
  );

  if(activeCoding!==null){
    const cq=(data.codingQuestions||[]).find((q:any)=>String(q.id)===String(activeCoding));
    if(!cq){ return withHeader(<div style={{padding:'2rem',color:C.muted}}>Question not found. <button onClick={()=>setActiveCoding(null)} style={{color:C.orangeText,background:'none',border:'none',cursor:'pointer'}}>Go back</button></div>); }
    return <CodingView cq={cq} user={user} data={data} upd={upd} onBack={()=>setActiveCoding(null)} headerProps={headerProps}/>;
  }
  if(activeCodingUnit!==null){
    const cu=(data.codingUnits||[]).find((u:any)=>String(u.id)===String(activeCodingUnit));
    if(!cu){ return withHeader(<div style={{padding:'2rem',color:C.muted}}>Unit not found. <button onClick={()=>setActiveCodingUnit(null)} style={{color:C.orangeText,background:'none',border:'none',cursor:'pointer'}}>Go back</button></div>); }
    return <CodingUnitView unit={cu} data={data} user={user} onBack={()=>setActiveCodingUnit(null)} onQuestion={(id:any)=>setActiveCoding(id)} headerProps={headerProps}/>;
  }
  if(activeProblem!==null){
    const prob=data.problems.find((p:any)=>String(p.id)===String(activeProblem.id));
    if(!prob){ return withHeader(<div style={{padding:'2rem',color:C.muted}}>Problem not found. <button onClick={()=>setActiveProblem(null)} style={{color:C.orangeText,background:'none',border:'none',cursor:'pointer'}}>Go back</button></div>); }
    return <ProblemView key={prob.id} prob={prob} user={user} data={data} upd={upd} onBack={()=>setActiveProblem(null)} unitCtx={activeProblem.unitCtx} onNext={activeProblem.onNext} headerProps={headerProps}/>;
  }
  if(activeUnit!==null){
    const unit=data.units.find((u:any)=>u.id===activeUnit);
    if(!unit){ return withHeader(<div style={{padding:'2rem',color:C.muted}}>Unit not found. <button onClick={()=>setActiveUnit(null)} style={{color:C.orangeText,background:'none',border:'none',cursor:'pointer'}}>Go back</button></div>); }
    return <UnitView unit={unit} data={data} user={user} upd={upd} onBack={()=>setActiveUnit(null)} headerProps={headerProps}
      onFinish={()=>{setActiveProblem(null);setActiveUnit(null);}}
      onProblem={(pid:any,ctx:any)=>setActiveProblem({id:pid,unitCtx:ctx,onNext:ctx.onNext})}/>;
  }

  return(
    <div className="app-shell" data-theme={theme}>
      {uilExamActive?<UILExamHeader status={uilExamStatus}/>:<Header {...headerProps}/>}
      {(()=>{
        const pinned=(data.announcements||[]).find((a:any)=>String(a.id)===String(data.pinnedAnnouncementId));
        if(!pinned||dismissedAnnId===pinned.id||page==="announcements"||uilExamActive)return null;
        const latest=pinned;
        return(
          <div style={{background:C.orange1f,borderBottom:`1px solid ${C.orange44}`,padding:"10px 1rem",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:16,flexShrink:0}}>📣</span>
            <div style={{flex:1,fontSize:13,color:C.text,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              <strong>{latest.title}</strong><span style={{color:C.muted}}> — {latest.body}</span>
            </div>
            <button onClick={()=>setPage("announcements")} style={{background:"transparent",border:`1px solid ${C.orange66}`,color:C.orangeText,borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>View all</button>
            <button onClick={()=>setDismissedAnnId(latest.id)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:"0 4px",flexShrink:0}}>×</button>
          </div>
        );
      })()}
      <div className="app-content-scale">
        <div className="app-content-inner">

        {page==="home"&&(
          <div className="home-dashboard">
            <div className="home-welcome" style={{background:"linear-gradient(135deg,var(--hero-start),var(--hero-end))",borderRadius:18,padding:"1.5rem",marginBottom:24,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:20}}>
              <img src={LOGO_URL} alt="logo" style={{width:60,height:60,borderRadius:"50%",border:`3px solid ${C.orange}`,objectFit:"cover",flexShrink:0}} onError={(e:any)=>e.target.style.display="none"}/>
              <div>
                <h1 className="home-welcome-title" style={{fontFamily:"'Manrope','DM Sans',sans-serif",fontSize:22,fontWeight:800,margin:"0 0 4px"}}>Welcome, {user.name?.split(" ")[0]||user.username}! 👋</h1>
                <p className="home-welcome-subtitle" style={{color:C.muted,margin:"0 0 8px",fontSize:14}}>Bridgeland High School Computer Science Club · Cypress, TX</p>
                <div className="home-meeting-wrap" style={{display:"inline-flex",alignItems:"center",gap:6,background:C.orange22,border:`1px solid ${C.orange44}`,borderRadius:8,padding:"6px 14px"}}>
                  <span className="home-meeting" style={{fontSize:15,color:C.orangeText,fontWeight:700}}>📅 Next meeting · {nextMeetingDate} · 2:40–3:50 PM</span>
                </div>
              </div>
            </div>
            {!isGuest&&(
              <div className="home-stats" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:24}}>
                {[["Members",data.users.length],["Events",data.events.length],["Units",(data.units||[]).length],["Problems Solved",myCompleted.length]].map(([l,v]:any)=>(
                  <div key={l} className="home-stat" style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:"1rem",textAlign:"center"}}>
                    <div className="home-stat-value" style={{fontSize:26,fontWeight:700,color:C.orangeText}}>{v}</div>
                    <div className="home-stat-label" style={{fontSize:13,color:C.muted,marginTop:4}}>{l}</div>
                  </div>
                ))}
              </div>
            )}
            {isGuest&&(<div style={{...cardS,borderLeft:`3px solid ${C.guest}`,marginBottom:24}}><div style={{fontWeight:600,fontSize:14,color:C.guest,marginBottom:4}}>Browsing as Guest</div><div style={{fontSize:13,color:C.muted}}>Sign in or create an account to do practice problems and appear on the leaderboard.</div></div>)}
            {!isGuest&&(
              <><h3 className="home-section-heading" style={{fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Top solvers</h3>
              <div className="home-solvers-card" style={{...cardS,marginBottom:24,padding:"0.75rem 1rem"}}>
                {[...(data.users||[])].filter((u:any)=>u.role==="member").map((u:any)=>{
                  const subs=((data.codingSubmissions||{})[u.username])||{};
                  const perfect=Object.values(subs).filter((s:any)=>s.score===100).length;
                  return{name:u.name||u.username,username:u.username,count:perfect};
                }).sort((a:any,b:any)=>b.count-a.count).slice(0,3).map((u:any,i:number)=>( 
                  <div key={u.username} className="home-solver-row" style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
                    <div className="home-solver-rank" style={{width:26,height:26,borderRadius:"50%",background:i===0?C.orange44:i===1?C.orange28:C.muted22,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:i===0?C.orangeText:i===1?C.orangeText:C.muted,flexShrink:0}}>{i+1}</div>
                    <div className="home-solver-name" style={{flex:1,fontWeight:600,fontSize:14}}>{u.name}{u.username===user.username&&<span style={{fontSize:11,color:C.orangeText,marginLeft:6}}>you</span>}</div>
                    <div className="home-solver-score" style={{fontWeight:700,color:C.orangeText}}>{u.count}</div><div className="home-solver-caption" style={{fontSize:12,color:C.muted}}>solved</div>
                  </div>
                ))}
                {(data.users||[]).filter((u:any)=>u.role==="member").length===0&&<p style={{color:C.muted,fontSize:13,margin:0}}>No solvers yet.</p>}
              </div></>
            )}
            <h3 className="home-section-heading" style={{fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Latest announcements</h3>
            {(data.announcements||[]).slice(-2).reverse().map((a:any)=>(
              <div key={a.id} className="home-announcement-card" style={{...cardS,borderLeft:`3px solid ${C.orange}`}}>
                {a.image&&<img src={a.image} alt="" style={{width:"100%",maxHeight:160,objectFit:"cover",borderRadius:6,marginBottom:10}}/>}
                <div className="home-announcement-title" style={{fontWeight:600,marginBottom:4}}>{a.title}</div>
                <div className="home-announcement-body" style={{fontSize:13,color:C.muted}}>{a.body}</div>
                <div className="home-announcement-date" style={{fontSize:11,color:C.muted,marginTop:8}}>{a.date}</div>
              </div>
            ))}
          </div>
        )}

        {page==="about"&&<AboutPage data={data} upd={upd} isOfficer={isOfficer}/>}

        {page==="uilPrep"&&<UILPrepPage username={user.username||"guest"} onExamModeChange={setUilExamActive} onRunnerStatus={setUilExamStatus}/>}

        {page==="announcements"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{margin:0}}>Announcements</h2>
              {isOfficer&&<Btn onClick={()=>setModal("ann")}>+ Add</Btn>}
            </div>
            {[...(data.announcements||[])].reverse().map((a:any)=>{
              const isPinned=String(data.pinnedAnnouncementId)===String(a.id);
              return(
              <div key={a.id} style={{...cardS,borderLeft:`3px solid ${isPinned?C.green:C.orange}`}}>
                {a.image&&<img src={a.image} alt="" style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:6,marginBottom:10}}/>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontWeight:600,fontSize:15}}>{a.title}</div>
                    {isPinned&&<Tag c={C.green}>📌 Pinned to top</Tag>}
                  </div>
                  {isOfficer&&<div style={{display:"flex",gap:6,flexShrink:0}}>
                    {isPinned?(
                      <SecBtn onClick={()=>upd((d:any)=>({...d,pinnedAnnouncementId:null}),{action:`Unpinned announcement "${a.title}"`})} style={{padding:"5px 10px",fontSize:12}}>Unpin</SecBtn>
                    ):(
                      <SecBtn onClick={()=>upd((d:any)=>({...d,pinnedAnnouncementId:a.id}),{action:`Pinned announcement "${a.title}" to top of site`})} style={{padding:"5px 10px",fontSize:12}}>📌 Pin to top</SecBtn>
                    )}
                    <OutBtn danger onClick={()=>{if(window.confirm("Remove this announcement?"))upd((d:any)=>({...d,announcements:(d.announcements||[]).filter((x:any)=>x.id!==a.id),pinnedAnnouncementId:isPinned?null:d.pinnedAnnouncementId}),{action:`Removed announcement "${a.title}"`});}} style={{padding:"5px 10px",fontSize:12}}>Remove</OutBtn>
                  </div>}
                </div>
                <div style={{fontSize:14,color:C.muted,margin:"8px 0"}}>{a.body}</div>
                <div style={{fontSize:11,color:C.muted}}>{a.date}</div>
              </div>
              );
            })}
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
            {(data.events||[]).map((e:any)=>(
              <div key={e.id} style={cardS}>
                {e.image&&<img src={e.image} alt="" style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:6,marginBottom:10}}/>}
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:15}}>{e.title}</div>
                    <div style={{fontSize:13,color:C.muted,marginTop:4}}>{e.date} · {e.time} · {e.location}</div>
                    <div style={{fontSize:13,marginTop:6}}>{e.desc}</div>
                  </div>
                  {isOfficer&&<OutBtn danger onClick={()=>{if(window.confirm("Remove this event?"))upd((d:any)=>({...d,events:(d.events||[]).filter((x:any)=>x.id!==e.id)}));}}>Remove</OutBtn>}
                </div>
              </div>
            ))}
          </div>
        )}

        {page==="resources"&&<ResourcesPage data={data} upd={upd} isOfficer={isOfficer}/>}

        {page==="problems"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
              <h2 style={{margin:0}}>Problems</h2>
              {isOfficer&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <SecBtn onClick={()=>setModal("prob")}>+ New problem</SecBtn>
                <Btn onClick={()=>setModal("unit")}>+ New unit</Btn>
                <OutBtn onClick={()=>setModal("importCsv")}>Import from Google Sheets</OutBtn>
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
                <input style={{...inp,marginBottom:16}} value={problemSearch} onChange={(e:any)=>setProblemSearch(e.target.value)} placeholder="🔍 Search units and problems by title..."/>
                {!problemSearch&&<>
                  {showUnitsHint&&<div style={{background:C.orange18,borderRadius:8,padding:"8px 14px",marginBottom:16,fontSize:13,color:C.orangeText}}>Units group problems together. Start a unit to go through them back-to-back.</div>}
                  {(data.units||[]).length===0&&<p style={{color:C.muted}}>No units yet.</p>}
                  {(data.units||[]).map((unit:any)=>{
                    const probs=(unit.problemIds||[]).map((id:any)=>data.problems.find((p:any)=>String(p.id)===String(id))).filter(Boolean);
                    const solved=probs.filter((p:any)=>(myCompleted||[]).some((id:any)=>String(id)===String(p.id))).length;
                    return(
                      <div key={unit.id} style={{...cardS,cursor:"pointer"}} onClick={()=>setActiveUnit(unit.id)}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:16,marginBottom:4,display:"flex",alignItems:"center",gap:8}}>{unit.title}{unit.level&&<Tag c={unit.level==="advanced"?C.red:C.green}>{unit.level==="advanced"?"Advanced":"Novice"}</Tag>}</div>
                            {unit.desc&&<div style={{fontSize:13,color:C.muted,marginBottom:10}}>{unit.desc}</div>}
                            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{probs.map((p:any)=><Tag key={p.id} c={diffColor[p.difficulty]}>{p.title}</Tag>)}</div>
                          </div>
                          <div style={{textAlign:"right",marginLeft:16,flexShrink:0}}>
                            <div style={{fontSize:22,fontWeight:700,color:C.orangeText}}>{solved}/{probs.length}</div>
                            <div style={{fontSize:11,color:C.muted}}>solved</div>
                          </div>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}>
                          <Btn onClick={(e:any)=>{e.stopPropagation();setActiveUnit(unit.id);}}>Start unit →</Btn>
                          {isOfficer&&<div style={{display:"flex",gap:8}} onClick={(e:any)=>e.stopPropagation()}>
                            <SecBtn onClick={()=>setModal({type:"editUnit",unit})}>Edit problems</SecBtn>
                            <OutBtn danger onClick={()=>{if(window.confirm("Remove this unit?"))upd((d:any)=>({...d,units:(d.units||[]).filter((x:any)=>x.id!==unit.id)}),{action:`Removed unit "${unit.title}"`});}}>Remove</OutBtn>
                          </div>}
                        </div>
                      </div>
                    );
                  })}
                </>}
                <h3 style={{fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1,margin:"20px 0 10px"}}>{problemSearch?"Search results":"All problems"}</h3>
                {(data.problems||[])
                  .filter((p:any)=>!problemSearch||p.title.toLowerCase().includes(problemSearch.toLowerCase())||p.desc.toLowerCase().includes(problemSearch.toLowerCase()))
                  .map((p:any)=>{
                    const done=(myCompleted||[]).some((id:any)=>String(id)===String(p.id));
                    return(
                      <div key={p.id} style={{...cardS,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setActiveProblem({id:p.id})}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontWeight:600}}>{p.title}</span>
                            <Tag c={diffColor[p.difficulty]}>{p.difficulty}</Tag>
                            {p.level&&<Tag c={p.level==="advanced"?C.red:C.green}>{p.level==="advanced"?"Advanced":"Novice"}</Tag>}
                            {done&&<Tag c={C.green}>✓ Solved</Tag>}
                          </div>
                        </div>
                        {isOfficer&&<div style={{display:"flex",gap:6}} onClick={(e:any)=>e.stopPropagation()}>
                          <SecBtn onClick={()=>setModal({type:"editProb",prob:p})} style={{padding:"5px 10px",fontSize:12}}>Edit</SecBtn>
                          <OutBtn danger onClick={()=>{if(window.confirm("Delete this problem? It will also be removed from any units."))upd((d:any)=>({...d,problems:(d.problems||[]).filter((x:any)=>x.id!==p.id),units:(d.units||[]).map((u:any)=>({...u,problemIds:(u.problemIds||[]).filter((id:any)=>id!==p.id)}))}),{action:`Deleted problem "${p.title}"`});}} style={{padding:"5px 10px",fontSize:12}}>Delete</OutBtn>
                        </div>}
                      </div>
                    );
                  })}
                {problemSearch&&(data.problems||[]).filter((p:any)=>p.title.toLowerCase().includes(problemSearch.toLowerCase())||p.desc.toLowerCase().includes(problemSearch.toLowerCase())).length===0&&<p style={{color:C.muted,fontSize:13}}>No problems match "{problemSearch}".</p>}
              </>
            )}
          </div>
        )}

        {page==="coding"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <h2 style={{margin:0}}>Coding Questions</h2>
              {isOfficer&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <SecBtn onClick={()=>setModal("codingQ")}>+ New question</SecBtn>
                <Btn onClick={()=>setModal("codingUnit")}>+ New unit</Btn>
              </div>}
            </div>
            {isGuest?(
              <div style={{...cardS,borderLeft:`3px solid ${C.guest}`,textAlign:"center",padding:"2rem"}}>
                <div style={{fontSize:32,marginBottom:12}}>🔒</div>
                <div style={{fontWeight:600,fontSize:16,marginBottom:8}}>Sign in to code</div>
                <div style={{fontSize:14,color:C.muted}}>Create a free account to access coding challenges.</div>
              </div>
            ):(
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",background:C.orange18,border:`1px solid ${C.orange33}`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:C.orangeText}}>
                  <span>💡 Select a language and write your solution.</span>
                  <div role="group" aria-label="Difficulty key" style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:12,fontWeight:700}}>Difficulty:</span>
                    <Tag c={diffColor.Easy}>Easy</Tag>
                    <Tag c={diffColor.Medium}>Medium</Tag>
                    <Tag c={diffColor.Hard}>Hard</Tag>
                  </div>
                </div>
                {(data.codingUnits||[]).length>0&&<>
                  <h3 style={{fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Units</h3>
                  {(data.codingUnits||[]).map((cu:any)=>{
                    const qs=(cu.codingQuestionIds||[]).map((id:any)=>(data.codingQuestions||[]).find((q:any)=>String(q.id)===String(id))).filter(Boolean);
                    const mySubs=(data.codingSubmissions||{})?.[user.username]||{};
                    const solved=qs.filter((q:any)=>mySubs[q.id]?.score===100).length;
                    return(
                      <div key={cu.id} style={{...cardS,cursor:"pointer"}} onClick={()=>setActiveCodingUnit(cu.id)}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:700,fontSize:16,marginBottom:4,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                              <span>{cu.title}</span>
                              {cu.level&&<Tag c={cu.level==="advanced"?C.red:C.green}>{cu.level==="advanced"?"Advanced":"Novice"}</Tag>}
                              {qs.map((q:any)=><Tag key={q.id} c={diffColor[q.difficulty]||C.muted}>{q.title}</Tag>)}
                            </div>
                            {cu.desc&&<div style={{fontSize:13,color:C.muted,marginBottom:10}}>{cu.desc}</div>}
                          </div>
                          <div style={{textAlign:"right",marginLeft:16,flexShrink:0}}>
                            <div style={{fontSize:22,fontWeight:700,color:C.orangeText}}>{solved}/{qs.length}</div>
                            <div style={{fontSize:11,color:C.muted}}>solved</div>
                          </div>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}>
                          <Btn onClick={(e:any)=>{e.stopPropagation();setActiveCodingUnit(cu.id);}}>Open unit →</Btn>
                          {isOfficer&&<div style={{display:"flex",gap:8}} onClick={(e:any)=>e.stopPropagation()}>
                            <SecBtn onClick={()=>setModal({type:"editCodingUnit",codingUnit:cu})}>Edit questions</SecBtn>
                            <OutBtn danger onClick={()=>{if(window.confirm("Remove this unit?"))upd((d:any)=>({...d,codingUnits:(d.codingUnits||[]).filter((x:any)=>x.id!==cu.id)}),{action:`Removed coding unit "${cu.title}"`});}}>Remove</OutBtn>
                          </div>}
                        </div>
                      </div>
                    );
                  })}
                  <h3 style={{fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1,margin:"20px 0 10px"}}>All coding questions</h3>
                </>}
                {(data.codingQuestions||[]).length===0&&<p style={{color:C.muted}}>No coding questions yet.</p>}
                {(data.codingQuestions||[]).map((cq:any)=>{
                  const sub=(data.codingSubmissions||{})?.[user.username]?.[cq.id];
                  const pct=sub?sub.score:null;
                  return(
                    <div key={cq.id} style={{...cardS,cursor:"pointer"}} onClick={()=>setActiveCoding(cq.id)}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                            <span style={{fontWeight:700,fontSize:16}}>{cq.title}</span>
                            <Tag c={diffColor[cq.difficulty]||C.muted}>{cq.difficulty}</Tag>
                            {cq.level&&<Tag c={cq.level==="advanced"?C.red:C.green}>{cq.level==="advanced"?"Advanced":"Novice"}</Tag>}
                            {cq.language&&<Tag c={C.purple}>{cq.language}</Tag>}
                          </div>
                          <div style={{fontSize:13,color:C.muted}}>{cq.desc?.split("\n")[0]}</div>
                          <div style={{fontSize:12,color:C.muted,marginTop:6}}>{cq.testCases?.length||0} test cases</div>
                        </div>
                        <div style={{textAlign:"right",marginLeft:16,flexShrink:0}}>
                          {pct!==null?<><div style={{fontSize:22,fontWeight:700,color:pct===100?C.green:pct>0?C.orangeText:C.red}}>{pct}%</div><div style={{fontSize:11,color:C.muted}}>best score</div></>:<div style={{fontSize:12,color:C.muted,marginTop:8}}>Not attempted</div>}
                        </div>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}>
                        <Btn onClick={(e:any)=>{e.stopPropagation();setActiveCoding(cq.id);}}>Open →</Btn>
                        {isOfficer&&<div style={{display:"flex",gap:8}} onClick={(e:any)=>e.stopPropagation()}>
                          <SecBtn onClick={()=>setModal({type:"editCodingQ",cq})}>Edit</SecBtn>
                          <OutBtn danger onClick={()=>{if(window.confirm("Remove this coding question?"))upd((d:any)=>({...d,codingQuestions:(d.codingQuestions||[]).filter((x:any)=>x.id!==cq.id),codingUnits:(d.codingUnits||[]).map((u:any)=>({...u,codingQuestionIds:(u.codingQuestionIds||[]).filter((id:any)=>id!==cq.id)}))}),{action:`Deleted coding question "${cq.title}"`});}}>Remove</OutBtn>
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

        {page==="forum"&&<ForumPage user={user} isGuest={isGuest} isOfficer={isOfficer}/>}
        {page==="officers"&&isOfficer&&<OfficersPage data={data} upd={upd} isDev={isDev} user={user}/>}

        {page==="members"&&isDev&&(
          <div>
            <h2>Manage Members</h2>
            {(data.users||[]).filter((u:any)=>u.username!==DEV_ACCOUNT.username).map((u:any)=>(
              <div key={u.username} style={{...cardS,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontWeight:600}}>{u.name||u.username}</span>
                  <span style={{fontSize:12,color:C.muted,marginLeft:8}}>@{u.username}</span>
                  <Tag c={u.role==="developer"?C.purple:u.role==="officer"?C.orange:C.muted}>{u.role}</Tag>
                </div>
                <div style={{display:"flex",gap:8}}>
                  {u.role==="member"&&<SecBtn onClick={()=>upd((d:any)=>({...d,users:d.users.map((x:any)=>x.username===u.username?{...x,role:"officer"}:x)}))}>Make officer</SecBtn>}
                  {u.role==="officer"&&<Btn color={C.muted} onClick={()=>upd((d:any)=>({...d,users:d.users.map((x:any)=>x.username===u.username?{...x,role:"member"}:x)}))}>Demote</Btn>}
                  {u.role==="officer"&&<SecBtn onClick={()=>{if(window.confirm(`Make ${u.name||u.username} a developer? Developers can manage members (including other developers) and have full admin access.`))upd((d:any)=>({...d,users:d.users.map((x:any)=>x.username===u.username?{...x,role:"developer"}:x)}));}}>Make developer</SecBtn>}
                  {u.role==="developer"&&<Btn color={C.muted} onClick={()=>upd((d:any)=>({...d,users:d.users.map((x:any)=>x.username===u.username?{...x,role:"officer"}:x)}))}>Demote to officer</Btn>}
                  <OutBtn danger onClick={()=>{if(window.confirm(`Delete ${u.name||u.username}? This cannot be undone.`))upd((d:any)=>({...d,users:d.users.filter((x:any)=>x.username!==u.username)}))}}>Delete</OutBtn>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
      {modal&&<ModalBox modal={modal} setModal={setModal} data={data} upd={upd} isDev={isDev}/>}
      <BugReportBtn user={user}/>
    </div>
  );
}

/* ---- CODE EDITOR ---- */
const PAIRS:any = {'(':')','{':'}','[':']'};
const OPEN_PAIRS = new Set(['(', '{', '[']);
const CLOSE_PAIRS = new Set([')', '}', ']']);

const JAVA_KEYWORDS = ['public','private','protected','static','void','int','String','boolean','double','float','long','char','byte','short','return','if','else','for','while','do','switch','case','break','continue','new','class','interface','extends','implements','this','super','null','true','false','final','abstract','import','package','try','catch','finally','throws','throw'];
const PYTHON_KEYWORDS = ['def','return','if','elif','else','for','while','and','or','not','in','is','None','True','False','class','import','from','try','except','finally','with','as','pass','break','continue','lambda','yield'];
const CPP_KEYWORDS = ['int','void','bool','char','double','float','long','short','return','if','else','for','while','do','switch','case','break','continue','new','delete','class','public','private','protected','static','const','true','false','nullptr','auto','include','using','namespace','std','cout','cin','endl'];

function getKeywords(lang:string):string[]{
  if(lang==="Java") return JAVA_KEYWORDS;
  if(lang==="Python") return PYTHON_KEYWORDS;
  return CPP_KEYWORDS;
}

function CodeEditor({code,onChange,lang}:any){
  const taRef = useRef<any>();
  const [lineCount,setLineCount] = useState(1);

  useEffect(()=>{
    setLineCount(Math.max(1,(code.match(/\n/g)||[]).length+1));
  },[code]);

  const handleKeyDown = (e:any) => {
    const ta = e.target;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = code;
    const lineStart = val.lastIndexOf("\n", start-1)+1;
    const currentLine = val.slice(lineStart, start);
    const indent = currentLine.match(/^(\s*)/)?.[1]||"";

    if(e.key === "Tab"){
      e.preventDefault();
      const TAB = "  ";
      if(e.shiftKey){
        const ls = val.lastIndexOf("\n",start-1)+1;
        if(val[ls]===" "&&val[ls+1]===" "){
          const nv = val.slice(0,ls)+val.slice(ls+2);
          onChange(nv);
          requestAnimationFrame(()=>{ta.selectionStart=ta.selectionEnd=Math.max(ls,start-2);});
        }
      } else {
        const nv = val.slice(0,start)+TAB+val.slice(end);
        onChange(nv);
        requestAnimationFrame(()=>{ta.selectionStart=ta.selectionEnd=start+2;});
      }
    } else if(e.key === "Enter"){
      e.preventDefault();
      const prevChar = val[start-1];
      const nextChar = val[start];
      const extraIndent = (prevChar==="{"||prevChar==="("||prevChar==="[")?"  ":"";
      const closing = prevChar==="{"&&nextChar==="}"?"\n"+indent:"";
      const ins = "\n"+indent+extraIndent+closing;
      const nv = val.slice(0,start)+ins+val.slice(end);
      onChange(nv);
      const pos = start+1+indent.length+extraIndent.length;
      requestAnimationFrame(()=>{ta.selectionStart=ta.selectionEnd=pos;});
    } else if(OPEN_PAIRS.has(e.key)){
      e.preventDefault();
      const close = PAIRS[e.key];
      const nv = val.slice(0,start)+e.key+close+val.slice(end);
      onChange(nv);
      requestAnimationFrame(()=>{ta.selectionStart=ta.selectionEnd=start+1;});
    } else if(e.key==='"'){
      e.preventDefault();
      if(val[start]==='"'){
        requestAnimationFrame(()=>{ta.selectionStart=ta.selectionEnd=start+1;});
      } else {
        const nv = val.slice(0,start)+'"'+'"'+val.slice(end);
        onChange(nv);
        requestAnimationFrame(()=>{ta.selectionStart=ta.selectionEnd=start+1;});
      }
    } else if(e.key==="'"){ 
      e.preventDefault();
      if(val[start]==="'"){
        requestAnimationFrame(()=>{ta.selectionStart=ta.selectionEnd=start+1;});
      } else {
        const nv = val.slice(0,start)+"'"+"'"+val.slice(end);
        onChange(nv);
        requestAnimationFrame(()=>{ta.selectionStart=ta.selectionEnd=start+1;});
      }
    } else if(CLOSE_PAIRS.has(e.key)&&val[start]===e.key){
      e.preventDefault();
      requestAnimationFrame(()=>{ta.selectionStart=ta.selectionEnd=start+1;});
    } else if(e.key==="Backspace"&&start===end){
      const prev = val[start-1];
      const next = val[start];
      if(prev&&next&&PAIRS[prev]===next){
        e.preventDefault();
        const nv = val.slice(0,start-1)+val.slice(start+1);
        onChange(nv);
        requestAnimationFrame(()=>{ta.selectionStart=ta.selectionEnd=start-1;});
      }
    } else if(e.ctrlKey&&e.key==="/"){
      e.preventDefault();
      const ls = val.lastIndexOf("\n",start-1)+1;
      const le = val.indexOf("\n",start);
      const line = val.slice(ls,le===-1?undefined:le);
      const commentPrefix = lang==="Python"?"# ":"// ";
      let nv:string;
      if(line.trimStart().startsWith(lang==="Python"?"#":"//")){
        nv = val.slice(0,ls)+line.replace(lang==="Python"?/^(\s*)#\s?/:/^(\s*)\/\/\s?/,"$1")+val.slice(le===-1?val.length:le);
      } else {
        nv = val.slice(0,ls)+indent+commentPrefix+line.trimStart()+val.slice(le===-1?val.length:le);
      }
      onChange(nv);
      requestAnimationFrame(()=>{ta.selectionStart=ta.selectionEnd=start+(nv.length-val.length);});
    }
  };

  const sharedTextStyle:any = {
    margin:0,padding:"10px 10px 10px 0",fontFamily:"'Courier New',monospace",
    fontSize:13,lineHeight:"1.6",whiteSpace:"pre",overflowWrap:"normal",wordBreak:"normal",
    tabSize:2,
  };

  return(
    <div style={{position:"relative",background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:6,overflow:"hidden",fontFamily:"'Courier New',monospace",fontSize:13,lineHeight:"1.6"}}>
      <div style={{background:C.bgCard,borderBottom:`1px solid ${C.border}`,padding:"3px 10px",fontSize:11,color:C.muted,display:"flex",gap:12}}>
        <span>Tab: indent</span><span>Shift+Tab: unindent</span><span>Ctrl+/: comment</span><span>Auto-close: {"() [] {}"}</span>
      </div>
      <div style={{display:"flex",height:340,overflow:"hidden",minHeight:340}}>
        <div style={{...sharedTextStyle,padding:"10px 8px 10px 10px",color:C.muted,background:C.bg88,borderRight:`1px solid ${C.border}`,flexShrink:0,minWidth:40,textAlign:"right",userSelect:"none" as const,overflowY:"hidden" as const}}>
          {Array.from({length:lineCount},(_,i)=>i+1).map(n=><div key={n}>{n}</div>)}
        </div>
        <div style={{flex:1,position:"relative",overflow:"hidden"}}>
          <textarea
            ref={taRef}
            value={code}
            onChange={(e:any)=>onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            style={{
              ...sharedTextStyle,
              position:"absolute",inset:0,width:"100%",height:"100%",
              resize:"none",background:"transparent",color:C.text,
              border:"none",outline:"none",caretColor:C.orange,
              padding:"10px 10px",overflow:"auto",zIndex:2,
            }}
          />
        </div>
      </div>
      <div style={{background:C.bgCard,borderTop:`1px solid ${C.border}`,padding:"2px 10px",fontSize:11,color:C.muted,display:"flex",gap:16}}>
        <span>{lang}</span>
        <span>Lines: {lineCount}</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}

function CodingView({cq,user,data,upd,onBack,headerProps}:any){
  const STARTER:any={
    "Python":"# Read input with input() or sys.stdin, then print your answer\nimport sys\ndata = sys.stdin.read().split()\n\n# your code here\n",
    "Java":"import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n\n        // your code here\n\n    }\n}",
    "C++":"#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your code here\n\n    return 0;\n}",
  };
  const mySub=((data.codingSubmissions||{})[user?.username]||{})[cq.id];
  const initLang=(mySub?.lang&&LANGS.includes(mySub.lang))?mySub.lang:((cq.language&&LANGS.includes(cq.language))?cq.language:"Java");
  const [lang,setLang]=useState(initLang);
  const getStarter=(l:string)=>(cq.starterCodes||{})[l]||cq.starterCode||STARTER[l]||STARTER["Python"];
  // Reopening a problem restores your last-saved attempt (in the language you saved
  // it in) instead of always resetting to starter code — including a fully solved
  // problem, so you can see/keep working from a completed solution.
  const [code,setCode]=useState(mySub&&mySub.lang===initLang&&mySub.code?mySub.code:getStarter(initLang));
  const [results,setResults]=useState<any>(null);
  const [running,setRunning]=useState(false);
  const [runErr,setRunErr]=useState("");
  const myBest=((data.codingSubmissions||{})[user?.username]||{})[cq.id]?.score??null;

  const [customInput,setCustomInput]=useState("");
  const [customOutput,setCustomOutput]=useState<any>(null);
  const [customRunning,setCustomRunning]=useState(false);
  const runCustomTest=async()=>{
    setCustomRunning(true);setCustomOutput(null);
    const res=await runCustom(code,lang,customInput);
    setCustomOutput(res);
    setCustomRunning(false);
  };

  const switchLang=(l:string)=>{
    setLang(l);
    setCode(getStarter(l));
  };

  const run=async()=>{
    setRunning(true);setResults(null);setRunErr("");
    try{
      const res=await runWithJudge0(code,lang,cq.testCases||[]);
      setResults(res);
      const passed=res.filter((r:any)=>r.pass).length;
      const tcLen=(cq.testCases||[]).length;
      const score=tcLen>0?Math.round((passed/tcLen)*100):0;
      // Code is now saved on every run — even an unsuccessful one — so reopening
      // the problem always resumes your latest work, not just your best-scoring
      // attempt. The recorded "best score" (used for the Best% tag and the coding
      // leaderboard) still only ever goes up, computed fresh from current data here
      // rather than from the possibly-stale `myBest` captured at render time.
      upd((d:any)=>{
        const prevBest=(((d.codingSubmissions||{})[user.username]||{})[cq.id])?.score??-1;
        return{...d,codingSubmissions:{...(d.codingSubmissions||{}),[user.username]:{...((d.codingSubmissions||{})[user.username]||{}),[cq.id]:{score:Math.max(score,prevBest),code,lang,timestamp:new Date().toISOString()}}}};
      });
    }catch(e:any){setRunErr(e.message);}
    setRunning(false);
  };

  const passed=results?.filter((r:any)=>r.pass).length??0;
  const total=results?.length??0;
  const score=total>0?Math.round((passed/total)*100):0;

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <Header {...headerProps}/>
      <div className="app-content-scale">
        <OutBtn onClick={onBack} style={{marginBottom:16}}>← Back to Coding</OutBtn>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          <span style={{fontWeight:700,fontSize:22}}>{cq.title}</span>
          <Tag c={diffColor[cq.difficulty]||C.muted}>{cq.difficulty}</Tag>
          {cq.level&&<Tag c={cq.level==="advanced"?C.red:C.green}>{cq.level==="advanced"?"Advanced":"Novice"}</Tag>}
          {myBest!==null&&<Tag c={myBest===100?C.green:myBest>0?C.orange:C.red}>Best: {myBest}%</Tag>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div>
            <div style={{...cardS,marginBottom:12}}>
              <h3 style={{margin:"0 0 10px",fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Problem</h3>
              {cq.image&&<img src={cq.image} alt="" style={{width:"100%",maxHeight:280,objectFit:"contain",borderRadius:8,marginBottom:12,border:`1px solid ${C.border}`,background:C.bgInput}}/>}
              <div style={{fontSize:14,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{cq.desc}</div>
            </div>
            <div style={cardS}>
              <h3 style={{margin:"0 0 8px",fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Input</h3>
              <div style={{fontSize:13,color:C.muted}}>Your program will be run against {cq.testCases?.length||0} hidden test case{(cq.testCases?.length||0)!==1?"s":""}. Read input from stdin (e.g. <code style={{color:C.text}}>Scanner input = new Scanner(System.in);</code> in Java) and print your answer.</div>
            </div>
          </div>
          <div>
            <div style={{...cardS,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <h3 style={{margin:0,fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Your Solution</h3>
                <div style={{display:"flex",gap:4}}>
                  {LANGS.map(l=>(
                    <button key={l} onClick={()=>switchLang(l)} style={{padding:"3px 9px",fontSize:11,border:`1px solid ${lang===l?C.orange:C.border}`,borderRadius:5,background:lang===l?C.orange22:"transparent",color:lang===l?C.orangeText:C.muted,cursor:"pointer",fontWeight:lang===l?700:400}}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{background:C.orange15,border:`1px solid ${C.orange33}`,borderRadius:6,padding:"6px 10px",fontSize:12,color:C.orangeText,marginBottom:8}}>
                May take a few seconds per test case.
              </div>
              <CodeEditor code={code} onChange={setCode} lang={lang}/>
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
                <Btn onClick={run} disabled={running} style={{minWidth:140}}>
                  {running?<span style={{display:"flex",alignItems:"center",gap:8}}><span style={{display:"inline-block",width:12,height:12,border:`2px solid #ffffff55`,borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>Running…</span>:"▶ Run code"}
                </Btn>
              </div>
            </div>
            <div style={{...cardS,marginBottom:12}}>
              <h3 style={{margin:"0 0 10px",fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Test with your own input</h3>
              <textarea value={customInput} onChange={(e:any)=>setCustomInput(e.target.value)} placeholder="Enter input to program here" style={{...inp,height:80,resize:"vertical",fontFamily:"monospace",fontSize:13,marginBottom:8}}/>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:customOutput?10:0}}>
                <SecBtn onClick={runCustomTest} disabled={customRunning}>{customRunning?"Running...":"▶ Run with this input"}</SecBtn>
              </div>
              {customOutput&&(
                <div style={{background:"var(--editor-surface)",border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 12px",fontFamily:"monospace",fontSize:12,whiteSpace:"pre-wrap",color:customOutput.kind==="ok"?C.text:C.red,maxHeight:220,overflowY:"auto"}}>
                  {customOutput.kind==="ok"?(customOutput.text||"(no output)"):customOutput.text}
                  {customOutput.kind==="ok"&&customOutput.stderr&&<div style={{color:C.red,marginTop:6}}>{customOutput.stderr}</div>}
                </div>
              )}
            </div>
            {runErr&&<div style={{...cardS,borderLeft:`3px solid ${C.red}`,color:C.red,fontSize:13}}><strong>⚠ Error:</strong> {runErr}<div style={{marginTop:6,fontSize:12,color:C.muted}}>If this persists, Judge0 may be temporarily unavailable. Try again in a moment.</div></div>}
            {running&&!results&&(
              <div style={{...cardS,textAlign:"center",padding:"1.5rem",color:C.muted,fontSize:13}}>
                <div style={{marginBottom:8,fontSize:20}}>⏳</div>
                Running your code against {cq.testCases?.length||0} test case{(cq.testCases?.length||0)!==1?"s":""}…
                <div style={{fontSize:11,marginTop:6}}>Submitting to Judge0 execution server</div>
              </div>
            )}
            {results&&(
              <div style={cardS}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <div style={{fontSize:28,fontWeight:700,color:score===100?C.green:score>0?C.orangeText:C.red}}>{score}%</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{passed}/{total} test cases passed</div>
                    <div style={{fontSize:12,color:C.muted}}>{score===100?"All tests passed! 🎉":score>0?"Keep going, almost there!":"No tests passed yet"}</div>
                  </div>
                </div>
                {results.map((r:any,i:number)=>(
                  <div key={i} style={{padding:"8px 10px",borderRadius:6,marginBottom:6,background:r.pass?C.green15:C.red15,border:`1px solid ${r.pass?C.green33:C.red33}`,fontSize:12,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{color:r.pass?C.green:C.red,fontWeight:700}}>{r.pass?"✓":"✗"}</span>
                    <span style={{color:C.muted}}>Test {i+1}{r.pass?" passed":r.got?.startsWith("Compile error")?" — compile error":r.got?.startsWith("Error")?" — runtime error":r.got==="Time limit exceeded"?" — time limit exceeded":" failed"}</span>
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
    const deepClone=(items:any[]):any[]=>{
      return items.map(item=>{
        if(item.id===node.id)return fn(item);
        if(item.isFolder){
          const newChildren=deepClone(item.children||[]);
          return{...item,children:newChildren,items:(item.items||[])};
        }
        return item;
      });
    };
    return{...d,resources:deepClone(d.resources||[])};
  });

  const removeFromParent=()=>upd((d:any)=>{
    const remove=(items:any[]):any[]=>items.filter((x:any)=>String(x.id)!==String(node.id)).map((item:any)=>
      item.isFolder?{...item,children:remove(item.children||[]),items:item.items||[]}:item
    );
    return{...d,resources:remove(d.resources||[])};
  });

  const addLink=()=>{
    if(!newLink.title||!newLink.url)return;
    updateNode((f:any)=>({...f,items:[...(f.items||[]),{id:uid(),title:newLink.title,url:newLink.url}]}));
    setNewLink({title:"",url:""});setAddingLink(false);
  };
  const addSubFolder=()=>{
    if(!newFolderName.trim())return;
    updateNode((f:any)=>({...f,children:[...(f.children||[]),{id:`f${uid()}`,title:newFolderName.trim(),isFolder:true,children:[],items:[]}]}));
    setNewFolderName("");setAddingFolder(false);
  };
  const removeLink=(id:any)=>updateNode((f:any)=>({...f,items:(f.items||[]).filter((i:any)=>i.id!==id)}));

  const totalCount=(node.items||[]).length+(node.children||[]).length;
  const folderAccent=depth===0?C.orangeText:C.blueText;
  const folderTint=depth===0?C.orange18:C.blue18;
  const folderBorder=depth===0?C.orange44:C.blue33;

  return(
    <div style={{marginBottom:depth===0?8:4}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:folderTint,border:`1px solid ${folderBorder}`,borderLeft:`4px solid ${folderAccent}`,borderRadius:open?"12px 12px 0 0":"12px",cursor:"pointer",marginLeft:depth*12}}>
        <span style={{fontSize:12,color:folderAccent,transition:"transform 0.15s",display:"inline-block",transform:open?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" style={{color:folderAccent,flexShrink:0}}>
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" fill="currentColor" opacity=".22"/>
          <path d="M3 8.5h18l-1.5 8.7a2 2 0 0 1-2 1.7H5.5a2 2 0 0 1-2-1.7L3 8.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
          <path d="M3.5 8V7a2 2 0 0 1 2-2h4.3l2 2H19a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
        </svg>
        <span style={{fontWeight:700,flex:1,fontSize:depth===0?15:14,color:C.text}}>{node.title}</span>
        <span style={{fontSize:11,color:C.muted}}>{totalCount} item{totalCount!==1?"s":""}</span>
        {isOfficer&&<button onClick={(e:any)=>{e.stopPropagation();removeFromParent();}} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:16,padding:"0 2px"}}>×</button>}
      </div>
      {open&&(
        <div style={{background:C.bgCard,border:`1px solid ${folderBorder}`,borderTop:"none",borderLeft:`4px solid ${folderAccent}`,borderRadius:"0 0 12px 12px",padding:"10px 12px 12px",marginLeft:depth*12}}>
          {(node.children||[]).map((child:any)=>(
            <div key={child.id} style={{marginLeft:8,marginTop:6}}>
              <FolderNode node={child} depth={depth+1} upd={upd} isOfficer={isOfficer}/>
            </div>
          ))}
          {(node.items||[]).map((item:any)=>(
            <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 4px",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontWeight:500,fontSize:13}}>{item.title}</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <a href={item.url} target="_blank" rel="noreferrer" style={{color:C.orangeText,fontSize:13}}>Open</a>
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
    upd((d:any)=>({...d,resources:[...(d.resources||[]),{id:`f${uid()}`,title:name.trim(),isFolder:true,children:[],items:[]}]}));
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

function OfficersPage({data,upd,isDev,user}:any){
  const [showTask,setShowTask]=useState(false);
  const [showEvent,setShowEvent]=useState(false);
  const [taskForm,setTaskForm]=useState({title:"",dueDate:"",assignees:[] as string[]});
  const [eventForm,setEventForm]=useState({title:"",date:"",time:"2:40 PM",desc:""});
  const [bugReports,setBugReports]=useState<any[]>([]);
  const [bugTab,setBugTab]=useState<"open"|"resolved">("open");
  const [expandedBug,setExpandedBug]=useState<any>(null);
  const officerUsers=data.users.filter((u:any)=>u.role==="officer"||u.role==="developer");
  const tasks=data.officerTasks||[];
  const events=data.officerEvents||[];
  const today=new Date().toISOString().slice(0,10);

  useEffect(()=>{
    const q=query(collection(db,"bugReports"),orderBy("timestamp","desc"));
    getDocs(q).then((snap:any)=>{
      setBugReports(snap.docs.map((d:any)=>({id:d.id,...d.data()})));
    }).catch((e:any)=>console.error(e));
  },[]);

  const markResolved=async(id:string,resolved:boolean)=>{
    await updateDoc(doc(db,"bugReports",id),{resolved});
    setBugReports((prev:any)=>prev.map((r:any)=>r.id===id?{...r,resolved}:r));
  };

  const deleteReport=async(id:string)=>{
    await deleteDoc(doc(db,"bugReports",id));
    setBugReports((prev:any)=>prev.filter((r:any)=>r.id!==id));
  };

  const openBugs=bugReports.filter((r:any)=>!r.resolved);
  const resolvedBugs=bugReports.filter((r:any)=>r.resolved);
  const upcoming=[...events].filter((e:any)=>e.date>=today).sort((a:any,b:any)=>a.date.localeCompare(b.date));
  const past=[...events].filter((e:any)=>e.date<today).sort((a:any,b:any)=>b.date.localeCompare(a.date));
  const toggleTask=(id:any)=>upd((d:any)=>({...d,officerTasks:(d.officerTasks||[]).map((t:any)=>t.id===id?{...t,done:!t.done}:t)}));
  const addTask=()=>{
    if(!taskForm.title)return;
    upd((d:any)=>({...d,officerTasks:[...(d.officerTasks||[]),{id:uid(),title:taskForm.title,dueDate:taskForm.dueDate,assignees:taskForm.assignees,done:false}]}));
    setTaskForm({title:"",dueDate:"",assignees:[]});setShowTask(false);
  };
  const addEvent=()=>{
    if(!eventForm.title||!eventForm.date)return;
    upd((d:any)=>({...d,officerEvents:[...(d.officerEvents||[]),{id:uid(),...eventForm}]}));
    setEventForm({title:"",date:"",time:"2:40 PM",desc:""});setShowEvent(false);
  };
  const toggleAssignee=(name:string)=>setTaskForm((f:any)=>({...f,assignees:f.assignees.includes(name)?f.assignees.filter((a:string)=>a!==name):[...f.assignees,name]}));
  const overlay:any={position:"fixed",inset:0,background:"var(--overlay)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000};
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
                {isDev&&<button onClick={(e:any)=>{e.stopPropagation();if(window.confirm("Remove this task?"))upd((d:any)=>({...d,officerTasks:(d.officerTasks||[]).filter((x:any)=>String(x.id)!==String(t.id))}));}} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:16,lineHeight:1,padding:0}}>×</button>}
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
                  {isDev&&<button onClick={()=>upd((d:any)=>({...d,officerEvents:(d.officerEvents||[]).filter((x:any)=>String(x.id)!==String(e.id))}))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:16,lineHeight:1,padding:0,flexShrink:0}}>×</button>}
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
                  {isDev&&<button onClick={()=>upd((d:any)=>({...d,officerEvents:(d.officerEvents||[]).filter((x:any)=>String(x.id)!==String(e.id))}))} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:16,lineHeight:1,padding:0,flexShrink:0}}>×</button>}
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

      <div style={{marginTop:32}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <h2 style={{margin:0,fontSize:18}}>Bug Reports</h2>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setBugTab("open")} style={{padding:"5px 14px",fontSize:13,border:`1px solid ${bugTab==="open"?C.orange:C.border}`,borderRadius:6,background:bugTab==="open"?C.orange22:"transparent",color:bugTab==="open"?C.orangeText:C.muted,cursor:"pointer",fontWeight:bugTab==="open"?700:400}}>
              Open ({openBugs.length})
            </button>
            <button onClick={()=>setBugTab("resolved")} style={{padding:"5px 14px",fontSize:13,border:`1px solid ${bugTab==="resolved"?C.green:C.border}`,borderRadius:6,background:bugTab==="resolved"?C.green22:"transparent",color:bugTab==="resolved"?C.green:C.muted,cursor:"pointer",fontWeight:bugTab==="resolved"?700:400}}>
              Resolved ({resolvedBugs.length})
            </button>
          </div>
        </div>
        {(bugTab==="open"?openBugs:resolvedBugs).length===0&&(
          <p style={{color:C.muted,fontSize:13}}>{bugTab==="open"?"No open bug reports.":"No resolved reports yet."}</p>
        )}
        {(bugTab==="open"?openBugs:resolvedBugs).map((r:any)=>(
          <div key={r.id} style={{...cardS,borderLeft:`3px solid ${r.resolved?C.green:C.orange}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontWeight:600,fontSize:14}}>{r.name||r.username}</span>
                  <span style={{fontSize:11,color:C.muted}}>@{r.username}</span>
                  <span style={{fontSize:11,color:C.muted}}>·</span>
                  <span style={{fontSize:11,color:C.muted}}>{r.timestamp?new Date(r.timestamp).toLocaleDateString():"Unknown date"}</span>
                </div>
                <div style={{fontSize:14,color:C.text,lineHeight:1.6,marginBottom:r.image?8:0}}>{r.text}</div>
                {r.image&&(
                  <div>
                    <img
                      src={r.image}
                      alt="screenshot"
                      onClick={()=>setExpandedBug(expandedBug===r.id?null:r.id)}
                      style={{maxWidth:"100%",maxHeight:expandedBug===r.id?600:120,objectFit:"cover",objectPosition:"top",borderRadius:6,border:`1px solid ${C.border}`,cursor:"pointer",transition:"max-height 0.2s"}}
                    />
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>{expandedBug===r.id?"Click to collapse":"Click to expand"}</div>
                  </div>
                )}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                {!r.resolved?(
                  <Btn color={C.green} onClick={()=>markResolved(r.id,true)} style={{padding:"5px 10px",fontSize:12}}>✓ Resolve</Btn>
                ):(
                  <Btn color={C.muted} onClick={()=>markResolved(r.id,false)} style={{padding:"5px 10px",fontSize:12}}>Reopen</Btn>
                )}
                <OutBtn danger onClick={()=>deleteReport(r.id)} style={{padding:"5px 10px",fontSize:12}}>Delete</OutBtn>
              </div>
            </div>
          </div>
        ))}
      </div>
      <BackupsPanel/>
      <AuditLogPanel/>
    </div>
  );
}


function BackupsPanel(){
  const [backups,setBackups]=useState<any[]>([]);
  const [exporting,setExporting]=useState(false);
  const [restoringId,setRestoringId]=useState<string|null>(null);
  useEffect(()=>{
    const q=query(collection(db,"backups"),orderBy("createdAt","desc"),limit(20));
    const unsub=onSnapshot(q,snap=>setBackups(snap.docs.map(d=>({id:d.id,...d.data()}))),(err:any)=>console.error(err));
    return()=>unsub();
  },[]);
  const doExport=async()=>{
    setExporting(true);
    try{
      const payload=await fetchAllForBackup();
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;a.download=`bridgeland-cs-club-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }catch(e){console.error(e);window.alert("Export failed — check the console for details.");}
    setExporting(false);
  };
  const doRestore=async(b:any)=>{
    const typed=window.prompt(`This will replace the ENTIRE live site with the backup from ${new Date(b.createdAt).toLocaleString()}. Anything added or changed since then will be LOST. This cannot be undone.\n\nType RESTORE to confirm.`);
    if(typed!=="RESTORE")return;
    setRestoringId(b.id);
    try{
      await restoreBackup(b.id);
      window.alert("Restore complete. The site now matches that backup.");
    }catch(e){console.error(e);window.alert("Restore failed — check the console for details.");}
    setRestoringId(null);
  };
  return(
    <div style={{marginTop:32}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
        <h2 style={{margin:0,fontSize:18}}>Backups</h2>
        <SecBtn onClick={doExport} style={{fontSize:12,padding:"6px 14px"}}>{exporting?"Exporting...":"⬇ Export backup (.json)"}</SecBtn>
      </div>
      <p style={{color:C.muted,fontSize:12,margin:"0 0 14px"}}>
        The site automatically saves a snapshot roughly once a day (whenever an officer is signed in) —
        each item stored as its own small document, so a snapshot can never hit Firestore's size limit either.
        The 14 most recent snapshots are kept. Use "Export" any time for a downloadable copy on your own computer.
      </p>
      {backups.length===0&&<p style={{color:C.muted,fontSize:13}}>No automatic snapshots yet — one will be created the next time an officer signs in.</p>}
      {backups.map((b:any)=>(
        <div key={b.id} style={{...cardS,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div>
            <div style={{fontWeight:600,fontSize:14}}>{new Date(b.createdAt).toLocaleString()}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>
              {b.counts?.users??0} members · {b.counts?.problems??0} problems · {b.counts?.units??0} units · {b.counts?.announcements??0} announcements · {b.counts?.events??0} events
            </div>
          </div>
          <OutBtn danger onClick={()=>doRestore(b)} style={{fontSize:12,padding:"6px 14px"}}>{restoringId===b.id?"Restoring...":"Restore this backup"}</OutBtn>
        </div>
      ))}
    </div>
  );
}

function AuditLogPanel(){
  const [logs,setLogs]=useState<any[]>([]);
  useEffect(()=>{
    const q=query(collection(db,"auditLog"),orderBy("createdAt","desc"),limit(50));
    const unsub=onSnapshot(q,snap=>setLogs(snap.docs.map((d:any)=>({id:d.id,...d.data()}))),(err:any)=>console.error(err));
    return()=>unsub();
  },[]);
  return(
    <div style={{marginTop:32}}>
      <h2 style={{margin:"0 0 16px",fontSize:18}}>Activity Log</h2>
      <p style={{color:C.muted,fontSize:12,margin:"-10px 0 14px"}}>Tracks changes officers make — announcements, events, problems, units, and membership.</p>
      {logs.length===0&&<p style={{color:C.muted,fontSize:13}}>No activity recorded yet.</p>}
      {logs.map((l:any)=>(
        <div key={l.id} style={{padding:"8px 4px",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
          <span style={{fontWeight:600}}>{l.actorName}</span> <span style={{color:C.muted}}>{l.action}</span>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{new Date(l.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

function OfficerImgPick({image,onPick}:any){
  const ref=useRef<any>();
  return(
    <div style={{marginBottom:8}}>
      <button type="button" onClick={()=>ref.current.click()} style={{background:C.bgInput,border:`1px dashed ${C.border}`,color:C.muted,padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:12,width:"100%"}}>{image?"Change photo":"Upload photo"}</button>
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={async(e:any)=>{if(e.target.files[0]){try{onPick(await toB64(e.target.files[0]));}catch(err:any){alert(err.message);}}}}/>
    </div>
  );
}

function AboutPage({data,upd,isOfficer}:any){
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState<any>(null);
  const [leadView,setLeadView]=useState<"Workshop Lead"|"Competition Lead">("Workshop Lead");
  const ref=useRef<any>();
  const startEdit=()=>{setDraft(JSON.parse(JSON.stringify(data.about)));setEditing(true);};
  const save=()=>{upd((d:any)=>({...d,about:draft}));setEditing(false);};
  const addImg=async(file:File)=>{const b=await toB64(file);setDraft((d:any)=>({...d,images:[...(d.images||[]),b]}));};
  const about=editing?draft:data.about;
  const contacts=about.contacts||[];
  const addContact=()=>setDraft((d:any)=>({...d,contacts:[...(d.contacts||[]),{id:uid(),label:"",url:""}]}));
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
        :(<><h3 style={{fontFamily:"'Georgia',serif",fontSize:20,fontWeight:400,marginTop:0,marginBottom:12,color:C.orangeText}}>{about.heading}</h3>{(about.body||'').split("\n").map((line:string,i:number)=>line?<p key={i} style={{margin:"0 0 10px",lineHeight:1.7}}>{line}</p>:<br key={i}/>)}</>)}
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
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:10}}>
    <h3 style={{margin:0,fontSize:14,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Officers</h3>
    {editing&&<SecBtn onClick={()=>setDraft((d:any)=>({...d,officers:[...(d.officers||[]),{name:"",role:"Competition Lead",image:""}]}))} style={{fontSize:12,padding:"5px 12px"}}>+ Add officer</SecBtn>}
  </div>
  {!editing&&(
    <div style={{display:"inline-flex",borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`,marginBottom:14}}>
      {(["Workshop Lead","Competition Lead"] as const).map(r=>(
        <button key={r} onClick={()=>setLeadView(r)} style={{padding:"6px 16px",fontSize:12,fontWeight:leadView===r?700:400,border:"none",cursor:"pointer",background:leadView===r?C.orange:C.bgInput,color:leadView===r?"#fff":C.muted,transition:"all 0.15s"}}>{r}s</button>
      ))}
    </div>
  )}
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}}>
    {(about.officers||[]).filter((o:any)=>editing||o.role==="President"||o.role==="Vice President"||o.role===leadView).map((o:any,i:number)=>{
      const officers=(about.officers||[]);
      const realIndex=officers.indexOf(o);
      return(
      <div key={realIndex} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",textAlign:"center"}}>
        {o.image?<img src={o.image} alt={o.name} style={{width:56,height:56,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.orange}`,margin:"0 auto 8px",display:"block"}}/>
          : <div style={{width:56,height:56,borderRadius:"50%",background:C.orange33,border:`2px solid ${C.orange}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",fontWeight:700,fontSize:20,color:C.orangeText}}>{(o.name||"?")[0]}</div>}
        
        {editing?(<>
          <OfficerImgPick image={o.image} onPick={(v:string)=>{const os=[...draft.officers];os[i]={...os[i],image:v};setDraft((d:any)=>({...d,officers:os}));}}/>
          <input style={{...inp,marginBottom:6,textAlign:"center",fontSize:13}} value={o.name} placeholder="Name" onChange={(e:any)=>{const os=[...draft.officers];os[i]={...os[i],name:e.target.value};setDraft((d:any)=>({...d,officers:os}));}}/>
          
          {/* UPDATED: Now includes President, VP, and the two new Leads */}
          <div style={{display:"flex",flexWrap:"wrap",borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`}}>
            {["President", "Vice President", "Competition Lead", "Workshop Lead"].map(r=>(
              <button 
                key={r} 
                type="button" 
                onClick={()=>{const os=[...draft.officers];os[i]={...os[i],role:r};setDraft((d:any)=>({...d,officers:os}));}} 
                style={{
                  flex:"1 1 50%", // This allows buttons to sit 2x2 if the space is tight
                  padding:"6px 0",
                  fontSize:10, // Slightly smaller font to ensure long titles fit
                  fontWeight:o.role===r?700:400,
                  border:"none",
                  cursor:"pointer",
                  background:o.role===r?C.orange:C.bgInput,
                  color:o.role===r?"#fff":C.muted,
                  transition:"all 0.15s",
                  borderBottom: (r === "President" || r === "Vice President") ? `1px solid ${C.border}` : "none",
                  borderRight: (r === "President" || r === "Competition Lead") ? `1px solid ${C.border}` : "none"
                }}
              >
                {r}
              </button>
            ))}
          </div>
          
          <button onClick={()=>setDraft((d:any)=>({...d,officers:d.officers.filter((_:any,j:number)=>j!==i)}))} style={{marginTop:6,background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:12}}>Remove</button>
        </>):(
          <>
            <div style={{fontWeight:600,fontSize:14}}>{o.name||"—"}</div>
            <div style={{fontSize:12,color:C.orangeText,marginTop:2}}>{o.role}</div>
          </>
        )}
      </div>
      );
    })}
  </div>
</div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0,fontSize:14,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Contact</h3>
          {editing&&<SecBtn onClick={addContact} style={{fontSize:12,padding:"5px 12px"}}>+ Add button</SecBtn>}
        </div>
        {contacts.length===0&&!editing&&<p style={{color:C.muted,fontSize:13}}>No contact links yet.</p>}
        {!editing&&contacts.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:10}}>{contacts.map((c:any,i:number)=><a key={i} href={c.url} target="_blank" rel="noreferrer" style={{display:"inline-block",background:C.orange18,color:C.orangeText,border:`1px solid ${C.orange44}`,padding:"8px 18px",borderRadius:8,fontSize:14,fontWeight:600,textDecoration:"none"}}>{c.label||"Link"}</a>)}</div>}
        {editing&&<div>{contacts.map((c:any,i:number)=><div key={c.id} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}><input style={{...inp,width:140}} value={c.label} placeholder="Button label" onChange={(e:any)=>updateContact(i,"label",e.target.value)}/><input style={inp} value={c.url} placeholder="https://..." onChange={(e:any)=>updateContact(i,"url",e.target.value)}/><button onClick={()=>removeContact(i)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:18,flexShrink:0}}>×</button></div>)}</div>}
      </div>
    </div>
  );
}

function UnitView({unit,data,user,upd,onBack,onFinish,onProblem,headerProps}:any){
  const probs=(unit.problemIds||[]).map((id:any)=>data.problems.find((p:any)=>String(p.id)===String(id))).filter(Boolean);
  const myCompleted=user?((data.completions||{})[user.username]||[]):[];
  const startUnit=()=>{
    if(!probs.length)return;
    const go=(idx:number)=>{if(idx>=probs.length){onFinish?onFinish():onBack();return;}onProblem(probs[idx].id,{unitTitle:unit.title,index:idx,total:probs.length,onNext:()=>go(idx+1)});};
    go(0);
  };
  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <Header {...headerProps}/>
      <div className="app-content-scale app-content-scale-roomy">
        <OutBtn onClick={onBack} style={{marginBottom:16}}>← Back to Problems</OutBtn>
        <div style={{background:"linear-gradient(135deg,var(--hero-start),var(--hero-end))",borderRadius:12,padding:"1.5rem",marginBottom:24,border:`1px solid ${C.border}`}}>
          <h2 style={{margin:"0 0 6px",fontSize:22,fontFamily:"'Georgia',serif",fontWeight:400}}>{unit.title}</h2>
          {unit.level&&<Tag c={unit.level==="advanced"?C.red:C.green}>{unit.level==="advanced"?"Advanced":"Novice"}</Tag>}
          {unit.desc&&<p style={{color:C.muted,margin:"8px 0 16px",fontSize:14}}>{unit.desc}</p>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,color:C.muted}}>{probs.length} problems · {probs.filter((p:any)=>myCompleted.some((id:any)=>String(id)===String(p.id))).length} solved</span>
            <Btn onClick={startUnit}>Start unit →</Btn>
          </div>
        </div>
        {probs.map((p:any,i:number)=>{const done=myCompleted.some((id:any)=>String(id)===String(p.id));return(
          <div key={p.id} style={{...cardS,display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${done?C.green:C.border}`,background:done?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:done?"#fff":C.muted,flexShrink:0}}>{done?"✓":i+1}</div>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><span style={{fontWeight:600}}>{p.title}</span><Tag c={diffColor[p.difficulty]}>{p.difficulty}</Tag>{p.level&&<Tag c={p.level==="advanced"?C.red:C.green}>{p.level==="advanced"?"Advanced":"Novice"}</Tag>}</div>
          </div>
        );})}
      </div>
    </div>
  );
}

function UILPrepPage({username,onExamModeChange,onRunnerStatus}:any){
  const [section,setSection]=useState<"guide"|"tests">("guide");
  const [activeTest,setActiveTest]=useState<any>(null);
  const leaveTest=()=>{onRunnerStatus?.(null);onExamModeChange?.(false);setActiveTest(null);};
  const startTest=(test:any)=>{
    const attemptStartedAt=Date.now();
    setActiveTest({...test,attemptStartedAt});
    onExamModeChange?.(true);
    onRunnerStatus?.({year:test.year,level:test.level,startedAt:attemptStartedAt,minutes:test.minutes,answered:0,questions:test.questions,submitted:false,onBack:leaveTest});
  };
  if(activeTest)return <UILTestRunner key={activeTest.id} test={activeTest} username={username} onBack={leaveTest} onStatusChange={onRunnerStatus}/>;
  return(
    <div className="uil-prep-page">
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginBottom:18}}>
        <div><div style={{fontSize:12,fontWeight:700,color:C.orangeText,textTransform:"uppercase",letterSpacing:1}}>Contest preparation</div><h2 style={{margin:"3px 0 4px"}}>UIL Computer Science Prep</h2><div style={{fontSize:14,color:C.muted}}>Step-by-step Java topics and official UIL Written practice tests.</div></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <SecBtn onClick={()=>setSection("guide")} style={{background:section==="guide"?C.orange18:C.bgInput,color:section==="guide"?C.orangeText:C.muted,borderColor:section==="guide"?C.orange:C.border,fontWeight:700}}>Topic Guide</SecBtn>
          <SecBtn onClick={()=>setSection("tests")} style={{background:section==="tests"?C.orange18:C.bgInput,color:section==="tests"?C.orangeText:C.muted,borderColor:section==="tests"?C.orange:C.border,fontWeight:700}}>Practice Tests</SecBtn>
        </div>
      </div>
      {section==="guide"?(
        <>
          <h3 style={{fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1,margin:"20px 0 10px"}}>Full 2026–27 topic list</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,400px),1fr))",gap:16}}>
            {UIL_TOPIC_UNITS.map((unit:any)=>(
              <div key={unit.title} className="uil-topic-card" style={{...cardS,margin:0}}>
                <h3 style={{margin:"0 0 10px",fontSize:16}}>{unit.title}</h3>
                <ul style={{margin:0,paddingLeft:19,color:C.muted,fontSize:13,lineHeight:1.65}}>{unit.topics.map((topic:string)=><li key={topic} style={{marginBottom:4}}>{topic}</li>)}</ul>
              </div>
            ))}
          </div>
          <p style={{fontSize:12,color:C.muted,lineHeight:1.55,marginTop:14}}>Dynamic programming is listed for the programming portion, not the written test. Topic guide based on the UIL 2026–27 Java topic list.</p>
          <div className="uil-prep-feature" style={{...cardS,borderLeft:`4px solid ${C.orange}`,marginTop:28,marginBottom:18}}>
            <h3 style={{margin:"0 0 5px"}}>The first 15: make these routine</h3>
            <p style={{fontSize:13,color:C.muted,margin:"0 0 14px",lineHeight:1.6}}>UIL identifies these question types as the opening section of the written test. Use the steps and watch-outs to practice a reliable solving process; official test questions remain unchanged.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,450px),1fr))",gap:16}}>
              {FIRST_15_TIPS.map((tip:any)=>(
                <details key={tip.title} className="uil-tip-card" style={{border:`1px solid ${C.border}`,borderRadius:10,background:C.bgCard,padding:"11px 13px"}}>
                  <summary style={{fontWeight:700,cursor:"pointer",lineHeight:1.45}}>{tip.title}</summary>
                  <ol style={{fontSize:13,color:C.text,paddingLeft:20,lineHeight:1.55,margin:"10px 0"}}>{tip.steps.map((step:string,i:number)=><li key={i} style={{marginBottom:5}}>{step}</li>)}</ol>
                  <div style={{fontSize:12,color:C.orangeText,background:C.orange18,borderRadius:7,padding:"7px 9px"}}><strong>Watch for:</strong> {tip.watch}</div>
                </details>
              ))}
            </div>
          </div>
        </>
      ):(
        <>
          <div className="uil-test-intro" style={{...cardS,marginBottom:16,background:C.blue18,border:`1px solid ${C.blue33}`}}>
            <strong>Official UIL Computer Science Written tests · 2022–2026</strong>
            <div style={{fontSize:13,color:C.muted,marginTop:4}}>Choose a round to open the original test. Scroll through the pages and select answers directly on the paper.</div>
          </div>
          {[2026,2025,2024,2023,2022].map(year=>(
            <section key={year} className="uil-test-year" style={{marginBottom:20}}>
              <h3 style={{fontSize:13,color:C.muted,textTransform:"uppercase",letterSpacing:1,margin:"0 0 10px"}}>{year} tests</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,280px),1fr))",gap:14}}>
                {UIL_TESTS.filter((test:any)=>test.year===year).map((test:any)=>(
                  <div key={test.id} className="uil-test-card" style={{...cardS,margin:0,padding:"14px 16px"}}>
                    <div style={{fontWeight:700,marginBottom:4}}>{test.level}</div>
                    <div style={{fontSize:12,color:C.muted,marginBottom:12}}>40 questions · 45 minutes</div>
                    <Btn onClick={()=>startTest(test)}>Take test →</Btn>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <div className="uil-test-source" style={{fontSize:12,color:C.muted}}>Source: <a href="https://www.uiltexas.org/academics/page/high-school-academic-study-materials" target="_blank" rel="noreferrer">UIL High School Academic Study Materials</a>. Test packets remain hosted by UIL.</div>
        </>
      )}
    </div>
  );
}

function UILPaperPage({page,pageNumber,paper,test,answers,result,submitted,onSelect}:any){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const pageRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    const canvas=canvasRef.current,container=canvas?.parentElement;
    if(!canvas||!container)return;
    let renderTask:any=null,disposed=false,visible=false,rendering=false,pending=false;
    const render=async()=>{
      pending=true;
      if(rendering){renderTask?.cancel();return;}
      rendering=true;
      while(pending&&visible&&!disposed){
        pending=false;
        const base=page.getViewport({scale:1});
        const pixelRatio=Math.min(window.devicePixelRatio||1,2);
        const viewport=page.getViewport({scale:Math.max(1,container.clientWidth)*pixelRatio/base.width});
        const context=canvas.getContext("2d");if(!context)break;
        canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
        const task=page.render({canvasContext:context,viewport});renderTask=task;
        try{await task.promise;}catch(error:any){if(error?.name!=="RenderingCancelledException")console.error("UIL packet page render failed",error);}
        if(renderTask===task)renderTask=null;
      }
      rendering=false;
    };
    const clear=()=>{
      visible=false;pending=false;renderTask?.cancel();
      if(canvas.width||canvas.height){canvas.width=0;canvas.height=0;}
    };
    const intersection=typeof IntersectionObserver!=="undefined"
      ?new IntersectionObserver(entries=>{
        if(entries.some(entry=>entry.isIntersecting)){visible=true;void render();}
        else clear();
      },{rootMargin:"1000px 0px"})
      :null;
    const resize=typeof ResizeObserver!=="undefined"
      ?new ResizeObserver(()=>{if(visible)void render();})
      :null;
    if(intersection)intersection.observe(container);else{visible=true;void render();}
    resize?.observe(container);
    return()=>{disposed=true;intersection?.disconnect();resize?.disconnect();renderTask?.cancel();};
  },[page]);
  const choices=Object.entries(paper.choices||{}).flatMap(([question,items]:any)=>(items||[]).filter((choice:any)=>choice.page===pageNumber).map((choice:any)=>({question:Number(question),...choice}))).filter((choice:any)=>!test.writtenQuestions?.includes(choice.question));
  const selectNearest=(event:any,choice:any)=>{
    if(event.detail===0){onSelect(choice.question,choice.letter);return;}
    const bounds=pageRef.current?.getBoundingClientRect();
    if(!bounds||!bounds.width||!bounds.height){onSelect(choice.question,choice.letter);return;}
    const x=(event.clientX-bounds.left)/bounds.width*paper.width;
    const y=(event.clientY-bounds.top)/bounds.height*paper.height;
    const nearest=choices.reduce((best:any,item:any)=>{
      const dx=item.x+item.w/2-x,dy=item.y+item.h/2-y;
      const bestDx=best.x+best.w/2-x,bestDy=best.y+best.h/2-y;
      return dx*dx+dy*dy<bestDx*bestDx+bestDy*bestDy?item:best;
    },choice);
    onSelect(nearest.question,nearest.letter);
  };
  return <div ref={pageRef} className="uil-paper-page" style={{aspectRatio:`${paper.width}/${paper.height}`}} aria-label={`Test page ${pageNumber+1}`}>
    <canvas ref={canvasRef} className="uil-paper-canvas"/>
    {choices.map((choice:any)=>{
      const detail=result?.details?.[choice.question-1],selected=answers?.[choice.question]===choice.letter;
      const state=submitted&&selected?(detail?.correct?" correct":" incorrect"):"";
      return <button key={`${choice.question}-${choice.letter}`} type="button" className={`uil-paper-bubble${selected?" selected":""}${state}`} style={{left:`${(choice.x+choice.w/2)/paper.width*100}%`,top:`${(choice.y+choice.h/2)/paper.height*100}%`}} aria-label={`Question ${choice.question}, choice ${choice.letter}${selected?", selected":""}`} aria-pressed={selected} disabled={submitted} onClick={(event:any)=>selectNearest(event,choice)}><span>{choice.letter}</span></button>;
    })}
  </div>;
}

function formatUILDuration(milliseconds:number){
  const seconds=Math.max(0,Math.floor(milliseconds/1000));
  const minutes=Math.floor(seconds/60),remainder=seconds%60;
  return `${minutes}m ${String(remainder).padStart(2,"0")}s`;
}

function UILTestRunner({test,username,onBack,onStatusChange}:any){
  const [benchmarkLevel,setBenchmarkLevel]=useState<"district"|"regional"|"state">("district");
  const storageKey=`bridgeland-cs-club:uil-attempt:${username}:${test.id}`;
  const makeAttempt=()=>({startedAt:Date.now(),answers:{} as Record<string,string>,written:{} as Record<string,string>,pageTimeMs:{} as Record<string,number>,pageTimingAvailable:true,pageTimingComplete:true,submittedAt:null as number|null});
  const [attempt,setAttempt]=useState<any>(()=>{
    try{const saved=localStorage.getItem(storageKey);if(saved)return JSON.parse(saved);}catch{/* Start a fresh attempt if saved progress cannot be read. */}
    return {...makeAttempt(),startedAt:test.attemptStartedAt||Date.now()};
  });
  const attemptRef=useRef(attempt);
  attemptRef.current=attempt;
  const saveAttempt=(next:any)=>{
    attemptRef.current=next;setAttempt(next);
    try{localStorage.setItem(storageKey,JSON.stringify(next));}catch{/* Keep the current attempt available in memory. */}
  };
  const submitRef=useRef<any>(null),resetRef=useRef<any>(null),backRef=useRef<any>(onBack);
  const pageVisitRef=useRef({index:-1,startedAt:Date.now()});
  const submittedRef=useRef(false);
  submittedRef.current=!!attempt.submittedAt;
  backRef.current=onBack;
  const [now,setNow]=useState(Date.now()),[pdfPages,setPdfPages]=useState<any[]>([]),[pdfError,setPdfError]=useState("");
  const paper=(UIL_PAPER_MAP as any)[test.id];
  useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(attempt));}catch{/* Keep the current attempt available in memory. */}},[storageKey,attempt]);
  useEffect(()=>{
    if(attempt.submittedAt)return;
    const timer=window.setInterval(()=>setNow(Date.now()),1000);
    return()=>window.clearInterval(timer);
  },[attempt.submittedAt]);
  useEffect(()=>{
    let active=true,task:any=null;
    import("pdfjs-dist").then(async(pdfjsLib:any)=>{
      if(!active)return;
      pdfjsLib.GlobalWorkerOptions.workerSrc=pdfWorkerUrl;
      task=pdfjsLib.getDocument({url:`/uil-packets/${test.id}.pdf`});
      const pdf=await task.promise;
      const pages=await Promise.all(Array.from({length:pdf.numPages},(_,i)=>pdf.getPage(i+1)));
      if(active)setPdfPages(pages);
    }).catch((error:any)=>{if(active)setPdfError(error?.message||"The test packet could not be opened.");});
    return()=>{active=false;task?.destroy?.();};
  },[test.id]);
  const remaining=Math.max(0,test.minutes*60-Math.floor((now-attempt.startedAt)/1000));
  const trackPage=(index:number)=>{
    if(submittedRef.current)return;
    const now=Date.now(),visit=pageVisitRef.current;
    if(visit.index===index)return;
    pageVisitRef.current={index,startedAt:now};
    if(visit.index>=0){
      const elapsed=now-visit.startedAt;
      const current=attemptRef.current;
      saveAttempt({...current,pageTimeMs:{...(current.pageTimeMs||{}),[visit.index]:(current.pageTimeMs?.[visit.index]||0)+elapsed}});
    }
  };
  const finishAttempt=()=>{
    if(submittedRef.current)return;
    const submittedAt=Date.now(),visit=pageVisitRef.current;
    submittedRef.current=true;pageVisitRef.current={index:-1,startedAt:submittedAt};
    const current=attemptRef.current,pageTimeMs={...(current.pageTimeMs||{})};
    if(visit.index>=0)pageTimeMs[visit.index]=(pageTimeMs[visit.index]||0)+Math.max(0,submittedAt-visit.startedAt);
    saveAttempt({...current,pageTimeMs,submittedAt});
  };
  useEffect(()=>{
    if(!pdfPages.length||attempt.submittedAt)return;
    if(typeof IntersectionObserver==="undefined"){
      const current=attemptRef.current;
      if(current.pageTimingAvailable!==false||current.pageTimingComplete!==false)saveAttempt({...current,pageTimingAvailable:false,pageTimingComplete:false});
      return;
    }
    const current=attemptRef.current;
    if(current.pageTimingAvailable!==true||current.pageTimingComplete===undefined)saveAttempt({...current,pageTimingAvailable:true,pageTimingComplete:current.pageTimingComplete??false});
    const nodes=Array.from(document.querySelectorAll<HTMLElement>(".uil-paper-page-group"));
    const indexByNode=new Map<Element,number>();nodes.forEach((node,index)=>indexByNode.set(node,index));
    const ratios=new Map<number,number>();
    let bestIndex=-1;
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{const index=indexByNode.get(entry.target);if(index!==undefined)ratios.set(index,entry.isIntersecting?entry.intersectionRatio:0);});
      let bestRatio=0;bestIndex=-1;
      ratios.forEach((ratio,index)=>{if(ratio>bestRatio){bestRatio=ratio;bestIndex=index;}});
      trackPage(bestIndex);
    },{threshold:[0,.1,.25,.4,.6,.8,1]});
    const onVisibilityChange=()=>trackPage(document.hidden?-1:bestIndex);
    nodes.forEach(node=>observer.observe(node));
    document.addEventListener("visibilitychange",onVisibilityChange);
    return()=>{observer.disconnect();document.removeEventListener("visibilitychange",onVisibilityChange);trackPage(-1);};
  },[pdfPages.length,attempt.submittedAt]);
  useEffect(()=>{if(remaining===0&&!attempt.submittedAt)finishAttempt();},[remaining,attempt.submittedAt]);
  const isWritten=(n:number)=>test.writtenQuestions?.includes(n);
  const isAnswered=(n:number)=>isWritten(n)?!!String(attempt.written?.[n]||"").trim():!!attempt.answers?.[n];
  const answered=Array.from({length:test.questions},(_,i)=>i+1).filter(isAnswered).length;
  const updateAnswer=(n:number,value:string)=>saveAttempt({...attemptRef.current,answers:{...(attemptRef.current.answers||{}),[n]:value}});
  const updateWritten=(n:number,value:string)=>saveAttempt({...attemptRef.current,written:{...(attemptRef.current.written||{}),[n]:value}});
  const normalizeScoreResponse=(value:any)=>{
    let normalized=String(value??"").trim().toUpperCase().replace(/^(?:O|BIG\s*O)\((.*)\)$/,"$1").replace(/[\s,;]/g,"");
    while(normalized.startsWith("(")&&normalized.endsWith(")")){
      let depth=0,wrapsWholeValue=true;
      for(let i=0;i<normalized.length;i++){if(normalized[i]==="(")depth++;if(normalized[i]===")")depth--;if(depth===0&&i<normalized.length-1){wrapsWholeValue=false;break;}}
      if(!wrapsWholeValue)break;normalized=normalized.slice(1,-1);
    }
    return normalized;
  };
  const gradeAttempt=()=>{
    let correct=0,incorrect=0,unanswered=0;const details:Array<any> = [];
    for(let n=1;n<=test.questions;n++){
      const response=isWritten(n)?attempt.written?.[n]:attempt.answers?.[n],expected=String(test.answerKey?.[n-1]||""),hasAnswer=!!String(response??"").trim();
      const matches=hasAnswer&&expected.split("||").some((answer:string)=>normalizeScoreResponse(response)===normalizeScoreResponse(answer));
      if(!hasAnswer)unanswered++;else if(matches)correct++;else incorrect++;
      details.push({question:n,correct:!!matches,answered:hasAnswer,response:String(response??""),expected});
    }
    return{correct,incorrect,unanswered,points:correct*test.pointsCorrect-incorrect*test.penaltyIncorrect,details};
  };
  const result=attempt.submittedAt&&test.answerKey?.length===test.questions?gradeAttempt():null;
  const submit=()=>{if(answered<test.questions&&!window.confirm(`You have answered ${answered} of ${test.questions} questions. Submit anyway?`))return;finishAttempt();};
  const reset=()=>{if(window.confirm("Start a new attempt? This replaces the saved answers for this test on this browser.")){submittedRef.current=false;pageVisitRef.current={index:-1,startedAt:Date.now()};saveAttempt(makeAttempt());}};
  submitRef.current=submit;resetRef.current=reset;
  useEffect(()=>{
    onStatusChange?.({year:test.year,level:test.level,startedAt:attempt.startedAt,minutes:test.minutes,answered,questions:test.questions,submitted:!!attempt.submittedAt,onBack:()=>backRef.current?.(),submit:()=>submitRef.current?.(),reset:()=>resetRef.current?.()});
  },[onStatusChange,test.year,test.level,test.minutes,test.questions,attempt.startedAt,attempt.submittedAt,answered]);
  useEffect(()=>()=>onStatusChange?.(null),[onStatusChange]);
  if(attempt.submittedAt&&result){
    const missed=result.details.filter((detail:any)=>!detail.correct);
    const right=result.details.filter((detail:any)=>detail.correct);
    const missedTipTopics=FIRST_15_TIPS.map((tip:any,index:number)=>({title:tip.title.replace(/^\d+\.\s*/,""),question:index+1})).filter((topic:any)=>missed.some((detail:any)=>detail.question===topic.question));
    const missedBeyondTips=missed.filter((detail:any)=>detail.question>FIRST_15_TIPS.length);
    const legacyTiming=!Object.prototype.hasOwnProperty.call(attempt,"pageTimingAvailable");
    const pageTimes=attempt.pageTimingAvailable===false?[]:Array.from({length:pdfPages.length},(_,index)=>({page:index+1,milliseconds:Object.prototype.hasOwnProperty.call(attempt.pageTimeMs||{},index)?attempt.pageTimeMs[index]:null,unvisited:attempt.pageTimingComplete&& !Object.prototype.hasOwnProperty.call(attempt.pageTimeMs||{},index)}));
    const totalTime=attempt.submittedAt-attempt.startedAt;
    const attempted=result.correct+result.incorrect;
    const accuracy=attempted?Math.round(result.correct/attempted*100):0;
    const accuracyLabel=attempted?`${accuracy}% accuracy on answered questions`:"No questions answered";
    return <main className="uil-submitted-page" aria-labelledby="uil-submitted-title">
      <section className="uil-result-hero">
        <div className="uil-result-eyebrow">Test submitted</div>
        <h1 id="uil-submitted-title">{test.year} · {test.level}</h1>
        <div className="uil-result-total">{result.points}<span> points</span></div>
        <p>{result.correct} of {test.questions} correct · {accuracyLabel} · {formatUILDuration(totalTime)} total time</p>
      </section>
      <section className="uil-result-stats" aria-label="Test summary">
        <div><span>Correct</span><strong>{result.correct}</strong></div>
        <div><span>Incorrect</span><strong>{result.incorrect}</strong></div>
        <div><span>Unanswered</span><strong>{result.unanswered}</strong></div>
        <div><span>Score</span><strong>{result.points} / {test.questions*test.pointsCorrect}</strong></div>
      </section>
      <section className="uil-result-card">
        <h2>Time spent on each page</h2>
        <div className="uil-page-time-grid">
          {pageTimes.map(item=><div key={item.page}><span>Page {item.page}</span><strong>{item.milliseconds===null?(item.unvisited?"Not visited":"Not tracked"):formatUILDuration(item.milliseconds)}</strong></div>)}
          {!pageTimes.length&&<p>{legacyTiming?"Page timing was not recorded for this saved attempt.":"Page timing is unavailable for this attempt."}</p>}
        </div>
      </section>
      <section className="uil-result-card">
        <h2>What to work on</h2>
        {missed.length?<><p>Review these questions in your next study session, then revisit the related topics in the Topic Guide.</p>
          {missedTipTopics.length>0&&<><h3 className="uil-review-subheading">Main topics from the first 15</h3><div className="uil-review-topic-list">{missedTipTopics.map((topic:any)=><div className="uil-review-topic" key={topic.question}><strong>{topic.title}</strong><span>Question {topic.question}</span></div>)}</div></>}
          {missedBeyondTips.length>0&&<><h3 className="uil-review-subheading">Main UIL topic areas for the other missed questions</h3><p>Use the question breakdown below to match these questions to the relevant area in the Topic Guide.</p><div className="uil-review-topic-list">{UIL_TOPIC_UNITS.map((unit:any)=><div className="uil-review-topic broad" key={unit.title}><strong>{unit.title}</strong></div>)}</div></>}
          <h3 className="uil-review-subheading">Questions to revisit</h3><div className="uil-review-question-list">{missed.map((detail:any)=><span key={detail.question}>Question {detail.question}</span>)}</div></>:<p>You answered every question correctly. Keep practicing to stay sharp.</p>}
      </section>
      <section className="uil-result-card">
        <h2>Question breakdown</h2>
        <p className="uil-right-question-list"><strong>Questions correct:</strong> {right.length?right.map((detail:any)=>detail.question).join(", "):"None"}</p>
        <div className="uil-question-results">
          {result.details.map((detail:any)=><article key={detail.question} className={`uil-question-result${detail.correct?" correct":detail.answered?" incorrect":" unanswered"}`}>
            <strong>Question {detail.question} · {detail.correct?"Correct":detail.answered?"Incorrect":"Unanswered"}</strong>
            {detail.question<=FIRST_15_TIPS.length&&<span><b>Main topic:</b> {FIRST_15_TIPS[detail.question-1].title.replace(/^\d+\.\s*/,"")}</span>}
            <span>Your answer: {detail.response||"—"}</span>
            <span>Correct answer: {detail.expected?detail.expected.split("||").join(" or "):"Unavailable"}</span>
          </article>)}
        </div>
      </section>
      <details className="uil-result-card uil-benchmark-card">
        <summary>Compare with past UIL leaderboards <span>2025 · Conference 6A</span></summary>
        <p>See how this practice score compares with the highest individual score reported for each round in 2025. This is a historical reference, not a predicted placement.</p>
        <div className="uil-benchmark-tabs" role="group" aria-label="Historical UIL round">
          {(["district","regional","state"] as const).map(level=><button key={level} type="button" aria-pressed={benchmarkLevel===level} className={benchmarkLevel===level?"active":""} onClick={()=>setBenchmarkLevel(level)}>{level[0].toUpperCase()+level.slice(1)}</button>)}
        </div>
        {(()=>{
          const benchmarks={
            district:{score:226,school:"Conroe Grand Oaks",url:"https://files.virtualchallengemeets.com/certs/vcm-results-2023-24/7zjywRPw/2025_District_Results.html"},
            regional:{score:218,school:"Katy Seven Lakes",url:"https://virtualchallengemeets.com/data/uploads/2025_COMMISH_COMPILATIONS_-_REGION/2025_COMMISH_COMPILATIONS_-_REGION_-_ALL_EVENTS_-_UPDATED_ON_5_1_2025.pdf"},
            state:{score:166,school:"Round Rock Westwood",url:"https://virtualchallengemeets.com/data/uploads/2025_COMMISH_COMPILATIONS_-_STATE/2025_COMMISH_COMPILATIONS_-_STATE_-_ALL_EVENTS.pdf"}
          };
          const benchmark=benchmarks[benchmarkLevel],difference=result.points-benchmark.score;
          return <div className="uil-benchmark-comparison">
            <div className="uil-benchmark-scores"><div><span>Your practice score</span><strong>{result.points}</strong></div><div><span>2025 {benchmarkLevel} high</span><strong>{benchmark.score}</strong></div></div>
            <p>{difference===0?"You matched the highest score in this historical results list.":difference>0?`Your score is ${difference} points above the highest score in this historical results list.`:`Your score is ${Math.abs(difference)} points below the highest score in this historical results list.`} The listed high was from {benchmark.school}.</p>
            <a href={benchmark.url} target="_blank" rel="noreferrer">View 2025 {benchmarkLevel} results ↗</a>
          </div>;
        })()}
        <small className="uil-benchmark-note">Historical score lists are published by Virtual Challenge Meets. The UIL links to official meet results through SpeechWire; scoring can vary by year and contest round.</small>
      </details>
      <button type="button" className="uil-results-back" onClick={onBack}>Back to UIL Prep</button>
    </main>;
  }
  return <div className="uil-test-runner">
    {pdfError?<div role="alert" className="uil-paper-error">Unable to open the student test packet. {pdfError}</div>:!pdfPages.length?<div className="uil-paper-loading">Loading the test…</div>:<div className="uil-paper-scroll" aria-label={`${test.year} ${test.level} UIL test paper`}>
      {pdfPages.map((page:any,index:number)=>{
        const written=test.writtenQuestions?.filter((n:number)=>paper.written?.[n]?.page===index)||[];
        return <div key={index} className="uil-paper-page-group"><UILPaperPage page={page} pageNumber={index} paper={paper} test={test} answers={attempt.answers} result={result} submitted={!!attempt.submittedAt} onSelect={updateAnswer}/>{written.length>0&&<div className="uil-written-paper-fragment" aria-label={`Written responses for test page ${index+1}`}>{written.map((n:number)=><label key={n} className="uil-written-response"><strong>Question {n} · written response</strong><textarea aria-label={`Question ${n} written response`} value={attempt.written[n]||""} disabled={!!attempt.submittedAt} onChange={(e:any)=>updateWritten(n,e.target.value)} placeholder="Type your response" rows={2}/></label>)}</div>}</div>;
      })}
      {result&&<div className="uil-score-summary" role="status"><strong>Score: {result.points} points</strong><span>{result.correct} correct</span><span>{result.incorrect} incorrect</span><span>{result.unanswered} unanswered</span></div>}
    </div>}
  </div>;
}

function CodingUnitView({unit,data,user,onBack,onQuestion,headerProps}:any){
  const qs=(unit.codingQuestionIds||[]).map((id:any)=>(data.codingQuestions||[]).find((q:any)=>String(q.id)===String(id))).filter(Boolean);
  const mySubs=user?((data.codingSubmissions||{})[user.username]||{}):{};
  const solved=qs.filter((q:any)=>mySubs[q.id]?.score===100).length;
  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <Header {...headerProps}/>
      <div className="app-content-scale app-content-scale-roomy">
        <OutBtn onClick={onBack} style={{marginBottom:16}}>← Back to Coding Questions</OutBtn>
        <div style={{background:"linear-gradient(135deg,var(--hero-start),var(--hero-end))",borderRadius:12,padding:"1.5rem",marginBottom:24,border:`1px solid ${C.border}`}}>
          <h2 style={{margin:"0 0 6px",fontSize:22,fontFamily:"'Georgia',serif",fontWeight:400}}>{unit.title}</h2>
          {unit.level&&<Tag c={unit.level==="advanced"?C.red:C.green}>{unit.level==="advanced"?"Advanced":"Novice"}</Tag>}
          {unit.desc&&<p style={{color:C.muted,margin:"8px 0 8px",fontSize:14}}>{unit.desc}</p>}
          <div style={{fontSize:13,color:C.muted}}>{qs.length} question{qs.length!==1?"s":""} · {solved} solved perfectly</div>
        </div>
        {qs.length===0&&<p style={{color:C.muted}}>No questions in this unit.</p>}
        {qs.map((q:any,i:number)=>{
          const pct=mySubs[q.id]?.score??null;
          return(
            <div key={q.id} style={{...cardS,cursor:"pointer",display:"flex",alignItems:"center",gap:14}} onClick={()=>onQuestion(q.id)}>
              <div style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${pct===100?C.green:C.border}`,background:pct===100?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:pct===100?"#fff":C.muted,flexShrink:0}}>{pct===100?"✓":i+1}</div>
              <div style={{flex:1,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontWeight:600}}>{q.title}</span>
                <Tag c={diffColor[q.difficulty]||C.muted}>{q.difficulty}</Tag>
                {q.level&&<Tag c={q.level==="advanced"?C.red:C.green}>{q.level==="advanced"?"Advanced":"Novice"}</Tag>}
                {q.language&&<Tag c={C.purple}>{q.language}</Tag>}
              </div>
              {pct!==null&&<div style={{fontWeight:700,fontSize:14,color:pct===100?C.green:pct>0?C.orangeText:C.red}}>{pct}%</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProblemView({prob,user,data,upd,onBack,unitCtx,onNext,headerProps}:any){
  const [selected,setSelected]=useState<any>(null);
  const [submitted,setSubmitted]=useState(false);
  const [result,setResult]=useState<any>(null);
  const completed=((data.completions||{})[user.username]||[]).some((id:any)=>String(id)===String(prob.id));

  const submit=()=>{
    if(selected===null)return;
    const correct=selected===prob.answer;
    setResult(correct);setSubmitted(true);
    upd((d:any)=>{
      const today=new Date().toISOString().slice(0,10);
      // BUGFIX: an existing-but-empty object (e.g. {} for a member who's never
      // attempted anything, which is what a brand-new or migrated account actually
      // has) is truthy in JS, so a bare `||{total:0,correct:0}` fallback never
      // triggers for it — ua.total ends up undefined, and undefined+1 is NaN,
      // permanently, since NaN+1 is always NaN on every submission after that.
      // Coercing each field individually with Number(x)||0 fixes this going forward
      // AND self-heals any account that's already stuck at NaN, the next time they
      // submit — Number(NaN)||0 correctly resolves back to 0.
      const rawUa=d.attempts[user.username]||{};
      const ua={total:Number(rawUa.total)||0,correct:Number(rawUa.correct)||0};
      const na={total:ua.total+1,correct:ua.correct+(correct?1:0)};
      const rawS=d.streaks[user.username]||{};
      const s={lastDate:rawS.lastDate||null,current:Number(rawS.current)||0,best:Number(rawS.best)||0};
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

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <Header {...headerProps}/>
      <div className="app-content-scale app-content-scale-roomy">
        <OutBtn onClick={onBack} style={{marginBottom:16}}>← Back</OutBtn>
        {unitCtx&&(
          <div style={{background:C.orange18,border:`1px solid ${C.orange33}`,borderRadius:8,padding:"8px 14px",marginBottom:16,fontSize:13,color:C.orangeText}}>
            {unitCtx.unitTitle} · Problem {unitCtx.index+1} of {unitCtx.total}
          </div>
        )}
        <div style={{...cardS,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <span style={{fontWeight:700,fontSize:18}}>{prob.title}</span>
            <Tag c={diffColor[prob.difficulty]}>{prob.difficulty}</Tag>
            {prob.level&&<Tag c={prob.level==="advanced"?C.red:C.green}>{prob.level==="advanced"?"Advanced":"Novice"}</Tag>}
            {completed&&<Tag c={C.green}>✓ Solved</Tag>}
          </div>
          <div style={{fontSize:15,lineHeight:1.7,marginBottom:prob.image?12:20}}>{prob.desc}</div>
          {prob.image&&<img src={prob.image} alt="" style={{width:"100%",maxHeight:280,objectFit:"contain",borderRadius:8,marginBottom:20,border:`1px solid ${C.border}`,background:C.bgInput}}/>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {prob.choices.map((choice:string,i:number)=>{
              const isSelected=selected===i;
              const isCorrect=submitted&&i===prob.answer;
              const isWrong=submitted&&isSelected&&i!==prob.answer;
              return(
                <button key={i} onClick={()=>!submitted&&setSelected(i)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",border:`2px solid ${isCorrect?C.green:isWrong?C.red:isSelected?C.orange:C.border}`,borderRadius:8,background:isCorrect?C.green18:isWrong?C.red18:isSelected?C.orange18:C.bgInput,cursor:submitted?"default":"pointer",textAlign:"left",color:C.text,fontFamily:"'DM Sans','Segoe UI',sans-serif",fontSize:14}}>
                  <div style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${isCorrect?C.green:isWrong?C.red:isSelected?C.orange:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:isCorrect?C.green:isWrong?C.red:isSelected?C.orangeText:C.muted,flexShrink:0,background:isCorrect?C.green22:isWrong?C.red22:isSelected?C.orange22:"transparent"}}>{String.fromCharCode(65+i)}</div>
                  <span>{choice}</span>
                  {isCorrect&&<span style={{marginLeft:"auto",color:C.green,fontSize:16}}>✓</span>}
                  {isWrong&&<span style={{marginLeft:"auto",color:C.red,fontSize:16}}>✗</span>}
                </button>
              );
            })}
          </div>
          {!submitted&&<div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}><Btn onClick={submit} disabled={selected===null}>Submit answer</Btn></div>}
          {submitted&&(
            <div style={{marginTop:16,padding:"12px 16px",borderRadius:8,background:result?C.green18:C.red18,border:`1px solid ${result?C.green44:C.red44}`}}>
              <div style={{fontWeight:700,color:result?C.green:C.red,fontSize:15,marginBottom:4}}>{result?"✓ Correct!":"✗ Incorrect"}</div>
              {!result&&<div style={{fontSize:13,color:C.muted}}>The correct answer was <strong style={{color:C.green}}>{prob.choices[prob.answer]}</strong>.</div>}
              {unitCtx&&onNext&&(
                <div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}>
                  <Btn onClick={onNext}>{unitCtx.index+1<unitCtx.total?"Next problem →":"Finish unit ✓"}</Btn>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeaderboardPage({data,user}:any){
  const [lbTab,setLbTab]=useState("solved");
  const medal=(i:number)=>i===0?C.orange:i===1?C.orange:C.muted;
  const medalBg=(i:number)=>i===0?C.orange44:i===1?C.orange28:C.border;
  const lbUsers=(data.users||[]).filter((u:any)=>u.role==="member"); // officers/developers don't appear on leaderboards
  const solvedRows=[...lbUsers].map((u:any)=>({name:u.name||u.username,username:u.username,value:((data.completions||{})[u.username]||[]).length,label:"solved"})).sort((a:any,b:any)=>b.value-a.value);
  const accuracyRows=[...lbUsers].map((u:any)=>{const a=((data.attempts||{})[u.username])||{total:0,correct:0};return{name:u.name||u.username,username:u.username,value:a.total>0?Math.round((a.correct/a.total)*100):0,sub:`${a.correct||0}/${a.total||0} attempts`,label:"%"};}).sort((a:any,b:any)=>b.value-a.value);
  const codingRows=[...lbUsers].map((u:any)=>{
    const subs=((data.codingSubmissions||{})[u.username])||{};
    const perfect=Object.values(subs).filter((s:any)=>s.score===100).length;
    const total=Object.values(subs).length;
    return{name:u.name||u.username,username:u.username,value:perfect,sub:total>0?`${total} attempted`:"",label:"perfect"};
  }).sort((a:any,b:any)=>b.value-a.value);
  const rows=lbTab==="solved"?solvedRows:lbTab==="accuracy"?accuracyRows:codingRows;
  const tabBtn=(t:string)=>({background:lbTab===t?C.orange28:"transparent",color:lbTab===t?C.orangeText:C.muted,border:`1px solid ${lbTab===t?C.orange:C.border}`,padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:lbTab===t?700:400});
  return(
    <div>
      <h2 style={{marginBottom:16}}>Leaderboard</h2>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        <button style={tabBtn("solved")} onClick={()=>setLbTab("solved")}>MC Solved</button>
        <button style={tabBtn("coding")} onClick={()=>setLbTab("coding")}>Coding Solved</button>
        <button style={tabBtn("accuracy")} onClick={()=>setLbTab("accuracy")}>Accuracy</button>
      </div>
      {rows.map((u:any,i:number)=>(
        <div key={u.username} style={{...cardS,display:"flex",alignItems:"center",gap:14,marginBottom:8}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:medalBg(i),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:medal(i),flexShrink:0}}>{i+1}</div>
          <div style={{flex:1}}><span style={{fontWeight:600}}>{u.name}</span>{u.username===user.username&&<span style={{fontSize:11,color:C.orangeText,marginLeft:8}}>you</span>}{u.sub&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{u.sub}</div>}</div>
          <div style={{fontWeight:700,color:C.orangeText,fontSize:18}}>{u.value}{u.label==="%"?"%":""}</div>
          {u.label!=="%"&&<div style={{fontSize:12,color:C.muted}}>{u.label}</div>}
        </div>
      ))}
    </div>
  );
}

function ModalBox({modal,setModal,data,upd,isDev}:any){
  const isEditUnit=modal&&modal.type==="editUnit";
  const isEditCodingUnit=modal&&modal.type==="editCodingUnit";
  const isEditCodingQ=modal&&modal.type==="editCodingQ";
  const isEditProb=modal&&modal.type==="editProb";
  const editUnit=isEditUnit?modal.unit:null;
  const editCodingUnit=isEditCodingUnit?modal.codingUnit:null;
  const editCQ=isEditCodingQ?modal.cq:null;
  const editProb=isEditProb?modal.prob:null;
  const probModalOpen=modal==="prob"||isEditProb;
  const [selProbs,setSelProbs]=useState(editUnit?[...editUnit.problemIds]:[]);
  const [selCodingQs,setSelCodingQs]=useState(editCodingUnit?[...editCodingUnit.codingQuestionIds]:[]);
  const [f,setF]=useState<any>(editProb?{difficulty:editProb.difficulty,level:editProb.level||"",choices:[...editProb.choices],answer:editProb.answer,image:editProb.image||"",selectedProblemIds:[],selectedCodingQIds:[],title:editProb.title,body:"",date:"",time:"2:40 PM",location:"",desc:editProb.desc,url:""}:{difficulty:"Easy",level:"",choices:["","","",""],answer:0,image:"",selectedProblemIds:[],selectedCodingQIds:[],title:"",body:"",date:"",time:"2:40 PM",location:"",desc:"",url:""});
  const [cqForm,setCqForm]=useState<any>(editCQ?{...editCQ,testCases:[...(editCQ.testCases||[])],starterCodes:editCQ.starterCodes||{},level:editCQ.level||"",image:editCQ.image||""}:{title:"",difficulty:"Easy",language:"Java",level:"",image:"",desc:"",starterCodes:{},testCases:[{input:"",expected:""}]});
  const set=(patch:any)=>setF((prev:any)=>({...prev,...patch}));
  const setChoice=(i:number,v:string)=>setF((p:any)=>{const c=[...p.choices];c[i]=v;return{...p,choices:c};});
  const toggleProb=(id:any)=>setF((p:any)=>({...p,selectedProblemIds:p.selectedProblemIds.includes(id)?p.selectedProblemIds.filter((x:any)=>x!==id):[...p.selectedProblemIds,id]}));
  const toggleCodingQ=(id:any)=>setF((p:any)=>({...p,selectedCodingQIds:p.selectedCodingQIds.includes(id)?p.selectedCodingQIds.filter((x:any)=>x!==id):[...p.selectedCodingQIds,id]}));
  const close=()=>setModal(null);

  if(isEditUnit){
    const toggleSel=(id:any)=>setSelProbs((s:any)=>s.includes(id)?s.filter((x:any)=>x!==id):[...s,id]);
    const saveEdit=()=>{upd((d:any)=>({...d,units:d.units.map((u:any)=>u.id===editUnit.id?{...u,problemIds:selProbs}:u)}));close();};
    return(
      <div style={{position:"fixed",inset:0,background:"var(--overlay)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={close}>
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:480,maxHeight:"88vh",overflowY:"auto"}} onClick={(e:any)=>e.stopPropagation()}>
          <h3 style={{margin:"0 0 4px",fontSize:16}}>Edit unit problems</h3>
          <p style={{color:C.muted,fontSize:13,margin:"0 0 14px"}}>{editUnit.title}</p>
          <div style={{maxHeight:320,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:8,padding:8,marginBottom:14}}>
            {(data.problems||[]).map((p:any)=>{const sel=selProbs.includes(p.id);return(
              <div key={p.id} onClick={()=>toggleSel(p.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:6,cursor:"pointer",background:sel?C.orange18:"transparent",border:`1px solid ${sel?C.orange:"transparent"}`,marginBottom:4}}>
                <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${sel?C.orange:C.border}`,background:sel?C.orange:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{sel&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}</div>
                <span style={{flex:1,fontSize:14}}>{p.title}</span><Tag c={diffColor[p.difficulty]}>{p.difficulty}</Tag>
              </div>
            );})}
          </div>
          <p style={{fontSize:12,color:C.orangeText,margin:"0 0 14px"}}>{selProbs.length} problem{selProbs.length!==1?"s":""} selected</p>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><OutBtn onClick={close}>Cancel</OutBtn><Btn onClick={saveEdit}>Save changes</Btn></div>
        </div>
      </div>
    );
  }

  if(isEditCodingUnit){
    const toggleSel=(id:any)=>setSelCodingQs((s:any)=>s.includes(id)?s.filter((x:any)=>x!==id):[...s,id]);
    const saveEdit=()=>{upd((d:any)=>({...d,codingUnits:d.codingUnits.map((u:any)=>u.id===editCodingUnit.id?{...u,codingQuestionIds:selCodingQs}:u)}));close();};
    return(
      <div style={{position:"fixed",inset:0,background:"var(--overlay)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={close}>
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:480,maxHeight:"88vh",overflowY:"auto"}} onClick={(e:any)=>e.stopPropagation()}>
          <h3 style={{margin:"0 0 4px",fontSize:16}}>Edit unit questions</h3>
          <p style={{color:C.muted,fontSize:13,margin:"0 0 14px"}}>{editCodingUnit.title}</p>
          <div style={{maxHeight:320,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:8,padding:8,marginBottom:14}}>
            {(data.codingQuestions||[]).map((q:any)=>{const sel=selCodingQs.includes(q.id);return(
              <div key={q.id} onClick={()=>toggleSel(q.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:6,cursor:"pointer",background:sel?C.orange18:"transparent",border:`1px solid ${sel?C.orange:"transparent"}`,marginBottom:4}}>
                <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${sel?C.orange:C.border}`,background:sel?C.orange:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{sel&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}</div>
                <span style={{flex:1,fontSize:14}}>{q.title}</span><Tag c={diffColor[q.difficulty]}>{q.difficulty}</Tag>
              </div>
            );})}
          </div>
          <p style={{fontSize:12,color:C.orangeText,margin:"0 0 14px"}}>{selCodingQs.length} question{selCodingQs.length!==1?"s":""} selected</p>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><OutBtn onClick={close}>Cancel</OutBtn><Btn onClick={saveEdit}>Save changes</Btn></div>
        </div>
      </div>
    );
  }

  if(modal==="importCsv"){
    const [csvUrl,setCsvUrl]=useState("");
    const [csvErr,setCsvErr]=useState("");
    const [busy,setBusy]=useState(false);
    const [preview,setPreview]=useState<any[]|null>(null);
    const [skipCount,setSkipCount]=useState(0);
    const ANSWER_MAP:any={A:0,B:1,C:2,D:3,"1":0,"2":1,"3":2,"4":3};
    const load=async()=>{
      setCsvErr("");setBusy(true);setPreview(null);
      try{
        const res=await fetch(csvUrl);
        if(!res.ok)throw new Error(`Could not fetch that URL (status ${res.status}).`);
        const text=await res.text();
        const rows=parseCSV(text);
        if(rows.length<2)throw new Error("No data rows found in that sheet.");
        const [header,...body]=rows;
        const idx=(name:string)=>header.findIndex((h:string)=>h.trim().toLowerCase()===name);
        const cTitle=idx("title"),cDiff=idx("difficulty"),cQ=idx("question"),
          cA=idx("choice a"),cB=idx("choice b"),cC=idx("choice c"),cD=idx("choice d"),cAns=idx("correct answer");
        if(cTitle===-1||cQ===-1||cA===-1||cB===-1||cAns===-1){
          throw new Error("Expected columns: Title, Difficulty, Question, Choice A, Choice B, Choice C, Choice D, Correct Answer.");
        }
        const norm=(s:string)=>s.trim().toLowerCase().replace(/\s+/g," ");
        const existingTitles=new Set((data.problems||[]).map((p:any)=>norm(p.title)));
        const seenInSheet=new Set<string>();
        let skippedExisting=0,skippedDuplicateRow=0;
        const parsed=body.map((r:string[])=>{
          const rawAns=(r[cAns]||"").trim().toUpperCase();
          return{
            id:uid(),
            title:(r[cTitle]||"").trim(),
            difficulty:["Easy","Medium","Hard"].includes((r[cDiff]||"").trim())?(r[cDiff]||"").trim():"Easy",
            desc:(r[cQ]||"").trim(),
            choices:[r[cA]||"",r[cB]||"",r[cC]||"",r[cD]||""].map((c:string)=>c.trim()),
            answer:ANSWER_MAP[rawAns]??0,
            image:"",
          };
        }).filter((p:any)=>p.title&&p.desc).filter((p:any)=>{
          const key=norm(p.title);
          if(existingTitles.has(key)){skippedExisting++;return false;}
          if(seenInSheet.has(key)){skippedDuplicateRow++;return false;}
          seenInSheet.add(key);
          return true;
        });
        if(parsed.length===0&&(skippedExisting||skippedDuplicateRow)){
          throw new Error(`Nothing new to import — all ${skippedExisting+skippedDuplicateRow} row(s) already exist as problems.`);
        }
        if(parsed.length===0)throw new Error("No valid rows found — check that Title and Question are filled in.");
        setSkipCount(skippedExisting+skippedDuplicateRow);
        setPreview(parsed);
      }catch(e:any){
        setCsvErr(e.message||"Import failed. Make sure the sheet is published to the web as CSV and is publicly viewable.");
      }
      setBusy(false);
    };
    const doImport=()=>{
      if(!preview)return;
      upd((d:any)=>({...d,problems:[...(d.problems||[]),...preview]}),{action:`Imported ${preview.length} problem(s) from Google Sheets`});
      close();
    };
    return(
      <div style={{position:"fixed",inset:0,background:"var(--overlay)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={close}>
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:520,maxHeight:"88vh",overflowY:"auto"}} onClick={(e:any)=>e.stopPropagation()}>
          <h3 style={{margin:"0 0 8px",fontSize:16}}>Import from Google Sheets</h3>
          <p style={{color:C.muted,fontSize:13,margin:"0 0 12px",lineHeight:1.5}}>
            In your sheet: <strong>File → Share → Publish to web</strong>, choose the sheet, pick <strong>CSV</strong>, and paste the link below.
            Columns needed: <code>Title, Difficulty, Question, Choice A, Choice B, Choice C, Choice D, Correct Answer</code> (Correct Answer as A/B/C/D or 1-4).
            Questions with a title that already exists are skipped automatically.
          </p>
          <input style={{...inp,marginBottom:10}} value={csvUrl} onChange={(e:any)=>setCsvUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/.../pub?output=csv"/>
          {csvErr&&<div style={{background:C.red18,border:`1px solid ${C.red44}`,borderRadius:6,padding:"8px 12px",fontSize:13,color:C.red,marginBottom:10}}>⚠ {csvErr}</div>}
          {!preview&&<div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><OutBtn onClick={close}>Cancel</OutBtn><Btn onClick={load} disabled={!csvUrl.trim()||busy}>{busy?"Loading...":"Preview import"}</Btn></div>}
          {preview&&<>
            <div style={{maxHeight:220,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:8,padding:8,marginBottom:12}}>
              {preview.map((p:any)=>(
                <div key={p.id} style={{padding:"6px 4px",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
                  <strong>{p.title}</strong> <Tag c={diffColor[p.difficulty]}>{p.difficulty}</Tag>
                </div>
              ))}
            </div>
            <p style={{fontSize:12,color:C.orangeText,margin:"0 0 4px"}}>{preview.length} new problem(s) ready to import.</p>
            {skipCount>0&&<p style={{fontSize:12,color:C.muted,margin:"0 0 12px"}}>Skipped {skipCount} row(s) already in your problem set.</p>}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:skipCount>0?0:8}}><OutBtn onClick={()=>setPreview(null)}>Back</OutBtn><Btn onClick={doImport}>Import {preview.length} problem(s)</Btn></div>
          </>}
        </div>
      </div>
    );
  }

  if(isEditCodingQ||modal==="codingQ"){
    const addTC=()=>setCqForm((f:any)=>({...f,testCases:[...f.testCases,{input:"",expected:""}]}));
    const removeTC=(i:number)=>setCqForm((f:any)=>({...f,testCases:f.testCases.filter((_:any,j:number)=>j!==i)}));
    const setTC=(i:number,field:string,v:string)=>setCqForm((f:any)=>{const tc=[...f.testCases];tc[i]={...tc[i],[field]:v};return{...f,testCases:tc};});
    const [cqErr,setCqErr]=useState("");
    const saveCQ=()=>{
      setCqErr("");
      if(!cqForm.title.trim()){setCqErr("Title is required.");return;}
      if(!cqForm.desc.trim()){setCqErr("Problem description is required.");return;}
      const filledTC=cqForm.testCases.filter((tc:any)=>tc.input.trim()&&tc.expected.trim());
      if(filledTC.length===0){setCqErr("Add at least one complete test case (input and expected output).");return;}
      const cleanedForm={...cqForm,testCases:cqForm.testCases.filter((tc:any)=>tc.input.trim()&&tc.expected.trim())};
      if(isEditCodingQ){upd((d:any)=>({...d,codingQuestions:(d.codingQuestions||[]).map((q:any)=>q.id===editCQ.id?{...cleanedForm,id:editCQ.id}:q)}));}
      else{upd((d:any)=>({...d,codingQuestions:[...(d.codingQuestions||[]),{...cleanedForm,id:uid()}]}));}
      close();
    };
    return(
      <div style={{position:"fixed",inset:0,background:"var(--overlay)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={close}>
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:580,maxHeight:"90vh",overflowY:"auto"}} onClick={(e:any)=>e.stopPropagation()}>
          <h3 style={{margin:"0 0 16px",fontSize:16}}>{isEditCodingQ?"Edit Coding Question":"New Coding Question"}</h3>
          {cqErr&&<div style={{background:C.red18,border:`1px solid ${C.red44}`,borderRadius:6,padding:"8px 12px",fontSize:13,color:C.red,marginBottom:12}}>⚠ {cqErr}</div>}
          <label style={lbl}>Title <span style={{color:C.red}}>*</span></label>
          <input style={{...inp,marginBottom:10}} value={cqForm.title} onChange={(e:any)=>setCqForm((f:any)=>({...f,title:e.target.value}))} placeholder="e.g. Sum Two Numbers"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={lbl}>Difficulty</label><select style={inp} value={cqForm.difficulty} onChange={(e:any)=>setCqForm((f:any)=>({...f,difficulty:e.target.value}))}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
            <div><label style={lbl}>Language hint</label><select style={inp} value={cqForm.language} onChange={(e:any)=>setCqForm((f:any)=>({...f,language:e.target.value}))}>{LANGS.map(l=><option key={l}>{l}</option>)}</select></div>
            <div><label style={lbl}>Level (optional)</label><select style={inp} value={cqForm.level||""} onChange={(e:any)=>setCqForm((f:any)=>({...f,level:e.target.value}))}><option value="">None</option><option value="novice">Novice</option><option value="advanced">Advanced</option></select></div>
          </div>
          <label style={lbl}>Problem description <span style={{color:C.red}}>*</span></label>
          <textarea style={{...inp,height:100,resize:"vertical",marginBottom:10}} value={cqForm.desc} onChange={(e:any)=>setCqForm((f:any)=>({...f,desc:e.target.value}))} placeholder="Describe the problem. Include examples."/>
          <ImgPick label="Add image to problem (optional)" preview={cqForm.image} onPick={(v:string)=>setCqForm((f:any)=>({...f,image:v}))}/>
          <label style={lbl}>Starter code per language</label>
          <div style={{background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:8,padding:10,marginBottom:14}}>
            <p style={{fontSize:11,color:C.muted,margin:"0 0 10px"}}>Provide starter code for each language. Students see the one matching their selected language.</p>
            {LANGS.map((l:string)=>(
              <div key={l} style={{marginBottom:10}}>
                <div style={{fontSize:12,color:C.muted,marginBottom:4,fontWeight:600}}>{l}</div>
                <textarea style={{...inp,height:70,resize:"vertical",fontFamily:"monospace",fontSize:12}}
                  value={(cqForm.starterCodes||{})[l]||""}
                  onChange={(e:any)=>setCqForm((f:any)=>({...f,starterCodes:{...(f.starterCodes||{}),[l]:e.target.value}}))}
                  placeholder={l==="Python"?`def solution():\n    pass`:l==="Java"?`static void solution() {\n    // code\n}`:l==="C++"?`auto solution() {\n    // code\n}`:``}
                />
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <label style={{...lbl,margin:0}}>Test cases</label>
            <button onClick={addTC} style={{background:"transparent",border:`1px dashed ${C.border}`,color:C.muted,padding:"3px 10px",borderRadius:5,cursor:"pointer",fontSize:12}}>+ Add test case</button>
          </div>
          <div style={{background:C.bgInput,borderRadius:8,padding:10,marginBottom:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:6,marginBottom:6}}>
              <span style={{fontSize:11,color:C.muted}}>Input (stdin — multiple lines ok)</span>
              <span style={{fontSize:11,color:C.muted}}>Expected output (stdout — multiple lines ok)</span><span/>
            </div>
            {cqForm.testCases.map((tc:any,i:number)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:6,marginBottom:6}}>
                <textarea style={{...inp,fontSize:12,fontFamily:"monospace",height:60,resize:"vertical"}} value={tc.input} onChange={(e:any)=>setTC(i,"input",e.target.value)} placeholder={"e.g. 2 3\n(or multiple lines)"}/>
                <textarea style={{...inp,fontSize:12,fontFamily:"monospace",height:60,resize:"vertical"}} value={tc.expected} onChange={(e:any)=>setTC(i,"expected",e.target.value)} placeholder={"e.g. 5\n(or multiple lines)"}/>
                <button onClick={()=>removeTC(i)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:18,padding:"0 4px",alignSelf:"start"}}>×</button>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><OutBtn onClick={close}>Cancel</OutBtn><Btn onClick={saveCQ}>{isEditCodingQ?"Save changes":"Create question"}</Btn></div>
        </div>
      </div>
    );
  }

  const [formErr,setFormErr]=useState<string>("");
  const notify=(audience:string,title:string,body:string)=>{
    addDoc(collection(db,"notifications"),{audience,title,body,createdAt:new Date().toISOString(),readBy:[]}).catch((e:any)=>console.error("Notify failed",e));
  };
  const submit=()=>{
    setFormErr("");
    if(modal==="ann"){
      if(!f.title.trim()){setFormErr("Title is required.");return;}
      if(!f.body.trim()){setFormErr("Body text is required.");return;}
      upd((d:any)=>({...d,announcements:[...(d.announcements||[]),{id:uid(),title:f.title.trim(),body:f.body.trim(),date:new Date().toISOString().slice(0,10),image:f.image||""}]}),{action:`Posted announcement "${f.title.trim()}"`});
      notify("all","New announcement",f.title.trim());
    } else if(modal==="evt"){
      if(!f.title.trim()){setFormErr("Title is required.");return;}
      if(!f.date){setFormErr("Date is required.");return;}
      upd((d:any)=>({...d,events:[...(d.events||[]),{id:uid(),title:f.title.trim(),date:f.date,time:f.time||"TBD",location:f.location||"TBD",desc:f.desc||"",image:f.image||""}]}),{action:`Added event "${f.title.trim()}"`});
      notify("all","New event",`${f.title.trim()} — ${f.date}`);
    } else if(probModalOpen){
      if(!f.title.trim()){setFormErr("Problem title is required.");return;}
      if(!f.desc.trim()){setFormErr("Question text is required.");return;}
      const emptyChoice=f.choices.findIndex((c:string)=>!c.trim());
      if(emptyChoice!==-1){setFormErr(`Choice ${String.fromCharCode(65+emptyChoice)} cannot be empty.`);return;}
      const payload={title:f.title.trim(),difficulty:f.difficulty,level:f.level||"",desc:f.desc.trim(),choices:f.choices.map((c:string)=>c.trim()),answer:Number(f.answer),image:f.image||""};
      if(isEditProb){
        upd((d:any)=>({...d,problems:(d.problems||[]).map((p:any)=>p.id===editProb.id?{...p,...payload}:p)}),{action:`Edited problem "${payload.title}"`});
      }else{
        upd((d:any)=>({...d,problems:[...(d.problems||[]),{id:uid(),...payload}]}),{action:`Added problem "${payload.title}"`});
      }
    } else if(modal==="unit"){
      if(!f.title.trim()){setFormErr("Unit title is required.");return;}
      if(!f.selectedProblemIds.length){setFormErr("Select at least one problem.");return;}
      upd((d:any)=>({...d,units:[...(d.units||[]),{id:uid(),title:f.title.trim(),desc:f.desc||"",level:f.level||"",problemIds:f.selectedProblemIds}]}),{action:`Created unit "${f.title.trim()}"`});
      notify("all","New practice unit",f.title.trim());
    } else if(modal==="codingUnit"){
      if(!f.title.trim()){setFormErr("Unit title is required.");return;}
      if(!f.selectedCodingQIds.length){setFormErr("Select at least one coding question.");return;}
      upd((d:any)=>({...d,codingUnits:[...(d.codingUnits||[]),{id:uid(),title:f.title.trim(),desc:f.desc||"",level:f.level||"",codingQuestionIds:f.selectedCodingQIds}]}),{action:`Created coding unit "${f.title.trim()}"`});
      notify("all","New coding unit",f.title.trim());
    }
    close();
  };

  const titles:any={ann:"New Announcement",evt:"New Event",prob:"New Problem",unit:"Create Unit",codingUnit:"Create Coding Unit"};
  const modalKey=typeof modal==="string"?modal:modal?.type;
  const modalTitle=isEditProb?"Edit Problem":(titles[modalKey]||"Add");
  const overlay:any={position:"fixed",inset:0,background:"var(--overlay)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000};
  const box:any={background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",width:"90%",maxWidth:["prob","unit","codingUnit","evt"].includes(modalKey)?520:430,maxHeight:"88vh",overflowY:"auto"};

  return(
    <div style={overlay} onClick={close}>
      <div style={box} onClick={(e:any)=>e.stopPropagation()}>
        <h3 style={{margin:"0 0 16px",fontSize:16}}>{modalTitle}</h3>
        {formErr&&<div style={{background:C.red18,border:`1px solid ${C.red44}`,borderRadius:6,padding:"8px 12px",fontSize:13,color:C.red,marginBottom:12}}>⚠ {formErr}</div>}

        {modal==="ann"&&<>
          <label style={lbl}>Title <span style={{color:C.red}}>*</span></label>
          <input style={{...inp,marginBottom:10,borderColor:(!f.title.trim()&&formErr)?C.red:C.border}} value={f.title} onChange={(e:any)=>set({title:e.target.value})} placeholder="e.g. Competition Results"/>
          <label style={lbl}>Body <span style={{color:C.red}}>*</span></label>
          <textarea style={{...inp,height:80,resize:"vertical",marginBottom:10,borderColor:(!f.body.trim()&&formErr)?C.red:C.border}} value={f.body} onChange={(e:any)=>set({body:e.target.value})} placeholder="Write the announcement here..."/>
          <ImgPick preview={f.image} onPick={(v:string)=>set({image:v})}/>
        </>}

        {modal==="evt"&&<>
          <label style={lbl}>Title <span style={{color:C.red}}>*</span></label>
          <input style={{...inp,marginBottom:12,borderColor:(!f.title.trim()&&formErr)?C.red:C.border}} value={f.title} onChange={(e:any)=>set({title:e.target.value})} placeholder="e.g. Weekly Meeting"/>
          <label style={lbl}>Date <span style={{color:C.red}}>*</span></label>
          <div style={{marginBottom:12,border:(!f.date&&formErr)?`1px solid ${C.red}`:undefined,borderRadius:8}}><DatePicker value={f.date} onChange={(v:string)=>set({date:v})}/></div>
          <label style={lbl}>Time</label><div style={{marginBottom:12}}><TimePicker value={f.time} onChange={(v:string)=>set({time:v})}/></div>
          <label style={lbl}>Location</label>
          <input style={{...inp,marginBottom:10}} value={f.location} onChange={(e:any)=>set({location:e.target.value})} placeholder="e.g. Room 214"/>
          <label style={lbl}>Description</label>
          <input style={{...inp,marginBottom:10}} value={f.desc} onChange={(e:any)=>set({desc:e.target.value})} placeholder="Brief description"/>
          <ImgPick preview={f.image} onPick={(v:string)=>set({image:v})}/>
        </>}

        {probModalOpen&&<>
          <label style={lbl}>Problem title <span style={{color:C.red}}>*</span></label>
          <input style={{...inp,marginBottom:10,borderColor:(!f.title.trim()&&formErr)?C.red:C.border}} value={f.title} onChange={(e:any)=>set({title:e.target.value})} placeholder="e.g. FizzBuzz"/>
          <label style={lbl}>Difficulty</label>
          <select style={{...inp,marginBottom:10}} value={f.difficulty} onChange={(e:any)=>set({difficulty:e.target.value})}><option>Easy</option><option>Medium</option><option>Hard</option></select>
          <label style={lbl}>Level (optional)</label>
          <select style={{...inp,marginBottom:10}} value={f.level||""} onChange={(e:any)=>set({level:e.target.value})}><option value="">None</option><option value="novice">Novice</option><option value="advanced">Advanced</option></select>
          <label style={lbl}>Question <span style={{color:C.red}}>*</span></label>
          <textarea style={{...inp,height:72,resize:"vertical",marginBottom:14,borderColor:(!f.desc.trim()&&formErr)?C.red:C.border}} value={f.desc} onChange={(e:any)=>set({desc:e.target.value})} placeholder="What is the question?"/>
          <ImgPick label="Add image to question (optional)" preview={f.image} onPick={(v:string)=>set({image:v})}/>
          <label style={lbl}>Answer choices — select the correct one <span style={{color:C.red}}>*</span></label>
          {[0,1,2,3].map(i=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <input type="radio" name="ans" checked={Number(f.answer)===i} onChange={()=>set({answer:i})} style={{accentColor:C.orange,flexShrink:0}}/>
            <div style={{width:24,height:24,borderRadius:"50%",background:C.orange22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.orangeText,flexShrink:0}}>{String.fromCharCode(65+i)}</div>
            <input style={{...inp,borderColor:(!f.choices[i].trim()&&formErr)?C.red:C.border}} value={f.choices[i]} placeholder={`Choice ${String.fromCharCode(65+i)}`} onChange={(e:any)=>setChoice(i,e.target.value)}/>
          </div>))}
        </>}

        {modal==="unit"&&<>
          <label style={lbl}>Unit title <span style={{color:C.red}}>*</span></label>
          <input style={{...inp,marginBottom:10,borderColor:(!f.title.trim()&&formErr)?C.red:C.border}} value={f.title} placeholder="e.g. Intro to Data Structures" onChange={(e:any)=>set({title:e.target.value})}/>
          <label style={lbl}>Description (optional)</label>
          <input style={{...inp,marginBottom:10}} value={f.desc} placeholder="Brief description" onChange={(e:any)=>set({desc:e.target.value})}/>
          <label style={lbl}>Level (optional)</label>
          <select style={{...inp,marginBottom:14}} value={f.level||""} onChange={(e:any)=>set({level:e.target.value})}><option value="">None</option><option value="novice">Novice</option><option value="advanced">Advanced</option></select>
          <label style={lbl}>Select problems <span style={{color:C.red}}>*</span></label>
          <div style={{maxHeight:220,overflowY:"auto",border:`1px solid ${!f.selectedProblemIds.length&&formErr?C.red:C.border}`,borderRadius:8,padding:8,marginBottom:8}}>
            {(data.problems||[]).length===0&&<p style={{color:C.muted,fontSize:13,margin:0}}>No problems yet. Create some first.</p>}
            {(data.problems||[]).map((p:any)=>{const sel=f.selectedProblemIds.includes(p.id);return(
              <div key={p.id} onClick={()=>toggleProb(p.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:6,cursor:"pointer",background:sel?C.orange18:"transparent",border:`1px solid ${sel?C.orange:"transparent"}`,marginBottom:4}}>
                <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${sel?C.orange:C.border}`,background:sel?C.orange:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{sel&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}</div>
                <span style={{flex:1,fontSize:14}}>{p.title}</span><Tag c={diffColor[p.difficulty]}>{p.difficulty}</Tag>
              </div>
            );})}
          </div>
          {f.selectedProblemIds.length>0&&<p style={{fontSize:12,color:C.orangeText,margin:"0 0 4px"}}>{f.selectedProblemIds.length} problem{f.selectedProblemIds.length>1?"s":""} selected</p>}
        </>}

        {modal==="codingUnit"&&<>
          <label style={lbl}>Unit title <span style={{color:C.red}}>*</span></label>
          <input style={{...inp,marginBottom:10,borderColor:(!f.title.trim()&&formErr)?C.red:C.border}} value={f.title} placeholder="e.g. Loops & Iteration" onChange={(e:any)=>set({title:e.target.value})}/>
          <label style={lbl}>Description (optional)</label>
          <input style={{...inp,marginBottom:10}} value={f.desc} placeholder="Brief description" onChange={(e:any)=>set({desc:e.target.value})}/>
          <label style={lbl}>Level (optional)</label>
          <select style={{...inp,marginBottom:14}} value={f.level||""} onChange={(e:any)=>set({level:e.target.value})}><option value="">None</option><option value="novice">Novice</option><option value="advanced">Advanced</option></select>
          <label style={lbl}>Select coding questions <span style={{color:C.red}}>*</span></label>
          <div style={{maxHeight:220,overflowY:"auto",border:`1px solid ${!f.selectedCodingQIds.length&&formErr?C.red:C.border}`,borderRadius:8,padding:8,marginBottom:8}}>
            {(data.codingQuestions||[]).length===0&&<p style={{color:C.muted,fontSize:13,margin:0}}>No coding questions yet. Create some first.</p>}
            {(data.codingQuestions||[]).map((q:any)=>{const sel=f.selectedCodingQIds.includes(q.id);return(
              <div key={q.id} onClick={()=>toggleCodingQ(q.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:6,cursor:"pointer",background:sel?C.orange18:"transparent",border:`1px solid ${sel?C.orange:"transparent"}`,marginBottom:4}}>
                <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${sel?C.orange:C.border}`,background:sel?C.orange:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{sel&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}</div>
                <span style={{flex:1,fontSize:14}}>{q.title}</span><Tag c={diffColor[q.difficulty]||C.muted}>{q.difficulty}</Tag>
              </div>
            );})}
          </div>
          {f.selectedCodingQIds.length>0&&<p style={{fontSize:12,color:C.orangeText,margin:"0 0 4px"}}>{f.selectedCodingQIds.length} question{f.selectedCodingQIds.length>1?"s":""} selected</p>}
        </>}

        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
          <OutBtn onClick={close}>Cancel</OutBtn>
          <Btn onClick={submit}>{modal==="unit"?"Create unit":modal==="codingUnit"?"Create unit":isEditProb?"Save changes":"Add"}</Btn>
        </div>
      </div>
    </div>
  );
}
