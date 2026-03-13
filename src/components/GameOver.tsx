import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Share2 } from 'lucide-react';

interface GameOverProps {
  score: number;
  time: string;
  onRestart: () => void;
  onRevive: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ score, time, onRestart, onRevive }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl p-10 w-full max-w-sm shadow-2xl text-center"
      >
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-10 h-10 bg-red-500 rounded-full" />
        </div>
        
        <h2 className="text-4xl font-bold text-white mb-2 uppercase tracking-tighter">战败</h2>
        <p className="text-zinc-500 mb-8">你坚持了 {time}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="text-xs text-zinc-500 uppercase font-bold mb-1">得分</div>
            <div className="text-2xl font-mono text-white">{score}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="text-xs text-zinc-500 uppercase font-bold mb-1">击杀</div>
            <div className="text-2xl font-mono text-white">{Math.floor(score / 10)}</div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRevive}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            复活 (看广告/分享)
          </button>
          <button
            onClick={onRestart}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            再试一次
          </button>
        </div>
      </motion.div>
    </div>
  );
};
