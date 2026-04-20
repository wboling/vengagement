import { PrismaNeonHTTP } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const g = globalThis as unknown as { _prisma?: PrismaClient };

function make(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter: new PrismaNeonHTTP(url, {} as any) });
}

// Lazy singleton: created on first use, not at module-load time.
// This lets Next.js import the module during build without needing DATABASE_URL at build time.
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = g._prisma ?? (g._prisma = make());
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(client) : val;
  },
});
