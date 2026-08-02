import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { groupFilters, tarotCards, type TarotCard } from "./tarot-data";

type SpreadSize = 1 | 3;
type Stage = "ready" | "shuffling" | "drawn";
type DrawnCard = { card: TarotCard; reversed: boolean; revealed: boolean };

const spreadPositions = {
  1: ["此刻的指引"],
  3: ["现状", "挑战", "指引"],
} as const;

function randomIndex(max: number) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const value = crypto.getRandomValues(new Uint32Array(1))[0];
    return value % max;
  }
  return Math.floor(Math.random() * max);
}

function drawFromDeck(count: SpreadSize): DrawnCard[] {
  const pool = [...tarotCards];
  const result: DrawnCard[] = [];

  for (let index = 0; index < count; index += 1) {
    const selected = randomIndex(pool.length);
    const [card] = pool.splice(selected, 1);
    result.push({
      card,
      reversed: randomIndex(100) < 35,
      revealed: false,
    });
  }

  return result;
}

function updateCardPhysics(event: ReactPointerEvent<HTMLButtonElement>) {
  if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;

  const element = event.currentTarget;
  const bounds = element.getBoundingClientRect();
  const normalizedX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1));
  const normalizedY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1));
  const glareX = ((normalizedX + 1) / 2) * 100;
  const glareY = ((normalizedY + 1) / 2) * 100;

  element.dataset.pointerX = String(normalizedX);
  element.dataset.pointerY = String(normalizedY);
  element.style.setProperty("--tilt-x", `${(-normalizedY * 10).toFixed(2)}deg`);
  element.style.setProperty("--tilt-y", `${(normalizedX * 10).toFixed(2)}deg`);
  element.style.setProperty("--glare-x", `${glareX.toFixed(1)}%`);
  element.style.setProperty("--glare-y", `${glareY.toFixed(1)}%`);
  element.style.setProperty("--shadow-x", `${(-normalizedX * 15).toFixed(1)}px`);
  element.style.setProperty("--shadow-y", `${(24 - normalizedY * 9).toFixed(1)}px`);
  element.classList.add("is-tracking");
}

function resetCardPhysics(event: ReactPointerEvent<HTMLButtonElement>) {
  const element = event.currentTarget;
  element.classList.remove("is-tracking", "is-pressing");
  element.style.setProperty("--tilt-x", "0deg");
  element.style.setProperty("--tilt-y", "0deg");
  element.style.setProperty("--glare-x", "50%");
  element.style.setProperty("--glare-y", "42%");
  element.style.setProperty("--shadow-x", "0px");
  element.style.setProperty("--shadow-y", "24px");
}

