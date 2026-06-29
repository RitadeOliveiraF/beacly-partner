"use client"

import { useEffect, useState } from "react"
import { supabase, BIOMA_PLACE_ID } from "@/lib/supabase"
import { BIOMA } from "@/lib/bioma"
import { Star, AlertCircle, Loader2 } from "lucide-react"

interface Review {
  review_rating: number
  review_text: string
  review_date: string
  has_owner_response: boolean
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("azorean_reviews")
      .select("review_rating, review_text, review_date, has_owner_response")
      .eq("google_place_id", BIOMA_PLACE_ID)
      .order("review_date", { ascending: false })
      .then(({ data }) => {
        setReviews(data || [])
        setLoading(false)
      })
  }, [])

  const total = reviews.length
  const dist = [5,4,3,2,1].map(s => ({
    stars: s,
    count: reviews.filter(r => r.review_rating === s).length,
    pct: total > 0 ? Math.round((reviews.filter(r => r.review_rating === s).length / total) * 100) : 0
  }))
  const negative = reviews.filter(r => r.review_rating <= 3)
  const avgRating = total > 0 ? (reviews.reduce((a,r) => a + r.review_rating, 0) / total).toFixed(1) : "—"

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-preto/30">Reviews</p>
        <h1 className="mt-1 text-2xl font-serif font-bold text-preto">Análise de reputação</h1>
        <p className="text-sm text-preto/50">{loading ? "A carregar..." : `${total} reviews na base de dados beacly`}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-ocean" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-ocean text-white p-6">
              <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Rating médio</p>
              <div className="flex items-end gap-2">
                <p className="text-5xl font-bold">{avgRating}</p>
                <Star className="h-6 w-6 fill-white mb-1.5" />
              </div>
              <p className="mt-1 text-sm opacity-60">{total} reviews</p>
            </div>
            <div className="rounded-2xl bg-branco border border-preto/8 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-preto/30 mb-2">TripAdvisor</p>
              <p className="text-5xl font-bold text-preto">—</p>
              <a href={BIOMA.tripadvisor} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-ocean hover:underline">Ver perfil →</a>
            </div>
            <div className="rounded-2xl bg-branco border border-preto/8 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-preto/30 mb-2">Alertas</p>
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle className={`h-5 w-5 ${negative.length > 0 ? "text-red-500" : "text-emerald-500"}`} />
                <p className={`text-sm font-bold ${negative.length > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {negative.length > 0 ? `${negative.length} negativas` : "Nenhum"}
                </p>
              </div>
              <p className="mt-1 text-xs text-preto/40">{negative.length} reviews ≤ 3★</p>
            </div>
          </div>

          <div className="rounded-2xl bg-branco border border-preto/8 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-preto/40 mb-4">Distribuição de ratings</p>
            <div className="space-y-3">
              {dist.map(({ stars, count, pct }) => (
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
            <p className="text-xs font-bold uppercase tracking-wider text-preto/40 mb-4">Palavras-chave identificadas</p>
            <div className="flex flex-wrap gap-2">
              {BIOMA.keywords.positive.map((k, i) => (
                <span key={i} className="rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">{k}</span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-branco border border-preto/8 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-preto/40 mb-4">
              Reviews ({total})
            </p>
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={i} className="border-b border-preto/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex items-center gap-0.5">
                      {[...Array(r.review_rating)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-signal text-signal" />)}
                    </div>
                    <span className="text-xs text-preto/30">{r.review_date}</span>
                    {r.has_owner_response && (
                      <span className="rounded-full bg-ocean/10 px-2 py-0.5 text-[10px] font-bold text-ocean">Respondido</span>
                    )}
                  </div>
                  {r.review_text && <p className="text-sm text-preto/70 leading-relaxed">{r.review_text}</p>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
