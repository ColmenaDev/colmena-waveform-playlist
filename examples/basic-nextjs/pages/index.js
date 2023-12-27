import React, { useCallback, useState, useRef } from "react";
import EventEmitter from "events";
import WaveformPlaylist from "colmena-waveform-playlist";
import { saveAs } from "file-saver";
import { arrayBufferToBlob } from 'blob-util';
import lodash from "lodash";

export default function Home() {
  const [ee] = useState(new EventEmitter());
  const setUpChain = useRef();
  let playlist;

  const inputFileRef = useRef(null);

  const handleImportAudioFromDevice = () => {
    if (!inputFileRef || !inputFileRef.current) return;
    const clk = inputFileRef?.current;
    clk.click();
  };

  const onSelectFile = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      let blob_;
      const file = e.target.files[0];
      const { type, name } = file;
      blob_ = arrayBufferToBlob(file);
      ee.emit('importZipProject', blob_)
      console.log(file);
    }
  };

  let debounce_fun = lodash.debounce(function () {
    console.log("debounce_fun");
    ee.emit("commit");
  }, 2000);

  const container = useCallback(
    (node) => {
      async function logError(err) {
        console.error(err);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async function gotStream(playlist, stream) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        var userMediaStream = stream;
        playlist.initRecorder(userMediaStream);
      }

      window.document.getElementById('waveform')?.firstChild?.remove();
      if (node !== null) {

        const constraints = {
          audio: {
            channelCount: 1,
          },
        };

        playlist = WaveformPlaylist(
          {
            samplesPerPixel: 500,
            mono: true,
            waveHeight: 140,
            sampleRate: 48000,
            container: node,
            timescale: true,
            state: 'cursor',
            barWidth: 4,
            isAutomaticScroll: true,
            barGap: 2,
            innerWidth: 200,
            controls: {
              show: true,
              width: 80,
              widgets: {
                muterOrSolo: true,
                volume: true,
                collapse: true,
                remove: true,
                stereoPan: true,
              },
            },
            zoomLevels: [500, 1000, 3000, 5000],
          },
          ee
        );

        if (navigator.mediaDevices) {
          navigator.mediaDevices
            .getUserMedia(constraints)
            .then((stream) => { 
              gotStream(playlist, stream)
            
            })
            .catch(logError);
        }

        ee.on('audiosourceserror', (err) => {
          console.log("audiosourceserror event", err);
        });

        ee.on('shift', (deltaTime, track) => {
          debounce_fun();
          console.log("shift event", deltaTime, track);
        });

        ee.on("audiorenderingstarting", function (offlineCtx, a) {
          // Set Tone offline to render effects properly.
          // const offlineContext = new Tone.OfflineContext(offlineCtx);
          // Tone.setContext(offlineContext);
          // setUpChain.current = a;
        });

        ee.on("zipProjectExported", function (blob) {
          saveAs(blob, "test.zip");
        });

        ee.on("audiorenderingfinished", function (type, data) {
          //restore original ctx for further use.
          if (type === "wav") {
            saveAs(data, "test.wav");
          }
        });

        playlist.load([
          {
            src: "/hello.mp3",
            name: "Hello",            
          },
        ]);


        //initialize the WAV exporter.
        playlist.initExporter();

        window.playlist = playlist;
      }
    },
    [ee]
  );

  function handleRedo(){
    // playlist.redo();
    ee.emit("redo");
  }

  function handleUndo(){
    // playlist.undo();
    ee.emit("undo");
  }

  function handleCommitChanges(){
    // playlist.commit();
    ee.emit("commit");
  }

  function handleExportZipProject(){
    ee.emit("exportZipProject");
  }

  function handleImportZipProject(){
    handleImportAudioFromDevice();
  }

  const playoutEvents = ['pause', 'play', 'stop', 'rewind', 'fastforward', 'record', 'clear'];
  const zoomEvents = ['zoomin', 'zoomout'];
  const selectStateEvents = [
    {
      event: "statechange",
      value: "cursor"
    },
    {
      event: "statechange",
      value: "select"
    },
    {
      event: "statechange",
      value: "fadein"
    },
    {
      event: "statechange",
      value: "fadeout"
    },
    {
      event: "statechange",
      value: "shift"
    }
  ];
  const editorEvents = ['trim', 'split', 'cut'];
  const downloadEvents = [
    {
      name: "download wav",
      event: "startaudiorendering",
      value: "wav",
    },
  ];

  function Wrapper({ children }){
    return <div style={{ display: "flex", flexDirection: "row", gap: 10, marginBottom: 5 }}>
      {children}
    </div>
  }

  return (
    <div style={{ margin: 10 }}>
      <main>
      <input
        type="file"
        ref={inputFileRef}
        onChange={onSelectFile}
        style={{ display: 'none' }}
      />
        <Wrapper>
          {playoutEvents.map(value => 
            <button style={{ backgroundColor: value === "record" ? 'lightsalmon' : 'ghostwhite' }} onClick={() =>  ee.emit(value)}>{value}</button>
          )}
        </Wrapper>
        <Wrapper>
          {zoomEvents.map(value => 
            <button style={{ backgroundColor: "lightsteelblue" }} onClick={() =>  ee.emit(value)}>{value}</button>
          )}
        </Wrapper>
        <Wrapper>
          {selectStateEvents.map(obj => 
            <button style={{ backgroundColor: "lemonchiffon" }} onClick={() =>  ee.emit(obj.event, obj.value)}>{obj.value}</button>
          )}
        </Wrapper>
        <Wrapper>
          {editorEvents.map(value => 
            <button style={{ backgroundColor: "lightcyan" }} onClick={() =>  ee.emit(value)}>{value}</button>
          )}
        </Wrapper>
        <Wrapper>
          <button style={{ backgroundColor: "palegreen" }} onClick={() => { 
            // load editor event 
          }}>
            load editor
          </button>
          <button style={{ backgroundColor: "palegreen" }} onClick={handleCommitChanges}>
            commit changes
          </button>
          <button style={{ backgroundColor: "palegreen" }} onClick={handleRedo}>
            redo
          </button>
          <button style={{ backgroundColor: "palegreen" }} onClick={handleUndo}>
            undo
          </button>
          <button style={{ backgroundColor: "palegreen" }} onClick={() => { 
            // show json event 
          }}>
            show json
          </button>
          <button style={{ backgroundColor: "palegreen" }} onClick={handleImportZipProject}>
            import project
          </button>
          <button style={{ backgroundColor: "palegreen" }} onClick={handleExportZipProject}>
            export project
          </button>
        </Wrapper>
        <Wrapper>
          {downloadEvents.map(obj => 
            <button style={{ backgroundColor: "sandybrown" }} onClick={() =>  ee.emit(obj.event, obj.value)}>{obj.name}</button>
          )}
        </Wrapper>
        <div ref={container}></div>
      </main>
    </div>
  );
}