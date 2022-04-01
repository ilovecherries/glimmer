import type { User } from "@/lib/qcs/types/User";
import type { Comment } from "@/lib/qcs/types/Comment";
import { defineStore } from "pinia";
import type { Content } from "@/lib/qcs/types/Content";
import type { StatusData } from "@/lib/qcs/types/WebsocketResult";

export type UserStatus = {
  id: number;
  username: string;
  status: string;
};

export type CommentChunk = {
  firstId: number;
  lastId: number;
  uid: number;
  avatar: string;
  nickname: string;
  username: string;
  date: Date;
  comments: Array<Comment>;
};

export type CommentChunkContainer = {
  [key: number]: Array<CommentChunk>;
};

export type ActivityChunk = {
  id: number;
  contentId: number;
  comments: Array<Comment>;
};

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
  [key: string]: StatusData;
};

export type ContentContainer = {
  // room id, content
  [key: number]: Content;
};

export type SharedStoreState = {
  contents: ContentContainer;
  comments: Array<Comment>;
  activityChunks: Array<ActivityChunk>;
  commentChunks: CommentChunkContainer;
  users: UserContainer;
  userlists: UserlistContainer;
  myStatuses: StatusData;
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
      runningWs: false,
    } as SharedStoreState;
  },
  actions: {
    updateActivityChunks(comment: Comment) {
      const { contentId } = comment;
      const pushChunk = () => {
        this.activityChunks.push({
          id: comment.id,
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
      }
    },
    updateCommentChunks(comment: Comment) {
      const roomId = comment.contentId;
      const user = this.users[comment.createUserId];
      const pushChunk = () => {
        this.commentChunks[roomId].push({
          firstId: comment.id,
          lastId: comment.id,
          uid: user.id,
          username: user.username,
          nickname: "",
          avatar: user.avatar,
          comments: [],
          date: new Date(),
        });
      };

      if (this.commentChunks[roomId].length === 0) {
        pushChunk();
      } else if (!this.commentChunks[roomId]) {
        this.commentChunks[roomId] = [];
        pushChunk();
      } else {
        // [this.commentChunks[roomId].length - 1]
        const current = this.commentChunks[roomId].at(-1);
        if (current) {
          const currentComment = current.comments.at(-1);
          const currentDate = new Date(currentComment!.createDate);
          const commentDate = new Date(comment.createDate);
          const diff = Math.floor(
            (commentDate.getTime() - currentDate.getTime()) / 60000
          );
          if (
            current.uid !== user.id ||
            current.avatar !== user.avatar ||
            current.username !== user.username ||
            diff >= 5
          ) {
            pushChunk();
          }
        }
      }

      this.commentChunks[roomId][
        this.commentChunks[roomId].length - 1
      ].comments.push(comment);
      this.commentChunks[roomId].at(-1)!.lastId = comment.id;
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
    rebuildActivityChunks() {;
      this.activityChunks = [];
      this.comments.map((x) => this.updateActivityChunks(x));
    },
    addComment(comment: Comment) {
      this.comments.push(comment);
      this.updateCommentChunks(comment);
      this.updateActivityChunks(comment);
      console.log(this.activityChunks);
    },
  },
  share: {
    enable: true,
    initialize: true,
  },
});
