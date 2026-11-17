import { Bookmark, Paperclip, Pin } from 'lucide-react';
import type { Notice } from '../types';
import { Card } from './ui/Card';
import { CategoryBadge, ParishBadge } from './ui/Badge';
import { relativeTime } from '../lib/format';
import { navigate, routes } from '../lib/router';
import { cn } from '../lib/cn';
import { isSafeUrl } from '../lib/format';

export function noticeImages(n: Notice): string[] {
  const imgs = n.images?.length ? n.images : n.imageUrl ? [n.imageUrl] : [];
  return imgs.filter(isSafeUrl);
}

export function noticeDate(n: Notice) {
  return n.timestamp ? relativeTime(n.timestamp) : n.date ?? '';
}

export function FavoriteButton({ active, onToggle, className }: { active: boolean; onToggle: () => void; className?: string }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={active}
      aria-label={active ? 'Rimuovi dai preferiti' : 'Salva nei preferiti'}
      title={active ? 'Rimuovi dai preferiti' : 'Salva nei preferiti'}
      className={cn('rounded-xl p-2 transition-colors', active ? 'text-gold' : 'text-subtle hover:bg-surface-2 hover:text-ink', className)}
    >
      <Bookmark size={19} className={active ? 'fill-current' : ''} />
    </button>
  );
}

export function NoticeCard({ notice, favorite, onToggleFavorite, featured }: { notice: Notice; favorite: boolean; onToggleFavorite: () => void; featured?: boolean }) {
  const imgs = noticeImages(notice);
  const open = () => navigate(routes.notice(notice.id));
  return (
    <Card
      interactive
      onClick={open}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && open()}
      className={cn('group flex overflow-hidden', featured ? 'flex-col' : 'flex-col sm:flex-row', notice.category === 'Urgente' && 'ring-2 ring-danger/30')}
    >
      {imgs[0] && (
        <div className={cn('relative shrink-0 overflow-hidden bg-surface-2', featured ? 'aspect-[16/9]' : 'aspect-[16/9] sm:aspect-auto sm:w-56')}>
          <img src={imgs[0]} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          {imgs.length > 1 && <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">+{imgs.length - 1}</span>}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {notice.pinned && <Pin size={14} className="fill-gold text-gold" aria-label="In evidenza" />}
            <CategoryBadge category={notice.category} />
            {notice.parish && notice.parish !== 'Unità Pastorale' && <ParishBadge parish={notice.parish} />}
          </div>
          <FavoriteButton active={favorite} onToggle={onToggleFavorite} className="-mr-2 -mt-2" />
        </div>
        <h3 className={cn('font-semibold leading-snug', featured ? 'text-2xl' : 'text-lg')}>{notice.title}</h3>
        <p className={cn('mt-2 whitespace-pre-line text-[15px] leading-relaxed text-muted', featured ? 'line-clamp-4' : 'line-clamp-3')}>{notice.content}</p>
        <div className="mt-auto flex items-center gap-3 pt-4 text-xs font-medium text-subtle">
          <span>{noticeDate(notice)}</span>
          {notice.attachmentUrl && (
            <span className="flex items-center gap-1">
              <Paperclip size={13} /> Allegato
            </span>
          )}
          <span className="ml-auto font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">Leggi →</span>
        </div>
      </div>
    </Card>
  );
}
