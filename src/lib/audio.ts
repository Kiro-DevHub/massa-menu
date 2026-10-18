/**
 * Звук таймера через Web Audio. iOS разрешает звук только после жеста пользователя,
 * поэтому контекст создаётся и «будится» первым тапом.
 */
let ctx: AudioContext | null = null

function context() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

export function unlockAudio() {
  try {
    const c = context()
    if (!c) return
    if (c.state === 'suspended') void c.resume()
    // Тихий короткий буфер окончательно разблокирует вывод на iOS.
    const src = c.createBufferSource()
    src.buffer = c.createBuffer(1, 1, 22050)
    src.connect(c.destination)
    src.start(0)
  } catch {
    /* без звука */
  }
}

/** Разблокировать звук первым касанием в любом месте. */
export function installAudioUnlock() {
  const once = () => {
    unlockAudio()
    window.removeEventListener('pointerdown', once)
    window.removeEventListener('keydown', once)
  }
  window.addEventListener('pointerdown', once)
  window.addEventListener('keydown', once)
}

/** Три коротких сигнала и вибрация, где она есть. */
export function ring() {
  try {
    const c = context()
    if (c) {
      if (c.state === 'suspended') void c.resume()
      const t0 = c.currentTime
      for (let i = 0; i < 3; i++) {
        const o = c.createOscillator()
        const g = c.createGain()
        o.type = 'sine'
        o.frequency.value = i === 2 ? 1175 : 880
        const t = t0 + i * 0.32
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.35, t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26)
        o.connect(g).connect(c.destination)
        o.start(t)
        o.stop(t + 0.3)
      }
    }
  } catch {
    /* без звука */
  }
  try {
    navigator.vibrate?.([200, 100, 200])
  } catch {
    /* нет вибрации */
  }
}
