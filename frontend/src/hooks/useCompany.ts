import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { companiesApi, type CompanyUpsert } from "@/lib/api";

export function useMyCompany(enabled = true) {
  return useQuery({
    queryKey: ["company", "me"],
    queryFn: async () => (await companiesApi.me()).data,
    enabled,
  });
}

export function useUpsertCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CompanyUpsert) => companiesApi.upsert(body).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(["company", "me"], data);
    },
  });
}
