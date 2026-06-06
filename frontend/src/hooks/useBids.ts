import { useQuery } from "@tanstack/react-query";
import { bidsApi } from "@/lib/api";

export function useMyBids(enabled = true) {
  return useQuery({
    queryKey: ["bids", "mine"],
    queryFn: async () => (await bidsApi.mine()).data,
    enabled,
  });
}
