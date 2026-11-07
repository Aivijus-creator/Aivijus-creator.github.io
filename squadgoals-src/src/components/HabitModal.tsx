import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Check } from 'lucide-react';
import { Habit, HabitCategory } from '../types';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Omit<Habit, 'id' | 'createdAt'>, existingId?: string) => void;
  initialHabit?: Habit | null;
}

const PRESET_ICONS = ['💧', '🏃', '📖', '🧘', '🎯', '🌙', '🥗', '☕', '✍️', '🚴', '🧹', '🎨', '💊', '🍎', '💻'];

const PRESET_COLORS = [
  '#FF7A00', // Sunset Orange
  '#FF5757', // Coral Red
  '#0EA5E9', // Sky Blue
  '#10B981', // Emerald Green
  '#8B5CF6', // Purple
  '#F59E0B', // Amber Gold
  '#EC4899', // Pink
  '#6366F1', // Indigo
];

const PRESET_IDEAS: { name: string; category: HabitCategory; icon: string; color: string; desc: string }[] = [
  { name: 'Drink 2L Water', category: 'health', icon: '💧', color: '#0EA5E9', desc: 'Hydrate throughout the day' },
  { name: '15m Morning Walk', category: 'fitness', icon: '🏃', color: '#FF5757', desc: 'Fresh air & sunlight' },
  { name: 'Read 15 Pages', category: 'mind', icon: '📖', color: '#FF7A00', desc: 'Read before bedtime' },
  { name: 'Meditation (5m)', category: 'mind', icon: '🧘', color: '#8B5CF6', desc: 'Deep breath stillness' },
  { name: 'Eat a Healthy Meal', category: 'health', icon: '🥗', color: '#10B981', desc: 'Greens & wholesome fuel' },
  { name: 'Gratitude Journal', category: 'mind', icon: '✍️', color: '#F59E0B', desc: '3 things I am thankful for' },
  { name: 'Zero Screens by 11 PM', category: 'lifestyle', icon: '🌙', color: '#8B5CF6', desc: 'Peaceful sleep wind-down' },
  { name: 'Stretch for 10 mins', category: 'fitness', icon: '🧘', color: '#FF5757', desc: 'Loosen tight neck and back' },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('health');
  const [icon, setIcon] = useState('💧');
  const [color, setColor] = useState('#FF7A00');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(7);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialHabit) {
      setName(initialHabit.name);
      setDescription(initialHabit.description || '');
      setCategory(initialHabit.category);
      setIcon(initialHabit.icon);
      setColor(initialHabit.color);
      setTargetDaysPerWeek(initialHabit.targetDaysPerWeek);
    } else {
      setName('');
      setDescription('');
      setCategory('health');
      setIcon('💧');
      setColor('#FF7A00');
      setTargetDaysPerWeek(7);
    }
    setError('');
  }, [initialHabit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a habit title');
      return;
    }

    onSave(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        icon,
        color,
        targetDaysPerWeek,
      },
      initialHabit ? initialHabit.id : undefined
    );
    onClose();
  };

  const handleApplyPreset = (preset: typeof PRESET_IDEAS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setIcon(preset.icon);
    setColor(preset.color);
    setDescription(preset.desc);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#FDFBF7] dark:bg-[#1A1816] border border-[#EDE6D8] dark:border-[#2C2825] p-6 shadow-2xl shadow-black/20 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EDE6D8] dark:border-[#2C2825]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
            >
              <span>{icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB]">
                {initialHabit ? 'Edit Habit' : 'Create New Habit'}
              </h3>
              <p className="text-xs text-[#736C61] dark:text-[#A39B8F]">
                {initialHabit
                  ? 'Update your habit goals & details'
                  : 'Add a new daily intention (+20 EXP per daily completion)'}
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

        {/* Quick Inspiration templates if creating new */}
        {!initialHabit && (
          <div className="mt-4 pt-1 pb-3 border-b border-[#EDE6D8] dark:border-[#2C2825]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#736C61] dark:text-[#A39B8F] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Quick Inspirations (1-Tap):</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {PRESET_IDEAS.map((idea) => (
                <button
                  key={idea.name}
                  type="button"
                  onClick={() => handleApplyPreset(idea)}
                  className="px-2.5 py-1 text-xs rounded-xl bg-white dark:bg-[#24211E] border border-[#EDE6D8] dark:border-[#332E2A] hover:border-[#FF7A00] dark:hover:border-[#FF7A00] text-[#2C2C2C] dark:text-[#F5F2EB] whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{idea.icon}</span>
                  <span>{idea.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-[#FFEBEB] dark:bg-[#2D1618] border border-[#FFCCD0] dark:border-[#FF5757]/40 text-xs font-semibold text-[#FF5757]">
              {error}
            </div>
          )}

          {/* Habit Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#736C61] dark:text-[#A39B8F] mb-1.5">
              Habit Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Read 15 pages, Drink Water, Morning Stretch"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#221F1C] border border-[#EDE6D8] dark:border-[#332E2A] focus:outline-hidden focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/20 text-[#2C2C2C] dark:text-[#F5F2EB] text-sm font-medium placeholder-[#9B9386] dark:placeholder-[#787066] transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#736C61] dark:text-[#A39B8F] mb-1.5">
              Cue or Note (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Right after making morning coffee"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#221F1C] border border-[#EDE6D8] dark:border-[#332E2A] focus:outline-hidden focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/20 text-[#2C2C2C] dark:text-[#F5F2EB] text-sm font-medium placeholder-[#9B9386] dark:placeholder-[#787066] transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#736C61] dark:text-[#A39B8F] mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['health', 'fitness', 'mind', 'productivity', 'lifestyle', 'creativity'] as HabitCategory[]).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-2.5 text-xs font-semibold rounded-xl border capitalize transition-all cursor-pointer ${
                      category === cat
                        ? 'bg-[#2C2C2C] dark:bg-[#FF7A00] text-white border-[#2C2C2C] dark:border-[#FF7A00]'
                        : 'bg-white dark:bg-[#221F1C] text-[#736C61] dark:text-[#A39B8F] border-[#EDE6D8] dark:border-[#332E2A] hover:border-[#D6CAB6] dark:hover:border-[#4A433D]'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#736C61] dark:text-[#A39B8F] mb-1.5">
              Choose Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-transform cursor-pointer ${
                    icon === emoji
                      ? 'bg-white dark:bg-[#2A2622] border-[#FF7A00] ring-2 ring-[#FF7A00]/20 scale-105'
                      : 'bg-white dark:bg-[#221F1C] border-[#EDE6D8] dark:border-[#332E2A] hover:border-[#D6CAB6]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#736C61] dark:text-[#A39B8F] mb-1.5">
              Theme Color
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center cursor-pointer ${
                    color === c
                      ? 'scale-115 ring-2 ring-offset-2 dark:ring-offset-[#1A1816] ring-[#2C2C2C] dark:ring-white'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Target Frequency */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#736C61] dark:text-[#A39B8F] mb-1.5">
              Target Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { days: 7, label: 'Every Day (7x)' },
                { days: 5, label: 'Weekdays (5x)' },
                { days: 3, label: 'Weekly (3x)' },
              ].map((freq) => (
                <button
                  key={freq.days}
                  type="button"
                  onClick={() => setTargetDaysPerWeek(freq.days)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                    targetDaysPerWeek === freq.days
                      ? 'bg-[#FFF0E0] dark:bg-[#2B1D12] text-[#FF7A00] border-[#FFD8B3] dark:border-[#FF7A00]/40'
                      : 'bg-white dark:bg-[#221F1C] text-[#736C61] dark:text-[#A39B8F] border-[#EDE6D8] dark:border-[#332E2A] hover:border-[#D6CAB6]'
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EDE6D8] dark:border-[#2C2825]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#736C61] dark:text-[#A39B8F] hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB] rounded-xl hover:bg-[#F2EDE2] dark:hover:bg-[#262320] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#FF7A00] to-[#FF5757] hover:from-[#E86B00] hover:to-[#E64848] shadow-sm shadow-[#FF7A00]/25 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{initialHabit ? 'Save Changes' : 'Add Habit to Squad'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
