import { BIOMA } from "@/lib/bioma"
import { Globe, Instagram, Facebook, Star, Phone, MapPin, ExternalLink } from "lucide-react"

export default function Configuracoes() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-preto/30">Configurações</p>
        <h1 className="mt-1 text-2xl font-serif font-bold text-preto">Perfil do restaurante</h1>
        <p className="text-sm text-preto/50">Informações visíveis no beacly</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-branco border border-preto/8 p-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/40">Informações básicas</p>
          {[
            { label: "Nome", value: BIOMA.name },
            { label: "Categoria", value: BIOMA.category },
            { label: "Ilha", value: `${BIOMA.ilha}, Açores` },
            { label: "Endereço", value: BIOMA.address, icon: MapPin },
            { label: "Telefone", value: BIOMA.phone, icon: Phone },
          ].map(({ label, value }) => (
            <div key={label} className="border-b border-preto/5 pb-3 last:border-0 last:pb-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-preto/30 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-preto">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-branco border border-preto/8 p-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-preto/40">Presença digital</p>
          {[
            { label: "Website", href: BIOMA.website, icon: Globe },
            { label: "Instagram", href: BIOMA.instagram, icon: Instagram },
            { label: "Facebook", href: BIOMA.facebook, icon: Facebook },
            { label: "TripAdvisor", href: BIOMA.tripadvisor, icon: Star },
          ].map(({ label, href, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between border-b border-preto/5 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-ocean/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-ocean" />
                </div>
                <span className="text-sm font-semibold text-preto">{label}</span>
              </div>
              <a href={href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline">
                Activo <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
