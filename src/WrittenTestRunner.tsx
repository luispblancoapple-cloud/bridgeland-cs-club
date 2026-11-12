import { useEffect, useMemo, useRef, useState } from "react";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { UILWrittenTest } from "./uilWrittenPractice";
import UIL_PAPER_MAP from "./uilPaperMap.json";

const TEST_MINUTES = 12;

function getSourcePage(question: any): number | undefined {
  const paper = (UIL_PAPER_MAP as any)[question.sourceTestId];
  return paper?.choices?.[question.sourceQuestion]?.[0]?.page ?? paper?.written?.[question.sourceQuestion]?.page;
}

function WrittenOriginalQuestion({ question }: { question: any }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState<any>(null);
  const [error, setError] = useState("");
  const pageIndex = getSourcePage(question);

  useEffect(() => {
    let active = true;
    let task: any = null;
    if (pageIndex === undefined) {
      setError("The original page for this question is unavailable.");
      return;
    }
    import("pdfjs-dist").then(async (pdfjsLib: any) => {
      if (!active) return;
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      task = pdfjsLib.getDocument({ url: `${import.meta.env.BASE_URL}uil-packets/${question.sourceTestId}.pdf` });
      const pdf = await task.promise;
      const originalPage = await pdf.getPage(pageIndex + 1);
      if (active) setPage(originalPage);
    }).catch((reason: any) => { if (active) setError(reason?.message || "Unable to open the original packet page."); });
    return () => { active = false; task?.destroy?.(); };
  }, [pageIndex, question.sourceTestId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!page || !canvas || !container) return;
    let renderTask: any = null;
    let active = true;
    const render = async () => {
      if (!active) return;
      renderTask?.cancel?.();
      const base = page.getViewport({ scale: 1 });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: Math.max(1, container.clientWidth) * pixelRatio / base.width });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) return;
      renderTask = page.render({ canvasContext: context, viewport });
      try { await renderTask.promise; } catch (reason: any) { if (reason?.name !== "RenderingCancelledException") setError("Unable to render the original packet page."); }
    };
    void render();
    const resize = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => void render()) : null;
    resize?.observe(container);
    return () => { active = false; resize?.disconnect(); renderTask?.cancel?.(); };
  }, [page]);

  if (error) return <div role="alert" className="uil-paper-error">{error}</div>;
  if (!page) return <div className="uil-paper-loading">Loading the original question…</div>;
  return <div ref={containerRef} className="written-test-original-page"><canvas ref={canvasRef} aria-label={`Original test page containing question ${question.sourceQuestion}`} /></div>;
}

function makeAttempt() {
  return { startedAt: Date.now(), answers: {} as Record<number, number | string>, submittedAt: null as number | null };
}

