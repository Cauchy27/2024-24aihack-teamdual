import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

import { createClient } from "@supabase/supabase-js";
import { useEffect } from "react";

import {Button}  from "@mui/material";
import IconButton from '@mui/material/IconButton';
import Typography from "@mui/material";

import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import StopCircleIcon from '@mui/icons-material/StopCircle';

import Marquee from "react-fast-marquee";

const supabase = createClient(
  "https://hoymimtuzezshkuqcejv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhveW1pbXR1emV6c2hrdXFjZWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYzMDgwMTksImV4cCI6MjA0MTg4NDAxOX0.yX8rrQx8QHA009vOy8JsIoFIj4eyoL2H7j5PVOxj8_Y"
);

const testResJson = [`{"audioData": "2024-09-15_00-22-06.wav", "kokoronokoe": "こんなに頑張ったのに、誰も理解してくれないのか。協力した意味がない。もどかしい気持ちが募る。もうどうでもよくなる前に、決意を新たにしなきゃ。"}`,`{"audioData": "2024-09-15_01-52-54.wav", "kokoronokoe": "この瞬間、僕の努力が報われている。皆の反応もいい感じだ。ここまで来たかいがあった。一体、どれだけの時間を費やしてきたんだろう。これが新しい始まりになるといいな。"}`];

const testMode = true;

const videoConstraints = {
  width: 480,
  height: 360,
  facingMode: "user",
};

