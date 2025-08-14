#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, time, uuid, os

CACHE = {}  # key -> {"bundle":..., "exp": epoch_sec}

def now_iso(): return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

def build_bundle(inputs):
    key = (inputs.get("tenant_id"), inputs.get("sku"), inputs.get("region"))
    hit = CACHE.get(key)
    if hit and hit["exp"] > time.time():
        b = dict(hit["bundle"]); b["_cache"] = "HIT"; return b
    sku = inputs.get("sku")
    comp_delta = -0.06 if sku == "ULTRA-PLAN-12M" else -0.03
    inv_pressure = 0.62 if sku == "ULTRA-PLAN-12M" else 0.2
    band = {"min":89.0,"target":99.0,"max":119.0} if sku=="ULTRA-PLAN-12M" else {"min":9.0,"target":10.0,"max":12.0}
    bundle = {
        "tenant_id": inputs.get("tenant_id","acme"),
        "sku": sku or "SKU-1",
        "segment": inputs.get("segment","default"),
        "context": {"ts": now_iso(), "competitor_delta": comp_delta, "inventory_pressure": inv_pressure, "seasonality":"steady"},
        "features_v": "1",
        "price_band": band,
        "elasticity": -1.3,
        "opportunity_score": 0.72,
        "risk_score": 0.18,
        "confidence": 0.82,
        "rationale": "Demo ORB/Oracle bundle",
        "policy_hint": "margin_guarded",
        "ttl_sec": 900,
        "snapshot_id": "snap-" + uuid.uuid4().hex[:8],
        "guardrails": {"floor": band["min"], "ceiling": band["max"]+10, "max_daily_change_pct": 10}
    }
    CACHE[key] = {"bundle": bundle, "exp": time.time() + bundle["ttl_sec"]}
    return bundle

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code); self.send_header("Content-Type","application/json")
        self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health": return self._send(200, {"ok": True, "ts": now_iso()})
        if self.path == "/cache/stats": return self._send(200, {"entries": len(CACHE)})
        self._send(404, {"error":"not_found"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length","0")); data = self.rfile.read(length)
        try: req = json.loads(data.decode("utf-8"))
        except Exception as e: return self._send(400, {"error":"bad_json","detail":str(e)})
        if self.path == "/plan/execute":
            t0 = time.time(); bundle = build_bundle(req.get("inputs",{}))
            return self._send(200, {"bundle": bundle, "latency_ms": int((time.time()-t0)*1000), "ttl_sec": bundle.get("ttl_sec",300)})
        self._send(404, {"error":"not_found"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT","8081"))
    print(f"Tiny ORB running on :{port}"); HTTPServer(("0.0.0.0", port), Handler).serve_forever()
