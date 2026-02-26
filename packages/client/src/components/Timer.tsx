interface TimerProps {
  remainingSeconds: number;
  totalSeconds: number;
}

export function Timer({ remainingSeconds, totalSeconds }: TimerProps) {
  const percentage = (remainingSeconds / totalSeconds) * 100;
  const isLow = remainingSeconds <= 10;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-400 uppercase tracking-wide">
          Time Remaining
        </span>
        <span
          className={`text-sm font-mono font-bold ${
            isLow ? 'text-red-400' : 'text-slate-300'
          }`}
        >
          {remainingSeconds}s
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            isLow ? 'bg-red-500' : percentage > 50 ? 'bg-amber-500' : 'bg-orange-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
