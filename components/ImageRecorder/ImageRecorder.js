import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

import { createClient } from "@supabase/supabase-js";
import { useEffect } from "react";

import { Button } from "@mui/material";

const supabase = createClient(
  "https://hoymimtuzezshkuqcejv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhveW1pbXR1emV6c2hrdXFjZWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYzMDgwMTksImV4cCI6MjA0MTg4NDAxOX0.yX8rrQx8QHA009vOy8JsIoFIj4eyoL2H7j5PVOxj8_Y"
);

const videoConstraints = {
  width: 720,
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

  const capture = useCallback(() => {
    setImageSrc(webcamRef.current?.getScreenshot());
  }, [webcamRef]);
  
  useEffect(()=>{
    console.log(imageSrc)
    setUrl(imageSrc);
  },[imageSrc]);

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

    const { data, error } = await storage.upload(new Date().getTime() + ".jpg", new File([buffer.buffer], 'image.jpg', { type: 'image/jpg' }));
    
    if (error) {
      // TODO アップロードエラーの処理
      console.log(error);
      return "error";
    }
    else{
      console.log("OK!!")
      return "ok";
    }
  }

  let test = 0;

  // 画像の定期アップロード
  const addInterval = () => {
    console.log(intervalId,"add");
    if(intervalId == 0){
      test = setInterval(() => {
        console.log("capture!!!")
        capture();
      },15000);

      setIntervalId(test)
    }
  }
  useEffect(()=>{
    console.log(intervalId, imageFlag);
    addInterval();
  },[imageFlag]);

  useEffect(()=>{
    if(imageSrc){
      submitImage().then((res)=>{
        if(res == "ok"){
          console.log("success_upload!!");
        }
      });
    }
  },[imageSrc]);

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
            <Webcam
              audio={false}
              width={480}
              height={360}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
            />
          </div>
          <button onClick={()=>{
            capture();
            setTimeout(()=>{
              submitImage();
            },1000)
          }}>キャプチャ</button>
        </>
      )}
      {/* {url && (
        <>
          <div>
            <button
              onClick={() => {
                setUrl(null);
              }}
            >
              削除
            </button>
          </div>
          <div>
            <img src={url} alt="Screenshot" />
          </div>
          
        </>
      )} */}
      {
        !imageFlag &&
        <Button
          onClick={()=>{
            setCaptureEnable(true);
            setImageFlag(true);
          }}
        >
          開始
        </Button>
      }
      {
        imageFlag &&
        <Button
          onClick={()=>{
            setImageFlag(false);
            clearInterval(intervalId);
            setIntervalId(0);
          }}
        >
          停止
        </Button>
      }
      <Button
          onClick={()=>{
            console.log(imageSrc);
          }}
        >
          テストログ
        </Button>
    </>
  );
};