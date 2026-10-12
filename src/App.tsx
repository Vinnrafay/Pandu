import { useEffect, useState, type FormEvent } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Wallet, 
  Zap, 
  Flame, 
  Plus, 
  Loader2, 
  Inbox, 
  ArrowRightLeft,
  X
} from 'lucide-react';
import { panduService } from './api/panduService';
import type { DashboardData, Priority, Habit } from './types/pandu';

// Mock data fallback jika backend Laravel belum menyala
const INITIAL_DATA: DashboardData = {
  date: '2026-10-12',
  priorities: [
    { id: 1, title: 'Koding Endpoint Laravel & Sanctum', slot_number: 1, status: 'completed' },
    { id: 2, title: 'Setup UI React & Dark Utility Theme', slot_number: 2, status: 'pending' },
    { id: 3, title: 'Cek Database PostgreSQL via TablePlus', slot_number: 3, status: 'pending' },
  ],
  waiting_box: [
    { id: 4, title: 'Beli kopi dan cemilan malam', slot_number: null, status: 'waiting_box' },
    { id: 5, title: 'Review pull request kawan', slot_number: null, status: 'waiting_box' },
  ],
  budget: {
    limit: 120000,
    spent: 35000,
  },
  habits: [
    { id: 1, name: 'Push-up Rutin', baseline_desc: '5 kali', normal_desc: '30 kali', status: 'baseline', streak: 12 },
    { id: 2, name: 'Membaca Buku', baseline_desc: '2 lembar', normal_desc: '20 lembar', status: 'normal', streak: 5 },
    { id: 3, name: 'Minum Air Putih', baseline_desc: '1 gelas bangun tidur', normal_desc: '2 liter / hari', status: 'none', streak: 8 },
  ]
};

