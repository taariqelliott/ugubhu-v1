import { ChangeEvent, SVGProps, useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import { IAudioMetadata, parseBlob } from "music-metadata";
import { useWavesurfer } from "@wavesurfer/react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Spinner,
} from "@heroui/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/react";
import {
  IconColorFilter,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconRepeat,
  IconRepeatOff,
  IconTrash,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons-react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export default function AudioPlayer() {
  // State Variables
  const [fileList, setFileList] = useState<File[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<File | undefined>();
  const [audioInstance, setAudioInstance] = useState<Howl | undefined>();
  const [, setAudioMeta] = useState<IAudioMetadata>();
  const [waveLoaded, setWaveLoaded] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [, setIsSeeking] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);

  // Refs
  const waveContainerRef = useRef(null);
  const waveColorInputRef = useRef<HTMLInputElement>(null);
  const progressColorInputRef = useRef<HTMLInputElement>(null);
  const currentWaveColorRef = useRef<string>();
  const currentProgressColorRef = useRef<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldAutoPlayRef = useRef<boolean>(false);

  // Wavesurfer Hook
  const { wavesurfer: wavePlayer, currentTime: playTime } = useWavesurfer({
    container: waveContainerRef,
    url: audioUrl,
    barWidth: 0.7,
    barRadius: 10,
    cursorWidth: 2,
    barGap: 1,
    // dragToSeek: true,
    backend: "WebAudio",
  });

  // Utility Functions
  const generateHexColor = (): string => {
    const hexChars = "0123456789abcdef";
    let hexValue = "#";
    for (let i = 0; i < 6; i++) {
      hexValue += hexChars[Math.floor(Math.random() * hexChars.length)];
    }
    return hexValue;
  };

  const formatDuration = (seconds: number) =>
    [seconds / 60, seconds % 60]
      .map((v) => `0${Math.floor(v)}`.slice(-2))
      .join(":");

  const getAudioFormat = (file: File | undefined): string | undefined => {
    if (!file) return undefined;

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
      case "audio/m4a":
      case "audio/x-m4a":
        return "m4a";
      default:
        return undefined;
    }
  };

  // Event Handlers
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFileList((prev) => [...prev, uploadedFile]);

    const fileUrl = URL.createObjectURL(uploadedFile);
    if (!isPlaying) {
      setAudioUrl(fileUrl);
      setCurrentFile(uploadedFile);
    }

    let currentWave = currentWaveColorRef.current;
    let currentProgress = currentProgressColorRef.current;

    if (!currentWave) {
      currentWave = generateHexColor();
      currentWaveColorRef.current = currentWave;
    }

    if (!currentProgress) {
      currentProgress = generateHexColor();
      currentProgressColorRef.current = currentProgress;
    }

    if (waveColorInputRef.current) {
      waveColorInputRef.current.value = currentWave;
    }
    if (progressColorInputRef.current) {
      progressColorInputRef.current.value = currentProgress;
    }

    (async () => {
      try {
        const parsedMeta = await parseBlob(uploadedFile);
        setAudioMeta(parsedMeta);
        if (parsedMeta) {
          console.log(parsedMeta);
        }
      } catch (error) {
        console.error("Error parsing metadata:", error);
      }
    })();
    fileInputRef.current?.blur();
  };

  const handleWaveColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    currentWaveColorRef.current = newColor;
    wavePlayer?.setOptions({ waveColor: newColor });
  };

  const handleProgressColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    currentProgressColorRef.current = newColor;
    wavePlayer?.setOptions({ progressColor: newColor });
  };

  const startPlayback = () => {
    if (!audioInstance) return;

    if (!audioInstance?.playing()) {
      setIsPlaying(true);
      audioInstance?.play();
      wavePlayer?.play();
      setTimeout(() => {
        audioInstance?.fade(audioInstance.volume(), 1, 100);
      }, 100);
    }
  };

  const pausePlayback = () => {
    if (audioInstance?.playing()) {
      setIsPlaying(false);
      audioInstance?.fade(audioInstance.volume(), 0, 100);
      setTimeout(() => {
        audioInstance?.pause();
        wavePlayer?.pause();
      }, 100);
    }
  };

  const muteAudio = () => {
    audioInstance?.fade(audioInstance.volume(), 0, 200);
    setIsMuted(true);
  };

  const unmuteAudio = () => {
    audioInstance?.fade(audioInstance.volume(), 1, 200);
    setIsMuted(false);
  };

  const playPauseWithSpace = (event: KeyboardEvent) => {
    if (!audioInstance) return;

    if (event.key === " ") {
      event.preventDefault();
      if (!audioInstance?.playing()) {
        startPlayback();
      } else {
        pausePlayback();
      }
    }
  };

  const switchAudio = (file: File) => {
    if (currentFile === file) return;

    const wasPlaying = isPlaying;
    const newBlob = new Blob([file], { type: file.type });
    const fileUrl = URL.createObjectURL(newBlob);
    setCurrentFile(file);
    setAudioUrl(fileUrl);

    if (wasPlaying) {
      shouldAutoPlayRef.current = true;
    }

    if (waveColorInputRef.current && currentWaveColorRef.current) {
      waveColorInputRef.current.value = currentWaveColorRef.current;
    }
    if (progressColorInputRef.current && currentProgressColorRef.current) {
      progressColorInputRef.current.value = currentProgressColorRef.current;
    }
  };

  const randomizeHex = () => {
    if (waveColorInputRef.current) {
      const newWaveColor = generateHexColor();
      waveColorInputRef.current.value = newWaveColor;
      currentWaveColorRef.current = newWaveColor;
      wavePlayer?.setOptions({ waveColor: newWaveColor });
    }

    if (progressColorInputRef.current) {
      const newProgressColor = generateHexColor();
      progressColorInputRef.current.value = newProgressColor;
      currentProgressColorRef.current = newProgressColor;
      wavePlayer?.setOptions({ progressColor: newProgressColor });
    }
  };

  // Effects
  useEffect(() => {
    if (audioInstance) {
      audioInstance.stop();
      audioInstance.unload();
    }

    if (audioUrl && currentFile) {
      const audioFormat = getAudioFormat(currentFile);
      if (audioFormat) {
        const newAudio = new Howl({
          src: [audioUrl],
          format: audioFormat,
          html5: false,
        });

        setAudioInstance(newAudio);
        setWaveLoaded(false);
        setIsPlaying(false);
        setIsMuted(false);
      } else {
        console.error("Could not determine audio format for playback.");
      }
    }

    return () => {
      if (audioInstance) {
        audioInstance.stop();
        audioInstance.unload();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl, currentFile]);

  useEffect(() => {
    if (
      wavePlayer &&
      currentWaveColorRef.current &&
      currentProgressColorRef.current
    ) {
      wavePlayer.setOptions({
        waveColor: currentWaveColorRef.current,
        progressColor: currentProgressColorRef.current,
      });
    }
  }, [wavePlayer]);

  useEffect(() => {
    if (!wavePlayer || !audioInstance) return;

    wavePlayer.setVolume(0);

    wavePlayer.on("ready", () => {
      setWaveLoaded(true);

      setTimeout(() => {
        wavePlayer.setOptions({});
      }, 1);

      if (wavePlayer.getDuration() < 3) {
        wavePlayer.setOptions({ backend: "MediaElement" });
      }

      if (shouldAutoPlayRef.current) {
        shouldAutoPlayRef.current = false;
        startPlayback();
      }
    });

    const handleWaveClick = () => {
      const clickTime = wavePlayer.getCurrentTime();
      audioInstance.seek(clickTime);
    };

    const handleSeekStart = () => {
      setIsSeeking(true);
      wavePlayer.pause();
    };

    const handleSeekEnd = () => {
      const newTime = wavePlayer.getCurrentTime();
      audioInstance.seek(newTime);
      if (isPlaying) {
        wavePlayer.play();
      }
      setIsSeeking(false);
    };

    const handleTrackEnd = () => {
      wavePlayer.stop();
      audioInstance.stop();
      wavePlayer.setTime(0);
      setIsPlaying(false);
      if (isLooping) {
        startPlayback();
      }
    };

    wavePlayer.on("click", handleWaveClick);
    wavePlayer.on("dragstart", handleSeekStart);
    wavePlayer.on("dragend", handleSeekEnd);
    wavePlayer.on("finish", handleTrackEnd);

    return () => {
      wavePlayer.un("click", handleWaveClick);
      wavePlayer.un("dragstart", handleSeekStart);
      wavePlayer.un("dragend", handleSeekEnd);
      wavePlayer.un("finish", handleTrackEnd);
    };
  }, [wavePlayer, audioInstance, isPlaying, isLooping]);

  useEffect(() => {
    window.addEventListener("keydown", playPauseWithSpace);

    return () => {
      window.removeEventListener("keydown", playPauseWithSpace);
    };
  }, [audioInstance]);

  const VerticalDotsIcon = ({
    size = 24,
    width,
    height,
    ...props
  }: IconSvgProps) => {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        focusable="false"
        height={size || height}
        role="presentation"
        viewBox="0 0 24 24"
        width={size || width}
        {...props}
      >
        <path
          d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
          fill="currentColor"
        />
      </svg>
    );
  };

  const deleteItem = (file: File) => {
    const newFileList = fileList.filter((item) => item.name != file.name);
    setFileList(newFileList);
    if (currentFile?.name === file.name) {
      audioInstance?.stop();
      audioInstance?.unload();
      wavePlayer?.destroy();
      wavePlayer?.empty();
      setCurrentFile(undefined);
    }
  };

  return (
    <section className="flex items-center w-full justify-center h-full flex-col gap-4">
      <section className="flex flex-col items-center justify-between mx-auto md:flex-row w-[75%]">
        <p className="font-coupri text-default-600">
          {currentFile
            ? currentFile.name
            : fileList.length > 0
            ? "Select a new track"
            : "Upload a new track"}
        </p>
        <p className="text-center font-coupri text-default-600">
          {formatDuration(playTime)} /{" "}
          {formatDuration(wavePlayer?.getDuration()!)}
        </p>
      </section>
      <section
        id="waveform-visualization"
        className={`w-[75%] h-[128px] ${
          currentFile && !waveLoaded ? "flex justify-center items-center" : ""
        }`}
        ref={waveContainerRef}
      >
        <section className={`${waveLoaded && "hidden"}`}>
          {currentFile && !waveLoaded ? (
            <Spinner
              className={`${waveLoaded && "hidden"}`}
              size="lg"
              color="secondary"
            />
          ) : (
            ""
          )}
        </section>
      </section>

      <section className="flex items-center justify-center gap-2">
        <input
          className="h-12 w-12 border-0 p-0 [border-radius:0.375rem] [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch-wrapper]:[border-radius:0] [&::-webkit-color-swatch-wrapper]:border-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:[border-radius:0.375rem]"
          ref={progressColorInputRef}
          type="color"
          defaultValue={"#000"}
          disabled={!waveLoaded}
          onChange={handleProgressColorChange}
          aria-label="Change progress color"
        />
        <input
          className="h-12 w-12 border-0 p-0 [border-radius:0.375rem] [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch-wrapper]:[border-radius:0] [&::-webkit-color-swatch-wrapper]:border-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:[border-radius:0.375rem]"
          ref={waveColorInputRef}
          type="color"
          defaultValue={"#000"}
          disabled={!waveLoaded}
          onChange={handleWaveColorChange}
          aria-label="Change waveform color"
        />
      </section>

      <section className="flex items-center justify-between gap-4 font-coupri">
        <Button
          color="secondary"
          className="w-12 text-zinc-50"
          onPress={isPlaying ? pausePlayback : startPlayback}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? <IconPlayerPauseFilled /> : <IconPlayerPlayFilled />}
        </Button>

        <Button
          color="secondary"
          className="w-12 text-zinc-50"
          onPress={isMuted ? unmuteAudio : muteAudio}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? <IconVolumeOff /> : <IconVolume />}
        </Button>

        <Button
          className={`w-12 text-zinc-50 ${
            currentFile ? "bg-secondary" : `bg-secondary-300 opacity-50`
          }`}
          color="secondary"
          onPress={randomizeHex}
          disabled={!waveLoaded}
        >
          <IconColorFilter />
        </Button>

        <Button
          className={`${
            isLooping ? "bg-secondary" : `bg-secondary-300 opacity-50`
          } text-zinc-50 w-12`}
          onPress={() => {
            setIsLooping((prev) => !prev);
          }}
          aria-label={isLooping ? "Disable loop mode" : "Enable loop mode"}
        >
          {isLooping ? <IconRepeat /> : <IconRepeatOff />}
        </Button>
      </section>
      <Input
        type="file"
        name="audioUpload"
        color="secondary"
        className="w-[75%]"
        ref={fileInputRef}
        onChange={handleFileUpload}
        aria-label="Upload Audio File"
        id="audio-upload-input"
        accept="audio/*"
      />
      <Table
        isHeaderSticky
        className="w-[75%]"
        selectionMode="single"
        aria-label="File selection table"
        isVirtualized
        classNames={{
          table: "min-h-[300px]",
        }}
        maxTableHeight={300}
        rowHeight={40}
      >
        <TableHeader>
          <TableColumn align="start" width="33%">
            NAME
          </TableColumn>
          <TableColumn align="center" width="33%">
            TYPE
          </TableColumn>
          <TableColumn align="end" width="33%">
            ACTIONS
          </TableColumn>
        </TableHeader>

        <TableBody emptyContent={"No songs are uploaded."}>
          {fileList.map((item) => (
            <TableRow key={item.name} onClick={() => switchAudio(item)}>
              <TableCell className="text-secondary-700">{item.name}</TableCell>
              <TableCell className="text-success-700">
                {item.type.substring(item.type.indexOf("/") + 1)}
              </TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <VerticalDotsIcon className="text-default-300" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem
                      color="default"
                      onClick={() => deleteItem(item)}
                      key="delete"
                    >
                      <div className="flex items-center justify-start gap-4">
                        <IconTrash size={16} className="text-danger" />
                        <span className="text-danger">Delete</span>
                      </div>
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
