import { collection, deleteDoc, doc, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { useSession } from './session';
import { useCol } from './useCol';
import { useToast } from '../components/ui/Toast';
import type { Notice } from '../types';

export interface Favorite {
  id: string;
  userId: string;
  noticeId: string;
  timestamp: number;
  title?: string;
  category?: string;
  parish?: string;
}

export function useFavorites() {
  const { user, login } = useSession();
  const toast = useToast();
  const { data } = useCol<Favorite>(user ? query(collection(db, 'user_favorites'), where('userId', '==', user.uid)) : null);
  const ids = new Set(data.map((f) => f.noticeId));

  const toggle = async (n: Notice) => {
    if (!user) {
      toast.info('Accedi per salvare gli avvisi tra i preferiti.');
      login();
      return;
    }
    const ref = doc(db, 'user_favorites', `${user.uid}_${n.id}`);
    try {
      if (ids.has(n.id)) {
        await deleteDoc(ref);
        toast.info('Rimosso dai preferiti');
      } else {
        // Salviamo solo un riferimento leggero, non tutto l'avviso con le immagini base64
        await setDoc(ref, {
          userId: user.uid,
          noticeId: n.id,
          title: n.title,
          category: n.category ?? 'Avviso',
          parish: n.parish ?? 'Unità Pastorale',
          timestamp: Date.now(),
        });
        toast.success('Salvato nei preferiti');
      }
    } catch (e) {
      console.error(e);
      toast.error('Operazione non riuscita.');
    }
  };

  return { favorites: data, ids, toggle };
}
