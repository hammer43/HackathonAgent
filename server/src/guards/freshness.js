export function requireFresh(asofIso, maxAgeSec){
  const age = (Date.now()-new Date(asofIso).getTime())/1000;
  if (isNaN(age) || age > maxAgeSec) throw new Error(`STALE:${age.toFixed(1)}s>${maxAgeSec}s`);
}
