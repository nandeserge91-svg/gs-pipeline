interface DelivererNoteProps {
  note?: string | null;
}

// Note saisie par le livreur (dont la cause d'un refus), affichée aux responsables
export default function DelivererNote({ note }: DelivererNoteProps) {
  if (!note) return null;

  return (
    <p className="mt-1 min-w-[160px] max-w-[220px] whitespace-pre-wrap break-words text-left text-xs text-gray-700">
      <strong>📝 Note livreur :</strong> {note}
    </p>
  );
}
