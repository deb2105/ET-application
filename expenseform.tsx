import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';

type ExpenseItem = {
  id: string;
  title: string;
  type: string | null;
  description: string;
  amount: number;
  remarks: string;
  billDate: string;
  billFile?: any;
  productImage?: any;
};

type UserData = {
  userId: string;
  userType: string;
  firstName: string;
  lastName: string;
};

const API_BASE_URL = 'https://demo-expense.geomaticxevs.in/ET-api/add_expense.php';

const submitExpenses = async (expenseData: any) => {
  try {
    const formData = new FormData();

    // Add basic expense data
    formData.append('expense_track_title', expenseData.expenseTitle);
    formData.append('expense_type_id', expenseData.expenseType || '');
    formData.append('expense_total_amount', expenseData.totalAmount.toString());
    formData.append('expense_track_app_rej_remarks', '');
    formData.append('expense_track_create_lat', '287190272');
    formData.append('expense_track_create_long', '88.3654656');
    formData.append('expense_track_status', 'Submitted');
    formData.append('expense_track_created_by', expenseData.userId || '1');
    formData.append('expense_track_submitted_to', expenseData.submittedToName);
    formData.append('expense_track_approved_rejected_by', '0');

    // Prepare details array
    const details = expenseData.expenses.map((expense: any, index: number) => {
      const detail = {
        expense_head_id: expenseData.headValue,
        expense_product_name: expense.title || 'Untitled',
        expense_product_qty: 1,
        expense_product_unit: 'piece',
        expense_product_desc: expense.description,
        expense_product_sl_no: index + 1,
        expense_product_amount: expense.amount,
        expense_bill_date: expense.billDate,
      };

      // Add files if they exist
      if (expense.billFile) {
        formData.append(`expense_product_bill_photo_path[${index}]`, {
          uri: expense.billFile.uri,
          name: expense.billFile.name || `bill_${index}.pdf`,
          type: expense.billFile.mimeType || 'application/pdf',
        } as any);
      }

      if (expense.productImage) {
        formData.append(`expense_product_photo_path[${index}]`, {
          uri: expense.productImage.uri,
          name: expense.productImage.name || `product_${index}.jpg`,
          type: expense.productImage.mimeType || 'image/jpeg',
        } as any);
      }

      return detail;
    });

    formData.append('details', JSON.stringify(details));

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTPS error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting expenses:', error);
    throw error;
  }
};

