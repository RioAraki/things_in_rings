import React from 'react';

type GameCompleteModalProps = {
  attempts: number;
  onCheckBoard: () => void;
  isOpen: boolean;
};

const GameCompleteModal: React.FC<GameCompleteModalProps> = ({ attempts, onCheckBoard, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-modal">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-modal-backdrop"
        onClick={onCheckBoard} // Optional: close on backdrop click
      />
      
      {/* Modal Content */}
      <div className="relative z-modal bg-white rounded-xl shadow-xl p-8 max-w-lg w-full mx-4">
        <div className="text-center">
          <h3 className="text-3xl font-bold mb-6">
            Congratulations! 🎉
          </h3>
          
          <div className="mb-8">
            <p className="text-xl text-gray-600">
              You have won the game with <span className="font-semibold text-blue-600">{attempts}</span> attempts!
            </p>
          </div>
          
          <button
            type="button"
            className="w-full py-3 rounded-lg bg-blue-600 text-white text-lg font-semibold hover:bg-blue-700 transition-colors"
            onClick={onCheckBoard}
          >
            Check the Board
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameCompleteModal; 