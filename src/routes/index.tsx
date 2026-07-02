import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Phone, Mail, ArrowDownAZ, ArrowUpAZ, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useClients, usePayments, type Client } from "@/lib/store";
import { ClientDialog } from "@/components/client-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clientes — Estudio CRM" },
      { name: "description", content: "Listado de clientes del gimnasio." },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | undefined>();
  const [toDelete, setToDelete] = useState<Client | undefined>();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = clients.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false),
    );
    list.sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
    return list;
  }, [clients, search, sortAsc]);

  const { payments } = usePayments();
  const clientsWithDebt = useMemo(() => new Set(payments.filter((p) => p.debt > 0).map((p) => p.clientId)), [payments]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold sm:text-3xl">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los clientes del estudio.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o correo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortAsc((v) => !v)}
            title="Ordenar alfabéticamente"
          >
            {sortAsc ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
            <span className="hidden sm:inline">{sortAsc ? "A–Z" : "Z–A"}</span>
          </Button>
          <Button
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo cliente</span>
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-secondary-foreground">
            <User className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold">
            {clients.length === 0 ? "Aún no hay clientes" : "Sin resultados"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {clients.length === 0
              ? "Empieza añadiendo tu primer cliente."
              : "Prueba con otra búsqueda."}
          </p>
          {clients.length === 0 && (
            <Button
              className="mt-4"
              onClick={() => {
                setEditing(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Añadir cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                    {c.name.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="min-w-0 truncate flex items-center gap-2">
                    <span className="truncate">{c.name}</span>
                    {clientsWithDebt.has(c.id) && (
                      <span className="inline-block h-2 w-2 rounded-full bg-destructive" aria-hidden />
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="truncate">{c.phone}</span>
                </div>
                {c.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.notes && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.notes}</p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(c);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setToDelete(c)}
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSubmit={(data) => {
          if (editing) updateClient(editing.id, data);
          else addClient(data);
        }}
      />

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => {
          if (!o) setToDelete(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará a {toDelete?.name} y sus inscripciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) {
                  try {
                    deleteClient(toDelete.id);
                    toast.success("Cliente eliminado");
                  } catch (err) {
                    console.error(err);
                    toast.error("Error al eliminar el cliente");
                  }
                }
                setToDelete(undefined);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
