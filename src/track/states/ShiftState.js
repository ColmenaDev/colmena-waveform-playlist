import { pixelsToSeconds } from "../../utils/conversions";

export default class {
  constructor(track) {
    this.track = track;
    this.active = false;
  }

  setup(samplesPerPixel, sampleRate) {
    this.samplesPerPixel = samplesPerPixel;
    this.sampleRate = sampleRate;
  }

  getXOffsetOnTouchEvent(e) {
    const bcr = e.target.getBoundingClientRect();
    return e.targetTouches[0].clientX - bcr.x;
  }

  emitShift(x) {
    const deltaX = x - this.prevX;
    const deltaTime = pixelsToSeconds(
      deltaX,
      this.samplesPerPixel,
      this.sampleRate
    );
    this.prevX = x;
    this.track.ee.emit("shift", deltaTime, this.track);
  }

  complete(x) {
    this.emitShift(x);
    this.active = false;
  }

  mousedown(e) {
    e.preventDefault();

    this.active = true;
    this.el = e.target;
    this.prevX = e.offsetX;
  }

  touchstart(e) {
    e.preventDefault();

    this.active = true;
    this.el = e.target;
    this.prevX = this.getXOffsetOnTouchEvent(e);
  }

  mousemove(e) {
    if (this.active) {
      e.preventDefault();
      this.emitShift(e.offsetX);
    }
  }

  touchmove(e) {
    if (this.active) {
      e.preventDefault();
      this.emitShift(this.getXOffsetOnTouchEvent(e));
    }
  }

  mouseup(e) {
    if (this.active) {
      e.preventDefault();
      this.complete(e.offsetX);
    }
  }

  mouseleave(e) {
    if (this.active) {
      e.preventDefault();
      this.complete(e.offsetX);
    }
  }

  touchend(e) {
    if (this.active) {
      e.preventDefault();
      this.complete(this.getXOffsetOnTouchEvent(e));
    }
  }

  static getClass() {
    return ".state-shift";
  }

  static getEvents() {
    return [
      "mousedown",
      "mousemove",
      "mouseup",
      "mouseleave",
      "touchstart",
      "touchmove",
      "touchend",
    ];
  }
}
