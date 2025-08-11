export function epsilonGreedy(cands, epsilon=0.05){
  if (Math.random()<epsilon) return cands[Math.floor(Math.random()*cands.length)];
  return cands.slice().sort((a,b)=> b.rev - a.rev)[0];
}
