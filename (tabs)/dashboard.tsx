import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Pressable,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
} from "react-native";
import {
  Bell,
  Search,
  Users,
  Settings,
  LogOut,
  User,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  FileCheck,
  ClipboardList,
  RefreshCw,
  Wallet,
  Receipt,
} from "lucide-react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eventEmitter, EVENTS } from "../utils/eventEmitter";
import { useFocusEffect } from "@react-navigation/native";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

interface ActiveUser {
  id: string;
  name: string;
  avatar: string;
  status: string;
}

interface LocationType {
  coords: {
    latitude: number;
    longitude: number;
  };
}

interface UserData {
  u_fname: string;
  u_mname: string;
  u_lname: string;
  u_pro_img?: string;
  userid: string;
  role_name?: string;
}

interface AttendanceResponse {
  success: boolean;
  attn_id?: number;
  error?: string;
}

interface TodayAttendanceResponse {
  success: boolean;
  has_login: boolean;
  attendance?: {
    attn_id: number;
    login_timestamp: string;
    login_lat_long: string;
    is_logged_out: boolean;
    logout_timestamp?: string;
    logout_lat_long?: string;
  };
  message?: string;
}

interface UserCountResponse {
  user_count: number;
}

interface Quote {
  quote: string;
  author: string;
  category: string;
}

interface ExpenseAnalytics {
  myExpense: number;
  requestedExpenses: number;
  cashInHand: number;
  requestedRequisition: number;
}

const activeUsers: ActiveUser[] = [
  {
    id: "1",
    name: "Sarah Wilson",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    status: "In office",
  },
  {
    id: "2",
    name: "Michael Chen",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    status: "Remote",
  },
  {
    id: "3",
    name: "Emma Rodriguez",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    status: "In meeting",
  },
];

const NotificationDropdown = ({
  notifications,
}: {
  notifications: { id: string; text: string }[];
}) => (
  <View style={styles.dropdownMenu}>
    {notifications.length === 0 ? (
      <Text style={styles.dropdownText}>No new notifications</Text>
    ) : (
      notifications.map((item) => (
        <Text key={item.id} style={styles.dropdownText}>
          {item.text}
        </Text>
      ))
    )}
  </View>
);

const ProfileDropdown = () => {
  const handleLogout = () => {
    router.push("/users"); // Navigate to the login screen after logout
  };

  const handleViewProfile = () => {
    router.push("/profile");
  };

  return (
    <View style={[styles.dropdownMenu, styles.profileDropdown]}>
      <Pressable style={styles.dropdownItem} onPress={handleViewProfile}>
        <User size={20} color="#374151" />
        <Text style={styles.dropdownText}>My Profile</Text>
      </Pressable>
      <View style={styles.dropdownDivider} />
      <Pressable style={styles.dropdownItem} onPress={handleLogout}>
        <LogOut size={20} color="#ef4444" />
        <Text style={[styles.dropdownText, styles.logoutText]}>Logout</Text>
      </Pressable>
    </View>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statContent}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
      <Icon size={24} color={color} />
    </View>
  </View>
);

const ActiveUserCard = ({ user }: { user: ActiveUser }) => (
  <View style={styles.activeUserCard}>
    <Image source={{ uri: user.avatar }} style={styles.activeUserAvatar} />
    <View style={styles.activeUserInfo}>
      <Text style={styles.activeUserName}>{user.name}</Text>
      <Text style={styles.activeUserStatus}>{user.status}</Text>
    </View>
  </View>
);

