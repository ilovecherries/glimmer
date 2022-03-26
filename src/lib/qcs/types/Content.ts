export type ContentValues = {
  markupLang: string;
  photos: Array<string>;
};

export type ContentVotes = {
  bad: number;
  ok: number;
  good: number;
};

export type Content = {
  commentCount: number;
  contentType: number;
  createDate: string;
  createUserId: number;
  deleted: number;
  description: string | null;
  hash: string;
  id: number;
  keywords: Array<string>;
  lastCommentDate: string;
  lastCommentId: number;
  lastRevisionDate: string;
  lastRevisionId: number;
  literalType: string;
  meta: string | null;
  name: string;
  parentId: number;
  permissions: Map<number, string>;
  text: string;
  values: ContentValues;
  votes: ContentVotes;
  watchCount: number;
};
