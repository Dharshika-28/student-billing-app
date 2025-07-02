"use client"

import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

interface Props {
  navigation: any
}

export default function UserTypeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#10b981", "#2563eb"]} style={styles.gradient}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to EduBill</Text>
            <Text style={styles.subtitle}>Choose your account type to continue</Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => navigation.navigate("Login", { userType: "admin" })}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="business" size={48} color="#2563eb" />
              </View>
              <Text style={styles.optionTitle}>Institution Admin</Text>
              <Text style={styles.optionDescription}>Manage students, billing, and payments for your institution</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => navigation.navigate("Login", { userType: "student" })}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="school" size={48} color="#10b981" />
              </View>
              <Text style={styles.optionTitle}>Student/Parent</Text>
              <Text style={styles.optionDescription}>View bills, payment history, and manage your account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
})