const AttendanceDetails = ({
  attendance,
}: {
  attendance: TodayAttendanceResponse["attendance"];
}) => (
  <View>
    {/* Login Details Card */}
    <View style={styles.attendanceCard}>
      <Text style={styles.attendanceCardTitle}>Login Details</Text>
      <View style={styles.attendanceRow}>
        <Text style={styles.attendanceLabel}>Login Time:</Text>
        <Text style={styles.attendanceValue}>
          {new Date(attendance?.login_timestamp || "").toLocaleTimeString()}
        </Text>
      </View>
      <View style={styles.attendanceRow}>
        <Text style={styles.attendanceLabel}>Login Location: </Text>
        <Text style={styles.attendanceValue}>{attendance?.login_lat_long}</Text>
      </View>
    </View>

    {/* Logout Details Card */}
    {attendance?.is_logged_out && (
      <View style={styles.attendanceCard}>
        <Text style={styles.attendanceCardTitle}>Logout Details</Text>
        <View style={styles.attendanceRow}>
          <Text style={styles.attendanceLabel}>Logout Time:</Text>
          <Text style={styles.attendanceValue}>
            {new Date(attendance?.logout_timestamp || "").toLocaleTimeString()}
          </Text>
        </View>
        <View style={styles.attendanceRow}>
          <Text style={styles.attendanceLabel}>Logout Location: </Text>
          <Text style={styles.attendanceValue}>
            {attendance?.logout_lat_long}
          </Text>
        </View>
      </View>
    )}
  </View>
);

