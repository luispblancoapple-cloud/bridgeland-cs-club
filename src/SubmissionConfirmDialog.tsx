import { useEffect } from "react";

type SubmissionConfirmDialogProps = {
  answered: number;
  total: number;
  topicPractice?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function SubmissionConfirmDialog({ answered, total, topicPractice = false, onConfirm, onCancel }: SubmissionConfirmDialogProps) {
  const unanswered = Math.max(0, total - answered);
  const title = topicPractice ? "Submit this topic set?" : "Submit this practice test?";
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);
  return <div className="submit-confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <section className="submit-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="submit-confirm-title" aria-describedby="submit-confirm-description">
      <div className="submit-confirm-icon" aria-hidden="true">✓</div>
      <div className="submit-confirm-copy">
        <h2 id="submit-confirm-title">{title}</h2>
        <p id="submit-confirm-description">{unanswered > 0
          ? `You’ve answered ${answered} of ${total} questions. ${unanswered} ${unanswered === 1 ? "question" : "questions"} will be submitted blank.`
          : `You’ve answered all ${total} questions.`} Your answers will be locked and your results will appear after submission.</p>
      </div>
      <div className="submit-confirm-actions">
        <button type="button" autoFocus className="submit-confirm-cancel" onClick={onCancel}>Keep practicing</button>
        <button type="button" className="submit-confirm-submit" onClick={onConfirm}>{topicPractice ? "Submit topic set" : "Submit test"}</button>
      </div>
    </section>
  </div>;
}
