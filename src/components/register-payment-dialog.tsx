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
import type { Payment } from "@/lib/store";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  payment?: Payment;
  clientName?: string;
  category?: string;
  subcategory?: string;
  onSubmit: (data: { amount: number; date: string; clientName: string; category: string; subcategory: string }) => void;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export function RegisterPaymentDialog({
  open,
  onOpenChange,
  payment,
  clientName,
  category,
  subcategory,
  onSubmit,
}: Props) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());

  useEffect(() => {
    if (open) {
      setAmount(payment ? String(payment.debt || payment.amount) : "");
      setDate(todayStr());
    }
  }, [open, payment]);

  const handleSave = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Introduce una cuantía válida");
      return;
    }
    onSubmit({
      amount: amt,
      date,
      clientName: clientName || "",
      category: category || "",
      subcategory: subcategory || "",
    });
    onOpenChange(false);
    toast.success("Pago registrado");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            {clientName ? `Pago de ${clientName}.` : "Introduce la cuantía y la fecha."}
            {payment && payment.debt > 0
              ? ` Deuda actual: ${payment.debt.toFixed(2)} €.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="rp-amount">Cuantía (€) *</Label>
              <Input
                id="rp-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rp-date">Fecha de pago</Label>
              <Input
                id="rp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
