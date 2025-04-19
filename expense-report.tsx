import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Modal,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FileDown } from "lucide-react-native";

// Define types
interface ExpenseReport {
  id: string;
  head: string;
  title: string;
  amount: number;
  createdBy: string;
  submittedTo: string;
  date: string;
  approvedBy: string;
  status: "Approved" | "Rejected" | "Pending";
}

// Dummy data
const dummyData: ExpenseReport[] = [
  {
    id: "1",
    head: "Travel",
    title: "Client Meeting Travel",
    amount: 5000,
    createdBy: "John Doe",
    submittedTo: "Jane Smith",
    date: "2025-04-15",
    approvedBy: "Mike Johnson",
    status: "Approved",
  },
  {
    id: "2",
    head: "Equipment",
    title: "New Laptop Purchase",
    amount: 85000,
    createdBy: "Sarah Wilson",
    submittedTo: "Mike Johnson",
    date: "2025-04-14",
    approvedBy: "Jane Smith",
    status: "Pending",
  },
  {
    id: "3",
    head: "Office Supplies",
    title: "Monthly Stationery",
    amount: 2500,
    createdBy: "Tom Brown",
    submittedTo: "John Doe",
    date: "2025-04-13",
    approvedBy: "",
    status: "Rejected",
  },
  // Add more similar items...
];

