"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { CHALLENGE_EXAMPLES } from "@/lib/wakeup/challenge";

type MessageConfig = {
  time: string;
  modeLabel: string;
  modeConfig: string;
  message: string;
  controlPrimary: string;
  controlSecondary: string;
};

const MORNING_TIMES = [
  "05:15",
  "05:45",
  "06:00",
  "06:20",
  "06:30",
  "06:45",
  "07:00",
  "07:15",
  "07:30",
];

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const SPORTS_TEAMS = [
  "Toronto Raptors",
  "New York Yankees",
  "Arsenal",
  "Dallas Mavericks",
  "Toronto Maple Leafs",
  "Golden State Warriors",
  "Liverpool",
  "Kansas City Chiefs",
  "Boston Celtics",
  "FC Barcelona",
];

const MARKET_WATCHLISTS = [
  ["AAPL", "TSLA"],
  ["MSFT", "NVDA", "SPY"],
  ["AMZN", "GOOGL"],
  ["META", "QQQ"],
  ["NFLX", "AMD", "SMH"],
  ["BRK.B", "JPM", "V"],
  ["COIN", "MSTR", "BTC-USD"],
  ["SHOP", "UBER", "PLTR"],
];

const FUN_FACTS = [
  "Octopuses have three hearts, and two stop beating when they swim.",
  "Bananas are berries, but strawberries are not.",
  "Honey never spoils when stored in a sealed container.",
  "A day on Venus is longer than a year on Venus.",
  "The Eiffel Tower can be about 15 centimeters taller in summer heat.",
  "Sharks are older than trees by millions of years.",
  "Wombat poop is cube-shaped.",
  "Some turtles can breathe through their rear ends in cold water.",
];

const HISTORY_EVENTS = [
  "On this day in 1844, Samuel Morse sent the first public telegraph message.",
  "On this day in 1969, Apollo 11 launched for the first moon landing mission.",
  "On this day in 1989, the Berlin Wall began to come down.",
  "On this day in 1903, the Wright brothers made their first powered flight.",
  "On this day in 1991, the World Wide Web became publicly available.",
  "On this day in 1796, Edward Jenner performed an early smallpox vaccination.",
  "On this day in 1957, Sputnik 1 launched and began the space age.",
  "On this day in 1876, the first successful telephone call was made.",
];

const CITIES = [
  "Toronto",
  "Chicago",
  "Austin",
  "Vancouver",
  "London",
  "Seattle",
  "Denver",
];

const WEATHER_LINES = [
  "clear skies and a crisp start",
  "light rain with cool air",
  "sunny and mild with low wind",
  "cloudy with a warmer afternoon ahead",
];

const LOCAL_HEADLINES = [
  "city council approved a downtown transit upgrade",
  "a new riverfront trail segment opened this morning",
  "schools announced expanded after-hours programs",
  "local business owners launched a weekend night market",
];

const MOTIVATION_LINES = [
  "Progress beats perfection before breakfast.",
  "One focused hour this morning changes your whole day.",
  "Discipline now creates freedom later.",
  "You don't need hype, just your first action.",
];

const WORD_OF_DAY = [
  {
    word: "tenacious",
    definition: "persistent and determined",
  },
  {
    word: "lucid",
    definition: "clear and easy to understand",
  },
  {
    word: "diligent",
    definition: "showing careful, steady effort",
  },
  {
    word: "resolute",
    definition: "firm and unwavering in purpose",
  },
];

