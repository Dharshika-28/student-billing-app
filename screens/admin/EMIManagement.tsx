"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import { useAuth } from "../../contexts/AuthContext"
import { LinearGradient } from "expo-linear-gradient"

interface EMISchedule {
  id: string
  studentId: string
  studentName: string
  totalAmount: number
  installments: number
  installmentAmount: number
  startDate: string
  frequency: "monthly" | "quarterly" | "semester"
  description: string
  status: "active" | "completed" | "paused"
}

export default function EMIManagement({ navigation }: any) {
  const { userData } = useAuth()
  const [emiSchedules, setEmiSchedules] = useState<EMISchedule[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form states
  const [selectedStudent, setSelectedStudent] = useState("")
  const [totalAmount, setTotalAmount] = useState("")
  const [installments, setInstallments] = useState("")
  const [frequency, setFrequency] = useState<"monthly" | "quarterly" | "semester">("monthly")
  const [startDate, setStartDate] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!userData) return

    try {
      // Load students
      const studentsQuery = query(
        collection(db, "users"),
        where("userType", "==", "student"),
        where("institutionId", "==", userData.uid),
      )
      const studentsSnapshot = await getDocs(studentsQuery)
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setStudents(studentsData)

      // Load EMI schedules
      const emiQuery = query(collection(db, "emiSchedules"), where("institutionId", "==", userData.uid))
      const emiSnapshot = await getDocs(emiQuery)
      const emiData = emiSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EMISchedule[]
      setEmiSchedules(emiData)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const createEMISchedule = async () => {
    if (!selectedStudent || !totalAmount || !installments || !startDate || !description) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    const student = students.find((s) => s.id === selectedStudent)
    if (!student) return

    const installmentAmount = Number.parseFloat(totalAmount) / Number.parseInt(installments)

    setLoading(true)
    try {
      const emiData = {
        studentId: selectedStudent,
        studentName: student.studentName,
        totalAmount: Number.parseFloat(totalAmount),
        installments: Number.parseInt(installments),
        installmentAmount,
        startDate,
        frequency,
        description,
        status: "active",
        institutionId: userData?.uid,
        createdAt: new Date().toISOString(),
      }

      await addDoc(collection(db, "emiSchedules"), emiData)

      // Generate individual bills for each installment
      const startDateObj = new Date(startDate)
      for (let i = 0; i < Number.parseInt(installments); i++) {
        const dueDate = new Date(startDateObj)

        switch (frequency) {
          case "monthly":
            dueDate.setMonth(dueDate.getMonth() + i)
            break
          case "quarterly":
            dueDate.setMonth(dueDate.getMonth() + i * 3)
            break
          case "semester":
            dueDate.setMonth(dueDate.getMonth() + i * 6)
            break
        }

        const billData = {
          studentId: selectedStudent,
          studentName: student.studentName,
          amount: installmentAmount,
          description: `${description} - Installment ${i + 1}/${installments}`,
          dueDate: dueDate.toISOString(),
          status: "pending",
          institutionId: userData?.uid,
          createdAt: new Date().toISOString(),
          emiScheduleId: "temp", // Will be updated after EMI creation
          installmentNumber: i + 1,
        }

        await addDoc(collection(db, "bills"), billData)
      }

      Alert.alert("Success", "EMI schedule created successfully!")
      setModalVisible(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error("Error creating EMI schedule:", error)
      Alert.alert("Error", "Failed to create EMI schedule")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedStudent("")
    setTotalAmount("")
    setInstallments("")
    setFrequency("monthly")
    setStartDate("")
    setDescription("")
  }

  const getFrequencyText = (freq: string) => {
    switch (freq) {
      case "monthly":
        return "Monthly"
      case "quarterly":
        return "Quarterly"
      case "semester":
        return "Semester"
      default:
        return freq
    }
  }

  const EMICard = ({ emi }: { emi: EMISchedule }) => (
    <View style={styles.emiCard}>
      <View style={styles.emiHeader}>
        <Text style={styles.studentName}>{emi.studentName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: emi.status === "active" ? "#10b981" : "#64748b" }]}>
          <Text style={styles.statusText}>{emi.status}</Text>
        </View>
      </View>
      <Text style={styles.emiDescription}>{emi.description}</Text>
      <View style={styles.emiDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Amount:</Text>
          <Text style={styles.detailValue}>${emi.totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Installments:</Text>
          <Text style={styles.detailValue}>
            {emi.installments} x ${emi.installmentAmount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Frequency:</Text>
          <Text style={styles.detailValue}>{getFrequencyText(emi.frequency)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Start Date:</Text>
          <Text style={styles.detailValue}>{new Date(emi.startDate).toLocaleDateString()}</Text>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#10b981", "#2563eb"]} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>EMI Management</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {emiSchedules.length > 0 ? (
          emiSchedules.map((emi) => <EMICard key={emi.id} emi={emi} />)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No EMI schedules found</Text>
            <Text style={styles.emptySubtext}>Create your first EMI schedule to get started</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create EMI Schedule</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Select Student *</Text>
              <View style={styles.pickerContainer}>
                {students.map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    style={[styles.studentOption, selectedStudent === student.id && styles.selectedOption]}
                    onPress={() => setSelectedStudent(student.id)}
                  >
                    <Text
                      style={[styles.studentOptionText, selectedStudent === student.id && styles.selectedOptionText]}
                    >
                      {student.studentName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Description *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Annual Tuition Fee"
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.fieldLabel}>Total Amount *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                value={totalAmount}
                onChangeText={setTotalAmount}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Number of Installments *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="12"
                value={installments}
                onChangeText={setInstallments}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Frequency *</Text>
              <View style={styles.frequencyContainer}>
                {["monthly", "quarterly", "semester"].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[styles.frequencyOption, frequency === freq && styles.selectedFrequency]}
                    onPress={() => setFrequency(freq as any)}
                  >
                    <Text style={[styles.frequencyText, frequency === freq && styles.selectedFrequencyText]}>
                      {getFrequencyText(freq)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Start Date *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
              />

              <TouchableOpacity
                style={[styles.createButton, loading && styles.createButtonDisabled]}
                onPress={createEMISchedule}
                disabled={loading}
              >
                <LinearGradient colors={["#10b981", "#2563eb"]} style={styles.createButtonGradient}>
                  <Text style={styles.createButtonText}>{loading ? "Creating..." : "Create EMI Schedule"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 30,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emiCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  emiDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
  },
  emiDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  detailValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  modalBody: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1e293b",
  },
  pickerContainer: {
    maxHeight: 120,
  },
  studentOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectedOption: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  studentOptionText: {
    fontSize: 14,
    color: "#64748b",
  },
  selectedOptionText: {
    color: "#2563eb",
    fontWeight: "500",
  },
  frequencyContainer: {
    flexDirection: "row",
    gap: 8,
  },
  frequencyOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  selectedFrequency: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  frequencyText: {
    fontSize: 14,
    color: "#64748b",
  },
  selectedFrequencyText: {
    color: "#2563eb",
    fontWeight: "500",
  },
  createButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 24,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
