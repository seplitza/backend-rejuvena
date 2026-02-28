import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Stage, Layer, Line, Text as KonvaText, Image as KonvaImage } from 'react-konva';

interface ImageEditorModalProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onClose: () => void;
}

interface Annotation {
  type: 'arrow' | 'text' | 'emoji';
  points?: number[];
  text?: string;
  x?: number;
  y?: number;
  color?: string;
}

export default function ImageEditorModal({ imageUrl, onSave, onClose }: ImageEditorModalProps) {
  const [mode, setMode] = useState<'crop' | 'annotate'>('crop');
  
  // Crop mode state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  // Annotate mode state
  const [tool, setTool] = useState<'arrow' | 'text' | 'emoji'>('arrow');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  const [color, setColor] = useState('#FF0000');
  const [selectedEmoji, setSelectedEmoji] = useState('😀');
  
  const stageRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Load image for canvas
  useState(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => setImage(img);
  });

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImage = async () => {
    if (!croppedAreaPixels) return imageUrl;

    const image = await createImage(imageUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx?.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return canvas.toDataURL('image/jpeg');
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const handleMouseDown = (e: any) => {
    if (mode !== 'annotate' || tool === 'text' || tool === 'emoji') return;
    
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setCurrentLine([pos.x, pos.y]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || tool !== 'arrow') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setCurrentLine([...currentLine, point.x, point.y]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || tool !== 'arrow') return;
    
    setIsDrawing(false);
    if (currentLine.length >= 4) {
      setAnnotations([...annotations, { type: 'arrow', points: currentLine, color }]);
    }
    setCurrentLine([]);
  };

  const handleStageClick = (e: any) => {
    if (mode !== 'annotate' || tool === 'arrow') return;

    const pos = e.target.getStage().getPointerPosition();
    
    if (tool === 'text') {
      const text = prompt('Введите текст:');
      if (text) {
        setAnnotations([...annotations, { type: 'text', text, x: pos.x, y: pos.y, color }]);
      }
    } else if (tool === 'emoji') {
      setAnnotations([...annotations, { type: 'emoji', text: selectedEmoji, x: pos.x, y: pos.y }]);
    }
  };

  const handleSave = async () => {
    let finalImageUrl = imageUrl;

    // Step 1: Apply crop if in crop mode or if user cropped
    if (mode === 'crop' || croppedAreaPixels) {
      finalImageUrl = await getCroppedImage();
    }

    // Step 2: Apply annotations if any
    if (annotations.length > 0 && stageRef.current) {
      const dataUrl = stageRef.current.toDataURL();
      finalImageUrl = dataUrl;
    }

    onSave(finalImageUrl);
  };

  const commonEmojis = ['😀', '😍', '🎉', '✨', '🔥', '👍', '❤️', '⭐', '🎯', '💯', '🏆', '✅'];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Редактор изображений</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6B7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Mode Tabs */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setMode('crop')}
            style={{
              padding: '8px 16px',
              background: mode === 'crop' ? '#4F46E5' : '#F3F4F6',
              color: mode === 'crop' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ✂️ Обрезка
          </button>
          <button
            onClick={() => setMode('annotate')}
            style={{
              padding: '8px 16px',
              background: mode === 'annotate' ? '#4F46E5' : '#F3F4F6',
              color: mode === 'annotate' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ✏️ Аннотации
          </button>
        </div>

        {/* Tools for Annotate Mode */}
        {mode === 'annotate' && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setTool('arrow')}
              style={{
                padding: '8px 12px',
                background: tool === 'arrow' ? '#10B981' : 'white',
                color: tool === 'arrow' ? 'white' : '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ↗️ Стрелка
            </button>
            <button
              onClick={() => setTool('text')}
              style={{
                padding: '8px 12px',
                background: tool === 'text' ? '#10B981' : 'white',
                color: tool === 'text' ? 'white' : '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              T Текст
            </button>
            <button
              onClick={() => setTool('emoji')}
              style={{
                padding: '8px 12px',
                background: tool === 'emoji' ? '#10B981' : 'white',
                color: tool === 'emoji' ? 'white' : '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              😀 Emoji
            </button>

            {/* Color Picker */}
            {(tool === 'arrow' || tool === 'text') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                <label style={{ fontSize: '14px', color: '#6B7280' }}>Цвет:</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: '40px', height: '32px', cursor: 'pointer', border: 'none', borderRadius: '4px' }}
                />
              </div>
            )}

            {/* Emoji Selector */}
            {tool === 'emoji' && (
              <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    style={{
                      padding: '4px 8px',
                      background: selectedEmoji === emoji ? '#EEF2FF' : 'white',
                      border: selectedEmoji === emoji ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '20px'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setAnnotations([])}
              style={{
                padding: '8px 12px',
                background: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              🗑️ Очистить всё
            </button>
          </div>
        )}

        {/* Editor Area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#F9FAFB' }}>
          {mode === 'crop' ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.7)',
                padding: '12px 20px',
                borderRadius: '8px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '14px' }}>Zoom:</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ width: '200px' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stage
                ref={stageRef}
                width={800}
                height={600}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={handleStageClick}
              >
                <Layer>
                  {image && <KonvaImage image={image} width={800} height={600} />}
                  
                  {/* Render annotations */}
                  {annotations.map((ann, i) => {
                    if (ann.type === 'arrow' && ann.points) {
                      return (
                        <Line
                          key={i}
                          points={ann.points}
                          stroke={ann.color}
                          strokeWidth={3}
                          tension={0.5}
                          lineCap="round"
                          lineJoin="round"
                        />
                      );
                    } else if (ann.type === 'text' && ann.text) {
                      return (
                        <KonvaText
                          key={i}
                          x={ann.x}
                          y={ann.y}
                          text={ann.text}
                          fontSize={24}
                          fill={ann.color}
                          fontStyle="bold"
                        />
                      );
                    } else if (ann.type === 'emoji' && ann.text) {
                      return (
                        <KonvaText
                          key={i}
                          x={ann.x}
                          y={ann.y}
                          text={ann.text}
                          fontSize={48}
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Current drawing line */}
                  {isDrawing && currentLine.length >= 2 && (
                    <Line
                      points={currentLine}
                      stroke={color}
                      strokeWidth={3}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                    />
                  )}
                </Layer>
              </Stage>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ✅ Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
