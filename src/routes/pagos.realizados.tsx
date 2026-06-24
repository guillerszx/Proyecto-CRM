import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calendar, History, Search, Wallet, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORIES, useClients, usePaymentHistory } from "@/lib/store";

export const Route = createFileRoute("/pagos/realizados")({
  head: () => ({
    meta: [
      { title: "Pagos realizados — Estudio CRM" },
      {
        name: "description",
        content: "Consulta el historial de pagos realizados por cliente y disciplina.",
      },
    ],
  }),
  component: PaymentsHistoryPage,
});

type PaymentRow = {
  id: string;
  clientName: string;
  discipline: string;
  amount: number;
  date: string;
  createdAt: number;
};

function PaymentsHistoryPage() {
  const { records } = usePaymentHistory();
  const [search, setSearch] = useState("");

  const rows = useMemo<PaymentRow[]>(() => {
    return records
      .map((record) => ({
        id: record.id,
        clientName: record.clientName,
        discipline: `${CATEGORIES[record.category]?.label ?? record.category} · ${
          CATEGORIES[record.category]?.subcategories.find((sub) => sub.slug === record.subcategory)
            ?.label ?? record.subcategory
        }`,
        amount: record.amount,
        date: record.date,
        createdAt: record.createdAt,
      }))
      .filter((row) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          row.clientName.toLowerCase().includes(q) ||
          row.discipline.toLowerCase().includes(q) ||
          row.amount.toFixed(2).includes(q) ||
          formatDate(row.date).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [records, search]);

  const totalCollected = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <History className="h-3.5 w-3.5" />
          Pagos realizados
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Historial de pagos</h1>
        <p className="text-sm text-muted-foreground">
          Visualiza el nombre del cliente, la disciplina y la cantidad abonada en cada pago.
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <History className="h-4 w-4" />
              Pagos registrados
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{rows.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Total abonado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(totalCollected)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              Clientes con pagos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {new Set(rows.map((row) => row.clientName)).size}
          </CardContent>
        </Card>
      </div>

      <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, disciplina o importe…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-secondary-foreground">
            <History className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold">Aún no hay pagos realizados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Los pagos aparecerán aquí cuando registres una cuantía abonada.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead className="text-right">Cantidad abonada</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.clientName}</TableCell>
                  <TableCell className="text-muted-foreground">{row.discipline}</TableCell>
                  <TableCell className="text-right font-semibold">{formatMoney(row.amount)}</TableCell>
                  <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(row.date)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

const moneyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function formatDate(value: string) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
