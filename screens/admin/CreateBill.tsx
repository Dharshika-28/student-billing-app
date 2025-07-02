"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import { useAuth } from "../../contexts/AuthContext"
import { LinearGradient } from "expo-linear-gradient"

interface Props {
  navigation: any
}

export default function CreateBill({ navigation }: Props) {
  const { userData } = useAuth()
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStudents()
    // Set default due date to today
    const today = new Date()
    setDueDate(today.toISOString().split("T")[0])
  }, [])

  const loadStudents = async () => {
    if (!userData) return

    try {
      const studentsQuery = query(
        collection(db, "users"),
        where("userType", "==", "student"),
        where("institutionId", "==", userData.uid),
        where("status", "==", "active"),
      )

      const snapshot = await getDocs(studentsQuery)
      const studentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setStudents(studentsData)
    } catch (error) {
      console.error("Error loading students:", error)
      Alert.alert("Error", "Failed to load students")
    }
  }

  const handleCreateBill = async () => {
    if (!selectedStudent || !description || !amount || !dueDate) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    const student = students.find((s) => s.id === selectedStudent)
    if (!student) {
      Alert.alert("Error", "Selected student not found")
      return
    }

    setLoading(true)
    try {
      const billData = {
        studentId: selectedStudent,
        studentName: student.studentName,
        description,
        amount: Number.parseFloat(amount),
        dueDate: new Date(dueDate).toISOString(),
        status: "pending",
        institutionId: userData?.uid,
        createdAt: new Date().toISOString(),
      }

      await addDoc(collection(db, "bills"), billData)

      Alert.alert("Success", "Bill created successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error) {
      console.error("Error creating bill:", error)
      Alert.alert("Error", "Failed to create bill")
    } finally {
      setLoading(false)
    }
  }

  const setQuickDueDate = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    setDueDate(date.toISOString().split("T")[0])
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#10b981", "#2563eb"]} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Create New Bill</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>Select Student</Text>
              <View style={styles.studentsContainer}>
                {students.map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    style={[styles.studentCard, selectedStudent === student.id && styles.selectedStudentCard]}
                    onPress={() => setSelectedStudent(student.id)}
                  >
                    <View style={styles.studentInfo}>
                      <Text style={[styles.studentName, selectedStudent === student.id && styles.selectedStudentName]}>
                        {student.studentName}
                      </Text>
                      <Text style={styles.studentId}>ID: {student.studentId}</Text>
                    </View>
                    {selectedStudent === student.id && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Bill Details</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="document-text" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Description (e.g., Tuition Fee, Library Fee)"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="card" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Amount"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.sectionTitle}>Due Date</Text>
              <View style={styles.quickDateContainer}>
                <TouchableOpacity style={styles.quickDateButton} onPress={() => setQuickDueDate(0)}>
                  <Text style={styles.quickDateText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickDateButton} onPress={() => setQuickDueDate(7)}>
                  <Text style={styles.quickDateText}>7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickDateButton} onPress={() => setQuickDueDate(30)}>
                  <Text style={styles.quickDateText}>30 Days</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="calendar" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={dueDate} onChangeText={setDueDate} />
              </View>

              <TouchableOpacity
                style={[styles.createButton, loading && styles.createButtonDisabled]}
                onPress={handleCreateBill}
                disabled={loading}
              >
                <LinearGradient colors={["#10b981", "#2563eb"]} style={styles.buttonGradient}>
                  <Text style={styles.createButtonText}>{loading ? "Creating Bill..." : "Create Bill"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerGradient: {
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 30,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  form: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
    marginTop: 20,
  },
  studentsContainer: {
    maxHeight: 200,
    marginBottom: 20,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectedStudentCard: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
  },
  selectedStudentName: {
    color: "#2563eb",
  },
  studentId: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#1e293b",
  },
  quickDateContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  quickDateButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    alignItems: "center",
  },
  quickDateText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
  },
  createButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 20,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
