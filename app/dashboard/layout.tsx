import { Sidebar } from "@/components/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <main className="ml-60 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}
