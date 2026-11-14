import 'server-only';
import postgres from 'postgres';

// Banco próprio do piloto (Postgres no Coolify, rede interna: sem SSL).
const url = process.env.DATABASE_URL ?? '';
const comSsl = /sslmode=require/.test(url);

export const sql = postgres(url, { ssl: comSsl ? 'require' : false, max: 8 });
