import { Loader2, Github } from "lucide-react";

interface SyncOverlayProps {
  isVisible: boolean;
  message: string;
}

export function SyncOverlay({ isVisible, message }: SyncOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center">
        {/* Decorative background glow */}
        <div className="absolute -inset-20 bg-blue-500/20 blur-[80px] rounded-full animate-pulse px-20 py-20" />
        
        {/* Animated rings */}
        <div className="relative">
             <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full scale-150 animate-ping duration-[3000ms]" />
             <div className="absolute inset-0 border border-blue-400/10 rounded-full scale-[2] animate-ping duration-[4000ms] delay-700" />
             
             <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-2xl relative z-10 flex flex-col items-center transition-colors">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full" />
                    <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-5 rounded-3xl shadow-lg relative z-10">
                        <Github className="text-white w-10 h-10 animate-pulse" />
                    </div>
                </div>
                
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight transition-colors">
                    {message}
                </h3>
                
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm font-medium tracking-wide transition-colors">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500 dark:text-blue-400" />
                    <span>Preparando seu vault...</span>
                </div>
             </div>
        </div>

        {/* Loading progress indicator */}
        <div className="mt-12 w-48 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 animate-progress w-full" 
                 style={{ 
                    animation: 'progress-infinite 2s linear infinite',
                    backgroundSize: '200% 100%'
                 }} 
            />
        </div>
      </div>

      <style>{`
        @keyframes progress-infinite {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
