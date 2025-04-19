import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
} from "react-native";
import { Search, Filter, Calendar } from "lucide-react-native";
import CalendarPicker from "react-native-calendar-picker";
import moment from "moment";
import { useLocalSearchParams } from "expo-router";

// Define status types
type ExpenseStatus = "Unattended" | "Pending" | "Approved" | "Rejected";

// Interface for the raw API response
interface ApiExpenseResponse {
  expense_track_id: string;
  expense_track_title: string;
  expense_type_id: number;
  expense_total_amount: number;
  expense_track_status: number | null;
  expense_track_app_rej_remarks: string | null;
  expense_track_created_at: string;
  expense_track_created_by: number;
  expense_track_submitted_to: number | null;
  expense_track_approved_rejected_by: number | null;
  expense_track_approved_rejected_at: string | null;
  created_by_full_name: string;
  submitted_to_full_name: string | null;
  approved_rejected_by_full_name: string | null;
  expense_details: {
    expense_id: number;
    expense_head_title: string;
    expense_product_desc: string;
    expense_product_qty: number;
    expense_product_unit: string;
    expense_bill_date: string;
    expense_product_photo_path: string;
    expense_product_bill_photo_path: string;
    expense_product_amount: number; // Add this line
  }[];
}

// Interface for our transformed expense data
interface Expense {
  id: string;
  expense_id: string;
  employee: string;
  expense_title: string;
  expense_type: string;
  amount: number;
  date: string;
  status: ExpenseStatus;
  remarks: string | null;
  submitted_to: string | null;
  approved_by: string | null;
  expense_track_created_by: string; // Add this line
  expense_details: {
    expense_id: number;
    expense_head_title: string;
    expense_product_desc: string;
    expense_product_qty: number;
    expense_product_unit: string;
    expense_bill_date: string;
    expense_product_photo_path: string;
    expense_product_bill_photo_path: string;
    expense_product_amount: number; // Add this line
  }[];
}

// Update ExpenseBreakage interface
interface ExpenseBreakage {
  slNo: number;
  expenseType: string;
  description: string;
  quantity: number;
  unit: string;
  amount: number;
  date: string;
  productPhoto?: string;
  billPhoto?: string;
}

// Update DateRangeType to match possible values from admin_analytics.tsx
type DateRangeType =
  | "today"
  | "week"
  | "month"
  | "year"
  | "custom"
  | "lastMonth"
  | null;

// Helper function to format date range
const formatDateRange = (
  type: DateRangeType,
  start: Date | null,
  end: Date | null
) => {
  if (!type) return "All Expenses";

  if (type === "today") {
    return "Today's Expenses";
  }

  if (type === "lastMonth") {
    return "Last Month's Expenses";
  }

  if (type === "custom" && start && end) {
    const startStr = moment(start).format("MMM D, YYYY");
    const endStr = moment(end).format("MMM D, YYYY");
    return `Expenses: ${startStr} - ${endStr}`;
  }

  return "All Expenses";
};

// Add this before the ExpenseDetailsModal component
const getStatusColor = (status: ExpenseStatus) => {
  switch (status) {
    case "Approved":
      return "#10b981";
    case "Pending":
      return "#f59e0b";
    case "Rejected":
      return "#ef4444";
    case "Unattended":
      return "#64748b";
    default:
      return "#64748b";
  }
};

// Update dummy data
const dummyBreakage: ExpenseBreakage[] = [
  {
    slNo: 1,
    expenseType: "Travel",
    description: "Flight Ticket - Delhi to Mumbai",
    quantity: 1,
    unit: "Ticket",
    amount: 12500,
    date: "2025-04-15",
  },
  {
    slNo: 2,
    expenseType: "Accommodation",
    description: "Hotel Stay - Taj Mumbai",
    quantity: 2,
    unit: "Nights",
    amount: 7000,
    date: "2025-04-16",
  },
  {
    slNo: 3,
    expenseType: "Transport",
    description: "Local Cab Service",
    quantity: 4,
    unit: "Rides",
    amount: 2000,
    date: "2025-04-17",
  },
];

