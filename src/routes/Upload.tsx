import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Howl, Howler } from "howler";
import { IFormat, parseBlob } from "music-metadata";
import { useWavesurfer } from "@wavesurfer/react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconRepeat,
  IconRepeatOff,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons-react";
import { Spinner } from "@heroui/react";

export default function AudioPlayer() {
  // Audio state
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioFile, setAudioFile] = useState<File | undefined>();
  const [sound, setSound] = useState<Howl | undefined>();
  const [audioMetadata, setAudioMetadata] = useState<IFormat>();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Playback state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isSoundPlaying, setIsSoundPlaying] = useState<boolean>(false);
  const [_, setIsSeeking] = useState<boolean>(false);
  const [isLoopActivated, setIsLoopModeActivated] = useState<boolean>(false);

  // Color state
  const [currentWaveColor, setCurrentWaveColor] = useState<string>();
  const [currentProgressColor, setCurrentProgressColor] = useState<string>();

  // Refs
  const containerRef = useRef(null);
  const waveColorInputRef = useRef<HTMLInputElement>(null);
  const progressColorInputRef = useRef<HTMLInputElement>(null);

  // Utility functions
  const generateRandomHex = (): string => {
    const hexCharacters: string = "0123456789abcdef";
    let hexValue = "#";
    for (let i = 0; i < 6; i++) {
      hexValue +=
        hexCharacters[Math.floor(Math.random() * hexCharacters.length)];
    }
    return hexValue;
  };

  const formatTime = (seconds: number) =>
    [seconds / 60, seconds % 60]
      .map((v) => `0${Math.floor(v)}`.slice(-2))
      .join(":");

  const getAudioFormat = (file: File | undefined): string | undefined => {
    if (!file) {
      return undefined;
    }
    switch (file.type) {
      case "audio/mpeg":
      case "audio/mpg":
        return "mp3";
      case "audio/wav":
        return "wav";
      case "audio/ogg":
        return "ogg";
      case "video/mp4":
        return "mp4";
      case "video/webm":
        return "webm";
      default:
        return undefined;
    }
  };

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const fadeSound = (
    sound: Howl,
    from: number,
    to: number,
    duration: number
  ) => {
    return new Promise<void>((resolve) => {
      sound.fade(from, to, duration);
      setTimeout(resolve, duration);
    });
  };

  // Wavesurfer hook
  const { wavesurfer, currentTime } = useWavesurfer({
    container: containerRef,
    waveColor: currentWaveColor,
    progressColor: currentProgressColor,
    url: audioUrl,
    barWidth: 0.7,
    barRadius: 10,
    cursorWidth: 2,
    barGap: 1,
    dragToSeek: true,
    backend: "WebAudio",
  });

  // Effects
  useEffect(() => {
    if (sound) {
      sound.stop();
      sound.unload();
    }

    if (audioUrl && audioFile) {
      const format = getAudioFormat(audioFile);
      if (format) {
        const newSound = new Howl({
          src: [audioUrl],
          format: format,
          html5: true,
        });

        setSound(newSound);
        setIsLoaded(false);
        setIsSoundPlaying(false);
        setIsAudioMuted(false);
      } else {
        console.error("Could not determine audio format for playback.");
      }
    }

    return () => {
      if (sound) {
        sound.stop();
        sound.unload();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl, audioFile]);

  // Event handlers
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) {
      return;
    }

    const audioObjectURL = URL.createObjectURL(uploadedFile);
    setAudioUrl(audioObjectURL);
    setAudioFile(uploadedFile);

    const newWaveColor = generateRandomHex();
    const newProgressColor = generateRandomHex();
    setCurrentWaveColor(newWaveColor);
    setCurrentProgressColor(newProgressColor);

    // Update input defaults to current colors
    if (waveColorInputRef.current) {
      waveColorInputRef.current.value = newWaveColor;
    }
    if (progressColorInputRef.current) {
      progressColorInputRef.current.value = newProgressColor;
    }

    (async () => {
      try {
        const metadata = await parseBlob(uploadedFile);
        console.log(metadata);
        setAudioMetadata(metadata.format);
      } catch (error) {
        console.error("Error parsing metadata:", error);
      }
    })();
  };

  const handleWaveColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    wavesurfer?.setOptions({ waveColor: newColor });
  };

  const handleProgressColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    wavesurfer?.setOptions({ progressColor: newColor });
  };

  const playSound = async () => {
    if (!sound) {
      return;
    }
    if (!sound?.playing()) {
      setIsSoundPlaying(true);
      sound?.play();
      wavesurfer?.play();
      await delay(50);
      await fadeSound(sound, sound.volume(), 1, 50);
    }
  };

  const pauseSound = async () => {
    if (sound?.playing()) {
      setIsSoundPlaying(false);
      await fadeSound(sound, sound.volume(), 0, 100);
      sound?.pause();
      wavesurfer?.pause();
    }
  };

  const muteAudio = () => {
    sound?.fade(sound.volume(), 0, 100);
    setIsAudioMuted(true);
  };

  const unmuteAudio = () => {
    sound?.fade(sound.volume(), 1, 100);
    setIsAudioMuted(false);
  };

  useEffect(() => {
    if (!wavesurfer || !sound) return;

    wavesurfer.setVolume(0);

    wavesurfer.on("ready", () => {
      setIsLoaded(true);

      setTimeout(() => {
        wavesurfer.setOptions({});
      }, 1);

      if (wavesurfer.getDuration() < 3) {
        wavesurfer.setOptions({ backend: "MediaElement" });
      }
    });

    const handleClick = () => {
      const newTime = wavesurfer.getCurrentTime();
      sound.seek(newTime);
    };

    const handleDragStart = () => {
      setIsSeeking(true);
      wavesurfer.pause();
    };

    const handleDragEnd = () => {
      const newTime = wavesurfer.getCurrentTime();
      sound.seek(newTime);
      wavesurfer.play();
      setIsSeeking(false);
    };

    const handleSongEnd = () => {
      wavesurfer.stop();
      sound.stop();
      wavesurfer.setTime(0);
      setIsSoundPlaying(false);
      if (isLoopActivated) {
        playSound();
      }
    };

    wavesurfer.on("click", handleClick);
    wavesurfer.on("dragstart", handleDragStart);
    wavesurfer.on("dragend", handleDragEnd);
    wavesurfer.on("finish", handleSongEnd);

    return () => {
      wavesurfer.un("click", handleClick);
      wavesurfer.un("dragstart", handleDragStart);
      wavesurfer.un("dragend", handleDragEnd);
      wavesurfer.un("finish", handleSongEnd);
    };
  }, [wavesurfer, sound, isSoundPlaying, isLoopActivated]);

  return (
    <section className="flex items-center w-[75%] justify-center flex-col gap-2">
      <section
        id="wavesurfer"
        className={`w-full h-[128px] ${
          audioFile && !isLoaded ? "flex justify-center items-center" : ""
        }`}
        ref={containerRef}
      >
        <div className={`${isLoaded && "hidden"}`}>
          {audioFile && !isLoaded ? (
            <Spinner
              className={`${isLoaded && "hidden"}`}
              size="lg"
              color="secondary"
            />
          ) : (
            ""
          )}
        </div>
      </section>
      <p className="font-coupri">
        {!audioFile ? "Upload a track" : `${audioFile!.name}`}
      </p>

      <section className="flex items-center justify-center flex-col">
        <p className="text-center font-coupri text-2xl">
          {formatTime(currentTime)} / {formatTime(wavesurfer?.getDuration()!)}
        </p>
        <div>
          <input
            ref={progressColorInputRef}
            type="color"
            defaultValue={currentProgressColor}
            onChange={handleProgressColorChange}
          />
          <input
            ref={waveColorInputRef}
            type="color"
            defaultValue={currentWaveColor}
            onChange={handleWaveColorChange}
          />
        </div>
      </section>

      <Input
        type="file"
        name="audioUpload"
        color="secondary"
        onChange={handleFileChange}
        aria-label="Upload Audio File"
        id="audio-upload-input"
      />

      <section className="flex items-center justify-between gap-4 font-coupri">
        <Button
          color="secondary"
          className="w-24"
          onPress={isSoundPlaying ? pauseSound : playSound}
        >
          {isSoundPlaying ? (
            <IconPlayerPauseFilled />
          ) : (
            <IconPlayerPlayFilled />
          )}
        </Button>

        <Button
          className={`${
            isLoopActivated ? "bg-secondary" : `bg-secondary-300 opacity-50`
          } text-zinc-50 w-24`}
          onPress={() => {
            setIsLoopModeActivated((prev) => !prev);
          }}
        >
          {isLoopActivated ? <IconRepeat /> : <IconRepeatOff />}
        </Button>

        <Button
          color="secondary"
          className="w-24"
          onPress={isAudioMuted ? unmuteAudio : muteAudio}
        >
          {isAudioMuted ? <IconVolumeOff /> : <IconVolume />}
        </Button>
      </section>
    </section>
  );
}
