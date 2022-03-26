import { API_DOMAIN } from "../qcs";

export type User = {
  avatar: string;
  createDate: string;
  deleted: number;
  groups: Array<string>;
  id: number;
  regstered: number;
  special: any;
  super: number;
  type: number;
  username: string;
};

export const avatarUrl = (
  id: string,
  size: number | undefined = undefined
): string =>
  `https://${API_DOMAIN}/api/File/raw/${id}${
    size ? `?size=${size}&crop=true` : ""
  }`;
