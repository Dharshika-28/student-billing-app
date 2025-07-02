"use client"

import { useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { signOut, updatePassword } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { auth, db } from "../../firebase/firebaseConfig"
import { useAuth } from "../../contexts/AuthContext"
import { LinearGradient } from "expo-linear-gradient"

export default function AdminProfileScreen() {
  const { userData } = useAuth()
  const [editing, setEditing] = useState(false)
  const [institutionName, setInstitutionName] = useState(userData?.institutionName || "")
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSaveProfile = async () => {
    if (!userData) return

    setLoading(true)
    try {
      await updateDoc(doc(db, "users", userData.uid), {
        institutionName,
      })

      Alert.alert("Success", "Profile updated successfully")
      setEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      Alert.alert("Error", "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all password fields")
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword)
        Alert.alert("Success", "Password updated successfully")
        setShowPasswordChange(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (error: any) {
      console.error("Error updating password:", error)
      Alert.alert("Error", error.message || "Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth)
          } catch (error) {
            console.error("Error signing out:", error)
            Alert.alert("Error", "Failed to sign out")
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#10b981", "#2563eb"]} style={styles.headerGradient}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Ionicons name="business" size={48} color="white" />
            </View>
            <Text style={styles.userName}>{userData?.institutionName}</Text>
            <Text style={styles.userEmail}>{userData?.email}</Text>
            <View style={styles.userTypeBadge}>
              <Text style={styles.userTypeText}>Institution Admin</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Institution Information</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => (editing ? handleSaveProfile() : setEditing(true))}
              disabled={loading}
            >
              <Ionicons name={editing ? "checkmark" : "pencil"} size={16} color={editing ? "#10b981" : "#2563eb"} />
              <Text style={[styles.editButtonText, editing && styles.saveButtonText]}>
                {editing ? (loading ? "Saving..." : "Save") : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldsContainer}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputDisabled]}
                value={userData?.email || ""}
                editable={false}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Institution Name</Text>
              <TextInput
                style={[styles.fieldInput, !editing && styles.fieldInputDisabled]}
                value={institutionName}
                onChangeText={setInstitutionName}
                editable={editing}
                placeholder="Enter institution name"
              />
            </View>
          </View>

          {editing && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setEditing(false)
                setInstitutionName(userData?.institutionName || "")
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowPasswordChange(!showPasswordChange)}>
            <Ionicons name="lock-closed" size={20} color="#64748b" />
            <Text style={styles.menuItemText}>Change Password</Text>
            <Ionicons name={showPasswordChange ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
          </TouchableOpacity>

          {showPasswordChange && (
            <View style={styles.passwordSection}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.passwordInput}
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.changePasswordButton} onPress={handleChangePassword} disabled={loading}>
                <LinearGradient colors={["#10b981", "#2563eb"]} style={styles.changePasswordGradient}>
                  <Text style={styles.changePasswordButtonText}>{loading ? "Updating..." : "Update Password"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications" size={20} color="#64748b" />
            <Text style={styles.menuItemText}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="bar-chart" size={20} color="#64748b" />
            <Text style={styles.menuItemText}>Reports & Analytics</Text>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings" size={20} color="#64748b" />
            <Text style={styles.menuItemText}>Institution Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle" size={20} color="#64748b" />
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={[styles.menuItem, styles.signOutItem]} onPress={handleSignOut}>
            <Ionicons name="log-out" size={20} color="#ef4444" />
            <Text style={[styles.menuItemText, styles.signOutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>EduBill Admin v1.0.0</Text>
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
  content: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    padding: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 12,
  },
  userTypeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userTypeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    backgroundColor: "white",
    marginBottom: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
  },
  saveButtonText: {
    color: "#10b981",
  },
  fieldsContainer: {
    paddingHorizontal: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1e293b",
  },
  fieldInputDisabled: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  cancelButton: {
    marginTop: 16,
    marginHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    marginLeft: 12,
  },
  signOutItem: {
    borderBottomWidth: 0,
  },
  signOutText: {
    color: "#ef4444",
  },
  passwordSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  passwordInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 12,
  },
  changePasswordButton: {
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 8,
  },
  changePasswordGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  changePasswordButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#94a3b8",
  },
})
