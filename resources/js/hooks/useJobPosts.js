import { useQuery, useMutation, useQueryClient } from "react-query";
import axiosConfig from "~/utils/axiosConfig";

// =========================================
// QUERY KEYS
// =========================================
const KEYS = {
  list: (params) => ["job-posts", params],
  detail: (id) => ["job-posts", "detail", id],
  pending: ["job-posts", "pending"],
  fullOrExpired: ["job-posts", "full-or-expired"],
  myPostings: ["job-posts", "my-postings"],
};

// Every list/count query below shares this shape. `refetchInterval` gives you
// "live" badge counts without a manual setInterval, and react-query will
// automatically skip/collapse a tick if the previous request for the same
// key hasn't resolved yet — so a slow backend can't pile up requests the
// way the old setInterval + Promise.allSettled loop could.
const POLLING_OPTIONS = {
  keepPreviousData: true,
  staleTime: 8000,
  refetchInterval: 10000,
  refetchOnWindowFocus: false,
};

const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

// =========================================
// QUERIES
// =========================================

// Main job posts list (admin: all statuses + ?status filter, alumni: approved only, server-enforced)
export const useJobPosts = (params = {}, options = {}) => {
  const { status, search } = params;

  return useQuery(
    KEYS.list({ status, search }),
    async () => {
      const { data } = await axiosConfig.get("/job-posts", {
        params: { status, search },
        silent: true,
      });
      return data; // Laravel paginator: { data: [...], current_page, total, ... }
    },
    {
      ...POLLING_OPTIONS,
      ...options,
    },
  );
};

// Single job post detail
export const useJobPost = (id, options = {}) => {
  return useQuery(
    KEYS.detail(id),
    async () => {
      const { data } = await axiosConfig.get(`/job-posts/${id}`);
      return data;
    },
    {
      enabled: !!id,
      ...options,
    },
  );
};

// Admin only: posts awaiting approval
export const usePendingJobPosts = (options = {}) => {
  return useQuery(
    KEYS.pending,
    async () => {
      const { data } = await axiosConfig.get("/job-posts/admin/pending", {
        silent: true,
      });
      return extractArray(data);
    },
    {
      ...POLLING_OPTIONS,
      ...options,
    },
  );
};

// Full or expired posts (admin: all; alumni: own posts only — server-enforced)
export const useFullOrExpiredJobPosts = (options = {}) => {
  return useQuery(
    KEYS.fullOrExpired,
    async () => {
      const { data } = await axiosConfig.get("/job-posts/full-or-expired", {
        silent: true,
      });
      return extractArray(data);
    },
    {
      ...POLLING_OPTIONS,
      ...options,
    },
  );
};

// Alumni: posts they created
export const useMyJobPostings = (options = {}) => {
  return useQuery(
    KEYS.myPostings,
    async () => {
      const { data } = await axiosConfig.get("/job-posts/my-postings", {
        silent: true,
      });
      return extractArray(data);
    },
    {
      ...POLLING_OPTIONS,
      ...options,
    },
  );
};

// =========================================
// MUTATIONS
// =========================================

const invalidateJobPostQueries = (queryClient) => {
  queryClient.invalidateQueries("job-posts");
};

// Create a job post (multipart because of banner_image)
export const useCreateJobPost = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (formData) => {
      const { data } = await axiosConfig.post("/job-posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    {
      onSuccess: () => invalidateJobPostQueries(queryClient),
    },
  );
};

// Update a job post. Pass a FormData instance; we append _method=PUT so
// Laravel still routes it to update() while allowing file uploads.
export const useUpdateJobPost = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ id, formData }) => {
      formData.append("_method", "PUT");
      const { data } = await axiosConfig.post(`/job-posts/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    {
      onSuccess: (_data, { id }) => {
        invalidateJobPostQueries(queryClient);
        queryClient.invalidateQueries(KEYS.detail(id));
      },
    },
  );
};

export const useDeleteJobPost = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (id) => {
      const { data } = await axiosConfig.delete(`/job-posts/${id}`);
      return data;
    },
    {
      onSuccess: () => invalidateJobPostQueries(queryClient),
    },
  );
};

// NOTE: verify approve/reject HTTP verbs against your routes/api.php —
// these assume POST since they're action endpoints rather than REST updates.
export const useApproveJobPost = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (id) => {
      const { data } = await axiosConfig.post(`/job-posts/${id}/approve`);
      return data;
    },
    {
      onSuccess: () => invalidateJobPostQueries(queryClient),
    },
  );
};

export const useRejectJobPost = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ id, admin_notes }) => {
      const { data } = await axiosConfig.post(`/job-posts/${id}/reject`, {
        admin_notes,
      });
      return data;
    },
    {
      onSuccess: () => invalidateJobPostQueries(queryClient),
    },
  );
};

export default useJobPosts;