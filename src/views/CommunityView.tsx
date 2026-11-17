import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { collection, doc, query, where } from 'firebase/firestore';
import { ArrowLeft, CalendarDays, ChevronRight, Mail, Megaphone, UserRound, Users } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCol, useDocData } from '../lib/useCol';
import { useGroups, useUpcomingEvents } from '../lib/data';
import { useFavorites } from '../lib/favorites';
import { routes } from '../lib/router';
import { cn } from '../lib/cn';
import { parseISODate } from '../lib/format';
import { Page, PageHeader, SectionTitle } from '../components/ui/Page';
import { Card } from '../components/ui/Card';
import { ParishBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState, Skeleton, SkeletonList } from '../components/ui/Feedback';
import { EventCard } from '../components/EventCard';
import { NoticeCard } from '../components/NoticeCard';
import type { CommunityMember, Group, Notice, ParishEvent } from '../types';

export default function CommunityView({ groupId }: { groupId?: string }) {
  if (groupId) return <GroupDetail id={groupId} />;
  return <CommunityHome />;
}

function groupByMonth(events: ParishEvent[]) {
  const out: { key: string; label: string; items: ParishEvent[] }[] = [];
  for (const e of events) {
    const d = parseISODate(e.date);
    const key = d ? `${d.getFullYear()}-${d.getMonth()}` : 'x';
    const label = d ? d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }) : 'Data da definire';
    let bucket = out.find((b) => b.key === key);
    if (!bucket) out.push((bucket = { key, label, items: [] }));
    bucket.items.push(e);
  }
  return out;
}

