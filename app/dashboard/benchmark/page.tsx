"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase, BIOMA_PLACE_ID } from "@/lib/supabase"
import { Star, TrendingUp, Info, Loader2 } from "lucide-react"

interface Review {
  google_place_id: string
  restaurant_name: string
  review_rating: number
  review_text: string | null
}

interface SpaceScore {
  pid: string
  name: string
  n: number
  avg_rating: number
  pct_positive: number
  pct_negative: number
  consistency: number
  composite: number
}

const POSITIVE_STRONG = [
  "exceptional","outstanding","incredible","amazing","unforgettable","michelin",
  "fantastic","excellent","magnificent","wonderful","sublime","spectacular",
  "perfect","extraordinary","best","highly recommend","five star"
]
const NEGATIVE_STRONG = [
  "disappointed","terrible","awful","horrible","worst","disgusting","bad","poor",
  "overpriced","rude","slow","cold food","dirty","avoid","tasteless","bland","no flavor","no flavour"
]

function sentiment(text: string | null): number | null {
  if (!text) return null
  const lower = text.toLowerCase()
  const pos = POSITIVE_STRONG.filter(w => lower.includes(w)).length
  const neg = NEGATIVE_STRONG.filter(w => lower.includes(w)).length
  return pos - neg
}

function computeScores(reviews: Review[]): SpaceScore[] {
  const byPlace: Record<string, { name: string; ratings: number[]; sentiments: number[] }> = {}
  for (const rv of reviews) {
    if (!rv.review_rating) continue
    if (!byPlace[rv.google_place_id]) byPlace[rv.google_place_id] = { name: rv.restaurant_name, ratings: [], sentiments: [] }
    byPlace[rv.google_place_id].ratings.push(rv.review_rating)
    const s = sentiment(rv.review_text)
    if (s !== null) byPlace[rv.google_place_id].sentiments.push(s)
  }
  const results: SpaceScore[] = []
  for (const [pid, data] of Object.entries(byPlace)) {
    const n = data.ratings.length
    if (n < 20) continue
    const avg_rating = data.ratings.reduce((a,b) => a+b, 0) / n
    const sents = data.sentiments
    const pct_positive = sents.length ? sents.filter(s => s > 0).length / sents.length : 0
    const pct_negative = sents.length ? sents.filter(s => s < 0).length / sents.length : 0
    const variance = data.ratings.reduce((a,r) => a + (r-avg_rating)**2, 0) / n
    const consistency = Math.max(0, 1 - Math.sqrt(variance) / 2)
    const composite = (avg_rating/5)*40 + pct_positive*40 + consistency*20
    results.push({
      pid, name: data.name, n,
      avg_rating: Math.round(avg_rating * 100)/100,
      pct_positive: Math.round(pct_positive * 1000)/10,
      pct_negative: Math.round(pct_negative * 1000)/10,
      consistency: Math.round(consistency * 1000)/1000,
      composite: Math.round(composite * 100)/100
    })
  }
  return results.sort((a, b) => b.composite - a.composite)
}