const QuoteSection = ({
  quote,
  loading,
}: {
  quote: Quote | null;
  loading: boolean;
}) => (
  <View style={styles.quoteSection}>
    <View style={styles.quoteContent}>
      {loading ? (
        <ActivityIndicator size="small" color="#6366f1" />
      ) : quote ? (
        <>
          <Text style={styles.quoteText}>"{quote.quote}"</Text>
          <Text style={styles.quoteAuthor}>- {quote.author}</Text>
        </>
      ) : (
        <Text style={styles.errorText}>Failed to load quote</Text>
      )}
    </View>
  </View>
);

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState<LocationType | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [todayAttendance, setTodayAttendance] =
    useState<TodayAttendanceResponse | null>(null);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [analytics, setAnalytics] = useState<{
    cash_in_hand: {
      cash_in_hand: number;
      details: {
        credit_amount: number;
        debit_amount: number;
        req_debit_amount: number;
      };
    };
    monthly_analytics: {
      date: string;
      expense: number;
      expense_requests: number;
      requisition_requests: number;
    };
  } | null>(null);
  const [roleId, setRoleId] = useState<string | null>(null);

  const initialLoadDone = useRef(false);

  const notifications = [
    { id: "1", text: "New user registered" },
    { id: "2", text: "Order #1234 has been placed" },
    { id: "3", text: "Server maintenance scheduled" },
  ];

  const resetDashboardState = useCallback(() => {
    setIsLoggedIn(false);
    setShowNotifications(false);
    setShowProfile(false);
    setSearchQuery("");
    setLocation(null);
    setErrorMsg(null);
    setUserData(null);
    setLoading(true);
    setError(null);
    setIsLoggingIn(false);
    setIsLoggingOut(false);
    setUserCount(null);
    setTodayAttendance(null);
    setCheckingAttendance(true);
    setQuote(null);
    setLoadingQuote(true);
  }, []);

  const fetchQuote = async () => {
    try {
      if (!loadingQuote) {
        setLoadingQuote(true); // Ensure loading state is set to true
      }

      const response = await fetch("https://api.api-ninjas.com/v1/quotes", {
        headers: {
          "X-Api-Key": "/fhhRPKq7nTmT4aq+qk8aw==UaXQU4OVOEhWen1B",
        },
      });

      if (!response.ok) {
        throw new Error("Quote fetch failed");
      }

      const data = await response.json();

      // Define the allowed categories
      const allowedCategories = [
        "success",
        "morning",
        "money",
        "life",
        "learning",
        "leadership",
        "knowledge",
        "intelligence",
        "hope",
        "health",
        "god",
        "future",
        "faith",
        "experience",
        "education",
      ];

      // Check if the quote's category matches the allowed categories
      const matchingQuote = data.find((quote: Quote) =>
        allowedCategories.includes(quote.category.toLowerCase())
      );

      if (matchingQuote) {
        setQuote(matchingQuote);
      } else {
        // If no matching quote is found, recursively call fetchQuote
        console.log("No matching quote found, fetching again...");
        await fetchQuote();
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
      setQuote(null); // Handle error by setting quote to null
    } finally {
      setLoadingQuote(false); // Set loading to false only after a valid quote is found or an error occurs
    }
  };

  const checkTodaysAttendance = async (userId: string) => {
    try {
      setCheckingAttendance(true);
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/check_login.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      const result: TodayAttendanceResponse = await response.json();
      setTodayAttendance(result);

      if (result.has_login && !result.attendance?.is_logged_out) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
    } finally {
      setCheckingAttendance(false);
    }
  };

  const fetchUserData = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userid");
      const storedRoleId = await AsyncStorage.getItem("roleId");
      setRoleId(storedRoleId);

      if (!userId) {
        setError("No user ID found");
        return;
      }

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/dashboard.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();
      console.log("API Response:", result);

      if (result.status === "success") {
        const roleResponse = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/user_role_fetcher.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: parseInt(userId, 10) }),
          }
        );

        const roleResult = await roleResponse.json();

        setUserData({
          ...result.data,
          userid: userId,
          role_name: roleResult.role_name || "No role assigned",
        });

        checkTodaysAttendance(userId);
      } else {
        setError(result.message || "Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserCount = useCallback(async () => {
    try {
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/user_count.php"
      );
      const result = await response.json();
      setUserCount(result.user_count);
    } catch (error) {
      console.error("Error fetching user count:", error);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userid");
      if (!userId) return;

      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}`;

      const response = await fetch(
        `https://demo-expense.geomaticxevs.in/ET-api/cash_calculator.php?user_id=${userId}&date=${formattedDate}`
      );

      const result = await response.json();
      if (result.status === 200) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      await Promise.all([
        fetchUserData(),
        fetchUserCount(),
        fetchQuote(),
        fetchAnalytics(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data");
    }
  }, [fetchUserData, fetchUserCount, fetchQuote, fetchAnalytics]);

  useFocusEffect(
    useCallback(() => {
      if (!initialLoadDone.current) {
        loadDashboardData();
        initialLoadDone.current = true;
      }
    }, [loadDashboardData])
  );

  useEffect(() => {
    const handleNewLogin = async () => {
      resetDashboardState();
      initialLoadDone.current = false; // Reset the ref on new login
      await Promise.all([
        fetchUserData(),
        fetchUserCount(),
        fetchQuote(),
        fetchAnalytics(),
      ]);
    };

    eventEmitter.on(EVENTS.USER_LOGOUT, resetDashboardState);
    eventEmitter.on(EVENTS.USER_LOGIN, handleNewLogin);

    return () => {
      eventEmitter.off(EVENTS.USER_LOGOUT, resetDashboardState);
      eventEmitter.off(EVENTS.USER_LOGIN, handleNewLogin);
    };
  }, [
    resetDashboardState,
    fetchUserData,
    fetchUserCount,
    fetchQuote,
    fetchAnalytics,
  ]);

  useEffect(() => {
    const handleAppClose = () => {
      // Remove any automatic logout logic here
      // Example: eventEmitter.emit(EVENTS.USER_LOGOUT);
    };

    const subscription = AppState.addEventListener("change", handleAppClose);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!location) {
      Alert.alert("Error", "Location not available. Please try again.");
      return;
    }

    if (!userData?.userid) {
      Alert.alert("Error", "User information not available.");
      return;
    }

    setIsLoggingIn(true);

    try {
      const loginData = {
        user_id: parseInt(userData.userid),
        login_lat_long: `${location.coords.latitude},${location.coords.longitude}`,
      };

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/user_attendance_login.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        }
      );

      const result = await response.json();

      if (result.success) {
        setIsLoggedIn(true);
        checkTodaysAttendance(userData.userid);
        Alert.alert("Success", "Attendance logged successfully!");
      } else {
        Alert.alert("Error", result.error || "Failed to log attendance");
      }
    } catch (error) {
      console.error("Error logging attendance:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (!location) {
      Alert.alert("Error", "Location not available. Please try again.");
      return;
    }

    if (!userData?.userid) {
      Alert.alert("Error", "User information not available.");
      return;
    }

    setIsLoggingOut(true);

    try {
      const logoutData = {
        user_id: parseInt(userData.userid),
        logout_lat_long: `${location.coords.latitude},${location.coords.longitude}`,
      };

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/user_attendance_logout.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(logoutData),
        }
      );

      const result = await response.json();

      if (result.success) {
        setIsLoggedIn(false);
        checkTodaysAttendance(userData.userid);
        Alert.alert("Success", "Logout recorded successfully!");
      } else {
        Alert.alert("Error", result.error || "Failed to record logout");
      }
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showProfile) setShowProfile(false);
  };

  const toggleProfile = () => {
    setShowProfile(!showProfile);
    if (showNotifications) setShowNotifications(false);
  };

  const renderLoginSection = () => {
    if (!todayAttendance?.has_login) {
      return (
        <>
          <Text style={styles.loginStatusText}>
            Login to register your attendance
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#4CAF50" }]}
            onPress={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </>
      );
    }

    if (todayAttendance.attendance?.is_logged_out) {
      return (
        <>
          <Text style={styles.loginStatusText}>
            Today's attendance completed
          </Text>
          <AttendanceDetails attendance={todayAttendance.attendance} />
        </>
      );
    }

    return (
      <>
        <Text style={styles.loginStatusText}>Currently logged in</Text>
        <AttendanceDetails attendance={todayAttendance.attendance} />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#ef4444", marginTop: 16 }]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Logout</Text>
          )}
        </TouchableOpacity>
      </>
    );
  };

  if (loading || checkingAttendance) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
      </View>
    );
  }

  let locationText = "Waiting for location...";
  if (errorMsg) {
    locationText = errorMsg;
  } else if (location) {
    locationText = `Latitude: ${location.coords.latitude.toFixed(
      4
    )}, Longitude: ${location.coords.longitude.toFixed(4)}`;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            {userData ? (
              <>
                <Text style={styles.nameText}>
                  {`${userData.u_fname}${
                    userData.u_mname ? ` ${userData.u_mname} ` : " "
                  }${userData.u_lname}`}
                </Text>
                <Text style={styles.roleText}>{userData.role_name}</Text>
              </>
            ) : (
              <Text style={styles.nameText}>User</Text>
            )}
          </View>
          <Image
            source={
              userData?.u_pro_img
                ? { uri: userData.u_pro_img }
                : require("../../assets/images/default_profile.png")
            }
            style={styles.welcomeImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.analyticsSection}>
          <Text style={styles.analyticsSectionTitle}>
            Your Expense Overview
          </Text>
          <View style={styles.analyticsGrid}>
            <View style={[styles.analyticsCard, styles.cardMyExpense]}>
              <View style={styles.analyticsContent}>
                <Text style={styles.analyticsLabel}>My Expenses</Text>
                <Text
                  style={[
                    styles.analyticsValue,
                    (analytics?.monthly_analytics?.expense ?? 0) < 0 && {
                      color: "#ef4444",
                    },
                  ]}
                >
                  ₹
                  {(
                    analytics?.monthly_analytics?.expense ?? 0
                  ).toLocaleString()}
                </Text>
              </View>
              <View
                style={[styles.analyticsIcon, { backgroundColor: "#818cf830" }]}
              >
                <Wallet size={24} color="#818cf8" />
              </View>
            </View>

            {!["7", "9", "10", "11", "12", "14"].includes(roleId || "") && (
              <View style={[styles.analyticsCard, styles.cardRequested]}>
                <View style={styles.analyticsContent}>
                  <Text style={styles.analyticsLabel}>Requested Expenses</Text>
                  <Text
                    style={[
                      styles.analyticsValue,
                      (analytics?.monthly_analytics?.expense_requests ?? 0) <
                        0 && {
                        color: "#ef4444",
                      },
                    ]}
                  >
                    ₹
                    {(
                      analytics?.monthly_analytics?.expense_requests ?? 0
                    ).toLocaleString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.analyticsIcon,
                    { backgroundColor: "#10b98130" },
                  ]}
                >
                  <Receipt size={24} color="#10b981" />
                </View>
              </View>
            )}

            <View style={[styles.analyticsCard, styles.cardCashInHand]}>
              <View style={styles.analyticsContent}>
                <Text style={styles.analyticsLabel}>Cash in Hand</Text>
                <Text
                  style={[
                    styles.analyticsValue,
                    (analytics?.cash_in_hand?.cash_in_hand ?? 0) < 0 && {
                      color: "#ef4444",
                    },
                  ]}
                >
                  ₹
                  {(
                    analytics?.cash_in_hand?.cash_in_hand ?? 0
                  ).toLocaleString()}
                </Text>
              </View>
              <View
                style={[styles.analyticsIcon, { backgroundColor: "#6366f130" }]}
              >
                <ClipboardList size={24} color="#6366f1" />
              </View>
            </View>

            {!["7", "9", "10", "11", "12", "14"].includes(roleId || "") && (
              <View style={[styles.analyticsCard, styles.cardRequisition]}>
                <View style={styles.analyticsContent}>
                  <Text style={styles.analyticsLabel}>
                    Requested Requisition
                  </Text>
                  <Text
                    style={[
                      styles.analyticsValue,
                      (analytics?.monthly_analytics?.requisition_requests ??
                        0) < 0 && {
                        color: "#ef4444",
                      },
                    ]}
                  >
                    ₹
                    {(
                      analytics?.monthly_analytics?.requisition_requests ?? 0
                    ).toLocaleString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.analyticsIcon,
                    { backgroundColor: "#f59e0b30" },
                  ]}
                >
                  <FileCheck size={24} color="#f59e0b" />
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.loginSection}>{renderLoginSection()}</View>

        <View style={styles.locationSection}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Your Location</Text>
          </View>
          <View style={styles.locationDetails}>
            <Text>{locationText}</Text>
          </View>
        </View>

        <QuoteSection quote={quote} loading={loadingQuote} />
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get("window"); // Get the screen width

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    flex: 1,
  },
  welcomeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  welcomeContent: {
    flex: 1,
    paddingRight: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: "#6b7280",
  },
  nameText: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 4,
  },
  roleText: {
    fontSize: 14,
    color: "#6366f1",
    marginTop: 4,
    fontWeight: "500",
  },
  welcomeImage: {
    width: 140,
    height: 140,
    borderRadius: 40,
  },
  statsGrid: {
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
  },
  analyticsSection: {
    padding: 20,
  },
  analyticsSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  analyticsCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  analyticsContent: {
    flex: 1,
  },
  analyticsLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 1,
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  analyticsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
  },
  cardMyExpense: {
    borderLeftWidth: 4,
    borderLeftColor: "#818cf8",
  },
  cardRequested: {
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  cardCashInHand: {
    borderLeftWidth: 4,
    borderLeftColor: "#6366f1",
  },
  cardRequisition: {
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  loginSection: {
    padding: 16,
    alignItems: "center",
  },
  loginStatusText: {
    fontSize: 18,
    color: "#374151",
    marginBottom: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  attendanceCard: {
    width: width * 0.9, // Use 90% of the screen width
    alignSelf: "center", // Center the card horizontally
    backgroundColor: "#ffffff",
    borderRadius: 12, // Slightly larger border radius for a modern look
    padding: 16, // Consistent padding for content
    marginBottom: 16, // Add spacing between cards
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attendanceCardTitle: {
    fontSize: 18, // Slightly larger font size for the title
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12, // Add spacing below the title
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8, // Add spacing between rows
  },
  attendanceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  attendanceValue: {
    fontSize: 14,
    color: "#4b5563",
  },
  locationSection: {
    backgroundColor: "#ffffff",
    margin: 22,
    padding: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  locationDetails: {
    marginLeft: 28,
  },
  activeUsersSection: {
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeUserCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  activeUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  activeUserInfo: {
    marginLeft: 12,
  },
  activeUserName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  activeUserStatus: {
    fontSize: 14,
    color: "#6b7280",
  },
  moreButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    alignItems: "center",
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  dropdownMenu: {
    position: "absolute",
    top: 45,
    right: -80,
    width: 250,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    padding: 10,
    zIndex: 1000,
  },
  profileDropdown: {
    width: 200,
    right: 0,
    padding: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    borderRadius: 6,
  },
  dropdownText: {
    fontSize: 16,
    color: "#374151",
  },
  logoutText: {
    color: "#ef4444",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginHorizontal: 100,
    minWidth: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  quoteSection: {
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: "center",
  },
  quoteContent: {
    marginTop: 0,
    alignItems: "center",
  },
  quoteText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    fontStyle: "italic",
    lineHeight: 28,
    textAlign: "center",
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "center",
  },
  refreshButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
  },
});
