import React, { useEffect, useState, useRef } from "react";
// import firebase from "firebase";
import ReactAudioPlayer from "react-audio-player";

import { createClient } from "@supabase/supabase-js";

import { Button } from "@mui/material";

const supabase = createClient(
  "https://hoymimtuzezshkuqcejv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhveW1pbXR1emV6c2hrdXFjZWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYzMDgwMTksImV4cCI6MjA0MTg4NDAxOX0.yX8rrQx8QHA009vOy8JsIoFIj4eyoL2H7j5PVOxj8_Y"
);

// configは、自分のfirebaseの設定を指定してください。
// const config = {
//   apiKey: "",
//   authDomain: "",
//   databaseURL: "",
//   storageBucket: "",
// };

const AudioRecord = () => {
  const [file, setFile] = useState([]);
  const [audioState, setAudioState] = useState(true);
  const audioRef = useRef();

  const [sound, setSound] = useState(false);
  const [test, setTest] = useState(true);

  useEffect(() => {
    // if (firebase.apps.length === 0) {
    //   firebase.initializeApp(config);
    // }
    // マイクへのアクセス権を取得
    navigator.getUserMedia =
      navigator.getUserMedia || navigator.webkitGetUserMedia;
    //audioのみtrue
    navigator.getUserMedia(
      {
        audio: true,
        video: false,
      },
      handleSuccess,
      hancleError
    );
  }, []);

  const handleSuccess = (stream) => {
    // レコーディングのインスタンスを作成
    audioRef.current = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    });
    // 音声データを貯める場所
    var chunks = [];
    // 録音が終わった後のデータをまとめる
    audioRef.current.addEventListener("dataavailable", (ele) => {
      if (ele.data.size > 0) {
        chunks.push(ele.data);
      }
      // 音声データをセット
      setFile(chunks);
    });
    // 録音を開始したら状態を変える
    audioRef.current.addEventListener("start", () => setAudioState(false));
    // 録音がストップしたらchunkを空にして、録音状態を更新
    audioRef.current.addEventListener("stop", () => {
      setAudioState(true);
      chunks = [];
    });
  };
  // 録音開始
  const handleStart = () => {
    console.log("start");
    audioRef.current.start();
  };

  // 録音停止
  const handleStop = () => {
    console.log("stop");
    audioRef.current.stop();
    console.log(file.length);
  };
  // 音声ファイルを送信
  const handleSubmit = async() => {
    console.log("send");

    const wavBlob = await convertBlobToWav(new Blob(file,{ type: 'audio/wav' }));
    console.log('Conversion completed', wavBlob);

    const storage = supabase.storage.from("media/inAudio");
    const { data, error } = await storage.upload(new Date().getTime() + ".wav", wavBlob);
    
    if (error) {
      // TODO アップロードエラーの処理
      console.log(error);
      return "error";
    }
    else{
      console.log("OK!!")
      return "ok";
    }

  };
  const handleRemove = () => {
    setAudioState(true);
    setFile([]);
  };

  const hancleError = () => {
    alert("エラーです。");
  };

  async function convertBlobToWav(inputBlob) {
    // Web Audio APIのコンテキストを作成
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // BlobをArrayBufferに変換
    const arrayBuffer = await inputBlob.arrayBuffer();
    
    // ArrayBufferをデコード
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // WAVファイルのヘッダーとデータを生成
    const wavFile = createWavFile(audioBuffer);
    // return wavFile;
    
    // WAV形式のBlobを作成して返す
    return new Blob([wavFile], { type: 'audio/wav' });
  }
  
  function createWavFile(audioBuffer) {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let sample, offset = 0;
  
    // AudioBufferからチャンネルデータを取得
    for (let i = 0; i < numOfChan; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
  
    // WAVファイルヘッダーの書き込み
    writeString(view, offset, 'RIFF'); offset += 4;
    view.setUint32(offset, length - 8, true); offset += 4;
    writeString(view, offset, 'WAVE'); offset += 4;
    writeString(view, offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4; // サブチャンクサイズ
    view.setUint16(offset, 1, true); offset += 2; // オーディオフォーマット (1 はPCM)
    view.setUint16(offset, numOfChan, true); offset += 2; // チャンネル数
    view.setUint32(offset, audioBuffer.sampleRate, true); offset += 4; // サンプルレート
    view.setUint32(offset, audioBuffer.sampleRate * 2 * numOfChan, true); offset += 4; // バイトレート
    view.setUint16(offset, numOfChan * 2, true); offset += 2; // ブロックアライン
    view.setUint16(offset, 16, true); offset += 2; // ビット深度
    writeString(view, offset, 'data'); offset += 4;
    view.setUint32(offset, length - offset - 4, true); offset += 4;
  
    // 波形データの書き込み
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        sample = Math.max(-1, Math.min(1, channels[channel][i]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(offset, sample, true); offset += 2;
      }
    }
  
    return buffer;
  }
  
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  let intervalId = 0;

  const addInterval = () => {
    if(intervalId == 0){
      intervalId = setInterval(() => {
        if(sound){
          console.log("recording!!!")
          handleStop();
        }
      },10000);
    }
  }
  useEffect(()=>{
    console.log(intervalId, sound);
    addInterval();
  },[sound]);

  useEffect(()=>{
    console.log("file_update:",file.length);
    if(file.length >0){
      handleSubmit().then(()=>{
        handleStart();
      });
    }
  },[file]);

  return (
    <div>
      {
        !sound &&
        <Button
          onClick={()=>{
            setSound(true);
            handleStart();
          }}
        >
          開始
        </Button>
      }
      {
        sound &&
        <Button
          onClick={()=>{
            setSound(false);
            clearInterval(intervalId);
          }}
        >
          停止
        </Button>
      }
      <button onClick={handleStart} disabled={!audioState}>録音</button>
      <button onClick={handleStop} disabled={audioState}>
        ストップ
      </button>
      <button onClick={handleSubmit} disabled={file.length === 0}>
        送信
      </button>
      <button onClick={handleRemove}>削除</button> 
      <ReactAudioPlayer src={URL.createObjectURL(new Blob(file))} controls />
    </div>
  );
};

export default AudioRecord;