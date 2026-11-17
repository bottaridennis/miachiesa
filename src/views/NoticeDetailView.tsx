import { useState } from 'react';
import { doc } from 'firebase/firestore';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { useDocData } from '../lib/useCol';
import { useFavorites } from '../lib/favorites';
import { formatDate, isSafeUrl } from '../lib/format';
import { routes } from '../lib/router';
import { absoluteUrl, shareOrCopy } from '../lib/share';
import { useToast } from '../components/ui/Toast';
import { Page } from '../components/ui/Page';
import { Button } from '../components/ui/Button';
import { CategoryBadge, ParishBadge } from '../components/ui/Badge';
import { EmptyState, Skeleton } from '../components/ui/Feedback';
import { FavoriteButton, noticeImages } from '../components/NoticeCard';
import type { Notice } from '../types';

export default function NoticeDetailView({ id }: { id: string }) {
  const { data: notice, loading } = useDocData<Notice>(doc(db, 'notices', id));
  const { ids, toggle } = useFavorites();
  const toast = useToast();
  const [idx, setIdx] = useState(0);

  if (loading)
    return (
      <Page>
        <Skeleton className="mb-6 h-8 w-32" />
        <Skeleton className="mb-4 aspect-video w-full" />
        <Skeleton className="h-40" />
      </Page>
    );

  if (!notice)
    return (
      <Page>
        <EmptyState title="Avviso non trovato" description="Potrebbe essere stato rimosso." action={<a href="#/" className="font-semibold text-primary">Torna alla home</a>} />
      </Page>
    );

  const imgs = noticeImages(notice);
  const share = async () => {
    const r = await shareOrCopy({ title: notice.title, text: notice.content.slice(0, 140), url: absoluteUrl(routes.notice(notice.id)) });
    if (r === 'copied') toast.success('Link copiato negli appunti');
    if (r === 'failed') toast.error('Impossibile condividere');
  };

  return (
    <Page>
      <button onClick={() => history.length > 1 ? history.back() : (location.hash = '/')} className="mb-6 inline-flex items-center gap-2 rounded-xl py-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={18} /> Indietro
      </button>
      <article>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <CategoryBadge category={notice.category} />
          <ParishBadge parish={notice.parish} />
        </div>
        <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">{notice.title}</h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
          <p className="text-sm text-muted">
            {notice.timestamp ? formatDate(notice.timestamp, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : notice.date}
            {notice.authorName && <> · {notice.authorName}</>}
          </p>
          <div className="flex items-center gap-1">
            <FavoriteButton active={ids.has(notice.id)} onToggle={() => toggle(notice)} />
            <Button variant="ghost" size="sm" icon={<Share2 size={16} />} onClick={share}>
              Condividi
            </Button>
          </div>
        </div>

        {imgs.length > 0 && (
          <figure className="relative mt-6 overflow-hidden rounded-2xl bg-surface-2">
            <img src={imgs[idx]} alt="" className="max-h-[70vh] w-full object-contain" />
            {imgs.length > 1 && (
              <>
                <button onClick={() => setIdx((idx - 1 + imgs.length) % imgs.length)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70" aria-label="Immagine precedente">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => setIdx((idx + 1) % imgs.length)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70" aria-label="Immagine successiva">
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {imgs.map((_, i) => (
                    <button key={i} onClick={() => setIdx(i)} className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} aria-label={`Immagine ${i + 1}`} />
                  ))}
                </div>
              </>
            )}
          </figure>
        )}

        <div className="prose-reading mt-8 whitespace-pre-line">{notice.content}</div>

        {notice.attachmentUrl && isSafeUrl(notice.attachmentUrl) && (
          <a href={notice.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 pr-6 shadow-card transition-colors hover:border-primary/40">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Download size={20} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">Scarica l'allegato</span>
              <span className="block text-xs text-muted">Si apre in una nuova scheda</span>
            </span>
          </a>
        )}
      </article>
    </Page>
  );
}