// Add this component after the ExpenseBreakage interface
const ImageViewerModal = ({
  visible,
  onClose,
  imageType,
  imageUrl,
}: {
  visible: boolean;
  onClose: () => void;
  imageType: "product" | "bill";
  imageUrl: string;
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.imageModalContainer}>
        <View style={styles.imageModalContent}>
          <View style={styles.imageModalHeader}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.imageModalTitle}>
              {imageType === "product" ? "Product Photo" : "Bill Photo"}
            </Text>
          </View>

          <View style={styles.imageContainer}>
            {loading && <ActivityIndicator size="large" color="#6366f1" />}
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Image
              source={{ uri: imageUrl }}
              style={styles.previewImage}
              resizeMode="contain"
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError("Failed to load image");
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Update the ExpenseDetailsModal component
const ExpenseDetailsModal = ({
  expense,
  visible,
  onClose,
}: {
  expense: Expense | null;
  visible: boolean;
  onClose: () => void;
}) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState<
    "product" | "bill"
  >("product");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [cashInHand, setCashInHand] = useState<number | null>(null);

  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    const fetchCashInHand = async () => {
      if (!expense) return;

      try {
        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}-${String(
          currentDate.getMonth() + 1
        ).padStart(2, "0")}`;

        const response = await fetch(
          `https://demo-expense.geomaticxevs.in/ET-api/cash_calculator.php?user_id=${expense.expense_track_created_by}&date=${formattedDate}`
        );

        const data = await response.json();
        if (data.status === 200) {
          setCashInHand(data.data.cash_in_hand.cash_in_hand);
        }
      } catch (error) {
        console.error("Error fetching cash in hand:", error);
      }
    };

    fetchCashInHand();
  }, [expense]);

  if (!expense) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.detailsModalContainer}>
        <View style={styles.detailsModalContent}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailsCard}>
              <View style={styles.detailsHeader}>
                <View style={styles.detailsHeaderLeft}>
                  <Text style={styles.detailsEmployeeName}>
                    {expense.employee}
                  </Text>
                  <Text style={styles.detailsId}>ID: {expense.expense_id}</Text>
                  <View style={styles.cashInHandSection}>
                    <Text style={styles.cashInHandLabel}>Cash in Hand</Text>
                    <Text
                      style={[
                        styles.cashInHandAmount,
                        cashInHand !== null &&
                          cashInHand < 0 && { color: "#ef4444" }, // Red color for negative values
                      ]}
                    >
                      ₹{cashInHand?.toLocaleString() || "0"}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.detailsStatusBadge,
                    { backgroundColor: getStatusColor(expense.status) },
                  ]}
                >
                  <Text style={styles.detailsStatusText}>{expense.status}</Text>
                </View>
              </View>

              <View style={styles.detailsDivider} />

              <View style={styles.detailsSection}>
                <Text style={styles.detailsLabel}>Title</Text>
                <Text style={styles.detailsValue}>{expense.expense_title}</Text>
              </View>

              <View style={styles.detailsAmountSection}>
                <Text style={styles.detailsLabel}>Amount</Text>
                <Text style={styles.detailsAmount}>
                  ₹{expense.amount.toFixed(2)}
                </Text>
              </View>

              <View style={styles.detailsDivider} />

              <View style={styles.detailsRow}>
                <View style={[styles.detailsSection, styles.detailsHalf]}>
                  <Text style={styles.detailsLabel}>Type</Text>
                  <View style={styles.detailsTypeContainer}>
                    <Text style={styles.detailsValue}>
                      {expense.expense_type}
                    </Text>
                  </View>
                </View>

                <View style={[styles.detailsSection, styles.detailsHalf]}>
                  <Text style={styles.detailsLabel}>Date</Text>
                  <Text style={styles.detailsValue}>{expense.date}</Text>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsLabel}>Submitted To</Text>
                <Text style={styles.detailsValue}>
                  {expense.submitted_to || "Not submitted yet"}
                </Text>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsLabel}>
                  {expense.status === "Approved"
                    ? "Approved By"
                    : expense.status === "Rejected"
                    ? "Rejected By"
                    : "Pending Approval From"}
                </Text>
                <Text style={styles.detailsValue}>
                  {expense.approved_by || "Not processed yet"}
                </Text>
              </View>

              <View style={styles.detailsDivider} />

              {expense.remarks && (
                <View style={styles.detailsRemarksSection}>
                  <Text style={styles.detailsLabel}>Remarks</Text>
                  <View style={styles.detailsRemarksContainer}>
                    <Text style={styles.detailsRemarks}>{expense.remarks}</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailsDivider} />

              <View style={styles.breakageSection}>
                <Text style={styles.detailsLabel}>Expense Breakage</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.breakageTable}>
                    <View style={styles.breakageHeader}>
                      <Text style={[styles.breakageHeaderText, { width: 50 }]}>
                        Sl No
                      </Text>
                      <Text style={[styles.breakageHeaderText, { width: 100 }]}>
                        Type
                      </Text>
                      <Text style={[styles.breakageHeaderText, { width: 150 }]}>
                        Desc.
                      </Text>
                      <Text style={[styles.breakageHeaderText, { width: 70 }]}>
                        Qty
                      </Text>
                      <Text style={[styles.breakageHeaderText, { width: 70 }]}>
                        Unit
                      </Text>
                      <Text style={[styles.breakageHeaderText, { width: 100 }]}>
                        Amount
                      </Text>
                      <Text style={[styles.breakageHeaderText, { width: 100 }]}>
                        Date
                      </Text>
                      <Text style={[styles.breakageHeaderText, { width: 100 }]}>
                        Product
                      </Text>
                      <Text style={[styles.breakageHeaderText, { width: 100 }]}>
                        Bill
                      </Text>
                    </View>

                    {expense.expense_details.map((item, index) => (
                      <View key={index} style={styles.breakageRow}>
                        <Text style={[styles.breakageText, { width: 50 }]}>
                          {index + 1}
                        </Text>
                        <Text style={[styles.breakageText, { width: 100 }]}>
                          {item.expense_head_title}
                        </Text>
                        <Text style={[styles.breakageText, { width: 150 }]}>
                          {item.expense_product_desc}
                        </Text>
                        <Text style={[styles.breakageText, { width: 70 }]}>
                          {item.expense_product_qty}
                        </Text>
                        <Text style={[styles.breakageText, { width: 70 }]}>
                          {item.expense_product_unit}
                        </Text>
                        <Text style={[styles.breakageText, { width: 100 }]}>
                          ₹{item.expense_product_amount}
                        </Text>
                        <Text style={[styles.breakageText, { width: 100 }]}>
                          {formatDate(item.expense_bill_date)}
                        </Text>
                        <View style={[styles.photoButtonCell, { width: 100 }]}>
                          {item.expense_product_photo_path ? (
                            <TouchableOpacity
                              style={styles.breakagePhotoButton}
                              onPress={() => {
                                setSelectedImageType("product");
                                setSelectedImageUrl(
                                  `https://demo-expense.geomaticxevs.in/ET-api/${item.expense_product_photo_path}`
                                );
                                setShowImageViewer(true);
                              }}
                            >
                              <Text style={styles.breakagePhotoButtonText}>
                                View
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.breakageText}>N/A</Text>
                          )}
                        </View>
                        <View style={[styles.photoButtonCell, { width: 100 }]}>
                          {item.expense_product_bill_photo_path ? (
                            <TouchableOpacity
                              style={styles.breakagePhotoButton}
                              onPress={() => {
                                setSelectedImageType("bill");
                                setSelectedImageUrl(
                                  `https://demo-expense.geomaticxevs.in/ET-api/${item.expense_product_bill_photo_path}`
                                );
                                setShowImageViewer(true);
                              }}
                            >
                              <Text style={styles.breakagePhotoButtonText}>
                                View
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.breakageText}>N/A</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
      <ImageViewerModal
        visible={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        imageType={selectedImageType}
        imageUrl={selectedImageUrl}
      />
    </Modal>
  );
};

export default function AllExpenses() {
  const params = useLocalSearchParams();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ExpenseStatus | "All">(
    "All"
  );
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);

  useEffect(() => {
    if (params.dateRange) {
      const dateRange = JSON.parse(params.dateRange as string);

      if (
        dateRange.type === "custom" &&
        dateRange.startDate &&
        dateRange.endDate
      ) {
        setDateRangeType("custom");
        setStartDate(new Date(dateRange.startDate));
        setEndDate(new Date(dateRange.endDate));
      } else if (["today", "lastMonth"].includes(dateRange.type)) {
        handleDateRangeSelect(dateRange.type as DateRangeType);
      }
    }
  }, [params.dateRange]);

  // Helper function to format date
  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Helper function to map expense types
  const getExpenseType = useCallback((typeCode: number): string => {
    switch (typeCode) {
      case 0:
        return "Travel";
      case 1:
        return "Food";
      case 2:
        return "Accommodation";
      case 3:
        return "Office Supplies";
      default:
        return "Other";
    }
  }, []);

  // Helper function to map status
  const getStatus = useCallback((statusCode: number | null): ExpenseStatus => {
    if (statusCode === null) return "Unattended";
    switch (statusCode) {
      case 0:
        return "Rejected";
      case 1:
        return "Approved";
      case 2:
        return "Pending";
      default:
        return "Unattended";
    }
  }, []);

  // Data transformer function
  const transformExpenseData = useCallback(
    (apiData: ApiExpenseResponse[]): Expense[] => {
      return apiData.map((item) => ({
        id: item.expense_track_id.toString(),
        expense_id: item.expense_track_id,
        employee: item.created_by_full_name,
        expense_title: item.expense_track_title,
        expense_type: getExpenseType(item.expense_type_id),
        amount: item.expense_total_amount,
        date: formatDate(item.expense_track_created_at),
        status: getStatus(item.expense_track_status),
        remarks: item.expense_track_app_rej_remarks,
        submitted_to: item.submitted_to_full_name,
        approved_by: item.approved_rejected_by_full_name,
        expense_track_created_by: item.expense_track_created_by.toString(), // Add this line
        expense_details: item.expense_details,
      }));
    },
    [formatDate, getExpenseType, getStatus]
  );

  // Fetch data from PHP endpoint
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/all-expense.php",
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 50)}...`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData: ApiExpenseResponse[] = await response.json();
      const transformedData = transformExpenseData(apiData);
      setExpenses(transformedData);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch expenses");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [transformExpenseData]);

  // Initial data fetch
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDateRangeSelect = useCallback((type: DateRangeType) => {
    setDateRangeType(type);

    if (type === "today") {
      const today = new Date();
      setStartDate(today);
      setEndDate(today);
    } else if (type === "lastMonth") {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (type === "custom") {
      setShowCalendar(true);
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  }, []);

  // Filter expenses based on search, status, and date range
  const filteredExpenses = useCallback(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        expense.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.expense_title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (expense.remarks &&
          expense.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        selectedStatus === "All" || expense.status === selectedStatus;

      let matchesDate = true;
      if (startDate && endDate) {
        const expenseDate = moment(expense.date, "MMM D, YYYY").toDate();
        matchesDate = expenseDate >= startDate && expenseDate <= endDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [expenses, searchQuery, selectedStatus, startDate, endDate]);

  const renderExpenseItem = useCallback(
    ({ item }: { item: Expense }) => (
      <TouchableOpacity
        style={styles.expenseCard}
        onPress={() => {
          setSelectedExpense(item);
          setShowExpenseDetails(true);
        }}
      >
        <View style={styles.expenseHeader}>
          <Text style={styles.employeeName}>{item.employee}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.expenseDetails}>
          <Text style={styles.expenseTitle}>{item.expense_title}</Text>
          <Text style={styles.amount}>₹{item.amount.toFixed(2)}</Text>
        </View>
        <View style={styles.expenseDetails}>
          <Text style={styles.expenseType}>{item.expense_type}</Text>
          <Text style={styles.dates}>{item.date}</Text>
        </View>
        {item.remarks && (
          <Text style={styles.remarks}>Remarks: {item.remarks}</Text>
        )}
      </TouchableOpacity>
    ),
    []
  );

  const handleFilterSelect = (status: typeof selectedStatus) => {
    setSelectedStatus(status);
    setShowFilterDropdown(false);
  };

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchExpenses}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && expenses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No expenses found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchExpenses}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.dateRangeHeader}>
        <Text style={styles.dateRangeTitle}>
          {formatDateRange(dateRangeType, startDate, endDate)}
        </Text>
      </View> */}

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <Filter size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Filter Dropdown */}
      {showFilterDropdown && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            onPress={() => handleFilterSelect("All")}
            style={styles.dropdownItem}
          >
            <Text style={styles.dropdownText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleFilterSelect("Unattended")}
            style={styles.dropdownItem}
          >
            <Text style={styles.dropdownText}>Unattended</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleFilterSelect("Pending")}
            style={styles.dropdownItem}
          >
            <Text style={styles.dropdownText}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleFilterSelect("Approved")}
            style={styles.dropdownItem}
          >
            <Text style={styles.dropdownText}>Approved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleFilterSelect("Rejected")}
            style={styles.dropdownItem}
          >
            <Text style={styles.dropdownText}>Rejected</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.dateFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(["today", "lastMonth", "custom"] as DateRangeType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.dateFilterButton,
                dateRangeType === type && styles.dateFilterActive,
              ]}
              onPress={() => handleDateRangeSelect(type)}
            >
              {type === "custom" && (
                <Calendar
                  size={16}
                  color={dateRangeType === "custom" ? "#ffffff" : "#64748b"}
                />
              )}
              <Text
                style={[
                  styles.dateFilterText,
                  dateRangeType === type && styles.dateFilterActiveText,
                ]}
              >
                {type === "today"
                  ? "Today"
                  : type === "lastMonth"
                  ? "Last Month"
                  : "Custom"}
              </Text>
            </TouchableOpacity>
          ))}

          {dateRangeType && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleDateRangeSelect(null)}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent={true} animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)} // Close the calendar when touching outside
        >
          <View style={styles.modalContent}>
            <View style={styles.calendarContainer}>
              <CalendarPicker
                startFromMonday={true}
                allowRangeSelection={true}
                selectedStartDate={startDate || undefined}
                selectedEndDate={endDate || undefined}
                onDateChange={(date, type) => {
                  if (type === "START_DATE") {
                    setStartDate(date ? moment(date).toDate() : null);
                  } else {
                    setEndDate(date ? moment(date).toDate() : null);
                  }
                }}
                width={320}
                selectedDayColor="#6366f1"
                selectedDayTextColor="#ffffff"
              />
              {/* Buttons under the calendar */}
              <View style={styles.calendarButtons}>
                <TouchableOpacity
                  style={[styles.calendarButton, styles.clearButton]}
                  onPress={() => {
                    setStartDate(null);
                    setEndDate(null);
                  }}
                >
                  <Text style={styles.calendarButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.calendarButton, styles.closeButton]}
                  onPress={() => setShowCalendar(false)}
                >
                  <Text style={styles.calendarButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <FlatList
        data={filteredExpenses()}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6366f1"]}
          />
        }
      />

      {/* Expense Details Modal */}
      <ExpenseDetailsModal
        expense={selectedExpense}
        visible={showExpenseDetails}
        onClose={() => {
          setShowExpenseDetails(false);
          setSelectedExpense(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  dateRangeHeader: {
    padding: 16,
    backgroundColor: "#e2e8f0",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  dateRangeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#ef4444",
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#64748b",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdown: {
    position: "absolute",
    top: 70,
    right: 65,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dropdownText: {
    fontSize: 16,
    color: "#1f2937",
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  expenseCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  expenseDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  expenseTitle: {
    flex: 1,
    flexWrap: "wrap",
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
    marginBottom: 4,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#10b981",
    justifyContent: "center",
  },
  statusText: {
    color: "white",
    fontSize: 14,
  },
  expenseType: {
    fontSize: 16,
    color: "#64748b",
  },
  amount: {
    fontSize: 16,
    color: "#10b981",
    fontWeight: "600",
  },
  dates: {
    fontSize: 16,
    color: "#64748b",
  },
  remarks: {
    fontSize: 14,
    color: "#475569",
    fontStyle: "italic",
    marginTop: 8,
  },
  dateFilterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  dateFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    gap: 4,
  },
  dateFilterActive: {
    backgroundColor: "#6366f1",
  },
  dateFilterText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  dateFilterActiveText: {
    color: "#ffffff",
  },
  clearButton: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: 352,
  },
  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: 320,
  },
  calendarButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  calendarButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  calendarButtonText: {
    fontSize: 14,
    color: "#1f2937",
  },
  closeButton: {
    backgroundColor: "#3b82f6",
  },
  detailsModalContainer: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  detailsModalContent: {
    flex: 1,
    padding: 16,
  },
  detailsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 18,
    color: "#6366f1",
    fontWeight: "600",
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  detailsHeaderLeft: {
    flex: 1,
  },
  headerRightSection: {
    alignItems: "flex-end",
    gap: 8,
  },
  detailsEmployeeName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  detailsId: {
    fontSize: 14,
    color: "#64748b",
  },
  detailsStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  detailsStatusText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  detailsDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 16,
  },
  detailsSection: {
    marginBottom: 20,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
  },
  detailsLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    fontWeight: "500",
  },
  detailsValue: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  detailsAmountSection: {
    marginBottom: 20,
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
  },
  detailsAmount: {
    fontSize: 28,
    color: "#10b981",
    fontWeight: "700",
  },
  detailsTypeContainer: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  detailsRemarksSection: {
    marginTop: 8,
  },
  detailsRemarksContainer: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  detailsRemarks: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 20,
  },
  detailsHalf: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
  },
  photoButtonsContainer: {
    flexDirection: "row",
    gap: 16,
    marginTop: 20,
  },
  photoButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productPhotoButton: {
    backgroundColor: "#818cf8", // Indigo shade
  },
  billPhotoButton: {
    backgroundColor: "#6366f1", // Primary indigo
  },
  photoButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  breakageSection: {
    marginBottom: 20,
  },
  breakageTable: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minWidth: "100%",
  },
  breakageHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  breakageHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    paddingHorizontal: 8,
  },
  breakageRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    alignItems: "center",
  },
  breakageText: {
    fontSize: 14,
    color: "#1e293b",
    paddingHorizontal: 8,
  },
  photoButtonCell: {
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  breakagePhotoButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  breakagePhotoButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  imageModalContent: {
    flex: 1,
  },
  imageModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  imageModalTitle: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 12,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  cashInHandSection: {
    backgroundColor: "#dcfce7",
    padding: 8,
    borderRadius: 8,
    alignItems: "flex-start",
    marginTop: 8,
    width: 120,
  },
  cashInHandLabel: {
    fontSize: 12,
    color: "#15803d",
    fontWeight: "500",
  },
  cashInHandAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#15803d",
  },
});
