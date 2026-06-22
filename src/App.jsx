import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STORAGE_KEY = "dompetku_data";
const PIN_KEY = "dompetku_pin";

const FIXED_EXPENSES = [
  { label: "SPP anak", amount: 700000 },
  { label: "Makan", amount: 1000000 },
  { label: "Bensin", amount: 350000 },
  { label: "Internet", amount: 150000 },
  { label: "Listrik", amount: 250000 },
  { label: "Air", amount: 60000 },
  { label: "Gas LPG", amount: 250000 },
  { label: "Laundry", amount: 200000 },
  { label: "Uang istri", amount: 500000 },
  { label: "Iuran RT", amount: 130000 },
  { label: "Cicilan kas + listrik RT", amount: 1100000 },
];

const TOTAL_FIXED = FIXED_EXPENSES.reduce((s, e) => s + e.amount, 0);

const INITIAL_DEBTS = [
  { id: 1, label: "Kas (satpam)", total: 5000000, paid: 0, priority: 1, note: "Cicil Rp 1 jt/bulan", urgent: true },
  { id: 2, label: "Papa", total: 650000, paid: 0, priority: 2, note: "Lunasi saat ada surplus", urgent: true },
  { id: 3, label: "Adek + Ibu + Anak ke-2", total: 1250000, paid: 0, priority: 3, note: "Bertahap saat surplus", urgent: false },
  { id: 4, label: "Daftar ujian (ke istri)", total: 1500000, paid: 0, priority: 4, note: "Komunikasikan tempo", urgent: false },
  { id: 5, label: "Kakak kandung", total: 10000000, paid: 0, priority: 5, note: "Minta tempo — tunggu cash flow stabil", urgent: false },
];

const EMERGENCY_TARGET = 5000000;
const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

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
  const [y, m] = ym.split("-");
  return MONTHS_ID[parseInt(m)-1] + " " + y.slice(2);
}

function loadData() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

