import type { User } from "@/lib/qcs/types/User";
import type { Comment } from "@/lib/qcs/types/Comment";
import { defineStore } from "pinia";
import type { Content } from "@/lib/qcs/types/Content";
import type * as WebsocketResult from "@/lib/qcs/types/WebsocketResult";
import { useIdentityStore } from "./identity";

export type UserStatus = {
  id: number;
  username: string;
  status: string;
};

export interface Chunk {
  firstId: number;
  lastId: number;
  comments: Array<Comment>;
}

export interface CommentChunk extends Chunk {
  uid: number;
  avatar: string;
  nickname?: string;
  username: string;
  date: string;
}

export type CommentChunkContainer = {
  [key: number]: Array<CommentChunk>;
};

export interface ActivityChunk extends Chunk {
  contentId: number;
}

export type CommentContainer = {
  // room id, comments
  [key: number]: Array<Comment>;
};

export type UserContainer = {
  // user id, user
  [key: number]: User;
};

export type UserlistContainer = {
  // room id, userlist
  [key: string]: WebsocketResult.StatusData;
};

export enum ContentState {
  partial,
  full,
}

export type ContentBox = {
  data: Content;
  state: ContentState;
};

export type ContentContainer = {
  // room id, content
  [key: number]: ContentBox;
};

export type WebsocketResultContainer = {
  [key: string]: WebsocketResult.WebsocketResult;
};

export type Notification = {
  count: number;
  lastCommentDate: string;
  contentId: number;
};

export type NotificationContainer = {
  [key: number]: Notification;
};

export type SharedStoreState = {
  contents: ContentContainer;
  comments: Array<Comment>;
  activityChunks: Array<ActivityChunk>;
  commentChunks: CommentChunkContainer;
  users: UserContainer;
  userlists: UserlistContainer;
  // userlists: Map<number, WebsocketResult.StatusData>;
  myStatuses: WebsocketResult.StatusData;
  wsResultStore: WebsocketResultContainer;
  messageInitialLoad: boolean;
  notifications: NotificationContainer;
};