export default function App() {
  const [data, setData] = useState<DashboardData>(INITIAL_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'focus' | 'habits' | 'inbox'>('focus');
  
  // Input states
  const [expenseInput, setExpenseInput] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');

  const loadData = async () => {
    try {
      const res = await panduService.getDashboard();
      if (res && res.priorities) setData(res);
    } catch {
      // Menggunakan fallback data offline agar UI tetap interaktif
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Toggle Selesai Tugas Prioritas
  const handleTogglePriority = async (id: number) => {
    setData((prev) => ({
      ...prev,
      priorities: prev.priorities.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'completed' ? 'pending' : 'completed' }
          : item
      ),
    }));

    try {
      await panduService.togglePriority(id);
    } catch {
      // rollback jika perlu
    }
  };

  // 2. Tambah Prioritas / Masuk Kotak Tunggu
  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const activeCount = data.priorities.length;
    const isFull = activeCount >= 3;
    const targetSlot = isFull ? null : activeCount + 1;

    const newTask: Priority = {
      id: Date.now(),
      title: newTaskTitle,
      slot_number: targetSlot,
      status: isFull ? 'waiting_box' : 'pending',
    };

    if (isFull) {
      setData((prev) => ({ ...prev, waiting_box: [newTask, ...prev.waiting_box] }));
    } else {
      setData((prev) => ({ ...prev, priorities: [...prev.priorities, newTask] }));
    }

    try {
      await panduService.createPriority(newTaskTitle, targetSlot);
    } catch {
      // API call
    }

    setNewTaskTitle('');
    setShowAddModal(false);
  };

  // 3. Catat Pengeluaran Cepat
  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(expenseInput);
    if (!amount || isNaN(amount)) return;

    setData((prev) => ({
      ...prev,
      budget: { ...prev.budget, spent: prev.budget.spent + amount },
    }));

    try {
      await panduService.createExpense(amount);
    } catch {
      // API call
    }
    setExpenseInput('');
  };

  // 4. Toggle Baseline Habit (None -> Baseline -> Normal)
  const handleHabitToggle = async (habitId: number, level: 'baseline' | 'normal') => {
    setData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== habitId) return h;
        const nextStatus = h.status === level ? 'none' : level;
        return { ...h, status: nextStatus };
      }),
    }));

    try {
      await panduService.logHabit(habitId, level);
    } catch {
      // API call
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center text-[#7D8590]">
        <Loader2 className="animate-spin text-[#00F29E]" size={28} />
      </div>
    );
  }

  const remainingBudget = Math.max(0, data.budget.limit - data.budget.spent);
  const budgetPercentage = Math.min(100, (data.budget.spent / data.budget.limit) * 100);

  return (
    <div className="min-h-screen bg-[#0D0F12] text-[#F0F3F6] p-4 md:p-8 font-sans selection:bg-[#00F29E] selection:text-[#0D0F12]">
      <main className="max-w-md mx-auto space-y-5">

        {/* Header Profil & Tanggal */}
        <header className="flex justify-between items-center pt-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#F0F3F6]">Halo, Pengguna!</h1>
            <p className="text-xs text-[#7D8590]">Kompas Kendali Hari Ini</p>
          </div>
          <span className="text-xs font-mono bg-[#161B22] border border-[#21262D] px-3 py-1.5 rounded-full text-[#00F29E]">
            Senin, 12 Okt
          </span>
        </header>

        {/* Date Strip Carousel (Referensi Gambar 1 & 3) */}
        <section className="bg-[#161B22] border border-[#21262D] p-2.5 rounded-2xl flex justify-between text-center">
          {[
            { day: 'S', date: 11, active: false },
            { day: 'S', date: 12, active: true },
            { day: 'R', date: 13, active: false },
            { day: 'K', date: 14, active: false },
            { day: 'J', date: 15, active: false },
            { day: 'S', date: 16, active: false },
            { day: 'M', date: 17, active: false },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`flex-1 py-1.5 rounded-xl flex flex-col items-center gap-1 transition-all ${
                item.active
                  ? 'bg-[#00F29E] text-[#0D0F12] font-bold shadow-md shadow-[#00F29E]/10'
                  : 'text-[#7D8590] hover:text-[#F0F3F6]'
              }`}
            >
              <span className="text-[10px] uppercase font-semibold">{item.day}</span>
              <span className="text-xs">{item.date}</span>
            </div>
          ))}
        </section>

        {/* Segmented Tab Navigation */}
        <nav className="flex bg-[#161B22] p-1 rounded-xl border border-[#21262D] text-xs font-medium">
          <button
            onClick={() => setActiveTab('focus')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'focus' ? 'bg-[#0D0F12] text-[#00F29E] font-semibold' : 'text-[#7D8590]'
            }`}
          >
            <Zap size={14} /> Fokus & Budget
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'habits' ? 'bg-[#0D0F12] text-[#00F29E] font-semibold' : 'text-[#7D8590]'
            }`}
          >
            <Flame size={14} /> Kebiasaan
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'inbox' ? 'bg-[#0D0F12] text-[#00F29E] font-semibold' : 'text-[#7D8590]'
            }`}
          >
            <Inbox size={14} /> Kotak Tunggu ({data.waiting_box.length})
          </button>
        </nav>

        {/* TAB 1: FOCUS & BUDGET */}
        {activeTab === 'focus' && (
          <div className="space-y-4">
            {/* 3 Prioritas Utama */}
            <div className="bg-[#161B22] border border-[#21262D] rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-[#7D8590] tracking-wider uppercase">
                  3 Prioritas Utama
                </span>
                <span className="text-xs font-mono text-[#00F29E]">
                  {data.priorities.filter((p) => p.status === 'completed').length}/3 Selesai
                </span>
              </div>

              <div className="space-y-2.5">
                {data.priorities.map((item, index) => {
                  const isDone = item.status === 'completed';
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleTogglePriority(item.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isDone
                          ? 'bg-[#0D0F12]/50 border-[#21262D] text-[#7D8590] line-through'
                          : 'bg-[#0D0F12] border-[#21262D] hover:border-[#00F29E]/50 text-[#F0F3F6]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          isDone ? 'bg-[#21262D] text-[#7D8590]' : 'bg-[#161B22] text-[#00F29E]'
                        }`}>
                          0{index + 1}
                        </span>
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      {isDone ? (
                        <CheckCircle2 size={18} className="text-[#00F29E]" />
                      ) : (
                        <Circle size={18} className="text-[#7D8590]" />
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-[#21262D] text-[#7D8590] hover:text-[#F0F3F6] hover:border-[#00F29E]/40 text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Plus size={14} /> Tambah atau Tukar Fokus
              </button>
            </div>

            {/* Batas Jajan Dinamis */}
            <div className="bg-[#161B22] border border-[#21262D] rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#7D8590] tracking-wider uppercase flex items-center gap-1.5">
                  <Wallet size={14} className="text-[#00F29E]" /> Batas Jajan Dinamis
                </span>
                <span className="text-xs text-[#7D8590]">Hari Ini</span>
              </div>

              <div className="bg-[#0D0F12] border border-[#21262D] p-3.5 rounded-xl my-3">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-[11px] text-[#7D8590]">Sisa Kuota</span>
                    <p className="text-xl font-bold text-[#00F29E]">
                      Rp {remainingBudget.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#7D8590]">Terpakai</span>
                    <p className="text-sm font-semibold text-[#FF5353]">
                      Rp {data.budget.spent.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="w-full bg-[#161B22] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${budgetPercentage > 90 ? 'bg-[#FF5353]' : 'bg-[#00F29E]'}`}
                    style={{ width: `${budgetPercentage}%` }}
                  />
                </div>
              </div>

              <form onSubmit={handleAddExpense} className="flex gap-2">
                <input
                  type="number"
                  placeholder="Catat jajan cepat (Rp)..."
                  value={expenseInput}
                  onChange={(e) => setExpenseInput(e.target.value)}
                  className="flex-1 bg-[#0D0F12] border border-[#21262D] rounded-xl px-3.5 py-2 text-sm text-[#F0F3F6] focus:outline-none focus:border-[#00F29E]"
                />
                <button
                  type="submit"
                  className="bg-[#00F29E] text-[#0D0F12] font-semibold px-4 py-2 rounded-xl text-sm hover:brightness-105 active:scale-95 transition"
                >
                  Catat
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: KEBIASAAN (ANTI-NOL) */}
        {activeTab === 'habits' && (
          <div className="space-y-3">
            {data.habits.map((habit) => (
              <div
                key={habit.id}
                className="bg-[#161B22] border border-[#21262D] p-4 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#F0F3F6]">{habit.name}</h3>
                    <span className="text-[10px] text-[#00F29E] bg-[#00F29E]/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Flame size={10} /> {habit.streak} hari
                    </span>
                  </div>
                  <p className="text-xs text-[#7D8590] mt-0.5">
                    Min: {habit.baseline_desc} • Full: {habit.normal_desc}
                  </p>
                </div>

                {/* Dual Toggle Pill Buttons */}
                <div className="flex items-center gap-1.5 bg-[#0D0F12] p-1 rounded-xl border border-[#21262D]">
                  <button
                    onClick={() => handleHabitToggle(habit.id, 'baseline')}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                      habit.status === 'baseline'
                        ? 'bg-[#00F29E] text-[#0D0F12]'
                        : 'text-[#7D8590] hover:text-[#F0F3F6]'
                    }`}
                  >
                    MIN
                  </button>
                  <button
                    onClick={() => handleHabitToggle(habit.id, 'normal')}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                      habit.status === 'normal'
                        ? 'bg-[#00F29E] text-[#0D0F12]'
                        : 'text-[#7D8590] hover:text-[#F0F3F6]'
                    }`}
                  >
                    FULL
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-[#161B22]/50 border border-dashed border-[#21262D] p-3.5 rounded-2xl text-center">
              <p className="text-xs text-[#7D8590]">
                "Mulai dari yang minimal. Jangan putus rantai konsistensi."
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: KOTAK TUNGGU */}
        {activeTab === 'inbox' && (
          <div className="space-y-3">
            <div className="bg-[#161B22] border border-[#21262D] p-3.5 rounded-2xl text-xs text-[#7D8590]">
              Tugas di sini tidak akan mengganggu fokus harian sampai kamu memilih untuk menukarnya ke slot utama.
            </div>

            {data.waiting_box.length === 0 ? (
              <div className="text-center py-8 text-[#7D8590] text-xs">
                Kotak tunggu kosong. Semua fokus aman terkendali.
              </div>
            ) : (
              data.waiting_box.map((task) => (
                <div
                  key={task.id}
                  className="bg-[#161B22] border border-[#21262D] p-3.5 rounded-xl flex items-center justify-between"
                >
                  <span className="text-sm text-[#F0F3F6]">{task.title}</span>
                  <button 
                    onClick={() => {
                      // Logika cepat tukar dengan slot 1
                      const slotOne = data.priorities[0];
                      if (!slotOne) return;
                      setData((prev) => ({
                        ...prev,
                        priorities: [{ ...task, slot_number: 1, status: 'pending' }, ...prev.priorities.slice(1)],
                        waiting_box: [{ ...slotOne, slot_number: null, status: 'waiting_box' }, ...prev.waiting_box.filter((w) => w.id !== task.id)]
                      }));
                    }}
                    className="text-xs text-[#00F29E] flex items-center gap-1 hover:underline ml-2"
                  >
                    <ArrowRightLeft size={12} /> Tukar ke Slot
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* MODAL INPUT TASK */}
        {showAddModal && (
          <div className="fixed inset-0 bg-[#0D0F12]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
            <div className="bg-[#161B22] border border-[#21262D] w-full max-w-sm rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#F0F3F6]">Tambah Tugas Baru</h3>
                <button onClick={() => setShowAddModal(false)} className="text-[#7D8590] hover:text-[#F0F3F6]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3">
                <input
                  type="text"
                  placeholder="Apa yang mau dikerjakan?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                  className="w-full bg-[#0D0F12] border border-[#21262D] rounded-xl px-3.5 py-2.5 text-sm text-[#F0F3F6] focus:outline-none focus:border-[#00F29E]"
                />

                {data.priorities.length >= 3 && (
                  <p className="text-[11px] text-[#FF5353] bg-[#FF5353]/10 p-2.5 rounded-lg border border-[#FF5353]/20">
                    Slot 1-3 sudah penuh. Tugas ini akan otomatis dimasukkan ke Kotak Tunggu agar perhatianmu tidak terpecah.
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 rounded-xl text-xs text-[#7D8590] bg-[#0D0F12] border border-[#21262D]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[#00F29E] text-[#0D0F12]"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}