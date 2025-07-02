"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import { useAuth } from "../../contexts/AuthContext"
import { LinearGradient } from "expo-linear-gradient"

interface DashboardStats {
  pendingBills: number
  totalPaid: number
  overduePayments: number
  nextDueAmount: number
  nextDueDate: string
}

export default function StudentDashboard({ navigation }: any) {
  const { userData } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    pendingBills: 0,
    totalPaid: 0,
    overduePayments: 0,
    nextDueAmount: 0,
    nextDueDate: "",
  })
  const [recentBills, setRecentBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    if (!userData) return

    try {
      // Load bills data
      const billsQuery = query(
        collection(db, "bills"),
        where("studentId", "==", userData.uid),
        orderBy("createdAt", "desc"),
      )
      const billsSnapshot = await getDocs(billsQuery)

      let pendingBills = 0
      let totalPaid = 0
      let overduePayments = 0
      let nextDueAmount = 0
      let nextDueDate = ""
      const now = new Date()

      const bills = billsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      // Find next due bill
      const pendingBillsSorted = bills
        .filter((bill) => bill.status === "pending")
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

      if (pendingBillsSorted.length > 0) {
        nextDueAmount = pendingBillsSorted[0].amount
        nextDueDate = pendingBillsSorted[0].dueDate
      }

      bills.forEach((bill) => {
        const dueDate = new Date(bill.dueDate)

        if (bill.status === "pending") {
          pendingBills++
          if (dueDate < now) {
            overduePayments++
          }
        } else if (bill.status === "paid") {
          totalPaid += bill.amount
        }
      })

      // Load recent bills (last 5)
      const recentBillsData = bills.slice(0, 5)

      setStats({
        pendingBills,
        totalPaid,
        overduePayments,
        nextDueAmount,
        nextDueDate,
      })
      setRecentBills(recentBillsData)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <LinearGradient colors={[color, `${color}80`]} style={styles.statGradient}>
        <View style={styles.statContent}>
          <View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
          </View>
          <Ionicons name={icon} size={32} color="white" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboardData} />}
      >
        <LinearGradient colors={["#10b981", "#2563eb"]} style={styles.headerGradient}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.studentName}>{userData?.studentName}</Text>
            <Text style={styles.institutionName}>{userData?.institutionName}</Text>
          </View>
        </LinearGradient>

        {stats.nextDueAmount > 0 && (
          <View style={styles.nextDueContainer}>
            <LinearGradient colors={["#f59e0b", "#ef4444"]} style={styles.nextDueGradient}>
              <View style={styles.nextDueContent}>
                <Ionicons name="warning" size={24} color="white" />
                <View style={styles.nextDueInfo}>
                  <Text style={styles.nextDueTitle}>Next Payment Due</Text>
                  <Text style={styles.nextDueAmount}>${stats.nextDueAmount.toFixed(2)}</Text>
                  <Text style={styles.nextDueDate}>Due: {new Date(stats.nextDueDate).toLocaleDateString()}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        <View style={styles.statsContainer}>
          <StatCard
            title="Pending Bills"
            value={stats.pendingBills}
            icon="time"
            color="#f59e0b"
            onPress={() => navigation.navigate("History", { filter: "pending" })}
          />
          <StatCard
            title="Total Paid"
            value={`$${stats.totalPaid.toLocaleString()}`}
            icon="checkmark-circle"
            color="#10b981"
            onPress={() => navigation.navigate("History", { filter: "paid" })}
          />
          <StatCard
            title="Overdue"
            value={stats.overduePayments}
            icon="warning"
            color="#ef4444"
            onPress={() => navigation.navigate("History", { filter: "overdue" })}
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
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          bill.status === "paid" ? "#10b981" : bill.status === "overdue" ? "#ef4444" : "#f59e0b",
                      },
                    ]}
                  >
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
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  studentName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 4,
  },
  institutionName: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  nextDueContainer: {
    margin: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  nextDueGradient: {
    padding: 16,
  },
  nextDueContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  nextDueInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nextDueTitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  nextDueAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginTop: 2,
  },
  nextDueDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  statsContainer: {
    padding: 20,
    paddingTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  statGradient: {
    padding: 16,
  },
  statContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  statTitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
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
