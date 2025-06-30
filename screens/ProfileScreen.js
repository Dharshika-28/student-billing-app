import React from "react"
import { View, StyleSheet, Animated } from "react-native"
import { Text, Card, Button, Avatar } from "react-native-paper"
import { signOut } from "firebase/auth"
import { auth } from "../firebase/firebaseConfig"

export default function ProfileScreen() {
  const [fadeAnim] = React.useState(new Animated.Value(0))
  const user = auth.currentUser

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      alert("Logout failed: " + error.message)
    }
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Profile
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text size={80} label={user?.displayName?.charAt(0) || "U"} style={styles.avatar} />
            <Text variant="headlineSmall" style={styles.name}>
              {user?.displayName || "User"}
            </Text>
            <Text variant="bodyLarge" style={styles.email}>
              {user?.email}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.actionsCard}>
          <Card.Content>
            <Button mode="contained" onPress={handleLogout} style={styles.logoutButton} icon="logout">
              Logout
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
  profileCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  profileContent: {
    alignItems: "center",
    padding: 20,
  },
  avatar: {
    backgroundColor: "#6200ee",
    marginBottom: 16,
  },
  name: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  email: {
    color: "#666",
  },
  actionsCard: {
    elevation: 4,
    borderRadius: 12,
  },
  logoutButton: {
    backgroundColor: "#d32f2f",
  },
})
