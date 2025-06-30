"use client"

import React, { useState } from "react"
import { View, StyleSheet, Animated } from "react-native"
import { Button, TextInput, Card, Text } from "react-native-paper"
import DateTimePicker from "@react-native-community/datetimepicker"
import { collection, addDoc } from "firebase/firestore"
import { db } from "../firebase/firebaseConfig"

export default function AddStudent({ navigation }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [balance, setBalance] = useState("")
  const [dueDate, setDueDate] = useState(new Date())
  const [showPicker, setShowPicker] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleSubmit = async () => {
    if (!name || !balance) {
      alert("Please fill all required fields")
      return
    }
    try {
      await addDoc(collection(db, "students"), {
        name,
        email: email || "",
        balance: Number.parseFloat(balance),
        dueDate: dueDate.toDateString(),
        payments: [],
        createdAt: new Date().toISOString(),
      })
      setName("")
      setEmail("")
      setBalance("")
      setDueDate(new Date())
      navigation.navigate("Students")
    } catch (error) {
      alert("Error adding student: " + error.message)
    }
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Add New Student
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <TextInput
              label="Student Name *"
              value={name}
              onChangeText={setName}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Email Address (Optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Total Bill (₹) *"
              value={balance}
              onChangeText={setBalance}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />
            <Button onPress={() => setShowPicker(true)} mode="outlined" style={styles.dateButton} icon="calendar">
              Due Date: {dueDate.toDateString()}
            </Button>
            {showPicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                onChange={(_, date) => {
                  setShowPicker(false)
                  if (date) setDueDate(date)
                }}
              />
            )}
            <Button onPress={handleSubmit} mode="contained" style={styles.button} contentStyle={styles.buttonContent}>
              Add Student
            </Button>
          </Card.Content>
        </Card>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "white",
    elevation: 2,
  },
  headerTitle: {
    color: "#6200ee",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  cardContent: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  dateButton: {
    marginBottom: 20,
  },
  button: {
    borderRadius: 25,
  },
  buttonContent: {
    height: 50,
  },
})
