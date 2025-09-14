"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  username: string
  password: string
  firstName: string
  lastName: string
  phone: string
  email: string // Added email field to User interface
  role: "admin" | "user"
  isActive: boolean
  createdAt: string
  twoFactorEnabled: boolean
}

interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  userRole: "admin" | "user" | null
  login: (username: string, password: string) => Promise<{ success: boolean; requiresSMS?: boolean; user?: User }>
  logout: () => void
  isLoading: boolean
  users: User[]
  createUser: (
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
    email: string, // Added email parameter to createUser function
    role: "admin" | "user",
  ) => boolean
  updateUser: (id: string, updates: Partial<Omit<User, "id" | "createdAt">>) => boolean
  deleteUser: (id: string) => boolean
  toggleUserActive: (id: string) => boolean
  toggle2FA: (id: string) => boolean
  completeSMSVerification: (user: User) => void
  isAdmin: boolean
  showWelcome: boolean
  setShowWelcome: (show: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const defaultUsers: User[] = [
  {
    id: "1",
    username: "bddesigner",
    password: "Sarah.bddwomans.123",
    firstName: "Sarah",
    lastName: "Designer",
    phone: "+221123456789",
    email: "sarah@bddesigner.com", // Added email to default user
    role: "admin",
    isActive: true,
    createdAt: new Date().toISOString(),
    twoFactorEnabled: true,
  },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>(defaultUsers)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated")
    const storedUsername = localStorage.getItem("username")
    const storedUserRole = localStorage.getItem("userRole") as "admin" | "user" | null
    const storedUsers = localStorage.getItem("users")

    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers)
      const migratedUsers = parsedUsers.map((user: any) => ({
        ...user,
        email: user.email || "email@example.com", // Added email migration for existing users
        isActive: user.isActive !== undefined ? user.isActive : true,
        twoFactorEnabled: user.twoFactorEnabled !== undefined ? user.twoFactorEnabled : false,
      }))
      setUsers(migratedUsers)
    }

    if (authStatus === "true" && storedUsername && storedUserRole) {
      setIsAuthenticated(true)
      setUsername(storedUsername)
      setUserRole(storedUserRole)
    }
    setIsLoading(false)
  }, [])

  const login = async (
    inputUsername: string,
    inputPassword: string,
  ): Promise<{ success: boolean; requiresSMS?: boolean; user?: User }> => {
    const user = users.find((u) => u.username === inputUsername && u.password === inputPassword)

    if (user && user.isActive) {
      // If 2FA is enabled, require SMS verification
      if (user.twoFactorEnabled) {
        return { success: true, requiresSMS: true, user }
      } else {
        // Complete login immediately if 2FA is disabled
        setIsAuthenticated(true)
        setUsername(user.username)
        setUserRole(user.role)
        localStorage.setItem("isAuthenticated", "true")
        localStorage.setItem("username", user.username)
        localStorage.setItem("userRole", user.role)
        setShowWelcome(true)
        return { success: true, requiresSMS: false }
      }
    }
    return { success: false }
  }

  const completeSMSVerification = (user: User) => {
    setIsAuthenticated(true)
    setUsername(user.username)
    setUserRole(user.role)
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("username", user.username)
    localStorage.setItem("userRole", user.role)
    setShowWelcome(true)
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUsername(null)
    setUserRole(null)
    setShowWelcome(false)

    try {
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("username")
      localStorage.removeItem("userRole")
    } catch (error) {
      console.warn("Error clearing localStorage:", error)
    }

    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  const createUser = (
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
    email: string, // Added email parameter
    role: "admin" | "user",
  ): boolean => {
    if (!username.trim() || username.length < 3) {
      return false // Username too short
    }

    if (!password.trim() || password.length < 6) {
      return false // Password too short
    }

    if (!firstName.trim() || !lastName.trim()) {
      return false // Name fields required
    }

    if (!phone.trim()) {
      return false // Phone required
    }

    if (!email.trim() || !email.includes("@")) {
      // Added email validation
      return false // Email required and must be valid
    }

    if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return false // Username already exists (case insensitive)
    }

    const newUser: User = {
      id: Date.now().toString(),
      username: username.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(), // Added email to new user object
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      twoFactorEnabled: true,
    }

    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))
    return true
  }

  const updateUser = (id: string, updates: Partial<Omit<User, "id" | "createdAt">>): boolean => {
    const userIndex = users.findIndex((u) => u.id === id)
    if (userIndex === -1) return false

    if (updates.username) {
      if (updates.username.length < 3) return false
      if (users.find((u) => u.username.toLowerCase() === updates.username!.toLowerCase() && u.id !== id)) {
        return false
      }
    }

    if (updates.password && updates.password.length < 6) {
      return false
    }

    if (updates.firstName && !updates.firstName.trim()) {
      return false
    }

    if (updates.lastName && !updates.lastName.trim()) {
      return false
    }

    if (updates.phone && !updates.phone.trim()) {
      return false
    }

    if (updates.email && (!updates.email.trim() || !updates.email.includes("@"))) {
      // Added email validation for updates
      return false
    }

    const updatedUsers = users.map((user) => (user.id === id ? { ...user, ...updates } : user))

    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))

    if (users[userIndex].username === username && updates.username) {
      setUsername(updates.username)
      localStorage.setItem("username", updates.username)
    }

    return true
  }

  const deleteUser = (id: string): boolean => {
    const userToDelete = users.find((u) => u.id === id)
    if (!userToDelete) return false

    if (userToDelete.role === "admin") {
      const adminCount = users.filter((u) => u.role === "admin").length
      if (adminCount <= 1) {
        return false
      }
    }

    const updatedUsers = users.filter((u) => u.id !== id)
    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))
    return true
  }

  const toggleUserActive = (id: string): boolean => {
    const userIndex = users.findIndex((u) => u.id === id)
    if (userIndex === -1) return false

    const user = users[userIndex]

    if (user.role === "admin" && user.isActive) {
      const activeAdminCount = users.filter((u) => u.role === "admin" && u.isActive).length
      if (activeAdminCount <= 1) {
        return false
      }
    }

    const updatedUsers = users.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u))

    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))

    if (user.username === username && user.isActive) {
      logout()
    }

    return true
  }

  const toggle2FA = (id: string): boolean => {
    const updatedUsers = users.map((u) => (u.id === id ? { ...u, twoFactorEnabled: !u.twoFactorEnabled } : u))

    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))
    return true
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        userRole,
        login,
        logout,
        isLoading,
        users,
        createUser,
        updateUser,
        deleteUser,
        toggleUserActive,
        toggle2FA,
        completeSMSVerification,
        isAdmin: userRole === "admin",
        showWelcome,
        setShowWelcome,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
