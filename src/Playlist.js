import _defaults from "lodash.defaultsdeep";
import h from "virtual-dom/h";
import diff from "virtual-dom/diff";
import patch from "virtual-dom/patch";
import InlineWorker from "inline-worker";

import JSZip from 'jszip';


import { pixelsToSeconds } from "./utils/conversions";
import { resampleAudioBuffer } from "./utils/audioData";
import LoaderFactory from "./track/loader/LoaderFactory";
import ScrollHook from "./render/ScrollHook";
import TimeScale from "./TimeScale";
import Track from "./Track";
import Playout from "./Playout";
import AnnotationList from "./annotation/AnnotationList";
import ExportWavWorkerFunction from "./utils/exportWavWorker";
import RecorderWorkerFunction from "./utils/recorderWorker";
import AudioProject from "hertzjs";

import AudioBufferToWav from 'audiobuffer-to-wav'

export default class {
  constructor() {
    this.tracks = [];
    this.soloedTracks = [];
    this.mutedTracks = [];
    this.collapsedTracks = [];
    this.playoutPromises = [];

    this.cursor = 0;
    this.playbackSeconds = 0;
    this.duration = 0;
    this.scrollLeft = 0;
    this.scrollTimer = undefined;
    this.showTimescale = false;
    // whether a user is scrolling the waveform
    this.isScrolling = false;

    this.fadeType = "logarithmic";
    this.masterGain = 1;
    this.annotations = [];
    this.durationFormat = "hh:mm:ss.uuu";
    this.isAutomaticScroll = false;
    this.resetDrawTimer = undefined;

    // Hertjz stuff
    this.hertzjsProject = undefined;
    this.hertjsMapper = new Map();


  }

  setHertzjsProject(hertzjsProject) {
    this.hertzjsProject = hertzjsProject;
  }

  // TODO extract into a plugin
  initExporter() {
    this.exportWorker = new InlineWorker(ExportWavWorkerFunction);
  }

  // TODO extract into a plugin
  initRecorder(stream) {
    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.onstart = () => {
      const start = this.cursor;
      const track = new Track();
      track.setName("Recording");
      track.setEnabledStates();
      track.setEventEmitter(this.ee);
      track.setStartTime(start);

      this.recordingTrack = track;
      this.tracks.push(track);

      this.chunks = [];
      this.working = false;
    };

    this.mediaRecorder.ondataavailable = (e) => {
      this.chunks.push(e.data);

      // throttle peaks calculation
      if (!this.working) {
        const recording = new Blob(this.chunks, {
          type: "audio/ogg; codecs=opus",
        });
        const loader = LoaderFactory.createLoader(recording, this.ac);
        loader
          .load()
          .then((audioBuffer) => {
            // ask web worker for peaks.
            this.recorderWorker.postMessage({
              samples: audioBuffer.getChannelData(0),
              samplesPerPixel: this.samplesPerPixel,
            });
            this.recordingTrack.setCues(0, audioBuffer.duration);
            this.recordingTrack.setBuffer(audioBuffer);
            this.recordingTrack.setPlayout(
              new Playout(this.ac, audioBuffer, this.masterGainNode)
            );
            this.adjustDuration();
          })
          .catch(() => {
            this.working = false;
          });
        this.working = true;
      }
    };

    this.mediaRecorder.onstop = () => {
      this.chunks = [];
      this.working = false;
      this.cursor = this.duration + 0.3;
    };

    this.recorderWorker = new InlineWorker(RecorderWorkerFunction);
    // use a worker for calculating recording peaks.
    this.recorderWorker.onmessage = (e) => {
      this.recordingTrack.setPeaks(e.data);
      this.working = false;
      this.drawRequest();
    };
  }

  setShowTimeScale(show) {
    this.showTimescale = show;
  }

  setMono(mono) {
    this.mono = mono;
  }

  setExclSolo(exclSolo) {
    this.exclSolo = exclSolo;
  }

  setSeekStyle(style) {
    this.seekStyle = style;
  }

  getSeekStyle() {
    return this.seekStyle;
  }

  setSampleRate(sampleRate) {
    this.sampleRate = sampleRate;
  }

  setSamplesPerPixel(samplesPerPixel) {
    this.samplesPerPixel = samplesPerPixel;
  }

  setAudioContext(ac) {
    this.ac = ac;
    this.masterGainNode = ac.createGain();
  }

  getAudioContext() {
    return this.ac;
  }

  setControlOptions(controlOptions) {
    this.controls = controlOptions;
  }

  setWaveHeight(height) {
    this.waveHeight = height;
  }

  setCollapsedWaveHeight(height) {
    this.collapsedWaveHeight = height;
  }

  setColors(colors) {
    this.colors = colors;
  }

  setBarWidth(width) {
    this.barWidth = width;
  }

  setBarGap(width) {
    this.barGap = width;
  }

