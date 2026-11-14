'use client';

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const EIXO = { fontSize: 11, fill: 'var(--color-on-surface-variant)' };
const DICA = { contentStyle: { background: 'var(--color-surface)', border: '1px solid var(--color-outline-variant)', borderRadius: 8, fontSize: 12 } };

export function BarrasPorHora({ dados, series }: { dados: Record<string, string | number>[]; series: { chave: string; nome: string; cor: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={dados} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-outline-variant)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="hora" tick={EIXO} interval={2} tickLine={false} axisLine={false} />
        <YAxis tick={EIXO} allowDecimals={false} tickLine={false} axisLine={false} />
        <Tooltip {...DICA} cursor={{ fill: 'var(--color-surface-container-low)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Bar key={s.chave} dataKey={s.chave} name={s.nome} fill={s.cor} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LinhaCpu({ dados }: { dados: { hora: string; vcpu: number; fps: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={dados} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-outline-variant)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="hora" tick={EIXO} minTickGap={40} tickLine={false} axisLine={false} />
        <YAxis yAxisId="cpu" tick={EIXO} domain={[0, 2]} tickLine={false} axisLine={false} />
        <YAxis yAxisId="fps" orientation="right" tick={EIXO} tickLine={false} axisLine={false} />
        <Tooltip {...DICA} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line yAxisId="cpu" type="monotone" dataKey="vcpu" name="vCPU em uso (limite 2)" stroke="var(--color-primary)" dot={false} strokeWidth={2} />
        <Line yAxisId="fps" type="monotone" dataKey="fps" name="quadros analisados/s" stroke="#16a34a" dot={false} strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}
