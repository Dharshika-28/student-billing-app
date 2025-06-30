import React, { useState, useEffect } from "react"
import { View, StyleSheet, Animated } from "react-native"
import { Text, TextInput, Button, Card } from "react-native-paper"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../../firebase/firebaseConfig"

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState("admin@gmail.com")
  const [password, setPassword] = useState("Admin_123")
  const [loading, setLoading] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill all fields")
      return
    }

    // Check if email contains admin or teacher
    if (!email.includes("admin") && !email.includes("teacher")) {
      alert("Please use admin or teacher email")
      return
    }

    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      alert("Admin login failed: " + error.message)
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text variant="headlineLarge" style={styles.title}>
          Admin Login
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Access admin panel
        </Text>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <TextInput
              label="Admin Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
              placeholder="admin@school.com"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
            />
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Admin Login
            </Button>
          </Card.Content>
        </Card>

        <Button
          mode="text"
          onPress={() => navigation.navigate("Login")}
          style={styles.backButton}
        >
          Back to Student Login
        </Button>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
    color: "#d32f2f",
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 40,
    color: "#666",
  },
  card: {
    elevation: 8,
    borderRadius: 16,
  },
  cardContent: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 10,
    borderRadius: 25,
    backgroundColor: "#d32f2f",
  },
  buttonContent: {
    height: 50,
  },
  backButton: {
    marginTop: 20,
  },
})
