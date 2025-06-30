"use client"

import { useEffect, useState } from "react"
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Animated } from "react-native"
import { Text, Card, Chip, Searchbar, Menu, Button } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebase/firebaseConfig"

export default function StudentList({ navigation }) {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortFilter, setSortFilter] = useState("all")
  const [menuVisible, setMenuVisible] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    fetchStudents()
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
  }, [])

  useEffect(() => {
    filterStudents()
  }, [students, searchQuery, sortFilter])

  const fetchStudents = async () => {
    setRefreshing(true)
    const querySnapshot = await getDocs(collection(db, "students"))
    const studentList = []
    querySnapshot.forEach((doc) => {
      studentList.push({ id: doc.id, ...doc.data() })
    })
    setStudents(studentList)
    setRefreshing(false)
  }

  const filterStudents = () => {
    let filtered = students.filter((student) => student.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const today = new Date().toDateString()

    switch (sortFilter) {
      case "paid":
        filtered = filtered.filter((student) => student.balance <= 0)
        break
      case "due":
        filtered = filtered.filter((student) => student.balance > 0)
        break
      case "today":
        filtered = filtered.filter((student) => student.dueDate === today)
        break
      case "overdue":
        filtered = filtered.filter((student) => {
          const dueDate = new Date(student.dueDate)
          return student.balance > 0 && dueDate < new Date()
        })
        break
      default:
        break
    }

    setFilteredStudents(filtered)
  }

  const getStatusColor = (student) => {
    if (student.balance <= 0) return "#4caf50"
    const dueDate = new Date(student.dueDate)
    const today = new Date()
    if (dueDate < today) return "#f44336"
    if (dueDate.toDateString() === today.toDateString()) return "#ff9800"
    return "#2196f3"
  }

  const getStatusText = (student) => {
    if (student.balance <= 0) return "Paid"
    const dueDate = new Date(student.dueDate)
    const today = new Date()
    if (dueDate < today) return "Overdue"
    if (dueDate.toDateString() === today.toDateString()) return "Due Today"
    return "Pending"
  }

  const renderStudent = ({ item, index }) => {
    const animatedValue = new Animated.Value(0)

    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start()

    return (
      <Animated.View
        style={{
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity onPress={() => navigation.navigate("StudentDetails", { studentId: item.id })}>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" style={styles.studentName}>
                  {item.name}
                </Text>
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: getStatusColor(item) }]}
                  textStyle={{ color: "white", fontSize: 12 }}
                >
                  {getStatusText(item)}
                </Chip>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.amountContainer}>
                  <Ionicons name="cash-outline" size={16} color="#666" />
                  <Text style={styles.amount}>₹{item.balance ?? 0}</Text>
                </View>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.date}>{item.dueDate ?? "N/A"}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Students
        </Text>
      </View>

      <Searchbar
        placeholder="Search students..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.filterContainer}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setMenuVisible(true)} icon="filter">
              {sortFilter === "all" ? "All" : sortFilter.charAt(0).toUpperCase() + sortFilter.slice(1)}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setSortFilter("all")
              setMenuVisible(false)
            }}
            title="All"
          />
          <Menu.Item
            onPress={() => {
              setSortFilter("paid")
              setMenuVisible(false)
            }}
            title="Paid"
          />
          <Menu.Item
            onPress={() => {
              setSortFilter("due")
              setMenuVisible(false)
            }}
            title="Due"
          />
          <Menu.Item
            onPress={() => {
              setSortFilter("today")
              setMenuVisible(false)
            }}
            title="Due Today"
          />
          <Menu.Item
            onPress={() => {
              setSortFilter("overdue")
              setMenuVisible(false)
            }}
            title="Overdue"
          />
        </Menu>
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchStudents} />}
        ListEmptyComponent={<Text style={styles.empty}>No students found.</Text>}
        renderItem={renderStudent}
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    elevation: 2,
  },
  headerTitle: {
    color: "#6200ee",
    fontWeight: "bold",
  },
  searchbar: {
    margin: 16,
    elevation: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  studentName: {
    fontWeight: "bold",
    flex: 1,
  },
  statusChip: {
    borderRadius: 16,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  amount: {
    marginLeft: 4,
    fontWeight: "600",
    color: "#333",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  date: {
    marginLeft: 4,
    color: "#666",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "gray",
    fontSize: 16,
  },
})
