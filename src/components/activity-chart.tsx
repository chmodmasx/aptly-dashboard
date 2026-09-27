import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { activity } from "@/data/mock"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ActivityChart() {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Actividad del repositorio</CardTitle>
          <CardDescription>Paquetes incorporados y publicados durante los últimos 7 días.</CardDescription>
        </div>
        <Button variant="outline" size="sm">Últimos 7 días</Button>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activity} margin={{ left: -18, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="uploadedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="currentColor" stopOpacity={0.24}/>
                <stop offset="95%" stopColor="currentColor" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="currentColor" opacity={0.08} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "currentColor", opacity: .55 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "currentColor", opacity: .45 }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", fontSize: 12 }} />
            <Area type="monotone" dataKey="uploaded" stroke="currentColor" strokeWidth={2} fill="url(#uploadedFill)" />
            <Area type="monotone" dataKey="published" stroke="currentColor" strokeOpacity={0.45} strokeWidth={1.5} fillOpacity={0} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
