import type { Message, User } from "contentapi-ts-bindings/dist/Views";

export interface Chunk {
  comments: Array<Message>;
}

export function span<T>(arr: T[], condition: (x: T) => boolean): [T[], T[]] {
  const index = arr.findIndex((x) => !condition(x));
  return index === -1 ? [arr, []] : [arr.slice(0, index), arr.slice(index)];
}

export type Pair<T> = [T, T] | [T];

export function pairs<T>(arr: T[]): Pair<T>[] {
  if (arr.length === 0) return [];
  else if (arr.length === 1) return [[arr[0]]];
  const ret = [];
  for (let i = 1; i < arr.length; i++) {
    ret.push([arr[i - 1], arr[i]]);
  }
  return ret as [T, T][];
}

export function mergePairs<T>(arr: Pair<T>[]): T[] {
  if (arr.length === 0) return [];
  const [head] = arr[0];
  return [head].concat(arr.flatMap((x) => (x.length === 1 ? [] : [x[1]])));
}

/**
 * This compares each couple of elements in equality in pairs
 * until condition is false.
 * If there is a lone pair, it WILL be considered truthy? This is
 * subject to change depending on if this behaviour is
 * desired or not.
 */
export function spanPair<T>(
  arr: T[],
  condition: (x: T, y: T) => boolean
): [T[], T[]] {
  const p = span(pairs(arr), (x: Pair<T>) =>
    x.length === 1 ? true : condition(...x)
  );
  const [head, ...tail] = mergePairs(p[1]);
  return [p[0].length > 0 ? mergePairs(p[0]) : [head], tail || []];
}

export type MessageWithUser = Message & { user?: User };

export function attachUser(msg: Message, users: User[]): MessageWithUser {
  return { ...msg, user: users.find((u) => u.id === msg.createUserId) };
}

export interface ActivityChunk extends Chunk {
  contentId: number;
}

export interface ChatChunk extends Chunk {
  contentId: number;
}

export type ChunkBreakCondition = (
  x: MessageWithUser,
  y: MessageWithUser
) => boolean;

const activityPair = (x: Message, y: Message) => x.contentId === y.contentId;

// TODO: check for date splitting
const chatPair = (x: MessageWithUser, y: MessageWithUser) =>
  x.createUserId === y.createUserId &&
  x.contentId === y.contentId &&
  x.user?.avatar === y.user?.avatar &&
  x.user?.username === y.user?.username &&
  x.values?.n === y.values?.n &&
  x.values?.a === y.values?.a;

export function generateChunks(
  msgs: Message[],
  users: User[],
  condition: ChunkBreakCondition
): MessageWithUser[][] {
  const msgsWithUser = msgs.map((x) => attachUser(x, users));
  const recur = (x: MessageWithUser[]): MessageWithUser[][] => {
    if (x === undefined || x.length === 0) return [];
    const s = spanPair(x, condition);
    return [s[0]].concat(recur(s[1]));
  };
  return recur(msgsWithUser);
}

export function generateChatChunks(
  msgs: Message[],
  users: User[]
): MessageWithUser[][] {
  return generateChunks(msgs, users, chatPair);
}
