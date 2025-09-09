'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export function CleanupEditor({
  imageUrl,
  onCancel,
  onSubmit,
}: {
  imageUrl: string
  onCancel: () => void
  onSubmit: (maskDataUrl: string) => void
}) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [brushSize, setBrushSize] = useState(30)
  const [drawing, setDrawing] = useState(false)
  const [hasStroke, setHasStroke] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = canvasRef.current!
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      // Fill black background (no cleanup)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // Save image element for display sizing via CSS
      if (imgRef.current) {
        imgRef.current.src = imageUrl
      }
    }
    img.src = imageUrl
  }, [imageUrl])

  const getRelativePos = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const wrapper = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - wrapper.left
    const y = e.clientY - wrapper.top
    // Map to canvas coordinates
    const img = imgRef.current!
    const canvas = canvasRef.current!
    const scaleX = canvas.width / img.clientWidth
    const scaleY = canvas.height / img.clientHeight
    // Account for image letterboxing if aspect ratios differ
    const offsetX = (wrapper.width - img.clientWidth) / 2
    const offsetY = (wrapper.height - img.clientHeight) / 2
    const adjX = Math.max(0, Math.min(img.clientWidth, x - offsetX))
    const adjY = Math.max(0, Math.min(img.clientHeight, y - offsetY))
    return { cx: adjX * scaleX, cy: adjY * scaleY }
  }

  const handleDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setDrawing(true)
    draw(e)
  }
  const handleUp = () => setDrawing(false)
  const handleMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (drawing) draw(e)
  }

  const draw = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { cx, cy } = getRelativePos(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(cx, cy, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
    setHasStroke(true)
  }

  const clearMask = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-300">画笔大小</span>
          <input type="range" min={8} max={100} value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={clearMask}>清除掩膜</Button>
          <Button variant="ghost" onClick={onCancel}>取消</Button>
          <Button onClick={() => onSubmit(canvasRef.current!.toDataURL('image/png'))} disabled={!hasStroke}>开始清理</Button>
        </div>
      </div>

      <div
        className="relative w-full max-h-[70vh] border rounded-lg overflow-hidden bg-black/50"
        onMouseDown={handleDown}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onMouseMove={handleMove}
        style={{ cursor: 'crosshair' }}
      >
        <img ref={imgRef} src="" alt="to-edit" className="w-full h-auto block select-none pointer-events-none" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      </div>
    </div>
  )
}

