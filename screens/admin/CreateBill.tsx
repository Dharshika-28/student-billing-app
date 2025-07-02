"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, Alert, Modal } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import { useAuth } from "../../contexts/AuthContext"

interface Bill {
  id: string
  studentId: string
  studentName: string
  description: string
  amount: number
  dueDate: string
  status: "pending" | "paid" | "overdue"
  createdAt: string
  paidAt?: string
}

export default function BillingManagement({ navigation }: any) {
  const { userData } = useAuth()
  const [bills, setBills] = useState<Bill[]>([])
  const [filteredBills, setFilteredBills] = useState<Bill[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid" | "overdue">("all")
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    loadBills()
  }, [])

  useEffect(() => {
    filterBills()
  }, [searchQuery, filterStatus, bills])

  const loadBills = async () => {
    if (!userData) return

    try {
      const billsQuery = query(
        collection(db, "bills"),
        where("institutionId", "==", userData.uid),
        orderBy("createdAt", "desc"),
      )

      const snapshot = await getDocs(billsQuery)
      const billsData = snapshot.docs.map((doc) => {
        const data = doc.data()
        const dueDate = new Date(data.dueDate)
        const now = new Date()

        // Update status based on due date
        let status = data.status
        if (status === "pending" && dueDate < now) {
          status = "overdue"
        }

        return {
          id: doc.id,
          ...data,
          status,
        }
      }) as Bill[]

      setBills(billsData)
    } catch (error) {
      console.error("Error loading bills:", error)
      Alert.alert("Error", "Failed to load bills")
    } finally {
      setLoading(false)
    }
  }

  const filterBills = () => {
    let filtered = bills

    if (searchQuery) {
      filtered = filtered.filter(
        (bill) =>
          bill.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bill.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((bill) => bill.status === filterStatus)
    }

    setFilteredBills(filtered)
  }

  const markAsPaid = async (bill: Bill) => {
    try {
      await updateDoc(doc(db, "bills", bill.id), {
        status: "paid",
        paidAt: new Date().toISOString(),
      })

      setBills((prev) =>
        prev.map((b) => (b.id === bill.id ? { ...b, status: "paid", paidAt: new Date().toISOString() } : b)),
      )

      Alert.alert("Success", "Payment marked as received")
    } catch (error) {
      console.error("Error updating bill:", error)
      Alert.alert("Error", "Failed to update payment status")
    }
  }

  const sendReminder = async (bill: Bill) => {
    try {
      // Get student's push token
      const studentDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", bill.studentId)))

      if (!studentDoc.empty) {
        const studentData = studentDoc.docs[0].data()
        if (studentData.pushToken) {
          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Accept-encoding": "gzip, deflate",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: studentData.pushToken,
              title: "Payment Reminder",
              body: `Your payment of $${bill.amount} for ${bill.description} is due on ${new Date(bill.dueDate).toLocaleDateString()}`,
              data: { billId: bill.id },
            }),
          })

          Alert.alert("Success", "Reminder sent successfully")
        } else {
          Alert.alert("Error", "Student has not enabled push notifications")
        }
      }
    } catch (error) {
      console.error("Error sending reminder:", error)
      Alert.alert("Error", "Failed to send reminder")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "#10b981"
      case "overdue":
        return "#ef4444"
      case "pending":
        return "#f59e0b"
      default:
        return "#64748b"
    }
  }

  const renderBill = ({ item }: { item: Bill }) => (
    <TouchableOpacity
      style={styles.billCard}
      onPress={() => {
        setSelectedBill(item)
        setModalVisible(true)
      }}
    >
      <View style={styles.billInfo}>
        <View style={styles.billHeader}>
          <Text style={styles.studentName}>{item.studentName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.billDescription}>{item.description}</Text>
        <Text style={styles.billAmount}>${item.amount.toFixed(2)}</Text>
        <Text style={styles.dueDate}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    </TouchableOpacity>
  )

  const FilterButton = ({ status, label }: { status: typeof filterStatus; label: string }) => (
    <TouchableOpacity
      style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
      onPress={() => setFilterStatus(status)}
    >
      <Text style={[styles.filterButtonText, filterStatus === status && styles.filterButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  )

  const BillModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bill Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedBill && (
            <View style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Student:</Text>
                <Text style={styles.detailValue}>{selectedBill.studentName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>{selectedBill.description}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>${selectedBill.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Due Date:</Text>
                <Text style={styles.detailValue}>{new Date(selectedBill.dueDate).toLocaleDateString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, { color: getStatusColor(selectedBill.status) }]}>
                  {selectedBill.status}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>{new Date(selectedBill.createdAt).toLocaleDateString()}</Text>
              </View>
              {selectedBill.paidAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Paid:</Text>
                  <Text style={styles.detailValue}>{new Date(selectedBill.paidAt).toLocaleDateString()}</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                {selectedBill.status !== "paid" && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.paidButton]}
                      onPress={() => {
                        markAsPaid(selectedBill)
                        setModalVisible(false)
                      }}
                    >
                      <Text style={styles.paidButtonText}>Mark as Paid</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.reminderButton]}
                      onPress={() => {
                        sendReminder(selectedBill)
                        setModalVisible(false)
                      }}
                    >
                      <Text style={styles.reminderButtonText}>Send Reminder</Text>
                    </TouchableOpacity>
                  </>
                )}
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
        <Text style={styles.title}>Billing Management</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate("CreateBill")}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create Bill</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search bills..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <FilterButton status="all" label="All" />
        <FilterButton status="pending" label="Pending" />
        <FilterButton status="paid" label="Paid" />
        <FilterButton status="overdue" label="Overdue" />
      </View>

      <FlatList
        data={filteredBills}
        renderItem={renderBill}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadBills}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No bills found</Text>
            <Text style={styles.emptySubtext}>Create your first bill to get started</Text>
          </View>
        }
      />

      <BillModal />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 16,
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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "white",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  billCard: {
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
  billInfo: {
    flex: 1,
  },
  billHeader: {
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
  billDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  billAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  dueDate: {
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
  paidButton: {
    backgroundColor: "#10b981",
  },
  paidButtonText: {
    color: "white",
    fontWeight: "600",
  },
  reminderButton: {
    backgroundColor: "#f59e0b",
  },
  reminderButtonText: {
    color: "white",
    fontWeight: "600",
  },
})
