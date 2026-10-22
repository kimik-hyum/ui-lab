export type PreviewWorkload = "0" | "1.5";

export type SlowPreviewProps = {
  text: string;
  workload: PreviewWorkload;
};

export type PreviewDemoProps = SlowPreviewProps & {
  onTextChange: (text: string) => void;
};
