import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, SafeAreaView, 
  TextInput, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert, Platform, StatusBar 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Interface da Conta Fixa
interface FixedBill {
  id: string;
  title: string;
  value: number;
  dueDay: number; 
}

type BillStatus = 'paid' | 'pending' | 'overdue';

export default function FixedBillsScreen() {
  // --- ESTADOS ---
  const [bills, setBills] = useState<FixedBill[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<{[key: string]: boolean}>({}); 
  
  // Filtro de Data
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Modal e Inputs
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [dueDay, setDueDay] = useState('');

  // Totalizador
  const [totalFixed, setTotalFixed] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    const total = bills.reduce((acc, bill) => acc + bill.value, 0);
    setTotalFixed(total);
  }, [bills]);

  useEffect(() => {
    checkOverdueBills();
  }, [bills, paymentsMap, selectedDate]);

  // --- PERSISTÊNCIA ---
  async function loadData() {
    try {
      const billsJson = await AsyncStorage.getItem('@myfinance:fixed_bills');
      if (billsJson) setBills(JSON.parse(billsJson));

      const paymentsJson = await AsyncStorage.getItem('@myfinance:bill_payments');
      if (paymentsJson) setPaymentsMap(JSON.parse(paymentsJson));
    } catch (e) { console.log(e); }
  }

  async function saveData(newBills: FixedBill[]) {
    try {
      await AsyncStorage.setItem('@myfinance:fixed_bills', JSON.stringify(newBills));
      setBills(newBills);
    } catch (e) { console.log(e); }
  }

  async function savePaymentStatus(newMap: {[key: string]: boolean}) {
    try {
      await AsyncStorage.setItem('@myfinance:bill_payments', JSON.stringify(newMap));
      setPaymentsMap(newMap);
    } catch (e) { console.log(e); }
  }

  // --- LÓGICA ---
  const getBillStatus = (bill: FixedBill): BillStatus => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const paymentKey = `${bill.id}_${month}_${year}`;
    
    if (paymentsMap[paymentKey]) return 'paid';

    const dueDate = new Date(year, month, bill.dueDay);
    const today = new Date();
    today.setHours(0,0,0,0);
    dueDate.setHours(0,0,0,0);

    if (today > dueDate) return 'overdue';
    return 'pending';
  };

  const checkOverdueBills = () => {};

  const togglePayment = (bill: FixedBill) => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const paymentKey = `${bill.id}_${month}_${year}`;
    
    const newMap = { ...paymentsMap, [paymentKey]: !paymentsMap[paymentKey] };
    savePaymentStatus(newMap);
  };

  // --- EDIÇÃO E CRIAÇÃO ---
  const openNewBill = () => {
    setEditingId(null);
    setTitle('');
    setValue('');
    setDueDay('');
    setModalVisible(true);
  };

  const openEditBill = (bill: FixedBill) => {
    setEditingId(bill.id);
    setTitle(bill.title);
    setValue(String(bill.value));
    setDueDay(String(bill.dueDay));
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!title || !value || !dueDay) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const day = parseInt(dueDay);
    if (day < 1 || day > 31) {
      Alert.alert('Erro', 'Dia inválido');
      return;
    }

    const numericValue = parseFloat(value.replace(',', '.'));
    let newBillsList = [...bills];

    if (editingId) {
      newBillsList = newBillsList.map(b => b.id === editingId ? {
        ...b, title, value: numericValue, dueDay: day
      } : b);
    } else {
      const newBill: FixedBill = {
        id: String(new Date().getTime()),
        title, value: numericValue, dueDay: day
      };
      newBillsList = [...newBillsList, newBill];
    }

    saveData(newBillsList);
    setModalVisible(false);
  };

  const handleDelete = () => {
    if (!editingId) return;
    Alert.alert("Excluir Conta", "Isso removerá esta conta fixa permanentemente.", [
      { text: "Cancelar", style: 'cancel' },
      { text: "Excluir", style: 'destructive', onPress: () => {
          const filtered = bills.filter(b => b.id !== editingId);
          saveData(filtered);
          setModalVisible(false);
      }}
    ]);
  };

  // --- DATA ---
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const formatMonthYear = (date: Date) => {
    const month = date.toLocaleString('pt-BR', { month: 'long' });
    const year = date.getFullYear();
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  };

  const formatCurrency = (val: number) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // --- RENDER ---
  const renderItem = ({ item }: { item: FixedBill }) => {
    const status = getBillStatus(item);
    
    let statusColor = '#f59e0b'; 
    let statusText = 'Pendente';
    let cardBorderColor = 'transparent';

    if (status === 'paid') {
      statusColor = '#13ec6d'; 
      statusText = 'Pago';
    } else if (status === 'overdue') {
      statusColor = '#ef4444'; 
      statusText = 'Atrasado';
      cardBorderColor = '#ef4444';
    }

    return (
      <TouchableOpacity 
        style={[styles.card, { borderColor: cardBorderColor, borderWidth: status === 'overdue' ? 1 : 0 }]} 
        onPress={() => openEditBill(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <TouchableOpacity 
            style={[styles.iconBox, { backgroundColor: status === 'overdue' ? '#fee2e2' : '#f1f5f9' }]}
            onPress={() => togglePayment(item)}
          >
            <MaterialIcons 
              name={status === 'paid' ? "check-circle" : "radio-button-unchecked"} 
              size={24} 
              color={status === 'paid' ? '#13ec6d' : (status === 'overdue' ? '#ef4444' : '#cbd5e1')} 
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDate}>Vence dia {item.dueDay}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.cardValue}>{formatCurrency(item.value)}</Text>
          <TouchableOpacity onPress={() => togglePayment(item)}>
             <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{statusText}</Text>
             </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER ATUALIZADO */}
      <View style={styles.header}>
        {/* Título e Botão + */}
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Contas Fixas</Text>
          <TouchableOpacity style={styles.btnAdd} onPress={openNewBill}>
            <MaterialIcons name="add" size={28} color="#3870d8" />
          </TouchableOpacity>
        </View>

        {/* VALOR TOTAL (AGORA AQUI NO MEIO) */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Mensal Previsto</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalFixed)}</Text>
        </View>
        
        {/* Filtro de Data */}
        <View style={styles.dateFilter}>
          <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.arrowBtn}>
            <MaterialIcons name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatMonthYear(selectedDate)}</Text>
          <TouchableOpacity onPress={() => changeMonth('next')} style={styles.arrowBtn}>
            <MaterialIcons name="chevron-right" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* LISTA */}
      <View style={styles.content}>
        <FlatList 
          data={bills}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhuma conta fixa cadastrada.</Text>
            </View>
          }
        />
      </View>

      {/* MODAL ADICIONAR / EDITAR */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Editar Conta' : 'Nova Conta Fixa'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nome (ex: Aluguel)</Text>
            <TextInput 
              style={styles.input} 
              value={title} 
              onChangeText={setTitle}
              placeholder="Digite o nome..."
            />

            <View style={{ flexDirection: 'row', gap: 15 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Valor</Text>
                <TextInput 
                  style={styles.input} 
                  value={value} 
                  onChangeText={setValue}
                  keyboardType="numeric"
                  placeholder="0,00"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Dia Vencimento</Text>
                <TextInput 
                  style={styles.input} 
                  value={dueDay} 
                  onChangeText={setDueDay}
                  keyboardType="numeric"
                  placeholder="Dia (1-31)"
                  maxLength={2}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
              <Text style={styles.btnSaveText}>SALVAR CONTA</Text>
            </TouchableOpacity>

            {editingId && (
              <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}>
                <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                <Text style={styles.btnDeleteText}>Excluir esta conta</Text>
              </TouchableOpacity>
            )}

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: '#3870d8',
    padding: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 15 // Espaço antes do Total
  },
  headerTitle: {
    color: '#ffffffaa',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  btnAdd: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#fff',
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- NOVO TOTAL NO HEADER ---
  totalContainer: {
    alignItems: 'center',
    marginBottom: 15, // Espaço antes do Filtro
  },
  totalLabel: {
    color: '#e2e8f0',
    fontSize: 12,
    marginBottom: 2
  },
  totalValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold'
  },

  // --- FILTRO DE DATA ---
  dateFilter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Fundo sutil para o filtro
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'center'
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 120,
    textAlign: 'center'
  },
  arrowBtn: {
    padding: 2
  },

  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#94a3b8', fontSize: 16 },
  
  // CARD
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  cardDate: { fontSize: 12, color: '#64748b' },
  cardRight: { alignItems: 'flex-end', gap: 5 },
  cardValue: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  
  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#3870d8' },
  label: { color: '#64748b', marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, fontSize: 16, marginBottom: 15, color: '#333' },
  btnSave: { backgroundColor: '#3870d8', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnDelete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 5 },
  btnDeleteText: { color: '#ef4444', fontWeight: '600' }
});