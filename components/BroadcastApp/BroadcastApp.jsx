import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ToasterBar from '@/components/ToasterBar';
import StatusBar from '@/components/StatusBar';
import StreamPreview from '@/components/StreamPreview';
import ControlBar from '@/components/ControlBar';
import { ModalContext } from '@/providers/ModalContext';
import { BroadcastContext } from '@/providers/BroadcastContext';
import Modal from '@/components/Modal';
import { UserSettingsContext } from '@/providers/UserSettingsContext';
import { BroadcastLayoutContext } from '@/providers/BroadcastLayoutContext';
import { LocalMediaContext } from '@/providers/LocalMediaContext';
import CameraCanvas from '@/components/CameraCanvas/CameraCanvas';
import toast from 'react-hot-toast';
import Head from 'next/head';

import AudioRecord from '../AudioRecorder/AudioRecord';

export default function BroadcastApp() {
  const searchParams = useSearchParams();

  const { toggleModal, modalProps, modalActive, modalContent } =
    useContext(ModalContext);
  const { showFullScreenCam, refreshCurrentScene } = useContext(
    BroadcastLayoutContext
  );
  const {
    isLive,
    isSupported,
    broadcastClientRef,
    createBroadcastClient,
    destroyBroadcastClient,
    broadcastClientMounted,
  } = useContext(BroadcastContext);
  const { configRef, ingestEndpoint, setIngestEndpoint, setStreamKey } =
    useContext(UserSettingsContext);
  const {
    setInitialDevices,
    localVideoDeviceId,
    localVideoStreamRef,
    canvasElemRef,
    cleanUpDevices,
    enableCanvasCamera,
    refreshSceneRef,
  } = useContext(LocalMediaContext);

  const previewRef = useRef(undefined);
  const sdkIsStarting = useRef(false);
  const [canvasWidth, setCanvasWidth] = useState();
  const [canvasHeight, setCanvasHeight] = useState();
  const [videoStream, setVideoStream] = useState();

  useEffect(() => {
    if (sdkIsStarting.current) return;
    sdkIsStarting.current = true;
    setInitialDevices().then(
      ({ audioDeviceId, audioStream, videoDeviceId, videoStream }) => {
        if (!broadcastClientRef.current) {
          createBroadcastClient({
            config: configRef.current,
          }).then((client) => {
            const { width, height } = videoStream.getTracks()[0].getSettings();
            refreshSceneRef.current = refreshCurrentScene;
            showFullScreenCam({
              cameraStream: enableCanvasCamera
                ? canvasElemRef.current
                : videoStream,
              cameraId: videoDeviceId,
              cameraIsCanvas: enableCanvasCamera,
              micStream: audioStream,
              micId: audioDeviceId,
              showMuteIcon: false,
            });
          });
        }
      }
    );
    return () => {
      if (broadcastClientRef.current)
        destroyBroadcastClient(broadcastClientRef.current);
      cleanUpDevices();
    };
    // run once on mount
  }, []);

  useEffect(() => {
    const uidQuery = searchParams.get('uid');
    const skQuery = searchParams.get('sk');
    const channelTypeQuery = searchParams.get('channelType');

    if (uidQuery)
      setIngestEndpoint(`${uidQuery}.global-contribute.live-video.net`);
    if (skQuery) setStreamKey(skQuery);
    if (channelTypeQuery) {
      const formatted = channelType.toUpperCase();
      switch (formatted) {
        case 'BASIC':
          setChannelType('BASIC');
          break;
        case 'STANDARD':
          setChannelType('STANDARD');
        default:
          console.error(
            `Channel type must be STANDARD, BASIC. The channel type you provided is ${channelType}. The default value of BASIC has been set`
          );
          break;
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (broadcastClientMounted)
      broadcastClientRef.current.attachPreview(previewRef.current);
    return () => {
      if (broadcastClientRef.current)
        broadcastClientRef.current.detachPreview();
    };
  }, [broadcastClientMounted]);

  // React to webcam device changes if the canvas camera is enabled.
  useEffect(() => {
    if (!broadcastClientMounted || !enableCanvasCamera) return;
    const { width, height } = broadcastClientRef.current.getCanvasDimensions();
    setCanvasWidth(width);
    setCanvasHeight(height);
    setVideoStream(localVideoStreamRef.current);
  }, [localVideoDeviceId, broadcastClientMounted, enableCanvasCamera]);

  useEffect(() => {
    if (!isSupported) {
      toast.error(
        (t) => {
          return (
            <div className='flex items-center'>
              <span className='pr-4 grow'>
                This browser is not fully supported. Certain features may not
                work as expected.{' '}
                <a
                  href='https://docs.aws.amazon.com/ivs/latest/LowLatencyUserGuide/broadcast.html#broadcast-platform-requirements'
                  target='_blank'
                  rel='noreferrer noopener'
                  className='text-primaryAlt dark-theme:text-primary hover:text-primary hover:dark-theme:text-primaryAlt hover:underline underline-offset-1'
                >
                  Learn more
                </a>
              </span>
            </div>
          );
        },
        {
          id: 'BROWSER_SUPPORT',
          duration: Infinity,
        }
      );
    }
  }, [isSupported]);

  const title = `Amazon IVS – Web Broadcast Tool - ${
    isLive ? 'LIVE' : 'Offline'
  }`;


  // // 画像を定期的に撮る
  // const video = document.querySelector('#video');
  // const canvas = document.createElement('canvas');

  // initVideoCamera();
  // initPhoto();
  // document.querySelector('#shoot').addEventListener('click', photoShoot);

  // /**
  //  * ビデオのカメラ設定(デバイスのカメラ映像をビデオに表示)
  //  */
  // function initVideoCamera() {
  //     navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  //         .then((stream) => {
  //             video.srcObject = stream;
  //             video.play();
  //         })
  //         .catch(e => console.log(e));
  // }

  // /**
  //  * 写真の初期描画
  //  */
  // function initPhoto() {
  //     canvas.width = video.clientWidth;
  //     canvas.height = video.clientHeight;
  //     const context = canvas.getContext("2d");
  //     context.fillStyle = "#AAA";
  //     context.fillRect(0, 0, canvas.width, canvas.height);
  //     document.querySelector("#photo").src = canvas.toDataURL("image/png");
  // }

  // /**
  //  * 写真の撮影描画
  //  */
  // function photoShoot() {
  //     let drawSize = calcDrawSize();
  //     canvas.width = drawSize.width;
  //     canvas.height = drawSize.height;
  //     const context = canvas.getContext("2d");
  //     context.drawImage(video, 0, 0, canvas.width, canvas.height);
  //     document.querySelector("#photo").src = canvas.toDataURL("image/png");
  // }

  // /**
  //  * 描画サイズの計算
  //  * 縦横比が撮影(video)が大きい時は撮影の縦基準、それ以外は撮影の横基準で計算
  //  */
  // function calcDrawSize() {
  //     let videoRatio = video.videoHeight / video.videoWidth;
  //     let viewRatio = video.clientHeight / video.clientWidth;
  //     return videoRatio > viewRatio ?
  //         { height: video.clientHeight, width: video.clientHeight / videoRatio }
  //         : { height: video.clientWidth * videoRatio, width: video.clientWidth }
  // }


  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className='flex flex-col h-[100dvh] items-center bg-surface'>
        <ToasterBar />
        <StatusBar />
        <StreamPreview previewRef={previewRef} />
        <ControlBar />
        {enableCanvasCamera && (
          <CameraCanvas
            width={canvasWidth}
            height={canvasHeight}
            videoStream={videoStream}
          />
        )}
      </div>
      <Modal show={modalActive} onClose={toggleModal} {...modalProps}>
        {modalContent}
      </Modal>
      {/* <h3>カメラ画像取得</h3>
      <div class="flex-row">
          <div class="camera">
              <video id="video"></video>
              <div id="shoot">撮影</div>
          </div>
          <img id="photo">
      </div> */}
      <AudioRecord/>
    </>
  );
}
