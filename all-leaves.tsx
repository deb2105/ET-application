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
} from "react-native";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react-native";

// Define status types
type LeaveStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Suspended"
  | "Unattended";

// Interface for the raw API response
interface ApiLeaveResponse {
  leave_id: string;
  leave_title: string;
  leave_ground: number;
  leave_from_date: string;
  leave_to_date: string;
  leave_comment: string;
  leave_acpt_rql_remarks: string;
  leave_track_status: number | null;
  leave_track_created_by: number;
  employee_name: string;
  leave_track_created_at: string;
  leave_track_updated_at: string;
  leave_track_submitted_to: number | null;
  leave_track_approved_rejected_by: number | null;
  leave_track_approved_rejected_at: string;
}

// Interface for our transformed leave data
interface LeaveRequest {
  id: string;
  leave_id: string;
  employee_id: number;
  employee_name: string;
  leave_title: string;
  leave_ground: string;
  leave_from_date: string;
  leave_to_date: string;
  leave_track_status: LeaveStatus;
  leave_comment: string;
  leave_acpt_rql_remarks: string;
}

export default function AllLeaves() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<LeaveStatus | "All">(
    "All"
  );
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  // Helper function to map leave types
  const getLeaveType = useCallback((typeCode: number): string => {
    switch (typeCode) {
      case 0:
        return "Casual Leave";
      case 1:
        return "Medical Leave";
      case 2:
        return "Half Day Leave";
      default:
        return "Other Leave";
    }
  }, []);

  // Helper function to map status
  const getStatus = useCallback((statusCode: number | null): LeaveStatus => {
    if (statusCode === null) return "Unattended";
    switch (statusCode) {
      case 0:
        return "Rejected";
      case 1:
        return "Approved";
      case 2:
        return "Suspended";
      case 3:
        return "Pending";
      default:
        return "Unattended";
    }
  }, []);

  // Data transformer function
  const transformLeaveData = useCallback(
    (apiData: ApiLeaveResponse[]): LeaveRequest[] => {
      return apiData.map((item) => ({
        id: item.leave_id.toString(),
        leave_id: item.leave_id,
        employee_id: item.leave_track_created_by,
        employee_name:
          item.employee_name || `Employee ${item.leave_track_created_by}`,
        leave_title: item.leave_title,
        leave_ground: getLeaveType(item.leave_ground),
        leave_from_date: formatDate(item.leave_from_date),
        leave_to_date: formatDate(item.leave_to_date),
        leave_track_status: getStatus(item.leave_track_status),
        leave_comment: item.leave_comment || "No comments",
        leave_acpt_rql_remarks: item.leave_acpt_rql_remarks || "No remarks",
      }));
    },
    [formatDate, getLeaveType, getStatus]
  );

  // Fetch data from PHP endpoint
  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/all-leaves.php",
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

      const apiData: ApiLeaveResponse[] = await response.json();
      const transformedData = transformLeaveData(apiData);
      setLeaves(transformedData);
      setTotalPages(Math.ceil(transformedData.length / 10)); // Assuming 10 items per page
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch leaves");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [transformLeaveData]);

  // Initial data fetch
  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaves();
  }, [fetchLeaves]);

  // Filter leaves based on search and status
  const filteredLeaves = useCallback(() => {
    return leaves.filter((leave) => {
      const matchesSearch =
        leave.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.leave_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.leave_comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.employee_id.toString().includes(searchQuery);

      const matchesStatus =
        selectedStatus === "All" || leave.leave_track_status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [leaves, searchQuery, selectedStatus]);

  // Add this useEffect after your other useEffects
  useEffect(() => {
    const filtered = filteredLeaves();
    setTotalPages(Math.ceil(filtered.length / 10));
    setCurrentPage(1); // Reset to first page when filters change
  }, [filteredLeaves]);

  // Handle pagination
  const paginatedLeaves = useCallback(() => {
    const filtered = filteredLeaves();
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    return filtered.slice(startIndex, endIndex);
  }, [filteredLeaves, currentPage]);

  // Count the number of leaves by status
  const leaveCounts = useCallback(
    () => ({
      All: leaves.length,
      Pending: leaves.filter((leave) => leave.leave_track_status === "Pending")
        .length,
      Approved: leaves.filter(
        (leave) => leave.leave_track_status === "Approved"
      ).length,
      Rejected: leaves.filter(
        (leave) => leave.leave_track_status === "Rejected"
      ).length,
      Suspended: leaves.filter(
        (leave) => leave.leave_track_status === "Suspended"
      ).length,
      Unattended: leaves.filter(
        (leave) => leave.leave_track_status === "Unattended"
      ).length,
    }),
    [leaves]
  );

  const getStatusColor = useCallback((status: LeaveStatus) => {
    switch (status) {
      case "Approved":
        return "#10b981";
      case "Pending":
        return "#f59e0b";
      case "Rejected":
        return "#ef4444";
      case "Suspended":
        return "#8b5cf6";
      case "Unattended":
        return "#64748b";
      default:
        return "#64748b";
    }
  }, []);

  const renderLeaveItem = useCallback(
    ({ item }: { item: LeaveRequest }) => (
      <View style={styles.leaveCard}>
        <View style={styles.leaveHeader}>
          <View>
            <Text style={styles.employeeName}>{item.employee_name}</Text>
            <Text style={styles.employeeId}>ID: {item.employee_id}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.leave_track_status) },
            ]}
          >
            <Text style={styles.statusText}>{item.leave_track_status}</Text>
          </View>
        </View>
        <View style={styles.leaveDetails}>
          <Text style={styles.leaveType}>{item.leave_title}</Text>
          <Text style={styles.dates}>
            {item.leave_from_date} - {item.leave_to_date}
          </Text>
        </View>
        <Text style={styles.reason}>{item.leave_ground}</Text>
        <Text style={styles.comment}>Comment: {item.leave_comment}</Text>
        <Text style={styles.remarks}>
          Remarks: {item.leave_acpt_rql_remarks}
        </Text>
      </View>
    ),
    [getStatusColor]
  );

  const renderStatusFilter = useCallback(() => {
    const statuses: (LeaveStatus | "All")[] = [
      "All",
      "Pending",
      "Approved",
      "Rejected",
      "Suspended",
      "Unattended",
    ];

    return (
      <View style={styles.filterTabs}>
        {statuses.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              selectedStatus === status && styles.filterTabActive,
            ]}
            onPress={() => {
              setSelectedStatus(status);
              setCurrentPage(1); // Reset to first page when filtering
            }}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedStatus === status && styles.filterTabTextActive,
              ]}
            >
              {status} ({leaveCounts()[status]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [selectedStatus, leaveCounts]);

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
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
    );
  };

  if (loading && leaves.length === 0) {
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchLeaves}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && leaves.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No leave requests found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchLeaves}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search leaves by name, ID, or reason..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1); // Reset to first page when searching
            }}
          />
        </View>
        {/* <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#64748b" />
        </TouchableOpacity> */}
      </View>

      {renderStatusFilter()}

      <FlatList
        data={paginatedLeaves()}
        renderItem={renderLeaveItem}
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

      <PaginationControls />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
  },
  filterTabActive: {
    backgroundColor: "#6366f1",
  },
  filterTabText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "white",
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  leaveCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leaveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  employeeId: {
    fontSize: 14,
    color: "#64748b",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  leaveDetails: {
    flexDirection: "column",
    justifyContent: "space-between",
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    marginBottom: 8,
  },
  leaveType: {
    fontSize: 16,
    color: "#6366f1",
    fontWeight: "500",
  },
  dates: {
    fontSize: 16,
    color: "#64748b",
  },
  reason: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 8,
  },
  comment: {
    fontSize: 14,
    color: "#475569",
    fontStyle: "italic",
    marginBottom: 4,
  },
  remarks: {
    fontSize: 14,
    color: "#475569",
    fontStyle: "italic",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingBottom: 20,
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
});
