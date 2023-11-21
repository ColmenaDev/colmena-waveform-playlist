import _defaults from "lodash.defaultsdeep";
import createElement from "virtual-dom/create-element";
import EventEmitter from "event-emitter";
import Playlist from "./Playlist";
import AudioProject from "hertzjs";

export function init(options = {}, ee = EventEmitter()) {
  if (options.container === undefined) {
    throw new Error("DOM element container must be given.");
  }

  const defaults = {
    samplesPerPixel: 4096,
    mono: true,
    fadeType: "logarithmic",
    exclSolo: false,
    timescale: false,
    controls: {
      show: false,
      width: 150,
      widgets: {
        muteOrSolo: true,
        volume: true,
        stereoPan: true,
        collapse: true,
        remove: true,
      },
    },
    colors: {
      waveOutlineColor: "white",
      timeColor: "grey",
      fadeColor: "black",
    },
    seekStyle: "line",
    waveHeight: 128,
    collapsedWaveHeight: 30,
    barWidth: 1,
    barGap: 0,
    state: "cursor",
    zoomLevels: [512, 1024, 2048, 4096],
    annotationList: {
      annotations: [],
      controls: [],
      editable: false,
      linkEndpoints: false,
      isContinuousPlay: false,
    },
    isAutomaticScroll: false,
  };

  const config = _defaults({}, options, defaults);
  const zoomIndex = config.zoomLevels.indexOf(config.samplesPerPixel);

  if (zoomIndex === -1) {
    throw new Error(
      "initial samplesPerPixel must be included in array zoomLevels"
    );
  }

  const playlist = new Playlist();
  const ctx = config.ac || new AudioContext();
  playlist.setAudioContext(ctx);
  playlist.setSampleRate(config.sampleRate || ctx.sampleRate);
  playlist.setSamplesPerPixel(config.samplesPerPixel);
  playlist.setEventEmitter(ee);
  playlist.setUpEventEmitter();
  playlist.setTimeSelection(0, 0);
  playlist.setState(config.state);
  playlist.setControlOptions(config.controls);
  playlist.setWaveHeight(config.waveHeight);
  playlist.setCollapsedWaveHeight(config.collapsedWaveHeight);
  playlist.setColors(config.colors);
  playlist.setZoomLevels(config.zoomLevels);
  playlist.setZoomIndex(zoomIndex);
  playlist.setMono(config.mono);
  playlist.setExclSolo(config.exclSolo);
  playlist.setShowTimeScale(config.timescale);
  playlist.setSeekStyle(config.seekStyle);
  playlist.setAnnotations(config.annotationList);
  playlist.setBarGap(config.barGap);
  playlist.setBarWidth(config.barWidth);
  playlist.isAutomaticScroll = config.isAutomaticScroll;
  playlist.isContinuousPlay = config.isContinuousPlay;
  playlist.linkedEndpoints = config.linkedEndpoints;

  if (config.effects) {
    playlist.setEffects(config.effects);
  }

  // take care of initial virtual dom rendering.

  const tree = playlist.render();
  const rootNode = createElement(tree);

  config.container.appendChild(rootNode);
  playlist.tree = tree;
  playlist.rootNode = rootNode;
  // document.getElementById('hertjzjs-load-editor').onclick = () => {
  //   playlist.loadFromJson(`{
  //         "cursor":0,
  //         "tracks":[
  //             {
  //                 "clips":[

  //                     {
  //                         "path":"/waveform-playlist/media/audio/Sound1.mp3",
  //                         "startsAt":0,
  //                         "offset":0,
  //                         "duration":6,
  //                         "effects":[
  //                             {
  //                                 "name" : "fade-in",
  //                                 "params":{
  //                                     "duration" : 4
  //                                 }
  //                             }

  //                         ]
  //                     }
  //                 ]
  //             },
  //             {
  //               "clips":[

  //                   {
  //                       "path":"/waveform-playlist/media/audio/Sound1.mp3",
  //                       "startsAt":6,
  //                       "offset":0,
  //                       "duration":6,
  //                       "effects":[
  //                           {
  //                               "name" : "fade-out",
  //                               "params":{
  //                                   "duration" : 4
  //                               }
  //                           }

  //                       ]
  //                   }
  //               ]
  //           }

  //         ]
  //     }
  //   `);
  // }

  // document.getElementById('hertjzjs-commit').onclick = () => {
  //   playlist.commit();
  // }

  // document.getElementById('hertjzjs-undo').onclick = () => {
  //   playlist.undo()
  // }

  // document.getElementById('hertjzjs-redo').onclick = () => {
  //   playlist.redo()
  // }

  // document.getElementById('hertjzjs-show-json').onclick = () => {
  //   console.log(playlist.getHertjzProjectInstance().toJson())
  // }

  // document.getElementById('hertjzjs-copy-from').onclick = () => {
  //   playlist.copyFromHertzjs(playlist.getHertjzProjectInstance());
  // }

  // document.getElementById('hertjzjs-export').onclick = () => {
  //   playlist.exportZipProject().then(blob => {
  //     window.exportedFile = blob;
  //     // Create a download link
  //     const downloadLink = document.createElement('a');
  //     downloadLink.href = URL.createObjectURL(blob);
  //     downloadLink.download = 'example.zip'; // Set the file name

  //     // Append the download link to the body
  //     document.body.appendChild(downloadLink);

  //     // Trigger the download
  //     downloadLink.click();

  //     // Remove the download link from the DOM
  //     document.body.removeChild(downloadLink);
  //   });
  // }

  // document.getElementById('hertjzjs-import').onclick = () => {
  //   playlist.importZipProject(window.exportedFile);
  // }

  // const projectInputFile = document.getElementById('hertzjs-project-file');
  // projectInputFile.addEventListener('change', function (event) {
  //   const selectedFile = event.target.files[0]; // Get the selected file
  //   if (selectedFile) {

  //     console.log('reading file', selectedFile)
  //     window.selectedFile = selectedFile

  //     playlist.importZipProject(event.target.files[0]);
  //   } else {
  //     console.log('No file selected');
  //   }
  // });



  return playlist;
}

export default function (options = {}, ee = EventEmitter()) {
  return init(options, ee);
}
