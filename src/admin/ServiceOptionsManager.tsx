import { useState } from 'react';
import { addDoc, collection, deleteDoc, doc, orderBy, query, writeBatch } from 'firebase/firestore';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCol } from '../lib/useCol';
import { slugify } from '../lib/format';
import { DEFAULT_SERVICE_OPTIONS } from '../lib/defaults';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Feedback';
import { ListCard, RowActions, SectionHeader, useAction } from './common';
import type { ServiceOption } from '../types';

export default function ServiceOptionsManager() {
  const { run, remove } = useAction();
  const { data: options } = useCol<ServiceOption>(query(collection(db, 'service_options'), orderBy('timestamp', 'asc')));
  const [label, setLabel] = useState('');

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const l = label.trim();
    if (!l) return;
    if (await run(() => addDoc(collection(db, 'service_options'), { label: l, value: slugify(l) || `opzione_${Date.now()}`, timestamp: Date.now() }), 'Opzione aggiunta')) setLabel('');
  };

  const importDefaults = () =>
    run(async () => {
      const batch = writeBatch(db);
      DEFAULT_SERVICE_OPTIONS.forEach((o, i) => batch.set(doc(collection(db, 'service_options')), { ...o, timestamp: Date.now() + i }));
      await batch.commit();
    }, 'Opzioni predefinite importate');

  return (
    <>
      <SectionHeader title="Tipi di richiesta" description="Le voci selezionabili nel modulo della Segreteria." />
      <form onSubmit={add} className="mb-6 flex gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Es. Certificato di Prima Comunione" aria-label="Nuova opzione" maxLength={100} className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 text-[15px] focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15" />
        <Button type="submit" icon={<Plus size={17} />}>Aggiungi</Button>
      </form>
      {options.length === 0 ? (
        <EmptyState
          icon={<SlidersHorizontal size={26} />}
          title="Stai usando le opzioni predefinite"
          description={DEFAULT_SERVICE_OPTIONS.map((o) => o.label).join(' · ')}
          action={<Button variant="secondary" onClick={importDefaults}>Importa e personalizza</Button>}
        />
      ) : (
        <ListCard>
          {options.map((o) => (
            <div key={o.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex-1 font-medium text-ink">{o.label}</span>
              <RowActions onDelete={() => remove(`"${o.label}"`, () => deleteDoc(doc(db, 'service_options', o.id)))} />
            </div>
          ))}
        </ListCard>
      )}
    </>
  );
}
