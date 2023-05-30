var userMediaStream;
var playlist;
var constraints = { audio: true };

navigator.getUserMedia = (navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia);

function gotStream(stream) {
  userMediaStream = stream;
  playlist.initRecorder(userMediaStream, track = undefined, name = "Recording");
  $(".btn-record").removeClass("disabled");
}

function logError(err) {
  console.error(err);
}

playlist = WaveformPlaylist.init({
  samplesPerPixel: 3000,
  waveHeight: 100,
  container: document.getElementById("playlist"),
  state: 'cursor',
  colors: {
    waveOutlineColor: '#005BBB',
    timeColor: 'grey',
    fadeColor: 'black'
  },
  timescale: true,
  controls: {
    show: true, //whether or not to include the track controls
    width: 200 //width of controls in pixels
  },
  seekStyle : 'line',
  zoomLevels: [500, 1000, 3000, 5000]
});

  //can do stuff with the playlist.

  //initialize the WAV exporter.
  playlist.initExporter();

  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia(constraints)
    .then(gotStream)
    .catch(logError);
  } else if (navigator.getUserMedia && 'MediaRecorder' in window) {
    navigator.getUserMedia(
      constraints,
      gotStream,
      logError
    );
  }
