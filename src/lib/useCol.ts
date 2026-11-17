import { useEffect } from 'react';
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
  const data = (snap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? []) as T[];
  return { data, loading: loading && !snap, error };
}

export function useDocData<T>(ref: DocumentReference | null | undefined) {
  const [snap, loading, error] = useDocument(ref);
  useReportError(error);
  const data = snap?.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
  return { data, loading: loading && !snap, error, exists: !!snap?.exists() };
}
