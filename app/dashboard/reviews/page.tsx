"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase, BIOMA_PLACE_ID } from "@/lib/supabase"
import { BIOMA } from "@/lib/bioma"
import {
  Star, AlertTriangle, CheckCircle, MessageSquare, TrendingUp,
  TrendingDown, Minus, Loader2, Filter, ChevronDown
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface Review {
  review_rating: number
  review_text: string | null
  review_date: string
  has_owner_response: boolean
}

function parseDate(d: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d)
  return new Date()
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "positive" | "negative" | "no_response">("all")

  useEffect(() => {
    supabase
      .from("azorean_reviews")
      .select("review_rating, review_text, review_date, has_owner_response")
      .eq("google_place_id", BIOMA_PLACE_ID)
      .order("review_date", { ascending: false })
      .then(({ data }) => { setReviews(data || []); setLoading(false) })
  }, [])

  const stats = useMemo(() => {
    if (!reviews.length) return null
    const total = reviews.length
    const avg = reviews.reduce((a, r) => a + r.review_rating, 0) / total
    const pct5 = Math.round((reviews.filter(r => r.review_rating === 5).length / total) * 100)
    const negative = reviews.filter(r => r.review_rating <= 3)
    const noResponse = reviews.filter(r => !r.has_owner_response && r.review_text)
    const dist = [5,4,3,2,1].map(s => ({
      stars: s,
      count: reviews.filter(r => r.review_rating === s).length,
      pct: Math.round((reviews.filter(r => r.review_rating === s).length / total) * 100)
    }))

    // Evolução mensal
    const byMonth: Record<string, number[]> = {}
    reviews.forEach(r => {
      const d = parseDate(r.review_date)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(r.review_rating)
    })
    const evolution = Object.entries(byMonth)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([month, ratings]) => ({
        month: month.slice(5) + "/" + month.slice(2,4),
        avg: parseFloat((ratings.reduce((a,b) => a+b,0)/ratings.length).toFixed(2)),
        count: ratings.length
      }))

    // Tendência: últimos 3 meses vs anteriores
    const recent = evolution.slice(-3)
    const older = evolution.slice(-6, -3)
    const recentAvg = recent.length ? recent.reduce((a,m) => a+m.avg,0)/recent.length : 0
    const olderAvg = older.length ? older.reduce((a,m) => a+m.avg,0)/older.length : 0
    const trend = recentAvg > olderAvg + 0.05 ? "up" : recentAvg < olderAvg - 0.05 ? "down" : "stable"

    return { total, avg, pct5, negative, noResponse, dist, evolution, trend, recentAvg, olderAvg }
  }, [reviews])

  const filtered = useMemo(() => {
    if (filter === "positive") return reviews.filter(r => r.review_rating >= 4)
    if (filter === "negative") return reviews.filter(r => r.review_rating <= 3)
    if (filter === "no_response") return reviews.filter(r => !r.has_owner_response && r.review_text)
    return reviews
  }, [reviews, filter])

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-6 w-6 animate-spin text-ocean" />
    </div>
  )

  if (!stats) return null

  const TrendIcon = stats.trend === "up" ? TrendingUp : stats.trend === "down" ? TrendingDown : Minus
  const trendColor = stats.trend === "up" ? "text-emerald-600" : stats.trend === "down" ? "text-red-500" : "text-amber-500"

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-preto/30">Reviews</p>
        <h1 className="mt-1 text-2xl font-serif font-bold text-preto">Inteligência de reputação</h1>
        <p className="text-sm text-preto/50">{stats.total} reviews · Google + TripAdvisor</p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-ocean text-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Rating médio</p>
          <div className="flex items-end gap-1.5">
            <p className="text-4xl font-bold">{stats.avg.toFixed(1)}</p>
            <Star className="h-5 w-5 fill-white mb-1" />
          </div>
          <p className="mt-1 text-xs opacity-50">{stats.total} reviews totais</p>
        </div>
        <div className="rounded-2xl bg-branco border border-preto/8 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/30 mb-1">Reviews 5★</p>
          <p className="text-4xl font-bold text-preto">{stats.pct5}%</p>
          <p className="mt-1 text-xs text-preto/40">{reviews.filter(r => r.review_rating === 5).length} de {stats.total}</p>
        </div>
        <div className={`rounded-2xl p-5 ${stats.noResponse.length > 0 ? "bg-amber-50 border border-amber-200" : "bg-branco border border-preto/8"}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${stats.noResponse.length > 0 ? "text-amber-600" : "text-preto/30"}`}>Sem resposta</p>
          <p className={`text-4xl font-bold ${stats.noResponse.length > 0 ? "text-amber-700" : "text-preto"}`}>{stats.noResponse.length}</p>
          <p className={`mt-1 text-xs ${stats.noResponse.length > 0 ? "text-amber-600" : "text-preto/40"}`}>reviews por responder</p>
        </div>
        <div className={`rounded-2xl p-5 ${stats.negative.length > 0 ? "bg-red-50 border border-red-200" : "bg-branco border border-preto/8"}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${stats.negative.length > 0 ? "text-red-600" : "text-preto/30"}`}>Alertas</p>
          <p className={`text-4xl font-bold ${stats.negative.length > 0 ? "text-red-600" : "text-preto"}`}>{stats.negative.length}</p>
          <p className={`mt-1 text-xs ${stats.negative.length > 0 ? "text-red-500" : "text-preto/40"}`}>reviews ≤ 3★</p>
        </div>
      </div>

      {/* ── Evolução + Tendência ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl bg-branco border border-preto/8 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-preto/40">Evolução do rating</p>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              {stats.trend === "up" ? "Em crescimento" : stats.trend === "down" ? "Em queda" : "Estável"}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={stats.evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#1a1a1a80" }} />
              <YAxis domain={[1,5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 11, fill: "#1a1a1a80" }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e8e4de", fontSize: 12 }}
                formatter={(v: number) => [`${v} ★`, "Rating médio"]}
                labelFormatter={(l) => `Mês: ${l}`}
              />
              <Line type="monotone" dataKey="avg" stroke="#0B2D6B" strokeWidth={2.5} dot={{ r: 4, fill: "#0B2D6B" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/40 mb-4">Distribuição</p>
          <div className="space-y-3">
            {stats.dist.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 w-12 shrink-0">
                  <span className="text-sm font-bold text-preto">{stars}</span>
                  <Star className="h-3 w-3 fill-signal text-signal" />
                </div>
                <div className="flex-1 h-2 rounded-full bg-preto/5 overflow-hidden">
                  <div className="h-full rounded-full bg-signal" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-preto/50 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-preto/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-preto/40">Últimos 3 meses</span>
              <span className="font-bold text-preto">{stats.recentAvg.toFixed(2)} ★</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-preto/40">3 meses anteriores</span>
              <span className="font-bold text-preto">{stats.olderAvg.toFixed(2)} ★</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Alertas accionáveis ── */}
      {(stats.negative.length > 0 || stats.noResponse.length > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Acções recomendadas</p>
          {stats.negative.length > 0 && (
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <span className="font-bold">{stats.negative.length} review(s) negativa(s)</span> — Responde publicamente com empatia e explica o contexto. Uma resposta bem feita transforma o impacto negativo.
              </p>
            </div>
          )}
          {stats.noResponse.length > 0 && (
            <div className="flex items-start gap-3">
              <MessageSquare className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <span className="font-bold">{stats.noResponse.length} review(s) sem resposta</span> — Responder a reviews positivas aumenta a percepção de cuidado e fideliza clientes.
              </p>
            </div>
          )}
          {stats.pct5 === 100 && (
            <div className="flex items-start gap-3">
              <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <span className="font-bold">Potencial de crescimento</span> — Com {stats.pct5}% de 5★, o Bioma tem perfil para aparecer em listas editoriais de fine dining nos Açores. Volume de reviews é o próximo objectivo.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Lista de reviews ── */}
      <div className="rounded-2xl bg-branco border border-preto/8 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-preto/5">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/40">
            Reviews ({filtered.length})
          </p>
          <div className="flex gap-2">
            {([
              ["all", "Todas"],
              ["positive", "Positivas"],
              ["negative", "Negativas"],
              ["no_response", "Sem resposta"],
            ] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${filter === val ? "bg-ocean text-white" : "bg-cream text-preto/50 hover:text-preto"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-preto/5 max-h-[600px] overflow-y-auto">
          {filtered.map((r, i) => (
            <div key={i} className={`px-6 py-4 ${r.review_rating <= 3 ? "bg-red-50/50" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className={`h-3.5 w-3.5 ${j < r.review_rating ? "fill-signal text-signal" : "fill-preto/10 text-preto/10"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-preto/30">{r.review_date.slice(0,10)}</span>
                  {r.review_rating <= 3 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">Atenção</span>
                  )}
                </div>
                {r.has_owner_response
                  ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><CheckCircle className="h-3 w-3" />Respondido</span>
                  : r.review_text
                    ? <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500"><MessageSquare className="h-3 w-3" />Sem resposta</span>
                    : null
                }
              </div>
              {r.review_text && (
                <p className="text-sm text-preto/70 leading-relaxed">{r.review_text}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
