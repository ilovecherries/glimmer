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
  comments: Array<Comment>;
};

export type CommentChunkContainer = {
  [key: number]: Array<CommentChunk>;
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
      commentChunks: {},
      users: {},
      userlists: {},
      myStatuses: {},
      runningWs: false,
    } as SharedStoreState;
  },
  actions: {
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
        });
      };

      if (this.commentChunks[roomId].length === 0) {
        pushChunk();
      } else if (!this.commentChunks[roomId]) {
        this.commentChunks[roomId] = [];
        pushChunk();
      } else {
        const current =
          this.commentChunks[roomId][this.commentChunks[roomId].length - 1];
        if (
          current.uid !== user.id ||
          current.avatar !== user.avatar ||
          current.username !== user.username
        ) {
          pushChunk();
        }
      }

      this.commentChunks[roomId][
        this.commentChunks[roomId].length - 1
      ].comments.push(comment);
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
      console.log(this.comments)
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
    addComment(comment: Comment) {
      this.comments.push(comment);
      this.updateCommentChunks(comment);
    },
  },
  share: {
    enable: true,
    initialize: true,
  },
});
