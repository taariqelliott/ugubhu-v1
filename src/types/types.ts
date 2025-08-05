import { IAudioMetadata } from "music-metadata";
import { SVGProps } from "react";

export type AudioFile = {
  uuid: string;
  file: File;
  metadata: IAudioMetadata | undefined;
  img?: Uint8Array | null;
};

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};
