import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast"
import { AxiosError } from "axios"

type signUpProps = {
    fullName: string,
    email: string,
    password: string
}

type AuthState = {
    authUser: string | null
    isSigningUp: boolean
    isLoggingIn: boolean
    isUpdatingProfile: boolean
    isCheckingAuth: boolean
    checkAuth: () => Promise<void>
    signup: (data: signUpProps) => Promise<void>
    logout: () => Promise<void>
  }
  

export const useAuthStore = create<AuthState>((set) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,

    isCheckingAuth: true,

    checkAuth: async() => {
        try {
            const res = await axiosInstance.get("/auth/check");

            set({ authUser:res.data })
        } catch (error) {
            console.log("Error in checkAuth:", error);
            set({ authUser: null })
        } finally {
            set({ isCheckingAuth: false})
        }
    },

    signup: async(data) => {
        set({ isSigningUp: true})
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUser: res.data })
            toast.success("Account created successfully");
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            console.log(err)
            toast.error(err.response?.data.message || "Something went wrong in sign up");
        } finally {
            set({isSigningUp:false})
        }
    },
    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null })
            toast.success("Logged out successfully")
        } catch (error) {
            const err = error as AxiosError<{ message:string }>
            toast.error(err.request?.data.message || "Wrong response in logout")
        }
    }
}))
