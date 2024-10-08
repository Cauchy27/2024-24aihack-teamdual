import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

import { createClient } from "@supabase/supabase-js";
import { useEffect } from "react";

import {Button}  from "@mui/material";
import IconButton from '@mui/material/IconButton';
import Typography from "@mui/material";

import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { ContentCutOutlined, Image } from "@mui/icons-material";

import Marquee from "react-fast-marquee";

import SyojikiIcon from "../../public/assets/syojiki-icon.png"

const supabase = createClient(
  "https://hoymimtuzezshkuqcejv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhveW1pbXR1emV6c2hrdXFjZWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYzMDgwMTksImV4cCI6MjA0MTg4NDAxOX0.yX8rrQx8QHA009vOy8JsIoFIj4eyoL2H7j5PVOxj8_Y"
);

const testResJson = [
  `{"audioData": "/outAudio/2024-09-15_00-22-06.wav", "kokoronokoe": "こんなに頑張ったのに、誰も理解してくれないのか。協力した意味がない。もどかしい気持ちが募る。もうどうでもよくなる前に、決意を新たにしなきゃ。"}`,
  `{"audioData": "/outAudio/2024-09-15_01-52-54.wav", "kokoronokoe": "この瞬間、僕の努力が報われている。皆の反応もいい感じだ。ここまで来たかいがあった。一体、どれだけの時間を費やしてきたんだろう。これが新しい始まりになるといいな。"}`,
  `{"audioData": "/outAudio/2024-09-15_07-42-30.wav", "kokoronokoe": "こんな場で落ち着いていられるだろうか。周囲は和やかだけど、ふとした瞬間に不安がよぎる。どうにか努めても、内心はイライラしている。もっとスムーズにできたはずなのに、期待に応えられるのか。"}`,
  `{"audioData": "/outAudio/2024-09-15_09-22-45.wav", "kokoronokoe": "みんなが協力して作り上げたんだ。この瞬間を迎えられて、本当に嬉しい。一緒に頑張ってきた成果を見てほしい。"}`,
  `{"audioData": "/outAudio/2024-09-15_09-23-31.wav", "kokoronokoe": "緊張する必要はない、全力で伝えるだけだ。皆が高い知識を持っているなら、何も心配はいらない。楽しんでもらえるように、リラックスして進もう。"}`
];

const testMode = true;
// const testMode = false;

const videoConstraints = {
  width: 440,
  height: 320,
  facingMode: "user",
};

