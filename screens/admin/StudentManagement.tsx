"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, Alert, Modal } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "../../config/firebase"
import { useAuth } from "../../contexts/AuthContext"
import { LinearGradient } from "expo-linear-gradient"

interface Student {
  id: string
  email: string
  studentName: string
  parentName?: string
  studentId: string
  phone?: string
  address?: string
  createdAt: string
  status: "active" | "inactive"
}

export default function StudentManagement({ navigation }: any) {
  const { userData } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    filterStudents()
  }, [searchQuery, filterStatus, students])

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
    let filtered = students

    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (student.parentName && student.parentName.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((student) => student.status === filterStatus)
    }

    setFilteredStudents(filtered)
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

  const renderStudent = ({ item, index }: { item: Student; index: number }) => (
    <TouchableOpacity
      style={[styles.studentCard, { marginTop: index === 0 ? 0 : 16 }]}
      onPress={() => {
        setSelectedStudent(item)
        setModalVisible(true)
      }}
    >
      <LinearGradient
        colors={item.status === "active" ? ["#ffffff", "#f0f9ff"] : ["#ffffff", "#fef2f2"]}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={item.status === "active" ? ["#10b981", "#2563eb"] : ["#ef4444", "#f59e0b"]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{item.studentName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.studentName}</Text>
            <Text style={styles.studentId}>ID: {item.studentId}</Text>
            <Text style={styles.studentEmail}>{item.email}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View
              style={[styles.statusIndicator, { backgroundColor: item.status === "active" ? "#10b981" : "#ef4444" }]}
            />
            <Text style={[styles.statusText, { color: item.status === "active" ? "#10b981" : "#ef4444" }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {item.parentName && (
            <View style={styles.infoRow}>
              <Ionicons name="people" size={16} color="#64748b" />
              <Text style={styles.infoText}>Parent: {item.parentName}</Text>
            </View>
          )}
          {item.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={16} color="#64748b" />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color="#64748b" />
            <Text style={styles.infoText}>Joined {new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.actionChip}>
            <Ionicons name="eye" size={14} color="#2563eb" />
            <Text style={styles.actionChipText}>View Details</Text>
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )

  const FilterChip = ({ status, label, count }: { status: typeof filterStatus; label: string; count: number }) => (
    <TouchableOpacity
      style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
      onPress={() => setFilterStatus(status)}
    >
      <LinearGradient
        colors={filterStatus === status ? ["#10b981", "#2563eb"] : ["#ffffff", "#ffffff"]}
        style={styles.filterChipGradient}
      >
        <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
          {label} ({count})
        </Text>
      </LinearGradient>
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
          <LinearGradient colors={["#10b981", "#2563eb"]} style={styles.modalHeaderGradient}>
            <View style={styles.modalHeader}>
              <View style={styles.modalAvatarContainer}>
                <Text style={styles.modalAvatarText}>{selectedStudent?.studentName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.modalHeaderInfo}>
                <Text style={styles.modalTitle}>{selectedStudent?.studentName}</Text>
                <Text style={styles.modalSubtitle}>Student Details</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {selectedStudent && (
            <View style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={20} color="#2563eb" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Full Name</Text>
                      <Text style={styles.detailValue}>{selectedStudent.studentName}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="mail" size={20} color="#2563eb" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Email</Text>
                      <Text style={styles.detailValue}>{selectedStudent.email}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="card" size={20} color="#2563eb" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Student ID</Text>
                      <Text style={styles.detailValue}>{selectedStudent.studentId}</Text>
                    </View>
                  </View>
                  {selectedStudent.parentName && (
                    <View style={styles.detailRow}>
                      <Ionicons name="people" size={20} color="#2563eb" />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Parent/Guardian</Text>
                        <Text style={styles.detailValue}>{selectedStudent.parentName}</Text>
                      </View>
                    </View>
                  )}
                  {selectedStudent.phone && (
                    <View style={styles.detailRow}>
                      <Ionicons name="call" size={20} color="#2563eb" />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Phone</Text>
                        <Text style={styles.detailValue}>{selectedStudent.phone}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Account Status</Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Ionicons
                      name={selectedStudent.status === "active" ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={selectedStudent.status === "active" ? "#10b981" : "#ef4444"}
                    />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: selectedStudent.status === "active" ? "#10b981" : "#ef4444" },
                        ]}
                      >
                        {selectedStudent.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={20} color="#2563eb" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Joined Date</Text>
                      <Text style={styles.detailValue}>{new Date(selectedStudent.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    toggleStudentStatus(selectedStudent)
                    setModalVisible(false)
                  }}
                >
                  <LinearGradient
                    colors={selectedStudent.status === "active" ? ["#f59e0b", "#ef4444"] : ["#10b981", "#2563eb"]}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name={selectedStudent.status === "active" ? "pause" : "play"} size={16} color="white" />
                    <Text style={styles.actionButtonText}>
                      {selectedStudent.status === "active" ? "Deactivate" : "Activate"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    deleteStudent(selectedStudent)
                    setModalVisible(false)
                  }}
                >
                  <LinearGradient colors={["#ef4444", "#dc2626"]} style={styles.actionButtonGradient}>
                    <Ionicons name="trash" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )

  const activeCount = students.filter((s) => s.status === "active").length
  const inactiveCount = students.filter((s) => s.status === "inactive").length

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#10b981", "#2563eb"]} style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Student Management</Text>
            <Text style={styles.subtitle}>{students.length} students registered</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddStudent")}>
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.addButtonGradient}
            >
              <Ionicons name="person-add" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <LinearGradient colors={["#ffffff", "#f8fafc"]} style={styles.searchGradient}>
            <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students by name, email, or ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </LinearGradient>
        </View>

        <View style={styles.filterContainer}>
          <FilterChip status="all" label="All" count={students.length} />
          <FilterChip status="active" label="Active" count={activeCount} />
          <FilterChip status="inactive" label="Inactive" count={inactiveCount} />
        </View>
      </View>

      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadStudents}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient colors={["#f1f5f9", "#e2e8f0"]} style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={48} color="#94a3b8" />
            </LinearGradient>
            <Text style={styles.emptyText}>No students found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Students will appear here when they register with your institution ID"}
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
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  addButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  addButtonGradient: {
    padding: 12,
  },
  searchSection: {
    padding: 20,
    paddingBottom: 10,
  },
  searchContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    shadowOpacity: 0.15,
    elevation: 3,
  },
  filterChipGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.5)",
  },
  filterChipText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "white",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  studentCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  studentId: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 14,
    color: "#64748b",
  },
  statusContainer: {
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#64748b",
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.5)",
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionChipText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    overflow: "hidden",
  },
  modalHeaderGradient: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
})
