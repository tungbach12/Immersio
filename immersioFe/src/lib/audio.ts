function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index++)
    view.setUint8(offset + index, value.charCodeAt(index));
}

function bufferToWav(samples: Float32Array, sampleRate: number) {
  const view = new DataView(new ArrayBuffer(44 + samples.length * 2));
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(
      44 + index * 2,
      clamped * (clamped < 0 ? 0x8000 : 0x7fff),
      true,
    );
  });
  return new Blob([view], { type: "audio/wav" });
}

/** Convert browser microphone recordings to the API's 16 kHz, mono PCM format. */
export async function recordingToWav(recording: Blob) {
  const context = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await context.decodeAudioData(await recording.arrayBuffer());
  } finally {
    await context.close();
  }
  const offline = new OfflineAudioContext(
    1,
    Math.max(1, Math.round(decoded.duration * 16000)),
    16000,
  );
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();
  return bufferToWav(rendered.getChannelData(0), rendered.sampleRate);
}
