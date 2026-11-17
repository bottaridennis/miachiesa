import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, HandHeart, Landmark, Receipt } from 'lucide-react';
import { useSiteConfig } from '../lib/siteConfig';
import { copyText } from '../lib/share';
import { Page, PageHeader } from '../components/ui/Page';
import { Card } from '../components/ui/Card';
import { EmptyState, Notice, SkeletonList } from '../components/ui/Feedback';
import { useToast } from '../components/ui/Toast';

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  return (
    <button
      onClick={async () => {
        if (await copyText(value)) {
          setCopied(true);
          toast.success(`${label} copiato`);
          setTimeout(() => setCopied(false), 2000);
        }
      }}
      className="group flex w-full items-center justify-between gap-4 rounded-xl bg-surface-2 p-4 text-left transition-colors hover:bg-surface-3"
    >
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">{label}</span>
        <span className={`mt-0.5 block break-all text-ink ${mono ? 'font-mono text-[15px] tracking-wide' : 'text-sm font-medium'}`}>{value}</span>
      </span>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${copied ? 'bg-success-soft text-success' : 'bg-surface text-muted group-hover:text-ink'}`}>
        {copied ? <Check size={17} /> : <Copy size={17} />}
      </span>
    </button>
  );
}

const formatIban = (iban: string) => iban.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();

export default function DonationsView() {
  const { config, loading } = useSiteConfig();

  return (
    <Page>
      <PageHeader
        eyebrow="Donazioni"
        title="Sostieni la tua parrocchia"
        description="Il tuo contributo sostiene le opere di carità, le attività pastorali e la cura delle nostre chiese. Grazie di cuore per la tua generosità."
        icon={<HandHeart size={26} />}
      />

      {loading ? (
        <SkeletonList count={2} className="h-64" />
      ) : config.donations.length === 0 ? (
        <EmptyState icon={<Landmark size={26} />} title="Coordinate in arrivo" description="Le coordinate bancarie per le donazioni saranno pubblicate a breve. Nel frattempo puoi contattare la segreteria." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {config.donations.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="flex h-full flex-col p-6">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-soft text-gold">
                  <Landmark size={22} />
                </span>
                <h2 className="text-xl font-semibold">{d.title}</h2>
                {d.description && <p className="mt-1.5 text-sm text-muted">{d.description}</p>}
                <div className="mt-5 space-y-2.5">
                  <CopyRow label="IBAN" value={formatIban(d.iban)} mono />
                  {d.holder && <CopyRow label="Intestatario" value={d.holder} />}
                  {d.reason && <CopyRow label="Causale consigliata" value={d.reason} />}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Notice tone="info" icon={<Receipt size={18} />}>
          <strong>Agevolazioni fiscali.</strong> Le erogazioni liberali effettuate con mezzi tracciabili (come il bonifico) possono essere detraibili o deducibili ai sensi di legge. Conserva la ricevuta del bonifico.
        </Notice>
      </div>
    </Page>
  );
}
