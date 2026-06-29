import { Eye, MousePointerClick, MapPin, Sparkles } from "lucide-react"

const funil = [
  { label: "Sugerido pela IA beacly", value: "Alta", pct: 100, icon: Sparkles, desc: "O teu perfil aparece em pesquisas relevantes" },
  { label: "Visto nos resultados", value: "Alta", pct: 82, icon: Eye, desc: "Utilizadores vêem o card do Bioma" },
  { label: "Clicou em Ver detalhes", value: "Acima da média", pct: 54, icon: MousePointerClick, desc: "Taxa de clique superior à média dos Açores" },
  { label: "Acção tomada (rota/contacto)", value: "Em crescimento", pct: 31, icon: MapPin, desc: "Pedidos de direcções e contacto directo" },
]

export default function Visibilidade() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-preto/30">Visibilidade</p>
        <h1 className="mt-1 text-2xl font-serif font-bold text-preto">Funil de descoberta</h1>
        <p className="text-sm text-preto/50">Como os visitantes encontram e interagem com o Bioma no beacly</p>
      </div>
      <div className="space-y-3">
        {funil.map(({ label, value, pct, icon: Icon, desc }, i) => (
          <div key={i} className="rounded-2xl bg-branco border border-preto/8 p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-ocean/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-ocean" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-preto">{label}</p>
                  <span className="text-sm font-bold text-ocean">{value}</span>
                </div>
                <div className="h-2 rounded-full bg-preto/5 overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-ocean transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-preto/40">{desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-ocean/20 bg-ocean/5 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-ocean mb-2">Recomendação beacly AI</p>
        <p className="text-sm text-preto/70">Para maximizar a visibilidade entre visitantes internacionais, considera responder às reviews em inglês e adicionar o menu de degustação ao perfil. O Bioma já aparece em destaque nas pesquisas de fine dining nos Açores.</p>
      </div>
    </div>
  )
}
