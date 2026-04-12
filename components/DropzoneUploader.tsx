"use client";

import { useMemo, useRef, useState } from "react";

type Props = {
  title: string;
  hint: string;
  accept: string;
  allowedExt: string[]; // e.g. ["jpg","png"]
  onFileSelected: (file: File | null) => void;
};

function getExt(name: string) {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx + 1).toLowerCase();
}

export default function DropzoneUploader({
  title,
  hint,
  accept,
  allowedExt,
  onFileSelected
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detail = useMemo(() => {
    if (!file) return "파일을 선택하지 않았습니다.";
    return `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
  }, [file]);

  function pick(f: File | null) {
    if (!f) {
      setFile(null);
      setError(null);
      onFileSelected(null);
      return;
    }
    const ext = getExt(f.name);
    if (!allowedExt.includes(ext)) {
      setError(`허용되지 않는 확장자입니다. (${allowedExt.join(", ")})`);
      setFile(null);
      onFileSelected(null);
      return;
    }
    setError(null);
    setFile(f);
    onFileSelected(f);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white/90">{title}</div>
          <div className="mt-1 text-xs text-white/60">{hint}</div>
          <div className="mt-1 text-xs text-white/55">{detail}</div>
          {error ? <div className="mt-2 text-xs text-rose-200">{error}</div> : null}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="shrink-0 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-400"
        >
          파일 선택
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>

      <div
        className={`mt-4 rounded-xl border border-dashed p-4 transition ${
          dragging
            ? "border-indigo-300/70 bg-indigo-500/10"
            : "border-white/15 bg-black/20 hover:bg-black/25"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        <div className="text-sm text-white/80">
          드래그앤드롭으로 업로드하거나, 위의 “파일 선택”을 눌러주세요.
        </div>
        <div className="mt-1 text-xs text-white/55">허용: {allowedExt.join(", ")}</div>
      </div>
    </div>
  );
}

