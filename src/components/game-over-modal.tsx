import React from 'react';

interface GameOverModalProps {
  attempts: number;
  onPlayAgain: () => void;
  isOpen: boolean;
}

export default function GameOverModal({ attempts, onPlayAgain, isOpen }: GameOverModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
        aria-hidden="true" 
      />

      {/* Modal */}
      <div className="relative z-10 mx-auto max-w-sm rounded-lg bg-white/90 backdrop-blur-md p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Game Over!
        </h2>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            You've run out of words to place. Don't worry, you can always try again!
          </p>
          
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-gray-600">
              Attempts: <span className="font-semibold">{attempts}</span>
            </p>
          </div>
          
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={onPlayAgain}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 