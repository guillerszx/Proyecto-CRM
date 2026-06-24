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
import { Textarea } from "@/components/ui/textarea";
import type { Client } from "@/lib/store";
import { toast } from "sonner";

// Formatear teléfono a xxx xx xx xx
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`.trim();
}

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Client;
  onSubmit: (data: { name: string; phone: string; email?: string; notes?: string }) => void;
};

export function ClientDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setPhone(initial?.phone ?? "");
      setEmail(initial?.email ?? "");
      setNotes(initial?.notes ?? "");
    }
  }, [open, initial]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!phone.trim()) {
      toast.error("El teléfono es obligatorio");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 9) {
      toast.error("El teléfono debe tener 9 dígitos");
      return;
    }
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onOpenChange(false);
    toast.success(initial ? "Cliente actualizado" : "Cliente añadido");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          <DialogDescription>
            Introduce los datos del cliente. El correo es opcional.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Juan Pérez" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              value={phone}
              onChange={handlePhoneChange}
              inputMode="tel"
              placeholder="Ej. 612345678"
              maxLength={12}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo (opcional)</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Ej. correo@dominio.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Ej. Prefiere citas por la tarde" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
