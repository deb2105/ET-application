import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Role {
  label: string;
  value: string;
}

interface User {
  label: string;
  value: string;
}

interface FetchRolesResponse {
  status: string;
  message?: string;
  roles?: Role[];
}

interface FetchUsersResponse {
  status: string;
  message?: string;
  users?: Array<{ id: number; name: string }>;
}

export default function AddRequisitionScreen() {
  const [userId, setUserId] = useState('');
  const [requisitionTitle, setRequisitionTitle] = useState('');
  const [requisitionDesc, setRequisitionDesc] = useState('');
  const [requisitionAmount, setRequisitionAmount] = useState('');
  const [submittedToName, setSubmittedToName] = useState('');
  const [submittedToId, setSubmittedToId] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredUsers = users.filter((user) =>
    user.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user ID
        const storedUserId = await AsyncStorage.getItem('userid');
        if (storedUserId) setUserId(storedUserId);

        // Fetch roles
        setLoadingRoles(true);
        const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/add_requisition.php?fetch_roles=true');
        const data: FetchRolesResponse = await response.json();

        if (response.ok && data.status === 'success' && data.roles) {
          setRoles(data.roles);
        } else {
          Alert.alert('Error', data.message || 'Failed to load roles');
        }
      } catch (error) {
        Alert.alert('Error', 'Network error. Please try again.');
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      fetchUsersByRole(selectedRoleId);
    }
  }, [selectedRoleId]);

  const fetchUsersByRole = async (roleId: string) => {
    try {
      setLoadingUsers(true);
      setUsers([]);
      setSubmittedToName('');
      setSubmittedToId('');
      
      const response = await fetch(`https://demo-expense.geomaticxevs.in/ET-api/add_requisition.php?role_id=${roleId}`);
      const result: FetchUsersResponse = await response.json();

      if (response.ok && result.status === 'success' && result.users) {
        const userOptions = result.users.map(user => ({
          label: user.name,
          value: user.id.toString()
        }));
        setUsers(userOptions);
      } else {
        Alert.alert('Error', result.message || 'No users found for this role');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async () => {
    if (!requisitionTitle || !requisitionDesc || !requisitionAmount || !submittedToId) {
      setResponseMessage('Error: Please fill in all required fields');
      setIsSubmitted(true);
      return;
    }

    const requisitionData = {
      requisition_title: requisitionTitle,
      requisition_desc: requisitionDesc,
      requisition_req_amount: requisitionAmount,
      requisition_submitted_to: submittedToId,
      requisition_created_by: userId,
    };

    try {
      const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/add_requisition.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requisitionData),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setResponseMessage(result.message);
        setIsSubmitted(true);
        // Clear form after successful submission
        setRequisitionTitle('');
        setRequisitionDesc('');
        setRequisitionAmount('');
        setSelectedRoleId('');
        setUsers([]);
        setSubmittedToName('');
        setSubmittedToId('');
      } else {
        setResponseMessage(result.message || 'Failed to submit requisition');
        setIsSubmitted(true);
      }
    } catch (error) {
      setResponseMessage('Error: Network error. Please try again.');
      setIsSubmitted(true);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>New Requisition</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Requisition Title *</Text>
          <TextInput
            style={styles.input}
            value={requisitionTitle}
            onChangeText={setRequisitionTitle}
            placeholder="Enter Requisition Title"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Requisition Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={requisitionDesc}
            onChangeText={setRequisitionDesc}
            placeholder="Enter Requisition Description"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
  <Text style={styles.label}>Requisition Amount *</Text>
  <TextInput
    style={styles.input}
    value={requisitionAmount}
    onChangeText={(text) => {
      // Allow only integers
      const sanitizedText = text.replace(/[^0-9]/g, '');
      setRequisitionAmount(sanitizedText);
    }}
    placeholder="Enter Amount"
    keyboardType="numeric" // Ensures numeric keyboard is displayed
  />
</View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Recipient Role *</Text>
          {loadingRoles ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <RNPickerSelect
              onValueChange={(value) => setSelectedRoleId(value)}
              items={roles}
              value={selectedRoleId}
              placeholder={{ label: 'Select a role...', value: null }}
              style={{
                ...pickerSelectStyles,
                inputAndroidContainer: {
                  maxHeight: 200, // Limit the height for scrolling
                },
                inputIOSContainer: {
                  maxHeight: 200, // Limit the height for scrolling
                },
              }}
            />
          )}
        </View>

        {selectedRoleId && (
          <>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Recipient Name *</Text>
              {loadingUsers ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <RNPickerSelect
                  onValueChange={(value, index) => {
                    setSubmittedToName(users[index]?.label || '');
                    setSubmittedToId(value);
                  }}
                  items={users.map((user) => ({
                    label: user.label,
                    value: user.value,
                  }))}
                  value={submittedToId}
                  placeholder={{
                    label: users.length
                      ? 'Select a recipient...'
                      : 'No users available',
                    value: null,
                  }}
                  style={{
                    ...pickerSelectStyles,
                    inputIOS: {
                      ...pickerSelectStyles.inputIOS,
                      height: 50, // Increase height for better visibility
                      fontSize: 18, // Larger font size
                    },
                    inputAndroid: {
                      ...pickerSelectStyles.inputAndroid,
                      height: 50, // Increase height for better visibility
                      fontSize: 18, // Larger font size
                    },
                  }}
                  disabled={users.length === 0}
                />
              )}
            </View>
          </>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!requisitionTitle || !requisitionDesc || !requisitionAmount || !submittedToId) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={!requisitionTitle || !requisitionDesc || !requisitionAmount || !submittedToId}
        >
          <Text style={styles.submitButtonText}>Submit Requisition</Text>
        </TouchableOpacity>

        {isSubmitted && (
          <Text
            style={[
              styles.responseMessage,
              responseMessage.includes('Error') ? styles.errorMessage : styles.successMessage,
            ]}
          >
            {responseMessage}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  form: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  responseMessage: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ff4444',
  },
  successMessage: {
    color: '#00C851',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: 'black',
  },
  inputAndroid: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: 'black',
  },
  placeholder: {
    color: '#9EA0A4',
  },
});