export const ImageRecorder = () => {
  const [isCaptureEnable, setCaptureEnable] = useState(false);
  const webcamRef = useRef(null);
  const [url, setUrl] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [intervalId, setIntervalId] = useState(0);
  const [imageFlag, setImageFlag] = useState(false);
  const [textSpeed, setTextSpeed] = useState(250);

  let firstLoadFlag = false;

  const [isSoundPlay, setIsSoundPlay] = useState(false);

  // 再生用ファイル
  const [kokoronokoeText, setKokoronokoeText] = useState("");
  const [kokoronokoeSound, setKokoronokoeSound] = useState(null);

  const capture = useCallback(() => {
    setImageSrc(webcamRef.current?.getScreenshot());
    console.log("capture_done",webcamRef.current?.getScreenshot())
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
        console.log("capture!!!",isCaptureEnable)
        capture();
      },30000);

      setIntervalId(test)
    }
  }
  useEffect(()=>{
    console.log(intervalId, imageFlag,firstLoadFlag);
    if(!firstLoadFlag){
      addInterval();
    }
    console.log(SyojikiIcon);
  },[imageFlag]);

  useEffect(()=>{
    console.log("src", imageSrc);
    if(imageSrc){
      submitImage().then((res)=>{
        console.log(res);
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
      const testNum = Math.random();
      if(testNum <0.2){
        kokoronokoeData = JSON.parse(testResJson[0]);
      }
      else if(testNum <0.4 ){
        kokoronokoeData = JSON.parse(testResJson[1]);
      }
      else if(testNum <0.6 ){
        kokoronokoeData = JSON.parse(testResJson[2]);
      }
      else if(testNum <0.8 ){
        kokoronokoeData = JSON.parse(testResJson[3]);
      }
      else{
        kokoronokoeData = JSON.parse(testResJson[4]);
      }

      setTextSpeed(kokoronokoeData.kokoronokoe.length * 3.3 > 270 ? kokoronokoeData.kokoronokoe.length * 3.3 : 270);
      
      console.log(kokoronokoeData.audioData);
      setKokoronokoeText(kokoronokoeData.kokoronokoe);

      // 音声のurl取得・urlの形式を後で確認
      const url = supabase.storage.from("media/outAudio").getPublicUrl(kokoronokoeData.audioData.replace("/outAudio/",""));

      // console.log(url.data.publicUrl);
      soundPlay(url.data.publicUrl);

      return ;

    }
    else{
      // 仕方がないので、IPベタ書き
      // try{
        const url = 'http://192.168.100.141:5555'
        await fetch(url,{
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then((res_data)=>{
  
          let kokoronokoeData;
          kokoronokoeData = res_data;
  
          console.log(kokoronokoeData.audioData);
          setTextSpeed(kokoronokoeData.kokoronokoe.length * 3.3 > 270 ? kokoronokoeData.kokoronokoe.length * 3.3 : 270);
          setKokoronokoeText(kokoronokoeData.kokoronokoe);
  
          // 音声のurl取得・urlの形式を後で確認
          const url = supabase.storage.from("media/outAudio").getPublicUrl(kokoronokoeData.audioData.replace("/outAudio/",""));
  
          // console.log(url.data.publicUrl);
          soundPlay(url.data.publicUrl);
  
          console.log(res_data)
          return res_data;
        });
      // }
      // catch(error){
      //   let kokoronokoeData
      //   const testNum = Math.random();
      //   if(testNum <0.2){
      //     kokoronokoeData = JSON.parse(testResJson[0]);
      //   }
      //   else if(testNum <0.4 ){
      //     kokoronokoeData = JSON.parse(testResJson[1]);
      //   }
      //   else if(testNum <0.6 ){
      //     kokoronokoeData = JSON.parse(testResJson[2]);
      //   }
      //   else if(testNum <0.8 ){
      //     kokoronokoeData = JSON.parse(testResJson[3]);
      //   }
      //   else{
      //     kokoronokoeData = JSON.parse(testResJson[4]);
      //   }

      //   setTextSpeed(kokoronokoeData.kokoronokoe.length * 3.3 > 270 ? kokoronokoeData.kokoronokoe.length * 3.3 : 270);
        
      //   console.log(kokoronokoeData.audioData);
      //   setKokoronokoeText(kokoronokoeData.kokoronokoe);

      //   // 音声のurl取得・urlの形式を後で確認
      //   const url = supabase.storage.from("media/outAudio").getPublicUrl(kokoronokoeData.audioData.replace("/outAudio/",""));

      //   // console.log(url.data.publicUrl);
      //   soundPlay(url.data.publicUrl);

      //   console.log(error);

      //   return "error";
      // }
    }
    console.log("get_end");
  }

  // 音声の再生
  // window.AudioContext = window.AudioContext || window.webkitAudioContext;
  let ctx = new AudioContext();
  let ctxp = new AudioContext();
  let sampleSource
  let professionalSource

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
  async function setupProfessional(soundUrl) {
    console.log(soundUrl);
    const response = await fetch(soundUrl);

    console.log(response);

    ctxp = new AudioContext();

    const arrayBuffer = await response.arrayBuffer();
    // Web Audio APIで使える形式に変換
    const audioBuffer = await ctxp.decodeAudioData(arrayBuffer);
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
      setTimeout(()=>{setIsSoundPlay(false);},1000)
      setKokoronokoeText("");
    };
  }
  function playProfessional(ctx, audioBuffer) {
    professionalSource = ctx.createBufferSource();
    // 変換されたバッファーを音源として設定
    professionalSource.buffer = audioBuffer;
    // 出力につなげる
    professionalSource.connect(ctx.destination);
    professionalSource.start();
  }

  const soundPlay = async(soundUrl) =>{

    console.log(isSoundPlay,soundUrl);

    if (isSoundPlay) return;

    setIsSoundPlay(true);

    const professional = await setupProfessional("/assets/professional.mp3");
    playProfessional(ctxp, professional);

    const sample = await setupSample1(soundUrl);
    setTimeout(()=>{
      playSample(ctx, sample);
    },500)
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
      {
        isSoundPlay &&
        <div className="absolute z-0 top-20 text-8xl left-10 text-white font-bold bg-slate-500 opacity-70">
            <p>※心の声</p>
        </div>
      }
      {isCaptureEnable && (
        <>
          {/* <div>
            <button onClick={() => setCaptureEnable(false)}>終了</button>
          </div> */}
          <div className="absolute z-0 bottom-0 left-0 ">
            {
              isSoundPlay &&
              <Marquee
                speed={textSpeed}
                loop={1}
                delay={1}
              >
                <p className="text-7xl text-white font-bold bg-slate-500 opacity-70">{kokoronokoeText}</p>
              </Marquee>
            }
            <Webcam
              audio={false}
              width={440}
              height={320}
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
            size="large" 
            sx={{
              width:"160px",
              height:"160px"
            }}
            onClick={()=>{
              setCaptureEnable(true);
              setImageFlag(true);
            }}
          >
            {/* <RadioButtonCheckedIcon color="error"/> */}
            <img
              src={"/assets/syojiki-icon.png"}
            />
          </IconButton>
        }
        {
          imageFlag &&
          <IconButton 
            size="large" 
            sx={{
              width:"160px",
              height:"160px"
            }}
            onClick={()=>{
                  setImageFlag(false);
                  clearInterval(intervalId);
                  setIntervalId(0);
                  setCaptureEnable(false);
            }}
          >
            {/* <StopCircleIcon color=""/> */}
            <img
              src={"/assets/syojiki-stop-icon.png"}
            />
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