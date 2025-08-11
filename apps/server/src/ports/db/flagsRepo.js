import { getPrisma } from './prismaClient.js';

export async function getFlag(key, defaultValue = 'false') {
  const prisma = getPrisma();
  const row = await prisma.flag.findUnique({ where: { key } });
  return row ? row.value : defaultValue;
}

export async function setFlag(key, value) {
  const prisma = getPrisma();
  return prisma.flag.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export async function getAllFlags() {
  const prisma = getPrisma();
  const rows = await prisma.flag.findMany();
  return Object.fromEntries(rows.map(r => [r.key, coerce(r.value)]));
}

function coerce(v){ if (v==='true') return true; if (v==='false') return false; return v; }