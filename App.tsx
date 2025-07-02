"use client"

import { useEffect, useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase/firebaseConfig"
import { AuthProvider } from "./contexts/AuthContext"
import { NotificationProvider } from "./contexts/NotificationContext"

// Auth Screens
import LoginScreen from "./screens/auth/LoginScreen"
import RegisterScreen from "./screens/auth/RegisterScreen"
import UserTypeScreen from "./screens/auth/UserTypeScreen"

// Admin Screens
import AdminDashboard from "./screens/admin/AdminDashboard"
import StudentManagement from "./screens/admin/StudentManagement"
import BillingManagement from "./screens/admin/BillingManagement"
import CreateBill from "./screens/admin/CreateBill"

// Student Screens
import StudentDashboard from "./screens/student/StudentDashboard"
import BillingHistory from "./screens/student/BillingHistory"
import InvoiceViewer from "./screens/student/InvoiceViewer"

// Shared Screens
import ProfileScreen from "./screens/shared/ProfileScreen"

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Students") {
            iconName = focused ? "people" : "people-outline"
          } else if (route.name === "Billing") {
            iconName = focused ? "card" : "card-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          } else {
            iconName = "help-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Students" component={StudentManagement} />
      <Tab.Screen name="Billing" component={BillingManagement} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "History") {
            iconName = focused ? "time" : "time-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          } else {
            iconName = "help-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={StudentDashboard} />
      <Tab.Screen name="History" component={BillingHistory} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function AppNavigator() {
  const [user, setUser] = useState<User | null>(null)
  const [userType, setUserType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user type from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setUserType(userDoc.data().userType)
        }
      } else {
        setUserType(null)
      }
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  if (loading) {
    return null // You can add a loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen name="UserType" component={UserTypeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Main App Stack
          <>
            {userType === "admin" ? (
              <>
                <Stack.Screen name="AdminMain" component={AdminTabs} />
                <Stack.Screen name="CreateBill" component={CreateBill} />
              </>
            ) : (
              <>
                <Stack.Screen name="StudentMain" component={StudentTabs} />
                <Stack.Screen name="InvoiceViewer" component={InvoiceViewer} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </NotificationProvider>
    </AuthProvider>
  )
}
