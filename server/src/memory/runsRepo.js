const runs=[];
const exposures=[];
const outcomes=[];

export function recordRun(ev){
  runs.push({ ts: Date.now(), ...ev });
  if (runs.length > 10000) runs.shift();
}
export function recordExposure(ev){
  exposures.push({ ts: Date.now(), ...ev });
  if (exposures.length > 10000) exposures.shift();
}
export function recordOutcome(ev){
  outcomes.push({ ts: Date.now(), ...ev, success: !!ev.success });
  if (outcomes.length > 10000) outcomes.shift();
}
export function getStores(){ return { runs, exposures, outcomes }; }
