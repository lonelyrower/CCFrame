"use client"

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'

import type { ThemeSoundtrack } from '@/types/themes'
import { cn } from '@/lib/utils'

interface ThemeAudioControllerProps {
  soundtrack: ThemeSoundtrack
}

export function ThemeAudioController({ soundtrack }: ThemeAudioControllerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState({ current: 0, duration: 0 })

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setProgress({ current: audio.currentTime, duration: audio.duration || 0 })
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [])

  const progressRatio = progress.duration > 0 ? progress.current / progress.duration : 0
  const formattedTime = formatTimestamp(progress.current, progress.duration)

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play()
    } else {
      audio.pause()
    }
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !audio.muted
    setIsMuted(audio.muted)
  }

  const handleVolumeChange = (value: number) => {
    const audio = audioRef.current
    if (!audio) return
    const safeValue = Math.min(1, Math.max(0, value))
    audio.volume = safeValue
    audio.muted = safeValue === 0
    setVolume(safeValue)
    setIsMuted(audio.muted)
  }

  const handleSeek = (value: number) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) {
      return
    }
    audio.currentTime = (audio.duration * value) / 100
  }

  return (
    <div className="flex w-full flex-col gap-4 rounded-3xl border border-white/15 bg-black/40 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Soundtrack</p>
          <p className="mt-2 text-base font-semibold text-white">{soundtrack.title}</p>
          {soundtrack.artist ? <p className="text-xs text-white/60">{soundtrack.artist}</p> : null}
        </div>
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-white/60">
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={progressRatio * 100}
          onChange={(event) => handleSeek(Number.parseFloat(event.target.value))}
          aria-label="Soundtrack progress"
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10"
        />
        <span>{formattedTime}</span>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={toggleMute}
          className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {isMuted ? '静音' : '音量'}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(event) => handleVolumeChange(Number.parseFloat(event.target.value))}
          aria-label="Soundtrack volume"
          className={cn('h-1 w-32 cursor-pointer appearance-none rounded-full bg-white/10', isMuted ? 'opacity-40' : 'opacity-100')}
        />
      </div>

      <audio ref={audioRef} src={soundtrack.src} preload="metadata" />
    </div>
  )
}

function formatTimestamp(currentSeconds: number, durationSeconds: number) {
  const safeDuration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 0
  const currentMinutes = Math.floor(currentSeconds / 60)
  const currentRest = Math.floor(currentSeconds % 60)
  const totalMinutes = Math.floor(safeDuration / 60)
  const totalRest = Math.floor(safeDuration % 60)

  return `${currentMinutes}:${currentRest.toString().padStart(2, '0')} / ${totalMinutes}:${totalRest.toString().padStart(2, '0')}`
}