const ExpenseDetailsModal = ({
  expense,
  visible,
  onClose,
}: {
  expense: ExpenseReport | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!expense) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Expense Details</Text>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.expenseCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>{expense.title}</Text>
                <View style={styles.cardMetaContainer}>
                  <Text style={styles.cardMeta}>{expense.head}</Text>
                  <Text style={styles.cardMetaDot}>•</Text>
                  <Text style={styles.cardMeta}>{expense.date}</Text>
                </View>
              </View>
              <View style={styles.statusContainer}>
                <Text
                  style={[
                    styles.cardStatus,
                    styles[`status${expense.status}` as keyof typeof styles],
                  ]}
                >
                  {expense.status}
                </Text>
              </View>
            </View>

            <View style={styles.amountContainer}>
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Total Amount</Text>
                <Text style={styles.amountValue}>
                  ₹
                  {expense.amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.detailsContainer}>
              <Text style={styles.detailsHeading}>Details</Text>
              <View style={styles.cardGrid}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Created By</Text>
                  <Text style={styles.gridValue}>{expense.createdBy}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Submitted To</Text>
                  <Text style={styles.gridValue}>{expense.submittedTo}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Approved By</Text>
                  <Text style={styles.gridValue}>
                    {expense.approvedBy || "Pending"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function ExpenseReport() {
  // State for filters
  const [selectedHead, setSelectedHead] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showData, setShowData] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseReport | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showHeadPicker, setShowHeadPicker] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showNamePicker, setShowNamePicker] = useState(false);

  // Dummy options for dropdowns
  const expenseHeads = ["Travel", "Office Supplies", "Equipment", "Other"];
  const roles = ["Manager", "Employee", "Admin"];
  const names = ["John Doe", "Jane Smith", "Mike Johnson"];

  const handleApply = () => {
    setShowData(true);
  };

  const handleReset = () => {
    setSelectedHead("");
    setSelectedRole("");
    setSelectedName("");
    setStartDate(new Date());
    setEndDate(new Date());
    setShowStartDate(false);
    setShowEndDate(false);
    setShowData(false);
  };

  const handleDownloadPDF = () => {
    // Implement PDF download logic here
    console.log("Downloading PDF...");
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartDate(Platform.OS === "ios");
    setStartDate(currentDate);
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndDate(Platform.OS === "ios");
    setEndDate(currentDate);
  };

  const renderItem = ({ item }: { item: ExpenseReport }) => (
    <TouchableOpacity
      style={styles.summaryCard}
      onPress={() => {
        setSelectedExpense(item);
        setShowDetails(true);
      }}
    >
      <View style={styles.summaryHeader}>
        <View style={styles.summaryTitleContainer}>
          <Text style={styles.summaryTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.summarySubtitle}>{item.head}</Text>
        </View>
        <Text
          style={[
            styles.cardStatus,
            styles[`status${item.status}` as keyof typeof styles],
          ]}
        >
          {item.status}
        </Text>
      </View>
      <View style={styles.summaryFooter}>
        <Text style={styles.summaryAmount}>₹{item.amount.toFixed(2)}</Text>
        <Text style={styles.summaryDate}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expense Report</Text>
      </View>

      <View style={styles.filtersCard}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedHead && styles.filterChipActive]}
            onPress={() => setShowHeadPicker(true)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedHead && styles.filterChipTextActive,
              ]}
            >
              {selectedHead || "Expense Head"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedRole && styles.filterChipActive]}
            onPress={() => setShowRolePicker(true)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedRole && styles.filterChipTextActive,
              ]}
            >
              {selectedRole || "Role"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedName && styles.filterChipActive]}
            onPress={() => setShowNamePicker(true)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedName && styles.filterChipTextActive,
              ]}
            >
              {selectedName || "Name"}
            </Text>
          </TouchableOpacity>

          {/* Start Date Picker */}
          <TouchableOpacity
            style={[styles.filterChip, styles.dateChip]}
            onPress={() => setShowStartDate(true)}
          >
            <Text style={styles.filterChipText}>
              {startDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {/* End Date Picker */}
          <TouchableOpacity
            style={[styles.filterChip, styles.dateChip]}
            onPress={() => setShowEndDate(true)}
          >
            <Text style={styles.filterChipText}>
              {endDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Add the DateTimePicker components after the ScrollView but before the filterActions View */}
        {showStartDate && (
          <DateTimePicker
            value={startDate}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onStartDateChange}
            onTouchCancel={() => setShowStartDate(false)}
          />
        )}

        {showEndDate && (
          <DateTimePicker
            value={endDate}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onEndDateChange}
            onTouchCancel={() => setShowEndDate(false)}
          />
        )}

        <View style={styles.filterActions}>
          <TouchableOpacity
            style={styles.filterActionButton}
            onPress={handleReset}
          >
            <Text style={styles.filterActionButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterActionButton, styles.applyButton]}
            onPress={handleApply}
          >
            <Text
              style={[styles.filterActionButtonText, styles.applyButtonText]}
            >
              Apply
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showHeadPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowHeadPicker(false)}
        >
          <View style={styles.pickerModal}>
            <Picker
              selectedValue={selectedHead}
              onValueChange={(value) => {
                setSelectedHead(value);
                setShowHeadPicker(false);
              }}
            >
              <Picker.Item label="Select Head" value="" />
              {expenseHeads.map((head) => (
                <Picker.Item key={head} label={head} value={head} />
              ))}
            </Picker>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showRolePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowRolePicker(false)}
        >
          <View style={styles.pickerModal}>
            <Picker
              selectedValue={selectedRole}
              onValueChange={(value) => {
                setSelectedRole(value);
                setShowRolePicker(false);
              }}
            >
              <Picker.Item label="Select Role" value="" />
              {roles.map((role) => (
                <Picker.Item key={role} label={role} value={role} />
              ))}
            </Picker>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showNamePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowNamePicker(false)}
        >
          <View style={styles.pickerModal}>
            <Picker
              selectedValue={selectedName}
              onValueChange={(value) => {
                setSelectedName(value);
                setShowNamePicker(false);
              }}
            >
              <Picker.Item label="Select Name" value="" />
              {names.map((name) => (
                <Picker.Item key={name} label={name} value={name} />
              ))}
            </Picker>
          </View>
        </TouchableOpacity>
      </Modal>

      {showData && (
        <FlatList
          data={dummyData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity
        style={styles.downloadButton}
        onPress={handleDownloadPDF}
      >
        <FileDown size={24} color="#ffffff" />
        <Text style={styles.downloadButtonText}>Download PDF</Text>
      </TouchableOpacity>

      <ExpenseDetailsModal
        expense={selectedExpense}
        visible={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedExpense(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  header: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  filtersCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filterScrollView: {
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#6366f1",
  },
  filterChipText: {
    fontSize: 14,
    color: "#1e293b",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  dateChip: {
    backgroundColor: "#f8fafc",
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterActionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    backgroundColor: "#e2e8f0",
  },
  applyButton: {
    backgroundColor: "#6366f1",
  },
  filterActionButtonText: {
    fontSize: 14,
    color: "#1e293b",
  },
  applyButtonText: {
    color: "#ffffff",
  },
  listContainer: {
    padding: 16,
  },
  expenseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  summaryTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  summaryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  summaryDate: {
    fontSize: 14,
    color: "#64748b",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 16,
  },
  cardGrid: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
  },
  gridItem: {
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#e2e8f0",
    paddingLeft: 12,
  },
  gridLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
    fontWeight: "500",
  },
  gridValue: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  cardStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: "600",
  },
  statusApproved: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
  },
  statusRejected: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#b45309",
  },
  downloadButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#6366f1",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  downloadButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalHeader: {
    backgroundColor: "#ffffff",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#6366f1",
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  cardMetaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  cardMeta: {
    fontSize: 14,
    color: "#64748b",
  },
  cardMetaDot: {
    fontSize: 14,
    color: "#94a3b8",
    marginHorizontal: 6,
  },
  statusContainer: {
    alignSelf: "flex-start",
  },
  amountContainer: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  amountBox: {
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    fontWeight: "500",
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1e293b",
  },
  detailsContainer: {
    marginTop: 24,
  },
  detailsHeading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerModal: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    width: "80%",
  },
});
