import { ReactElement } from "react";

export const LAYOUT: any = {
  main: 'main',
  noauth: 'noauth',
  minimal: 'minimal'
};

export interface Props {
  children: ReactElement;
  variant?: "main" | "minimal" | "noauth";
}
export default LAYOUT;
