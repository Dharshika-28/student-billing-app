import React, { useState } from "react"
import { View, StyleSheet, Animated } from "react-native"
import { Text, TextInput, Button, Card } from "react-native-paper"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "../../firebase/firebaseConfig"

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleRegister = async () => {
    if (!name || !email || !password) {
      alert("Please fill all fields")
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, { displayName: name })

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        role: "student",
        createdAt: new Date().toISOString(),
      })
    } catch (error) {
      alert("Registration failed: " + error.message)
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text variant="headlineLarge" style={styles.title}>
          Create Account
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Join us today
        </Text>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <TextInput label="Full Name" value={name} onChangeText={setName} style={styles.input} mode="outlined" />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
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
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Register
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text>Already have an account? </Text>
          <Button mode="text" onPress={() => navigation.navigate("Login")}>
            Login
          </Button>
        </View>
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
    color: "#6200ee",
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
  },
  buttonContent: {
    height: 50,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
})
