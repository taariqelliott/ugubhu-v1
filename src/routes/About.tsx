import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Howl, Howler } from "howler";
import { IFormat, parseBlob } from "music-metadata";
import { ChangeEvent, useEffect, useState } from "react";

export default function AudioPlayer() {
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioFile, setAudioFile] = useState<File | undefined>();
  const [sound, setSound] = useState<Howl | undefined>();
  const [audiometadata, setAudiometadata] = useState<IFormat>();
  const [songDuration, setSongDuration] = useState<number>();
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

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
          onload: () => setSongDuration(newSound.duration()),
        });
        setSound(newSound);
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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) {
      return;
    }
    const audioObjectURL = URL.createObjectURL(uploadedFile);
    setAudioUrl(audioObjectURL);
    setAudioFile(uploadedFile);

    (async () => {
      try {
        const metadata = await parseBlob(uploadedFile);
        console.log(metadata);
        setAudiometadata(metadata.format);
      } catch (error) {
        console.error("Error parsing metadata:", error);
      }
    })();
  };

  const playSound = () => {
    if (!sound?.playing()) {
      sound?.fade(sound.volume(), 1, 200);
      setTimeout(() => {
        sound?.play();
      }, 100);
    }
  };

  const pauseSound = () => {
    if (sound?.playing()) {
      sound?.fade(sound.volume(), 0, 200);
      setTimeout(() => {
        sound?.pause();
      }, 100);
    }
  };

  const muteAudio = () => {
    sound?.fade(sound.volume(), 0, 200);
    setIsAudioMuted(true);
  };

  const unmuteAudio = () => {
    sound?.fade(sound.volume(), 1, 200);
    setIsAudioMuted(false);
  };

  return (
    <section className="flex items-center justify-center flex-col gap-2">
      <Input
        type="file"
        name="audioUpload"
        color="secondary"
        onChange={handleFileChange}
        aria-label="Upload Audio File"
        id="audio-upload-input"
      />

      <div>{songDuration && songDuration > 0 && songDuration}</div>
      {audiometadata && (
        <div>
          <p className="underline text-center">Metadata</p>
          <p className="font-coupri">
            <span className="text-danger-400">Bitrate:</span>{" "}
            {audiometadata.bitrate}
          </p>
          <p className="font-coupri">
            <span className="text-danger-400">Bits Per Sample:</span>{" "}
            {audiometadata.bitsPerSample}
          </p>
          <p className="font-coupri">
            <span className="text-danger-400">Duration:</span>{" "}
            {audiometadata.duration?.toFixed(3)}
          </p>
          <p className="font-coupri">
            <span className="text-danger-400">Sample Rate:</span>{" "}
            {audiometadata.sampleRate}
          </p>
        </div>
      )}
      <section className="flex items-center justify-between w-full">
        <Button color="secondary" className="w-24" onPress={playSound}>
          play
        </Button>
        <Button color="secondary" className="w-24" onPress={pauseSound}>
          pause
        </Button>
        <Button
          color="secondary"
          className="w-24"
          onPress={isAudioMuted ? unmuteAudio : muteAudio}
        >
          {isAudioMuted ? "unmute" : "mute"}
        </Button>
      </section>
    </section>
  );
}