export const useSharedStore = defineStore({
  id: "sharedState",
  state: () => {
    return {
      contents: {},
      comments: [],
      activityChunks: [],
      commentChunks: {},
      users: {},
      userlists: {},
      myStatuses: {},
      wsResultStore: {},
      messageInitialLoad: false,
      notifications: {},
    } as SharedStoreState;
  },
  actions: {
    updateActivityChunks(comment: Comment) {
      const { contentId } = comment;
      const pushChunk = () => {
        this.activityChunks.push({
          firstId: comment.id,
          lastId: comment.id,
          contentId,
          comments: [comment],
        });
      };
      const current = this.activityChunks.at(-1);
      if (this.activityChunks.length === 0) {
        pushChunk();
      } else if (current?.contentId !== contentId) {
        pushChunk();
      } else if (current) {
        current.comments.push(comment);
        current.lastId = comment.id;
      }
    },
    updateCommentChunks(comment: Comment) {
      const roomId = comment.contentId;
      const user = this.users[comment.createUserId];
      const username = user.username;
      const nickname = comment.values.n;
      const avatar = comment.values.a || user.avatar;
      const pushChunk = () => {
        this.commentChunks[roomId].push({
          firstId: comment.id,
          lastId: comment.id,
          uid: user.id,
          username: username,
          nickname: nickname,
          avatar: avatar,
          comments: [],
          date: comment.createDate,
        });
      };

      if (!this.commentChunks[roomId]) {
        this.commentChunks[roomId] = [];
        pushChunk();
      } else if (this.commentChunks[roomId].length === 0) {
        pushChunk();
      } else {
        // [this.commentChunks[roomId].length - 1]
        const current = this.commentChunks[roomId].at(-1);
        if (current) {
          const currentComment = current.comments.at(-1);
          if (currentComment) {
            const currentDate = new Date(currentComment.createDate);
            const commentDate = new Date(comment.createDate);
            const diff = Math.floor(
              (commentDate.getTime() - currentDate.getTime()) / 60000
            );
            if (
              current.uid !== user.id ||
              current.avatar !== avatar ||
              current.username !== username ||
              current.nickname !== nickname ||
              diff >= 5
            ) {
              pushChunk();
            }
          }
        }
      }

      const lastChunk = this.commentChunks[roomId]?.at(-1);
      if (lastChunk) {
        lastChunk.comments.push(comment);
        lastChunk.lastId = comment.id;
      }
    },
    sortComments() {
      this.comments = this.comments.reduce(function (
        p: Array<Comment>,
        c: Comment
      ) {
        // if the next object's id is not found in the output array
        // push the object into the output array
        if (
          !p.some(function (el: Comment) {
            return el.id === c.id;
          })
        )
          p.push(c);
        return p;
      },
      []);
      this.comments = this.comments.sort((a, b) => {
        return a.id - b.id;
      });
    },
    // this rebuilds the comment chunks, useful for when you inject a lot of comments
    // into the store at once like when you load a page.
    rebuildCommentChunks(roomId: number) {
      const comments = this.comments.filter((x) => x.contentId === roomId);
      this.commentChunks[roomId] = [];
      comments.map((x) => this.updateCommentChunks(x));
    },
    rebuildActivityChunks() {
      this.activityChunks = [];
      this.comments.map((x) => this.updateActivityChunks(x));
    },
    addComment(comment: Comment) {
      this.comments.push(comment);
      this.updateCommentChunks(comment);
      this.updateActivityChunks(comment);
      const n = this.notifications[comment.contentId];
      if (n) {
        n.count += 1;
        if (comment.createDate > n.lastCommentDate)
          n.lastCommentDate = comment.createDate;
      } else {
        this.notifications[comment.contentId] = {
          count: 1,
          lastCommentDate: comment.createDate,
          contentId: comment.contentId,
        };
      }
    },
    deleteFromChunks(chunks: Array<Chunk>, commentId: number) {
      for (let i = 0; i < chunks.length; i++) {
        if (chunks[i].firstId <= commentId && chunks[i].lastId >= commentId) {
          const index = chunks[i].comments.findIndex((x) => x.id === commentId);
          if (index > -1) {
            chunks[i].comments.splice(index, 1);
            if (chunks[i].comments.length === 0) {
              chunks.splice(i, 1);
            } else {
              const first = chunks[i]?.comments.at(0);
              if (first) chunks[i].firstId = first.id;
              const last = chunks[i]?.comments.at(-1);
              if (last) chunks[i].lastId = last.id;
            }
          } else {
            break;
          }
        }
      }
    },
    editInChunks(chunks: Array<Chunk>, comment: Comment) {
      const commentId = comment.id;
      for (let i = 0; i < chunks.length; i++) {
        if (chunks[i].firstId <= commentId && chunks[i].lastId >= commentId) {
          const index = chunks[i].comments.findIndex((x) => x.id === commentId);
          if (index > -1) {
            chunks[i].comments[index] = comment;
          } else {
            break;
          }
        }
      }
    },
    deleteComment(comment: Comment) {
      const { id, contentId } = comment;
      const commentIndex = this.comments.findIndex((x) => x.id === id);
      if (commentIndex > -1) {
        this.comments.splice(commentIndex, 1);
        const room = this.commentChunks[contentId];
        this.deleteFromChunks(room, id);
        this.deleteFromChunks(this.activityChunks, id);
      }
    },
    editComment(comment: Comment) {
      const { id, contentId } = comment;
      const commentIndex = this.comments.findIndex((x) => x.id === id);
      if (commentIndex > -1) {
        // detecting a rethread
        const oldContentId = this.comments[commentIndex].contentId;
        this.comments[commentIndex] = comment;
        if (oldContentId !== comment.contentId) {
          this.sortComments();
          this.rebuildCommentChunks(contentId);
          this.rebuildCommentChunks(oldContentId);
          this.rebuildActivityChunks();
        } else {
          const room = this.commentChunks[contentId];
          this.editInChunks(room, comment);
          this.editInChunks(this.activityChunks, comment);
        }
      } else {
        const oldestInRoom = this.comments.find(
          (x) => x.contentId === contentId
        );
        if (oldestInRoom && oldestInRoom.id < id) {
          this.comments.push(comment);
          this.sortComments();
          this.rebuildCommentChunks(contentId);
          this.rebuildActivityChunks();
        }
      }
    },
    getRequestData(
      requestId: string
    ): undefined | WebsocketResult.WebsocketResult {
      if (this.wsResultStore[requestId]) {
        const data = Object.assign({}, this.wsResultStore[requestId]);
        delete this.wsResultStore[requestId];
        return data;
      }
      return undefined;
    },
    addUser(user: User) {
      const identity = useIdentityStore();
      if (identity.id === user.id) {
        identity.username = user.username;
        identity.avatar = user.avatar;
      }
      this.users[user.id] = user;
    },
    addContent(content: Content, state: ContentState) {
      if (this.contents[content.id]) {
        Object.assign(this.contents[content.id], content);
      } else
        this.contents[content.id] = {
          data: content,
          state,
        };
    },
  },
  share: {
    enable: true,
    initialize: true,
  },
});
