import { Users, Globe, Clock } from "lucide-react"

const intencoes = [
  { label: "Fine dining / Experiência", pct: 58 },
  { label: "Ingredientes locais / Sustentável", pct: 22 },
  { label: "Ocasião especial", pct: 12 },
  { label: "Recomendação de hotel", pct: 8 },
]

const origens = [
  { pais: "Reino Unido", pct: 32 },
  { pais: "EUA", pct: 28 },
  { pais: "Alemanha", pct: 14 },
  { pais: "Portugal", pct: 12 },
  { pais: "Outros", pct: 14 },
]

const horarios = [
  { label: "Almoço (12h–15h)", pct: 15 },
  { label: "Jantar (19h–22h)", pct: 82 },
  { label: "Outros", pct: 3 },
]

export default function Clientes() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-preto/30">Visitantes</p>
        <h1 className="mt-1 text-2xl font-serif font-bold text-preto">Perfil do visitante</h1>
        <p className="text-sm text-preto/50">Derivado das reviews e comportamento na plataforma beacly</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-ocean" />
            <p className="text-xs font-bold uppercase tracking-wider text-preto/40">Intenções de visita</p>
          </div>
          <div className="space-y-3">
            {intencoes.map(({ label, pct }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold text-preto">{label}</span>
                  <span className="text-xs font-bold text-ocean">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-preto/5 overflow-hidden">
                  <div className="h-full rounded-full bg-ocean" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-ocean" />
            <p className="text-xs font-bold uppercase tracking-wider text-preto/40">Origem dos visitantes</p>
          </div>
          <div className="space-y-3">
            {origens.map(({ pais, pct }) => (
              <div key={pais}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold text-preto">{pais}</span>
                  <span className="text-xs font-bold text-ocean">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-preto/5 overflow-hidden">
                  <div className="h-full rounded-full bg-ocean" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-preto/30">Baseado na língua das reviews</p>
        </div>
        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-ocean" />
            <p className="text-xs font-bold uppercase tracking-wider text-preto/40">Horários de interesse</p>
          </div>
          <div className="space-y-3">
            {horarios.map(({ label, pct }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold text-preto">{label}</span>
                  <span className="text-xs font-bold text-ocean">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-preto/5 overflow-hidden">
                  <div className="h-full rounded-full bg-ocean" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
