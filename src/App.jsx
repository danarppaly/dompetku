import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const SUPABASE_URL = "https://rdyksimtpnzjwapdyolw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkeWtzaW10cG56andhcGR5b2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTY4MzgsImV4cCI6MjA5NzY5MjgzOH0.h0iLXptb9sOAK6zAZtW0ZlcywP6393vGkjJML7TccD]";
const PIN_KEY = "dompetku_pin";

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const api = {
  get: (table, query="") => sb(`${table}?${query}`, { method:"GET" }),
  post: (table, body) => sb(table, { method:"POST", body: JSON.stringify(body) }),
  patch: (table, query, body) => sb(`${table}?${query}`, { method:"PATCH", body: JSON.stringify(body), prefer:"return=representation" }),
  delete: (table, query) => sb(`${table}?${query}`, { method:"DELETE", prefer:"return=minimal" }),
  upsert: (table, body) => sb(table, { method:"POST", body: JSON.stringify(body), headers:{ "Prefer":"resolution=merge-duplicates,return=representation" } }),
};

const QUICK_EXPENSES = [
  { id: "kas", label: "Kas + Listrik RT", amount: 1100000, icon: "🏘️", category: "tagihan" },
  { id: "spp", label: "SPP Anak", amount: 700000, icon: "🎒", category: "anak" },
  { id: "internet", label: "Internet", amount: 150000, icon: "📡", category: "tagihan" },
  { id: "rt", label: "Iuran RT", amount: 130000, icon: "🏠", category: "tagihan" },
  { id: "listrik", label: "Listrik", amount: 250000, icon: "⚡", category: "tagihan" },
  { id: "air", label: "Air", amount: 60000, icon: "💧", category: "tagihan" },
  { id: "gas", label: "Gas LPG", amount: 250000, icon: "🔥", category: "rumah" },
  { id: "istri", label: "Uang Istri", amount: 500000, icon: "👩", category: "lainnya" },
];

const FIXED_BILLS = [
  { id: "kas", label: "Cicilan Kas + Listrik RT", amount: 1100000, dueDay: 1, icon: "🏘️" },
  { id: "spp", label: "SPP Anak", amount: 700000, dueDay: 5, icon: "🎒" },
  { id: "internet", label: "Internet", amount: 150000, dueDay: 10, icon: "📡" },
  { id: "rt", label: "Iuran RT", amount: 130000, dueDay: 5, icon: "🏠" },
];

const CATEGORIES = [
  { id: "makan", label: "Makan & Minum", icon: "🍚", color: "#1D9E75" },
  { id: "transport", label: "Transport", icon: "🚗", color: "#185FA5" },
  { id: "rumah", label: "Rumah", icon: "🏠", color: "#BA7517" },
  { id: "anak", label: "Anak", icon: "👧", color: "#8B5CF6" },
  { id: "gayahidup", label: "Gaya Hidup", icon: "🚬", color: "#E24B4A" },
  { id: "tagihan", label: "Tagihan", icon: "📋", color: "#0F6E56" },
  { id: "proyek", label: "Proyek (masuk)", icon: "🏗️", color: "#1D9E75" },
  { id: "utang", label: "Bayar Utang", icon: "💸", color: "#E24B4A" },
  { id: "lainnya", label: "Lainnya", icon: "📦", color: "#888" },
];

const PROJECT_SOURCES = [
  { id: "skala1000", label: "Skala1000", icon: "🏛️" },
  { id: "epicnesia", label: "Epicnesia Adit", icon: "🤝" },
  { id: "bina", label: "Bina Project Gesang", icon: "🏗️" },
  { id: "lainnya", label: "Lainnya", icon: "📦" },
];

const INITIAL_DEBTS = [
  { id: 1, label: "Kas (satpam)", total: 5000000, paid: 0, priority: 1, note: "Cicil Rp 1 jt/bulan", urgent: true },
  { id: 2, label: "Papa", total: 650000, paid: 0, priority: 2, note: "Lunasi saat ada surplus", urgent: true },
  { id: 3, label: "Adek + Ibu + Anak ke-2", total: 1250000, paid: 0, priority: 3, note: "Bertahap saat surplus", urgent: false },
  { id: 4, label: "Daftar ujian (ke istri)", total: 1500000, paid: 0, priority: 4, note: "Komunikasikan tempo", urgent: false },
  { id: 5, label: "Kakak kandung", total: 10000000, paid: 0, priority: 5, note: "Minta tempo — tunggu cash flow stabil", urgent: false },
];

const EMERGENCY_TARGET = 5000000;
const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
const G = "#1D9E75";

function fmt(n) { return "Rp " + Math.round(n).toLocaleString("id-ID"); }
function fmtShort(n) {
  if (n >= 1000000) return "Rp " + (n/1000000).toFixed(1).replace(".0","") + " jt";
  if (n >= 1000) return "Rp " + (n/1000).toFixed(0) + " rb";
  return "Rp " + n;
}
function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function getMonthLabel(ym) {
  const [y,m] = ym.split("-");
  return MONTHS_ID[parseInt(m)-1] + " '" + y.slice(2);
}
function getDaysUntil(dueDay) {
  const now = new Date();
  const due = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (due < now) due.setMonth(due.getMonth()+1);
  return Math.ceil((due-now)/(1000*60*60*24));
}
function fmtInput(val) {
  if (!val) return "";
  const num = val.toString().replace(/\D/g,"");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g,".");
}
function parseInput(val) {
  return parseInt(val.toString().replace(/\./g,"").replace(/\D/g,"")) || 0;
}