export const ImageRecorder = () => {
  const [isCaptureEnable, setCaptureEnable] = useState(false);
  const webcamRef = useRef(null);
  const [url, setUrl] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [intervalId, setIntervalId] = useState(0);
  const [imageFlag, setImageFlag] = useState(false);

  let firstLoadFlag = false;

  const [isSoundPlay, setIsSoundPlay] = useState(false);

  // 再生用ファイル
  const [kokoronokoeText, setKokoronokoeText] = useState("");
  const [kokoronokoeSound, setKokoronokoeSound] = useState(null);

  const capture = useCallback(() => {
    setImageSrc(webcamRef.current?.getScreenshot());
  }, [webcamRef]);
  
  // useEffect(()=>{
  //   console.log(imageSrc)
  //   setUrl(imageSrc);
  // },[imageSrc]);

  const submitImage = async() => {
    if(!imageSrc){
      console.log(imageSrc);
      console.log("no_data");
      return "no_data";
    }
    const storage = supabase.storage.from("media/images");

    // base64デコード
    const blob = atob(imageSrc?.replace(/^.*,/, ''));
    let buffer = new Uint8Array(blob.length);
    for (let i = 0; i < blob.length; i++) {
        buffer[i] = blob.charCodeAt(i);
    }

    const imageName = new Date().getTime() + ".jpg"

    const { data, error } = await storage.upload(imageName, new File([buffer.buffer], 'image.jpg', { type: 'image/jpg' }));
    
    if (error) {
      // TODO アップロードエラーの処理
      console.log(error);
      return "error";
    }
    else{
      console.log("OK!!")
      return imageName;
    }
  }

  let test = 0;

  // 画像の定期アップロード
  const addInterval = () => {
    firstLoadFlag = true;
    console.log(intervalId,"add");
    if(intervalId == 0){
      test = setInterval(() => {
        console.log("capture!!!")
        capture();
      },20000);

      setIntervalId(test)
    }
  }
  useEffect(()=>{
    console.log(intervalId, imageFlag,firstLoadFlag);
    if(!firstLoadFlag){
      addInterval();
    }
  },[imageFlag]);

  useEffect(()=>{
    if(imageSrc){
      submitImage().then((res)=>{
        if(res.match(/jpg/)){
          console.log("success_upload!!");

          // ここでバックエンドを叩く
          getKokoroNoKoe(res);

        }
      });
    }
  },[imageSrc]);

  const getKokoroNoKoe = async(imageName) => {

    const data = {
      "image":"/images/"+imageName
    }

    console.log(JSON.stringify(data));

    if(testMode){

      let kokoronokoeData
      if(Math.random() <0.5){
        kokoronokoeData = JSON.parse(testResJson[0]);
      }
      else{
        kokoronokoeData = JSON.parse(testResJson[1]);
      }
      
      console.log(kokoronokoeData.audioData);
      setKokoronokoeText(kokoronokoeData.kokoronokoe);

      // 音声のurl取得・urlの形式を後でよう確認
      const url = supabase.storage.from("media/outAudio").getPublicUrl(kokoronokoeData.audioData);

      // console.log(url.data.publicUrl);
      soundPlay(url.data.publicUrl);

      return ;

    }
    else{
      // 仕方がないので、IPベタ書き
      const url = 'http://192.168.100.158:5555'
      await fetch(url,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then((res_data)=>{

        // ここは後で

        console.log(res_data)
        return res_data;
      });
    }
    console.log("get_end");
  }

  // 音声の再生
  // window.AudioContext = window.AudioContext || window.webkitAudioContext;
  let ctx = new AudioContext();
  let sampleSource

   // 音源を取得しAudioBuffer形式に変換して返す関数
 async function setupSample1(soundUrl) {
  console.log(soundUrl);
  const response = await fetch(soundUrl);

  console.log(response);

  ctx = new AudioContext();

  const arrayBuffer = await response.arrayBuffer();
  // Web Audio APIで使える形式に変換
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  return audioBuffer;
}

// AudioBufferをctxに接続し再生する関数
function playSample(ctx, audioBuffer) {
  sampleSource = ctx.createBufferSource();
  // 変換されたバッファーを音源として設定
  sampleSource.buffer = audioBuffer;
  // 出力につなげる
  sampleSource.connect(ctx.destination);
  sampleSource.start();

  sampleSource.onended = function () {
    console.log("再生終了！") ;
    setIsSoundPlay(false);
  };

  console.log("go!!!");
}

const soundPlay = async(soundUrl) =>{

  console.log(isSoundPlay,soundUrl);

  if (isSoundPlay) return;

  setIsSoundPlay(true);
  const sample = await setupSample1(soundUrl);
  playSample(ctx, sample);
}

const getSoundTest =async() => {
  const testUrl = "https://hoymimtuzezshkuqcejv.supabase.co/storage/v1/object/public/media/outAudio/2024-09-15_00-22-06.wav";

  const response = await fetch(testUrl);

  console.log(response);

  soundPlay(testUrl);

  return "test";

}

  return (
    <>
      {/* <header>
        <h1>カメラアプリ</h1>
      </header> */}
      {/* {isCaptureEnable || (
        <button onClick={() => setCaptureEnable(true)}>開始</button>
      )} */}
      {isCaptureEnable && (
        <>
          {/* <div>
            <button onClick={() => setCaptureEnable(false)}>終了</button>
          </div> */}
          <div className="absolute z-50 bottom-0 left-0">
            {
              isSoundPlay &&
              <Marquee
                speed={200}
                // loop="1"
              >
                <p className="text-5xl text-white font-bold">{kokoronokoeText}</p>
              </Marquee>
            }
            <Webcam
              audio={false}
              width={480}
              height={360}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
            />
          </div>
        </>
      )}
      <div className="absolute z-50 bottom-20 right-5 bg-slate-50">
        {
          !imageFlag &&
          <IconButton 
            size="larges" 
            onClick={()=>{
              setCaptureEnable(true);
              setImageFlag(true);
            }}
          >
            <RadioButtonCheckedIcon color="error"/>
          </IconButton>
        }
        {
          imageFlag &&
          <IconButton 
            size="larges" 
            onClick={()=>{
                  setImageFlag(false);
                  clearInterval(intervalId);
                  setIntervalId(0);
                  setCaptureEnable(false);
            }}
          >
            <StopCircleIcon color=""/>
          </IconButton>
        }

      </div>
      {/* <Button
          onClick={()=>{
            getSoundTest();
          }}
      >
        テスト
      </Button> */}
    </>
  );
};