export default function Benchmark() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      let all: Review[] = []
      let from = 0
      while (true) {
        const { data } = await supabase
          .from("azorean_reviews")
          .select("google_place_id, restaurant_name, review_rating, review_text")
          .range(from, from + 999)
        if (!data || data.length === 0) break
        all = [...all, ...(data as Review[])]
        if (data.length < 1000) break
        from += 1000
      }
      setReviews(all)
      setLoading(false)
    }
    fetchAll()
  }, [])

  const scores = useMemo(() => computeScores(reviews), [reviews])
  const bioma = scores.find(s => s.pid === BIOMA_PLACE_ID)
  const biomaRank = scores.findIndex(s => s.pid === BIOMA_PLACE_ID) + 1
  const top10 = scores.slice(0, 10)
  const biomaInTop10 = top10.some(s => s.pid === BIOMA_PLACE_ID)

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-6 w-6 animate-spin text-ocean" />
    </div>
  )

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-preto/30">Benchmark</p>
        <h1 className="mt-1 text-2xl font-serif font-bold text-preto">Posição competitiva</h1>
        <p className="text-sm text-preto/50">{scores.length} espaços analisados com ≥20 reviews · Açores</p>
      </div>

      {/* Metodologia */}
      <div className="rounded-2xl border border-ocean/20 bg-ocean/5 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-ocean shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-ocean mb-0.5">Como é calculado o score</p>
          <p className="text-xs text-preto/60">O score composto combina três factores: <span className="font-semibold">rating médio</span> (40%), <span className="font-semibold">sentimento positivo</span> nas reviews — menções a palavras como "exceptional", "michelin", "unforgettable" — (40%), e <span className="font-semibold">consistência</span> ao longo do tempo (20%). Isto penaliza espaços com ratings instáveis e valoriza qualidade real de experiência.</p>
        </div>
      </div>

      {/* Destaque Bioma */}
      {bioma && (
        <div className="rounded-2xl bg-ocean text-white p-6 flex items-center gap-6">
          <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-white/10 shrink-0">
            <p className="text-3xl font-bold leading-none">#{biomaRank}</p>
            <p className="text-[10px] opacity-60 mt-0.5">de {scores.length}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider opacity-60">Bioma Restaurant · Açores</p>
            <p className="text-lg font-bold mt-0.5">Score composto: {bioma.composite}</p>
            <div className="mt-2 grid grid-cols-3 gap-4 text-xs opacity-70">
              <div><p className="opacity-60">Rating médio</p><p className="font-bold text-base">{bioma.avg_rating}★</p></div>
              <div><p className="opacity-60">Sentimento positivo</p><p className="font-bold text-base">{bioma.pct_positive}%</p></div>
              <div><p className="opacity-60">Negativo</p><p className="font-bold text-base">{bioma.pct_negative}%</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela top 10 + Bioma se fora */}
      <div className="rounded-2xl bg-branco border border-preto/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-preto/5">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/40">Ranking por score composto — Açores (≥20 reviews)</p>
        </div>
        <div className="divide-y divide-preto/5">
          {top10.map((s, i) => {
            const isBioma = s.pid === BIOMA_PLACE_ID
            return (
              <div key={s.pid} className={`flex items-center gap-4 px-6 py-4 ${isBioma ? "bg-ocean/5" : ""}`}>
                <span className={`text-sm font-bold w-6 shrink-0 ${isBioma ? "text-ocean" : "text-preto/30"}`}>#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold truncate ${isBioma ? "text-ocean" : "text-preto"}`}>{s.name}</p>
                    {isBioma && <span className="rounded-full bg-ocean/10 px-2 py-0.5 text-[10px] font-bold text-ocean shrink-0">Tu</span>}
                  </div>
                  <p className="text-xs text-preto/40">{s.n} reviews analisadas</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="h-3.5 w-3.5 fill-signal text-signal" />
                  <span className="text-sm font-bold text-preto">{s.avg_rating}</span>
                </div>
                <div className="w-20 text-right shrink-0">
                  <p className="text-xs text-preto/40">Positivo</p>
                  <p className="text-sm font-bold text-emerald-600">{s.pct_positive}%</p>
                </div>
                <div className="w-16 text-right shrink-0">
                  <p className="text-xs text-preto/40">Score</p>
                  <p className="text-sm font-bold text-preto">{s.composite}</p>
                </div>
              </div>
            )
          })}
          {!biomaInTop10 && bioma && (
            <>
              <div className="px-6 py-2 bg-preto/3">
                <p className="text-xs text-preto/30 text-center">···</p>
              </div>
              <div className="flex items-center gap-4 px-6 py-4 bg-ocean/5">
                <span className="text-sm font-bold w-6 shrink-0 text-ocean">#{biomaRank}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-ocean truncate">{bioma.name}</p>
                    <span className="rounded-full bg-ocean/10 px-2 py-0.5 text-[10px] font-bold text-ocean shrink-0">Tu</span>
                  </div>
                  <p className="text-xs text-preto/40">{bioma.n} reviews analisadas</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="h-3.5 w-3.5 fill-signal text-signal" />
                  <span className="text-sm font-bold text-preto">{bioma.avg_rating}</span>
                </div>
                <div className="w-20 text-right shrink-0">
                  <p className="text-xs text-preto/40">Positivo</p>
                  <p className="text-sm font-bold text-emerald-600">{bioma.pct_positive}%</p>
                </div>
                <div className="w-16 text-right shrink-0">
                  <p className="text-xs text-preto/40">Score</p>
                  <p className="text-sm font-bold text-preto">{bioma.composite}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* O que o score significa para o Bioma */}
      {bioma && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-branco border border-preto/8 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-preto/30 mb-1">Sentimento positivo</p>
            <p className="text-3xl font-bold text-emerald-600">{bioma.pct_positive}%</p>
            <p className="mt-1 text-xs text-preto/40">das reviews com texto mencionam qualidade excepcional</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" />Acima da média dos {scores.length} espaços ({Math.round(scores.reduce((a,s)=>a+s.pct_positive,0)/scores.length)}%)
            </div>
          </div>
          <div className="rounded-2xl bg-branco border border-preto/8 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-preto/30 mb-1">Sentimento negativo</p>
            <p className="text-3xl font-bold text-preto">{bioma.pct_negative}%</p>
            <p className="mt-1 text-xs text-preto/40">das reviews com texto mencionam aspectos negativos</p>
            <div className="mt-3 text-xs text-preto/40">
              Média dos {scores.length} espaços: {Math.round(scores.reduce((a,s)=>a+s.pct_negative,0)/scores.length)}%
            </div>
          </div>
          <div className="rounded-2xl bg-branco border border-preto/8 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-preto/30 mb-1">Consistência</p>
            <p className="text-3xl font-bold text-preto">{Math.round(bioma.consistency*100)}%</p>
            <p className="mt-1 text-xs text-preto/40">estabilidade do rating ao longo do tempo</p>
            <div className="mt-3 text-xs text-preto/40">
              Baixa variância = experiência previsível e fiável
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
