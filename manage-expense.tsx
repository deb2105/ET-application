import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define TypeScript types for expense requests
type ExpenseRequest = {
  expense_id: string;
  user_name: string;
  expense_title: string;
  expense_amount: string;
  expense_track_status: number | null; // null: Pending, 0: Rejected, 1: Approved
};

// Add this dummy data after the ExpenseRequest type definition and before the ManageExpenses component
const dummyExpenses: ExpenseRequest[] = [
  {
    expense_id: "1",
    user_name: "John Doe",
    expense_title: "Office Supplies",
    expense_amount: "1500",
    expense_track_status: null,
  },
  {
    expense_id: "2",
    user_name: "Jane Smith",
    expense_title: "Travel Expenses",
    expense_amount: "5000",
    expense_track_status: null,
  },
  {
    expense_id: "3",
    user_name: "Mike Johnson",
    expense_title: "Client Meeting Lunch",
    expense_amount: "2500",
    expense_track_status: null,
  },
  {
    expense_id: "4",
    user_name: "Sarah Wilson",
    expense_title: "Software License",
    expense_amount: "12000",
    expense_track_status: 1,
  },
  {
    expense_id: "5",
    user_name: "Robert Brown",
    expense_title: "Training Materials",
    expense_amount: "3500",
    expense_track_status: 0,
  },
];

export default function ManageExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [roleId, setRoleId] = useState<number | null>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/manage_expense.php"
        );
        const data = await response.json();

        if (Array.isArray(data)) {
          setExpenses(data);
        } else if (data.status === "error") {
          Alert.alert("Error", data.message);
        }
      } catch (error) {
        console.error("Error fetching expense requests:", error);
        Alert.alert(
          "Error",
          "Unable to fetch expense requests. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  useEffect(() => {
    const fetchRoleId = async () => {
      try {
        const storedRoleId = await AsyncStorage.getItem("roleId");
        setRoleId(storedRoleId ? parseInt(storedRoleId, 10) : null);
      } catch (error) {
        console.error("Error fetching role ID:", error);
      }
    };

    fetchRoleId();
  }, []);

  const handleAction = async (
    expense_id: string,
    action: "approve" | "reject"
  ) => {
    try {
      const userId = await AsyncStorage.getItem("userid");
      if (!userId) {
        Alert.alert("Error", "User ID not found");
        return;
      }

      console.log(`Expense ID: ${expense_id}`);
      console.log(`Action: ${action}`);
      console.log(`User ID: ${userId}`);

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/approve_reject_expense.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expense_track_id: expense_id,
            action,
            user_id: parseInt(userId, 10),
          }),
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        Alert.alert("Success", data.message);

        // Update the local state to reflect the changes
        setExpenses((prevExpenses) =>
          prevExpenses.map((expense) =>
            expense.expense_id === expense_id
              ? {
                  ...expense,
                  expense_track_status: action === "approve" ? 1 : 0,
                }
              : expense
          )
        );
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      console.error("Error handling action:", error);
      Alert.alert("Error", "Failed to process the action. Please try again.");
    }
  };

  const filteredExpenses = expenses.filter((expense) =>
    expense.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedExpenses = filteredExpenses.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const renderExpense = ({ item }: { item: ExpenseRequest }) => (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.userName}>{item.user_name}</Text>
        <Text style={styles.request}>{item.expense_title}</Text>
        <Text style={styles.amount}>₹{item.expense_amount}</Text>
        <Text
          style={[
            styles.status,
            item.expense_track_status === null
              ? styles.pending
              : item.expense_track_status === 1
              ? styles.approved
              : styles.rejected,
          ]}
        >
          {item.expense_track_status === null
            ? "Pending"
            : item.expense_track_status === 1
            ? "Approved"
            : "Rejected"}
        </Text>
      </View>

      {/* Show action buttons only for pending requests */}
      {item.expense_track_status === null &&
        roleId !== null &&
        (roleId < 5 || roleId === 8) && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.approve]}
              onPress={() => handleAction(item.expense_id, "approve")}
            >
              <Check color="white" size={20} />
              <Text style={styles.buttonText}>Approve</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.reject]}
              onPress={() => handleAction(item.expense_id, "reject")}
            >
              <X color="white" size={20} />
              <Text style={styles.buttonText}>Reject</Text>
            </Pressable>
          </View>
        )}

      {/* Show status indicator for approved/rejected requests */}
      {item.expense_track_status !== null && (
        <View style={styles.statusIndicator}>
          {item.expense_track_status === 1 ? (
            <Check color="#16A34A" size={24} />
          ) : (
            <X color="#DC2626" size={24} />
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E293B" />
        <Text style={styles.loadingText}>Loading expense requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Manage Expense Requests</Text>

      {/* Add Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <FlatList
        data={paginatedExpenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item.expense_id}
        contentContainerStyle={styles.listContainer}
      />
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === 1 && styles.pageButtonDisabled,
          ]}
          onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft
            size={20}
            color={currentPage === 1 ? "#9ca3af" : "#6366f1"}
          />
        </TouchableOpacity>
        <Text style={styles.paginationText}>
          Page {currentPage} of {totalPages}
        </Text>
        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === totalPages && styles.pageButtonDisabled,
          ]}
          onPress={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          <ChevronRight
            size={20}
            color={currentPage === totalPages ? "#9ca3af" : "#6366f1"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 0,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  searchInput: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 16,
    color: "#1E293B",
  },
  listContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  infoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  request: {
    fontSize: 16,
    color: "#475569",
    marginVertical: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
    marginVertical: 2,
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
  },
  pending: {
    color: "#D97706",
  },
  approved: {
    color: "#16A34A",
  },
  rejected: {
    color: "#DC2626",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 8,
  },
  approve: {
    backgroundColor: "#16A34A",
  },
  reject: {
    backgroundColor: "#DC2626",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#475569",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  pageButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 10,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 16,
    color: "#1E293B",
  },
  statusIndicator: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
});
