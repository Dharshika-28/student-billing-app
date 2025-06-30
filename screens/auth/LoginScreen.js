import React, { useState } from "react"
import { View, StyleSheet, Animated, Dimensions, KeyboardAvoidingView, Platform } from "react-native"
import { Text, TextInput, Button, Card } from "react-native-paper"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../../firebase/firebaseConfig"

const { width, height } = Dimensions.get("window")

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(50))

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill all fields")
      return
    }
    // Optional: add email format validation here

    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // Optionally navigate after success
      // navigation.navigate("Home") 
    } catch (error) {
      alert("Login failed: " + error.message)
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text variant="headlineLarge" style={styles.title}>
            Welcome Back
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Sign in to continue
          </Text>

          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
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
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Login
              </Button>
            </Card.Content>
          </Card>

          <View style={styles.footer}>
            <Text>Don't have an account? </Text>
            <Button mode="text" onPress={() => navigation.navigate("Register")}>
              Register
            </Button>
          </View>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate("AdminLogin")}
            style={styles.adminButton}
          >
            Admin Login
          </Button>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
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
  adminButton: {
    marginTop: 20,
    borderRadius: 25,
  },
})
