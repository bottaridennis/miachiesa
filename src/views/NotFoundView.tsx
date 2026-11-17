import { Compass } from 'lucide-react';
import { Page } from '../components/ui/Page';
import { EmptyState } from '../components/ui/Feedback';

export default function NotFoundView() {
  return (
    <Page>
      <EmptyState
        className="mt-10"
        icon={<Compass size={26} />}
        title="Pagina non trovata"
        description="Il collegamento potrebbe essere errato o la pagina è stata spostata."
        action={<a href="#/" className="font-semibold text-primary">Torna alla home</a>}
      />
    </Page>
  );
}
