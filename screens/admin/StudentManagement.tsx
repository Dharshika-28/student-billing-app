"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, Alert, Modal } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import { useAuth } from "../../contexts/AuthContext"

interface Student {
  id: string
  email: string
  studentName: string
  parentName?: string
  createdAt: string
  status: "active" | "inactive"
}

export default function StudentManagement() {
  const { userData } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    filterStudents()
  }, [searchQuery, students])

  const loadStudents = async () => {
    if (!userData) return

    try {
      const studentsQuery = query(
        collection(db, "users"),
        where("userType", "==", "student"),
        where("institutionId", "==", userData.uid),
      )

      const snapshot = await getDocs(studentsQuery)
      const studentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || "active",
      })) as Student[]

      setStudents(studentsData)
    } catch (error) {
      console.error("Error loading students:", error)
      Alert.alert("Error", "Failed to load students")
    } finally {
      setLoading(false)
    }
  }

  const filterStudents = () => {
    if (!searchQuery) {
      setFilteredStudents(students)
    } else {
      const filtered = students.filter(
        (student) =>
          student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (student.parentName && student.parentName.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setFilteredStudents(filtered)
    }
  }

  const toggleStudentStatus = async (student: Student) => {
    try {
      const newStatus = student.status === "active" ? "inactive" : "active"
      await updateDoc(doc(db, "users", student.id), {
        status: newStatus,
      })

      setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, status: newStatus } : s)))

      Alert.alert("Success", `Student ${newStatus === "active" ? "activated" : "deactivated"} successfully`)
    } catch (error) {
      console.error("Error updating student status:", error)
      Alert.alert("Error", "Failed to update student status")
    }
  }

  const deleteStudent = async (student: Student) => {
    Alert.alert(
      "Delete Student",
      `Are you sure you want to delete ${student.studentName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "users", student.id))
              setStudents((prev) => prev.filter((s) => s.id !== student.id))
              Alert.alert("Success", "Student deleted successfully")
            } catch (error) {
              console.error("Error deleting student:", error)
              Alert.alert("Error", "Failed to delete student")
            }
          },
        },
      ],
    )
  }

  const renderStudent = ({ item }: { item: Student }) => (
    <TouchableOpacity
      style={styles.studentCard}
      onPress={() => {
        setSelectedStudent(item)
        setModalVisible(true)
      }}
    >
      <View style={styles.studentInfo}>
        <View style={styles.studentHeader}>
          <Text style={styles.studentName}>{item.studentName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === "active" ? "#10b981" : "#ef4444" }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.studentEmail}>{item.email}</Text>
        {item.parentName && <Text style={styles.parentName}>Parent: {item.parentName}</Text>}
        <Text style={styles.joinDate}>Joined: {new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    </TouchableOpacity>
  )

  const StudentModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Student Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedStudent && (
            <View style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{selectedStudent.studentName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{selectedStudent.email}</Text>
              </View>
              {selectedStudent.parentName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Parent:</Text>
                  <Text style={styles.detailValue}>{selectedStudent.parentName}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text
                  style={[styles.detailValue, { color: selectedStudent.status === "active" ? "#10b981" : "#ef4444" }]}
                >
                  {selectedStudent.status}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Joined:</Text>
                <Text style={styles.detailValue}>{new Date(selectedStudent.createdAt).toLocaleDateString()}</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.toggleButton]}
                  onPress={() => {
                    toggleStudentStatus(selectedStudent)
                    setModalVisible(false)
                  }}
                >
                  <Text style={styles.toggleButtonText}>
                    {selectedStudent.status === "active" ? "Deactivate" : "Activate"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => {
                    deleteStudent(selectedStudent)
                    setModalVisible(false)
                  }}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Student Management</Text>
        <Text style={styles.subtitle}>{students.length} students registered</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadStudents}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No students found</Text>
            <Text style={styles.emptySubtext}>
              Students will appear here when they register with your institution ID
            </Text>
          </View>
        }
      />

      <StudentModal />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: "#1e293b",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  studentCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
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
  studentEmail: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  parentName: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 12,
    color: "#94a3b8",
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
    paddingHorizontal: 40,
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
    paddingBottom: 40,
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
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleButton: {
    backgroundColor: "#2563eb",
  },
  toggleButtonText: {
    color: "white",
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "600",
  },
})
