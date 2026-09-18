type AudioContextWithWebkit = typeof window & {
  webkitAudioContext?: typeof AudioContext
}

type ScheduledSource = AudioBufferSourceNode | OscillatorNode

const BPM = 54
const BEAT = 60 / BPM
const LOOP_BEATS = 16
const LOOP_SECONDS = LOOP_BEATS * BEAT

const midiToHz = (note: number) => 440 * Math.pow(2, (note - 69) / 12)

const createImpulseResponse = (context: AudioContext, seconds = 2.5, decay = 3.2) => {
  const length = Math.floor(context.sampleRate * seconds)
  const impulse = context.createBuffer(2, length, context.sampleRate)

  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel)
    for (let i = 0; i < length; i += 1) {
      const envelope = Math.pow(1 - i / length, decay)
      data[i] = (Math.random() * 2 - 1) * envelope
    }
  }

  return impulse
}

export const createOperationRoomMusic = () => {
  const AudioContextClass = window.AudioContext ?? (window as AudioContextWithWebkit).webkitAudioContext
  if (!AudioContextClass) {
    return {
      toggle: async () => false,
      stop: () => undefined,
      dispose: () => undefined,
      isPlaying: () => false,
    }
  }

  let context: AudioContext | null = null
  let master: GainNode | null = null
  let reverbInput: GainNode | null = null
  let dryInput: GainNode | null = null
  let timer: number | null = null
  let playing = false
  let nextLoopStart = 0
  const activeSources = new Set<ScheduledSource>()

  const track = <T extends ScheduledSource>(source: T) => {
    activeSources.add(source)
    source.addEventListener('ended', () => activeSources.delete(source), { once: true })
    return source
  }

  const ensureGraph = async () => {
    if (!context) {
      context = new AudioContextClass()

      const compressor = context.createDynamicsCompressor()
      compressor.threshold.value = -22
      compressor.knee.value = 18
      compressor.ratio.value = 3
      compressor.attack.value = 0.02
      compressor.release.value = 0.35

      master = context.createGain()
      master.gain.value = 0
      master.connect(compressor)
      compressor.connect(context.destination)

      dryInput = context.createGain()
      dryInput.gain.value = 0.82
      dryInput.connect(master)

      const convolver = context.createConvolver()
      convolver.buffer = createImpulseResponse(context)
      const wet = context.createGain()
      wet.gain.value = 0.34
      reverbInput = context.createGain()
      reverbInput.gain.value = 1
      reverbInput.connect(convolver)
      convolver.connect(wet)
      wet.connect(master)
    }

    if (context.state === 'suspended') await context.resume()
  }

  const routeVoice = (node: AudioNode, dry = 0.85, wet = 0.28) => {
    if (!context || !dryInput || !reverbInput) return
    const dryGain = context.createGain()
    const wetGain = context.createGain()
    dryGain.gain.value = dry
    wetGain.gain.value = wet
    node.connect(dryGain)
    node.connect(wetGain)
    dryGain.connect(dryInput)
    wetGain.connect(reverbInput)
  }

  const scheduleStringVoice = (note: number, start: number, duration: number, gain = 0.045) => {
    if (!context) return
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1650, start)
    filter.Q.value = 0.55

    const envelope = context.createGain()
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.38)
    envelope.gain.setValueAtTime(gain, start + Math.max(0.42, duration - 0.55))
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    const fundamental = track(context.createOscillator())
    fundamental.type = 'sawtooth'
    fundamental.frequency.setValueAtTime(midiToHz(note), start)
    fundamental.detune.value = -5

    const companion = track(context.createOscillator())
    companion.type = 'triangle'
    companion.frequency.setValueAtTime(midiToHz(note), start)
    companion.detune.value = 6

    const companionGain = context.createGain()
    companionGain.gain.value = 0.72

    fundamental.connect(filter)
    companion.connect(companionGain)
    companionGain.connect(filter)
    filter.connect(envelope)
    routeVoice(envelope, 0.62, 0.48)

    fundamental.start(start)
    companion.start(start)
    fundamental.stop(start + duration + 0.03)
    companion.stop(start + duration + 0.03)
  }

  const scheduleStrings = (notes: number[], start: number, duration: number) => {
    notes.forEach((note, index) => scheduleStringVoice(note, start + index * 0.012, duration, index === 0 ? 0.038 : 0.030))
  }

  const scheduleHorn = (note: number, start: number, duration: number, gain = 0.08) => {
    if (!context) return
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1250, start)
    filter.Q.value = 1.15

    const envelope = context.createGain()
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.085)
    envelope.gain.exponentialRampToValueAtTime(gain * 0.72, start + Math.max(0.18, duration * 0.62))
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    const osc = track(context.createOscillator())
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(midiToHz(note), start)

    const soft = track(context.createOscillator())
    soft.type = 'triangle'
    soft.frequency.setValueAtTime(midiToHz(note - 12), start)
    const softGain = context.createGain()
    softGain.gain.value = 0.24

    osc.connect(filter)
    soft.connect(softGain)
    softGain.connect(filter)
    filter.connect(envelope)
    routeVoice(envelope, 0.82, 0.30)

    osc.start(start)
    soft.start(start)
    osc.stop(start + duration + 0.02)
    soft.stop(start + duration + 0.02)
  }

  const scheduleTimpani = (note: number, start: number, gain = 0.10) => {
    if (!context) return
    const envelope = context.createGain()
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012)
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 1.15)

    const osc = track(context.createOscillator())
    osc.type = 'sine'
    osc.frequency.setValueAtTime(midiToHz(note) * 1.16, start)
    osc.frequency.exponentialRampToValueAtTime(midiToHz(note), start + 0.15)
    osc.connect(envelope)
    routeVoice(envelope, 0.9, 0.22)
    osc.start(start)
    osc.stop(start + 1.2)
  }

  const scheduleSnareBrush = (start: number, gain = 0.018) => {
    if (!context) return
    const bufferLength = Math.floor(context.sampleRate * 0.22)
    const buffer = context.createBuffer(1, bufferLength, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.7)

    const source = track(context.createBufferSource())
    source.buffer = buffer
    const filter = context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1900
    filter.Q.value = 0.7
    const envelope = context.createGain()
    envelope.gain.setValueAtTime(gain, start)
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.22)

    source.connect(filter)
    filter.connect(envelope)
    routeVoice(envelope, 0.82, 0.18)
    source.start(start)
  }

  const schedulePhrase = (start: number) => {
    // Slow heroic orchestral sketch: broadly similar in colour and pacing to a
    // 1940s-war-film menu cue, but deliberately not a note-for-note transcription.
    const chordDuration = 4 * BEAT + 0.34
    const chords = [
      [46, 53, 58, 62], // Bb major
      [51, 58, 63, 67], // Eb major
      [48, 55, 60, 63], // C minor
      [53, 60, 65, 69], // F major
    ]

    chords.forEach((chord, index) => {
      const chordStart = start + index * 4 * BEAT
      scheduleStrings(chord, chordStart, chordDuration)
      scheduleTimpani(index === 2 ? 36 : 34, chordStart, index === 0 ? 0.115 : 0.075)
      scheduleSnareBrush(chordStart + 2.92 * BEAT)
    })

    const melody: Array<[number, number, number, number?]> = [
      [62, 0.0, 1.7, 0.073],
      [65, 1.9, 0.8],
      [67, 2.85, 1.0],
      [70, 4.1, 1.8, 0.082],
      [69, 6.05, 0.9],
      [67, 7.0, 0.9],
      [65, 8.1, 1.3],
      [63, 9.55, 0.7],
      [62, 10.4, 1.4],
      [60, 12.05, 0.85],
      [62, 13.0, 0.85],
      [65, 13.95, 1.75, 0.086],
    ]

    melody.forEach(([note, beatOffset, beatDuration, gain]) => {
      scheduleHorn(note, start + beatOffset * BEAT, beatDuration * BEAT, gain)
    })

    // A restrained low-brass answer gives the loop a period-newsreel weight.
    scheduleHorn(46, start + 3.05 * BEAT, 0.72 * BEAT, 0.038)
    scheduleHorn(51, start + 7.05 * BEAT, 0.72 * BEAT, 0.038)
    scheduleHorn(48, start + 11.05 * BEAT, 0.72 * BEAT, 0.038)
    scheduleHorn(53, start + 15.05 * BEAT, 0.72 * BEAT, 0.042)
  }

  const scheduleNextLoop = (start: number) => {
    if (!context || !playing) return
    nextLoopStart = start + LOOP_SECONDS
    const delay = Math.max(50, (nextLoopStart - context.currentTime - 0.55) * 1000)
    timer = window.setTimeout(() => {
      if (!context || !playing) return
      schedulePhrase(nextLoopStart)
      scheduleNextLoop(nextLoopStart)
    }, delay)
  }

  const play = async () => {
    await ensureGraph()
    if (!context || !master || playing) return playing

    playing = true
    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now)
    master.gain.exponentialRampToValueAtTime(0.19, now + 0.55)

    const start = now + 0.06
    schedulePhrase(start)
    scheduleNextLoop(start)
    return true
  }

  const stop = () => {
    if (!context || !master) {
      playing = false
      return
    }

    playing = false
    if (timer !== null) {
      window.clearTimeout(timer)
      timer = null
    }

    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)

    window.setTimeout(() => {
      activeSources.forEach((source) => {
        try { source.stop() } catch { /* already stopped */ }
      })
      activeSources.clear()
    }, 260)
  }

  const toggle = async () => {
    if (playing) {
      stop()
      return false
    }
    return play()
  }

  const dispose = () => {
    stop()
    if (context && context.state !== 'closed') void context.close()
    context = null
    master = null
    dryInput = null
    reverbInput = null
  }

  return {
    toggle,
    stop,
    dispose,
    isPlaying: () => playing,
  }
}
