"use client"

let audioContext: AudioContext | null = null

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return null
  if (!audioContext) {
    audioContext = new AudioContextCtor()
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume()
  }
  return audioContext
}

const playTone = (frequency: number, startAt: number, duration: number, volume: number) => {
  const context = getAudioContext()
  if (!context) return

  const oscillator = context.createOscillator()
  const gainNode = context.createGain()

  oscillator.type = "square"
  oscillator.frequency.setValueAtTime(frequency, startAt)

  gainNode.gain.setValueAtTime(0.0001, startAt)
  gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)

  oscillator.start(startAt)
  oscillator.stop(startAt + duration + 0.02)
}

export const playUiClick = () => {
  const context = getAudioContext()
  if (!context) return
  const startAt = context.currentTime
  playTone(880, startAt, 0.045, 0.02)
  playTone(660, startAt + 0.03, 0.05, 0.015)
}

export const playUiAnswerReady = () => {
  const context = getAudioContext()
  if (!context) return
  const startAt = context.currentTime
  playTone(523.25, startAt, 0.08, 0.018)
  playTone(659.25, startAt + 0.07, 0.08, 0.016)
  playTone(783.99, startAt + 0.14, 0.11, 0.014)
}
