"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase, BIOMA_PLACE_ID } from "@/lib/supabase"
import {
  Star, AlertTriangle, CheckCircle, MessageSquare, TrendingUp,
  TrendingDown, Minus, Loader2, Globe
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface Review {
  review_rating: number
  review_text: string | null
  review_date: string
  has_owner_response: boolean
  source: string
}

const STOPWORDS = new Set(["the","a","an","and","or","but","is","was","were","are","be","been","to","of","in","on","at","for","with","this","that","we","i","it","they","you","our","their","its","as","very","had","have","has","not","no","so","all","just","also","one","from","by","each","what","which","who","more","most","some","any","if","then","than","when","where","there","do","did","does","will","would","could","should","can","about","into","up","out","over","under","again","food","restaurant","place","experience","dinner","lunch","meal"])

function extractWords(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-záàâãéèêíïóôõöúçñ\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w))
}

const POSITIVE_PHRASES = [
  "michelin", "tasting menu", "chef's table", "local ingredients", "chefs rafael", "franco", "sea view", "ocean view",
  "attentive", "warm welcome", "exceptional", "fine dining", "fresh", "locally sourced", "wine pairing",
  "spectacular", "unforgettable", "passionate", "professional staff", "intimate", "terrace"
]
const NEGATIVE_PHRASES = [
  "expensive", "overpriced", "disappointed", "smell", "basic", "small portion", "slow service", "no flavor", "bland"
]

function countPhrases(reviews: Review[], phrases: string[]) {
  const counts: Record<string, number> = {}
  reviews.forEach(r => {
    if (!r.review_text) return
    const lower = r.review_text.toLowerCase()
    phrases.forEach(p => {
      if (lower.includes(p)) counts[p] = (counts[p] || 0) + 1
    })
  })
  return Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,8)
}

function parseDate(d: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return new Date(d)
  return null // relative dates like "3 days ago" excluded from time series
}

