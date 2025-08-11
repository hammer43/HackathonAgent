const useMemory = (process.env.DB || '').toLowerCase() === 'memory';

let repo;
if (useMemory) {
  repo = await import('../../memory/runsRepo.js');
} else {
  repo = await import('./runsRepo.js');
}

export const recordRun = repo.recordRun;
export const recordExposure = repo.recordExposure;
export const recordOutcome = repo.recordOutcome;
export const getStores = repo.getStores;