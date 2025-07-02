import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface Props {
  navigation: any
}

export default function UserTypeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to EduBill</Text>
        <Text style={styles.subtitle}>Choose your account type</Text>

        <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate("Login", { userType: "admin" })}>
          <Ionicons name="business" size={48} color="#2563eb" />
          <Text style={styles.optionTitle}>Educational Institution</Text>
          <Text style={styles.optionDescription}>Manage students, create bills, and track payments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => navigation.navigate("Login", { userType: "student" })}
        >
          <Ionicons name="school" size={48} color="#2563eb" />
          <Text style={styles.optionTitle}>Student / Parent</Text>
          <Text style={styles.optionDescription}>View bills, payment history, and download invoices</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#64748b",
    marginBottom: 40,
  },
  optionCard: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 12,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
})
