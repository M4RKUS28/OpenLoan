import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loansApi, type LoanCreate, type MarketplaceFilters } from "@/lib/api";

export function useMarketplace(filters: MarketplaceFilters) {
  return useQuery({
    queryKey: ["loans", "marketplace", filters],
    queryFn: async () => (await loansApi.list(filters)).data.items,
  });
}

export function useIndustries() {
  return useQuery({
    queryKey: ["loans", "industries"],
    queryFn: async () => (await loansApi.industries()).data.items,
    staleTime: 1000 * 60 * 10,
  });
}

export function useLoan(id: string | undefined) {
  return useQuery({
    queryKey: ["loan", id],
    queryFn: async () => (await loansApi.get(id!)).data,
    enabled: !!id,
  });
}

export function useMyLoans(enabled = true) {
  return useQuery({
    queryKey: ["loans", "mine"],
    queryFn: async () => (await loansApi.mine()).data.items,
    enabled,
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoanCreate) => loansApi.create(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
  });
}

export function useApproveLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loansApi.approve(id).then((r) => r.data),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["loan", id] });
    },
  });
}

export function usePlaceBid(loanId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { amount: number; interest_rate: number; message?: string }) =>
      loansApi.placeBid(loanId, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan", loanId] });
      qc.invalidateQueries({ queryKey: ["bids", "mine"] });
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
  });
}

export function useAcceptBid(loanId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bidId: string) => loansApi.acceptBid(loanId, bidId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan", loanId] });
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
  });
}
