import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import './index.css'

const initialTasks = [
  "おきがえ",
  "あさごはん",
  "はみがき",
  "トイレ",
  "ランドセル",
  "くつをはく",
];

function parseTime(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

function calculateProgress(remainingCount, totalCount) {
  if (totalCount <= 0) return 0;
  const completed = Math.max(0, totalCount - remainingCount);
  return Math.min(100, Math.round((completed / totalCount) * 100));
}

function getRabbitMode(timeMode, allDone) {
  if (allDone) return "happy";
  if (timeMode === "late") return "late";
  if (timeMode === "soon") return "soon";
  return "normal";
}

// simple tests
(function runTests() {
  console.assert(parseTime("08:30").h === 8, "hour parse");
  console.assert(parseTime("08:30").m === 30, "minute parse");
  console.assert(calculateProgress(0, 5) === 100, "progress 100");
  console.assert(getRabbitMode("normal", false) === "normal", "rabbit normal");
  console.assert(getRabbitMode("soon", false) === "soon", "rabbit soon");
  console.assert(getRabbitMode("late", false) === "late", "rabbit late");
  console.assert(getRabbitMode("late", true) === "happy", "rabbit happy wins");
})();

function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1 rounded-2xl px-4 py-2 font-bold transition active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

function Icon({ label }) {
  const map = {
    settings: "⚙️",
    home: "🏠",
    plus: "＋",
  };
  return <span>{map[label] || "•"}</span>;
}

function AnalogClock({ time }) {
  const { h, m } = parseTime(time);
  const minuteAngle = m * 6;
  const hourAngle = (h % 12) * 30 + m * 0.5;
  const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return (
    <div className="mb-5 flex flex-col items-center">
      <div className="mb-2 rounded-full bg-pink-50 px-5 py-2 text-2xl font-black text-pink-600 shadow-sm">
        {h}じ {m.toString().padStart(2, "0")}ふん
      </div>

      <div className="relative h-56 w-56 rounded-full border-4 border-pink-200 bg-white shadow-xl">
        <div className="absolute inset-3 rounded-full border-2 border-pink-50" />

        {numbers.map((num, index) => {
          const angle = index * 30 - 90;
          const radius = 86;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          return (
            <div
              key={num}
              className="absolute flex h-8 w-8 items-center justify-center rounded-full text-base font-black text-pink-500"
              style={{
                left: `calc(50% + ${x}px - 16px)`,
                top: `calc(50% + ${y}px - 16px)`,
              }}
            >
              {num}
            </div>
          );
        })}

        {[...Array(60)].map((_, i) => {
          const angle = i * 6;
          const isFive = i % 5 === 0;
          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <div
                className={`${isFive ? "h-3 w-1 bg-pink-300" : "h-1.5 w-0.5 bg-pink-100"}`}
                style={{ transform: "translate(-50%, -102px)" }}
              />
            </div>
          );
        })}

        <div
          className="absolute left-1/2 top-1/2 h-16 w-2 origin-bottom rounded-full bg-pink-500 shadow-sm"
          style={{ transform: `translate(-50%, -100%) rotate(${hourAngle}deg)` }}
        />

        <div
          className="absolute left-1/2 top-1/2 h-22 w-1 origin-bottom rounded-full bg-sky-500 shadow-sm"
          style={{ height: 86, transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)` }}
        />

        <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-pink-400 shadow" />
      </div>
    </div>
  );
}

function RabbitFace({ mode }) {
  if (mode === "late") return <><span>＞</span><span>＜</span></>;
  if (mode === "soon") return <><span>・</span><span>・</span></>;
  if (mode === "happy") return <><span>⌒</span><span>⌒</span></>;
  return <><span>●</span><span>●</span></>;
}

function Rabbit({ mode = "normal" }) {
  const config = {
    normal: {
      message: "るんるん♪",
      badge: "🌸",
      body: { y: [0, -8, 0], rotate: [-2, 2, -2] },
      duration: 1.5,
      bubble: "bg-pink-50 text-pink-500",
    },
    soon: {
      message: "あとすこしだよ",
      badge: "💧",
      body: { x: [-3, 3, -3], y: [0, -4, 0], rotate: [-3, 3, -3] },
      duration: 0.75,
      bubble: "bg-yellow-50 text-amber-600",
    },
    late: {
      message: "いそごう〜！",
      badge: "💦",
      body: { x: [-10, 10, -10], rotate: [-8, 8, -8] },
      duration: 0.35,
      bubble: "bg-orange-50 text-orange-600",
    },
    happy: {
      message: "ぜんぶできた！",
      badge: "💕",
      body: { y: [0, -18, 0], rotate: [-5, 5, -5] },
      duration: 0.8,
      bubble: "bg-yellow-50 text-amber-600",
    },
  }[mode];

  return (
    <div className="relative mb-4 flex flex-col items-center">
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ repeat: Infinity, duration: config.duration * 1.4 }}
        className={`mb-2 rounded-3xl px-4 py-2 text-sm font-black shadow-sm ${config.bubble}`}
      >
        {config.message}
      </motion.div>

      <motion.div
        animate={config.body}
        transition={{ repeat: Infinity, duration: config.duration, ease: "easeInOut" }}
        className="relative h-32 w-36"
      >
        <motion.div
          animate={mode === "normal" ? { rotate: [-12, -4, -12] } : { rotate: [-20, 5, -20] }}
          transition={{ repeat: Infinity, duration: config.duration }}
          className="absolute left-8 top-0 h-20 w-8 rounded-full border-4 border-white bg-pink-100 shadow-sm"
        />
        <motion.div
          animate={mode === "normal" ? { rotate: [12, 4, 12] } : { rotate: [20, -5, 20] }}
          transition={{ repeat: Infinity, duration: config.duration }}
          className="absolute right-8 top-0 h-20 w-8 rounded-full border-4 border-white bg-pink-100 shadow-sm"
        />
        <div className="absolute bottom-0 left-1/2 h-24 w-32 -translate-x-1/2 rounded-[44%] border-4 border-pink-100 bg-white shadow-xl">
          <div className="absolute left-7 top-9 flex w-20 justify-between text-xl font-black text-slate-700">
            <RabbitFace mode={mode} />
          </div>
          <div className="absolute left-1/2 top-14 h-2 w-3 -translate-x-1/2 rounded-full bg-pink-300" />
          <div className="absolute left-7 top-16 h-3 w-7 rounded-full bg-pink-200/70" />
          <div className="absolute right-7 top-16 h-3 w-7 rounded-full bg-pink-200/70" />
          <motion.div
            animate={mode === "late" ? { scale: [1, 1.35, 1] } : { scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: config.duration }}
            className="absolute -right-2 top-2 text-2xl"
          >
            {config.badge}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function Confetti({ show }) {
  const pieces = useMemo(() => Array.from({ length: 12 }), []);
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {pieces.map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 180, x: 180, scale: 0.4 }}
              animate={{ opacity: [0, 1, 0], y: -40, x: 40 + i * 25, scale: [0.6, 1.2, 0.8] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: i * 0.04 }}
              className="absolute text-2xl"
            >
              {i % 3 === 0 ? "✨" : i % 3 === 1 ? "🌸" : "⭐"}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const [screen, setScreen] = useState("main");
  const [targetTime, setTargetTime] = useState("08:00");
  const [tasks, setTasks] = useState(initialTasks);
  const [newTask, setNewTask] = useState("");
  const [doneFlash, setDoneFlash] = useState(false);
  const [timeMode, setTimeMode] = useState("normal");

  const remainingLabel = timeMode === "late" ? "5分すぎました" : timeMode === "soon" ? "あと 4分" : "あと 18分";
  const progress = calculateProgress(tasks.length, initialTasks.length);
  const rabbitMode = getRabbitMode(timeMode, tasks.length === 0);

  function completeTask(task) {
    setTasks((prev) => prev.filter((t) => t !== task));
    setDoneFlash(true);
    setTimeout(() => setDoneFlash(false), 1000);
  }

  function addTask() {
    if (!newTask.trim()) return;
    setTasks((prev) => [...prev, newTask.trim()]);
    setNewTask("");
  }

  function cycleTimeMode() {
    setTimeMode((prev) => (prev === "normal" ? "soon" : prev === "soon" ? "late" : "normal"));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-sky-100 p-4">
      <div className="mx-auto max-w-sm">
        <div className="mb-3 flex justify-between">
          <h1 className="text-xl font-black text-pink-600">おでかけうさぎ</h1>
          <Button onClick={() => setScreen(screen === "main" ? "settings" : "main")} className="bg-white text-pink-500 shadow-sm">
            <Icon label={screen === "main" ? "settings" : "home"} />
          </Button>
        </div>

        <div className="relative rounded-3xl bg-white p-4 shadow-lg">
          <Confetti show={doneFlash} />

          {screen === "main" ? (
            <>
              <AnalogClock time={targetTime} />

              <div className={`mb-3 text-center text-lg font-black ${timeMode === "late" ? "text-orange-500" : timeMode === "soon" ? "text-amber-500" : "text-sky-600"}`}>
                {remainingLabel}
              </div>

              <Rabbit mode={rabbitMode} />

              <div className="mb-3 rounded-full bg-pink-50 p-2 text-center font-black text-pink-500">できたメーター {progress}%</div>

              {tasks.map((task) => (
                <div key={task} className="mb-2 flex items-center justify-between rounded-2xl bg-pink-50 p-3">
                  <span className="font-bold">{task}</span>
                  <Button onClick={() => completeTask(task)} className="bg-pink-400 text-white">できた！</Button>
                </div>
              ))}

              <button onClick={cycleTimeMode} className="mt-3 w-full rounded-2xl bg-slate-100 py-2 text-sm font-bold text-gray-500">
                モック用：通常 → あと5分未満 → 時間オーバー
              </button>
            </>
          ) : (
            <>
              <label className="mb-1 block text-sm font-bold text-pink-500">出発目標時間</label>
              <input
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="mb-3 w-full rounded-2xl border border-pink-100 bg-pink-50 p-3 text-xl font-black text-pink-600"
              />

              <label className="mb-1 block text-sm font-bold text-pink-500">やること</label>
              <div className="mb-3 flex gap-2">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="例：かみをとかす"
                  className="min-w-0 flex-1 rounded-2xl border border-pink-100 p-2"
                />
                <Button onClick={addTask} className="bg-pink-400 text-white"><Icon label="plus" /></Button>
              </div>

              {tasks.map((task) => (
                <div key={task} className="mb-2 flex justify-between rounded-2xl bg-pink-50 p-3">
                  <span className="font-bold">{task}</span>
                  <button onClick={() => setTasks(tasks.filter((t) => t !== task))} className="text-sm font-bold text-pink-400">削除</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
