import { ContentAPI } from "contentapi-ts-bindings/Helpers";
import { RequestType } from "contentapi-ts-bindings/Search/RequestType";
import {
  SearchRequest,
  SearchRequests,
} from "contentapi-ts-bindings/Search/SearchRequests";

export const API_DOMAIN = "qcs.shsbs.xyz";

const SUBPAGES_PER_PAGE = 25;
const COMMENTS_PER_PAGE = 25;

export const api = new ContentAPI(API_DOMAIN);

export const GetSearchBackDate = function (
  hours?: number,
  date?: Date
): string {
  hours = hours || 0;
  const back = date || new Date();
  back.setHours(back.getHours() - hours);
  return back.toISOString().substring(0, 13);
};

export const BasicPageDisplaySearch = function (
  id: number,
  subpagePage = 0,
  commentPage = 0,
  subpagesPerPage: number = SUBPAGES_PER_PAGE,
  commentsPerPage: number = COMMENTS_PER_PAGE
): SearchRequests {
  const search = new SearchRequests(
    {
      pageid: id,
      filetype: 3,
    },
    [
      new SearchRequest(RequestType.content, "*", "id = @pageid"),
      //Subpages: we want most fields, but not SOME big/expensive fields. Hence ~
      // new RequestSearchParameter(
      //   "content",
      //   "~values,keywords,votes",
      //   "parentId = @pageid and !notdeleted() and contentType <> @filetype",
      //   "contentType,literalType,name",
      //   subpagesPerPage,
      //   subpagesPerPage * subpagePage,
      //   "subpages"
      // ),
      new SearchRequest(
        RequestType.message,
        "*",
        "contentId = @pageid and !notdeleted() and !null(module)",
        "id_desc",
        commentsPerPage,
        commentsPerPage * commentPage
      ),
      // We grab your personal watches/votes/etc specifically for the main page to see if you ARE watching it
      // new RequestSearchParameter("watch", "*", "contentId = @pageid"), //This is YOUR watch (the requester)
      // new RequestSearchParameter("vote", "*", "contentId = @pageid"), //This is YOUR vote (the requester)
      // And then users in everything
      new SearchRequest(
        RequestType.user,
        "*",
        "id in @message.createUserId or id in @content.createUserId"
      ),
    ]
  );

  return search;
};
