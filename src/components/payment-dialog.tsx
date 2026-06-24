import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client, Payment, PaymentStatus } from "@/lib/store";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  clients: Client[];
  initial?: Payment;
  category?: string;
  subcategory?: string;
  onSubmit: (data: {
    clientId: string;
    amount: number;
    debt: number;
    status: PaymentStatus;
    inscriptionDate: string;
    serviceMonth?: string;
    lastPaidAmount?: number;
    lastPaymentDate?: string;
    clientName?: string;
    shouldRegisterPayment?: boolean;
  }) => void;
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const todayMonth = () => new Date().toISOString().slice(0, 7);

export function PaymentDialog({ open, onOpenChange, clients, initial, category, subcategory, onSubmit }: Props) {
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [inscriptionDate, setInscriptionDate] = useState(todayStr());
  const [serviceMonth, setServiceMonth] = useState(todayMonth());
  const [serviceMonthTouched, setServiceMonthTouched] = useState(false);
  const [paidNow, setPaidNow] = useState(true);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayStr());

  useEffect(() => {
    if (open) {
      setClientId(initial?.clientId ?? "");
      setAmount(initial ? String(initial.amount) : "");
      setInscriptionDate(initial?.inscriptionDate ?? todayStr());
      setServiceMonthTouched(false);
      setServiceMonth(
        initial?.serviceMonth ?? (initial?.inscriptionDate ? initial.inscriptionDate.slice(0, 7) : todayMonth()),
      );
      const hasPayment = !!initial?.lastPaymentDate;
      setPaidNow(false); // Por defecto desmarcado
      setPaidAmount(initial?.lastPaidAmount != null ? String(initial.lastPaidAmount) : "");
      setPaymentDate(initial?.lastPaymentDate ?? todayStr());
    }
  }, [open, initial]);

  const handleSave = () => {
    if (!clientId) {
      toast.error("Selecciona un cliente");
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Introduce una cuantía válida");
      return;
    }

    const clientName = clients.find((c) => c.id === clientId)?.name ?? "";

    if (paidNow) {
      const paid = Number(paidAmount || amount);
      if (paid < 0) {
        toast.error("La cuantía pagada no puede ser negativa");
        return;
      }
      const debt = Math.max(0, amt - paid);
      onSubmit({
        clientId,
        amount: amt,
        debt,
        status: debt === 0 ? "pagado" : "pendiente",
        inscriptionDate,
        serviceMonth,
        lastPaidAmount: paid,
        lastPaymentDate: paymentDate,
        clientName,
        shouldRegisterPayment: true,
      });
    } else {
      onSubmit({
        clientId,
        amount: amt,
        debt: amt,
        status: "pendiente",
        inscriptionDate,
        serviceMonth,
        lastPaidAmount: undefined,
        lastPaymentDate: undefined,
        clientName,
        shouldRegisterPayment: false,
      });
    }
    onOpenChange(false);
    toast.success(initial ? "Inscripción actualizada" : "Cliente inscrito");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar inscripción" : "Inscribir cliente"}</DialogTitle>
          <DialogDescription>
            Selecciona el cliente, introduce la cuantía del mes y el mes de inscripción.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Cliente *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No hay clientes. Añade uno primero.</div>
                ) : (
                  clients
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="amount">Cuantía mes (€) *</Label>
              <Input id="amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ins">Fecha de inscripción</Label>
              <Input
                id="ins"
                type="date"
                value={inscriptionDate}
                onChange={(e) => {
                  const v = e.target.value;
                  setInscriptionDate(v);
                  if (!serviceMonthTouched) setServiceMonth(v.slice(0, 7));
                }}
              />

              <Label htmlFor="service-month">Mes del servicio</Label>
              <Input
                id="service-month"
                type="month"
                value={serviceMonth}
                onChange={(e) => {
                  setServiceMonthTouched(true);
                  setServiceMonth(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2">
            <div className="space-y-0.5">
              <Label htmlFor="paid-now" className="cursor-pointer">Pagado al inscribirse</Label>
              <p className="text-xs text-muted-foreground">Desactívalo si queda pendiente de pago.</p>
            </div>
            <Switch id="paid-now" checked={paidNow} onCheckedChange={setPaidNow} />
          </div>

          {paidNow && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="paid">Cuantía abonada (€)</Label>
                <Input id="paid" type="number" min="0" step="0.01" value={paidAmount} placeholder={amount || "0.00"} onChange={(e) => setPaidAmount(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pay">Fecha del pago</Label>
                <Input id="pay" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
