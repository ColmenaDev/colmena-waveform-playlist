export default function () {
  let recLength = 0;
  let recBuffersL = [];
  let recBuffersR = [];
  let sampleRate;

  function init(config) {
    sampleRate = config.sampleRate;
    lamejs();
  }

  function record(inputBuffer) {
    recBuffersL.push(inputBuffer[0]);
    recBuffersR.push(inputBuffer[1]);
    recLength += inputBuffer[0].length;
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  function floatTo16BitPCM(output, offset, input) {
    let writeOffset = offset;
    for (let i = 0; i < input.length; i += 1, writeOffset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(writeOffset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  }

  function encodeWAV(samples, mono = false) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, "RIFF");
    /* file length */
    view.setUint32(4, 32 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, "WAVE");
    /* format chunk identifier */
    writeString(view, 12, "fmt ");
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, mono ? 1 : 2, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 4, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, "data");
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);

    return view;
  }

  function mergeBuffers(recBuffers, length) {
    const result = new Float32Array(length);
    let offset = 0;

    for (let i = 0; i < recBuffers.length; i += 1) {
      result.set(recBuffers[i], offset);
      offset += recBuffers[i].length;
    }
    return result;
  }

  function interleave(inputL, inputR) {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);

    let index = 0;
    let inputIndex = 0;

    while (index < length) {
      result[(index += 1)] = inputL[inputIndex];
      result[(index += 1)] = inputR[inputIndex];
      inputIndex += 1;
    }

    return result;
  }

  function exportWAV(type) {
    const bufferL = mergeBuffers(recBuffersL, recLength);
    const bufferR = mergeBuffers(recBuffersR, recLength);
    const interleaved = interleave(bufferL, bufferR);
    const dataview = encodeWAV(interleaved);
    const audioBlob = new Blob([dataview], { type });

    postMessage(audioBlob);
  }

  // function exportMP3(type) {
  //   var buffer = [];
  //   const bufferL = mergeBuffers(recBuffersL, recLength);
  //   const bufferR = mergeBuffers(recBuffersR, recLength);

  //   // TODO: support mono output... but not even wave does supports it...
  //   const bufferL3 = new ArrayBuffer(recLength * 2);
  //   const bufferR3 = new ArrayBuffer(recLength * 2);

  //   const samplesL = new DataView(bufferL3);
  //   const samplesR = new DataView(bufferR3);

  //   floatTo16BitPCM(samplesL, 0, bufferL);
  //   floatTo16BitPCM(samplesR, 0, bufferR);

  //   const Mp3L = new Int16Array(bufferL3, 0, recLength);
  //   const Mp3R = new Int16Array(bufferR3, 0, recLength);

  //   const channels = 2;
  //   var mp3enc = new lamejs.Mp3Encoder(channels, sampleRate, 112);
  //   var remaining = recLength;

  //   const samplesPerFrame = 1152;

  //   for (let i = 0; remaining >= samplesPerFrame; i += samplesPerFrame) {
  //     var left = Mp3L.subarray(i, i + samplesPerFrame);
  //     var right = Mp3R.subarray(i, i + samplesPerFrame);
  //     var mp3buf = mp3enc.encodeBuffer(left, right);
  //     if (mp3buf.length > 0) {
  //       // console.log("remaining time:", Math.round(remaining / sampleRate),"s");
  //       buffer.push(new Int8Array(mp3buf));
  //     }
  //     remaining -= samplesPerFrame;
  //   }
  //   var mp3buf = mp3enc.flush();
  //   if (mp3buf.length > 0) {
  //     buffer.push(new Int8Array(mp3buf));
  //   }

  //   // console.log("MP3 encoding done.");

  //   const audioBlob = new Blob(buffer, { type });
  //   postMessage(audioBlob);
  // }

  function clear() {
    recLength = 0;
    recBuffersL = [];
    recBuffersR = [];
  }

  /* exportOpus not supported yet... 44.1kHz not supported by Opus */
  onmessage = function onmessage(e) {
    if (e.data.command) {
      switch (e.data.command) {
        case "init": {
          init(e.data.config);
          break;
        }
        case "record": {
          record(e.data.buffer);
          break;
        }
        case "exportWAV": {
          exportWAV(e.data.type);
          break;
        }
        // case "exportMP3": {
        //   exportMP3(e.data.type);
        //   break;
        // }
        case "clear": {
          clear();
          break;
        }
        default: {
          throw new Error("Unknown export worker command");
        }
      }
    }
  };
}
