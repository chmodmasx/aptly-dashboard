import { recentTasks } from "@/data/mock"
import { Card } from "@/components/ui/card"

export function TaskCard() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <div className="text-sm font-semibold">Tareas</div>
          <div className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">Procesos en ejecución y recientes.</div>
        </div>
        <span className="rounded-full border px-2 py-1 text-[10px] text-sky-600 dark:text-sky-400">1 ejecutando</span>
      </div>
      <div className="divide-y">
        {recentTasks.map((t) => (
          <div key={t.task} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium">{t.task}</div>
                <div className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{t.detail}</div>
              </div>
              <span className={t.state === "Running" ? "text-xs text-sky-600 dark:text-sky-400" : "text-xs text-emerald-600 dark:text-emerald-400"}>{t.state === "Running" ? `${t.progress}%` : "Completada"}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
              <div className={t.state === "Running" ? "h-full rounded-full bg-sky-500" : "h-full rounded-full bg-emerald-500"} style={{ width: `${t.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
