import { useEffect, useState } from "react"
import { View, StyleSheet, Linking, Animated, ScrollView } from "react-native"
import { Text, Button, List, Card, Chip } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/firebaseConfig"

export default function StudentDetails({ route, navigation }) {
  const { studentId } = route.params
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fadeAnim] = useState(new Animated.Value(0))

  const fetchStudent = async () => {
    setLoading(true)
    const docRef = doc(db, "students", studentId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      setStudent(docSnap.data())
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStudent()
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
  }, [])

  const sendReminder = () => {
    if (!student) return
    const msg = `Hi ${student.name}, your pending bill of ₹${student.balance} is due on ${student.dueDate}. Please pay soon.`
    const phone = ""
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    Linking.openURL(url)
  }

  const getStatusColor = () => {
    if (!student) return "#666"
    if (student.balance <= 0) return "#4caf50"
    const dueDate = new Date(student.dueDate)
    const today = new Date()
    if (dueDate < today) return "#f44336"
    return "#ff9800"
  }

  const getStatusText = () => {
    if (!student) return "Unknown"
    if (student.balance <= 0) return "Paid"
    const dueDate = new Date(student.dueDate)
    const today = new Date()
    if (dueDate < today) return "Overdue"
    return "Pending"
  }

  if (loading) return <Text style={{ padding: 20 }}>Loading...</Text>
  if (!student) return <Text style={{ padding: 20 }}>Student not found</Text>

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView>
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <Text variant="headlineMedium" style={styles.studentName}>
                {student.name}
              </Text>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: getStatusColor() }]}
                textStyle={{ color: "white" }}
              >
                {getStatusText()}
              </Chip>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Ionicons name="cash" size={20} color="#6200ee" />
                <Text style={styles.detailText}>₹{student.balance}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="calendar" size={20} color="#6200ee" />
                <Text style={styles.detailText}>{student.dueDate}</Text>
              </View>
              {student.email && (
                <View style={styles.detailItem}>
                  <Ionicons name="mail" size={20} color="#6200ee" />
                  <Text style={styles.detailText}>{student.email}</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.actionsCard}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={() => navigation.navigate("AddPayment", { studentId })}
              style={styles.button}
              icon="cash-plus"
            >
              Add Payment
            </Button>
            <Button mode="outlined" onPress={sendReminder} style={styles.button} icon="whatsapp">
              Send WhatsApp Reminder
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.historyCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.historyTitle}>
              Payment History
            </Text>
            {student.payments && student.payments.length > 0 ? (
              student.payments.map((p, i) => (
                <List.Item
                  key={i}
                  title={`₹${p.amount}`}
                  description={new Date(p.date).toLocaleDateString()}
                  left={(props) => <List.Icon {...props} icon="cash" color="#4caf50" />}
                  style={styles.paymentItem}
                />
              ))
            ) : (
              <Text style={styles.noPayments}>No payments made yet.</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 12,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  studentName: {
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusChip: {
    borderRadius: 16,
  },
  detailsContainer: {
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 16,
    color: "#333",
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  button: {
    marginBottom: 12,
    borderRadius: 25,
  },
  historyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  historyTitle: {
    marginBottom: 16,
  },
  paymentItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  noPayments: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    padding: 20,
  },
})
