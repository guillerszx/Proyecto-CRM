import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Settings, Moon, Type, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { usePreferences } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/accesibilidad")({
  head: () => ({
    meta: [
      { title: "Accesibilidad — Estudio CRM" },
      {
        name: "description",
        content: "Configura el tamaño de letra, tema oscuro y otras preferencias.",
      },
    ],
  }),
  component: AccessibilityPage,
});

function AccessibilityPage() {
  const { getPreferences, updatePreferences, deletePaymentHistory } = usePreferences();
  const prefs = getPreferences();
  const [theme, setTheme] = useState<"light" | "dark" | "system">(prefs.theme);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large" | "extra-large">(prefs.fontSize);
  const [securityWord, setSecurityWord] = useState("");
  const [securityInput, setSecurityInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleThemeChange = (newTheme: string) => {
    const t = newTheme as "light" | "dark" | "system";
    setTheme(t);
    updatePreferences({ theme: t });
    applyTheme(t);
    toast.success("Tema actualizado");
  };

  const handleFontSizeChange = (newSize: string) => {
    const s = newSize as "small" | "medium" | "large" | "extra-large";
    setFontSize(s);
    updatePreferences({ fontSize: s });
    applyFontSize(s);
    toast.success("Tamaño de letra actualizado");
  };

  const applyTheme = (t: string) => {
    const html = document.documentElement;
    if (t === "dark") {
      html.classList.add("dark");
    } else if (t === "light") {
      html.classList.remove("dark");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
    }
  };

  const applyFontSize = (size: string) => {
    const html = document.documentElement;
    html.classList.remove("font-small", "font-medium", "font-large", "font-extra-large");

    if (size === "small") {
      html.style.fontSize = "12px";
    } else if (size === "large") {
      html.style.fontSize = "16px";
    } else if (size === "extra-large") {
      html.style.fontSize = "18px";
    } else {
      html.style.fontSize = "14px";
    }
  };

  // Aplicar preferencias al cargar
  useEffect(() => {
    applyTheme(theme);
    applyFontSize(fontSize);
  }, []);

  useEffect(() => {
    setTheme(prefs.theme);
    setFontSize(prefs.fontSize);
    applyTheme(prefs.theme);
    applyFontSize(prefs.fontSize);
  }, [prefs.theme, prefs.fontSize]);

  const handleDeletePaymentHistory = () => {
    if (securityInput !== securityWord) {
      toast.error("Palabra de seguridad incorrecta");
      return;
    }
    deletePaymentHistory();
    setSecurityInput("");
    setShowDeleteConfirm(false);
    toast.success("Historial de pagos eliminado");
  };

  const generateSecurityWord = () => {
    const words = ["CONFIRMAR", "ACEPTAR", "ELIMINAR", "SEGURO", "BORRAR", "LIMPIAR"];
    const newWord = words[Math.floor(Math.random() * words.length)];
    setSecurityWord(newWord);
  };

  useEffect(() => {
    generateSecurityWord();
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Settings className="h-3.5 w-3.5" />
          Accesibilidad
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Configuración de accesibilidad</h1>
        <p className="text-sm text-muted-foreground">
          Personaliza la experiencia de uso del aplicación.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Tema oscuro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Tema
            </CardTitle>
            <CardDescription>Elige entre tema claro, oscuro o automático.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="theme">Modo de tema</Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Automático (según el sistema)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tamaño de letra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Tamaño de letra
            </CardTitle>
            <CardDescription>Ajusta el tamaño del texto en toda la aplicación.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fontSize">Tamaño</Label>
                <Select value={fontSize} onValueChange={handleFontSizeChange}>
                  <SelectTrigger id="fontSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeño (12 px)</SelectItem>
                    <SelectItem value="medium">Mediano (14 px)</SelectItem>
                    <SelectItem value="large">Grande (16 px)</SelectItem>
                    <SelectItem value="extra-large">Extra grande (18 px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border border-border bg-card/40 p-4">
                <p className="text-sm text-muted-foreground">Vista previa del tamaño actual</p>
                <p className="mt-2 text-base">Este es un ejemplo de texto con el tamaño seleccionado.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eliminar historial */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Zona de peligro
            </CardTitle>
            <CardDescription>Acciones que no pueden revertirse.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <h3 className="font-semibold text-destructive">Eliminar historial de pagos</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Esta acción eliminará todos los registros de pago de forma permanente. No puede deshacerse.
                </p>
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="mt-4">
                      Eliminar historial
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar historial de pagos?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción es irreversible. Todos los registros de pago serán eliminados permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label className="font-semibold">
                          Escribe la palabra de seguridad para confirmar:
                        </Label>
                        <div className="rounded-lg border border-border bg-muted/50 p-3 font-mono font-semibold text-primary">
                          {securityWord}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="security-input">Palabra de seguridad</Label>
                        <Input
                          id="security-input"
                          placeholder="Escribe la palabra aquí"
                          value={securityInput}
                          onChange={(e) => setSecurityInput(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeletePaymentHistory}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={securityInput !== securityWord}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