const fetchUserData = async (): Promise<UserData | null> => {
  try {
    console.log('Sending request to:', API_BASE_URL);
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Add authorization if needed:
        // 'Authorization': 'Bearer YOUR_TOKEN'
      },
      body: JSON.stringify({ fetch_user_data: true }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTPS error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    
    return {
      userId: data.user?.id || data.user?.user_id || '',
      userType: data.user?.role || data.user?.user_type || '',
      firstName: data.user?.first_name || data.user?.firstName || '',
      lastName: data.user?.last_name || data.user?.lastName || ''
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

const ExpenseDetailsPage = () => {
  const [userData, setUserData] = useState<UserData>({
    userId: '',
    userType: '',
    firstName: '',
    lastName: ''
  });
  const [expenseTitle, setExpenseTitle] = useState<string>('');
  const [currentExpense, setCurrentExpense] = useState<ExpenseItem>({
    id: Math.random().toString(36).substring(7),
    title: '',
    type: null,
    description: '',
    amount: 0,
    remarks: '',
    billDate: new Date().toLocaleDateString(),
  });
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submittedToCategory, setSubmittedToCategory] = useState<string>('');
  const [submittedToName, setSubmittedToName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Dropdown states
  const [headOpen, setHeadOpen] = useState(false);
  const [headValue, setHeadValue] = useState(null);
  const [headItems, setHeadItems] = useState([
    { label: "Project Purpose", value: "Project Purpose" },
    { label: "Office Purpose", value: "Office Purpose" },
    { label: "Others", value: "Others" },
  ]);

  const [expenseTypeOpen, setExpenseTypeOpen] = useState(false);
  const [expenseType, setExpenseType] = useState<string | null>(null);
  const [expenseTypeItems, setExpenseTypeItems] = useState([
    { label: "Food", value: "Food" },
    { label: "Travel / Convence", value: "Travel / Convence" },
    { label: "Lodging", value: "Lodging" },
    { label: "Buying F.M.C Products", value: "Buying F.M.C Products" },
    { label: "Buying IT Products", value: "Buying IT Products" },
    { label: "Buying Other Materials", value: "Buying Other Materials" },
    { label: "Other", value: "Other" },
  ]);

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoadingUser(true);
      try {
        const data = await fetchUserData();
        if (data) {
          setUserData(data);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        Alert.alert('Error', 'Failed to load user information');
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUserData();
  }, []);

  const handleAddExpense = () => {
    if (!expenseType) {
      Alert.alert('Error', 'Please select an expense type');
      return;
    }

    if (!currentExpense.description || !currentExpense.amount || !currentExpense.remarks) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const expenseToAdd = {
      ...currentExpense,
      id: editingId || Math.random().toString(36).substring(7),
      title: expenseTitle,
      type: expenseType,
    };

    if (editingId) {
      setExpenses(expenses.map(exp => exp.id === editingId ? expenseToAdd : exp));
      setEditingId(null);
    } else {
      setExpenses([...expenses, expenseToAdd]);
    }

    resetForm();
  };

  const handleEditExpense = (id: string) => {
    const expenseToEdit = expenses.find(exp => exp.id === id);
    if (expenseToEdit) {
      setCurrentExpense(expenseToEdit);
      setExpenseTitle(expenseToEdit.title);
      setExpenseType(expenseToEdit.type);
      setEditingId(id);
    }
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const pickBill = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled) {
        setCurrentExpense({ ...currentExpense, billFile: result.assets[0] });
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickProductImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setCurrentExpense({ ...currentExpense, productImage: result.assets[0] });
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const resetForm = () => {
    setCurrentExpense({
      id: Math.random().toString(36).substring(7),
      title: '',
      type: null,
      description: '',
      amount: 0,
      remarks: '',
      billDate: new Date().toLocaleDateString(),
    });
    setExpenseType(null);
  };

  const handleSubmitAllExpenses = async () => {
    if (expenses.length === 0) {
      Alert.alert('Error', 'Please add at least one expense before submitting');
      return;
    }

    if (!headValue) {
      Alert.alert('Error', 'Please select an expense head');
      return;
    }

    if (!submittedToCategory || !submittedToName) {
      Alert.alert('Error', 'Please select who to submit to');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const expenseData = {
        ...userData, // Include user data in submission
        expenseTitle,
        headValue,
        expenseType,
        totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        expenses,
        submittedToName,
        submittedToCategory,
      };

      const result = await submitExpenses(expenseData);
      
      if (result.status === 'success') {
        Alert.alert('Success', 'Expenses submitted successfully!');
        setExpenses([]);
        setHeadValue(null);
        setExpenseTitle('');
        setSubmittedToCategory('');
        setSubmittedToName('');
      } else {
        Alert.alert('Error', result.message || 'Failed to submit expenses');
      }
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Failed to submit expenses. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const renderContent = () => (
    <>
      <Text style={styles.header}>Add Expense</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>USER ID: {isLoadingUser ? 'Loading...' : userData.userId}</Text>
        <Text>USER TYPE: {isLoadingUser ? 'Loading...' : userData.userType}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FIRST NAME: {isLoadingUser ? 'Loading...' : userData.firstName}</Text>
        <Text style={styles.sectionTitle}>LAST NAME: {isLoadingUser ? 'Loading...' : userData.lastName}</Text>
        <Text style={styles.sectionTitle}>LAST NAME: {isLoadingUser ? 'Loading...' : userData.lastName}</Text>
      </View>

      <View style={styles.section}>
        <Text>DATE: {new Date().toLocaleString()}</Text>
        <Text>LOCATION: 287190272, 88.3654656</Text>

        <View style={[styles.inputGroup, { zIndex: 2500, marginBottom: 20 }]}>
          <Text>EXPENSE HEAD*</Text>
          <DropDownPicker
            open={headOpen}
            value={headValue}
            items={headItems}
            setOpen={setHeadOpen}
            setValue={setHeadValue}
            setItems={setHeadItems}
            placeholder="Select Expense Head"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={2500}
            zIndexInverse={2000}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text>EXPENSE BILL TITLE*</Text>
        <TextInput
          value={expenseTitle}
          onChangeText={setExpenseTitle}
          placeholder="Expense Title"
          style={styles.input}
        />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>{editingId ? 'Edit Expense' : 'Add New Expense'}</Text>

        <View style={[styles.inputGroup, { zIndex: 2500 }]}>
          <Text style={styles.label}>Expense Type *</Text>
          <DropDownPicker
            open={expenseTypeOpen}
            value={expenseType}
            items={expenseTypeItems}
            setOpen={setExpenseTypeOpen}
            setValue={setExpenseType}
            setItems={setExpenseTypeItems}
            placeholder="Select Expense Type"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={2500}
            zIndexInverse={2000}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text>EXPENSE DESC*</Text>
          <TextInput
            value={currentExpense.description}
            onChangeText={(text) => setCurrentExpense({ ...currentExpense, description: text })}
            placeholder="Expense Description"
            style={styles.input}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text>AMOUNT*</Text>
          <TextInput
            value={currentExpense.amount ? currentExpense.amount.toString() : ''}
            onChangeText={(text) => setCurrentExpense({ ...currentExpense, amount: parseFloat(text) || 0 })}
            placeholder="0"
            style={styles.input}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text>REMARKS*</Text>
          <TextInput
            value={currentExpense.remarks}
            onChangeText={(text) => setCurrentExpense({ ...currentExpense, remarks: text })}
            placeholder="Remarks"
            style={styles.input}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text>BILL DATE</Text>
          <TextInput
            value={currentExpense.billDate}
            onChangeText={(text) => setCurrentExpense({ ...currentExpense, billDate: text })}
            placeholder="mm/dd/yyyy"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text>HAVE ANY EXPENSE/BILL?</Text>
          <Button title="Upload Bill" onPress={pickBill} />
          {currentExpense.billFile && <Text>{currentExpense.billFile.name}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text>PRODUCT PICTURE (if any)</Text>
          <Button title="Upload Product Image" onPress={pickProductImage} />
          {currentExpense.productImage && (
            <Image source={{ uri: currentExpense.productImage.uri }} style={{ width: 100, height: 100, marginTop: 10 }} />
          )}
        </View>

        <View style={[styles.buttonGroup, { marginBottom: 20 }]}>
          <TouchableOpacity style={[styles.button, styles.addButton]} onPress={handleAddExpense}>
            <Text style={styles.buttonText}>{editingId ? 'Update Expense' : 'Add Expense'}</Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setEditingId(null);
                resetForm();
              }}
            >
              <Text style={styles.buttonText}>Cancel Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Added Expenses</Text>
        {expenses.length === 0 ? (
          <Text>No expenses added yet</Text>
        ) : (
          <>
            {expenses.map((item) => (
              <View style={styles.expenseItem} key={item.id}>
                <View style={styles.expenseInfo}>
                  <Text>
                    <Text style={styles.bold}>{item.title || 'Untitled'}</Text>
                    {` - ${item.type || 'No Type'} (₹${item.amount?.toFixed(2) || '0.00'})`}
                  </Text>
                  {item.description && <Text>Description: {item.description}</Text>}
                </View>
                <View style={styles.expenseActions}>
                  <TouchableOpacity
                    style={[styles.smallButton, styles.editButton]}
                    onPress={() => handleEditExpense(item.id)}
                  >
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallButton, styles.removeButton]}
                    onPress={() => handleRemoveExpense(item.id)}
                  >
                    <Text style={styles.buttonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalText}>Total Amount: ₹ {totalAmount.toFixed(2)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SUBMITTED TO*</Text>
        <View style={styles.inputGroup}>
          <Text>Category</Text>
          <TextInput
            value={submittedToCategory}
            onChangeText={setSubmittedToCategory}
            placeholder="Select Category"
            style={styles.input}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text>Name</Text>
          <TextInput
            value={submittedToName}
            onChangeText={setSubmittedToName}
            placeholder="Select Name"
            style={styles.input}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.submitButton, { opacity: expenses.length === 0 || isSubmitting ? 0.5 : 1 }]}
        onPress={handleSubmitAllExpenses}
        disabled={expenses.length === 0 || isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Submitting...' : 'Submit All Expenses'}
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 50 }}
      data={[{}]}
      keyExtractor={() => 'key'}
      renderItem={renderContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={isLoadingUser}
          onRefresh={() => {
            const loadUserData = async () => {
              setIsLoadingUser(true);
              try {
                const data = await fetchUserData();
                if (data) {
                  setUserData(data);
                }
              } catch (error) {
                console.error('Failed to refresh user data:', error);
              } finally {
                setIsLoadingUser(false);
              }
            };
            loadUserData();
          }}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  formContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 20,
    borderRadius: 5,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  dropdown: {
    backgroundColor: 'white',
    borderColor: '#ddd',
    borderRadius: 5,
    marginTop: 5,
  },
  dropdownContainer: {
    borderColor: '#ddd',
    borderRadius: 5,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  smallButton: {
    padding: 5,
    borderRadius: 3,
    minWidth: 60,
    marginLeft: 5,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  removeButton: {
    backgroundColor: '#f44336',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#666",
    fontWeight: "500",
  },
  expenseInfo: {
    flex: 1,
  },
  expenseActions: {
    flexDirection: 'row',
  },
  bold: {
    fontWeight: 'bold',
  },
  totalSection: {
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default ExpenseDetailsPage;