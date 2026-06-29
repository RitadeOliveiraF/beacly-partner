import { BIOMA } from "@/lib/bioma"
import { Star, AlertCircle } from "lucide-react"

const ratingDist = [
  { stars: 5, count: 20, pct: 100 },
  { stars: 4, count: 0, pct: 0 },
  { stars: 3, count: 0, pct: 0 },
  { stars: 2, count: 0, pct: 0 },
  { stars: 1, count: 0, pct: 0 },
]

export default function Reviews() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-preto/30">Reviews</p>
        <h1 className="mt-1 text-2xl font-serif font-bold text-preto">Análise de reputação</h1>
        <p className="text-sm text-preto/50">Baseado em {BIOMA.reviewCount} reviews no Google</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-ocean text-white p-6">
          <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Rating Google</p>
          <div className="flex items-end gap-2">
            <p className="text-5xl font-bold">{BIOMA.rating}</p>
            <Star className="h-6 w-6 fill-white mb-1.5" />
          </div>
          <p className="mt-1 text-sm opacity-60">{BIOMA.reviewCount} reviews</p>
        </div>
        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/30 mb-2">TripAdvisor</p>
          <p className="text-5xl font-bold text-preto">—</p>
          <a href={BIOMA.tripadvisor} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-ocean hover:underline">Ver perfil →</a>
        </div>
        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/30 mb-2">Alertas</p>
          <div className="flex items-center gap-2 mt-2">
            <AlertCircle className="h-5 w-5 text-emerald-500" />
            <p className="text-sm font-bold text-emerald-600">Nenhum</p>
          </div>
          <p className="mt-1 text-xs text-preto/40">0 reviews negativas</p>
        </div>
      </div>
      <div className="rounded-2xl bg-branco border border-preto/8 p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-preto/40 mb-4">Distribuição de ratings</p>
        <div className="space-y-3">
          {ratingDist.map(({ stars, count, pct }) => (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16 shrink-0">
                <span className="text-sm font-bold text-preto">{stars}</span>
                <Star className="h-3.5 w-3.5 fill-signal text-signal" />
              </div>
              <div className="flex-1 h-2.5 rounded-full bg-preto/5 overflow-hidden">
                <div className="h-full rounded-full bg-signal" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-sm font-bold text-preto w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-branco border border-preto/8 p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-preto/40 mb-4">Palavras-chave mais mencionadas</p>
        <div className="flex flex-wrap gap-2">
          {BIOMA.keywords.positive.map((k, i) => (
            <span key={i} className="rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">{k}</span>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-branco border border-preto/8 p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-preto/40 mb-4">Reviews recentes</p>
        <div className="space-y-4">
          {BIOMA.reviews.map((r, i) => (
            <div key={i} className="border-b border-preto/5 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center gap-0.5">
                  {[...Array(r.rating)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-signal text-signal" />)}
                </div>
                <span className="text-xs text-preto/30">{r.date}</span>
              </div>
              <p className="text-sm text-preto/70 leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
