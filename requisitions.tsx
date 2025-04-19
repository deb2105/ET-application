import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react-native';

// Define TypeScript types for API response and requisitions
type ApiResponse = {
  current_date: string;
  requisitions: Array<{
    requisition_id: string;
    user_name: string;
    requisition_title: string;
    requisition_amount: string;
    requisition_status: number | null;
  }>;
};

type Requisition = {
  requisition_id: string;
  user_name: string;
  requisition_title: string;
  requisition_amount: string;
  requisition_status: number | null;  // null: pending, 0: rejected, 1: approved, 2: partial
};

export default function Requisitions() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const ITEMS_PER_PAGE = 10;

  // Add useEffect for auto-refresh
  useEffect(() => {
    // Trigger refresh after 1 second
    const timer = setTimeout(() => {
      setRefreshKey((prevKey) => prevKey + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // Run only once when component mounts

  // Modify the existing useEffect to depend on refreshKey
  useEffect(() => {
    const fetchRequisitions = async () => {
      try {
        const response = await fetch(
          'https://demo-expense.geomaticxevs.in/ET-api/manage_requisitions.php'
        );
        const data: ApiResponse = await response.json();

        if (data.requisitions) {
          // Sort requisitions by ID in descending order (assuming newer IDs are larger)
          const sortedRequisitions = data.requisitions.sort((a, b) =>
            parseInt(b.requisition_id) - parseInt(a.requisition_id)
          );
          setRequisitions(sortedRequisitions);
        } else {
          Alert.alert('Error', 'Failed to fetch requisitions');
        }
      } catch (error) {
        console.error('Error fetching requisitions:', error);
        Alert.alert(
          'Error',
          'Unable to fetch requisitions. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequisitions();
  }, [refreshKey]); // Add refreshKey as dependency

  // Handle Approve or Reject action
  const handleAction = async (
    requisition_id: string,
    action: 'approve' | 'reject' | 'partial'
  ) => {
    try {
      const userId = await AsyncStorage.getItem('userid');
      if (!userId) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      // Calculate status code
      const statusCode = 
        action === 'approve' ? 1 : 
        action === 'partial' ? 2 : 
        0;

      // Convert 'partial' to 'approve' for API compatibility
      const apiAction = action === 'partial' ? 'approve' : action;

      const response = await fetch(
        'https://demo-expense.geomaticxevs.in/ET-api/approve_reject_requisitions.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requisition_id,
            action: apiAction,  // Send 'approve' instead of 'partial'
            user_id: parseInt(userId, 10),
            status: statusCode  // This will be 2 for partial approval
          }),
        }
      );

      const data = await response.json();
      if (data.status === 'success') {
        Alert.alert(
          'Success', 
          `Requisition ${action === 'partial' ? 'partially approved' : action + 'd'} successfully`
        );

        setRequisitions((prevRequisitions) =>
          prevRequisitions.map((req) =>
            req.requisition_id === requisition_id
              ? {
                  ...req,
                  requisition_status: statusCode
                }
              : req
          )
        );
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error handling action:', error);
      Alert.alert('Error', 'Failed to process the action. Please try again.');
    }
  };

  // Add search filter
  const filteredRequisitions = requisitions.filter(requisition => 
    requisition.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    requisition.requisition_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update pagination logic to use filtered results
  const totalPages = Math.ceil(filteredRequisitions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequisitions = filteredRequisitions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Render each requisition
  const renderRequisition = ({ item }: { item: Requisition }) => (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.userName}>{item.user_name}</Text>
        <Text style={styles.request}>{item.requisition_title}</Text>
        <Text style={styles.amount}>₹{item.requisition_amount}</Text>
        <Text
          style={[
            styles.status,
            item.requisition_status === null
              ? styles.pending
              : item.requisition_status === 1
              ? styles.approved
              : item.requisition_status === 2
              ? styles.partial
              : styles.rejected,
          ]}
        >
          {item.requisition_status === null
            ? 'Pending'
            : item.requisition_status === 1
            ? 'Approved'
            : item.requisition_status === 2
            ? 'Partially Approved'
            : 'Rejected'}
        </Text>
      </View>
      {item.requisition_status === null && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.approve]}
            onPress={() => handleAction(item.requisition_id, 'approve')}
          >
            <Check color="white" size={20} />
            <Text style={styles.buttonText}>Approve</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.partial_approve]}
            onPress={() => handleAction(item.requisition_id, 'partial')}
          >
            <Check color="white" size={20} />
            <Text style={styles.buttonText}>Partial</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.reject]}
            onPress={() => handleAction(item.requisition_id, 'reject')}
          >
            <X color="white" size={20} />
            <Text style={styles.buttonText}>Reject</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E293B" />
        <Text style={styles.loadingText}>Loading requisitions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Manage Requisitions</Text>
      
      {/* Add Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or title..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <FlatList
        data={paginatedRequisitions}
        renderItem={renderRequisition}
        keyExtractor={(item) => item.requisition_id}
        contentContainerStyle={styles.listContainer}
      />
      {/* Pagination Controls */}
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
            color={currentPage === 1 ? '#9ca3af' : '#6366f1'}
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
            color={currentPage === totalPages ? '#9ca3af' : '#6366f1'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 0,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  searchInput: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
    color: '#1E293B',
  },
  listContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  request: {
    fontSize: 16,
    color: '#475569',
    marginVertical: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginVertical: 2,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pending: {
    color: '#D97706',
  },
  approved: {
    color: '#16A34A',
  },
  partial: {
    color: '#F59E0B',
  },
  rejected: {
    color: '#DC2626',
  },
  actions: {
    flexDirection: 'column',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
  },
  approve: {
    backgroundColor: '#16A34A',
  },
  partial_approve: {
    backgroundColor: '#F59E0B',  // Amber color for partial approval
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
  },
  reject: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#475569',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  pageButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 16,
    color: '#1E293B',
  },
});
