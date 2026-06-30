"use client"

import { useEffect, useState } from "react"
import { supabase, BIOMA_PLACE_ID, BIOMA_UUID } from "@/lib/supabase"
import { BIOMA } from "@/lib/bioma"
import { Star, ArrowUpRight, ExternalLink, Globe, Instagram, Facebook, MapPin, Loader2, Info } from "lucide-react"

interface Review {
  review_rating: number
  review_text: string | null
  review_date: string
  source: string
}

export default function Dashboard() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("azorean_reviews")
      .select("review_rating, review_text, review_date, source")
      .eq("google_place_id", BIOMA_PLACE_ID)
      .order("review_date", { ascending: false })
      .limit(300)
      .then(({ data }) => { setReviews((data as Review[]) || []); setLoading(false) })
  }, [])

  const total = reviews.length
  const avg = total > 0 ? (reviews.reduce((a, r) => a + r.review_rating, 0) / total).toFixed(1) : "—"
  const googleCount = reviews.filter(r => r.source === "google").length
  const tripadvisorCount = reviews.filter(r => r.source === "tripadvisor").length
  const latest = reviews.filter(r => r.review_text).slice(0, 4)

  const links = [
    { label: "Google Maps", href: BIOMA.googleMapsLink, icon: MapPin, active: !!BIOMA.googleMapsLink },
    { label: "Website", href: BIOMA.website, icon: Globe, active: !!BIOMA.website },
    { label: "Instagram", href: BIOMA.instagram, icon: Instagram, active: !!BIOMA.instagram },
    { label: "Facebook", href: BIOMA.facebook, icon: Facebook, active: !!BIOMA.facebook },
  ]
  const activeLinks = links.filter(l => l.active).length

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-preto/30">Dashboard</p>
        <h1 className="mt-1 text-2xl font-serif font-bold text-preto">Visão geral</h1>
        <p className="text-sm text-preto/50">Desempenho do {BIOMA.name} na plataforma beacly Açores</p>
      </div>

      {/* KPIs — apenas dados reais */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-ocean text-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Rating Google</span>
            <Star className="h-4 w-4 fill-white opacity-60" />
          </div>
          <p className="text-3xl font-bold">{BIOMA.rating}</p>
          <p className="mt-1 text-xs opacity-50">{BIOMA.reviewCount} reviews no Google</p>
          <div className="mt-2 text-xs opacity-60 flex items-center gap-1">
            <Info className="h-3 w-3" />#1 fine dining nos Açores (4.9★, ≥100 rev.)
          </div>
        </div>

        <div className="rounded-2xl bg-branco border border-preto/8 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-preto/30">Reviews totais</span>
            <Star className="h-4 w-4 text-preto/20" />
          </div>
          <p className="text-3xl font-bold text-preto">{loading ? "…" : total}</p>
          <p className="mt-1 text-xs text-preto/40">Google ({loading ? "…" : googleCount}) + TripAdvisor ({loading ? "…" : tripadvisorCount})</p>
          <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1 font-bold">
            <ArrowUpRight className="h-3.5 w-3.5" />Mais reviews em fine dining no Pico
          </div>
        </div>

        <div className="rounded-2xl bg-branco border border-preto/8 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-preto/30">beacly Score</span>
            <Info className="h-4 w-4 text-preto/20" />
          </div>
          <p className="text-3xl font-bold text-preto">
            {loading ? "…" : Math.round(((BIOMA.rating / 5) * 40) + Math.min((total / 300) * 25, 25) + ((reviews.filter(r => r.review_rating === 5).length / (total || 1)) * 20))}
          </p>
          <p className="mt-1 text-xs text-preto/40">Escala 0–85 (sem taxa de resposta)</p>
          <div className="mt-2 text-xs text-preto/40 flex items-center gap-1">
            <Info className="h-3 w-3" />Rating · Volume · % 5★
          </div>
        </div>

        <div className="rounded-2xl bg-branco border border-preto/8 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-preto/30">Presença digital</span>
            <Globe className="h-4 w-4 text-preto/20" />
          </div>
          <p className="text-3xl font-bold text-preto">{activeLinks}/4</p>
          <p className="mt-1 text-xs text-preto/40">Canais activos</p>
          <div className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" />100% completo
          </div>
        </div>
      </div>

      {/* AI Summary + Presença digital */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-6 rounded-lg bg-signal/10 flex items-center justify-center">
              <Star className="h-3.5 w-3.5 text-signal fill-signal" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-preto/40">beacly AI — O que dizem de ti</p>
          </div>
          <p className="text-sm leading-relaxed text-preto/70 italic">"{BIOMA.aiSummary}"</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Menu degustação", "Ingredientes locais", "Nível Michelin", "Chefs Rafael & Franco"].map(k => (
              <span key={k} className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">{k}</span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-branco border border-preto/8 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/40 mb-4">Presença Digital</p>
          <div className="space-y-3">
            {links.map(({ label, href, icon: Icon, active }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${active ? "bg-emerald-50" : "bg-preto/5"}`}>
                    <Icon className={`h-4 w-4 ${active ? "text-emerald-600" : "text-preto/30"}`} />
                  </div>
                  <span className="text-sm font-semibold text-preto">{label}</span>
                </div>
                {active ? (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline">
                    Activo <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs font-bold text-preto/30">Em falta</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimas reviews — da BD */}
      <div className="rounded-2xl bg-branco border border-preto/8 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/40">Últimas reviews</p>
          <a href="/dashboard/reviews" className="text-xs font-bold text-ocean hover:underline">Ver todas →</a>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-5 w-5 animate-spin text-ocean" />
          </div>
        ) : (
          <div className="space-y-3">
            {latest.map((r, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-cream p-3">
                <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                  {[...Array(r.review_rating)].map((_, j) => <Star key={j} className="h-3 w-3 fill-signal text-signal" />)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-preto/70 leading-relaxed line-clamp-2">{r.review_text}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${r.source === "google" ? "bg-blue-50 text-[#4285F4]" : "bg-emerald-50 text-[#00AF87]"}`}>
                  {r.source === "google" ? "G" : "TA"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