export default function WrittenTestRunner({ username, test, onBack, onStatusChange, onExamModeChange }: { username: string; test: UILWrittenTest; onBack: () => void; onStatusChange: (value: any) => void; onExamModeChange: (value: boolean) => void }) {
  const storageKey = `bridgeland-cs-club:written-test:${username}:${test.id}`;
  const [attempt, setAttempt] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch { /* Start a fresh attempt if saved progress cannot be read. */ }
    return makeAttempt();
  });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sourceQuestionIndex, setSourceQuestionIndex] = useState<number | null>(null);
  const sourcePreviewRef = useRef<HTMLElement | null>(null);
  const [now, setNow] = useState(Date.now());
  const hasResponse = (question: any, value: any) => question.choices.length ? value !== undefined : String(value ?? "").trim() !== "";
  const answered = Object.entries(attempt.answers || {}).filter(([index, value]: any) => hasResponse(test.questions[Number(index)], value)).length;
  const remaining = Math.max(0, TEST_MINUTES * 60 - Math.floor((now - attempt.startedAt) / 1000));
  const normalizeResponse = (value: any) => String(value ?? "").trim().replace(/\s+/g, "").toLowerCase();
  const result = useMemo(() => attempt.submittedAt ? test.questions.map((question, index) => ({
    question,
    index,
    selected: attempt.answers?.[index],
    correct: question.choices.length
      ? attempt.answers?.[index] === question.answer
      : normalizeResponse(attempt.answers?.[index]) === normalizeResponse(question.answer),
  })) : null, [attempt, test]);

  const save = (next: any) => {
    setAttempt(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep the attempt available in memory. */ }
  };
  const finish = () => {
    if (attempt.submittedAt) return;
    save({ ...attempt, submittedAt: Date.now() });
  };

  useEffect(() => {
    onExamModeChange?.(true);
    return () => { onExamModeChange?.(false); onStatusChange?.(null); };
  }, [onExamModeChange, onStatusChange]);
  useEffect(() => {
    onStatusChange?.({
      year: "Written Test",
      level: test.title,
      startedAt: attempt.startedAt,
      minutes: TEST_MINUTES,
      answered,
      questions: test.questions.length,
      submitted: !!attempt.submittedAt,
      isTopicPractice: true,
      onBack,
      submit: finish,
      reset: () => { save(makeAttempt()); setQuestionIndex(0); },
    });
  }, [onStatusChange, attempt, answered, test]);
  useEffect(() => {
    if (attempt.submittedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [attempt.submittedAt]);
  useEffect(() => {
    if (remaining === 0 && !attempt.submittedAt) finish();
  }, [remaining, attempt.submittedAt]);
  useEffect(() => {
    if (sourceQuestionIndex === null) return;
    const frame = requestAnimationFrame(() => sourcePreviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [sourceQuestionIndex]);

  if (result) {
    const correct = result.filter((item: any) => item.correct).length;
    const incorrect = result.filter((item: any) => hasResponse(item.question, item.selected) && !item.correct).length;
    const unanswered = result.length - correct - incorrect;
    const attempted = correct + incorrect;
    const accuracy = attempted ? Math.round(correct / attempted * 100) : 0;
    const missed = result.filter((item: any) => !item.correct);
    return <main className="written-test-page uil-submitted-page">
      <section className="uil-result-hero">
        <div className="uil-result-eyebrow">Test submitted · Written Test</div>
        <h1>{test.title}</h1>
        <div className="uil-result-total">{correct}<span> / {test.questions.length} correct</span></div>
        <p>{attempted ? `${accuracy}% accuracy on answered questions` : "No questions answered"}</p>
      </section>
      <section className="uil-result-stats" aria-label="Test summary">
        <div><span>Correct</span><strong>{correct}</strong></div>
        <div><span>Incorrect</span><strong>{incorrect}</strong></div>
        <div><span>Unanswered</span><strong>{unanswered}</strong></div>
        <div><span>Score</span><strong>{correct} / {test.questions.length}</strong></div>
      </section>
      <section className="uil-result-card">
        <h2>Question breakdown</h2>
        <div className="uil-question-results">
          {result.map((item: any) => <article key={item.index} className={`uil-question-result ${item.correct ? "correct" : !hasResponse(item.question, item.selected) ? "unanswered" : "incorrect"}`}>
            <strong>Question {item.index + 1} · {item.correct ? "Correct" : !hasResponse(item.question, item.selected) ? "Unanswered" : "Incorrect"}</strong>
            <span><b>Topic:</b> {item.question.topic}</span>
            <div className="written-test-result-answers">
              <span>Your answer</span><span>{!hasResponse(item.question, item.selected) ? "—" : item.question.choices.length ? `${String.fromCharCode(65 + Number(item.selected))}. ${item.question.choices[Number(item.selected)]}` : String(item.selected)}</span>
              <span>Correct answer</span><span>{item.question.choices.length ? `${String.fromCharCode(65 + Number(item.question.answer))}. ${item.question.choices[Number(item.question.answer)]}` : String(item.question.answer)}</span>
            </div>
            <button type="button" className="uil-view-question" aria-expanded={sourceQuestionIndex === item.index} aria-controls="written-original-question" onClick={() => setSourceQuestionIndex(sourceQuestionIndex === item.index ? null : item.index)}>View original question</button>
          </article>)}
        </div>
      </section>
      {sourceQuestionIndex !== null && (() => {
        const item = result[sourceQuestionIndex];
        return <section ref={sourcePreviewRef} id="written-original-question" className="uil-result-card uil-review-paper-card" aria-label={`Original packet question ${item.question.sourceQuestion}`}>
          <div className="uil-review-paper-heading"><div><h2>Original packet page</h2><p>Question {item.question.sourceQuestion} · {item.question.sourceLabel}</p></div><button type="button" className="uil-review-paper-close" onClick={() => setSourceQuestionIndex(null)}>Close</button></div>
          <div className="uil-review-paper"><WrittenOriginalQuestion question={item.question} /></div>
        </section>;
      })()}
      <section className="uil-result-card">
        <h2>What to work on</h2>
        {missed.length ? <div className="uil-review-topic-list">{missed.map((item: any) => <div className="uil-review-topic" key={item.index}><strong>{item.question.topic}</strong><span>Question {item.index + 1}</span></div>)}</div> : <p>You answered every question correctly. Keep practicing to stay sharp.</p>}
      </section>
      <div className="written-test-actions">
        <button type="button" className="uil-results-back" onClick={onBack}>Back to Written Test Problems</button>
        <button type="button" className="uil-exam-submit" onClick={() => { save(makeAttempt()); setQuestionIndex(0); }}>Try again</button>
      </div>
    </main>;
  }

  const question = test.questions[questionIndex];
  const selected = attempt.answers?.[questionIndex];
  const selectAnswer = (choiceIndex: number) => save({ ...attempt, answers: { ...attempt.answers, [questionIndex]: choiceIndex } });
  return <main className="written-test-page">
    <div className="written-test-layout">
      <nav className="written-test-question-nav" aria-label="Question navigation">
        {test.questions.map((item, index) => <button key={index} type="button" className={`${questionIndex === index ? "active" : ""}${attempt.answers?.[index] !== undefined ? " answered" : ""}`} onClick={() => setQuestionIndex(index)} aria-current={questionIndex === index ? "step" : undefined}>
          <span>{index + 1}</span><small>{item.topic}</small>
        </button>)}
      </nav>
      <section className="written-test-question-card" aria-labelledby="written-test-question-title">
        <div className="written-test-question-meta"><span>Question {questionIndex + 1} of {test.questions.length}</span><strong>{question.topic}</strong></div>
        {question.sharedContext && <div className="written-test-shared-context"><strong>Shared code and data for related questions</strong><pre className="written-test-code"><code>{question.sharedContext}</code></pre></div>}
        <h1 id="written-test-question-title">{question.prompt}</h1>
        {question.code && <pre className="written-test-code"><code>{question.code}</code></pre>}
        {question.choices.length ? <div className="written-test-choices" role="group" aria-label="Answer choices">
          {question.choices.map((choice, index) => <button key={`${index}-${choice}`} type="button" className={selected === index ? "selected" : ""} aria-pressed={selected === index} onClick={() => selectAnswer(index)}>
            <span>{String.fromCharCode(65 + index)}</span><span>{choice}</span>
          </button>)}
        </div> : <label className="written-test-short-answer"><span>Type your answer</span><input type="text" inputMode="numeric" value={String(selected ?? "")} onChange={(event:any)=>save({...attempt,answers:{...attempt.answers,[questionIndex]:event.target.value}})} aria-label="Written answer" autoComplete="off" /></label>}
        <div className="written-test-pager">
          <button type="button" className="uil-exam-submit secondary" disabled={questionIndex === 0} onClick={() => setQuestionIndex((index: number) => Math.max(0, index - 1))}>← Previous</button>
          <button type="button" className="uil-exam-submit" disabled={questionIndex === test.questions.length - 1} onClick={() => setQuestionIndex((index: number) => Math.min(test.questions.length - 1, index + 1))}>Next question →</button>
        </div>
      </section>
    </div>
    <p className="written-test-source">Question source: {question.sourceLabel}, question {question.sourceQuestion}. <a href={`${import.meta.env.BASE_URL}uil-packets/${question.sourceTestId}.pdf`} target="_blank" rel="noreferrer">Open the source packet ↗</a></p>
  </main>;
}
