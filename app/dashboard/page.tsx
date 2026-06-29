import { BIOMA } from "@/lib/bioma"
import { Star, TrendingUp, Eye, Users, ArrowUpRight, ExternalLink, Globe, Instagram, Facebook } from "lucide-react"

export default function Dashboard() {
  const links = [
    { label: "Website", href: BIOMA.website, icon: Globe, active: !!BIOMA.website },
    { label: "Instagram", href: BIOMA.instagram, icon: Instagram, active: !!BIOMA.instagram },
    { label: "Facebook", href: BIOMA.facebook, icon: Facebook, active: !!BIOMA.facebook },
    { label: "TripAdvisor", href: BIOMA.tripadvisor, icon: Star, active: !!BIOMA.tripadvisor },
  ]

  return (
    <div className="p-8 space-y-6">
      {/* header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-preto/30">Dashboard</p>
        <h1 className="mt-1 text-2xl font-serif font-bold text-preto">Visão geral</h1>
        <p className="text-sm text-preto/50">Desempenho do {BIOMA.name} na plataforma beacly</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-branco border border-preto/8 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-preto/30">Rating Google</span>
            <Star className="h-4 w-4 text-signal fill-signal" />
          </div>
          <p className="text-3xl font-bold text-preto">{BIOMA.rating}</p>
          <p className="mt-1 text-xs text-preto/40">{BIOMA.reviewCount} reviews</p>
          <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <ArrowUpRight className="h-3.5 w-3.5" />#1 no Pico
          </div>
        </div>

        <div className="rounded-2xl bg-branco border border-preto/8 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-preto/30">beacly Score</span>
            <TrendingUp className="h-4 w-4 text-ocean" />
          </div>
          <p className="text-3xl font-bold text-preto">9.8</p>
          <p className="mt-1 text-xs text-preto/40">Escala 0–10</p>
          <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <ArrowUpRight className="h-3.5 w-3.5" />Top 3 Açores
          </div>
        </div>

        <div className="rounded-2xl bg-branco border border-preto/8 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-preto/30">Visibilidade</span>
            <Eye className="h-4 w-4 text-preto/30" />
          </div>
          <p className="text-3xl font-bold text-preto">Alto</p>
          <p className="mt-1 text-xs text-preto/40">Fine dining · Pico</p>
          <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <ArrowUpRight className="h-3.5 w-3.5" />Destaque beacly
          </div>
        </div>

        <div className="rounded-2xl bg-branco border border-preto/8 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-preto/30">Presença digital</span>
            <Globe className="h-4 w-4 text-preto/30" />
          </div>
          <p className="text-3xl font-bold text-preto">4/4</p>
          <p className="mt-1 text-xs text-preto/40">Canais activos</p>
          <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <ArrowUpRight className="h-3.5 w-3.5" />100% completo
          </div>
        </div>
      </div>

      {/* 2 colunas: AI summary + presença digital */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* AI Summary */}
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

        {/* Presença digital */}
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

      {/* Últimas reviews */}
      <div className="rounded-2xl bg-branco border border-preto/8 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/40">Últimas reviews</p>
          <a href="/dashboard/reviews" className="text-xs font-bold text-ocean hover:underline">Ver todas →</a>
        </div>
        <div className="space-y-3">
          {BIOMA.reviews.slice(0, 4).map((r, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-cream p-3">
              <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                {[...Array(r.rating)].map((_, j) => <Star key={j} className="h-3 w-3 fill-signal text-signal" />)}
              </div>
              <p className="text-sm text-preto/70 leading-relaxed line-clamp-2">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
