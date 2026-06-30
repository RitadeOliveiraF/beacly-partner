"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase, BIOMA_PLACE_ID } from "@/lib/supabase"
import {
  Star, AlertTriangle, CheckCircle, MessageSquare, TrendingUp,
  TrendingDown, Minus, Loader2, Globe, X
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface Review {
  review_rating: number
  review_text: string | null
  review_date: string
  has_owner_response: boolean
  source: string
}

const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

const POSITIVE_PHRASES = [
  "michelin", "tasting menu", "chef's table", "local ingredients", "franco", "sea view", "ocean view",
  "attentive", "warm welcome", "exceptional", "fine dining", "fresh", "locally sourced", "wine pairing",
  "spectacular", "unforgettable", "passionate", "professional staff", "intimate", "terrace"
]
const NEGATIVE_PHRASES = [
  "expensive", "overpriced", "disappointed", "smell", "basic", "small portion", "slow service", "no flavor", "bland"
]

const RESPONSE_TIERS = [
  { label: "Exemplar", min: 80, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", desc: "Responde à grande maioria das reviews" },
  { label: "Bom", min: 50, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", desc: "Acima da média do sector" },
  { label: "Médio", min: 25, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", desc: "Abaixo da média dos restaurantes de fine dining (>60%)" },
  { label: "Baixo", min: 0, color: "text-red-600", bg: "bg-red-50 border-red-200", desc: "Muito abaixo da média dos restaurantes de fine dining (>60%)" },
]

function getTier(rate: number) {
  return RESPONSE_TIERS.find(t => rate >= t.min) || RESPONSE_TIERS[RESPONSE_TIERS.length - 1]
}

function parseDate(d: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return new Date(d)
  return null
}

function countPhrases(reviews: Review[], phrases: string[]) {
  const counts: Record<string, number> = {}
  reviews.forEach(r => {
    if (!r.review_text) return
    const lower = r.review_text.toLowerCase()
    phrases.forEach(p => { if (lower.includes(p)) counts[p] = (counts[p] || 0) + 1 })
  })
  return Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,8)
}

function getReviewsForPhrase(reviews: Review[], phrase: string) {
  return reviews.filter(r => r.review_text?.toLowerCase().includes(phrase))
}

type TimeWindow = "3m" | "6m" | "all"

function filterByWindow(reviews: Review[], window: TimeWindow): Review[] {
  if (window === "all") return reviews
  const now = new Date()
  const months = window === "3m" ? 3 : 6
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, 1)
  return reviews.filter(r => {
    const d = parseDate(r.review_date)
    return d && d >= cutoff
  })
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "positive" | "negative" | "no_response">("all")
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("6m")
  const [modal, setModal] = useState<{ phrase: string; reviews: Review[] } | null>(null)

  useEffect(() => {
    supabase
      .from("azorean_reviews")
      .select("review_rating, review_text, review_date, has_owner_response, source")
      .eq("google_place_id", BIOMA_PLACE_ID)
      .order("review_date", { ascending: false })
      .then(({ data }) => { setReviews((data as Review[]) || []); setLoading(false) })
  }, [])

  const windowedReviews = useMemo(() => filterByWindow(reviews, timeWindow), [reviews, timeWindow])

  const stats = useMemo(() => {
    const r = windowedReviews
    if (!r.length) return null
    const total = r.length
    const avg = r.reduce((a, rv) => a + rv.review_rating, 0) / total
    const pct5 = Math.round((r.filter(rv => rv.review_rating === 5).length / total) * 100)
    const negative = r.filter(rv => rv.review_rating <= 3)
    const reviewsWithText = r.filter(rv => rv.review_text).length
    const respondedCount = r.filter(rv => rv.has_owner_response).length
    const responseRate = reviewsWithText > 0 ? Math.round((respondedCount / reviewsWithText) * 100) : 0
    const tier = getTier(responseRate)

    const dist = [5,4,3,2,1].map(s => ({
      stars: s,
      count: r.filter(rv => rv.review_rating === s).length,
      pct: Math.round((r.filter(rv => rv.review_rating === s).length / total) * 100)
    }))

    const withDate = r.map(rv => ({ ...rv, parsed: parseDate(rv.review_date) })).filter(rv => rv.parsed) as (Review & { parsed: Date })[]
    const byMonth: Record<string, number[]> = {}
    withDate.forEach(rv => {
      const d = rv.parsed
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(rv.review_rating)
    })
    const evolution = Object.entries(byMonth).sort(([a],[b]) => a.localeCompare(b)).map(([key, ratings]) => {
      const [y, m] = key.split("-")
      return { month: `${MONTHS_PT[parseInt(m)-1]} ${y.slice(2)}`, avg: parseFloat((ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(2)), count: ratings.length }
    })

    const recent = evolution.slice(-3)
    const older = evolution.slice(-6,-3)
    const recentAvg = recent.length ? recent.reduce((a,m)=>a+m.avg,0)/recent.length : 0
    const olderAvg = older.length ? older.reduce((a,m)=>a+m.avg,0)/older.length : 0
    const trend = recentAvg > olderAvg + 0.05 ? "up" : recentAvg < olderAvg - 0.05 ? "down" : "stable"

    const byQuarter: Record<string, number[]> = {}
    withDate.forEach(rv => {
      const d = rv.parsed
      const q = Math.floor(d.getMonth()/3)+1
      const key = `${d.getFullYear()}-Q${q}`
      if (!byQuarter[key]) byQuarter[key] = []
      byQuarter[key].push(rv.review_rating)
    })
    const qoq = Object.entries(byQuarter).sort(([a],[b]) => a.localeCompare(b)).map(([key, ratings], i, arr) => {
      const avg2 = parseFloat((ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(2))
      const prev = i > 0 ? parseFloat((arr[i-1][1].reduce((a:number,b:number)=>a+b,0)/arr[i-1][1].length).toFixed(2)) : null
      return { label: key.replace("-"," "), avg: avg2, count: ratings.length, change: prev !== null ? parseFloat((avg2-prev).toFixed(2)) : null }
    })

    const googleCount = r.filter(rv => rv.source === "google").length
    const tripadvisorCount = r.filter(rv => rv.source === "tripadvisor").length

    const ratingScore = (avg / 5) * 40
    const volumeScore = Math.min((reviews.length / 300) * 25, 25)
    const positiveScore = (pct5 / 100) * 20
    const responseScore = (responseRate / 100) * 15
    const digitalScore = Math.round(ratingScore + volumeScore + positiveScore + responseScore)

    const positiveWords = countPhrases(r.filter(rv => rv.review_rating >= 4), POSITIVE_PHRASES)
    const negativeWords = countPhrases(r.filter(rv => rv.review_rating <= 3), NEGATIVE_PHRASES)

    return { total, avg, pct5, negative, dist, evolution, trend, recentAvg, olderAvg, qoq, googleCount, tripadvisorCount, respondedCount, responseRate, reviewsWithText, tier, digitalScore, positiveWords, negativeWords }
  }, [windowedReviews, reviews.length])

  const filtered = useMemo(() => {
    const base = windowedReviews
    if (filter === "positive") return base.filter(r => r.review_rating >= 4)
    if (filter === "negative") return base.filter(r => r.review_rating <= 3)
    if (filter === "no_response") return base.filter(r => !r.has_owner_response && r.review_text)
    return base
  }, [windowedReviews, filter])

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="h-6 w-6 animate-spin text-ocean" /></div>
  if (!stats) return null

  const TrendIcon = stats.trend === "up" ? TrendingUp : stats.trend === "down" ? TrendingDown : Minus
  const trendColor = stats.trend === "up" ? "text-emerald-600" : stats.trend === "down" ? "text-red-500" : "text-amber-500"

  return (
    <div className="p-8 space-y-6">
      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-preto/40 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-branco rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-preto/8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-preto/30">Menção</p>
                <p className="text-lg font-bold text-preto capitalize">{modal.phrase}</p>
              </div>
              <button onClick={() => setModal(null)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-cream transition-colors">
                <X className="h-4 w-4 text-preto/50" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4 space-y-4">
              <p className="text-xs text-preto/40">{modal.reviews.length} review(s) mencionam "{modal.phrase}"</p>
              {modal.reviews.map((r, i) => (
                <div key={i} className={`rounded-xl p-4 ${r.review_rating <= 3 ? "bg-red-50 border border-red-100" : "bg-cream"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_,j) => <Star key={j} className={`h-3 w-3 ${j < r.review_rating ? "fill-signal text-signal" : "fill-preto/10 text-preto/10"}`} />)}
                    </div>
                    <span className="text-xs text-preto/30">{r.review_date.slice(0,10)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.source === "google" ? "bg-blue-50 text-[#4285F4]" : "bg-emerald-50 text-[#00AF87]"}`}>
                      {r.source === "google" ? "Google" : "TripAdvisor"}
                    </span>
                  </div>
                  {r.review_text && (
                    <p className="text-sm text-preto/70 leading-relaxed" dangerouslySetInnerHTML={{
                      __html: r.review_text.replace(new RegExp(modal.phrase, "gi"), m => `<mark class="bg-signal/20 rounded px-0.5 font-semibold">${m}</mark>`)
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header + time window */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-preto/30">Reviews</p>
          <h1 className="mt-1 text-2xl font-serif font-bold text-preto">Inteligência de reputação</h1>
          <p className="text-sm text-preto/50">{stats.total} reviews no período · {reviews.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-xl bg-cream p-1">
            {([["3m","3 meses"],["6m","6 meses"],["all","Todos"]] as const).map(([val,label]) => (
              <button key={val} onClick={() => setTimeWindow(val)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${timeWindow === val ? "bg-ocean text-white" : "text-preto/50 hover:text-preto"}`}>
                {label}
              </button>
            ))}
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
      </div>

      {/* Digital Score */}
      <div className="rounded-2xl bg-ocean text-white p-6 flex items-center gap-6">
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-white/10 shrink-0">
          <p className="text-3xl font-bold leading-none">{stats.digitalScore}</p>
          <p className="text-[10px] opacity-60 mt-0.5">/100</p>
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider opacity-60">beacly Digital Score</p>
          <p className="text-sm opacity-80 mt-0.5">Combina rating, volume de reviews, % de 5★ e taxa de resposta</p>
          <div className="mt-2 flex gap-4 text-xs opacity-60">
            <span>Rating: {stats.avg.toFixed(1)}/5</span>
            <span>·</span>
            <span>Volume: {reviews.length} reviews</span>
            <span>·</span>
            <span>Resposta: {stats.responseRate}%</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-branco border border-preto/8 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/30 mb-1">Rating médio</p>
          <div className="flex items-end gap-1.5">
            <p className="text-4xl font-bold text-preto">{stats.avg.toFixed(1)}</p>
            <Star className="h-5 w-5 fill-signal text-signal mb-1" />
          </div>
          <p className="mt-1 text-xs text-preto/40">{stats.total} reviews no período</p>
        </div>
        <div className="rounded-2xl bg-branco border border-preto/8 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/30 mb-1">Reviews 5★</p>
          <p className="text-4xl font-bold text-preto">{stats.pct5}%</p>
          <p className="mt-1 text-xs text-preto/40">{reviews.filter(r => r.review_rating === 5).length} total histórico</p>
        </div>

        {/* Taxa de resposta com tier */}
        <div className={`rounded-2xl p-5 border ${stats.tier.bg}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${stats.tier.color}`}>Taxa de resposta</p>
          <div className="flex items-end gap-2">
            <p className={`text-4xl font-bold ${stats.tier.color}`}>{stats.responseRate}%</p>
            <span className={`mb-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${stats.tier.bg} ${stats.tier.color}`}>{stats.tier.label}</span>
          </div>
          <p className={`mt-1 text-xs ${stats.tier.color} opacity-80`}>{stats.tier.desc}</p>
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
          <p className="text-[11px] text-preto/30 mb-3">Reviews com data exacta (TripAdvisor + Google convertido)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={stats.evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#1a1a1a80" }} />
              <YAxis domain={[1,5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 11, fill: "#1a1a1a80" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e8e4de", fontSize: 12 }}
                formatter={(v: number, _: string, props: any) => [`${v} ★  (${props.payload.count} reviews)`, "Rating médio"]}
                labelFormatter={(l) => `${l}`} />
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

      {/* QoQ */}
      {stats.qoq.length > 0 && (
        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/40 mb-1">Evolução trimestral (QoQ)</p>
          <p className="text-[11px] text-preto/30 mb-4">Comparação trimestre a trimestre</p>
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

      {/* Keywords com modal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Mais mencionado — Positivo</p>
          <p className="text-[11px] text-preto/30 mb-4">Clica para ver as reviews</p>
          {stats.positiveWords.length > 0 ? (
            <div className="space-y-2">
              {stats.positiveWords.map(([phrase, count]) => (
                <button key={phrase} onClick={() => setModal({ phrase, reviews: getReviewsForPhrase(windowedReviews.filter(r => r.review_rating >= 4), phrase) })}
                  className="w-full flex items-center gap-3 rounded-xl hover:bg-cream px-2 py-1.5 transition-colors group text-left">
                  <span className="text-sm font-semibold text-preto capitalize flex-1 group-hover:text-ocean transition-colors">{phrase}</span>
                  <div className="h-1.5 rounded-full bg-emerald-100 overflow-hidden w-24">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(count / stats.positiveWords[0][1]) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 w-8 text-right">{count}x</span>
                </button>
              ))}
            </div>
          ) : <p className="text-sm text-preto/40">Sem dados suficientes</p>}
        </div>
        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">Mais mencionado — A melhorar</p>
          <p className="text-[11px] text-preto/30 mb-4">Clica para ver o contexto exacto</p>
          {stats.negativeWords.length > 0 ? (
            <div className="space-y-2">
              {stats.negativeWords.map(([phrase, count]) => (
                <button key={phrase} onClick={() => setModal({ phrase, reviews: getReviewsForPhrase(windowedReviews.filter(r => r.review_rating <= 3), phrase) })}
                  className="w-full flex items-center gap-3 rounded-xl hover:bg-cream px-2 py-1.5 transition-colors group text-left">
                  <span className="text-sm font-semibold text-preto capitalize flex-1 group-hover:text-red-500 transition-colors">{phrase}</span>
                  <div className="h-1.5 rounded-full bg-red-100 overflow-hidden w-24">
                    <div className="h-full rounded-full bg-red-400" style={{ width: `${(count / (stats.negativeWords[0][1] || 1)) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-red-500 w-8 text-right">{count}x</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              <p className="text-sm font-semibold">Nenhuma queixa recorrente no período</p>
            </div>
          )}
        </div>
      </div>

      {/* Alertas */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Acções recomendadas</p>
        {stats.negative.length > 0 && (
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <span className="font-bold">{stats.negative.length} review(s) negativa(s) no período</span> — Responde publicamente com empatia. Uma resposta bem feita transforma o impacto negativo.
            </p>
          </div>
        )}
        <div className="flex items-start gap-3">
          <MessageSquare className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">Taxa de resposta: {stats.tier.label} ({stats.responseRate}%)</span> — {stats.tier.desc}. Os restaurantes de fine dining com melhor desempenho respondem a mais de 60% das reviews, o que aumenta a confiança de novos clientes e o score na plataforma.
          </p>
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-2xl bg-branco border border-preto/8 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-preto/5">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/40">Reviews ({filtered.length})</p>
          <div className="flex gap-2">
            {([["all","Todas"],["positive","Positivas"],["negative","Negativas"],["no_response","Sem resposta"]] as const).map(([val,label]) => (
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
                    {[...Array(5)].map((_,j) => <Star key={j} className={`h-3.5 w-3.5 ${j < r.review_rating ? "fill-signal text-signal" : "fill-preto/10 text-preto/10"}`} />)}
                  </div>
                  <span className="text-xs text-preto/30">{r.review_date.slice(0,10)}</span>
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${r.source === "google" ? "bg-blue-50 text-[#4285F4]" : "bg-emerald-50 text-[#00AF87]"}`}>
                    {r.source === "google" ? "Google" : "TripAdvisor"}
                  </span>
                  {r.review_rating <= 3 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">Atenção</span>}
                </div>
                {r.has_owner_response
                  ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 shrink-0"><CheckCircle className="h-3 w-3" />Respondido</span>
                  : r.review_text ? <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 shrink-0"><MessageSquare className="h-3 w-3" />Sem resposta</span> : null
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
