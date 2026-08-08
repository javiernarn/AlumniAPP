import { useQuery, useMutation, useQueryClient } from "react-query"
import axiosConfig from "~/utils/axiosConfig"
import { message } from "antd"

// Hook to fetch all department heads
export const useDepartmentHeads = () => {
  return useQuery(
    "departmentHeads",
    async () => {
      const response = await axiosConfig.get("/department-heads")
      return response.data.data || []
    },
    {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  )
}

// Hook to create a department head
export const useCreateDepartmentHead = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (data) => {
      const response = await axiosConfig.post("/department-heads", data)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("departmentHeads")
        message.success("Department head created successfully")
      },
      onError: (error) => {
        message.error(error.response?.data?.message || "Failed to create department head")
      },
    },
  )
}

// Hook to update a department head
export const useUpdateDepartmentHead = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async ({ id, data }) => {
      const response = await axiosConfig.put(`/department-heads/${id}`, data)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("departmentHeads")
        message.success("Department head updated successfully")
      },
      onError: (error) => {
        message.error(error.response?.data?.message || "Failed to update department head")
      },
    },
  )
}

// Hook to delete a department head
export const useDeleteDepartmentHead = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (id) => {
      const response = await axiosConfig.delete(`/department-heads/${id}`)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("departmentHeads")
        message.success("Department head deleted successfully")
      },
      onError: (error) => {
        message.error(error.response?.data?.message || "Failed to delete department head")
      },
    },
  )
}

// Hook to fetch department head dashboard data
export const useDepartmentHeadDashboard = (year = "all") => {
  return useQuery(
    ["departmentHeadDashboard", year],
    async () => {
      const response = await axiosConfig.get(`/department-head/dashboard?year=${year}`)
      return response.data
    },
    {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  )
}

// Hook to fetch department head alumni list
export const useDepartmentHeadAlumni = () => {
  return useQuery(
    "departmentHeadAlumni",
    async () => {
      const response = await axiosConfig.get("/department-head/alumni")
      return response.data.data || []
    },
    {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  )
}

export default useDepartmentHeads
