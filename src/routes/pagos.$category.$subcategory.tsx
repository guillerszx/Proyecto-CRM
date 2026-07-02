import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Wallet,
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  User,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, useClients, usePayments, usePaymentHistory, useEnrollmentStats, type Payment } from "@/lib/store";
import { PaymentDialog } from "@/components/payment-dialog";
import { RegisterPaymentDialog } from "@/components/register-payment-dialog";

export const Route = createFileRoute("/pagos/$category/$subcategory")({
  beforeLoad: ({ params }) => {
    const cat = CATEGORIES[params.category];
    if (!cat) throw notFound();
    if (!cat.subcategories.find((s) => s.slug === params.subcategory)) throw notFound();
  },
  head: ({ params }) => {
    const cat = CATEGORIES[params.category];
    const sub = cat?.subcategories.find((s) => s.slug === params.subcategory);
    const title = sub && cat ? `${cat.label} · ${sub.label}` : "Pagos";
    return {
      meta: [
        { title: `${title} — Estudio CRM` },
        { name: "description", content: `Inscripciones y pagos de ${title}.` },
      ],
    };
  },
  component: SubcategoryPage,
});

type SortKey =
  | "debt-desc"
  | "debt-asc"
  | "date-desc"
  | "date-asc"
  | "recent"
  | "name";

