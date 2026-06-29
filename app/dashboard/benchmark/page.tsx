import { BIOMA } from "@/lib/bioma"
import { Star, TrendingUp } from "lucide-react"

const concorrentes = [
  { name: "Bioma Restaurant", rating: 4.9, reviews: 224, category: "Fine Dining", ilha: "Pico", isYou: true },
  { name: "Cella Bar", rating: 4.6, reviews: 1420, category: "Bar / Snacks", ilha: "Faial", isYou: false },
  { name: "Taberna do Pico", rating: 4.5, reviews: 387, category: "Restaurante", ilha: "Pico", isYou: false },
  { name: "Genuíno", rating: 4.7, reviews: 892, category: "Fine Dining", ilha: "Terceira", isYou: false },
  { name: "O Manel", rating: 4.4, reviews: 563, category: "Restaurante", ilha: "São Miguel", isYou: false },
]

export default function Benchmark() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-preto/30">Benchmark</p>
        <h1 className="mt-1 text-2xl font-serif font-bold text-preto">Posição competitiva</h1>
        <p className="text-sm text-preto/50">O Bioma vs. referências gastronómicas nos Açores</p>
      </div>
      <div className="rounded-2xl bg-ocean text-white p-6 flex items-center gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider opacity-60">{BIOMA.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-4xl font-bold">#1</span>
            <div>
              <p className="text-sm font-bold">Fine Dining no Pico</p>
              <p className="text-xs opacity-60">Rating mais alto da ilha</p>
            </div>
          </div>
        </div>
        <div className="ml-auto text-right">
          <p className="text-5xl font-bold">{BIOMA.rating}</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-white" />)}
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-branco border border-preto/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-preto/5">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/40">Ranking Açores — Fine Dining & Referências</p>
        </div>
        <div className="divide-y divide-preto/5">
          {concorrentes.map((c, i) => (
            <div key={i} className={`flex items-center gap-4 px-6 py-4 ${c.isYou ? "bg-ocean/5" : ""}`}>
              <span className={`text-sm font-bold w-6 ${c.isYou ? "text-ocean" : "text-preto/30"}`}>#{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${c.isYou ? "text-ocean" : "text-preto"}`}>{c.name}</p>
                  {c.isYou && <span className="rounded-full bg-ocean/10 px-2 py-0.5 text-[10px] font-bold text-ocean">Tu</span>}
                </div>
                <p className="text-xs text-preto/40">{c.category} · {c.ilha}</p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-signal text-signal" />
                <span className="text-sm font-bold text-preto">{c.rating}</span>
              </div>
              <span className="text-xs text-preto/40 w-24 text-right">{c.reviews.toLocaleString()} reviews</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">O Bioma tem o rating mais alto entre os espaços de fine dining nos Açores com dados disponíveis. A oportunidade está em aumentar o volume de reviews para consolidar a posição.</p>
      </div>
    </div>
  )
}
