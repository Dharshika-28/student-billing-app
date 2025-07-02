"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from "react-native"
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
}

interface DashboardStats {
  totalBills: number
  pendingAmount: number
  overdueCount: number
  paidThisMonth: number
}

export default function StudentDashboard({ navigation }: any) {
  const { userData } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalBills: 0,
    pendingAmount: 0,
    overdueCount: 0,
    paidThisMonth: 0,
  })
  const [recentBills, setRecentBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    if (!userData) return

    try {
      // Load all bills for this student
      const billsQuery = query(
        collection(db, "bills"),
        where("studentId", "==", userData.uid),
        orderBy("createdAt", "desc"),
      )

      const billsSnapshot = await getDocs(billsQuery)
      const bills = billsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Bill[]

      // Calculate stats
      let pendingAmount = 0
      let overdueCount = 0
      let paidThisMonth = 0
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      bills.forEach((bill) => {
        const dueDate = new Date(bill.dueDate)

        if (bill.status === "pending") {
          pendingAmount += bill.amount
          if (dueDate < now) {
            overdueCount++
          }
        } else if (bill.status === "paid") {
          const createdDate = new Date(bill.createdAt)
          if (createdDate >= thisMonth) {
            paidThisMonth += bill.amount
          }
        }
      })

      // Get recent bills (last 5)
      const recentBillsData = bills.slice(0, 5)

      setStats({
        totalBills: bills.length,
        pendingAmount,
        overdueCount,
        paidThisMonth,
      })
      setRecentBills(recentBillsData)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
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

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Ionicons name={icon} size={32} color={color} />
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboardData} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello!</Text>
          <Text style={styles.studentName}>{userData?.studentName}</Text>
        </View>

        <View style={styles.statsContainer}>
          <StatCard title="Total Bills" value={stats.totalBills} icon="receipt" color="#2563eb" />
          <StatCard title="Pending Amount" value={`$${stats.pendingAmount.toFixed(2)}`} icon="time" color="#f59e0b" />
          <StatCard title="Overdue Bills" value={stats.overdueCount} icon="warning" color="#ef4444" />
          <StatCard
            title="Paid This Month"
            value={`$${stats.paidThisMonth.toFixed(2)}`}
            icon="checkmark-circle"
            color="#10b981"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bills</Text>
            <TouchableOpacity onPress={() => navigation.navigate("History")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentBills.length > 0 ? (
            recentBills.map((bill) => (
              <View key={bill.id} style={styles.billCard}>
                <View style={styles.billInfo}>
                  <Text style={styles.billDescription}>{bill.description}</Text>
                  <Text style={styles.billDate}>Due: {new Date(bill.dueDate).toLocaleDateString()}</Text>
                </View>
                <View style={styles.billAmount}>
                  <Text style={styles.billAmountText}>${bill.amount.toFixed(2)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bill.status) }]}>
                    <Text style={styles.statusText}>{bill.status}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No bills yet</Text>
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("History")}>
              <Ionicons name="time" size={24} color="#2563eb" />
              <Text style={styles.actionButtonText}>View History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("History", { filter: "pending" })}
            >
              <Ionicons name="card" size={24} color="#2563eb" />
              <Text style={styles.actionButtonText}>Pending Bills</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("History", { filter: "paid" })}
            >
              <Ionicons name="download" size={24} color="#2563eb" />
              <Text style={styles.actionButtonText}>Download Invoices</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: "#64748b",
  },
  studentName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 4,
  },
  statsContainer: {
    padding: 20,
    paddingTop: 10,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  statTitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  viewAllText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
  },
  billCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  billInfo: {
    flex: 1,
  },
  billDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  billDate: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  billAmount: {
    alignItems: "flex-end",
  },
  billAmountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    fontStyle: "italic",
    marginTop: 20,
  },
  quickActions: {
    padding: 20,
    paddingTop: 10,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 12,
    color: "#2563eb",
    marginTop: 8,
    textAlign: "center",
  },
})
