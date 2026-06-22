import { useState, useEffect } from "react";

const STORAGE_KEY = "dompetku_data";

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

function fmt(n) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function fmtShort(n) {
  if (n >= 1000000) return "Rp " + (n / 1000000).toFixed(1).replace(".0", "") + " jt";
  if (n >= 1000) return "Rp " + (n / 1000).toFixed(0) + " rb";
  return "Rp " + n;
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [entries, setEntries] = useState([]);
  const [debts, setDebts] = useState(INITIAL_DEBTS);
  const [emergency, setEmergency] = useState(1200000);
  const [form, setForm] = useState({ type: "in", amount: "", note: "" });
  const [debtForm, setDebtForm] = useState({ id: null, amount: "" });
  const [emergencyInput, setEmergencyInput] = useState("");
  const [currentMonth] = useState(getCurrentMonth());

  useEffect(() => {
    const saved = loadData();
    if (saved) {
      if (saved.entries) setEntries(saved.entries);
      if (saved.debts) setDebts(saved.debts);
      if (saved.emergency !== undefined) setEmergency(saved.emergency);
    }
  }, []);

  function persist(newEntries, newDebts, newEmergency) {
    saveData({ entries: newEntries, debts: newDebts, emergency: newEmergency });
  }

  const monthEntries = entries.filter(e => e.month === currentMonth);
  const totalIncome = monthEntries.filter(e => e.type === "in").reduce((s, e) => s + e.amount, 0);
  const totalExpense = monthEntries.filter(e => e.type === "out").reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalDebt = debts.reduce((s, d) => s + (d.total - d.paid), 0);
  const edPct = Math.min(100, Math.round((emergency / EMERGENCY_TARGET) * 100));

  function addEntry() {
    const amount = parseInt(form.amount);
    if (!amount || amount <= 0) return;
    const entry = {
      id: Date.now(),
      type: form.type,
      amount,
      note: form.note || (form.type === "in" ? "Pemasukan" : "Pengeluaran"),
      date: new Date().toLocaleDateString("id-ID"),
      month: currentMonth,
    };
    const next = [entry, ...entries];
    setEntries(next);
    setForm({ type: "in", amount: "", note: "" });
    persist(next, debts, emergency);
  }

  function payDebt(id, amount) {
    const parsed = parseInt(amount);
    if (!parsed || parsed <= 0) return;
    const next = debts.map(d => {
      if (d.id !== id) return d;
      return { ...d, paid: Math.min(d.total, d.paid + parsed) };
    });
    setDebts(next);
    setDebtForm({ id: null, amount: "" });
    persist(entries, next, emergency);
  }

  function addEmergency() {
    const amt = parseInt(emergencyInput);
    if (!amt || amt <= 0) return;
    const next = emergency + amt;
    setEmergency(next);
    setEmergencyInput("");
    persist(entries, debts, next);
  }

  function deleteEntry(id) {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    persist(next, debts, emergency);
  }

  const tabs = [
    { key: "dashboard", label: "Ringkasan", icon: "📊" },
    { key: "catat", label: "Catat", icon: "✏️" },
    { key: "utang", label: "Utang", icon: "📋" },
  ];

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#f7f7f5", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#1D9E75", padding: "1.25rem 1rem 1rem", color: "white" }}>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>Dompetku</div>
        <div style={{ fontSize: 26, fontWeight: 600 }}>{fmt(balance)}</div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Saldo bersih bulan ini</div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", background: "white", borderBottom: "1px solid #e8e8e6" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "10px 4px", background: "none", border: "none",
            borderBottom: tab === t.key ? "2px solid #1D9E75" : "2px solid transparent",
            color: tab === t.key ? "#1D9E75" : "#888", fontSize: 12, fontWeight: 500, cursor: "pointer"
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "1rem" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
            {/* Metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Pemasukan", value: fmt(totalIncome), color: "#1D9E75" },
                { label: "Pengeluaran", value: fmt(totalExpense), color: "#E24B4A" },
                { label: "Dana darurat", value: fmtShort(emergency), color: "#185FA5" },
                { label: "Total utang", value: fmtShort(totalDebt), color: "#BA7517" },
              ].map(m => (
                <div key={m.label} style={{ background: "white", borderRadius: 12, padding: "0.85rem 1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Emergency fund */}
            <div style={{ background: "white", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Dana darurat — target {fmt(EMERGENCY_TARGET)}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{fmt(emergency)}</span>
                <span style={{ fontSize: 13, color: "#1D9E75", fontWeight: 500 }}>{edPct}%</span>
              </div>
              <div style={{ height: 6, background: "#f0f0ee", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: edPct + "%", background: "#1D9E75", borderRadius: 99, transition: "width 0.4s" }} />
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <input type="number" value={emergencyInput} onChange={e => setEmergencyInput(e.target.value)}
                  placeholder="Tambah nominal" style={{ flex: 1, padding: "8px 10px", border: "1px solid #e0e0de", borderRadius: 8, fontSize: 14 }} />
                <button onClick={addEmergency} style={{ padding: "8px 14px", background: "#1D9E75", color: "white", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>+ Simpan</button>
              </div>
            </div>

            {/* Fixed expenses */}
            <div style={{ background: "white", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Pengeluaran tetap / bulan</div>
              {FIXED_EXPENSES.map(e => (
                <div key={e.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid #f0f0ee", fontSize: 14 }}>
                  <span style={{ color: "#555" }}>{e.label}</span>
                  <span style={{ fontWeight: 500 }}>{fmt(e.amount)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 600, fontSize: 15 }}>
                <span>Total</span>
                <span style={{ color: "#E24B4A" }}>{fmt(TOTAL_FIXED)}</span>
              </div>
            </div>
          </div>
        )}

        {/* CATAT */}
        {tab === "catat" && (
          <div>
            <div style={{ background: "white", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Tambah catatan</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {["in", "out"].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                    flex: 1, padding: "9px", border: "1.5px solid",
                    borderColor: form.type === t ? (t === "in" ? "#1D9E75" : "#E24B4A") : "#e0e0de",
                    borderRadius: 8, background: form.type === t ? (t === "in" ? "#e1f5ee" : "#fcebeb") : "white",
                    color: form.type === t ? (t === "in" ? "#1D9E75" : "#E24B4A") : "#888",
                    fontWeight: 500, fontSize: 14, cursor: "pointer"
                  }}>
                    {t === "in" ? "⬆ Pemasukan" : "⬇ Pengeluaran"}
                  </button>
                ))}
              </div>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="Nominal (Rp)" style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0e0de", borderRadius: 8, fontSize: 15, marginBottom: 8, boxSizing: "border-box" }} />
              <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Keterangan (opsional)" style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0e0de", borderRadius: 8, fontSize: 15, marginBottom: 10, boxSizing: "border-box" }} />
              <button onClick={addEntry} style={{ width: "100%", padding: "11px", background: "#1D9E75", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
                Simpan
              </button>
            </div>

            <div style={{ background: "white", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Riwayat bulan ini</div>
              {monthEntries.length === 0 && (
                <div style={{ textAlign: "center", color: "#aaa", padding: "1.5rem 0", fontSize: 14 }}>Belum ada catatan</div>
              )}
              {monthEntries.map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid #f0f0ee" }}>
                  <div>
                    <div style={{ fontSize: 14, color: "#333" }}>{e.note}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>{e.date}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: e.type === "in" ? "#1D9E75" : "#E24B4A" }}>
                      {e.type === "in" ? "+" : "-"}{fmt(e.amount)}
                    </span>
                    <button onClick={() => deleteEntry(e.id)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 16 }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UTANG */}
        {tab === "utang" && (
          <div>
            <div style={{ background: "#fff8e6", border: "1px solid #f5e0a0", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#7a5a00" }}>
              Total utang tersisa: <strong>{fmt(totalDebt)}</strong>
            </div>
            {debts.map(d => {
              const sisa = d.total - d.paid;
              const pct = Math.round((d.paid / d.total) * 100);
              const lunas = sisa <= 0;
              return (
                <div key={d.id} style={{ background: "white", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", opacity: lunas ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{d.label}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{d.note}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 500, background: d.urgent ? "#fcebeb" : "#f5f5f3", color: d.urgent ? "#E24B4A" : "#888" }}>
                      {lunas ? "✓ Lunas" : `P${d.priority}`}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "#888" }}>Sudah bayar {fmt(d.paid)}</span>
                    <span style={{ fontWeight: 600, color: lunas ? "#1D9E75" : "#333" }}>{lunas ? "Lunas!" : `Sisa ${fmt(sisa)}`}</span>
                  </div>
                  <div style={{ height: 5, background: "#f0f0ee", borderRadius: 99, overflow: "hidden", marginBottom: lunas ? 0 : 10 }}>
                    <div style={{ height: "100%", width: pct + "%", background: lunas ? "#1D9E75" : "#1D9E75", borderRadius: 99 }} />
                  </div>
                  {!lunas && (
                    debtForm.id === d.id ? (
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <input type="number" value={debtForm.amount} onChange={e => setDebtForm(f => ({ ...f, amount: e.target.value }))}
                          placeholder="Nominal bayar" style={{ flex: 1, padding: "8px 10px", border: "1px solid #e0e0de", borderRadius: 8, fontSize: 14 }} />
                        <button onClick={() => payDebt(d.id, debtForm.amount)} style={{ padding: "8px 14px", background: "#1D9E75", color: "white", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>Bayar</button>
                        <button onClick={() => setDebtForm({ id: null, amount: "" })} style={{ padding: "8px 10px", background: "#f5f5f3", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>×</button>
                      </div>
                    ) : (
                      <button onClick={() => setDebtForm({ id: d.id, amount: "" })} style={{ width: "100%", padding: "8px", background: "#f5f5f3", border: "none", borderRadius: 8, fontSize: 13, color: "#555", cursor: "pointer" }}>
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
