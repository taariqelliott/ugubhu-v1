import { IAudioMetadata } from "music-metadata";
import { SVGProps } from "react";

export type AudioFile = {
  uuid: string;
  file: File;
  metadata: IAudioMetadata | undefined;
};

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};
