import React, { useState } from 'react';
import { X, Cloud, Download, Upload, RotateCcw, Check, AlertCircle } from 'lucide-react';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitsCount: number;
  historyDaysCount: number;
  onExport: () => string;
  /** Returns false if the backup could not be read. */
  onImport: (json: string) => boolean;
  onReset: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  habitsCount,
  historyDaysCount,
  onExport,
  onImport,
  onReset,
}) => {
  const [importText, setImportText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const json = onExport();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `squadgoals-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage({ type: 'success', text: 'Backup downloaded successfully!' });
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Export failed.' });
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const success = onImport(importText);
    if (success) {
      setStatusMessage({ type: 'success', text: 'Habits & history restored! Your EXP stays as it is.' });
      setImportText('');
      setShowImportArea(false);
    } else {
      setStatusMessage({ type: 'error', text: 'Invalid JSON backup format. Please check file.' });
    }
  };

  const handleReset = () => {
    onReset();
    setConfirmReset(false);
    setStatusMessage({ type: 'success', text: 'Reset to the starter habits with 0 EXP.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#FDFBF7] dark:bg-[#1A1816] border border-[#EDE6D8] dark:border-[#2C2825] p-6 shadow-2xl shadow-black/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EDE6D8] dark:border-[#2C2825]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF5EB] dark:bg-[#261B12] border border-[#FADCC0] dark:border-[#FF7A00]/30 text-[#FF7A00] flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB]">
                Cloud Sync & Backup
              </h3>
              <p className="text-xs text-[#736C61] dark:text-[#A39B8F]">
                Synced to your SquadGoals account
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white dark:bg-[#24211E] border border-[#EDE6D8] dark:border-[#332E2A] text-[#736C61] dark:text-[#A39B8F] hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status alert */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-[#EEF8F1] dark:bg-[#13261B] border-[#CDEED8] dark:border-[#10B981]/30 text-[#10B981]'
                : 'bg-[#FFEBEB] dark:bg-[#2D1618] border-[#FFCCD0] dark:border-[#FF5757]/30 text-[#FF5757]'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Current storage statistics */}
        <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-[#221F1C] border border-[#EDE6D8] dark:border-[#2C2825] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#736C61] dark:text-[#A39B8F]">Active Habits:</span>
            <span className="font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tabular-nums">
              {habitsCount} habits
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#736C61] dark:text-[#A39B8F]">Tracked History Days:</span>
            <span className="font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tabular-nums">
              {historyDaysCount} days recorded
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#F2ECE1] dark:border-[#2C2825]">
            <span className="text-[#736C61] dark:text-[#A39B8F]">Storage Type:</span>
            <span className="font-semibold text-[#10B981] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Supabase Cloud
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2.5">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#221F1C] border border-[#EDE6D8] dark:border-[#332E2A] hover:border-[#FF7A00] dark:hover:border-[#FF7A00] text-[#2C2C2C] dark:text-[#F5F2EB] text-xs font-bold hover:shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#FF7A00]" />
            <span>Export Backup File (.json)</span>
          </button>

          <button
            onClick={() => setShowImportArea(!showImportArea)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#221F1C] border border-[#EDE6D8] dark:border-[#332E2A] hover:border-[#D6CAB6] text-[#736C61] dark:text-[#A39B8F] text-xs font-semibold transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{showImportArea ? 'Hide Import Box' : 'Import Backup Data'}</span>
          </button>

          {showImportArea && (
            <div className="p-3 rounded-xl bg-white dark:bg-[#221F1C] border border-[#EDE6D8] dark:border-[#332E2A] space-y-2">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={3}
                placeholder="Paste your JSON backup data here... (restores habits & history; EXP stays tied to your account)"
                className="w-full p-2 text-xs rounded-lg bg-[#FDFBF7] dark:bg-[#1A1816] border border-[#EDE6D8] dark:border-[#332E2A] font-mono text-[#2C2C2C] dark:text-[#F5F2EB] focus:outline-hidden focus:border-[#FF7A00]"
              />
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="w-full py-1.5 rounded-lg bg-[#FF7A00] text-white text-xs font-bold disabled:opacity-50 transition-opacity cursor-pointer"
              >
                Restore From JSON
              </button>
            </div>
          )}

          {/* Reset button */}
          <div className="pt-2 border-t border-[#EDE6D8] dark:border-[#2C2825]">
            {confirmReset ? (
              <div className="p-3 rounded-xl bg-[#FFEBEB] dark:bg-[#2D1618] border border-[#FFCCD0] dark:border-[#FF5757]/40 space-y-2">
                <p className="text-xs font-bold text-[#FF5757]">
                  Reset all habits, history & EXP back to the starter pack? Your leaderboard EXP goes to 0.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-1.5 rounded-lg bg-[#FF5757] text-white text-xs font-bold hover:bg-[#E64848] transition-colors cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 py-1.5 rounded-lg bg-white dark:bg-[#221F1C] text-[#736C61] dark:text-[#A39B8F] text-xs font-medium hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-[#9B9386] dark:text-[#787066] hover:text-[#FF5757] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Starter Pack</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
