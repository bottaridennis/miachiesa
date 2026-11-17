import { useEffect, useMemo } from 'react';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import type { DocumentReference, FirestoreError, Query } from 'firebase/firestore';

/** Notifica globale degli errori di accesso: l'app mostra un banner invece di finti "stati vuoti" */
export const DATA_ERROR_EVENT = 'miachiesa:data-error';

function useReportError(error?: FirestoreError) {
  useEffect(() => {
    if (!error) return;
    console.error('Firestore:', error);
    window.dispatchEvent(new CustomEvent(DATA_ERROR_EVENT, { detail: error.code }));
  }, [error]);
}

/** Wrapper tipizzato su useCollection che restituisce direttamente gli oggetti con id */
export function useCol<T extends { id: string }>(q: Query | null | undefined) {
  const [snap, loading, error] = useCollection(q);
  useReportError(error);
  // Riferimento stabile finché lo snapshot non cambia: senza useMemo ogni render creava un array nuovo
  // e gli useEffect che dipendono dai dati entravano in un ciclo infinito (es. form del profilo).
  const data = useMemo(() => (snap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? []) as T[], [snap]);
  return { data, loading: loading && !snap, error };
}

export function useDocData<T>(ref: DocumentReference | null | undefined) {
  const [snap, loading, error] = useDocument(ref);
  useReportError(error);
  const data = useMemo(() => (snap?.exists() ? ({ id: snap.id, ...snap.data() } as T) : null), [snap]);
  return { data, loading: loading && !snap, error, exists: !!snap?.exists() };
}
