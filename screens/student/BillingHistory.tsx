"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import { useAuth } from "../../contexts/AuthContext"

interface Bill {
  id: string
  description: string
  amount: number
  dueDate: string
  status: "pending" | "paid" | "overdue"
  createdAt: string
  paidAt?: string
}

export default function BillingHistory({ navigation, route }: any) {
  const { userData } = useAuth()
  const [bills, setBills] = useState<Bill[]>([])
  const [filteredBills, setFilteredBills] = useState<Bill[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid" | "overdue">(
    route.params?.filter || "all",
  )
  const [loading, setLoading] = useState(true)

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
        where("studentId", "==", userData.uid),
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
      Alert.alert("Error", "Failed to load billing history")
    } finally {
      setLoading(false)
    }
  }

  const filterBills = () => {
    let filtered = bills

    if (searchQuery) {
      filtered = filtered.filter((bill) => bill.description.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((bill) => bill.status === filterStatus)
    }

    setFilteredBills(filtered)
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

  const handleDownloadInvoice = (bill: Bill) => {
    if (bill.status === "paid") {
      navigation.navigate("InvoiceViewer", { bill })
    } else {
      Alert.alert("Notice", "Invoice is only available for paid bills")
    }
  }

  const renderBill = ({ item }: { item: Bill }) => (
    <View style={styles.billCard}>
      <View style={styles.billHeader}>
        <Text style={styles.billDescription}>{item.description}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.billDetails}>
        <View style={styles.billInfo}>
          <Text style={styles.billAmount}>${item.amount.toFixed(2)}</Text>
          <Text style={styles.billDate}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
          {item.paidAt && <Text style={styles.paidDate}>Paid: {new Date(item.paidAt).toLocaleDateString()}</Text>}
        </View>

        {item.status === "paid" && (
          <TouchableOpacity style={styles.downloadButton} onPress={() => handleDownloadInvoice(item)}>
            <Ionicons name="download" size={16} color="#2563eb" />
            <Text style={styles.downloadText}>Invoice</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  const FilterButton = ({ status, label }: { status: typeof filterStatus; label: string }) => (
    <TouchableOpacity
      style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
      onPress={() => setFilterStatus(status)}
    >
      <Text style={[styles.filterButtonText, filterStatus === status && styles.filterButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Billing History</Text>
        <Text style={styles.subtitle}>{bills.length} total bills</Text>
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
            <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No bills found</Text>
            <Text style={styles.emptySubtext}>
              {filterStatus === "all" ? "Your billing history will appear here" : `No ${filterStatus} bills found`}
            </Text>
          </View>
        }
      />
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  billDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
    marginRight: 12,
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
  billDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  billInfo: {
    flex: 1,
  },
  billAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  billDate: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  paidDate: {
    fontSize: 14,
    color: "#10b981",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
    marginLeft: 4,
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
})
