"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import { useAuth } from "../../contexts/AuthContext"

interface DashboardStats {
  totalStudents: number
  pendingBills: number
  totalRevenue: number
  overduePayments: number
}

export default function AdminDashboard() {
  const { userData } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    pendingBills: 0,
    totalRevenue: 0,
    overduePayments: 0,
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
      const now = new Date()

      billsSnapshot.forEach((doc) => {
        const bill = doc.data()
        if (bill.status === "pending") {
          pendingBills++
          if (new Date(bill.dueDate) < now) {
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
      })
      setRecentBills(recentBillsData)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
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
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.institutionName}>{userData?.institutionName}</Text>
        </View>

        <View style={styles.statsContainer}>
          <StatCard title="Total Students" value={stats.totalStudents} icon="people" color="#10b981" />
          <StatCard title="Pending Bills" value={stats.pendingBills} icon="time" color="#f59e0b" />
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon="card"
            color="#2563eb"
          />
          <StatCard title="Overdue" value={stats.overduePayments} icon="warning" color="#ef4444" />
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
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="person-add" size={24} color="#2563eb" />
              <Text style={styles.actionButtonText}>Add Student</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="card" size={24} color="#2563eb" />
              <Text style={styles.actionButtonText}>Create Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="notifications" size={24} color="#2563eb" />
              <Text style={styles.actionButtonText}>Send Reminder</Text>
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
  institutionName: {
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
