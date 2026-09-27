import { ChevronRight, MoreHorizontal } from "lucide-react"
import { repositories } from "@/data/mock"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function RepositoriesTable() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <div className="text-sm font-semibold">Repositorios</div>
          <div className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">Fuentes principales administradas por Aptly.</div>
        </div>
        <Button variant="outline" size="sm">Administrar repositorios <ChevronRight className="size-3.5" /></Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-[11px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              <th className="px-5 py-3 font-medium">Repositorio</th>
              <th className="px-5 py-3 font-medium">Paquetes</th>
              <th className="px-5 py-3 font-medium">Arquitecturas</th>
              <th className="px-5 py-3 font-medium">Canal</th>
              <th className="px-5 py-3 font-medium">Actualización</th>
              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {repositories.map((r) => (
              <tr key={r.name} className="border-b last:border-b-0 hover:bg-[hsl(var(--muted))]/50">
                <td className="px-5 py-3.5 font-medium"><span className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: r.color }} />{r.name}</td>
                <td className="px-5 py-3.5">{r.packages}</td>
                <td className="px-5 py-3.5 text-[hsl(var(--muted-foreground))]">{r.arch}</td>
                <td className="px-5 py-3.5"><Badge>{r.channel}</Badge></td>
                <td className="px-5 py-3.5 text-[hsl(var(--muted-foreground))]">hace {r.updated}</td>
                <td className="px-3"><button className="rounded-md p-1.5 hover:bg-[hsl(var(--accent))]"><MoreHorizontal className="size-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
