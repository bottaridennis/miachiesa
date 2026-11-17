import type { ReactNode } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, IconButton } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/Dialog';
import { Select } from '../components/ui/Field';
import { PARISHES } from '../types';

export function SectionHeader({ title, description, onNew, newLabel = 'Nuovo', extra }: { title: string; description?: string; onNew?: () => void; newLabel?: string; extra?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {extra}
        {onNew && (
          <Button icon={<Plus size={17} />} onClick={onNew}>
            {newLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="flex shrink-0 items-center">
      {onEdit && (
        <IconButton label="Modifica" onClick={onEdit}>
          <Pencil size={16} />
        </IconButton>
      )}
      {onDelete && (
        <IconButton label="Elimina" onClick={onDelete} className="hover:bg-danger-soft hover:text-danger">
          <Trash2 size={16} />
        </IconButton>
      )}
    </div>
  );
}

/** Esegue un'azione asincrona mostrando un toast di successo/errore */
export function useAction() {
  const toast = useToast();
  const confirm = useConfirm();
  const run = async (fn: () => Promise<unknown>, success?: string, failure = 'Operazione non riuscita. Verifica i permessi e riprova.') => {
    try {
      await fn();
      if (success) toast.success(success);
      return true;
    } catch (e: any) {
      console.error(e);
      toast.error(e?.code === 'permission-denied' ? 'Non hai i permessi per questa operazione.' : e?.message && !e?.code ? e.message : failure);
      return false;
    }
  };
  const remove = async (what: string, fn: () => Promise<unknown>) => {
    const ok = await confirm({ title: `Eliminare ${what}?`, message: "L'operazione non può essere annullata.", confirmLabel: 'Elimina', danger: true });
    if (ok) await run(fn, 'Eliminato');
  };
  return { run, remove, toast, confirm };
}

export function ParishSelect({ value, onChange, label = 'Parrocchia' }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <Select label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {PARISHES.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </Select>
  );
}

export function ListCard({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">{children}</div>;
}