function CommunityHome() {
  const { data: events, loading: eventsLoading } = useUpcomingEvents(60);
  const { data: groups, loading: groupsLoading } = useGroups();
  const { data: membersRaw } = useCol<CommunityMember>(collection(db, 'community_members'));
  const [parish, setParish] = useState<'Tutte' | 'Oppeano' | "Ca' degli Oppi">('Tutte');

  const members = [...membersRaw].sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || (a.timestamp ?? 0) - (b.timestamp ?? 0));
  const filteredEvents = events.filter((e) => parish === 'Tutte' || !e.parish || e.parish === 'Unità Pastorale' || e.parish === parish);
  const months = useMemo(() => groupByMonth(filteredEvents), [filteredEvents]);

  return (
    <Page wide>
      <PageHeader eyebrow="Comunità" title="La nostra famiglia parrocchiale" description="Eventi in programma, gruppi e persone che animano la vita delle nostre parrocchie." icon={<Users size={26} />} />

      {members.length > 0 && (
        <section className="mb-12">
          <SectionTitle title="Chi siamo" icon={<UserRound size={20} />} />
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
            {members.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="w-40 shrink-0 snap-start sm:w-auto">
                <Card className="flex h-full flex-col items-center p-5 text-center">
                  <Avatar src={m.photoUrl} name={m.name} size={84} className="mb-3 ring-4 ring-surface-2" />
                  <p className="font-semibold leading-tight text-ink">{m.name}</p>
                  <p className="mt-1 text-sm text-muted">{m.role}</p>
                  {m.parish && m.parish !== 'Unità Pastorale' && <ParishBadge parish={m.parish} className="mt-2" />}
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        <section className="min-w-0">
          <SectionTitle
            title="Calendario eventi"
            icon={<CalendarDays size={20} />}
            action={
              <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
                {(['Tutte', 'Oppeano', "Ca' degli Oppi"] as const).map((p) => (
                  <button key={p} onClick={() => setParish(p)} className={cn('rounded-lg px-2.5 py-1 text-xs font-semibold transition-all', parish === p ? 'bg-surface text-ink shadow-sm' : 'text-muted')}>
                    {p === "Ca' degli Oppi" ? "Ca' d. Oppi" : p}
                  </button>
                ))}
              </div>
            }
          />
          {eventsLoading ? (
            <SkeletonList count={3} className="h-28" />
          ) : months.length === 0 ? (
            <EmptyState icon={<CalendarDays size={26} />} title="Nessun evento in programma" description="Gli eventi futuri compariranno qui." />
          ) : (
            <div className="space-y-8">
              {months.map((m) => (
                <div key={m.key}>
                  <h3 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-muted first-letter:uppercase">{m.label}</h3>
                  <div className="space-y-3">
                    {m.items.map((e) => (
                      <EventCard key={e.id} event={e} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="min-w-0">
          <SectionTitle title="Gruppi" icon={<Users size={20} />} />
          {groupsLoading ? (
            <SkeletonList count={4} className="h-16" />
          ) : groups.length === 0 ? (
            <EmptyState className="py-8" title="Nessun gruppo" />
          ) : (
            <Card className="divide-y divide-line overflow-hidden">
              {groups.map((g) => (
                <a key={g.id} href={`#${routes.group(g.id)}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-serif font-semibold text-primary">{g.name.charAt(0)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{g.name}</span>
                    <span className="block truncate text-xs text-muted">{g.description || g.parish}</span>
                  </span>
                  <ChevronRight size={18} className="text-subtle" />
                </a>
              ))}
            </Card>
          )}
        </section>
      </div>
    </Page>
  );
}

function GroupDetail({ id }: { id: string }) {
  const { data: group, loading } = useDocData<Group>(doc(db, 'groups', id));
  const { data: allEvents } = useUpcomingEvents(100);
  // niente orderBy: evitiamo di richiedere un indice composito, ordiniamo lato client
  const { data: noticesRaw } = useCol<Notice>(query(collection(db, 'notices'), where('groupId', '==', id)));
  const notices = [...noticesRaw].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  const { ids, toggle } = useFavorites();

  if (loading)
    return (
      <Page>
        <Skeleton className="h-48" />
      </Page>
    );
  if (!group)
    return (
      <Page>
        <EmptyState title="Gruppo non trovato" action={<a href={`#${routes.community}`} className="font-semibold text-primary">Torna alla comunità</a>} />
      </Page>
    );

  const events = allEvents.filter((e) => e.groupId === group.id || (!e.groupId && e.group === group.name));

  return (
    <Page>
      <a href={`#${routes.community}`} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={18} /> Comunità
      </a>
      <Card className="relative mb-10 overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-soft blur-2xl" />
        <div className="relative flex items-start gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary font-serif text-3xl font-semibold text-on-primary">{group.name.charAt(0)}</span>
          <div className="min-w-0">
            <ParishBadge parish={group.parish} />
            <h1 className="mt-2 text-3xl font-semibold">{group.name}</h1>
            {group.description && <p className="mt-2 whitespace-pre-line text-ink-2">{group.description}</p>}
            {group.meetingInfo && <p className="mt-3 text-sm text-muted">🕒 {group.meetingInfo}</p>}
            {group.contact && (
              <a href={group.contact.includes('@') ? `mailto:${group.contact}` : `tel:${group.contact.replace(/\s/g, '')}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <Mail size={15} /> {group.contact}
              </a>
            )}
          </div>
        </div>
        {group.leaders && group.leaders.length > 0 && (
          <div className="relative mt-6 flex flex-wrap gap-4 border-t border-line pt-5">
            {group.leaders.map((l, i) => (
              <span key={i} className="flex items-center gap-2.5">
                <Avatar src={l.imageUrl} name={l.name} size={36} />
                <span>
                  <span className="block text-sm font-semibold text-ink">{l.name}</span>
                  <span className="block text-xs text-muted">{l.role || 'Responsabile'}</span>
                </span>
              </span>
            ))}
          </div>
        )}
      </Card>

      <section className="mb-10">
        <SectionTitle title="Prossimi incontri" icon={<CalendarDays size={20} />} />
        {events.length === 0 ? <EmptyState className="py-8" title="Nessun evento in programma" /> : <div className="space-y-3">{events.map((e) => <EventCard key={e.id} event={e} />)}</div>}
      </section>

      <section>
        <SectionTitle title="Avvisi del gruppo" icon={<Megaphone size={20} />} />
        {notices.length === 0 ? (
          <EmptyState className="py-8" title="Nessun avviso pubblicato" />
        ) : (
          <div className="space-y-4">
            {notices.map((n) => (
              <NoticeCard key={n.id} notice={n} favorite={ids.has(n.id)} onToggleFavorite={() => toggle(n)} />
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}
