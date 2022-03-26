import type { Comment } from "./Comment";
import type { Content } from "./Content";
import type { User } from "./User";

export type RequestData = {
  content?: Array<Content>;
  subpages?: Array<Content>;
  user?: Array<User>;
  message?: Array<Comment>;
};
