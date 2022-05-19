import { ContentAPI } from "contentapi-ts-bindings/Helpers";

export const api = new ContentAPI(import.meta.env.VITE_API_DOMAIN);

export const GetSearchBackDate = function (
  hours?: number,
  date?: Date
): string {
  hours = hours || 0;
  const back = date || new Date();
  back.setHours(back.getHours() - hours);
  return back.toISOString().substring(0, 13);
};
