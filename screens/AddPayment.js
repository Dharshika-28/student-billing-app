import React, { useState } from "react"
import { View, StyleSheet, Animated } from "react-native"
import { Button, TextInput, Card, Text } from "react-native-paper"
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore"
import { db } from "../firebase/firebaseConfig"

export default function AddPayment({ route, navigation }) {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const { studentId } = route.params

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleAdd = async () => {
    if (!amount) {
      alert("Please enter payment amount")
      return
    }

    setLoading(true)
    try {
      const studentRef = doc(db, "students", studentId)
      const studentSnap = await getDoc(studentRef)

      if (studentSnap.exists()) {
        const studentData = studentSnap.data()
        const newBalance = (studentData.balance ?? 0) - Number.parseFloat(amount)
        const newPayment = {
          amount: Number.parseFloat(amount),
          date: new Date().toISOString(),
          addedBy: "admin",
        }

        await updateDoc(studentRef, {
          payments: arrayUnion(newPayment),
          balance: newBalance,
        })

        setAmount("")
        navigation.goBack()
      }
    } catch (error) {
      alert("Error adding payment: " + error.message)
    }
    setLoading(false)
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Add Payment
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="bodyLarge" style={styles.description}>
              Enter the payment amount received from the student
            </Text>

            <TextInput
              label="Amount Paid (₹)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />

            <Button
              mode="contained"
              onPress={handleAdd}
              loading={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Submit Payment
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
  description: {
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 20,
  },
  button: {
    borderRadius: 25,
  },
  buttonContent: {
    height: 50,
  },
})
