interface StatusMessageProps {
  text: string;
  type: 'success' | 'error' | 'info';
}

const typeStyles = {
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
};

export function StatusMessage({ text, type }: StatusMessageProps) {
  return (
    <div
      className={`px-4 py-2 rounded-lg border text-sm text-center transition-opacity duration-300 ${typeStyles[type]}`}
    >
      {text}
    </div>
  );
}
