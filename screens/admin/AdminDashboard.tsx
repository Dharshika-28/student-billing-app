"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import { useAuth } from "../../contexts/AuthContext"
import { LinearGradient } from "expo-linear-gradient"

interface DashboardStats {
  totalStudents: number
  pendingBills: number
  totalRevenue: number
  overduePayments: number
  todaysDue: number
}

export default function AdminDashboard({ navigation }: any) {
  const { userData } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    pendingBills: 0,
    totalRevenue: 0,
    overduePayments: 0,
    todaysDue: 0,
  })
  const [recentBills, setRecentBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    if (!userData) return

    try {
      // Load students count
      const studentsQuery = query(
        collection(db, "users"),
        where("userType", "==", "student"),
        where("institutionId", "==", userData.uid),
      )
      const studentsSnapshot = await getDocs(studentsQuery)
      const totalStudents = studentsSnapshot.size

      // Load bills data
      const billsQuery = query(collection(db, "bills"), where("institutionId", "==", userData.uid))
      const billsSnapshot = await getDocs(billsQuery)

      let pendingBills = 0
      let totalRevenue = 0
      let overduePayments = 0
      let todaysDue = 0
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      billsSnapshot.forEach((doc) => {
        const bill = doc.data()
        const dueDate = new Date(bill.dueDate)
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

        if (bill.status === "pending") {
          pendingBills++
          if (dueDateOnly.getTime() === today.getTime()) {
            todaysDue++
          }
          if (dueDate < now) {
            overduePayments++
          }
        } else if (bill.status === "paid") {
          totalRevenue += bill.amount
        }
      })

      // Load recent bills
      const recentBillsQuery = query(
        collection(db, "bills"),
        where("institutionId", "==", userData.uid),
        orderBy("createdAt", "desc"),
        limit(5),
      )
      const recentBillsSnapshot = await getDocs(recentBillsQuery)
      const recentBillsData = recentBillsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setStats({
        totalStudents,
        pendingBills,
        totalRevenue,
        overduePayments,
        todaysDue,
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
            <Text style={styles.institutionName}>{userData?.institutionName}</Text>
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon="people"
            color="#10b981"
            onPress={() => navigation.navigate("Students")}
          />
          <StatCard
            title="Today's Due"
            value={stats.todaysDue}
            icon="today"
            color="#f59e0b"
            onPress={() => navigation.navigate("Billing", { filter: "today" })}
          />
          <StatCard
            title="Pending Bills"
            value={stats.pendingBills}
            icon="time"
            color="#8b5cf6"
            onPress={() => navigation.navigate("Billing", { filter: "pending" })}
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon="card"
            color="#2563eb"
            onPress={() => navigation.navigate("Billing", { filter: "paid" })}
          />
          <StatCard
            title="Overdue"
            value={stats.overduePayments}
            icon="warning"
            color="#ef4444"
            onPress={() => navigation.navigate("Billing", { filter: "overdue" })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bills</Text>
          {recentBills.length > 0 ? (
            recentBills.map((bill) => (
              <View key={bill.id} style={styles.billCard}>
                <View style={styles.billInfo}>
                  <Text style={styles.billStudent}>{bill.studentName}</Text>
                  <Text style={styles.billDescription}>{bill.description}</Text>
                  <Text style={styles.billDate}>Due: {new Date(bill.dueDate).toLocaleDateString()}</Text>
                </View>
                <View style={styles.billAmount}>
                  <Text style={styles.billAmountText}>${bill.amount}</Text>
                  <View
                    style={[styles.statusBadge, { backgroundColor: bill.status === "paid" ? "#10b981" : "#f59e0b" }]}
                  >
                    <Text style={styles.statusText}>{bill.status}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No bills created yet</Text>
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("AddStudent")}>
              <Ionicons name="person-add" size={24} color="#2563eb" />
              <Text style={styles.actionButtonText}>Add Student</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("CreateBill")}>
              <Ionicons name="card" size={24} color="#2563eb" />
              <Text style={styles.actionButtonText}>Create Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("EMIManagement")}>
              <Ionicons name="calendar" size={24} color="#2563eb" />
              <Text style={styles.actionButtonText}>EMI Setup</Text>
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
  institutionName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 4,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
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
  billStudent: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  billDescription: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
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
