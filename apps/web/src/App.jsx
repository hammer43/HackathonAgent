import { api } from "./lib/api";
import * as pricingApi from "./features/pricing/api";
import * as invoicingApi from "./features/invoicing/api";
import * as reportApi from "./features/reporting/api";
import React, { useEffect, useState } from "react";
import { Settings2, TrendingUp, ReceiptText, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "./components/ui/Card.jsx";
import { Button } from "./components/ui/Button.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import AlgorithmChips from "./components/AlgorithmChips.jsx";

export default function App(){
  const [vertical, setVertical] = useState("flower");
  const [epsilon, setEpsilon] = useState(0.05);
  const [strategy, setStrategy] = useState("thompson");
  const [algos, setAlgos] = useState(["Elasticity","Anchor","Promo"]);
  const [decision, setDecision] = useState(null);

  const [reportSku, setReportSku] = useState("ROSE-12");
  const [kpis, setKpis] = useState(null);
  const [conv, setConv] = useState(null);
  const [mix, setMix] = useState(null);

  function toggleAlgo(id){
    setAlgos(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  }

  async function simulate(){
    const sku = vertical==="flower" ? "ROSE-12" : (vertical==="travel" ? "ATV-COAST-3H" : "ROSE-12");
    const date = new Date().toISOString().slice(0,10);
    const data = await pricingApi.choose({ sku, date, epsilon, strategy });
    setDecision({
      sku, model: data.selection?.model, final:data.price, raw:data.raw, clamps:data.clamps,
      rationale:`${data.notes}. Signals: event ${data.features.event_score.toFixed(2)}, inv ${data.features.inv_pressure.toFixed(2)}, comp ${data.features.comp_idx.toFixed(2)}.`
    });
    await loadReports();
  }

  async function draftInvoice(){
    if (!decision) return;
    const inv = await invoicingApi.invoice({ po:"PO-4482", lines:[{ sku: decision.sku || "ROSE-12", qty: 24, unit_price: decision.final }] });
    const blob = new Blob([JSON.stringify(inv, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `invoice-${inv.invoice_id}.json`; a.click(); URL.revokeObjectURL(url);
  }

  async function markOutcome(success){
    if (!decision) return;
    await api.feedback({ sku: decision.sku, model: decision.model, success });
    await loadReports();
  }
  async function onAssistantIntent(text){
  if (text.toLowerCase().includes("run plan")) {
    const sku = decision?.sku || (vertical==="flower"?"ROSE-12":"ROSE-12");
    const date = new Date().toISOString().slice(0,10);
    const res = await api.runDefaultPlan({ sku, date, qty: 1, po_ref: "PO-4482", epsilon, strategy });
    return { events: res.events || [], response: res.ok ? "Plan executed." : `Plan failed: ${res.error}` };
   }

  const r = await api.ask(text);
  return { events: [], response: r.answer || "No response." };
  }

 

  async function loadReports(){
    const [k, c, m] = await Promise.all([ reportApi.getKPIs(7), reportApi.getConversion(reportSku, 6), reportApi.getAlgoMix(reportSku) ]);
    setKpis(k); setConv(c); setMix(m);
  }
  useEffect(()=>{ loadReports(); }, [reportSku]);

  return (
    <div className="mx-auto max-w-7xl p-6 grid gap-6">
      {/* Row 1: Setup */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> Setup</CardTitle>
          <span className="text-xs px-2 py-1 rounded bg-gray-100">Showcase</span>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Business Type</label>
              <select value={vertical} onChange={(e)=>setVertical(e.target.value)} className="w-full border rounded-md p-2 mt-1">
                <option value="travel">Travel</option>
                <option value="flower">Flower</option>
                <option value="perishable">Perishable</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Price Testing Intensity <span className="text-gray-500">(ε={epsilon.toFixed(2)})</span>
              </label>
              <div className="text-xs text-gray-600">How boldly we try new prices to keep learning.</div>
              <input type="range" min="0" max="0.1" step="0.01" value={epsilon} onChange={(e)=>setEpsilon(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="text-sm font-medium">Selection Strategy</label>
              <select value={strategy} onChange={(e)=>setStrategy(e.target.value)} className="w-full border rounded-md p-2 mt-1">
                <option value="epsilon">Price Testing (ε-greedy)</option>
                <option value="thompson">Learn Fast (Thompson)</option>
              </select>
              <div className="text-xs text-gray-600 mt-1">ε-greedy explores randomly; Thompson adapts as feedback arrives.</div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium mb-1 block">Which smarts to use?</label>
            <AlgorithmChips selected={algos} onToggle={toggleAlgo} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt starters</label>
            <div className="flex flex-wrap gap-2">
              {["Generate me a smart plan for my flower business to increase sales","Issue an invoice for PO-4482 (Roses Dozen x2, Aug 16)","Optimize prices for weekend tourist packages"].map((p,i)=>(
                <button key={i} onClick={()=>alert(`Paste into Assistant:\n\n${p}`)} className="text-left text-sm rounded-md border px-3 py-2 hover:bg-gray-50">{p}</button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 2: Pricing, Invoicing, Reports */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Pricing Preview</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600">Simulate a price decision with current settings.</div>
            <div className="flex gap-2">
              <Button onClick={simulate}>Simulate</Button>
              <Button variant="outline" onClick={draftInvoice}>Draft Invoice</Button>
            </div>
            {decision && (
              <div className="rounded-lg border bg-gray-50 p-3 text-sm">
                <div className="font-medium">Decision Overview</div>
                <div>Chosen price: <b>${decision.final.toFixed(2)}</b> {decision.clamps?.length? `(Policy: ${decision.clamps.join(", ")})`:""}</div>
                <div>Model: {decision.model}</div>
                <div className="text-xs text-gray-600 mt-1">{decision.rationale}</div>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" onClick={()=>markOutcome(1)}>Mark Won</Button>
                  <Button variant="outline" onClick={()=>markOutcome(0)}>Mark Lost</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5" /> Invoicing</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600">Create an invoice for your latest decision and download JSON.</div>
            <div className="flex gap-2">
              <Button onClick={draftInvoice}>Draft & Download</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Reports</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">SKU</label>
              <input value={reportSku} onChange={e=>setReportSku(e.target.value)} className="border rounded-md p-2 text-sm" style={{width:180}} />
              <Button variant="outline" onClick={loadReports}>Refresh</Button>
            </div>
            {kpis && (
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div className="rounded-lg border p-3"><div className="text-xs text-gray-500">Attempts</div><div className="font-semibold">{kpis.attempts}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-gray-500">Orders</div><div className="font-semibold">{kpis.orders}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-gray-500">Conversion</div><div className="font-semibold">{(kpis.conversion*100).toFixed(1)}%</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-gray-500">Revenue (demo)</div><div className="font-semibold">${kpis.revenue}</div></div>
              </div>
            )}
            {conv && (
              <div>
                <div className="text-sm text-gray-700 mb-1">Price → Conversion (buckets)</div>
                <div className="grid grid-cols-5 text-xs font-medium text-gray-500">
                  <div>From</div><div>To</div><div className="text-right">Shows</div><div className="text-right">Wins</div><div className="text-right">Conv</div>
                </div>
                {conv.points.map((p,i)=>(
                  <div key={i} className="grid grid-cols-5 items-center py-1 border-b last:border-b-0 text-sm">
                    <div>${p.from}</div><div>${p.to}</div>
                    <div className="text-right">{p.shows}</div>
                    <div className="text-right">{p.wins}</div>
                    <div className="text-right">{(p.conversion*100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            )}
            {mix && (
              <div>
                <div className="text-sm text-gray-700 mb-1">Algorithm mix & win rate</div>
                <div className="grid grid-cols-5 text-xs font-medium text-gray-500">
                  <div>Model</div><div className="text-right">Shows</div><div className="text-right">Wins</div><div className="text-right">Win%</div><div className="text-right">Avg Price</div>
                </div>
                {mix.rows.map((r,i)=>(
                  <div key={i} className="grid grid-cols-5 items-center py-1 border-b last:border-b-0 text-sm">
                    <div>{r.model}</div>
                    <div className="text-right">{r.shows}</div>
                    <div className="text-right">{r.wins}</div>
                    <div className="text-right">{(r.win_rate*100).toFixed(1)}%</div>
                    <div className="text-right">${r.avg_price}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ChatPanel onIntent={onAssistantIntent} tall className="mt-2" />
    </div>
  );
}