function CurrencyInput({ value, onChange, placeholder, style={} }) {
  const [display, setDisplay] = useState(value ? fmtInput(String(value)) : "");
  useEffect(() => { if (!value) setDisplay(""); }, [value]);
  function handleChange(e) {
    const raw = e.target.value.replace(/\./g,"").replace(/\D/g,"");
    setDisplay(fmtInput(raw));
    onChange(raw);
  }
  return <input type="text" inputMode="numeric" value={display} onChange={handleChange} placeholder={placeholder} style={style}/>;
}

function Card({children, style={}}) {
  return <div style={{background:"white",borderRadius:12,padding:"1rem 1.25rem",marginBottom:12,boxShadow:"0 1px 3px rgba(0,0,0,0.06)",...style}}>{children}</div>;
}

function Spinner() {
  return <div style={{textAlign:"center",padding:"3rem",color:"#888",fontSize:14}}>Memuat data...</div>;
}

export default function App() {
  const [pinState, setPinState] = useState("check");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [newPin, setNewPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [tab, setTab] = useState("dashboard");
  const [entries, setEntries] = useState([]);
  const [debts, setDebts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [emergency, setEmergency] = useState(1200000);
  const [incomeTarget, setIncomeTarget] = useState(5000000);
  const [billsPaid, setBillsPaid] = useState({});

  const [form, setForm] = useState({ type:"out", amount:"", note:"", category:"makan" });
  const [quickEdit, setQuickEdit] = useState(null);
  const [debtForm, setDebtForm] = useState({ id:null, amount:"" });
  const [emergencyInput, setEmergencyInput] = useState("");
  const [projForm, setProjForm] = useState({ show:false, id:null, name:"", total:"", dp:"", dpPrev:0, status:"ongoing", note:"", source:"lainnya" });
  const [targetInput, setTargetInput] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  const [currentMonth] = useState(getCurrentMonth());

  useEffect(() => {
    const pin = localStorage.getItem(PIN_KEY);
    setPinState(!pin ? "setup" : "locked");
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ent, proj, dbt, sett] = await Promise.all([
        api.get("entries", "order=id.desc"),
        api.get("projects", "order=id.desc"),
        api.get("debts", "order=priority.asc"),
        api.get("settings"),
      ]);
      setEntries(ent || []);
      setProjects(proj || []);
      if (dbt && dbt.length > 0) setDebts(dbt);
      else {
        await Promise.all(INITIAL_DEBTS.map(d => api.upsert("debts", d)));
        setDebts(INITIAL_DEBTS);
      }
      if (sett) {
        sett.forEach(s => {
          if (s.key === "emergency") setEmergency(parseInt(s.value)||1200000);
          if (s.key === "incomeTarget") setIncomeTarget(parseInt(s.value)||5000000);
          if (s.key === "billsPaid") setBillsPaid(JSON.parse(s.value||"{}"));
        });
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (pinState === "unlocked") loadAll();
  }, [pinState, loadAll]);

  async function saveSetting(key, value) {
    await api.upsert("settings", { key, value: String(value) });
  }

  function handleSetPin() {
    if (newPin.length < 4) { setPinError("PIN minimal 4 angka"); return; }
    localStorage.setItem(PIN_KEY, newPin);
    setPinState("unlocked");
  }
  function handleUnlock() {
    const pin = localStorage.getItem(PIN_KEY);
    if (pinInput === pin) { setPinState("unlocked"); setPinError(""); }
    else { setPinError("PIN salah"); setPinInput(""); }
  }

  const pinScreen = (isSetup) => (
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:"#f7f7f5",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
      <div style={{background:"white",borderRadius:16,padding:"2rem",width:"100%",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}>
        <div style={{fontSize:36,textAlign:"center",marginBottom:8}}>💰</div>
        <div style={{fontSize:18,fontWeight:600,textAlign:"center",marginBottom:4}}>Dompetku</div>
        <div style={{fontSize:13,color:"#888",textAlign:"center",marginBottom:20}}>{isSetup?"Buat PIN untuk keamanan":"Masukkan PIN untuk masuk"}</div>
        <input type="password" inputMode="numeric" maxLength={6}
          value={isSetup?newPin:pinInput}
          onChange={e=>isSetup?setNewPin(e.target.value):setPinInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&(isSetup?handleSetPin():handleUnlock())}
          placeholder={isSetup?"PIN baru (min. 4 angka)":"Masukkan PIN"}
          style={{width:"100%",padding:"14px",border:"1px solid #e0e0de",borderRadius:10,fontSize:20,textAlign:"center",letterSpacing:10,marginBottom:10,boxSizing:"border-box"}}/>
        {pinError && <div style={{color:"#E24B4A",fontSize:13,textAlign:"center",marginBottom:8}}>{pinError}</div>}
        <button onClick={isSetup?handleSetPin:handleUnlock}
          style={{width:"100%",padding:13,background:G,color:"white",border:"none",borderRadius:10,fontSize:15,fontWeight:500,cursor:"pointer"}}>
          {isSetup?"Simpan PIN":"Masuk"}
        </button>
      </div>
    </div>
  );

  if (pinState==="setup") return pinScreen(true);
  if (pinState==="locked") return pinScreen(false);

  const monthEntries = entries.filter(e=>e.month===currentMonth);
  const totalIncome = monthEntries.filter(e=>e.type==="in").reduce((s,e)=>s+e.amount,0);
  const totalExpense = monthEntries.filter(e=>e.type==="out").reduce((s,e)=>s+e.amount,0);
  const balance = totalIncome - totalExpense;
  const totalDebt = debts.reduce((s,d)=>s+(d.total-d.paid),0);
  const edPct = Math.min(100,Math.round((emergency/EMERGENCY_TARGET)*100));
  const incomePct = Math.min(100,Math.round((totalIncome/incomeTarget)*100));

  const chartData = (() => {
    const now = new Date();
    return Array.from({length:6},(_,i)=>{
      const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const inc = entries.filter(e=>e.month===ym&&e.type==="in").reduce((s,e)=>s+e.amount,0);
      const exp = entries.filter(e=>e.month===ym&&e.type==="out").reduce((s,e)=>s+e.amount,0);
      return { name:getMonthLabel(ym), Masuk:Math.round(inc/1000), Keluar:Math.round(exp/1000) };
    });
  })();

  const reminders = FIXED_BILLS.map(bill=>{
    const daysLeft = getDaysUntil(bill.dueDay);
    const paidKey = `${getCurrentMonth()}-${bill.id}`;
    return {...bill, daysLeft, paid:billsPaid[paidKey], paidKey};
  }).filter(b=>!b.paid && b.daysLeft<=7);

  const catBreakdown = CATEGORIES.map(cat=>{
    const items = monthEntries.filter(e=>e.type==="out"&&e.category===cat.id);
    return {...cat, total:items.reduce((s,e)=>s+e.amount,0), items};
  }).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  const totalProjectValue = projects.reduce((s,p)=>s+p.total,0);
  const totalDpReceived = projects.reduce((s,p)=>s+p.dp,0);
  const totalUnpaid = projects.reduce((s,p)=>s+(p.total-p.dp),0);

  async function addEntry(overrideEntry) {
    const entry = overrideEntry || (() => {
      const amount = parseInput(form.amount);
      if (!amount||amount<=0) return null;
      return { id:Date.now(), type:form.type, amount, note:form.note||(form.type==="in"?"Pemasukan":"Pengeluaran"), category:form.category, date:new Date().toLocaleDateString("id-ID"), month:currentMonth };
    })();
    if (!entry) return;
    setSyncing(true);
    try {
      await api.post("entries", entry);
      setEntries(prev=>[entry,...prev]);
      setForm({type:"out",amount:"",note:"",category:"makan"});
    } catch(e) { console.error(e); }
    setSyncing(false);
  }

  async function addQuickExpense() {
    if (!quickEdit) return;
    const amount = parseInput(String(quickEdit.editAmount));
    if (!amount||amount<=0) return;
    await addEntry({ id:Date.now(), type:"out", amount, note:quickEdit.label, category:quickEdit.category, date:new Date().toLocaleDateString("id-ID"), month:currentMonth });
    setQuickEdit(null);
  }

  async function deleteEntry(id) {
    setSyncing(true);
    try {
      await api.delete("entries", `id=eq.${id}`);
      setEntries(prev=>prev.filter(e=>e.id!==id));
    } catch(e) { console.error(e); }
    setSyncing(false);
  }

  async function payDebt(id, amount) {
    const parsed = parseInput(amount);
    if (!parsed||parsed<=0) return;
    const debt = debts.find(d=>d.id===id);
    if (!debt) return;
    const newPaid = Math.min(debt.total, debt.paid+parsed);
    setSyncing(true);
    try {
      await api.patch("debts", `id=eq.${id}`, { paid:newPaid });
      setDebts(prev=>prev.map(d=>d.id===id?{...d,paid:newPaid}:d));
      setDebtForm({id:null,amount:""});
    } catch(e) { console.error(e); }
    setSyncing(false);
  }

  async function addEmergency() {
    const amt = parseInput(emergencyInput);
    if (!amt||amt<=0) return;
    const next = emergency+amt;
    setSyncing(true);
    try {
      await saveSetting("emergency", next);
      setEmergency(next);
      setEmergencyInput("");
    } catch(e) { console.error(e); }
    setSyncing(false);
  }

  async function saveProject() {
    const total = parseInput(projForm.total);
    const dp = parseInput(projForm.dp)||0;
    if (!projForm.name||!total) return;
    setSyncing(true);
    try {
      if (projForm.id) {
        const existing = projects.find(p=>p.id===projForm.id);
        const dpDiff = dp - (existing?.dp||0);
        await api.patch("projects", `id=eq.${projForm.id}`, { name:projForm.name, total, dp, status:projForm.status, note:projForm.note, source:projForm.source });
        setProjects(prev=>prev.map(p=>p.id===projForm.id?{...p,name:projForm.name,total,dp,status:projForm.status,note:projForm.note,source:projForm.source}:p));
        if (dpDiff > 0) {
          const src = PROJECT_SOURCES.find(s=>s.id===projForm.source)||PROJECT_SOURCES[3];
          const entry = { id:Date.now(), type:"in", amount:dpDiff, note:`DP ${projForm.name} (${src.label})`, category:"proyek", date:new Date().toLocaleDateString("id-ID"), month:currentMonth };
          await api.post("entries", entry);
          setEntries(prev=>[entry,...prev]);
        }
      } else {
        const newProj = { id:Date.now(), name:projForm.name, total, dp, status:projForm.status, note:projForm.note, source:projForm.source, date:new Date().toLocaleDateString("id-ID") };
        const res = await api.post("projects", newProj);
        setProjects(prev=>[res[0]||newProj,...prev]);
        if (dp > 0) {
          const src = PROJECT_SOURCES.find(s=>s.id===projForm.source)||PROJECT_SOURCES[3];
          const entry = { id:Date.now()+1, type:"in", amount:dp, note:`DP ${projForm.name} (${src.label})`, category:"proyek", date:new Date().toLocaleDateString("id-ID"), month:currentMonth };
          await api.post("entries", entry);
          setEntries(prev=>[newProj,...prev]);
        }
      }
      setProjForm({show:false,id:null,name:"",total:"",dp:"",dpPrev:0,status:"ongoing",note:"",source:"lainnya"});
    } catch(e) { console.error(e); }
    setSyncing(false);
  }

  async function deleteProject(id) {
    setSyncing(true);
    try {
      await api.delete("projects", `id=eq.${id}`);
      setProjects(prev=>prev.filter(p=>p.id!==id));
    } catch(e) { console.error(e); }
    setSyncing(false);
  }

  async function saveTarget() {
    const t = parseInput(targetInput);
    if (!t||t<=0) return;
    setSyncing(true);
    try {
      await saveSetting("incomeTarget", t);
      setIncomeTarget(t);
      setTargetInput("");
    } catch(e) { console.error(e); }
    setSyncing(false);
  }

  async function markBillPaid(paidKey) {
    const next = {...billsPaid,[paidKey]:true};
    setSyncing(true);
    try {
      await saveSetting("billsPaid", JSON.stringify(next));
      setBillsPaid(next);
    } catch(e) { console.error(e); }
    setSyncing(false);
  }

  const statusColor = {ongoing:"#185FA5",selesai:"#1D9E75",nunggak:"#E24B4A"};
  const statusLabel = {ongoing:"Berjalan",selesai:"Lunas",nunggak:"Nunggak"};
  const tabs = [
    {key:"dashboard",label:"Ringkasan",icon:"📊"},
    {key:"catat",label:"Catat",icon:"✏️"},
    {key:"proyek",label:"Proyek",icon:"🏗️"},
    {key:"utang",label:"Utang",icon:"📋"},
  ];
  const inputStyle = {width:"100%",padding:"9px 12px",border:"1px solid #e0e0de",borderRadius:8,fontSize:14,marginBottom:8,boxSizing:"border-box"};

  return (
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:"#f7f7f5",fontFamily:"system-ui,-apple-system,sans-serif",paddingBottom:30}}>

      {/* Header */}
      <div style={{background:G,padding:"1.25rem 1rem 1rem",color:"white"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:13,opacity:0.8,marginBottom:2}}>Dompetku {syncing&&"·  menyimpan..."}</div>
            <div style={{fontSize:28,fontWeight:600}}>{fmt(balance)}</div>
            <div style={{fontSize:12,opacity:0.75,marginTop:2}}>Saldo bersih bulan ini</div>
          </div>
          <button onClick={()=>setPinState("locked")} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"6px 12px",color:"white",fontSize:12,cursor:"pointer"}}>🔒 Kunci</button>
        </div>
        <div style={{marginTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,opacity:0.85,marginBottom:4}}>
            <span>Target income: {fmtShort(incomeTarget)}</span>
            <span>{incomePct}%</span>
          </div>
          <div style={{height:4,background:"rgba(255,255,255,0.3)",borderRadius:99,overflow:"hidden"}}>
            <div style={{height:"100%",width:incomePct+"%",background:"white",borderRadius:99}}/>
          </div>
        </div>
      </div>

      {/* Reminders */}
      {reminders.length>0 && (
        <div style={{padding:"10px 1rem 0"}}>
          {reminders.map(r=>(
            <div key={r.id} style={{background:r.daysLeft<=3?"#fcebeb":"#fff8e6",border:`1px solid ${r.daysLeft<=3?"#f7c1c1":"#f5e0a0"}`,borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:r.daysLeft<=3?"#E24B4A":"#7a5a00"}}>{r.icon} {r.label}</div>
                <div style={{fontSize:12,color:r.daysLeft<=3?"#E24B4A":"#7a5a00",opacity:0.8}}>
                  {r.daysLeft===0?"Jatuh tempo hari ini!":`${r.daysLeft} hari lagi`} · {fmt(r.amount)}
                </div>
              </div>
              <button onClick={()=>markBillPaid(r.paidKey)} style={{background:r.daysLeft<=3?"#E24B4A":G,border:"none",borderRadius:8,padding:"6px 10px",color:"white",fontSize:12,cursor:"pointer"}}>✓ Lunas</button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",background:"white",borderBottom:"1px solid #e8e8e6",position:"sticky",top:0,zIndex:10}}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{flex:1,padding:"10px 2px",background:"none",border:"none",borderBottom:tab===t.key?"2px solid "+G:"2px solid transparent",color:tab===t.key?G:"#888",fontSize:11,fontWeight:500,cursor:"pointer"}}>
            {t.icon}<br/>{t.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner/> : (
      <div style={{padding:"1rem"}}>

        {/* DASHBOARD */}
        {tab==="dashboard" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              {[
                {label:"Pemasukan",value:fmt(totalIncome),color:G},
                {label:"Pengeluaran",value:fmt(totalExpense),color:"#E24B4A"},
                {label:"Dana darurat",value:fmtShort(emergency),color:"#185FA5"},
                {label:"Total utang",value:fmtShort(totalDebt),color:"#BA7517"},
              ].map(m=>(
                <div key={m.label} style={{background:"white",borderRadius:12,padding:"0.85rem 1rem",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
                  <div style={{fontSize:11,color:"#888",marginBottom:4}}>{m.label}</div>
                  <div style={{fontSize:16,fontWeight:600,color:m.color}}>{m.value}</div>
                </div>
              ))}
            </div>

            {catBreakdown.length>0 && (
              <Card>
                <div style={{fontSize:12,color:"#888",marginBottom:10}}>Pengeluaran per kategori</div>
                {catBreakdown.map(cat=>(
                  <div key={cat.id}>
                    <div onClick={()=>setActiveCategory(activeCategory===cat.id?null:cat.id)}
                      style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"0.5px solid #f0f0ee",cursor:"pointer"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span>{cat.icon}</span>
                        <span style={{fontSize:14,color:"#333"}}>{cat.label}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:14,fontWeight:600,color:cat.color}}>{fmt(cat.total)}</span>
                        <span style={{fontSize:11,color:"#aaa"}}>{activeCategory===cat.id?"▲":"▼"}</span>
                      </div>
                    </div>
                    {activeCategory===cat.id && (
                      <div style={{background:"#f9f9f7",borderRadius:8,padding:"8px 10px",margin:"4px 0 8px"}}>
                        {cat.items.map(item=>(
                          <div key={item.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"0.5px solid #eee"}}>
                            <span style={{color:"#555"}}>{item.note}</span>
                            <div style={{textAlign:"right"}}>
                              <div style={{color:"#E24B4A",fontWeight:500}}>{fmt(item.amount)}</div>
                              <div style={{fontSize:11,color:"#aaa"}}>{item.date}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            )}

            <Card>
              <div style={{fontSize:12,color:"#888",marginBottom:6}}>Dana darurat — target {fmt(EMERGENCY_TARGET)}</div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontWeight:600,fontSize:15}}>{fmt(emergency)}</span>
                <span style={{fontSize:13,color:G,fontWeight:500}}>{edPct}%</span>
              </div>
              <div style={{height:6,background:"#f0f0ee",borderRadius:99,overflow:"hidden",marginBottom:10}}>
                <div style={{height:"100%",width:edPct+"%",background:G,borderRadius:99}}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <CurrencyInput value={emergencyInput} onChange={v=>setEmergencyInput(v)}
                  placeholder="Tambah nominal" style={{flex:1,padding:"8px 10px",border:"1px solid #e0e0de",borderRadius:8,fontSize:13}}/>
                <button onClick={addEmergency} style={{padding:"8px 12px",background:G,color:"white",border:"none",borderRadius:8,fontSize:13,cursor:"pointer"}}>+ Simpan</button>
              </div>
            </Card>

            <Card>
              <div style={{fontSize:12,color:"#888",marginBottom:8}}>Target income bulan ini</div>
              <div style={{display:"flex",gap:8}}>
                <CurrencyInput value={targetInput} onChange={v=>setTargetInput(v)}
                  placeholder={fmt(incomeTarget)} style={{flex:1,padding:"8px 10px",border:"1px solid #e0e0de",borderRadius:8,fontSize:13}}/>
                <button onClick={saveTarget} style={{padding:"8px 12px",background:G,color:"white",border:"none",borderRadius:8,fontSize:13,cursor:"pointer"}}>Set</button>
              </div>
            </Card>

            <Card>
              <div style={{fontSize:12,color:"#888",marginBottom:12}}>Tren 6 bulan (ribu Rp)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{top:0,right:0,left:-20,bottom:0}}>
                  <XAxis dataKey="name" tick={{fontSize:10}}/>
                  <YAxis tick={{fontSize:10}}/>
                  <Tooltip formatter={v=>"Rp "+v+"rb"}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="Masuk" fill={G} radius={[4,4,0,0]}/>
                  <Bar dataKey="Keluar" fill="#E24B4A" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div style={{fontSize:12,color:"#888",marginBottom:10}}>Tagihan tetap bulanan</div>
              {FIXED_BILLS.map(b=>{
                const paidKey=`${getCurrentMonth()}-${b.id}`;
                const paid=billsPaid[paidKey];
                const days=getDaysUntil(b.dueDay);
                return (
                  <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"0.5px solid #f0f0ee"}}>
                    <div>
                      <div style={{fontSize:14,color:"#333"}}>{b.icon} {b.label}</div>
                      <div style={{fontSize:11,color:paid?"#1D9E75":days<=3?"#E24B4A":"#aaa"}}>
                        {paid?"✓ Sudah dibayar":`Tanggal ${b.dueDay} · ${days} hari lagi`}
                      </div>
                    </div>
                    <div style={{fontWeight:500,fontSize:14}}>{fmt(b.amount)}</div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {/* CATAT */}
        {tab==="catat" && (
          <div>
            <Card>
              <div style={{fontSize:12,color:"#888",marginBottom:10}}>⚡ Pengeluaran Cepat</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {QUICK_EXPENSES.map(q=>(
                  <button key={q.id} onClick={()=>setQuickEdit({...q,editAmount:String(q.amount)})}
                    style={{padding:"10px 8px",background:"#f7f7f5",border:"1px solid #e8e8e6",borderRadius:10,cursor:"pointer",textAlign:"left"}}>
                    <div style={{fontSize:16,marginBottom:3}}>{q.icon}</div>
                    <div style={{fontSize:12,fontWeight:500,color:"#333"}}>{q.label}</div>
                    <div style={{fontSize:11,color:G,fontWeight:500}}>{fmt(q.amount)}</div>
                  </button>
                ))}
              </div>
              {quickEdit && (
                <div style={{marginTop:12,padding:"12px",background:"#e1f5ee",borderRadius:10}}>
                  <div style={{fontSize:13,fontWeight:500,marginBottom:8,color:"#0F6E56"}}>{quickEdit.icon} {quickEdit.label}</div>
                  <CurrencyInput value={quickEdit.editAmount} onChange={v=>setQuickEdit(q=>({...q,editAmount:v}))}
                    placeholder="Nominal" style={{width:"100%",padding:"9px 12px",border:"1px solid #b2dfd0",borderRadius:8,fontSize:15,marginBottom:8,boxSizing:"border-box"}}/>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={addQuickExpense} style={{flex:1,padding:"10px",background:G,color:"white",border:"none",borderRadius:8,fontSize:14,fontWeight:500,cursor:"pointer"}}>✓ Simpan</button>
                    <button onClick={()=>setQuickEdit(null)} style={{padding:"10px 14px",background:"white",border:"none",borderRadius:8,fontSize:14,cursor:"pointer"}}>Batal</button>
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <div style={{fontSize:12,color:"#888",marginBottom:10}}>Input Manual</div>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                {["in","out"].map(t=>(
                  <button key={t} onClick={()=>setForm(f=>({...f,type:t}))} style={{
                    flex:1,padding:"9px",border:"1.5px solid",
                    borderColor:form.type===t?(t==="in"?G:"#E24B4A"):"#e0e0de",
                    borderRadius:8,background:form.type===t?(t==="in"?"#e1f5ee":"#fcebeb"):"white",
                    color:form.type===t?(t==="in"?G:"#E24B4A"):"#888",
                    fontWeight:500,fontSize:14,cursor:"pointer"
                  }}>{t==="in"?"⬆ Pemasukan":"⬇ Pengeluaran"}</button>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                {CATEGORIES.filter(c=>form.type==="in"?c.id==="proyek"||c.id==="lainnya":c.id!=="proyek").map(cat=>(
                  <button key={cat.id} onClick={()=>setForm(f=>({...f,category:cat.id}))} style={{
                    padding:"8px 6px",border:"1.5px solid",fontSize:12,cursor:"pointer",borderRadius:8,
                    borderColor:form.category===cat.id?cat.color:"#e0e0de",
                    background:form.category===cat.id?cat.color+"18":"white",
                    color:form.category===cat.id?cat.color:"#888",
                    fontWeight:form.category===cat.id?500:400
                  }}>{cat.icon} {cat.label}</button>
                ))}
              </div>
              <CurrencyInput value={form.amount} onChange={v=>setForm(f=>({...f,amount:v}))}
                placeholder="Nominal (Rp)" style={{width:"100%",padding:"9px 12px",border:"1px solid #e0e0de",borderRadius:8,fontSize:15,marginBottom:8,boxSizing:"border-box"}}/>
              <input type="text" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}
                placeholder="Keterangan (opsional)" style={{width:"100%",padding:"9px 12px",border:"1px solid #e0e0de",borderRadius:8,fontSize:15,marginBottom:10,boxSizing:"border-box"}}/>
              <button onClick={()=>addEntry()} style={{width:"100%",padding:"11px",background:G,color:"white",border:"none",borderRadius:8,fontSize:15,fontWeight:500,cursor:"pointer"}}>Simpan</button>
            </Card>

            <Card>
              <div style={{fontSize:12,color:"#888",marginBottom:10}}>Riwayat bulan ini</div>
              {monthEntries.length===0 && <div style={{textAlign:"center",color:"#aaa",padding:"1.5rem 0",fontSize:14}}>Belum ada catatan</div>}
              {monthEntries.map(e=>{
                const cat = CATEGORIES.find(c=>c.id===e.category)||CATEGORIES[CATEGORIES.length-1];
                return (
                  <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"0.5px solid #f0f0ee"}}>
                    <div>
                      <div style={{fontSize:14,color:"#333"}}>{e.note}</div>
                      <div style={{fontSize:11,color:"#aaa"}}>{e.date} · {cat.icon} {cat.label}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:14,fontWeight:600,color:e.type==="in"?G:"#E24B4A"}}>{e.type==="in"?"+":"-"}{fmt(e.amount)}</span>
                      <button onClick={()=>deleteEntry(e.id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:18}}>×</button>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {/* PROYEK */}
        {tab==="proyek" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              {[
                {label:"Total nilai proyek",value:fmtShort(totalProjectValue),color:"#185FA5"},
                {label:"DP diterima",value:fmtShort(totalDpReceived),color:G},
                {label:"Belum dibayar",value:fmtShort(totalUnpaid),color:"#E24B4A"},
                {label:"Jumlah proyek",value:projects.length+" proyek",color:"#888"},
              ].map(m=>(
                <div key={m.label} style={{background:"white",borderRadius:12,padding:"0.85rem 1rem",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
                  <div style={{fontSize:11,color:"#888",marginBottom:4}}>{m.label}</div>
                  <div style={{fontSize:15,fontWeight:600,color:m.color}}>{m.value}</div>
                </div>
              ))}
            </div>

            {projects.length>0 && (
              <Card>
                <div style={{fontSize:12,color:"#888",marginBottom:10}}>Income per sumber</div>
                {PROJECT_SOURCES.map(src=>{
                  const total = projects.filter(p=>p.source===src.id).reduce((s,p)=>s+p.dp,0);
                  if (!total) return null;
                  return (
                    <div key={src.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"0.5px solid #f0f0ee",fontSize:14}}>
                      <span style={{color:"#555"}}>{src.icon} {src.label}</span>
                      <span style={{fontWeight:500,color:G}}>{fmt(total)}</span>
                    </div>
                  );
                })}
              </Card>
            )}

            <button onClick={()=>setProjForm({show:true,id:null,name:"",total:"",dp:"",dpPrev:0,status:"ongoing",note:"",source:"lainnya"})}
              style={{width:"100%",padding:"11px",background:G,color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:500,cursor:"pointer",marginBottom:12}}>
              + Tambah Proyek
            </button>

            {projForm.show && (
              <Card>
                <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>{projForm.id?"Edit Proyek":"Proyek Baru"}</div>
                <input type="text" placeholder="Nama klien / proyek" value={projForm.name}
                  onChange={e=>setProjForm(p=>({...p,name:e.target.value}))} style={inputStyle}/>
                <div style={{fontSize:12,color:"#888",marginBottom:6}}>Sumber proyek</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                  {PROJECT_SOURCES.map(src=>(
                    <button key={src.id} onClick={()=>setProjForm(p=>({...p,source:src.id}))} style={{
                      padding:"8px 6px",border:"1.5px solid",fontSize:12,cursor:"pointer",borderRadius:8,
                      borderColor:projForm.source===src.id?G:"#e0e0de",
                      background:projForm.source===src.id?"#e1f5ee":"white",
                      color:projForm.source===src.id?G:"#888",
                      fontWeight:projForm.source===src.id?500:400
                    }}>{src.icon} {src.label}</button>
                  ))}
                </div>
                <CurrencyInput value={projForm.total} onChange={v=>setProjForm(p=>({...p,total:v}))}
                  placeholder="Nilai total (Rp)" style={{...inputStyle}}/>
                <CurrencyInput value={projForm.dp} onChange={v=>setProjForm(p=>({...p,dp:v}))}
                  placeholder="DP sudah masuk (Rp)" style={{...inputStyle}}/>
                <div style={{fontSize:11,color:"#888",marginBottom:8,marginTop:-4}}>DP otomatis masuk ke pemasukan bulan ini</div>
                <select value={projForm.status} onChange={e=>setProjForm(p=>({...p,status:e.target.value}))} style={{...inputStyle}}>
                  <option value="ongoing">Berjalan</option>
                  <option value="selesai">Lunas</option>
                  <option value="nunggak">Nunggak</option>
                </select>
                <input type="text" placeholder="Catatan (opsional)" value={projForm.note}
                  onChange={e=>setProjForm(p=>({...p,note:e.target.value}))} style={inputStyle}/>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={saveProject} style={{flex:1,padding:"10px",background:G,color:"white",border:"none",borderRadius:8,fontSize:14,cursor:"pointer"}}>Simpan</button>
                  <button onClick={()=>setProjForm({show:false,id:null,name:"",total:"",dp:"",dpPrev:0,status:"ongoing",note:"",source:"lainnya"})}
                    style={{padding:"10px 14px",background:"#f5f5f3",border:"none",borderRadius:8,fontSize:14,cursor:"pointer"}}>Batal</button>
                </div>
              </Card>
            )}

            {projects.length===0 && <div style={{textAlign:"center",color:"#aaa",padding:"2rem 0",fontSize:14}}>Belum ada proyek</div>}
            {projects.map(p=>{
              const sisa=p.total-p.dp;
              const pct=Math.round((p.dp/p.total)*100);
              const src=PROJECT_SOURCES.find(s=>s.id===p.source)||PROJECT_SOURCES[3];
              return (
                <Card key={p.id}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:15}}>{p.name}</div>
                      <div style={{fontSize:12,color:G,marginTop:2}}>{src.icon} {src.label}</div>
                      {p.note&&<div style={{fontSize:12,color:"#888",marginTop:2}}>{p.note}</div>}
                      <div style={{fontSize:11,color:"#aaa",marginTop:2}}>{p.date}</div>
                    </div>
                    <span style={{fontSize:11,padding:"3px 9px",borderRadius:20,fontWeight:500,background:statusColor[p.status]+"22",color:statusColor[p.status]}}>
                      {statusLabel[p.status]}
                    </span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
                    <span style={{color:"#888"}}>Total: {fmt(p.total)}</span>
                    <span style={{color:"#888"}}>DP: {fmt(p.dp)}</span>
                  </div>
                  <div style={{height:5,background:"#f0f0ee",borderRadius:99,overflow:"hidden",marginBottom:6}}>
                    <div style={{height:"100%",width:pct+"%",background:G,borderRadius:99}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:10}}>
                    <span style=={{color:G,fontWeight:500}}>{pct}% diterima</span>
                    <span style={{color:"#E24B4A",fontWeight:500}}>Sisa {fmt(sisa)}</span>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setProjForm({show:true,id:p.id,name:p.name,total:String(p.total),dp:String(p.dp),dpPrev:p.dp,status:p.status,note:p.note||"",source:p.source||"lainnya"})}
                      style={{flex:1,padding:"8px",background:"#f5f5f3",border:"none",borderRadius:8,fontSize:13,cursor:"pointer"}}>Edit</button>
                    <button onClick={()=>deleteProject(p.id)}
                      style={{padding:"8px 12px",background:"#fcebeb",border:"none",borderRadius:8,fontSize:13,color:"#E24B4A",cursor:"pointer"}}>Hapus</button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* UTANG */}
        {tab==="utang" && (
          <div>
            <div style={{background:"#fff8e6",border:"1px solid #f5e0a0",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#7a5a00"}}>
              Total utang tersisa: <strong>{fmt(totalDebt)}</strong>
            </div>
            {debts.map(d=>{
              const sisa=d.total-d.paid;
              const pct=Math.round((d.paid/d.total)*100);
              const lunas=sisa<=0;
              return (
                <Card key={d.id} style={{opacity:lunas?0.6:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:15}}>{d.label}</div>
                      <div style={{fontSize:12,color:"#888",marginTop:2}}>{d.note}</div>
                    </div>
                    <span style={{fontSize:11,padding:"3px 9px",borderRadius:20,fontWeight:500,background:d.urgent?"#fcebeb":"#f5f5f3",color:d.urgent?"#E24B4A":"#888"}}>
                      {lunas?"✓ Lunas":"P"+d.priority}
                    </span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
                    <span style={{color:"#888"}}>Dibayar {fmt(d.paid)}</span>
                    <span style={{fontWeight:600,color:lunas?G:"#333"}}>{lunas?"Lunas!":"Sisa "+fmt(sisa)}</span>
                  </div>
                  <div style={{height:5,background:"#f0f0ee",borderRadius:99,overflow:"hidden",marginBottom:lunas?0:10}}>
                    <div style={{height:"100%",width:pct+"%",background:G,borderRadius:99}}/>
                  </div>
                  {!lunas&&(
                    debtForm.id===d.id?(
                      <div style={{display:"flex",gap:8,marginTop:4}}>
                        <CurrencyInput value={debtForm.amount} onChange={v=>setDebtForm(f=>({...f,amount:v}))}
                          placeholder="Nominal bayar" style={{flex:1,padding:"8px 10px",border:"1px solid #e0e0de",borderRadius:8,fontSize:14}}/>
                        <button onClick={()=>payDebt(d.id,debtForm.amount)} style={{padding:"8px 14px",background:G,color:"white",border:"none",borderRadius:8,fontSize:14,cursor:"pointer"}}>Bayar</button>
                        <button onClick={()=>setDebtForm({id:null,amount:""})} style={{padding:"8px 10px",background:"#f5f5f3",border:"none",borderRadius:8,fontSize:14,cursor:"pointer"}}>×</button>
                      </div>
                    ):(
                      <button onClick={()=>setDebtForm({id:d.id,amount:""})} style={{width:"100%",padding:"8px",background:"#f5f5f3",border:"none",borderRadius:8,fontSize:13,color:"#555",cursor:"pointer"}}>
                        Catat pembayaran
                      </button>
                    )
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
