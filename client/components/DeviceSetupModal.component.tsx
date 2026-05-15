"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;

  onContinue: (data: {
    cameraId: string;
    micId: string;
    cameraEnabled: boolean;
    micEnabled: boolean;
  }) => void;
}

export default function DeviceSetupModal({
  isOpen,
  onClose,
  onContinue,
}: Props) {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);

  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMic, setSelectedMic] = useState("");

  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  /**
   * LOAD DEVICES
   */

  const loadDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const devices = await navigator.mediaDevices.enumerateDevices();

      const cams = devices.filter((d) => d.kind === "videoinput");

      const mics = devices.filter((d) => d.kind === "audioinput");

      setCameras(cams);
      setMicrophones(mics);

      if (cams[0]) {
        setSelectedCamera(cams[0].deviceId);
      }

      if (mics[0]) {
        setSelectedMic(mics[0].deviceId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * START PREVIEW
   */

  const startPreview = async () => {
    try {
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraEnabled
          ? {
              deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
            }
          : false,

        audio: micEnabled
          ? {
              deviceId: selectedMic ? { exact: selectedMic } : undefined,
            }
          : false,
      });

      setPreviewStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = cameraEnabled ? stream : null;
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * LOAD ON OPEN
   */

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  /**
   * RESTART PREVIEW
   */

  useEffect(() => {
    if (selectedCamera || selectedMic) {
      startPreview();
    }
  }, [selectedCamera, selectedMic, cameraEnabled, micEnabled]);

  /**
   * CLEANUP
   */

  useEffect(() => {
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [previewStream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-neutral-950 border border-white/10 p-6">
        {/* TITLE */}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Device Setup</h2>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* VIDEO PREVIEW */}

        <div className="w-full h-[320px] rounded-2xl overflow-hidden bg-black mb-6 border border-white/10">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {/* CAMERA SELECT */}

        <div className="mb-4">
          <label className="text-sm text-neutral-400 block mb-2">Camera</label>

          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full h-[52px] rounded-xl bg-neutral-900 border border-white/10 px-4 text-white"
          >
            {cameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || "Camera"}
              </option>
            ))}
          </select>
        </div>

        {/* MICROPHONE SELECT */}

        <div className="mb-6">
          <label className="text-sm text-neutral-400 block mb-2">
            Microphone
          </label>

          <select
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
            className="w-full h-[52px] rounded-xl bg-neutral-900 border border-white/10 px-4 text-white"
          >
            {microphones.map((mic) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || "Microphone"}
              </option>
            ))}
          </select>
        </div>

        {/* TOGGLES */}

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setCameraEnabled(!cameraEnabled)}
            className={`
                            px-5 h-[46px] rounded-xl font-medium
                            ${
                              cameraEnabled
                                ? "bg-indigo-600 text-white"
                                : "bg-neutral-800 text-neutral-400"
                            }
                        `}
          >
            Camera {cameraEnabled ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setMicEnabled(!micEnabled)}
            className={`
                            px-5 h-[46px] rounded-xl font-medium
                            ${
                              micEnabled
                                ? "bg-indigo-600 text-white"
                                : "bg-neutral-800 text-neutral-400"
                            }
                        `}
          >
            Mic {micEnabled ? "ON" : "OFF"}
          </button>
        </div>

        {/* CONTINUE */}

        <button
          onClick={() =>
            onContinue({
              cameraId: selectedCamera,
              micId: selectedMic,
              cameraEnabled,
              micEnabled,
            })
          }
          className="
                        w-full
                        h-[56px]
                        rounded-2xl
                        bg-gradient-to-r
                        from-indigo-600
                        to-purple-700
                        text-white
                        font-semibold
                    "
        >
          Continue
        </button>
      </div>
    </div>
  );
}
