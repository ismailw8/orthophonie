import { appointmentDate, axisPercent, formatDate } from './workflow.js';

const W = 595;
const H = 842;
const M = 48;
const winAnsi = { '€': 128, '…': 133, 'Œ': 140, '‘': 145, '’': 146, '“': 147, '”': 148, '–': 150, '—': 151, 'œ': 156, 'Ÿ': 159 };

const bytes = (text) => Array.from(text, (char) => winAnsi[char] ?? (char.charCodeAt(0) < 256 ? char.charCodeAt(0) : 63));
const safe = (value) => String(value ?? '').replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)').replace(/[\r\n\t]+/g, ' ');
const value = (input, fallback = 'Non renseigné') => String(input ?? '').trim() || fallback;
const date = (input, withTime = false) => {
    if (!input) return 'À confirmer';
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) return value(input);
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(parsed);
};
const status = (input) => ({ EN_ATTENTE: 'En attente', CONFIRME: 'Confirmé', ANNULE: 'Annulé', TERMINE: 'Terminé', REFUSE: 'Refusé' }[input] || value(input));

const wrap = (text, width, size) => {
    const limit = Math.max(15, Math.floor(width / (size * 0.52)));
    const result = [];
    String(text ?? '').split(/\r?\n/).forEach((paragraph) => {
        let line = '';
        const words = paragraph.trim().split(/\s+/).filter(Boolean);
        if (!words.length) result.push('');
        words.forEach((word) => {
            const next = line ? `${line} ${word}` : word;
            if (next.length <= limit) line = next;
            else { if (line) result.push(line); line = word; }
        });
        if (line) result.push(line);
    });
    return result;
};

