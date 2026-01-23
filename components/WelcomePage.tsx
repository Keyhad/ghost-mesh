interface WelcomePageProps {
  phoneInput: string;
  onPhoneInputChange: (value: string) => void;
  onContinue: () => void;
}

export const WelcomePage = ({ phoneInput, onPhoneInputChange, onContinue }: WelcomePageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 grid place-items-center p-6">
      <div className="w-full max-w-md p-10 card-container bg-white/80 dark:bg-zinc-900/80">
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="material-symbols-rounded text-4xl leading-none">hub</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-none">GhostMesh</h1>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Enter the decentralized mesh network</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-4 w-full">
            <span className="material-symbols-rounded text-gray-400 text-4xl leading-none">call</span>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center">Phone Number</label>
            <div className="flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-zinc-800 px-5 py-3.5 w-full max-w-xs">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => onPhoneInputChange(e.target.value)}
                placeholder="+1234567890"
                className="w-full bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400 text-center leading-none"
                onKeyPress={(e) => e.key === 'Enter' && onContinue()}
                autoFocus
              />
            </div>
          </div>

          <button
            onClick={onContinue}
            disabled={!phoneInput.trim()}
            className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all leading-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
