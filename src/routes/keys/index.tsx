import { createFileRoute } from "@tanstack/react-router";
import { keysQueryOptions } from "@/lib/queries/etcd";
import { KeyBrowserPage } from "./$";

export const Route = createFileRoute("/keys/")({
  loader: async ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(keysQueryOptions("/"));
  },
  component: KeyBrowserPage,
});
