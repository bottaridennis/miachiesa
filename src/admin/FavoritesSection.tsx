import { deleteDoc, doc } from 'firebase/firestore';
import { Bookmark } from 'lucide-react';
import { db } from '../lib/firebase';
import { useFavorites } from '../lib/favorites';
import { relativeTime } from '../lib/format';
import { routes } from '../lib/router';
import { EmptyState } from '../components/ui/Feedback';
import { CategoryBadge } from '../components/ui/Badge';
import { ListCard, SectionHeader, useAction } from './common';
import { IconButton } from '../components/ui/Button';

export default function FavoritesSection() {
  const { favorites } = useFavorites();
  const { run } = useAction();
  const sorted = [...favorites].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
      <SectionHeader title="I miei preferiti" description="Gli avvisi che hai salvato per ritrovarli facilmente." />
      {sorted.length === 0 ? (
        <EmptyState icon={<Bookmark size={26} />} title="Nessun preferito" description="Tocca l'icona del segnalibro su un avviso per salvarlo qui." action={<a href="#/" className="font-semibold text-primary">Vai agli avvisi</a>} />
      ) : (
        <ListCard>
          {sorted.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3">
              <a href={`#${routes.notice(f.noticeId)}`} className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <CategoryBadge category={f.category} />
                  <span className="text-xs text-subtle">salvato {relativeTime(f.timestamp)}</span>
                </div>
                <p className="truncate font-semibold text-ink hover:text-primary">{f.title || 'Avviso'}</p>
              </a>
              <IconButton label="Rimuovi dai preferiti" className="text-gold" onClick={() => run(() => deleteDoc(doc(db, 'user_favorites', f.id)), 'Rimosso dai preferiti')}>
                <Bookmark size={18} className="fill-current" />
              </IconButton>
            </div>
          ))}
        </ListCard>
      )}
    </>
  );
}
