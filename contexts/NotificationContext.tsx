"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

interface NotificationContextType {
  expoPushToken: string | null
  sendNotification: (title: string, body: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: null,
  sendNotification: async () => {},
})

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token))
  }, [])

  const sendNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: { seconds: 1 },
    })
  }

  return (
    <NotificationContext.Provider value={{ expoPushToken, sendNotification }}>{children}</NotificationContext.Provider>
  )
}

async function registerForPushNotificationsAsync() {
  let token

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== "granted") {
    alert("Failed to get push token for push notification!")
    return
  }
  token = (await Notifications.getExpoPushTokenAsync()).data

  return token
}