function SubcategoryPage() {
  const { category, subcategory } = Route.useParams();
  const cat = CATEGORIES[category];
  const sub = cat.subcategories.find((s) => s.slug === subcategory)!;

  const { clients } = useClients();
  const { payments, addPayment, updatePayment, deletePayment } = usePayments();
  const { addRecord } = usePaymentHistory();
  const { enrolledCount, clientsWithDebtCount } = useEnrollmentStats(category, subcategory);
  const [search, setSearch] = useState("");
  const [debtFilter, setDebtFilter] = useState<"all" | "with" | "without">("all");

  const [sort, setSort] = useState<SortKey>("debt-desc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | undefined>();
  const [registering, setRegistering] = useState<Payment | undefined>();
  const [toDelete, setToDelete] = useState<Payment | undefined>();
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState(false);

  useEffect(() => {
    if (!toDelete) setDeleteConfirmationStep(false);
  }, [toDelete]);

  const items = useMemo(() => {
    // base list for this subcategory
    const base = payments.filter((p) => p.category === category && p.subcategory === subcategory);

    // group by client
    const map = new Map<string, { client?: typeof clients[number]; payments: Payment[] }>();
    base.forEach((p) => {
      const client = clients.find((c) => c.id === p.clientId);
      const key = client?.id ?? p.clientId;
      if (!map.has(key)) map.set(key, { client, payments: [] });
      map.get(key)!.payments.push(p);
    });

    // filter groups by search and debt filter
    const q = search.trim().toLowerCase();
    const groups = Array.from(map.entries())
      .map(([id, value]) => ({ id, ...value }))
      .filter((g) => {
        // debt filter
        const totalDebt = g.payments.reduce((s, p) => s + p.debt, 0);
        if (debtFilter === "with" && totalDebt <= 0) return false;
        if (debtFilter === "without" && totalDebt > 0) return false;

        if (!q) return true;
        // match client name
        if (g.client?.name.toLowerCase().includes(q)) return true;
        if (g.client?.phone.toLowerCase().includes(q)) return true;
        // match any payment fields
        for (const p of g.payments) {
          if (p.inscriptionDate.toLowerCase().includes(q)) return true;
          if (formatMonth(p.inscriptionDate.slice(0, 7)).toLowerCase().includes(q)) return true;
          if ((p.serviceMonth ?? "").toLowerCase().includes(q)) return true;
          if (formatMonth(p.serviceMonth).toLowerCase().includes(q)) return true;
          if (String(p.amount).includes(q)) return true;
        }
        return false;
      });

    // sort groups according to selected sort
    groups.sort((a, b) => {
      switch (sort) {
        case "debt-desc":
          return b.payments.reduce((s, p) => s + p.debt, 0) - a.payments.reduce((s, p) => s + p.debt, 0);
        case "debt-asc":
          return a.payments.reduce((s, p) => s + p.debt, 0) - b.payments.reduce((s, p) => s + p.debt, 0);
        case "date-desc":
          return (
            (b.payments.sort((x, y) => (y.lastPaymentDate ?? "").localeCompare(x.lastPaymentDate ?? ""))[0]?.lastPaymentDate ?? "")
              .localeCompare(
                a.payments.sort((x, y) => (y.lastPaymentDate ?? "").localeCompare(x.lastPaymentDate ?? ""))[0]?.lastPaymentDate ?? "",
              )
          );
        case "date-asc":
          return (
            (a.payments.sort((x, y) => (x.lastPaymentDate ?? "").localeCompare(y.lastPaymentDate ?? ""))[0]?.lastPaymentDate ?? "")
              .localeCompare(
                b.payments.sort((x, y) => (x.lastPaymentDate ?? "").localeCompare(y.lastPaymentDate ?? ""))[0]?.lastPaymentDate ?? "",
              )
          );
        case "recent":
          return Math.max(...b.payments.map((p) => p.createdAt)) - Math.max(...a.payments.map((p) => p.createdAt));
        case "name":
          return (a.client?.name ?? "").localeCompare(b.client?.name ?? "");
        default:
          return 0;
      }
    });

    return groups;
  }, [payments, clients, category, subcategory, sort, search, debtFilter]);

  const totalDebt = items.reduce(
    (sum, item) => sum + item.payments.reduce((paymentSum, payment) => paymentSum + payment.debt, 0),
    0,
  );
  const registeringClient = registering
    ? clients.find((c) => c.id === registering.clientId)
    : undefined;
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const map = new Map<string, { client?: typeof clients[number]; payments: Payment[] }>();
    items.forEach(({ payment, client }) => {
      const key = client?.id ?? payment.clientId;
      if (!map.has(key)) map.set(key, { client, payments: [] });
      map.get(key)!.payments.push(payment);
    });
    return Array.from(map.entries()).map(([key, value]) => ({ id: key, ...value }));
  }, [items]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-1">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {cat.label}
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{sub.label}</h1>
        <p className="text-sm text-muted-foreground">
          Clientes inscritos con sus pagos y deudas.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Badge>Inscritos: {enrolledCount}</Badge>
          <Badge variant="destructive">Con deuda: {clientsWithDebtCount}</Badge>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap">
        <div className="flex min-w-0 items-start gap-2 flex-1">
          <div className="relative flex-1">
            <Input
              placeholder="Nombre, teléfono, mes de inscripción, mes del servicio o importe"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-3"
            />
          </div>
          <Select value={debtFilter} onValueChange={(v) => setDebtFilter(v as any)}>
            <SelectTrigger className="ml-2 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="with">Con deuda</SelectItem>
              <SelectItem value="without">Sin deuda</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="ml-2 w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="debt-desc">Deuda (mayor a menor)</SelectItem>
              <SelectItem value="debt-asc">Deuda (menor a mayor)</SelectItem>
              <SelectItem value="date-desc">Fecha (más reciente)</SelectItem>
              <SelectItem value="date-asc">Fecha (más antigua)</SelectItem>
              <SelectItem value="recent">Añadido recientemente</SelectItem>
              <SelectItem value="name">Orden alfabético</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          className="shrink-0"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Inscribir cliente</span>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-secondary-foreground">
            <Wallet className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold">Aún no hay inscripciones</h2>
          <p className="mt-1 text-sm text-muted-foreground">Inscribe un cliente en {sub.label} para empezar.</p>
          <Button className="mt-4" onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Inscribir cliente
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(({ id, client, payments }) => {
            const totalDebt = payments.reduce((s, p) => s + p.debt, 0);
            return (
              <Card key={id} className="transition-shadow hover:shadow-md min-h-[13rem]">
                <CardHeader className="pb-1.5">
                    <CardTitle className="flex items-start gap-2.5 text-sm">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                      {client ? client.name.slice(0, 1).toUpperCase() : <User className="h-4 w-4" />}
                    </div>
                      <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-semibold">{client?.name ?? "Cliente eliminado"}</span>
                        {totalDebt > 0 && <span className="inline-block h-2 w-2 rounded-full bg-destructive" aria-hidden />}
                      </span>
                        <span className="block text-[11px] text-muted-foreground">
                        {payments.length} inscripciones registradas
                      </span>
                    </span>
                    <Badge variant="secondary" className="shrink-0">{payments.length} inscripciones</Badge>
                  </CardTitle>
                </CardHeader>
                  <CardContent className="space-y-2.5">
                    <div className="grid gap-2.5 rounded-lg bg-muted/40 p-2.5 sm:grid-cols-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Deuda total</div>
                      <div className="text-base font-semibold">{totalDebt.toFixed(2)} €</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Teléfono</div>
                      <div className="text-sm font-medium">{client?.phone || "Sin teléfono"}</div>
                    </div>
                  </div>
                    <div className="flex flex-wrap gap-2">
                    {payments.map((p) => (
                        <span key={p.id} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground min-w-[3.25rem] text-center">
                        {p.serviceMonth ? formatMonth(p.serviceMonth) : "-"}
                      </span>
                    ))}
                  </div>
                    <div className="flex flex-wrap justify-end gap-1.5 pt-1">
                    <Button size="sm" variant="default" onClick={() => setExpandedClients((s) => ({ ...s, [id]: !s[id] }))}>
                      {expandedClients[id] ? "Ocultar inscripciones" : "Ver inscripciones"}
                    </Button>
                  </div>
                  {expandedClients[id] && (
                      <div className="mt-2.5 space-y-2.5 rounded-lg border bg-background/60 p-2.5">
                      {payments.map((payment) => (
                          <div key={payment.id} className="rounded-md border p-3 min-h-[5.5rem] bg-card">
                            <div className="grid gap-2 sm:grid-cols-[1fr_minmax(9rem,12rem)] sm:items-start">
                              <div>
                                <div className="text-sm text-muted-foreground">Cuantía del mes</div>
                                <div className="text-base font-semibold">{payment.amount.toFixed(2)} €</div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {payment.lastPaymentDate ? (
                                    <span>Último pago: {formatDate(payment.lastPaymentDate)}</span>
                                  ) : (
                                    <span>Sin pagos registrados</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-muted/30 px-3 py-2 text-center sm:min-h-[4.5rem] sm:self-center">
                                <div className="text-xs font-medium text-muted-foreground">
                                  {payment.serviceMonth ? formatMonth(payment.serviceMonth) : "-"}
                                </div>
                                <div className={`text-base font-semibold ${payment.debt > 0 ? "text-destructive" : ""}`}>
                                  {payment.debt.toFixed(2)} €
                                </div>
                              </div>
                            </div>
                          <div className="flex flex-wrap justify-end gap-2 pt-3">
                            <Button size="sm" onClick={() => setRegistering(payment)}>
                              <CircleDollarSign className="h-4 w-4" /> Registrar pago
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setEditing(payment); setDialogOpen(true); }}>
                              <Pencil className="h-4 w-4" /> Editar
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setToDelete(payment)}>
                              <Trash2 className="h-4 w-4" /> Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => {
          if (!o) {
            setToDelete(undefined);
            setDeleteConfirmationStep(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar inscripción?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmationStep
                ? "Última confirmación: pulsa eliminar de nuevo para borrar la inscripción de forma permanente."
                : "Esta acción no se puede deshacer. Pulsa eliminar para continuar con la confirmación."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!toDelete) return;

                if (!deleteConfirmationStep) {
                  setDeleteConfirmationStep(true);
                  return;
                }

                deletePayment(toDelete.id);
                setToDelete(undefined);
                setDeleteConfirmationStep(false);
              }}
            >
              {deleteConfirmationStep ? "Confirmar eliminación" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PaymentDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(undefined);
        }}
        clients={clients}
        initial={editing}
        category={category}
        subcategory={subcategory}
        onSubmit={(data) => {
          if (editing) {
            updatePayment(editing.id, { ...data, category, subcategory });
          } else {
            addPayment({ ...data, category, subcategory });
          }

          if (data.shouldRegisterPayment && data.lastPaidAmount && data.lastPaymentDate) {
            addRecord({
              clientId: data.clientId,
              clientName: data.clientName ?? clients.find((c) => c.id === data.clientId)?.name ?? "",
              category,
              subcategory,
              totalAmount: data.amount,
              amount: data.lastPaidAmount,
              date: data.lastPaymentDate,
              inscriptionDate: data.inscriptionDate,
              serviceMonth: data.serviceMonth,
            });
          }

          setDialogOpen(false);
          setEditing(undefined);
        }}
      />

      <RegisterPaymentDialog
        open={!!registering}
        onOpenChange={(o) => !o && setRegistering(undefined)}
        payment={registering}
        clientName={registeringClient?.name}
        category={category}
        subcategory={subcategory}
        onSubmit={({ amount, date, clientName }) => {
          if (!registering) return;
          const newDebt = Math.max(0, registering.debt - amount);
          updatePayment(registering.id, {
            debt: newDebt,
            lastPaidAmount: amount,
            lastPaymentDate: date,
            status: newDebt === 0 ? "pagado" : "pendiente",
          });
          addRecord({
            clientId: registering.clientId,
            clientName: clientName || registeringClient?.name || "",
            category,
            subcategory,
            totalAmount: registering.amount,
            amount,
            date,
            inscriptionDate: registering.inscriptionDate,
            serviceMonth: registering.serviceMonth,
          });
          setRegistering(undefined);
        }}
      />
    </div>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatMonth(value?: string) {
  if (!value) return "Sin mes";
  try {
    return new Intl.DateTimeFormat("es-ES", { month: "short", year: "numeric" }).format(
      new Date(`${value}-01`),
    );
  } catch {
    return value;
  }
}
