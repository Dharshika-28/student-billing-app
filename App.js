"use client"

import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"

import StudentList from "./screens/StudentList"
import AddStudent from "./screens/AddStudent"
import StudentDetails from "./screens/StudentDetails"
import AddPayment from "./screens/AddPayment"

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Stack navigator for Students tab (includes StudentList, StudentDetails, AddPayment)
function StudentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StudentList" component={StudentList} options={{ title: "Students" }} />
      <Stack.Screen name="StudentDetails" component={StudentDetails} options={{ title: "Student Details" }} />
      <Stack.Screen name="AddPayment" component={AddPayment} options={{ title: "Add Payment" }} />
    </Stack.Navigator>
  )
}

// Stack navigator for Add Student tab
function AddStudentStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AddStudent" component={AddStudent} options={{ title: "Add Student" }} />
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName

            if (route.name === "Students") {
              iconName = focused ? "people" : "people-outline"
            } else if (route.name === "Add") {
              iconName = focused ? "person-add" : "person-add-outline"
            }

            return <Ionicons name={iconName} size={size} color={color} />
          },
          tabBarActiveTintColor: "#6200ee",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: {
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "#e0e0e0",
            height: 60,
            paddingBottom: 5,
            paddingTop: 5,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="Students"
          component={StudentsStack}
          options={{
            tabBarLabel: "Students",
          }}
        />
        <Tab.Screen
          name="Add"
          component={AddStudentStack}
          options={{
            tabBarLabel: "Add Student",
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}


// "use client"

// import { useEffect, useState } from "react"
// import { NavigationContainer } from "@react-navigation/native"
// import { createNativeStackNavigator } from "@react-navigation/native-stack"
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
// import { Ionicons } from "@expo/vector-icons"
// import { onAuthStateChanged } from "firebase/auth"
// import { auth } from "./firebase/firebaseConfig"

// // Auth Screens
// import LoginScreen from "./screens/auth/LoginScreen"
// import RegisterScreen from "./screens/auth/RegisterScreen"
// import AdminLoginScreen from "./screens/auth/AdminLoginScreen"

// // Main Screens
// import StudentList from "./screens/StudentList"
// import AddStudent from "./screens/AddStudent"
// import StudentDetails from "./screens/StudentDetails"
// import AddPayment from "./screens/AddPayment"
// import StudentDashboard from "./screens/StudentDashboard"
// import ProfileScreen from "./screens/ProfileScreen"

// const Stack = createNativeStackNavigator()
// const Tab = createBottomTabNavigator()

// // Auth Stack
// function AuthStack() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Login" component={LoginScreen} />
//       <Stack.Screen name="Register" component={RegisterScreen} />
//       <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
//     </Stack.Navigator>
//   )
// }

// // Admin Stack
// function AdminStack() {
//   return (
//     <Stack.Navigator>
//       <Stack.Screen name="StudentList" component={StudentList} options={{ title: "Students" }} />
//       <Stack.Screen name="StudentDetails" component={StudentDetails} options={{ title: "Student Details" }} />
//       <Stack.Screen name="AddPayment" component={AddPayment} options={{ title: "Add Payment" }} />
//     </Stack.Navigator>
//   )
// }

// function AddStudentStack() {
//   return (
//     <Stack.Navigator>
//       <Stack.Screen name="AddStudent" component={AddStudent} options={{ title: "Add Student" }} />
//     </Stack.Navigator>
//   )
// }

// // Student Stack
// function StudentTabNavigator() {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName
//           if (route.name === "Dashboard") {
//             iconName = focused ? "home" : "home-outline"
//           } else if (route.name === "Profile") {
//             iconName = focused ? "person" : "person-outline"
//           }
//           return <Ionicons name={iconName} size={size} color={color} />
//         },
//         tabBarActiveTintColor: "#6200ee",
//         tabBarInactiveTintColor: "gray",
//         tabBarStyle: {
//           backgroundColor: "white",
//           borderTopWidth: 1,
//           borderTopColor: "#e0e0e0",
//           height: 60,
//           paddingBottom: 5,
//           paddingTop: 5,
//         },
//         headerShown: false,
//       })}
//     >
//       <Tab.Screen name="Dashboard" component={StudentDashboard} />
//       <Tab.Screen name="Profile" component={ProfileScreen} />
//     </Tab.Navigator>
//   )
// }

// // Admin Tab Navigator
// function AdminTabNavigator() {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName
//           if (route.name === "Students") {
//             iconName = focused ? "people" : "people-outline"
//           } else if (route.name === "Add") {
//             iconName = focused ? "person-add" : "person-add-outline"
//           }
//           return <Ionicons name={iconName} size={size} color={color} />
//         },
//         tabBarActiveTintColor: "#6200ee",
//         tabBarInactiveTintColor: "gray",
//         tabBarStyle: {
//           backgroundColor: "white",
//           borderTopWidth: 1,
//           borderTopColor: "#e0e0e0",
//           height: 60,
//           paddingBottom: 5,
//           paddingTop: 5,
//         },
//         headerShown: false,
//       })}
//     >
//       <Tab.Screen name="Students" component={AdminStack} />
//       <Tab.Screen name="Add" component={AddStudentStack} />
//     </Tab.Navigator>
//   )
// }
// export default function App() {
//   const [user, setUser] = useState(null);
//   const [userRole, setUserRole] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [firebaseReady, setFirebaseReady] = useState(false);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (!firebaseReady) {
//         setFirebaseReady(true); // Firebase is now ready
//       }

//       if (user) {
//         setUser(user);
//         const isAdmin = user.email?.includes("admin") || user.email?.includes("teacher");
//         setUserRole(isAdmin ? "admin" : "student");
//       } else {
//         setUser(null);
//         setUserRole(null);
//       }
//       setLoading(false);
//     });

//     return unsubscribe;
//   }, []);

//   if (loading || !firebaseReady) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" color="#6200ee" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       {!user ? <AuthStack /> : userRole === "admin" ? <AdminTabNavigator /> : <StudentTabNavigator />}
//     </NavigationContainer>
//   );
// }