const CONTROL_VARIANTS = [
  { primary: "1-Awake", secondary: "9-Snooze" },
  {
    primary: "Quick Math",
    secondary: CHALLENGE_EXAMPLES.quick_math,
  },
  {
    primary: "Pattern Continue",
    secondary: CHALLENGE_EXAMPLES.pattern_continue,
  },
  {
    primary: "Memory Echo",
    secondary: CHALLENGE_EXAMPLES.memory_echo,
  },
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

const ROTATE_INTERVAL_MS = 7000;
const TRANSITION_MS = 900;

function RotatorSlide({ config }: { config: MessageConfig }) {
  return (
    <>
      <p className="font-serif text-6xl leading-none tracking-tight">
        {config.time}
      </p>
      <div className="my-8 h-1 bg-foreground" aria-hidden />
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {config.modeLabel} · {config.modeConfig}
      </p>
      <p className="mt-3 text-lg italic leading-relaxed">
        &ldquo;{config.message}&rdquo;
      </p>
      <div className="mt-8 grid grid-cols-2 border border-foreground font-mono text-xs uppercase tracking-widest">
        <span className="border-r border-foreground p-3">
          {config.controlPrimary}
        </span>
        <span className="p-3 text-[10px] leading-relaxed tracking-normal">
          {config.controlSecondary}
        </span>
      </div>
    </>
  );
}

function buildHoroscopeExample() {
  const sign = pickRandom(ZODIAC_SIGNS);
  return {
    modeLabel: "Horoscope",
    modeConfig: `Sign: ${sign}`,
    message: `Good morning, ${sign}. Horoscope check: your energy is focused and steady today. Pick one meaningful task early, finish it cleanly, and let that momentum carry the rest of your morning.`,
  };
}

function buildSportsExample() {
  const team = pickRandom(SPORTS_TEAMS);
  return {
    modeLabel: "Sports Schedule",
    modeConfig: `Team: ${team}`,
    message: `Morning sports update for ${team}: your next matchup is coming up soon, and last game showed solid momentum. Get up, lock in, and start your day like game day prep.`,
  };
}

function buildMarketExample() {
  const symbols = pickRandom(MARKET_WATCHLISTS);
  return {
    modeLabel: "Market Brief",
    modeConfig: `Symbols: ${symbols.join(", ")}`,
    message: `Market brief is live for ${symbols.join(", ")}. Futures are moving and headlines are already setting the tone. Start now, review your plan, and make your first decision with a clear head.`,
  };
}

function buildFunFactExample() {
  const fact = pickRandom(FUN_FACTS);
  return {
    modeLabel: "Fun Fact",
    modeConfig: "Source: Daily trivia",
    message: `Fun fact to wake up your brain: ${fact} You're officially awake now, so feet on the floor and start the day with curiosity.`,
  };
}

function buildHistoryTodayExample() {
  const event = pickRandom(HISTORY_EVENTS);
  return {
    modeLabel: "On This Day",
    modeConfig: "Source: Historical archives",
    message: `${event} Big things started with one morning decision, same as today. Stand up and begin yours now.`,
  };
}

function buildWeatherExample() {
  const city = pickRandom(CITIES);
  const weather = pickRandom(WEATHER_LINES);
  return {
    modeLabel: "Weather Report",
    modeConfig: `City: ${city}`,
    message: `Good morning. Weather for ${city}: ${weather}. Get up now and use the calm start to get one important thing done before the day gets noisy.`,
  };
}

function buildLocalNewsExample() {
  const city = pickRandom(CITIES);
  const headline = pickRandom(LOCAL_HEADLINES);
  return {
    modeLabel: "Local News",
    modeConfig: `City: ${city}`,
    message: `Local update for ${city}: ${headline}. You're informed, now get moving and make your own headline today.`,
  };
}

function buildMotivationExample() {
  const line = pickRandom(MOTIVATION_LINES);
  return {
    modeLabel: "Daily Motivation",
    modeConfig: "Source: Fresh daily prompt",
    message: `Morning motivation: ${line} Sit up, feet down, and start your first focused block right now.`,
  };
}

function buildWordOfDayExample() {
  const word = pickRandom(WORD_OF_DAY);
  return {
    modeLabel: "Word of the Day",
    modeConfig: `Word: ${word.word}`,
    message: `Today's word is ${word.word} — ${word.definition}. Be ${word.word} for the next hour and you'll be ahead before most people open their inbox.`,
  };
}

const SCRIPT_BUILDERS = [
  buildHoroscopeExample,
  buildSportsExample,
  buildMarketExample,
  buildWeatherExample,
  buildLocalNewsExample,
  buildMotivationExample,
  buildWordOfDayExample,
  buildFunFactExample,
  buildHistoryTodayExample,
];

function buildRandomConfig(previous?: MessageConfig): MessageConfig {
  const maxTries = 8;
  for (let attempt = 0; attempt < maxTries; attempt += 1) {
    const control = pickRandom(CONTROL_VARIANTS);
    const scriptExample = pickRandom(SCRIPT_BUILDERS)();
    const next = {
      time: pickRandom(MORNING_TIMES),
      modeLabel: scriptExample.modeLabel,
      modeConfig: scriptExample.modeConfig,
      message: scriptExample.message,
      controlPrimary: control.primary,
      controlSecondary: control.secondary,
    };
    if (
      !previous ||
      `${previous.time}${previous.modeLabel}${previous.modeConfig}${previous.message}${previous.controlPrimary}${previous.controlSecondary}` !==
        `${next.time}${next.modeLabel}${next.modeConfig}${next.message}${next.controlPrimary}${next.controlSecondary}`
    ) {
      return next;
    }
  }

  const control = pickRandom(CONTROL_VARIANTS);
  const scriptExample = pickRandom(SCRIPT_BUILDERS)();
  return {
    time: pickRandom(MORNING_TIMES),
    modeLabel: scriptExample.modeLabel,
    modeConfig: scriptExample.modeConfig,
    message: scriptExample.message,
    controlPrimary: control.primary,
    controlSecondary: control.secondary,
  };
}

export function LandingMessageRotator() {
  const [config, setConfig] = useState<MessageConfig>(() => buildRandomConfig());
  const [nextConfig, setNextConfig] = useState<MessageConfig | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const currentSlideRef = useRef<HTMLDivElement | null>(null);
  const nextSlideRef = useRef<HTMLDivElement | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const historyRef = useRef<MessageConfig[]>([]);
  const historyIndexRef = useRef(0);

  useEffect(() => {
    if (historyRef.current.length === 0) {
      historyRef.current = [config];
      historyIndexRef.current = 0;
    }
  }, [config]);

  const runTransition = useCallback((targetConfig: MessageConfig, dir: "next" | "prev") => {
    if (isTransitioning) {
      return;
    }
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    setDirection(dir);
    setNextConfig(targetConfig);
    setIsTransitioning(true);

    transitionTimeoutRef.current = window.setTimeout(() => {
      setConfig(targetConfig);
      setNextConfig(null);
      setIsTransitioning(false);
    }, TRANSITION_MS);
  }, [isTransitioning]);

  const advanceToNextCard = useCallback(() => {
    if (isTransitioning) {
      return;
    }
    if (historyRef.current.length === 0) {
      historyRef.current = [config];
      historyIndexRef.current = 0;
    }

    const nextIndex = historyIndexRef.current + 1;
    const nextFromHistory = historyRef.current[nextIndex];
    if (nextFromHistory) {
      historyIndexRef.current = nextIndex;
      runTransition(nextFromHistory, "next");
      return;
    }

    const generated = buildRandomConfig(config);
    historyRef.current.push(generated);
    historyIndexRef.current = historyRef.current.length - 1;
    runTransition(generated, "next");
  }, [config, isTransitioning, runTransition]);

  const advanceToPreviousCard = useCallback(() => {
    if (isTransitioning) {
      return;
    }
    if (historyRef.current.length === 0) {
      historyRef.current = [config];
      historyIndexRef.current = 0;
    }
    if (historyIndexRef.current === 0) {
      return;
    }
    const prevIndex = historyIndexRef.current - 1;
    const previous = historyRef.current[prevIndex];
    if (!previous) {
      return;
    }
    historyIndexRef.current = prevIndex;
    runTransition(previous, "prev");
  }, [config, isTransitioning, runTransition]);

  const handleCardTap = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const tappedLeftHalf = event.clientX - bounds.left < bounds.width / 2;
    if (tappedLeftHalf) {
      advanceToPreviousCard();
      return;
    }
    advanceToNextCard();
  }, [advanceToNextCard, advanceToPreviousCard]);

  useLayoutEffect(() => {
    const currentHeight = currentSlideRef.current?.offsetHeight ?? 0;
    const nextHeight = nextSlideRef.current?.offsetHeight ?? 0;
    const targetHeight = Math.max(currentHeight, nextHeight);

    if (targetHeight > 0) {
      setContainerHeight(targetHeight);
    }
  }, [config, nextConfig, isTransitioning]);

  useEffect(() => {
    function recalculateHeight() {
      const currentHeight = currentSlideRef.current?.offsetHeight ?? 0;
      const nextHeight = nextSlideRef.current?.offsetHeight ?? 0;
      const targetHeight = Math.max(currentHeight, nextHeight);

      if (targetHeight > 0) {
        setContainerHeight(targetHeight);
      }
    }

    window.addEventListener("resize", recalculateHeight);
    return () => {
      window.removeEventListener("resize", recalculateHeight);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      advanceToNextCard();
    }, ROTATE_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [advanceToNextCard]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={handleCardTap}
      className="group relative block w-full cursor-pointer overflow-hidden text-left transition-[height] duration-700 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground/50"
      aria-label="Show previous or next wake-up sample"
      style={containerHeight ? { height: containerHeight } : undefined}
    >
      <div
        ref={currentSlideRef}
        className={`transition-all duration-900 ease-out ${
          isTransitioning
            ? direction === "next"
              ? "pointer-events-none absolute inset-0 opacity-0 -translate-y-2 scale-[0.985] blur-[1px]"
              : "pointer-events-none absolute inset-0 opacity-0 translate-y-2 scale-[0.985] blur-[1px]"
            : "relative opacity-100 translate-y-0 scale-100 blur-0"
        }`}
      >
        <RotatorSlide config={config} />
      </div>

      {nextConfig ? (
        <div
          ref={nextSlideRef}
          className={`absolute inset-0 transition-all duration-900 ease-out ${
            isTransitioning
              ? "opacity-100 translate-y-0 scale-100 blur-0"
              : direction === "next"
                ? "opacity-0 translate-y-2 scale-[1.01] blur-[1px]"
                : "opacity-0 -translate-y-2 scale-[1.01] blur-[1px]"
          }`}
        >
          <RotatorSlide config={nextConfig} />
        </div>
      ) : null}
      {isTransitioning ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-foreground/6 to-transparent animate-in fade-in duration-500"
        />
      ) : null}
      <span className="pointer-events-none absolute right-0 top-0 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-70">
        Tap left/right
      </span>
    </button>
  );
}
