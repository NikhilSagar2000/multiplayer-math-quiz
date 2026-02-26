import { useState, FormEvent, useEffect } from 'react';

interface QuestionCardProps {
  expression: string;
  onSubmit: (answer: number) => void;
}

export function QuestionCard({ expression, onSubmit }: QuestionCardProps) {
  const [answer, setAnswer] = useState('');

  // Reset input when question changes
  useEffect(() => {
    setAnswer('');
  }, [expression]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const num = parseInt(answer, 10);
    if (isNaN(num)) return;
    onSubmit(num);
    setAnswer('');
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-5 sm:p-8 border border-slate-700 shadow-xl w-full">
      <div className="text-center mb-5 sm:mb-6">
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-2 sm:mb-3">
          Solve this
        </p>
        <p className="text-2xl sm:text-4xl font-mono font-bold text-white animate-fade-in break-all">
          {expression} = ?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer"
          className="flex-1 min-w-0 px-3 sm:px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors text-center text-lg font-mono"
          autoFocus
        />
        <button
          type="submit"
          disabled={answer === ''}
          className="px-4 sm:px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg transition-colors shrink-0"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
