"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Star, BarChart2, Eye, Users, Settings, ExternalLink, Fish } from "lucide-react"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/benchmark", label: "Benchmark", icon: BarChart2 },
  { href: "/dashboard/visibilidade", label: "Visibilidade", icon: Eye },
  { href: "/dashboard/clientes", label: "Visitantes", icon: Users },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
]

export function Sidebar() {
  const path = usePathname()
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-preto/8 bg-branco">
      {/* logo */}
      <div className="flex items-center gap-2.5 border-b border-preto/8 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ocean">
          <Fish className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-ocean leading-none">beacly</p>
          <p className="text-[10px] text-preto/40 font-medium">partner</p>
        </div>
      </div>
      {/* restaurante */}
      <div className="border-b border-preto/8 px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-preto/30">Restaurante</p>
        <p className="mt-0.5 text-sm font-bold text-preto">Bioma Restaurant</p>
        <p className="text-xs text-preto/40">Pico, Açores</p>
      </div>
      {/* nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-ocean text-white" : "text-preto/60 hover:bg-cream hover:text-preto"}`}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      {/* ver no beacly */}
      <div className="border-t border-preto/8 p-4">
        <a href="https://azorean-gastronomy.beacly.com/restaurant/4ea19741-4c58-43a7-9073-7b200c92bace"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5 text-xs font-semibold text-preto/60 hover:text-ocean transition-colors">
          <ExternalLink className="h-3.5 w-3.5" />Ver perfil público
        </a>
      </div>
    </aside>
  )
}
