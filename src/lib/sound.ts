/** A brief, opt-in mechanical click; no audio is loaded or played in the background. */
export function createButtonSound(onError: (message: string) => void) {
  let context: AudioContext | undefined;
  return {
    async play() {
      try {
        context ??= new AudioContext();
        if (context.state === 'suspended') await context.resume();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(630, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(230, context.currentTime + 0.045);
        gain.gain.setValueAtTime(0.045, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.055);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      } catch (error) {
        onError('پخش صدای دکمه ممکن نیست: ' + String(error));
      }
    },
    dispose() {
      if (context && context.state !== 'closed')
        context.close().catch((error) => onError(String(error)));
    },
  };
}