const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "positive" | "negative" | "no_response">("all")

  useEffect(() => {
    supabase
      .from("azorean_reviews")
      .select("review_rating, review_text, review_date, has_owner_response, source")
      .eq("google_place_id", BIOMA_PLACE_ID)
      .order("review_date", { ascending: false })
      .then(({ data }) => { setReviews((data as Review[]) || []); setLoading(false) })
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

    const withDate = reviews.map(r => ({ ...r, parsed: parseDate(r.review_date) })).filter(r => r.parsed) as (Review & { parsed: Date })[]
    const byMonth: Record<string, number[]> = {}
    withDate.forEach(r => {
      const d = r.parsed
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(r.review_rating)
    })
    const evolution = Object.entries(byMonth)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([key, ratings]) => {
        const [y, m] = key.split("-")
        return {
          month: `${MONTHS_PT[parseInt(m)-1]} ${y.slice(2)}`,
          avg: parseFloat((ratings.reduce((a,b) => a+b,0)/ratings.length).toFixed(2)),
          count: ratings.length
        }
      })

    const recent = evolution.slice(-3)
    const older = evolution.slice(-6, -3)
    const recentAvg = recent.length ? recent.reduce((a,m) => a+m.avg,0)/recent.length : 0
    const olderAvg = older.length ? older.reduce((a,m) => a+m.avg,0)/older.length : 0
    const trend = recentAvg > olderAvg + 0.05 ? "up" : recentAvg < olderAvg - 0.05 ? "down" : "stable"

    // Análise por trimestre
    const byQuarter: Record<string, number[]> = {}
    withDate.forEach(r => {
      const d = r.parsed
      const q = Math.floor(d.getMonth() / 3) + 1
      const key = `${d.getFullYear()}-Q${q}`
      if (!byQuarter[key]) byQuarter[key] = []
      byQuarter[key].push(r.review_rating)
    })
    const quarters = Object.entries(byQuarter)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([key, ratings]) => ({
        label: key.replace("-", " "),
        avg: parseFloat((ratings.reduce((a,b) => a+b,0)/ratings.length).toFixed(2)),
        count: ratings.length
      }))
    const qoq = quarters.map((q, i) => {
      if (i === 0) return { ...q, change: null as number | null }
      const change = parseFloat((q.avg - quarters[i-1].avg).toFixed(2))
      return { ...q, change }
    })

    const googleCount = reviews.filter(r => r.source === "google").length
    const tripadvisorCount = reviews.filter(r => r.source === "tripadvisor").length
    const respondedCount = reviews.filter(r => r.has_owner_response).length
    const reviewsWithText = reviews.filter(r => r.review_text).length
    const responseRate = reviewsWithText > 0 ? Math.round((respondedCount / reviewsWithText) * 100) : 0

    // Digital Score (0-100): combina rating, volume, % positivas, e taxa de resposta
    const ratingScore = (avg / 5) * 40 // até 40 pontos
    const volumeScore = Math.min((total / 300) * 25, 25) // até 25 pontos, satura aos 300 reviews
    const positiveScore = (pct5 / 100) * 20 // até 20 pontos
    const responseScore = (responseRate / 100) * 15 // até 15 pontos
    const digitalScore = Math.round(ratingScore + volumeScore + positiveScore + responseScore)

    const positiveWords = countPhrases(reviews.filter(r => r.review_rating >= 4), POSITIVE_PHRASES)
    const negativeWords = countPhrases(reviews.filter(r => r.review_rating <= 3), NEGATIVE_PHRASES)

    return { total, avg, pct5, negative, noResponse, dist, evolution, trend, recentAvg, olderAvg, googleCount, tripadvisorCount, positiveWords, negativeWords, qoq, respondedCount, responseRate, digitalScore, reviewsWithText }
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
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-preto/30">Reviews</p>
          <h1 className="mt-1 text-2xl font-serif font-bold text-preto">Inteligência de reputação</h1>
          <p className="text-sm text-preto/50">{stats.total} reviews totais</p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 rounded-lg bg-branco border border-preto/8 px-3 py-1.5 text-xs font-bold text-preto/60">
            <Globe className="h-3.5 w-3.5 text-[#4285F4]" />Google: {stats.googleCount}
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-branco border border-preto/8 px-3 py-1.5 text-xs font-bold text-preto/60">
            <Star className="h-3.5 w-3.5 text-[#00AF87]" />TripAdvisor: {stats.tripadvisorCount}
          </span>
        </div>
      </div>

      {/* KPIs */}
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

      {/* Evolução + Distribuição */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl bg-branco border border-preto/8 p-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-preto/40">Evolução do rating por mês</p>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              {stats.trend === "up" ? "Em crescimento" : stats.trend === "down" ? "Em queda" : "Estável"}
            </div>
          </div>
          <p className="text-[11px] text-preto/30 mb-3">Apenas reviews com data exacta (TripAdvisor)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={stats.evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#1a1a1a80" }} />
              <YAxis domain={[1,5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 11, fill: "#1a1a1a80" }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e8e4de", fontSize: 12 }}
                formatter={(v: number, name: string, props: any) => [`${v} ★  (${props.payload.count} reviews)`, "Rating médio"]}
                labelFormatter={(l) => `${l}`}
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
              <span className="font-bold text-preto">{stats.recentAvg > 0 ? stats.recentAvg.toFixed(2) + " ★" : "—"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-preto/40">3 meses anteriores</span>
              <span className="font-bold text-preto">{stats.olderAvg > 0 ? stats.olderAvg.toFixed(2) + " ★" : "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Análise por trimestre */}
      {stats.qoq.length > 0 && (
        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/40 mb-1">Evolução trimestral (QoQ)</p>
          <p className="text-[11px] text-preto/30 mb-4">Comparação trimestre a trimestre — apenas reviews com data exacta</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.qoq.map((q, i) => (
              <div key={i} className="rounded-xl bg-cream p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-preto/30">{q.label}</p>
                <div className="flex items-end gap-1.5 mt-1">
                  <p className="text-2xl font-bold text-preto">{q.avg}</p>
                  <Star className="h-3.5 w-3.5 fill-signal text-signal mb-1" />
                </div>
                <p className="text-xs text-preto/40">{q.count} reviews</p>
                {q.change !== null && (
                  <div className={`mt-1.5 flex items-center gap-1 text-xs font-bold ${q.change > 0 ? "text-emerald-600" : q.change < 0 ? "text-red-500" : "text-preto/40"}`}>
                    {q.change > 0 ? <TrendingUp className="h-3 w-3" /> : q.change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {q.change > 0 ? "+" : ""}{q.change} vs anterior
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Palavras mais mencionadas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4">Mais mencionado — Positivo</p>
          {stats.positiveWords.length > 0 ? (
            <div className="space-y-2">
              {stats.positiveWords.map(([word, count]) => (
                <div key={word} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-preto capitalize flex-1">{word}</span>
                  <div className="h-1.5 rounded-full bg-emerald-100 overflow-hidden w-24">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(count / stats.positiveWords[0][1]) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 w-6 text-right">{count}x</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-preto/40">Sem dados suficientes</p>}
        </div>
        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-4">Mais mencionado — A melhorar</p>
          {stats.negativeWords.length > 0 ? (
            <div className="space-y-2">
              {stats.negativeWords.map(([word, count]) => (
                <div key={word} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-preto capitalize flex-1">{word}</span>
                  <div className="h-1.5 rounded-full bg-red-100 overflow-hidden w-24">
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${(count / stats.negativeWords[0][1]) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-red-500 w-6 text-right">{count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              <p className="text-sm font-semibold">Nenhuma queixa recorrente identificada</p>
            </div>
          )}
        </div>
      </div>

      {/* Alertas */}
      {(stats.negative.length > 0 || stats.noResponse.length > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Acções recomendadas</p>
          {stats.negative.length > 0 && (
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <span className="font-bold">{stats.negative.length} review(s) negativa(s)</span> — Responde publicamente com empatia. Uma resposta bem feita transforma o impacto negativo.
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
        </div>
      )}

      {/* Lista */}
      <div className="rounded-2xl bg-branco border border-preto/8 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-preto/5">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/40">Reviews ({filtered.length})</p>
          <div className="flex gap-2">
            {([
              ["all", "Todas"], ["positive", "Positivas"], ["negative", "Negativas"], ["no_response", "Sem resposta"],
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
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className={`h-3.5 w-3.5 ${j < r.review_rating ? "fill-signal text-signal" : "fill-preto/10 text-preto/10"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-preto/30">{r.review_date}</span>
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${r.source === "google" ? "bg-blue-50 text-[#4285F4]" : "bg-emerald-50 text-[#00AF87]"}`}>
                    {r.source === "google" ? "Google" : "TripAdvisor"}
                  </span>
                  {r.review_rating <= 3 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">Atenção</span>
                  )}
                </div>
                {r.has_owner_response
                  ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 shrink-0"><CheckCircle className="h-3 w-3" />Respondido</span>
                  : r.review_text
                    ? <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 shrink-0"><MessageSquare className="h-3 w-3" />Sem resposta</span>
                    : null
                }
              </div>
              {r.review_text && <p className="text-sm text-preto/70 leading-relaxed">{r.review_text}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