export default function App() {
  const [pinState, setPinState] = useState("check"); // check | locked | unlocked | setup
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [newPin, setNewPin] = useState("");

  const [tab, setTab] = useState("dashboard");
  const [entries, setEntries] = useState([]);
  const [debts, setDebts] = useState(INITIAL_DEBTS);
  const [projects, setProjects] = useState([]);
  const [emergency, setEmergency] = useState(1200000);
  const [form, setForm] = useState({ type: "in", amount: "", note: "", category: "lainnya" });
  const [debtForm, setDebtForm] = useState({ id: null, amount: "" });
  const [emergencyInput, setEmergencyInput] = useState("");
  const [projForm, setProjForm] = useState({ show: false, id: null, name: "", total: "", dp: "", status: "ongoing", note: "" });
  const [currentMonth] = useState(getCurrentMonth());
  const [incomeTarget, setIncomeTarget] = useState(5000000);
  const [targetInput, setTargetInput] = useState("");

  useEffect(() => {
    const pin = localStorage.getItem(PIN_KEY);
    if (!pin) setPinState("setup");
    else setPinState("locked");
    const saved = loadData();
    if (saved) {
      if (saved.entries) setEntries(saved.entries);
      if (saved.debts) setDebts(saved.debts);
      if (saved.emergency !== undefined) setEmergency(saved.emergency);
      if (saved.projects) setProjects(saved.projects);
      if (saved.incomeTarget) setIncomeTarget(saved.incomeTarget);
    }
  }, []);

  function persist(e, d, em, p, it) {
    saveData({ entries: e, debts: d, emergency: em, projects: p, incomeTarget: it });
  }

  // PIN handlers
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

  if (pinState === "setup") return (
    <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:"#f7f7f5", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
      <div style={{ background:"white", borderRadius:16, padding:"2rem", width:"100%", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize:32, textAlign:"center", marginBottom:8 }}>🔐</div>
        <div style={{ fontSize:18, fontWeight:600, textAlign:"center", marginBottom:4 }}>Buat PIN</div>
        <div style={{ fontSize:13, color:"#888", textAlign:"center", marginBottom:20 }}>Untuk keamanan data keuanganmu</div>
        <input type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={e=>setNewPin(e.target.value)}
          placeholder="Masukkan PIN (min. 4 angka)" style={{ width:"100%", padding:"12px", border:"1px solid #e0e0de", borderRadius:10, fontSize:16, textAlign:"center", letterSpacing:8, marginBottom:10, boxSizing:"border-box" }} />
        {pinError && <div style={{ color:"#E24B4A", fontSize:13, textAlign:"center", marginBottom:8 }}>{pinError}</div>}
        <button onClick={handleSetPin} style={{ width:"100%", padding:12, background:"#1D9E75", color:"white", border:"none", borderRadius:10, fontSize:15, fontWeight:500, cursor:"pointer" }}>Simpan PIN</button>
      </div>
    </div>
  );

  if (pinState === "locked") return (
    <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:"#f7f7f5", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
      <div style={{ background:"white", borderRadius:16, padding:"2rem", width:"100%", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize:32, textAlign:"center", marginBottom:8 }}>💰</div>
        <div style={{ fontSize:18, fontWeight:600, textAlign:"center", marginBottom:4 }}>Dompetku</div>
        <div style={{ fontSize:13, color:"#888", textAlign:"center", marginBottom:20 }}>Masukkan PIN untuk masuk</div>
        <input type="password" inputMode="numeric" maxLength={6} value={pinInput} onChange={e=>setPinInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleUnlock()}
          placeholder="PIN" style={{ width:"100%", padding:"12px", border:"1px solid #e0e0de", borderRadius:10, fontSize:16, textAlign:"center", letterSpacing:8, marginBottom:10, boxSizing:"border-box" }} />
        {pinError && <div style={{ color:"#E24B4A", fontSize:13, textAlign:"center", marginBottom:8 }}>{pinError}</div>}
        <button onClick={handleUnlock} style={{ width:"100%", padding:12, background:"#1D9E75", color:"white", border:"none", borderRadius:10, fontSize:15, fontWeight:500, cursor:"pointer" }}>Masuk</button>
      </div>
    </div>
  );

  // Main app
  const monthEntries = entries.filter(e => e.month === currentMonth);
  const totalIncome = monthEntries.filter(e=>e.type==="in").reduce((s,e)=>s+e.amount,0);
  const totalExpense = monthEntries.filter(e=>e.type==="out").reduce((s,e)=>s+e.amount,0);
  const balance = totalIncome - totalExpense;
  const totalDebt = debts.reduce((s,d)=>s+(d.total-d.paid),0);
  const edPct = Math.min(100, Math.round((emergency/EMERGENCY_TARGET)*100));
  const incomePct = Math.min(100, Math.round((totalIncome/incomeTarget)*100));

  // Chart data — last 6 months
  const chartData = (() => {
    const now = new Date();
    const months = [];
    for (let i=5; i>=0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const inc = entries.filter(e=>e.month===ym&&e.type==="in").reduce((s,e)=>s+e.amount,0);
      const exp = entries.filter(e=>e.month===ym&&e.type==="out").reduce((s,e)=>s+e.amount,0);
      months.push({ name: getMonthLabel(ym), Masuk: Math.round(inc/1000), Keluar: Math.round(exp/1000) });
    }
    return months;
  })();

  // Project stats
  const totalProjectValue = projects.reduce((s,p)=>s+p.total,0);
  const totalDpReceived = projects.reduce((s,p)=>s+p.dp,0);
  const totalUnpaid = projects.reduce((s,p)=>s+(p.total-p.dp),0);

  function addEntry() {
    const amount = parseInt(form.amount);
    if (!amount||amount<=0) return;
    const entry = { id:Date.now(), type:form.type, amount, note:form.note||(form.type==="in"?"Pemasukan":"Pengeluaran"), category:form.category, date:new Date().toLocaleDateString("id-ID"), month:currentMonth };
    const next = [entry,...entries];
    setEntries(next);
    setForm({ type:"in", amount:"", note:"", category:"lainnya" });
    persist(next, debts, emergency, projects, incomeTarget);
  }

  function deleteEntry(id) {
    const next = entries.filter(e=>e.id!==id);
    setEntries(next);
    persist(next, debts, emergency, projects, incomeTarget);
  }

  function payDebt(id, amount) {
    const parsed = parseInt(amount);
    if (!parsed||parsed<=0) return;
    const next = debts.map(d=>d.id!==id?d:{...d,paid:Math.min(d.total,d.paid+parsed)});
    setDebts(next);
    setDebtForm({id:null,amount:""});
    persist(entries, next, emergency, projects, incomeTarget);
  }

  function addEmergency() {
    const amt = parseInt(emergencyInput);
    if (!amt||amt<=0) return;
    const next = emergency+amt;
    setEmergency(next);
    setEmergencyInput("");
    persist(entries, debts, next, projects, incomeTarget);
  }

  function saveProject() {
    const total = parseInt(projForm.total);
    const dp = parseInt(projForm.dp)||0;
    if (!projForm.name||!total) return;
    let nextProjects;
    if (projForm.id) {
      nextProjects = projects.map(p=>p.id===projForm.id?{...p,name:projForm.name,total,dp,status:projForm.status,note:projForm.note}:p);
    } else {
      nextProjects = [{id:Date.now(),name:projForm.name,total,dp,status:projForm.status,note:projForm.note,date:new Date().toLocaleDateString("id-ID")},...projects];
    }
    setProjects(nextProjects);
    setProjForm({show:false,id:null,name:"",total:"",dp:"",status:"ongoing",note:""});
    persist(entries, debts, emergency, nextProjects, incomeTarget);
  }

  function deleteProject(id) {
    const next = projects.filter(p=>p.id!==id);
    setProjects(next);
    persist(entries, debts, emergency, next, incomeTarget);
  }

  function saveTarget() {
    const t = parseInt(targetInput);
    if (!t||t<=0) return;
    setIncomeTarget(t);
    setTargetInput("");
    persist(entries, debts, emergency, projects, t);
  }

  const statusColor = { ongoing:"#185FA5", selesai:"#1D9E75", nunggak:"#E24B4A" };
  const statusLabel = { ongoing:"Berjalan", selesai:"Lunas", nunggak:"Nunggak" };

  const tabs = [
    {key:"dashboard",label:"Ringkasan",icon:"📊"},
    {key:"catat",label:"Catat",icon:"✏️"},
    {key:"proyek",label:"Proyek",icon:"🏗️"},
    {key:"utang",label:"Utang",icon:"📋"},
  ];

  const G = "#1D9E75";

  return (
    <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:"#f7f7f5", fontFamily:"system-ui,-apple-system,sans-serif", paddingBottom:20 }}>

      {/* Header */}
      <div style={{ background:G, padding:"1.25rem 1rem 1rem", color:"white" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:13, opacity:0.8, marginBottom:2 }}>Dompetku</div>
            <div style={{ fontSize:28, fontWeight:600 }}>{fmt(balance)}</div>
            <div style={{ fontSize:12, opacity:0.75, marginTop:2 }}>Saldo bersih bulan ini</div>
          </div>
          <button onClick={()=>setPinState("locked")} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"6px 10px", color:"white", fontSize:12, cursor:"pointer" }}>🔒 Kunci</button>
        </div>
        {/* Income progress */}
        <div style={{ marginTop:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, opacity:0.85, marginBottom:4 }}>
            <span>Target income: {fmtShort(incomeTarget)}</span>
            <span>{incomePct}%</span>
          </div>
          <div style={{ height:4, background:"rgba(255,255,255,0.3)", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:incomePct+"%", background:"white", borderRadius:99 }} />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", background:"white", borderBottom:"1px solid #e8e8e6", position:"sticky", top:0, zIndex:10 }}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            flex:1, padding:"10px 2px", background:"none", border:"none",
            borderBottom:tab===t.key?"2px solid "+G:"2px solid transparent",
            color:tab===t.key?G:"#888", fontSize:11, fontWeight:500, cursor:"pointer"
          }}>{t.icon}<br/>{t.label}</button>
        ))}
      </div>

      <div style={{ padding:"1rem" }}>

        {/* DASHBOARD */}
        {tab==="dashboard" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              {[
                {label:"Pemasukan",value:fmt(totalIncome),color:"#1D9E75"},
                {label:"Pengeluaran",value:fmt(totalExpense),color:"#E24B4A"},
                {label:"Dana darurat",value:fmtShort(emergency),color:"#185FA5"},
                {label:"Total utang",value:fmtShort(totalDebt),color:"#BA7517"},
              ].map(m=>(
                <div key={m.label} style={{ background:"white", borderRadius:12, padding:"0.85rem 1rem", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:11, color:"#888", marginBottom:4 }}>{m.label}</div>
                  <div style={{ fontSize:16, fontWeight:600, color:m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Target income */}
            <div style={{ background:"white", borderRadius:12, padding:"1rem 1.25rem", marginBottom:12, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:12, color:"#888", marginBottom:8 }}>Target income bulan ini</div>
              <div style={{ display:"flex", gap:8 }}>
                <input type="number" value={targetInput} onChange={e=>setTargetInput(e.target.value)} placeholder={fmt(incomeTarget)}
                  style={{ flex:1, padding:"8px 10px", border:"1px solid #e0e0de", borderRadius:8, fontSize:13 }} />
                <button onClick={saveTarget} style={{ padding:"8px 12px", background:G, color:"white", border:"none", borderRadius:8, fontSize:13, cursor:"pointer" }}>Set</button>
              </div>
            </div>

            {/* Dana darurat */}
            <div style={{ background:"white", borderRadius:12, padding:"1rem 1.25rem", marginBottom:12, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:12, color:"#888", marginBottom:6 }}>Dana darurat — target {fmt(EMERGENCY_TARGET)}</div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontWeight:600, fontSize:15 }}>{fmt(emergency)}</span>
                <span style={{ fontSize:13, color:G, fontWeight:500 }}>{edPct}%</span>
              </div>
              <div style={{ height:6, background:"#f0f0ee", borderRadius:99, overflow:"hidden", marginBottom:10 }}>
                <div style={{ height:"100%", width:edPct+"%", background:G, borderRadius:99 }} />
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input type="number" value={emergencyInput} onChange={e=>setEmergencyInput(e.target.value)}
                  placeholder="Tambah nominal" style={{ flex:1, padding:"8px 10px", border:"1px solid #e0e0de", borderRadius:8, fontSize:13 }} />
                <button onClick={addEmergency} style={{ padding:"8px 12px", background:G, color:"white", border:"none", borderRadius:8, fontSize:13, cursor:"pointer" }}>+ Simpan</button>
              </div>
            </div>

            {/* Chart */}
            <div style={{ background:"white", borderRadius:12, padding:"1rem 1.25rem", marginBottom:12, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:12, color:"#888", marginBottom:12 }}>Pemasukan vs pengeluaran (ribu Rp)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{top:0,right:0,left:-20,bottom:0}}>
                  <XAxis dataKey="name" tick={{fontSize:10}} />
                  <YAxis tick={{fontSize:10}} />
                  <Tooltip formatter={(v)=>"Rp "+v+"rb"} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="Masuk" fill="#1D9E75" radius={[4,4,0,0]} />
                  <Bar dataKey="Keluar" fill="#E24B4A" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Fixed expenses */}
            <div style={{ background:"white", borderRadius:12, padding:"1rem 1.25rem", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:12, color:"#888", marginBottom:10 }}>Pengeluaran tetap / bulan</div>
              {FIXED_EXPENSES.map(e=>(
                <div key={e.label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"0.5px solid #f0f0ee", fontSize:14 }}>
                  <span style={{ color:"#555" }}>{e.label}</span>
                  <span style={{ fontWeight:500 }}>{fmt(e.amount)}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", fontWeight:600, fontSize:15 }}>
                <span>Total</span>
                <span style={{ color:"#E24B4A" }}>{fmt(TOTAL_FIXED)}</span>
              </div>
            </div>
          </div>
        )}

        {/* CATAT */}
        {tab==="catat" && (
          <div>
            <div style={{ background:"white", borderRadius:12, padding:"1rem 1.25rem", marginBottom:12, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:12, color:"#888", marginBottom:10 }}>Tambah catatan</div>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                {["in","out"].map(t=>(
                  <button key={t} onClick={()=>setForm(f=>({...f,type:t}))} style={{
                    flex:1, padding:"9px", border:"1.5px solid",
                    borderColor:form.type===t?(t==="in"?G:"#E24B4A"):"#e0e0de",
                    borderRadius:8, background:form.type===t?(t==="in"?"#e1f5ee":"#fcebeb"):"white",
                    color:form.type===t?(t==="in"?G:"#E24B4A"):"#888",
                    fontWeight:500, fontSize:14, cursor:"pointer"
                  }}>{t==="in"?"⬆ Pemasukan":"⬇ Pengeluaran"}</button>
                ))}
              </div>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", border:"1px solid #e0e0de", borderRadius:8, fontSize:14, marginBottom:8, boxSizing:"border-box" }}>
                <option value="makan">Makan</option>
                <option value="transport">Transport</option>
                <option value="anak">Anak</option>
                <option value="rumah">Rumah</option>
                <option value="proyek">Proyek (pemasukan)</option>
                <option value="utang">Bayar utang</option>
                <option value="lainnya">Lainnya</option>
              </select>
              <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                placeholder="Nominal (Rp)" style={{ width:"100%", padding:"9px 12px", border:"1px solid #e0e0de", borderRadius:8, fontSize:15, marginBottom:8, boxSizing:"border-box" }} />
              <input type="text" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}
                placeholder="Keterangan (opsional)" style={{ width:"100%", padding:"9px 12px", border:"1px solid #e0e0de", borderRadius:8, fontSize:15, marginBottom:10, boxSizing:"border-box" }} />
              <button onClick={addEntry} style={{ width:"100%", padding:"11px", background:G, color:"white", border:"none", borderRadius:8, fontSize:15, fontWeight:500, cursor:"pointer" }}>Simpan</button>
            </div>

            <div style={{ background:"white", borderRadius:12, padding:"1rem 1.25rem", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:12, color:"#888", marginBottom:10 }}>Riwayat bulan ini</div>
              {monthEntries.length===0 && <div style={{ textAlign:"center", color:"#aaa", padding:"1.5rem 0", fontSize:14 }}>Belum ada catatan</div>}
              {monthEntries.map(e=>(
                <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"0.5px solid #f0f0ee" }}>
                  <div>
                    <div style={{ fontSize:14, color:"#333" }}>{e.note}</div>
                    <div style={{ fontSize:11, color:"#aaa" }}>{e.date} · {e.category||"lainnya"}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:14, fontWeight:600, color:e.type==="in"?G:"#E24B4A" }}>
                      {e.type==="in"?"+":"-"}{fmt(e.amount)}
                    </span>
                    <button onClick={()=>deleteEntry(e.id)} style={{ background:"none", border:"none", color:"#ccc", cursor:"pointer", fontSize:18 }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROYEK */}
        {tab==="proyek" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              {[
                {label:"Total nilai proyek",value:fmtShort(totalProjectValue),color:"#185FA5"},
                {label:"DP diterima",value:fmtShort(totalDpReceived),color:G},
                {label:"Belum dibayar",value:fmtShort(totalUnpaid),color:"#E24B4A"},
                {label:"Jumlah proyek",value:projects.length+" proyek",color:"#888"},
              ].map(m=>(
                <div key={m.label} style={{ background:"white", borderRadius:12, padding:"0.85rem 1rem", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:11, color:"#888", marginBottom:4 }}>{m.label}</div>
                  <div style={{ fontSize:15, fontWeight:600, color:m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            <button onClick={()=>setProjForm({show:true,id:null,name:"",total:"",dp:"",status:"ongoing",note:""})}
              style={{ width:"100%", padding:"11px", background:G, color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:500, cursor:"pointer", marginBottom:12 }}>
              + Tambah Proyek
            </button>

            {projForm.show && (
              <div style={{ background:"white", borderRadius:12, padding:"1rem 1.25rem", marginBottom:12, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:10 }}>{projForm.id?"Edit Proyek":"Proyek Baru"}</div>
                {[
                  {ph:"Nama klien / proyek",key:"name",type:"text"},
                  {ph:"Nilai total (Rp)",key:"total",type:"number"},
                  {ph:"DP sudah masuk (Rp)",key:"dp",type:"number"},
                  {ph:"Catatan (opsional)",key:"note",type:"text"},
                ].map(f=>(
                  <input key={f.key} type={f.type} placeholder={f.ph} value={projForm[f.key]}
                    onChange={e=>setProjForm(p=>({...p,[f.key]:e.target.value}))}
                    style={{ width:"100%", padding:"9px 12px", border:"1px solid #e0e0de", borderRadius:8, fontSize:14, marginBottom:8, boxSizing:"border-box" }} />
                ))}
                <select value={projForm.status} onChange={e=>setProjForm(p=>({...p,status:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", border:"1px solid #e0e0de", borderRadius:8, fontSize:14, marginBottom:10, boxSizing:"border-box" }}>
                  <option value="ongoing">Berjalan</option>
                  <option value="selesai">Lunas</option>
                  <option value="nunggak">Nunggak</option>
                </select>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={saveProject} style={{ flex:1, padding:"10px", background:G, color:"white", border:"none", borderRadius:8, fontSize:14, cursor:"pointer" }}>Simpan</button>
                  <button onClick={()=>setProjForm({show:false,id:null,name:"",total:"",dp:"",status:"ongoing",note:""})}
                    style={{ padding:"10px 14px", background:"#f5f5f3", border:"none", borderRadius:8, fontSize:14, cursor:"pointer" }}>Batal</button>
                </div>
              </div>
            )}

            {projects.length===0 && <div style={{ textAlign:"center", color:"#aaa", padding:"2rem 0", fontSize:14 }}>Belum ada proyek</div>}
            {projects.map(p=>{
              const sisa = p.total - p.dp;
              const pct = Math.round((p.dp/p.total)*100);
              return (
                <div key={p.id} style={{ background:"white", borderRadius:12, padding:"1rem 1.25rem", marginBottom:10, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:15 }}>{p.name}</div>
                      {p.note && <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{p.note}</div>}
                      <div style={{ fontSize:11, color:"#aaa", marginTop:2 }}>{p.date}</div>
                    </div>
                    <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, fontWeight:500, background:statusColor[p.status]+"22", color:statusColor[p.status] }}>
                      {statusLabel[p.status]}
                    </span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
                    <span style={{ color:"#888" }}>Total: {fmt(p.total)}</span>
                    <span style={{ color:"#888" }}>DP: {fmt(p.dp)}</span>
                  </div>
                  <div style={{ height:5, background:"#f0f0ee", borderRadius:99, overflow:"hidden", marginBottom:6 }}>
                    <div style={{ height:"100%", width:pct+"%", background:G, borderRadius:99 }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:10 }}>
                    <span style={{ color:G, fontWeight:500 }}>{pct}% diterima</span>
                    <span style={{ color:"#E24B4A", fontWeight:500 }}>Sisa {fmt(sisa)}</span>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setProjForm({show:true,id:p.id,name:p.name,total:p.total,dp:p.dp,status:p.status,note:p.note||""})}
                      style={{ flex:1, padding:"8px", background:"#f5f5f3", border:"none", borderRadius:8, fontSize:13, cursor:"pointer" }}>Edit</button>
                    <button onClick={()=>deleteProject(p.id)}
                      style={{ padding:"8px 12px", background:"#fcebeb", border:"none", borderRadius:8, fontSize:13, color:"#E24B4A", cursor:"pointer" }}>Hapus</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* UTANG */}
        {tab==="utang" && (
          <div>
            <div style={{ background:"#fff8e6", border:"1px solid #f5e0a0", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:13, color:"#7a5a00" }}>
              Total utang tersisa: <strong>{fmt(totalDebt)}</strong>
            </div>
            {debts.map(d=>{
              const sisa = d.total-d.paid;
              const pct = Math.round((d.paid/d.total)*100);
              const lunas = sisa<=0;
              return (
                <div key={d.id} style={{ background:"white", borderRadius:12, padding:"1rem 1.25rem", marginBottom:10, boxShadow:"0 1px 3px rgba(0,0,0,0.06)", opacity:lunas?0.6:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:15 }}>{d.label}</div>
                      <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{d.note}</div>
                    </div>
                    <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, fontWeight:500, background:d.urgent?"#fcebeb":"#f5f5f3", color:d.urgent?"#E24B4A":"#888" }}>
                      {lunas?"✓ Lunas":"P"+d.priority}
                    </span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
                    <span style={{ color:"#888" }}>Dibayar {fmt(d.paid)}</span>
                    <span style={{ fontWeight:600, color:lunas?G:"#333" }}>{lunas?"Lunas!":"Sisa "+fmt(sisa)}</span>
                  </div>
                  <div style={{ height:5, background:"#f0f0ee", borderRadius:99, overflow:"hidden", marginBottom:lunas?0:10 }}>
                    <div style={{ height:"100%", width:pct+"%", background:G, borderRadius:99 }} />
                  </div>
                  {!lunas && (
                    debtForm.id===d.id ? (
                      <div style={{ display:"flex", gap:8, marginTop:4 }}>
                        <input type="number" value={debtForm.amount} onChange={e=>setDebtForm(f=>({...f,amount:e.target.value}))}
                          placeholder="Nominal bayar" style={{ flex:1, padding:"8px 10px", border:"1px solid #e0e0de", borderRadius:8, fontSize:14 }} />
                        <button onClick={()=>payDebt(d.id,debtForm.amount)} style={{ padding:"8px 14px", background:G, color:"white", border:"none", borderRadius:8, fontSize:14, cursor:"pointer" }}>Bayar</button>
                        <button onClick={()=>setDebtForm({id:null,amount:""})} style={{ padding:"8px 10px", background:"#f5f5f3", border:"none", borderRadius:8, fontSize:14, cursor:"pointer" }}>×</button>
                      </div>
                    ) : (
                      <button onClick={()=>setDebtForm({id:d.id,amount:""})} style={{ width:"100%", padding:"8px", background:"#f5f5f3", border:"none", borderRadius:8, fontSize:13, color:"#555", cursor:"pointer" }}>
                        Catat pembayaran
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