  setAnnotations(config) {
    const controlWidth = this.controls.show ? this.controls.width : 0;
    this.annotationList = new AnnotationList(
      this,
      config.annotations,
      config.controls,
      config.editable,
      config.linkEndpoints,
      config.isContinuousPlay,
      controlWidth
    );
  }

  setEffects(effectsGraph) {
    this.effectsGraph = effectsGraph;
  }

  setEventEmitter(ee) {
    this.ee = ee;
  }

  getEventEmitter() {
    return this.ee;
  }

  setUpEventEmitter() {
    const ee = this.ee;

    ee.on("automaticscroll", (val) => {
      this.isAutomaticScroll = val;
    });

    ee.on("durationformat", (format) => {
      this.durationFormat = format;
      this.drawRequest();
    });

    ee.on("select", (start, end, track) => {
      if (this.isPlaying()) {
        this.lastSeeked = start;
        this.pausedAt = undefined;
        this.restartPlayFrom(start);
      } else {
        // reset if it was paused.
        this.seek(start, end, track);
        this.ee.emit("timeupdate", start);
        this.drawRequest();
      }
    });

    ee.on("startaudiorendering", (type) => {
      this.startOfflineRender(type);
    });

    ee.on("statechange", (state) => {
      this.setState(state);
      this.drawRequest();
    });

    ee.on("shift", (deltaTime, track) => {
      track.setStartTime(track.getStartTime() + deltaTime);
      this.adjustDuration();
      this.drawRequest();
    });

    ee.on("record", () => {
      this.record();
    });

    ee.on("play", (start, end) => {
      this.play(start, end);
    });

    ee.on("pause", () => {
      this.pause();
    });

    ee.on("stop", () => {
      this.stop();
    });

    ee.on("rewind", () => {
      this.rewind();
    });

    ee.on("fastforward", () => {
      this.fastForward();
    });

    ee.on("clear", () => {
      this.clear().then(() => {
        this.drawRequest();
      });
    });

    ee.on("solo", (track) => {
      this.soloTrack(track);
      this.adjustTrackPlayout();
      this.drawRequest();
    });

    ee.on("mute", (track) => {
      this.muteTrack(track);
      this.adjustTrackPlayout();
      this.drawRequest();
    });

    ee.on("removeTrack", (track) => {
      this.removeTrack(track);
      this.adjustTrackPlayout();
      this.drawRequest();
    });

    ee.on("changeTrackView", (track, opts) => {
      this.collapseTrack(track, opts);
      this.drawRequest();
    });

    ee.on("volumechange", (volume, track) => {
      track.setGainLevel(volume / 100);
      this.drawRequest();
    });

    ee.on("mastervolumechange", (volume) => {
      this.masterGain = volume / 100;
      this.tracks.forEach((track) => {
        track.setMasterGainLevel(this.masterGain);
      });
    });

    ee.on("fadein", (duration, track) => {
      track.setFadeIn(duration, this.fadeType);
      this.drawRequest();
    });

    ee.on("fadeout", (duration, track) => {
      track.setFadeOut(duration, this.fadeType);
      this.drawRequest();
    });

    ee.on("stereopan", (panvalue, track) => {
      track.setStereoPanValue(panvalue);
      this.drawRequest();
    });

    ee.on("fadetype", (type) => {
      this.fadeType = type;
    });

    ee.on("newtrack", (file) => {
      this.load([
        {
          src: file,
          name: file.name,
        },
      ]);
    });

    ee.on("cut", () => {
      const track = this.getActiveTrack();
      const timeSelection = this.getTimeSelection();

      track.removePart(timeSelection.start, timeSelection.end, this.ac, track);
      track.calculatePeaks(this.samplesPerPixel, this.sampleRate);

      this.setTimeSelection(0, 0);
      this.adjustDuration();
      this.drawRequest();
      this.ee.emit("cutfinished");
    });

    ee.on("razorCut", () => {
      const Track = this.getActiveTrack();
      const timeSelection = this.getTimeSelection();
      Track.razorCut(timeSelection.start, this.ac, Track);
    });

    ee.on("trim", () => {
      const track = this.getActiveTrack();
      const timeSelection = this.getTimeSelection();

      track.trim(timeSelection.start, timeSelection.end);
      track.calculatePeaks(this.samplesPerPixel, this.sampleRate);

      this.setTimeSelection(0, 0);
      this.adjustDuration();
      this.drawRequest();
    });

    ee.on("split", () => {
      const track = this.getActiveTrack();
      const timeSelection = this.getTimeSelection();
      const timeSelectionStart = timeSelection.start;
      this.createTrackFromSplit({
        trackToSplit: track,
        name: track.name + "_1",
        splitTime: timeSelectionStart,
      });
      track.trim(track.startTime, timeSelectionStart);
      if (track.fadeOut) {
        track.removeFade(track.fadeOut);
        track.fadeOut = undefined;
      }

      track.calculatePeaks(this.samplesPerPixel, this.sampleRate);

      this.drawRequest();
    });

    ee.on("zoomin", () => {
      const zoomIndex = Math.max(0, this.zoomIndex - 1);
      const zoom = this.zoomLevels[zoomIndex];

      if (zoom !== this.samplesPerPixel) {
        this.setZoom(zoom);
        this.drawRequest();
      }
    });

    ee.on("zoomout", () => {
      const zoomIndex = Math.min(
        this.zoomLevels.length - 1,
        this.zoomIndex + 1
      );
      const zoom = this.zoomLevels[zoomIndex];

      if (zoom !== this.samplesPerPixel) {
        this.setZoom(zoom);
        this.drawRequest();
      }
    });

    ee.on("scroll", () => {
      this.isScrolling = true;
      this.drawRequest();
      clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => {
        this.isScrolling = false;
      }, 200);
    });

