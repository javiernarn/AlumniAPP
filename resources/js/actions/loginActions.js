// import Api from "../utils/api"
// import { delay } from "../utils/helper"
// import secureLocalStorage from "react-secure-storage"
// import axiosConfig from "~/utils/axiosConfig"
// import { BASE_URL } from "~/utils/constant"

// const checkLogin = async ({ params, set, get }) => {
//   const setSubmit = get().setSubmit
//   const setError = get().setError
//   setSubmit(true)
//   setError(null)
//   await delay(1000)
//   Api.login(params)
//     .then((result) => {
//       secureLocalStorage.setItem("access_token", result.data.access_token)

//       secureLocalStorage.setItem("faculty_id", result?.data?.faculty_id)
//       secureLocalStorage.setItem("userID", result?.data?.user?.id)
//       secureLocalStorage.setItem("userRole", result?.data?.user?.role)
//       secureLocalStorage.setItem("email", result?.data?.user?.email)
//       secureLocalStorage.setItem("name", result?.data?.user?.name)

//       // Store alumni_id if the logged-in user is an alumni
//       if (result?.data?.alumni_id) {
//         secureLocalStorage.setItem("alumniId", result.data.alumni_id)
//       }

//       if (result?.data?.user?.role === "department_head" && result?.data?.course_id) {
//         secureLocalStorage.setItem("courseId", result.data.course_id)
//       }

//       const userRole = result?.data?.user?.role

//       if (userRole === "department_head") {
//         window.location = "/department-dashboard"
//         return
//       }

//       // Default fallback
//       window.location = "/"
//     })
//     .catch((error) => {
//       setSubmit(false)
//       if (error.response) {
//         setError(error.response.data.message)
//         return
//       }
//       setError(true)
//     })
// }

// const logout = async () => {
//   try {
//     // Call backend logout endpoint to set user offline
//     await axiosConfig.post(BASE_URL + "api/logout")
//   } catch (error) {
//     console.error("Logout error:", error)
//   } finally {
//     // Clear all local storage items
//     secureLocalStorage.removeItem("access_token")
//     secureLocalStorage.removeItem("faculty_id")
//     secureLocalStorage.removeItem("userID")
//     secureLocalStorage.removeItem("userRole")
//     secureLocalStorage.removeItem("email")
//     secureLocalStorage.removeItem("name")
//     secureLocalStorage.removeItem("courseId")
//     secureLocalStorage.removeItem("alumniId")
    
//     // Redirect to login page
//     window.location = "/login"
//   }
// }

// export { checkLogin, logout }

import Api from "../utils/api"
import { delay } from "../utils/helper"
import secureLocalStorage from "react-secure-storage"
import axiosConfig from "~/utils/axiosConfig"
import { BASE_URL } from "~/utils/constant"

// Reads ?redirect=/some-path from the current URL (e.g. when a user lands on
// /login?redirect=/messages from an email button) and returns it only if it
// looks like a safe, same-site relative path. This prevents open-redirect
// issues (e.g. redirect=https://evil.com or redirect=//evil.com) while still
// letting us send the user straight to the page the email was about, instead
// of always dropping them on the default homepage after login.
const getSafeRedirect = () => {
  try {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get("redirect")

    if (
      redirect &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//") &&
      !redirect.toLowerCase().startsWith("/\\")
    ) {
      return redirect
    }
  } catch (e) {
    // ignore malformed query strings
  }
  return null
}

const checkLogin = async ({ params, set, get }) => {
  const setSubmit = get().setSubmit
  const setError = get().setError
  setSubmit(true)
  setError(null)
  await delay(1000)
  Api.login(params)
    .then((result) => {
      secureLocalStorage.setItem("access_token", result.data.access_token)

      secureLocalStorage.setItem("faculty_id", result?.data?.faculty_id)
      secureLocalStorage.setItem("userID", result?.data?.user?.id)
      secureLocalStorage.setItem("userRole", result?.data?.user?.role)
      secureLocalStorage.setItem("email", result?.data?.user?.email)
      secureLocalStorage.setItem("name", result?.data?.user?.name)

      // Store alumni_id if the logged-in user is an alumni
      if (result?.data?.alumni_id) {
        secureLocalStorage.setItem("alumniId", result.data.alumni_id)
      }

      if (result?.data?.user?.role === "department_head" && result?.data?.course_id) {
        secureLocalStorage.setItem("courseId", result.data.course_id)
      }

      const userRole = result?.data?.user?.role

      // If the user arrived via a link like /login?redirect=/messages
      // (e.g. from an email notification), send them straight there
      // instead of the default role-based landing page.
      const redirectTo = getSafeRedirect()
      if (redirectTo) {
        window.location = redirectTo
        return
      }

      if (userRole === "department_head") {
        window.location = "/department-dashboard"
        return
      }

      // Default fallback
      window.location = "/"
    })
    .catch((error) => {
      setSubmit(false)
      if (error.response) {
        setError(error.response.data.message)
        return
      }
      setError(true)
    })
}

const logout = async () => {
  try {
    // Call backend logout endpoint to set user offline
    await axiosConfig.post(BASE_URL + "api/logout")
  } catch (error) {
    console.error("Logout error:", error)
  } finally {
    // Clear all local storage items
    secureLocalStorage.removeItem("access_token")
    secureLocalStorage.removeItem("faculty_id")
    secureLocalStorage.removeItem("userID")
    secureLocalStorage.removeItem("userRole")
    secureLocalStorage.removeItem("email")
    secureLocalStorage.removeItem("name")
    secureLocalStorage.removeItem("courseId")
    secureLocalStorage.removeItem("alumniId")

    // Redirect to login page
    window.location = "/login"
  }
}

export { checkLogin, logout }