class Pdf {
    constructor() { this.pages = []; this.commands = []; this.newPage(); }
    text(text, x, y, size = 10, bold = false, color = '0.25 0.32 0.40') {
        this.commands.push(`BT ${color} rg /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${safe(text)}) Tj ET`);
    }
    line(y, color = '0.84 0.88 0.91') { this.commands.push(`${color} RG .8 w ${M} ${y} m ${W - M} ${y} l S`); }
    newPage() {
        if (this.commands.length) this.pages.push(this.commands.join('\n'));
        this.commands = ['0.02 0.25 0.39 rg 0 760 595 82 re f'];
        this.text('CABINET D’ORTHOPHONIE', M, 792, 11, true, '1 1 1');
        this.text('Dossier patient', 465, 792, 10, false, '1 1 1');
        this.y = 724;
    }
    space(required) { if (this.y - required < 62) this.newPage(); }
    paragraph(text, size = 10) {
        const lines = wrap(value(text), W - (M * 2), size); this.space((lines.length * 15) + 8);
        lines.forEach((line) => { this.text(line, M, this.y, size); this.y -= 15; }); this.y -= 5;
    }
    section(title) {
        this.space(48); this.y -= 7; this.text(title.toUpperCase(), M, this.y, 12, true, '0.02 0.25 0.39');
        this.y -= 13; this.line(this.y, '0.02 0.45 0.68'); this.y -= 20;
    }
    field(label, content) {
        this.space(23); this.text(label, M, this.y, 9, true, '0.02 0.25 0.39');
        this.text(value(content), M + 148, this.y, 10); this.y -= 21;
    }
    card(title, details) {
        const lines = details.flatMap((detail) => wrap(detail, W - (M * 2) - 32, 9));
        const height = 39 + (lines.length * 13); this.space(height + 10);
        this.commands.push(`0.94 0.97 0.98 rg 0.84 0.88 0.91 RG ${M} ${this.y - height + 12} ${W - (M * 2)} ${height} re B`);
        this.text(title, M + 16, this.y - 8, 10, true, '0.02 0.25 0.39');
        let lineY = this.y - 27;
        lines.forEach((line) => { this.text(line, M + 16, lineY, 9); lineY -= 13; });
        this.y -= height + 10;
    }
    blob() {
        this.pages.push(this.commands.join('\n'));
        const totalPages = this.pages.length;
        this.pages = this.pages.map((page, index) => `${page}\nBT .25 .32 .40 rg /F1 8 Tf 1 0 0 1 48 32 Tm (Document confidentiel - généré le ${safe(date(new Date(), true))}) Tj ET\nBT .25 .32 .40 rg /F1 8 Tf 1 0 0 1 505 32 Tm (Page ${index + 1} / ${totalPages}) Tj ET`);
        const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
        const pageIds = [];
        this.pages.forEach((stream) => {
            const pageId = objects.length + 1; pageIds.push(pageId);
            objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageId + 1} 0 R >>`);
            objects.push(`<< /Length ${bytes(stream).length} >>\nstream\n${stream}\nendstream`);
        });
        objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
        const chunks = [bytes('%PDF-1.4\n%âãÏÓ\n')]; const offsets = [0]; let offset = chunks[0].length;
        objects.forEach((object, index) => { offsets.push(offset); const chunk = bytes(`${index + 1} 0 obj\n${object}\nendobj\n`); chunks.push(chunk); offset += chunk.length; });
        let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
        offsets.slice(1).forEach((item) => { xref += `${String(item).padStart(10, '0')} 00000 n \n`; });
        xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;
        chunks.push(bytes(xref)); const result = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0)); let cursor = 0;
        chunks.forEach((chunk) => { result.set(chunk, cursor); cursor += chunk.length; });
        return new Blob([result], { type: 'application/pdf' });
    }
}

export const createPatientPdfBlob = ({ user, dashboard, appointments = [] }) => {
    const pdf = new Pdf(); const bilan = dashboard?.bilan;
    pdf.text('DOSSIER DE SUIVI ORTHOPHONIQUE', M, pdf.y, 20, true, '0.02 0.25 0.39'); pdf.y -= 31;
    pdf.paragraph('Synthèse personnelle du suivi et des rendez-vous enregistrés par le cabinet.');
    pdf.section('Informations patient');
    pdf.field('Nom', bilan?.patientNom || user?.firstName || 'Patient');
    pdf.field('Adresse e-mail', bilan?.patientEmail || user?.email);
    pdf.field('Dernière mise à jour', date(bilan?.updatedAt, true));
    pdf.section('Synthèse du suivi');
    pdf.field('Progression globale', `${dashboard?.progressionGlobale || 0} %`);
    pdf.field('Séances effectuées', dashboard?.seancesEffectuees ?? 0);
    pdf.field('Séances prévues', dashboard?.seancesPrevues ?? 0);
    pdf.section('Objectifs thérapeutiques');
    if (!bilan?.axes?.length) pdf.paragraph('Aucun objectif n’est actuellement renseigné.');
    else bilan.axes.forEach((axis, index) => pdf.card(`${index + 1}. ${value(axis.nom || axis.titre, 'Objectif')}`, [`Progression : ${axisPercent(axis)} %`, ...(axis.commentaire ? [axis.commentaire] : [])]));
    pdf.section('Note du cabinet'); pdf.paragraph(bilan?.remarques || 'Aucune note n’est actuellement renseignée.');
    const sessions = [...(dashboard?.prochainesSeances || []), ...(dashboard?.seancesPassees || [])].sort((a, b) => String(b.dateSeance || '').localeCompare(String(a.dateSeance || '')));
    pdf.section('Séances');
    if (!sessions.length) pdf.paragraph('Aucune séance enregistrée.');
    else sessions.forEach((session) => pdf.card(value(session.titre, 'Séance'), [`${date(session.dateSeance, true)} - ${session.effectuee ? 'Effectuée' : 'Planifiée'}`, ...(session.description ? [session.description] : [])]));
    pdf.section('Rendez-vous');
    if (!appointments.length) pdf.paragraph('Aucun rendez-vous enregistré.');
    else appointments.forEach((appointment) => pdf.card(`${formatDate(appointmentDate(appointment))}`, [`Statut : ${status(appointment.status)}`, `Motif : ${value(appointment.motif)}`, ...(appointment.notes ? [`Note : ${appointment.notes}`] : [])]));
    pdf.space(55); pdf.line(pdf.y); pdf.y -= 24;
    pdf.paragraph('Ce document est une synthèse informative de votre espace patient. Pour toute question clinique ou correction, contactez directement le cabinet.', 8);
    return pdf.blob();
};

export const downloadPatientPdf = (patientData) => {
    const url = URL.createObjectURL(createPatientPdfBlob(patientData)); const link = document.createElement('a');
    link.href = url; link.download = `dossier-orthophonie-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
