import { ApiFetcherArgs, tsRestFetchApi } from "@ts-rest/core";
import { postsApi } from "@ts-rest/example-microservice/util-posts-api";
import { initQueryClient } from "@ts-rest/vue-query";

export const client = initQueryClient(postsApi, {
  baseUrl: 'http://localhost:5003',
  baseHeaders: {},
  api: async (args: ApiFetcherArgs & { test?: string }) => {
    return tsRestFetchApi(args);
  },
});
