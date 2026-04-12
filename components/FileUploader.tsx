"use client";

import { useMemo, useState } from "react";

type Props = {
  accept: string;
  label: string;
  onFileSelected: (file: File | null) => void;
};

export default function FileUploader({ accept, label, onFileSelected }: Props) {
  const [file, setFile] = useState<File | null>(null);

  const detail = useMemo(() => {
    if (!file) return "파일을 선택하지 않았습니다.";
    return `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
  }, [file]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white/90">{label}</div>
          <div className="mt-1 text-xs text-white/60">{detail}</div>
        </div>
        <label className="cursor-pointer rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-400">
          파일 선택
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              onFileSelected(f);
            }}
          />
        </label>
      </div>
    </div>
  );
}

