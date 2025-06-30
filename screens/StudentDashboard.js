import { useEffect, useState } from "react"
import { View, StyleSheet, ScrollView, Animated } from "react-native"
import { Text, Card, Button, Chip } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { collection, query, where, getDocs } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { auth, db } from "../firebase/firebaseConfig"

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    fetchStudentData()
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start()
  }, [])

  const fetchStudentData = async () => {
    try {
      const user = auth.currentUser
      if (user) {
        const q = query(collection(db, "students"), where("email", "==", user.email))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0]
          setStudentData({ id: doc.id, ...doc.data() })
        }
      }
    } catch (error) {
      console.error("Error fetching student data:", error)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      alert("Logout failed: " + error.message)
    }
  }

  const getStatusColor = () => {
    if (!studentData) return "#666"
    if (studentData.balance <= 0) return "#4caf50"
    const dueDate = new Date(studentData.dueDate)
    const today = new Date()
    if (dueDate < today) return "#f44336"
    return "#ff9800"
  }

  const getStatusText = () => {
    if (!studentData) return "Unknown"
    if (studentData.balance <= 0) return "Paid"
    const dueDate = new Date(studentData.dueDate)
    const today = new Date()
    if (dueDate < today) return "Overdue"
    return "Pending"
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Dashboard
        </Text>
        <Button mode="text" onPress={handleLogout} icon="logout">
          Logout
        </Button>
      </View>

      <ScrollView style={styles.content}>
        {studentData ? (
          <>
            <Card style={styles.welcomeCard}>
              <Card.Content>
                <Text variant="headlineMedium" style={styles.welcomeText}>
                  Welcome, {studentData.name}!
                </Text>
                <Text variant="bodyLarge" style={styles.welcomeSubtext}>
                  Here's your payment status
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statusCard}>
              <Card.Content>
                <View style={styles.statusHeader}>
                  <Text variant="titleLarge">Payment Status</Text>
                  <Chip
                    mode="flat"
                    style={[styles.statusChip, { backgroundColor: getStatusColor() }]}
                    textStyle={{ color: "white" }}
                  >
                    {getStatusText()}
                  </Chip>
                </View>

                <View style={styles.amountContainer}>
                  <Ionicons name="cash" size={24} color="#6200ee" />
                  <Text variant="headlineSmall" style={styles.amount}>
                    ₹{studentData.balance}
                  </Text>
                </View>

                <View style={styles.dateContainer}>
                  <Ionicons name="calendar" size={20} color="#666" />
                  <Text style={styles.dueDate}>Due: {studentData.dueDate}</Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.historyCard}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.historyTitle}>
                  Payment History
                </Text>
                {studentData.payments && studentData.payments.length > 0 ? (
                  studentData.payments.map((payment, index) => (
                    <View key={index} style={styles.paymentItem}>
                      <View style={styles.paymentInfo}>
                        <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
                        <Text style={styles.paymentAmount}>₹{payment.amount}</Text>
                      </View>
                      <Text style={styles.paymentDate}>{new Date(payment.date).toLocaleDateString()}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noPayments}>No payments made yet</Text>
                )}
              </Card.Content>
            </Card>
          </>
        ) : (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text variant="titleLarge">No Data Found</Text>
              <Text>Your student record was not found. Please contact administration.</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    elevation: 2,
  },
  headerTitle: {
    color: "#6200ee",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  welcomeText: {
    color: "#6200ee",
    fontWeight: "bold",
  },
  welcomeSubtext: {
    color: "#666",
    marginTop: 4,
  },
  statusCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusChip: {
    borderRadius: 16,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  amount: {
    marginLeft: 8,
    fontWeight: "bold",
    color: "#333",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dueDate: {
    marginLeft: 8,
    color: "#666",
  },
  historyCard: {
    elevation: 4,
    borderRadius: 12,
  },
  historyTitle: {
    marginBottom: 16,
  },
  paymentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentAmount: {
    marginLeft: 8,
    fontWeight: "600",
  },
  paymentDate: {
    color: "#666",
  },
  noPayments: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
  errorCard: {
    elevation: 4,
    borderRadius: 12,
  },
})
