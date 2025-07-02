"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface UserData {
  id: string
  email: string
  userType: "admin" | "student"
  institutionName?: string
  studentName?: string
  parentName?: string
  institutionId?: string
}

interface AuthContextType {
  user: UserData | null
  userData: UserData | null
  loading: boolean
  login: (email: string, password: string, userType: string) => Promise<boolean>
  register: (userData: any) => Promise<boolean>
  logout: () => Promise<void>
  updateProfile: (data: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  updateProfile: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData")
      if (userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string, userType: string): Promise<boolean> => {
    try {
      // Get stored users
      const usersData = await AsyncStorage.getItem("users")
      const users = usersData ? JSON.parse(usersData) : []

      // Find user
      const foundUser = users.find((u: any) => u.email === email && u.password === password && u.userType === userType)

      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser
        setUser(userWithoutPassword)
        await AsyncStorage.setItem("userData", JSON.stringify(userWithoutPassword))
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const register = async (userData: any): Promise<boolean> => {
    try {
      // Get existing users
      const usersData = await AsyncStorage.getItem("users")
      const users = usersData ? JSON.parse(usersData) : []

      // Check if user already exists
      const existingUser = users.find((u: any) => u.email === userData.email)
      if (existingUser) {
        return false
      }

      // Add new user
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        createdAt: new Date().toISOString(),
      }

      users.push(newUser)
      await AsyncStorage.setItem("users", JSON.stringify(users))

      // Auto login
      const { password: _, ...userWithoutPassword } = newUser
      setUser(userWithoutPassword)
      await AsyncStorage.setItem("userData", JSON.stringify(userWithoutPassword))

      return true
    } catch (error) {
      console.error("Register error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("userData")
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const updateProfile = async (data: any) => {
    try {
      if (!user) return

      const updatedUser = { ...user, ...data }
      setUser(updatedUser)
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUser))

      // Update in users array
      const usersData = await AsyncStorage.getItem("users")
      const users = usersData ? JSON.parse(usersData) : []
      const userIndex = users.findIndex((u: any) => u.id === user.id)
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...data }
        await AsyncStorage.setItem("users", JSON.stringify(users))
      }
    } catch (error) {
      console.error("Update profile error:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userData: user,
        loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