export default function App() {
  const [spread, setSpread] = useState<SpreadSize>(1);
  const [stage, setStage] = useState<Stage>("ready");
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [question, setQuestion] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [filter, setFilter] = useState<(typeof groupFilters)[number][0]>("all");
  const [copied, setCopied] = useState(false);

  const allRevealed = drawnCards.length > 0 && drawnCards.every((item) => item.revealed);
  const visibleCards = useMemo(
    () => (filter === "all" ? tarotCards : tarotCards.filter((card) => card.group === filter)),
    [filter],
  );

  useEffect(() => {
    if (!libraryOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLibraryOpen(false);
    };
    document.body.classList.add("no-scroll");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("no-scroll");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [libraryOpen]);

  const beginReading = () => {
    if (stage === "shuffling") return;
    setCopied(false);
    setDrawnCards([]);
    setStage("shuffling");
    window.setTimeout(() => {
      setDrawnCards(drawFromDeck(spread));
      setStage("drawn");
    }, 1050);
  };

  const changeSpread = (next: SpreadSize) => {
    setSpread(next);
    setStage("ready");
    setDrawnCards([]);
  };

  const revealCard = (index: number, event: ReactMouseEvent<HTMLButtonElement>) => {
    if (drawnCards[index]?.revealed) return;

    const element = event.currentTarget;
    const pointerX = event.detail === 0 ? 1 : Number(element.dataset.pointerX ?? 1);
    // Keep the card faces on a stable Y axis so browsers never flatten the two
    // layers into one plane. The press position still chooses which edge leads
    // the flip, while the live X/Y tilt makes the pressed corner dip naturally.
    element.style.setProperty("--flip-angle", pointerX < 0 ? "-180deg" : "180deg");
    element.classList.remove("is-pressing");

    setDrawnCards((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, revealed: true } : item,
      ),
    );
  };

  const copyReading = async () => {
    const reading = drawnCards
      .map((item, index) => {
        const orientation = item.reversed ? "逆位" : "正位";
        const meaning = item.reversed ? item.card.reversed : item.card.upright;
        return `${spreadPositions[spread][index]}｜${item.card.name}（${orientation}）：${meaning}。${item.card.guidance}`;
      })
      .join("\n");
    const text = `${question.trim() ? `我的问题：${question.trim()}\n` : ""}${reading}\n\n— 秘仪 · 我的塔罗抽牌`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="#top" aria-label="秘仪首页">
          <span className="brand-mark" aria-hidden="true">☾</span>
          <span>
            <strong>秘仪</strong>
            <small>ARCANA</small>
          </span>
        </a>
        <button className="library-link" type="button" onClick={() => setLibraryOpen(true)}>
          <span aria-hidden="true">✦</span>
          查看全部牌库
          <em>78</em>
        </button>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> A MOMENT OF REFLECTION <span /></div>
        <h1>让牌面照见<br /><i>此刻的你</i></h1>
        <p className="hero-copy">默念一个问题，深呼吸，然后从完整的 78 张韦特塔罗中抽取你的指引。</p>

        <div className="reading-controls" aria-label="抽牌设置">
          <label className="question-field">
            <span>你想问什么？</span>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="可以留空，把注意力放在当下"
              maxLength={80}
            />
            <small>{question.length}/80</small>
          </label>

          <div className="spread-switch" aria-label="选择牌阵">
            <button
              className={spread === 1 ? "active" : ""}
              type="button"
              aria-pressed={spread === 1}
              onClick={() => changeSpread(1)}
            >
              <strong>一张牌</strong>
              <span>快速指引</span>
            </button>
            <button
              className={spread === 3 ? "active" : ""}
              type="button"
              aria-pressed={spread === 3}
              onClick={() => changeSpread(3)}
            >
              <strong>三张牌</strong>
              <span>现状 · 挑战 · 指引</span>
            </button>
          </div>
        </div>
      </section>

      <section className={`ritual-stage stage-${stage}`} aria-live="polite">
        {stage === "ready" && (
          <div className="deck-ready">
            <div className="deck-stack" aria-hidden="true">
              <div className="deck-shadow-card" />
              <div className="deck-shadow-card" />
              <div className="card-back large">
                <div className="card-back-inner">
                  <span className="moon-orbit"><b>☾</b></span>
                  <span className="back-star">✦</span>
                  <small>AS ABOVE · SO BELOW</small>
                </div>
              </div>
            </div>
            <div className="deck-count"><span>78</span> 张完整牌组</div>
            <button className="primary-action" type="button" onClick={beginReading}>
              <span>洗牌并抽取{spread === 1 ? "一张" : "三张"}</span>
              <b aria-hidden="true">→</b>
            </button>
            <p className="ritual-hint">准备好时，轻触开始</p>
          </div>
        )}

        {stage === "shuffling" && (
          <div className="shuffling-state">
            <div className="shuffle-cards" aria-hidden="true">
              <div className="mini-back" />
              <div className="mini-back" />
              <div className="mini-back" />
            </div>
            <p>正在洗牌</p>
            <span>让问题停留在心里…</span>
          </div>
        )}

        {stage === "drawn" && (
          <div className="drawn-state">
            <div className="drawn-heading">
              <span className="section-kicker">YOUR READING</span>
              <h2>{allRevealed ? "牌面已经展开" : "依次翻开你的牌"}</h2>
              <p>{allRevealed ? "不要寻找唯一答案，留意最先触动你的那句话。" : "每一次翻牌，都是一次与当下的相遇。"}</p>
            </div>

            <div className={`drawn-cards cards-${spread}`}>
              {drawnCards.map((item, index) => (
                <article className="drawn-card-wrap" key={item.card.id}>
                  <span className="position-label">{spreadPositions[spread][index]}</span>
                  <button
                    className={`tarot-card ${item.revealed ? "revealed" : ""}`}
                    type="button"
                    onClick={(event) => revealCard(index, event)}
                    onPointerMove={updateCardPhysics}
                    onPointerLeave={resetCardPhysics}
                    onPointerCancel={resetCardPhysics}
                    onPointerDown={(event) => {
                      if (event.pointerType === "mouse" || event.pointerType === "pen") {
                        event.currentTarget.classList.add("is-pressing");
                      }
                    }}
                    onPointerUp={(event) => event.currentTarget.classList.remove("is-pressing")}
                    aria-disabled={item.revealed}
                    aria-label={item.revealed ? `${item.card.name}，${item.reversed ? "逆位" : "正位"}` : `翻开第 ${index + 1} 张牌`}
                  >
                    <span className="tarot-card-inner">
                      <span className="tarot-card-back">
                        <span className="card-back-inner">
                          <span className="moon-orbit"><b>☾</b></span>
                          <span className="back-star">✦</span>
                          <small>ARCANA</small>
                        </span>
                        <em>轻触翻牌</em>
                      </span>
                      <span className="tarot-card-front">
                        <img
                          className={item.reversed ? "is-reversed" : ""}
                          src={item.card.image}
                          alt={item.card.name}
                        />
                      </span>
                    </span>
                  </button>
                  <div className={`card-caption ${item.revealed ? "visible" : ""}`}>
                    <strong>{item.card.name}</strong>
                    <span>{item.card.englishName}</span>
                    <em className={item.reversed ? "reversed-label" : ""}>{item.reversed ? "逆位" : "正位"}</em>
                  </div>
                </article>
              ))}
            </div>

            {allRevealed && (
              <div className="interpretations">
                {question.trim() && (
                  <div className="question-echo">
                    <span>你的问题</span>
                    <p>“{question.trim()}”</p>
                  </div>
                )}
                {drawnCards.map((item, index) => (
                  <article className="interpretation-card" key={`reading-${item.card.id}`}>
                    <div className="interpretation-index">0{index + 1}</div>
                    <div>
                      <div className="interpretation-title">
                        <span>{spreadPositions[spread][index]}</span>
                        <h3>{item.card.name}</h3>
                        <em>{item.reversed ? "逆位" : "正位"}</em>
                      </div>
                      <p className="keywords">{item.reversed ? item.card.reversed : item.card.upright}</p>
                      <p className="guidance">{item.card.guidance}</p>
                    </div>
                  </article>
                ))}
                <div className="reading-actions">
                  <button className="secondary-action" type="button" onClick={copyReading}>
                    {copied ? "已复制到剪贴板" : "复制本次解读"}
                  </button>
                  <button className="primary-action compact" type="button" onClick={beginReading}>
                    再抽一次 <b aria-hidden="true">↻</b>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="details-strip" aria-label="牌组信息">
        <div><span>Ⅰ</span><strong>完整牌库</strong><small>22 张大牌 · 56 张小牌</small></div>
        <div><span>Ⅱ</span><strong>包含正逆位</strong><small>每次抽取独立随机</small></div>
        <div><span>Ⅲ</span><strong>留在本地</strong><small>问题不会被上传或保存</small></div>
      </section>

      <footer>
        <p>塔罗是一面镜子，而不是判决书。仅供娱乐与自我反思。</p>
        <p>牌面：Pamela Colman Smith，1910 · <a href="https://commons.wikimedia.org/wiki/Category:Rider-Waite-Smith_tarot_deck_(TaionWC)" target="_blank" rel="noreferrer">Wikimedia Commons · Public Domain</a></p>
      </footer>

      {libraryOpen && (
        <div className="library-overlay" role="dialog" aria-modal="true" aria-labelledby="library-title">
          <button className="overlay-dismiss" aria-label="关闭牌库" onClick={() => setLibraryOpen(false)} />
          <section className="library-panel">
            <header>
              <div>
                <span className="section-kicker">THE COMPLETE DECK</span>
                <h2 id="library-title">完整 78 张牌库</h2>
                <p>经典 Rider–Waite–Smith “Pam-A” 公版扫描</p>
              </div>
              <button className="close-library" type="button" onClick={() => setLibraryOpen(false)} aria-label="关闭牌库">×</button>
            </header>
            <nav className="library-filters" aria-label="筛选牌组">
              {groupFilters.map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={filter === value ? "active" : ""}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="library-grid">
              {visibleCards.map((card) => (
                <article className="library-card" key={card.id}>
                  <div className="library-image"><img src={card.image} alt={card.name} loading="lazy" /></div>
                  <span>{card.number}</span>
                  <strong>{card.name}</strong>
                  <small>{card.englishName}</small>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
