"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "../../firebase/firebaseConfig"

interface Props {
  navigation: any
  route: any
}

export default function RegisterScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [institutionName, setInstitutionName] = useState("")
  const [studentName, setStudentName] = useState("")
  const [parentName, setParentName] = useState("")
  const [institutionId, setInstitutionId] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const userType = route.params?.userType || "student"

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters")
      return
    }

    if (userType === "admin" && !institutionName) {
      Alert.alert("Error", "Institution name is required")
      return
    }

    if (userType === "student" && (!studentName || !institutionId)) {
      Alert.alert("Error", "Student name and institution ID are required")
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Save user data to Firestore
      const userData = {
        email,
        userType,
        createdAt: new Date().toISOString(),
        ...(userType === "admin"
          ? { institutionName }
          : {
              studentName,
              parentName,
              institutionId,
            }),
      }

      await setDoc(doc(db, "users", user.uid), userData)

      Alert.alert("Success", "Account created successfully!")
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#64748b" />
            </TouchableOpacity>

            <View style={styles.header}>
              <Ionicons name={userType === "admin" ? "business" : "school"} size={48} color="#2563eb" />
              <Text style={styles.title}>{userType === "admin" ? "Register Institution" : "Register Student"}</Text>
              <Text style={styles.subtitle}>Create your account</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {userType === "admin" ? (
                <View style={styles.inputContainer}>
                  <Ionicons name="business" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Institution Name"
                    value={institutionName}
                    onChangeText={setInstitutionName}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Student Name"
                      value={studentName}
                      onChangeText={setStudentName}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="people" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Parent Name (Optional)"
                      value={parentName}
                      onChangeText={setParentName}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="school" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Institution ID"
                      value={institutionId}
                      onChangeText={setInstitutionId}
                    />
                  </View>
                </>
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>{loading ? "Creating Account..." : "Create Account"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate("Login", { userType })}>
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#1e293b",
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginLink: {
    alignItems: "center",
    marginTop: 24,
  },
  loginLinkText: {
    fontSize: 14,
    color: "#64748b",
  },
  loginLinkBold: {
    color: "#2563eb",
    fontWeight: "600",
  },
})
