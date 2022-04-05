export type CommentValues = {
  m?: string;
  n?: string;
  a?: string;
};

export type Comment = {
  contentId: number;
  createDate: string;
  createUserId: number;
  deleted: number;
  editDate: string | null;
  editUserId: string | null;
  edited: number;
  id: number;
  module: any;
  receiveUserId: number;
  text: string;
  uidsInText: Array<number>;
  values: CommentValues;
};
