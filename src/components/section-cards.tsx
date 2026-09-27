import { ArrowDownRight, ArrowUpRight, PackageCheck, RadioTower } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

const cards = [
  { label: "Repositorios", value: "12", hint: "+2 este mes", positive: true },
  { label: "Paquetes", value: "3.842", hint: "+127 esta semana", positive: true },
  { label: "Snapshots", value: "47", hint: "6 en los últimos 7 días", positive: true },
  { label: "Publicaciones", value: "4", hint: "Todas saludables", positive: true },
]

export function SectionCards() {
  return (
    <div className="grid gap-4 px-4 lg:grid-cols-2 xl:grid-cols-4 lg:px-6">
      {cards.map((card, idx) => (
        <Card key={card.label} className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{card.label}</span>
            <span className="rounded-full border px-2 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">{card.hint}</span>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-3xl font-semibold tracking-tight">{card.value}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                  {idx === 3 ? <RadioTower className="size-3" /> : idx === 1 ? <PackageCheck className="size-3" /> : card.positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  Estado actualizado
                </div>
              </div>
              <MiniBars seed={idx} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MiniBars({ seed }: { seed: number }) {
  const h = [12, 18, 15, 24, 20, 29, 34].map((v, i) => v + ((seed + i) % 3) * 3)
  return <div className="flex h-10 items-end gap-1 opacity-45">{h.map((x,i)=><span key={i} style={{height:x}} className="w-1.5 rounded-sm bg-current" />)}</div>
}
