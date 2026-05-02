import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "odekake-usagi-settings-v1";
const FIVE_MINUTES_MS = 5 * 60 * 1000;

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

function getTargetDateTime(targetTime, now = new Date()) {
  const { h, m } = parseTime(targetTime);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  return target;
}

function getTimeStatus(targetTime, now = new Date()) {
  if (!targetTime) {
    return {
      mode: "idle",
      label: "",
      diffMs: null,
    };
  }

  const target = getTargetDateTime(targetTime, now);
  const diffMs = target.getTime() - now.getTime();
  const absMinutes = Math.ceil(Math.abs(diffMs) / 60000);

  if (diffMs < 0) {
    return {
      mode: "late",
      label: `${absMinutes}分すぎました`,
      diffMs,
    };
  }

  if (diffMs <= FIVE_MINUTES_MS) {
    return {
      mode: "soon",
      label: `あと ${Math.max(0, Math.ceil(diffMs / 60000))}分`,
      diffMs,
    };
  }

  return {
    mode: "normal",
    label: `あと ${Math.ceil(diffMs / 60000)}分`,
    diffMs,
  };
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("保存に失敗しました", error);
  }
}

// simple tests
(function runTests() {
  const fixedNow = new Date("2026-05-02T07:55:00");
  console.assert(parseTime("08:30").h === 8, "hour parse");
  console.assert(parseTime("08:30").m === 30, "minute parse");
  console.assert(calculateProgress(0, 5) === 100, "progress 100");
  console.assert(getRabbitMode("late", true) === "happy", "rabbit happy wins");
  console.assert(getTimeStatus("08:00", fixedNow).mode === "soon", "5 minutes left should be soon");
  console.assert(getTimeStatus("08:10", fixedNow).mode === "normal", "15 minutes left should be normal");
  console.assert(getTimeStatus("07:50", fixedNow).mode === "late", "past target should be late");
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
            <div key={i} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${angle}deg)` }}>
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
          className="absolute left-1/2 top-1/2 w-1 origin-bottom rounded-full bg-sky-500 shadow-sm"
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

function GoingOutRabbit() {
  return (
    <div className="relative my-4 h-40 overflow-hidden rounded-3xl bg-gradient-to-r from-yellow-50 via-pink-50 to-sky-50">
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-green-100" />
      <div className="absolute left-5 top-5 text-3xl">🏠</div>
      <div className="absolute right-5 top-5 text-3xl">🌈</div>
      <motion.div
        initial={{ x: -80, y: 10 }}
        animate={{ x: 300, y: [10, -4, 10, -4, 10] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute bottom-8 left-0 text-6xl"
      >
        🐰🎒
      </motion.div>
      <motion.div
        animate={{ opacity: [0, 1, 0], scale: [0.7, 1.2, 0.7] }}
        transition={{ repeat: Infinity, duration: 1.3 }}
        className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-black text-pink-500 shadow-sm"
      >
        いってきます！
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
  const saved = loadSavedSettings();
  const [screen, setScreen] = useState("main");
  const [targetTime, setTargetTime] = useState(saved?.targetTime || "");
  const [tasks, setTasks] = useState(Array.isArray(saved?.tasks) && saved.tasks.length > 0 ? saved.tasks : initialTasks);
  const [totalTaskCount, setTotalTaskCount] = useState(saved?.totalTaskCount || initialTasks.length);
  const [newTask, setNewTask] = useState("");
  const [doneFlash, setDoneFlash] = useState(false);
  const [now, setNow] = useState(new Date());

  const timeStatus = getTimeStatus(targetTime, now);
  const progress = calculateProgress(tasks.length, totalTaskCount);
  const rabbitMode = timeStatus.mode === "idle" ? "normal" : getRabbitMode(timeStatus.mode, tasks.length === 0);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    saveSettings({ targetTime, tasks, totalTaskCount });
  }, [targetTime, tasks, totalTaskCount]);

  function completeTask(task) {
    setTasks((prev) => prev.filter((t) => t !== task));
    setDoneFlash(true);
    setTimeout(() => setDoneFlash(false), 1000);
  }

  function addTask() {
    const trimmed = newTask.trim();
    if (!trimmed) return;
    setTasks((prev) => [...prev, trimmed]);
    setTotalTaskCount((prev) => Math.max(prev + 1, tasks.length + 1));
    setNewTask("");
  }

  function removeTask(task) {
    setTasks((prev) => prev.filter((t) => t !== task));
    setTotalTaskCount((prev) => Math.max(0, prev - 1));
  }

  function resetToday() {
    setTasks(initialTasks);
    setTotalTaskCount(initialTasks.length);
  }

  function resetAllSettings() {
    localStorage.removeItem(STORAGE_KEY);
    setTargetTime("08:00");
    setTasks(initialTasks);
    setTotalTaskCount(initialTasks.length);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-sky-100 p-4">
      <div className="mx-auto max-w-sm">
        <div className="mb-3 flex justify-between">
          <h1 className="text-xl font-black text-pink-600">おでかけうさぎ</h1>
          <Button onClick={() => setScreen(screen === "main" ? "settings" : "main")} className="bg-white text-pink-500 shadow-sm">
            <Icon label={screen === "main" ? "settings" : "home"} />
            {screen === "main" ? "もくひょう" : "もどる"}
          </Button>
        </div>

        <div className="relative rounded-3xl bg-white p-4 shadow-lg">
          <Confetti show={doneFlash} />

          {screen === "main" ? (
            <>
              <AnalogClock time={targetTime} />

              <div className={`mb-3 rounded-3xl py-3 text-center text-2xl font-black ${timeStatus.mode === "late" ? "bg-orange-50 text-orange-500" : timeStatus.mode === "soon" ? "bg-yellow-50 text-amber-500" : "bg-sky-50 text-sky-600"}`}>
                {timeStatus.label && timeStatus.label}
              </div>

              <Rabbit mode={rabbitMode} />

              <div className="mb-3 rounded-full bg-pink-50 p-2 text-center font-black text-pink-500">できたメーター {progress}%</div>

              {tasks.length === 0 ? (
                <div className="rounded-3xl bg-yellow-50 p-5 text-center">
                  <div className="mb-2 text-3xl">🎉</div>
                  <div className="text-xl font-black text-pink-600">ぜんぶできた！</div>
                  <p className="mt-1 text-sm font-bold text-amber-600">うさぎさんとおでかけしよう</p>
                  <GoingOutRabbit />
                  <Button onClick={resetToday} className="mt-2 bg-pink-400 text-white">もう一度はじめる</Button>
                </div>
              ) : (
                tasks.map((task) => (
                  <motion.div
                    key={task}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 80, scale: 0.8 }}
                    className="mb-2 flex items-center justify-between rounded-2xl bg-pink-50 p-3"
                  >
                    <span className="font-bold">{task}</span>
                    <Button onClick={() => completeTask(task)} className="bg-pink-400 text-white">できた！</Button>
                  </motion.div>
                ))
              )}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTask();
                  }}
                  placeholder="例：かみをとかす"
                  className="min-w-0 flex-1 rounded-2xl border border-pink-100 p-2"
                />
                <Button onClick={addTask} className="bg-pink-400 text-white"><Icon label="plus" /></Button>
              </div>

              {tasks.map((task) => (
                <div key={task} className="mb-2 flex justify-between rounded-2xl bg-pink-50 p-3">
                  <span className="font-bold">{task}</span>
                  <button onClick={() => removeTask(task)} className="text-sm font-bold text-pink-400">削除</button>
                </div>
              ))}

              <Button onClick={resetToday} className="mt-4 w-full bg-sky-100 text-sky-600">今日のやることを初期状態に戻す</Button>
              <Button onClick={resetAllSettings} className="mt-2 w-full bg-slate-100 text-slate-500">設定をリセット</Button>

              <div className="mt-4 rounded-2xl bg-yellow-50 p-3 text-sm font-bold text-amber-600">
                目標時間とやることは、このスマホのブラウザに自動保存されます。
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
