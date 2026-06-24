import { useEffect, useState, useCallback } from "react";

export type Client = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: number;
};

export type PaymentStatus = "pendiente" | "pagado";

export type Payment = {
  id: string;
  clientId: string;
  category: string; // pilates | yoga | yoga-kids
  subcategory: string; // slug
  amount: number; // monthly fee
  debt: number; // outstanding debt
  status: PaymentStatus;
  inscriptionDate: string; // YYYY-MM-DD
  serviceMonth?: string; // YYYY-MM (mes para el que asiste)
  lastPaidAmount?: number;
  lastPaymentDate?: string; // YYYY-MM-DD
  createdAt: number;
};

export type PaymentRecord = {
  id: string;
  clientId: string;
  clientName: string; // snapshot del nombre por si se elimina
  category: string;
  subcategory: string;
  amount: number;
  date: string; // YYYY-MM-DD (fecha de pago)
  inscriptionDate: string; // YYYY-MM-DD (fecha de inscripción)
  serviceMonth?: string; // YYYY-MM (mes para el que asiste)
  createdAt: number;
};

export type Preferences = {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "normal" | "large" | "extra-large";
};

const CLIENTS_KEY = "gym_crm_clients_v1";
const PAYMENTS_KEY = "gym_crm_payments_v1";
const PAYMENT_HISTORY_KEY = "gym_crm_payment_history_v1";
const PREFERENCES_KEY = "gym_crm_preferences_v1";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("gym_crm_storage", { detail: key }));
}

function useStore<T>(key: string): [T[], (updater: (prev: T[]) => T[]) => void] {
  const [data, setData] = useState<T[]>(() => read<T>(key));

  useEffect(() => {
    const handler = (e: Event) => {
      const k = (e as CustomEvent).detail;
      if (k === key) setData(read<T>(key));
    };
    window.addEventListener("gym_crm_storage", handler);
    window.addEventListener("storage", () => setData(read<T>(key)));
    return () => {
      window.removeEventListener("gym_crm_storage", handler);
    };
  }, [key]);

  const update = useCallback(
    (updater: (prev: T[]) => T[]) => {
      const next = updater(read<T>(key));
      write(key, next);
      setData(next);
    },
    [key],
  );

  return [data, update];
}

export function useClients() {
  const [clients, setClients] = useStore<Client>(CLIENTS_KEY);

  const addClient = (c: Omit<Client, "id" | "createdAt">) =>
    setClients((prev) => [
      ...prev,
      { ...c, id: crypto.randomUUID(), createdAt: Date.now() },
    ]);

  const updateClient = (id: string, c: Partial<Client>) =>
    setClients((prev) => prev.map((x) => (x.id === id ? { ...x, ...c } : x)));

  const deleteClient = (id: string) =>
    setClients((prev) => {
      const next = prev.filter((x) => x.id !== id);
      // Also remove payments and payment history related to this client
      try {
        const payments = read<Payment>(PAYMENTS_KEY).filter((p) => p.clientId !== id);
        write(PAYMENTS_KEY, payments);
      } catch {}
      try {
        const records = read<PaymentRecord>(PAYMENT_HISTORY_KEY).filter((r) => r.clientId !== id);
        write(PAYMENT_HISTORY_KEY, records);
      } catch {}
      return next;
    });

  return { clients, addClient, updateClient, deleteClient };
}

export function usePayments() {
  const [payments, setPayments] = useStore<Payment>(PAYMENTS_KEY);

  const addPayment = (p: Omit<Payment, "id" | "createdAt">) =>
    setPayments((prev) => [
      ...prev,
      { ...p, id: crypto.randomUUID(), createdAt: Date.now() },
    ]);

  const updatePayment = (id: string, p: Partial<Payment>) =>
    setPayments((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const deletePayment = (id: string) =>
    setPayments((prev) => prev.filter((x) => x.id !== id));

  return { payments, addPayment, updatePayment, deletePayment };
}

export function usePaymentHistory() {
  const [records, setRecords] = useStore<PaymentRecord>(PAYMENT_HISTORY_KEY);

  const addRecord = (r: Omit<PaymentRecord, "id" | "createdAt">) =>
    setRecords((prev) => [
      ...prev,
      { ...r, id: crypto.randomUUID(), createdAt: Date.now() },
    ]);

  return { records, addRecord };
}

// Hook que devuelve estadísticas de inscripciones por disciplina
export function useEnrollmentStats(category: string, subcategory: string) {
  const { payments } = usePayments();

  const filtered = payments.filter((p) => p.category === category && p.subcategory === subcategory);

  const enrolledClients = new Set<string>();
  const clientsWithDebt = new Set<string>();

  for (const p of filtered) {
    enrolledClients.add(p.clientId);
    if (p.debt > 0) clientsWithDebt.add(p.clientId);
  }

  return {
    enrolledCount: enrolledClients.size,
    clientsWithDebtCount: clientsWithDebt.size,
  };
}


// Catalog
export const CATEGORIES: Record<
  string,
  { label: string; subcategories: { slug: string; label: string }[] }
> = {
  pilates: {
    label: "Pilates",
    subcategories: [
      { slug: "iniciacion", label: "Iniciación" },
      { slug: "intermedio", label: "Intermedio" },
      { slug: "avanzado", label: "Avanzado" },
      { slug: "mantenimiento", label: "Mantenimiento" },
      { slug: "funcional", label: "Funcional" },
      { slug: "terapeutico", label: "Terapéutico" },
      { slug: "reformer", label: "Reformer" },
    ],
  },
  yoga: {
    label: "Yoga",
    subcategories: [
      { slug: "hatha", label: "Hatha" },
      { slug: "vinyasa", label: "Vinyasa" },
      { slug: "yin", label: "Yin" },
    ],
  },
  "yoga-kids": {
    label: "Yoga Kids",
    subcategories: [{ slug: "espalda-sana", label: "Espalda Sana" }],
  },
};

export function usePreferences() {
  const [prefs, setPrefs] = useStore<Preferences>(PREFERENCES_KEY);
  
  const getPreferences = (): Preferences => {
    return prefs[0] ?? { theme: "light", fontSize: "normal" };
  };

  const updatePreferences = (p: Partial<Preferences>) => {
    setPrefs((prev) => {
      const current = prev[0] ?? { theme: "light", fontSize: "normal" };
      return [{ ...current, ...p }];
    });
  };

  const deletePaymentHistory = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PAYMENT_HISTORY_KEY);
      window.dispatchEvent(new CustomEvent("gym_crm_storage", { detail: PAYMENT_HISTORY_KEY }));
    }
  };

  return { getPreferences, updatePreferences, deletePaymentHistory };
}
