import { useEffect, useRef, useState } from "react";

type DialogKind = "alert" | "confirm" | "prompt";
type DialogOptions = { title?: string; confirmLabel?: string; cancelLabel?: string; placeholder?: string; danger?: boolean };
type DialogRequest = DialogOptions & {
  kind: DialogKind;
  message: string;
  resolve: (value: any) => void;
};

const listeners = new Set<(request: DialogRequest) => void>();

function ask<T>(kind: DialogKind, message: string, options: DialogOptions = {}): Promise<T> {
  return new Promise(resolve => {
    const request: DialogRequest = { kind, message, ...options, resolve: resolve as (value: any) => void };
    listeners.forEach(listener => listener(request));
  });
}

export const appAlert = (message: string, options?: DialogOptions) => ask<void>("alert", message, options);
export const appConfirm = (message: string, options?: DialogOptions) => ask<boolean>("confirm", message, options);
export const appPrompt = (message: string, options?: DialogOptions) => ask<string | null>("prompt", message, options);

export function AppDialogHost() {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [value, setValue] = useState("");
  const queue = useRef<DialogRequest[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const receive = (request: DialogRequest) => {
      setDialog(current => {
        if (current) {
          queue.current.push(request);
          return current;
        }
        return request;
      });
    };
    listeners.add(receive);
    return () => { listeners.delete(receive); };
  }, []);

  useEffect(() => {
    setValue("");
    if (dialog?.kind === "prompt") requestAnimationFrame(() => inputRef.current?.focus());
  }, [dialog]);

  useEffect(() => {
    if (!dialog) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish(dialog.kind === "confirm" ? false : null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialog]);

  const finish = (result: any) => {
    if (!dialog) return;
    dialog.resolve(result);
    setDialog(queue.current.shift() || null);
  };

  if (!dialog) return null;
  const isAlert = dialog.kind === "alert";
  const isPrompt = dialog.kind === "prompt";
  return <div className="app-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) finish(isAlert ? true : isPrompt ? null : false); }}>
    <section className="app-dialog-card" role={isAlert ? "alertdialog" : "dialog"} aria-modal="true" aria-labelledby="app-dialog-title" aria-describedby="app-dialog-message">
      <div className={`app-dialog-mark${dialog.danger ? " danger" : ""}`} aria-hidden="true">{dialog.danger ? "!" : isAlert ? "✓" : "?"}</div>
      <div className="app-dialog-copy">
        <h2 id="app-dialog-title">{dialog.title || (isAlert ? "Notice" : isPrompt ? "Enter a value" : "Are you sure?")}</h2>
        <p id="app-dialog-message">{dialog.message}</p>
        {isPrompt&&<input ref={inputRef} className="app-dialog-input" value={value} placeholder={dialog.placeholder || "Type here"} onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === "Enter") finish(value); }} />}
      </div>
      <div className="app-dialog-actions">
        {!isAlert&&<button type="button" autoFocus={dialog.kind === "confirm"} className="app-dialog-cancel" onClick={() => finish(isPrompt ? null : false)}>{dialog.cancelLabel || "Cancel"}</button>}
        <button type="button" className={`app-dialog-confirm${dialog.danger ? " danger" : ""}`} autoFocus={isAlert} onClick={() => finish(isPrompt ? value : true)}>{dialog.confirmLabel || (isAlert ? "OK" : isPrompt ? "Continue" : "Confirm")}</button>
      </div>
    </section>
  </div>;
}
