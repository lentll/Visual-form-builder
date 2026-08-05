import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, ZoomIn, ZoomOut, RotateCcw, RotateCw, ChevronLeft, ChevronRight, Download,
} from 'lucide-react';

export interface LightboxImage {
  url: string;
  name?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex = 0,
  onClose,
}) => {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // 拖拽状态
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const current = images[index];
  const total = images.length;

  // 切换图片时重置缩放/旋转/位移
  const resetTransform = useCallback(() => {
    setScale(1);
    setRotation(0);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const goPrev = useCallback(() => {
    setIndex(i => (i - 1 + total) % total);
    resetTransform();
  }, [total, resetTransform]);

  const goNext = useCallback(() => {
    setIndex(i => (i + 1) % total);
    resetTransform();
  }, [total, resetTransform]);

  const zoomIn = () => setScale(s => Math.min(s + 0.25, 5));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.25));
  const rotateLeft = () => setRotation(r => r - 90);
  const rotateRight = () => setRotation(r => r + 90);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = current.url;
    a.download = current.name || 'image';
    a.click();
  }, [current]);

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goPrev, goNext, onClose]);

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  // 鼠标拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTranslate({ x: dragStart.current.tx + dx, y: dragStart.current.ty + dy });
  };

  const handleMouseUp = () => { dragging.current = false; };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center select-none"
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        title="关闭 (ESC)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* 图片计数 */}
      {total > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-black/50 text-white/80 text-sm">
          {index + 1} / {total}
        </div>
      )}

      {/* 左切换按钮 */}
      {total > 1 && (
        <button
          onClick={e => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all hover:scale-110"
          title="上一张 (←)"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {/* 右切换按钮 */}
      {total > 1 && (
        <button
          onClick={e => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all hover:scale-110"
          title="下一张 (→)"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      {/* 图片容器 */}
      <div
        className="relative flex items-center justify-center w-full h-full overflow-hidden"
        onClick={e => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: dragging.current ? 'grabbing' : 'grab' }}
      >
        <img
          ref={imgRef}
          key={current.url}
          src={current.url}
          alt={current.name || '图片'}
          draggable={false}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: dragging.current ? 'none' : 'transform 0.2s ease',
            maxWidth: '90vw',
            maxHeight: '85vh',
            objectFit: 'contain',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* 底部工具栏 */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-3 py-2 rounded-2xl bg-black/60 backdrop-blur-sm"
        onClick={e => e.stopPropagation()}
      >
        <ToolBtn onClick={zoomOut} title="缩小 (-)" disabled={scale <= 0.25}>
          <ZoomOut className="w-4 h-4" />
        </ToolBtn>

        <button
          onClick={resetTransform}
          className="px-2.5 h-8 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-w-[50px] text-center"
          title="重置 (双击)"
        >
          {Math.round(scale * 100)}%
        </button>

        <ToolBtn onClick={zoomIn} title="放大 (+)" disabled={scale >= 5}>
          <ZoomIn className="w-4 h-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-white/20 mx-1" />

        <ToolBtn onClick={rotateLeft} title="向左旋转">
          <RotateCcw className="w-4 h-4" />
        </ToolBtn>

        <ToolBtn onClick={rotateRight} title="向右旋转">
          <RotateCw className="w-4 h-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-white/20 mx-1" />

        <ToolBtn onClick={handleDownload} title="下载图片">
          <Download className="w-4 h-4" />
        </ToolBtn>
      </div>

      {/* 底部缩略图导航（多图时显示） */}
      {total > 1 && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/50"
          onClick={e => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => { setIndex(i); resetTransform(); }}
              className={`w-10 h-10 rounded-md overflow-hidden transition-all border-2 ${
                i === index ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 工具按钮
const ToolBtn: React.FC<{
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="w-8 h-8 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);
