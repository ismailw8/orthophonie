import { Modal } from './WorkspaceUI';
import { primaryClass, secondaryClass } from './PageUI';

export default function UnsavedDialog({ blocker, busy = false }) {
  return blocker.state === 'blocked' ? <Modal title="Modifications non enregistrées" onClose={() => blocker.reset()}><p className="text-sm text-slate-600">{busy ? 'Un enregistrement est en cours. Attendez sa réponse avant de quitter la page.' : 'Vous avez des modifications en cours. Quitter cette page les supprimera.'}</p><div className="mt-6 flex flex-wrap justify-end gap-3"><button className={secondaryClass} onClick={() => blocker.reset()}>Continuer la saisie</button><button disabled={busy} className={primaryClass} onClick={() => blocker.proceed()}>Quitter sans enregistrer</button></div></Modal> : null;
}