    ee.on('hertjz-loaded', (hertjzProject) => {
      this.hertzjsProject = hertjzProject;
      this.copyFromHertzjs(hertjzProject);
    })

    ee.on('audiosourcesrendered', () => {
      // this.commit();
      // console.log(this.tracks)
      console.log(this.hertzjsProject)
    })

    ee.on('commit', () => {
      this.commit();
    })

    ee.on('undo', () => {
      this.undo();
    })

    ee.on('redo', () => {
      this.redo();
    })

    ee.on('importZipProject', (zipFile) => {
      this.importZipProject(zipFile)
    })

    ee.on('exportZipProject', () => {
      return this.exportZipProject();
    })
  }

  load(trackList) {
    const loadPromises = trackList.map((trackInfo) => {
      const loader = LoaderFactory.createLoader(
        trackInfo.src,
        this.ac,
        this.ee
      );
      return loader.load().then((audioBuffer) => {
        if (audioBuffer.sampleRate === this.sampleRate) {
          return audioBuffer;
        } else {
          return resampleAudioBuffer(audioBuffer, this.sampleRate);
        }
      });
    });

    return Promise.all(loadPromises)
      .then((audioBuffers) => {
        this.ee.emit("audiosourcesloaded");

        const tracks = audioBuffers.map((audioBuffer, index) => {
          const info = trackList[index];
          const name = info.name || "Untitled";
          const start = info.start || 0;
          const states = info.states || {};
          const fadeIn = info.fadeIn;
          const fadeOut = info.fadeOut;
          const cueIn = info.cuein || 0;
          const cueOut = info.cueout || audioBuffer.duration;
          const gain = info.gain || 1;
          const muted = info.muted || false;
          const soloed = info.soloed || false;
          const selection = info.selected;
          const peaks = info.peaks || { type: "WebAudio", mono: this.mono };
          const customClass = info.customClass || undefined;
          const waveOutlineColor = info.waveOutlineColor || undefined;
          const stereoPan = info.stereoPan || 0;
          const effects = info.effects || null;

          // webaudio specific playout for now.
          const playout = new Playout(
            this.ac,
            audioBuffer,
            this.masterGainNode
          );

          const track = new Track();
          track.src = info.src;
          track.setBuffer(audioBuffer);
          track.setName(name);
          track.setEventEmitter(this.ee);
          track.setEnabledStates(states);
          track.setCues(cueIn, cueOut);
          track.setCustomClass(customClass);
          track.setWaveOutlineColor(waveOutlineColor);

          if (fadeIn !== undefined) {
            track.setFadeIn(fadeIn.duration, fadeIn.shape);
          }

          if (fadeOut !== undefined) {
            track.setFadeOut(fadeOut.duration, fadeOut.shape);
          }

          if (selection !== undefined) {
            this.setActiveTrack(track);
            this.setTimeSelection(selection.start, selection.end);
          }

          if (peaks !== undefined) {
            track.setPeakData(peaks);
          }

          track.setState(this.getState());
          track.setStartTime(start);
          track.setPlayout(playout);

          track.setGainLevel(gain);
          track.setStereoPanValue(stereoPan);
          if (effects) {
            track.setEffects(effects);
          }

          if (muted) {
            this.muteTrack(track);
          }

          if (soloed) {
            this.soloTrack(track);
          }

          // extract peaks with AudioContext for now.
          track.calculatePeaks(this.samplesPerPixel, this.sampleRate);

          return track;
        });

        this.tracks = this.tracks.concat(tracks);
        this.adjustDuration();
        this.draw(this.render());

        this.ee.emit("audiosourcesrendered");
      })
      .catch((e) => {
        this.ee.emit("audiosourceserror", e);
      });
  }

  createTrackFromSplit({ trackToSplit, name, splitTime }) {
    const enabledStates = trackToSplit.enabledStates;
    const buffer = trackToSplit.buffer;
    const fadeOut = trackToSplit.fadeOut;
    const cueIn = trackToSplit.cueIn;
    const cueOut = trackToSplit.cueOut;
    const gain = trackToSplit.gain || 1;

    let muted = false;
    if (this.mutedTracks.indexOf(trackToSplit) !== -1) {
      muted = true;
    }

    let soloed = false;
    if (this.soloedTracks.indexOf(trackToSplit) !== -1) {
      soloed = true;
    }

    const peaks = trackToSplit.peakData;
    const customClass = trackToSplit.customClass;
    const waveOutlineColor = trackToSplit.waveOutlineColor;
    const stereoPan = trackToSplit.stereoPan || 0;
    const effects = trackToSplit.effectsGraph || null;

    // webaudio specific playout for now.
    const playout = new Playout(this.ac, buffer, this.masterGainNode);

    const track = new Track();
    track.src = trackToSplit.src;
    track.setBuffer(buffer);
    track.setName(name);
    track.setEventEmitter(this.ee);
    track.setEnabledStates(enabledStates);
    track.setCues(cueIn, cueOut);
    track.setCustomClass(customClass);
    track.setWaveOutlineColor(waveOutlineColor);

    if (fadeOut !== undefined) {
      const fade = trackToSplit.fades[fadeOut];
      track.setFadeOut(fade.end - fade.start, fade.shape);
    }

    if (peaks !== undefined) {
      track.setPeakData(peaks);
    }

    track.setState(this.getState());
    track.setPlayout(playout);

    track.setGainLevel(gain);
    track.setStereoPanValue(stereoPan);
    if (effects) {
      track.setEffects(effects);
    }

    if (muted) {
      this.muteTrack(track);
    }

    if (soloed) {
      this.soloTrack(track);
    }

    track.setStartTime(trackToSplit.startTime);
    track.trim(splitTime, track.endTime);

    // extract peaks with AudioContext for now.
    track.calculatePeaks(this.samplesPerPixel, this.sampleRate);

    this.tracks = this.tracks.concat([track]);
    this.adjustDuration();
    this.draw(this.render());
    this.setActiveTrack(track);

    this.ee.emit("audiosourcesrendered");
  }

  /*
    track instance of Track.
  */
  setActiveTrack(track) {
    this.activeTrack = track;
  }

  getActiveTrack() {
    return this.activeTrack;
  }

  isSegmentSelection() {
    return this.timeSelection.start !== this.timeSelection.end;
  }

  /*
    start, end in seconds.
  */
  setTimeSelection(start = 0, end) {
    this.timeSelection = {
      start,
      end: end === undefined ? start : end,
    };

    this.cursor = start;
  }

  async startOfflineRender(type) {
    if (this.isRendering) {
      return;
    }

    this.isRendering = true;
    this.offlineAudioContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      2,
      48000 * this.duration,
      48000
    );
    const setUpChain = [];

    this.ee.emit(
      "audiorenderingstarting",
      this.offlineAudioContext,
      setUpChain
    );

    const currentTime = this.offlineAudioContext.currentTime;
    const mg = this.offlineAudioContext.createGain();

    this.tracks.forEach((track) => {
      const playout = new Playout(this.offlineAudioContext, track.buffer, mg);
      playout.setEffects(track.effectsGraph);
      playout.setMasterEffects(this.effectsGraph);
      track.setOfflinePlayout(playout);

      track.schedulePlay(currentTime, 0, 0, {
        shouldPlay: this.shouldTrackPlay(track),
        masterGain: 1,
        isOffline: true,
      });
    });

    /*
      TODO cleanup of different audio playouts handling.
    */
    await Promise.all(setUpChain);
    const audioBuffer = await this.offlineAudioContext.startRendering();
    if (["buffer", "mp3", "opus", "aac"].includes(type)) {
      this.ee.emit("audiorenderingfinished", type, audioBuffer);
      this.isRendering = false;
    } else if (type === "wav") {
      this.exportWorker.postMessage({
        command: "init",
        config: {
          sampleRate: 48000,
        },
      });

      // callback for `exportWAV`
      this.exportWorker.onmessage = (e) => {
        this.ee.emit("audiorenderingfinished", type, e.data);
        this.isRendering = false;

        // clear out the buffer for next renderings.
        this.exportWorker.postMessage({
          command: "clear",
        });
      };

      // send the channel data from our buffer to the worker
      this.exportWorker.postMessage({
        command: "record",
        buffer: [audioBuffer.getChannelData(0), audioBuffer.getChannelData(1)],
      });

      this.exportWorker.postMessage({
        command: "exportWAV",
        type: "audio/wav",
      });
    }
  }

  getTimeSelection() {
    return this.timeSelection;
  }

  setState(state) {
    this.state = state;

    this.tracks.forEach((track) => {
      track.setState(state);
    });
  }

  getState() {
    return this.state;
  }

  setZoomIndex(index) {
    this.zoomIndex = index;
  }

  setZoomLevels(levels) {
    this.zoomLevels = levels;
  }

  setZoom(zoom) {
    this.samplesPerPixel = zoom;
    this.zoomIndex = this.zoomLevels.indexOf(zoom);
    this.tracks.forEach((track) => {
      track.calculatePeaks(zoom, this.sampleRate);
    });
  }

  muteTrack(track) {
    const index = this.mutedTracks.indexOf(track);

    if (index > -1) {
      this.mutedTracks.splice(index, 1);
    } else {
      this.mutedTracks.push(track);
    }
  }

  soloTrack(track) {
    const index = this.soloedTracks.indexOf(track);

    if (index > -1) {
      this.soloedTracks.splice(index, 1);
    } else if (this.exclSolo) {
      this.soloedTracks = [track];
    } else {
      this.soloedTracks.push(track);
    }
  }

  collapseTrack(track, opts) {
    if (opts.collapsed) {
      this.collapsedTracks.push(track);
    } else {
      const index = this.collapsedTracks.indexOf(track);

      if (index > -1) {
        this.collapsedTracks.splice(index, 1);
      }
    }
  }

  removeTrack(track) {
    if (track.isPlaying()) {
      track.scheduleStop();
    }

    const trackLists = [
      this.mutedTracks,
      this.soloedTracks,
      this.collapsedTracks,
      this.tracks,
    ];
    trackLists.forEach((list) => {
      const index = list.indexOf(track);
      if (index > -1) {
        list.splice(index, 1);
      }
    });
    this.adjustDuration();
  }

  adjustTrackPlayout() {
    this.tracks.forEach((track) => {
      track.setShouldPlay(this.shouldTrackPlay(track));
    });
  }

  adjustDuration() {
    this.duration = this.tracks.reduce(
      (duration, track) => Math.max(duration, track.getEndTime()),
      0
    );
  }

  shouldTrackPlay(track) {
    let shouldPlay;
    // if there are solo tracks, only they should play.
    if (this.soloedTracks.length > 0) {
      shouldPlay = false;
      if (this.soloedTracks.indexOf(track) > -1) {
        shouldPlay = true;
      }
    } else {
      // play all tracks except any muted tracks.
      shouldPlay = true;
      if (this.mutedTracks.indexOf(track) > -1) {
        shouldPlay = false;
      }
    }

    return shouldPlay;
  }

  isPlaying() {
    return this.tracks.reduce(
      (isPlaying, track) => isPlaying || track.isPlaying(),
      false
    );
  }

  /*
   *   returns the current point of time in the playlist in seconds.
   */
  getCurrentTime() {
    const cursorPos = this.lastSeeked || this.pausedAt || this.cursor;

    return cursorPos + this.getElapsedTime();
  }

  getElapsedTime() {
    return this.ac.currentTime - this.lastPlay;
  }

  setMasterGain(gain) {
    this.ee.emit("mastervolumechange", gain);
  }

  restartPlayFrom(start, end) {
    this.stopAnimation();

    this.tracks.forEach((editor) => {
      editor.scheduleStop();
    });

    return Promise.all(this.playoutPromises).then(
      this.play.bind(this, start, end)
    );
  }

  play(startTime, endTime) {
    clearTimeout(this.resetDrawTimer);

    const currentTime = this.ac.currentTime;
    const selected = this.getTimeSelection();
    const playoutPromises = [];

    const start =
      startTime === 0 ? 0 : startTime || this.pausedAt || this.cursor;
    let end = endTime;

    if (!end && selected.end !== selected.start && selected.end > start) {
      end = selected.end;
    }

    if (this.isPlaying()) {
      return this.restartPlayFrom(start, end);
    }

    // TODO refector this in upcoming modernisation.
    if (this.effectsGraph)
      this.tracks && this.tracks[0].playout.setMasterEffects(this.effectsGraph);

    this.tracks.forEach((track) => {
      track.setState("cursor");
      playoutPromises.push(
        track.schedulePlay(currentTime, start, end, {
          shouldPlay: this.shouldTrackPlay(track),
          masterGain: this.masterGain,
        })
      );
    });

    this.lastPlay = currentTime;
    // use these to track when the playlist has fully stopped.
    this.playoutPromises = playoutPromises;
    this.startAnimation(start);

    return Promise.all(this.playoutPromises);
  }

  pause() {
    // console.log("pause\n");

    if (!this.isPlaying() && this.mediaRecorder) {
      if (this.mediaRecorder.state === "recording") {
        // console.log("media recorder pause\n");
        this.mediaRecorder.pause();
        this.pausedAt = this.getCurrentTime();
        return this.playbackReset();
      }

      if (this.mediaRecorder.state === "paused") {
        // console.log("media recorder resume\n");
        this.mediaRecorder.resume();
        return this.playbackReset();
      }
      return Promise.all(this.playoutPromises);
    }

    if (this.isPlaying()) {
      this.pausedAt = this.getCurrentTime();
      return this.playbackReset();
    }
  }

  stop() {
    if (this.mediaRecorder && (this.mediaRecorder.state === "recording" || this.mediaRecorder.state === "paused")) {
      this.mediaRecorder.stop();
    }

    this.pausedAt = undefined;
    this.playbackSeconds = 0;
    return this.playbackReset();
  }

  playbackReset() {
    this.lastSeeked = undefined;
    this.stopAnimation();

    this.tracks.forEach((track) => {
      track.scheduleStop();
      track.setState(this.getState());
    });

    // TODO improve this.
    this.masterGainNode.disconnect();
    this.drawRequest();
    return Promise.all(this.playoutPromises);
  }

  rewind() {
    return this.stop().then(() => {
      this.scrollLeft = 0;
      this.ee.emit("select", 0, 0);
    });
  }

  fastForward() {
    return this.stop().then(() => {
      if (this.viewDuration < this.duration) {
        this.scrollLeft = this.duration - this.viewDuration;
      } else {
        this.scrollLeft = 0;
      }

      this.ee.emit("select", this.duration, this.duration);
    });
  }

  clear() {
    return this.stop().then(() => {
      this.tracks = [];
      this.soloedTracks = [];
      this.mutedTracks = [];
      this.playoutPromises = [];

      this.cursor = 0;
      this.playbackSeconds = 0;
      this.duration = 0;
      this.scrollLeft = 0;

      this.seek(0, 0, undefined);
    });
  }

  record() {
    const playoutPromises = [];
    const start = this.cursor;

    if (!this.isPlaying() && this.mediaRecorder && this.mediaRecorder.state === "paused") {
        // console.log("media recorder resume\n");
        this.mediaRecorder.resume();
    }

    if (!this.isPlaying() && this.mediaRecorder && this.mediaRecorder.state !== "recording" && this.mediaRecorder.state !== "paused") {

      this.mediaRecorder.start(300);

      this.tracks.forEach((track) => {
          track.setState("none");
          playoutPromises.push(
              track.schedulePlay(this.ac.currentTime, start, undefined, {
                  shouldPlay: this.shouldTrackPlay(track),
              })
          );
      });

      this.playoutPromises = playoutPromises;
    }
  }

  startAnimation(startTime) {
    this.lastDraw = this.ac.currentTime;
    this.animationRequest = window.requestAnimationFrame(() => {
      this.updateEditor(startTime);
    });
  }

  stopAnimation() {
    window.cancelAnimationFrame(this.animationRequest);
    this.lastDraw = undefined;
  }

  seek(start, end, track) {
    if (this.isPlaying()) {
      this.lastSeeked = start;
      this.pausedAt = undefined;
      this.restartPlayFrom(start);
    } else {
      // reset if it was paused.
      this.setActiveTrack(track || this.tracks[0]);
      this.pausedAt = start;
      this.setTimeSelection(start, end);
      if (this.getSeekStyle() === "fill") {
        this.playbackSeconds = start;
      }
    }
  }

  /*
   * Animation function for the playlist.
   * Keep under 16.7 milliseconds based on a typical screen refresh rate of 60fps.
   */
  updateEditor(cursor) {
    const currentTime = this.ac.currentTime;
    const selection = this.getTimeSelection();
    const cursorPos = cursor || this.cursor;
    const elapsed = currentTime - this.lastDraw;

    if (this.isPlaying()) {
      const playbackSeconds = cursorPos + elapsed;
      this.ee.emit("timeupdate", playbackSeconds);
      this.animationRequest = window.requestAnimationFrame(() => {
        this.updateEditor(playbackSeconds);
      });

      this.playbackSeconds = playbackSeconds;
      this.draw(this.render());
      this.lastDraw = currentTime;
    } else {
      if (
        cursorPos + elapsed >=
        (this.isSegmentSelection() ? selection.end : this.duration)
      ) {
        this.ee.emit("finished");
      }

      this.stopAnimation();

      this.resetDrawTimer = setTimeout(() => {
        this.pausedAt = undefined;
        this.lastSeeked = undefined;
        this.setState(this.getState());

        this.playbackSeconds = 0;
        this.draw(this.render());
      }, 0);
    }
  }

  drawRequest() {
    window.requestAnimationFrame(() => {
      this.draw(this.render());
    });
  }

  draw(newTree) {
    const patches = diff(this.tree, newTree);
    this.rootNode = patch(this.rootNode, patches);
    this.tree = newTree;

    // use for fast forwarding.
    this.viewDuration = pixelsToSeconds(
      this.rootNode.clientWidth - this.controls.width,
      this.samplesPerPixel,
      this.sampleRate
    );
  }

  getTrackRenderData(data = {}) {
    const defaults = {
      height: this.waveHeight,
      resolution: this.samplesPerPixel,
      sampleRate: this.sampleRate,
      controls: this.controls,
      isActive: false,
      timeSelection: this.getTimeSelection(),
      playlistLength: this.duration,
      playbackSeconds: this.playbackSeconds,
      colors: this.colors,
      barWidth: this.barWidth,
      barGap: this.barGap,
    };

    return _defaults({}, data, defaults);
  }

  isActiveTrack(track) {
    const activeTrack = this.getActiveTrack();

    if (this.isSegmentSelection()) {
      return activeTrack === track;
    }

    return true;
  }

  renderAnnotations() {
    return this.annotationList.render();
  }

  renderTimeScale() {
    const controlWidth = this.controls.show ? this.controls.width : 0;
    const timeScale = new TimeScale(
      this.duration,
      this.scrollLeft,
      this.samplesPerPixel,
      this.sampleRate,
      controlWidth,
      this.colors
    );

    return timeScale.render();
  }

  renderTrackSection() {
    const trackElements = this.tracks.map((track) => {
      const collapsed = this.collapsedTracks.indexOf(track) > -1;
      return track.render(
        this.getTrackRenderData({
          isActive: this.isActiveTrack(track),
          shouldPlay: this.shouldTrackPlay(track),
          soloed: this.soloedTracks.indexOf(track) > -1,
          muted: this.mutedTracks.indexOf(track) > -1,
          collapsed,
          height: collapsed ? this.collapsedWaveHeight : this.waveHeight,
          barGap: this.barGap,
          barWidth: this.barWidth,
        })
      );
    });

    return h(
      "div.playlist-tracks",
      {
        attributes: {
          style: "overflow: auto;",
        },
        onscroll: (e) => {
          this.scrollLeft = pixelsToSeconds(
            e.target.scrollLeft,
            this.samplesPerPixel,
            this.sampleRate
          );

          this.ee.emit("scroll");
        },
        hook: new ScrollHook(this),
      },
      trackElements
    );
  }

  render() {
    const containerChildren = [];

    if (this.showTimescale) {
      containerChildren.push(this.renderTimeScale());
    }

    containerChildren.push(this.renderTrackSection());

    if (this.annotationList.length) {
      containerChildren.push(this.renderAnnotations());
    }

    return h(
      "div.playlist",
      {
        attributes: {
          style: "overflow: hidden; position: relative;",
        },
      },
      containerChildren
    );
  }

  getInfo() {
    const tracks = [];

    this.tracks.forEach((track) => {
      tracks.push(track.getTrackDetails());
    });

    return {
      tracks,
      effects: this.effectsGraph,
    };
  }


  //----------- HERTZJS --------------

  /**
   * This method is called by the event listener.
   * This method syncs the hertzjs project to the current waveform project.
   * Hertjz supports multiple clips per track, however waveform does not, and for that, each hertzjs clip
   * will be stored in a separate waveform track.
   */
  async copyFromHertzjs(hertjzProject) {
    this.tracks = []
    hertjzProject.tracks.forEach((hertzjsTrack) => {
      hertzjsTrack.clips.forEach(async hertjzClip => {
        //Create a new waveform track
        console.log('NIDHAL-LOG:syncWithHertjs-1', hertjzClip.path)
        const track = {
          src: hertjzClip.path,
          name: hertjzClip.path.includes('/') ? hertjzClip.path.match(/\/([^/]+)$/)[1] : hertjzClip.path,
          start: hertjzClip.startsAt,
          cuein: hertjzClip.offset,
          cueout: hertjzClip.duration
        }
        //Add effects
        hertjzClip.effects.forEach(hertzjsEffect => {
          switch (hertzjsEffect.name) {
            case 'fade-in':
              if (hertzjsEffect.params && hertzjsEffect.params.duration > 0) {
                track.fadeIn = {
                  duration: hertzjsEffect.params.duration
                }
              }
              break;

            case 'fade-out':
              if (hertzjsEffect.params && hertzjsEffect.params.duration > 0) {
                track.fadeOut = {
                  duration: hertzjsEffect.params.duration
                }
              }
              break;
          }
        })
        this.load([track]);
        console.log(this.tracks)
      })
    })
  }

  commit() {
    if (!this.hertzjsProject) {
      this.hertzjsProject = new AudioProject();
      console.log('Creating a new Hertzjs Instance')
    }

    window.hjz = this.hertzjsProject;
    //Copy all the waveform settings to hertzjs and commits the change
    //Delete all the tracks in hertzjs in the current version 
    this.hertzjsProject.tracks = [];
    this.tracks.forEach(track => {
      let hertzjsTrack = this.hertzjsProject.newTrack();
      //TODO: if the files are local, we need to copy them locally
      let hertzjsClip = undefined;
      if (track.src instanceof File) {
        let url = URL.createObjectURL(track.src)
        console.log('File is not a string, it is a file, creating a blog and a url and referencing it', url)
        hertzjsClip = hertzjsTrack.newClip(url);

      }
      else if (typeof track.src === 'string' || track.src instanceof String) {
        hertzjsClip = hertzjsTrack.newClip(track.src);
      }
      else if (typeof (track) == 'object' && !!track.buffer) {
        //This is an audio buffer, so we create a temporary file from it
        const audioBuffer = track.buffer;
        const wavBuffer = AudioBufferToWav(audioBuffer);
        const blob = new window.Blob([new DataView(wavBuffer)], {
          type: 'audio/wav'
        })
        var url = window.URL.createObjectURL(blob)

        hertzjsClip = hertzjsTrack.newClip(url);



      }
      hertzjsClip.setStartsAt(track.startTime)
      hertzjsClip.setDuration(track.cueOut)
      hertzjsClip.setOffset(track.cueIn)
      //TODO:Add effects here
    })
    this.hertzjsProject.commit()
  }

  undo() {
    if (!this.hertzjsProject)
      return false;

    let currentIndex = this.hertzjsProject.history.currentIndex;
    if (currentIndex <= 1)
      return false;
    this.hertzjsProject.undo();
    this.copyFromHertzjs(this.hertzjsProject)
  }

  redo() {
    let isInLastVersion = this.hertzjsProject.isInLastVersion();
    if (isInLastVersion)
      return false;
    console.log('currently in the', this.hertzjsProject.history.currentIndex, 'version', isInLastVersion ? ' LAST VERSION' : '')
    this.hertzjsProject.redo();
    this.copyFromHertzjs(this.hertzjsProject)
  }

  getHertjzProjectInstance() {
    return this.hertzjsProject;
  }


  /**
   * This method will export the project as a zip file
   */
  exportZipProject() {
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify(this.hertzjsProject));
    zip.file('README.txt', 'Nothing here!');

    const fetchPromises = [];

    //Now we'll be saving all the media files for the current version
    this.hertzjsProject.tracks.forEach(track => {
      track.clips.forEach(clip => {
        console.log('Processing clip', clip)
        if (clip.path.indexOf("blob:") >= 0) {

          console.log('adding the file', clip.path)

          const fetchPromise = fetch(clip.path).then(resp => resp.blob()).then(data => {
            console.log('adding file to zip', data)

            let fileName = clip.path.split('/').pop()
            zip.file('blob.' + fileName, data)

          });
          fetchPromises.push(fetchPromise)
        }
      })
    })

    return Promise.all(fetchPromises).then(() => {
      // Generate the ZIP file after all operations are finished
      return zip.generateAsync({ type: 'blob' });
    });
  }

  /**
   * This method accepts a ZIP project
   * The project must containa a file called project.json and the medias referenced in it
   * @param {} zipFile 
   */
  importZipProject(zipFile) {
    const playlist = this;

    if (!playlist.hertzjsProject)
      this.commit();


    // Load the ZIP file using JSZip
    JSZip.loadAsync(zipFile /* Blob containing the ZIP file */).then(zip => {




      //First we read the project.json file
      zip.file("project.json").async("blob").then(projectFileBlob => {
        const reader = new FileReader();

        reader.onload = function (event) {

          //We readt the projet object from the file and copy it in the memory
          let projectJson = event.target.result
          let projectObject = JSON.parse(projectJson)

          playlist.hertzjsProject.history.setHistoryStack(projectObject.history.stack)
          playlist.hertzjsProject.history.setCooldownState(projectObject.history.cooldownState)
          playlist.hertzjsProject.history.setCurrentIndex(projectObject.history.currentIndex)
          playlist.hertzjsProject.history.setCooldown(projectObject.history.cooldown)
          playlist.hertzjsProject.tracks = projectObject.tracks


          // Loop through each file in the ZIP archive
          const fileLoadingPromises = [];
          zip.forEach(function (relativePath, zipEntry) {
            // Check if it's a file (not a directory)
            if (!zipEntry.dir) {
              if (zipEntry.name == 'project.json')
                return

              // Extract the file content as a Blob
              const fileLoadingPromise = zipEntry.async("blob").then(function (fileBlob) {
                // Use fileBlob here (for example, create an object URL to display images, or read text content)
                // console.log("File Name: " + zipEntry.name);

                //If the file is a temporary blob file, we simply generate a url for it and update the project
                //to reference the new temporary url
                if (zipEntry.name.substring(0, 5) == 'blob.') {
                  let newUrl = URL.createObjectURL(fileBlob)

                  playlist.hertzjsProject.tracks.forEach(track => {
                    track.clips.forEach(clip => {
                      // console.log('checking clip', clip.path)

                      let clipFileName = clip.path.split('/').pop()

                      if (clipFileName == zipEntry.name.substring(5)) {
                        clip.path = newUrl
                        // console.log('updating clip', clip.path, 'to', newUrl)
                      }

                    })
                  })
                  //TODO: find all the references in the in all the history versions as well and update them
                }

              });
              fileLoadingPromises.push(fileLoadingPromise);
            }
          });

          Promise.all(fileLoadingPromises).then(() => {

            // console.log('copying from hertzjs')
            playlist.copyFromHertzjs(playlist.hertzjsProject);

          })



        };
        reader.readAsText(projectFileBlob);
      })

        .catch(function (error) {
          console.error("Could not import the project, make sure it contains a history.json file:");
        });


    });

  }
}


