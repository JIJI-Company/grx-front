import { useCallback, useEffect, useRef, useState } from 'react';
import { FANART_MEMBERS, type FanArtMember } from './fanartMockData';

interface FanArtUploadModalProps {
  onClose: () => void;
  onSubmit: (data: { file: File; title: string; authorName: string; memberNames: string[] }) => void;
  uploading?: boolean;
}

export default function FanArtUploadModal({ onClose, onSubmit, uploading }: FanArtUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPicker) setShowPicker(false);
        else onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, showPicker]);

  useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  const toggleMember = (name: string) => {
    setMemberNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !authorName.trim() || memberNames.length === 0) return;
    onSubmit({ file, title: title.trim(), authorName: authorName.trim(), memberNames });
  };

  const valid = file && title.trim() && authorName.trim() && memberNames.length > 0;

  return (
    <div className="fanart-modal-backdrop" onClick={onClose}>
      <form
        className="fanart-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="fanart-modal-header">
          <h2>팬아트 업로드</h2>
          <button type="button" className="fanart-lightbox-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div
          className={`fanart-dropzone${dragOver ? ' is-dragover' : ''}${preview ? ' has-preview' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {preview ? (
            <img src={preview} alt="미리보기" className="fanart-dropzone-preview" />
          ) : (
            <div className="fanart-dropzone-placeholder">
              <span className="fanart-dropzone-icon">+</span>
              <span>이미지를 드래그하거나 클릭해서 선택</span>
              <span className="fanart-dropzone-hint">PNG, JPG, WebP (최대 10MB)</span>
            </div>
          )}
        </div>

        <div className="fanart-picker-wrap" ref={pickerRef}>
          <label className="fanart-field-label">장수 선택</label>
          <button
            type="button"
            className="fanart-picker-trigger"
            onClick={() => setShowPicker((v) => !v)}
          >
            {memberNames.length > 0 ? (
              <span className="fanart-picker-tags">
                {memberNames.map((name) => {
                  const m = FANART_MEMBERS.find((x) => x.name === name);
                  return (
                    <span
                      key={name}
                      className="fanart-picker-tag"
                      style={{ borderColor: m?.color }}
                    >
                      {name}
                      <span
                        className="fanart-picker-tag-x"
                        onClick={(e) => { e.stopPropagation(); toggleMember(name); }}
                      >
                        &times;
                      </span>
                    </span>
                  );
                })}
              </span>
            ) : (
              <span className="fanart-picker-placeholder">멤버를 선택하세요</span>
            )}
            <span className="fanart-picker-arrow">{showPicker ? '▲' : '▼'}</span>
          </button>

          {showPicker && (
            <div className="fanart-picker-dropdown" onWheel={(e) => e.stopPropagation()}>
              {FANART_MEMBERS.map((m) => {
                const checked = memberNames.includes(m.name);
                return (
                  <button
                    key={m.name}
                    type="button"
                    className={`fanart-picker-option${checked ? ' is-checked' : ''}`}
                    onClick={() => toggleMember(m.name)}
                  >
                    <span
                      className="fanart-picker-check"
                      style={checked ? { background: m.color, borderColor: m.color } : undefined}
                    >
                      {checked && '✓'}
                    </span>
                    {m.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="fanart-modal-fields">
          <input
            type="text"
            placeholder="작품 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            className="fanart-input"
          />
          <input
            type="text"
            placeholder="작성자 닉네임"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={20}
            className="fanart-input"
          />
        </div>

        <button
          type="submit"
          className="fanart-submit"
          disabled={!valid || uploading}
        >
          {uploading ? '업로드 중...' : '업로드'}
        </button>
      </form>
    </div>
  );
}
