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
interface RequisitionReport {
  id: string;
  type: string;
  title: string;
  requestedAmount: number;
  approvedAmount: number;
  createdBy: string;
  submittedTo: string;
  date: string;
  approvedBy: string;
  status: "Approved" | "Rejected" | "Pending" | "Partially Approved";
}

// Dummy data
const dummyData: RequisitionReport[] = [
  {
    id: "1",
    type: "Equipment Purchase",
    title: "New Laptop Request",
    requestedAmount: 80000,
    approvedAmount: 75000,
    createdBy: "John Doe",
    submittedTo: "Jane Smith",
    date: "2025-04-15",
    approvedBy: "Mike Johnson",
    status: "Partially Approved",
  },
  {
    id: "2",
    type: "Travel Request",
    title: "Client Site Visit",
    requestedAmount: 25000,
    approvedAmount: 25000,
    createdBy: "Sarah Wilson",
    submittedTo: "Mike Johnson",
    date: "2025-04-14",
    approvedBy: "Jane Smith",
    status: "Approved",
  },
  {
    id: "3",
    type: "Office Supplies",
    title: "Printer and Cartridges",
    requestedAmount: 45000,
    approvedAmount: 0,
    createdBy: "Tom Brown",
    submittedTo: "John Doe",
    date: "2025-04-13",
    approvedBy: "",
    status: "Rejected",
  },
  // Add more items as needed
];

const RequisitionDetailsModal = ({
  requisition,
  visible,
  onClose,
}: {
  requisition: RequisitionReport | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!requisition) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Requisition Details</Text>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.requisitionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>{requisition.title}</Text>
                <View style={styles.cardMetaContainer}>
                  <Text style={styles.cardMeta}>{requisition.type}</Text>
                  <Text style={styles.cardMetaDot}>•</Text>
                  <Text style={styles.cardMeta}>{requisition.date}</Text>
                </View>
              </View>
              <View style={styles.statusContainer}>
                <Text
                  style={[
                    styles.cardStatus,
                    styles[
                      `status${requisition.status.replace(
                        " ",
                        ""
                      )}` as keyof typeof styles
                    ],
                  ]}
                >
                  {requisition.status}
                </Text>
              </View>
            </View>

            <View style={styles.amountContainer}>
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Requested Amount</Text>
                <Text style={styles.amountValue}>
                  ₹
                  {requisition.requestedAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <View style={styles.amountDivider} />
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Approved Amount</Text>
                <Text
                  style={[
                    styles.amountValue,
                    {
                      color:
                        requisition.approvedAmount > 0 ? "#10b981" : "#64748b",
                    },
                  ]}
                >
                  ₹
                  {requisition.approvedAmount.toLocaleString("en-IN", {
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
                  <Text style={styles.gridValue}>{requisition.createdBy}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Submitted To</Text>
                  <Text style={styles.gridValue}>
                    {requisition.submittedTo}
                  </Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Approved By</Text>
                  <Text style={styles.gridValue}>
                    {requisition.approvedBy || "Pending"}
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

export default function RequisitionReport() {
  // State for filters
  const [selectedType, setSelectedType] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showData, setShowData] = useState(false);
  const [selectedRequisition, setSelectedRequisition] =
    useState<RequisitionReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showNamePicker, setShowNamePicker] = useState(false);

  // Dummy options for dropdowns
  const requisitionTypes = [
    "Equipment Purchase",
    "Office Supplies",
    "Travel Request",
    "Other",
  ];
  const roles = ["Manager", "Employee", "Admin"];
  const names = ["John Doe", "Jane Smith", "Mike Johnson"];

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

  const handleApply = () => {
    setShowData(true);
  };

  const handleReset = () => {
    setSelectedType("");
    setSelectedRole("");
    setSelectedName("");
    setStartDate(new Date());
    setEndDate(new Date());
    setShowData(false);
  };

  const handleDownloadPDF = () => {
    // Implement PDF download logic here
    console.log("Downloading PDF...");
  };

  const renderItem = ({ item }: { item: RequisitionReport }) => (
    <TouchableOpacity
      style={styles.summaryCard}
      onPress={() => {
        setSelectedRequisition(item);
        setShowDetails(true);
      }}
    >
      <View style={styles.summaryHeader}>
        <View style={styles.summaryTitleContainer}>
          <Text style={styles.summaryTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.summarySubtitle}>{item.type}</Text>
        </View>
        <Text
          style={[
            styles.cardStatus,
            styles[
              `status${item.status.replace(" ", "")}` as keyof typeof styles
            ],
          ]}
        >
          {item.status}
        </Text>
      </View>
      <View style={styles.summaryFooter}>
        <Text style={styles.summaryAmount}>
          ₹{item.requestedAmount.toFixed(2)}
        </Text>
        <Text style={styles.summaryDate}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Requisition Report</Text>
      </View>

      <View style={styles.filtersCard}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedType && styles.filterChipActive]}
            onPress={() => setShowTypePicker(true)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedType && styles.filterChipTextActive,
              ]}
            >
              {selectedType || "Requisition Type"}
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

          <TouchableOpacity
            style={[styles.filterChip, styles.dateChip]}
            onPress={() => setShowStartDate(true)}
          >
            <Text style={styles.filterChipText}>
              {startDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, styles.dateChip]}
            onPress={() => setShowEndDate(true)}
          >
            <Text style={styles.filterChipText}>
              {endDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </ScrollView>

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

      {/* Add these before the FlatList */}
      <Modal visible={showTypePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowTypePicker(false)}
        >
          <View style={styles.pickerModal}>
            <Picker
              selectedValue={selectedType}
              onValueChange={(value) => {
                setSelectedType(value);
                setShowTypePicker(false);
              }}
            >
              <Picker.Item label="Select Type" value="" />
              {requisitionTypes.map((type) => (
                <Picker.Item key={type} label={type} value={type} />
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

      <RequisitionDetailsModal
        requisition={selectedRequisition}
        visible={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedRequisition(null);
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
  filtersContainer: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  applyButton: {
    backgroundColor: "#6366f1",
  },
  resetButton: {
    backgroundColor: "#64748b",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
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
    margin: 16,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  filterScrollView: {
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  filterChipActive: {
    backgroundColor: "#6366f1",
  },
  filterChipText: {
    fontSize: 14,
    color: "#64748b",
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
    marginTop: 16,
  },
  filterActionButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    backgroundColor: "#e2e8f0",
  },
  filterActionButtonText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
  applyButtonText: {
    color: "#ffffff",
  },
  requisitionCard: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  amountContainer: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  amountBox: {
    flex: 1,
    alignItems: "center",
  },
  amountDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 16,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  gridItem: {
    width: "50%",
    padding: 8,
  },
  gridLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 14,
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
  statusPartiallyApproved: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
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
  modalContent: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },
  cardTitleContainer: {
    flex: 1,
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
    color: "#64748b",
    marginHorizontal: 4,
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  detailsContainer: {
    marginTop: 16,
  },
  detailsHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  summaryCard: {
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
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  summaryTitleContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
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
  closeButton: {
    padding: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#6366f1",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerModal: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    width: "80%",
    padding: 16,
  },
});
