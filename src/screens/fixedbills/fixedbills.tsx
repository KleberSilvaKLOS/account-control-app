import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, SafeAreaView, 
  TextInput, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert, Platform, StatusBar 
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext'; // Importação do tema

interface FixedBill {
  id: string;
  title: string;
  value: number;
  dueDay: number; 
}

type BillStatus = 'paid' | 'pending' | 'overdue';

export default function FixedBillsScreen() {
  const { isDark } = useTheme(); // Hook do tema
  const [bills, setBills] = useState<FixedBill[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<{[key: string]: boolean}>({}); 
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [totalFixed, setTotalFixed] = useState(0);

  // Paleta de cores dinâmica
  const theme = {
    background: isDark ? '#0f172a' : '#ffffff',
    header: isDark ? '#1e293b' : '#3870d8',
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#334155',
    subtext: isDark ? '#94a3b8' : '#64748b',
    input: isDark ? '#334155' : '#f1f5f9',
    modal: isDark ? '#1e293b' : '#ffffff',
    iconBox: isDark ? '#334155' : '#f1f5f9'
  };

  useFocusEffect(
    useCallback(() => {
      const loadSyncData = async () => {
        const saved = await AsyncStorage.getItem('@myfinance:visibility');
        if (saved !== null) {
          setIsVisible(JSON.parse(saved));
        }
        loadData();
      };
      loadSyncData();
    }, [])
  );

  const toggleVisibility = async () => {
    const newValue = !isVisible;
    setIsVisible(newValue);
    await AsyncStorage.setItem('@myfinance:visibility', JSON.stringify(newValue));
  };

  useEffect(() => {
    const total = bills.reduce((acc, bill) => acc + bill.value, 0);
    setTotalFixed(total);
  }, [bills]);

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

  const togglePayment = (bill: FixedBill) => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const paymentKey = `${bill.id}_${month}_${year}`;
    const newMap = { ...paymentsMap, [paymentKey]: !paymentsMap[paymentKey] };
    savePaymentStatus(newMap);
  };

  const handleSave = () => {
    if (!title || !value || !dueDay) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    const day = parseInt(dueDay);
    const numericValue = parseFloat(value.replace(',', '.'));
    let newBillsList = [...bills];
    if (editingId) {
      newBillsList = newBillsList.map(b => b.id === editingId ? { ...b, title, value: numericValue, dueDay: day } : b);
    } else {
      const newBill: FixedBill = { id: String(new Date().getTime()), title, value: numericValue, dueDay: day };
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
  const renderValue = (val: number) => isVisible ? formatCurrency(val) : '••••••';

  const renderItem = ({ item }: { item: FixedBill }) => {
    const status = getBillStatus(item);
    let statusColor = '#f59e0b'; 
    let statusText = 'Pendente';
    let cardBorderColor = isDark ? '#334155' : 'transparent';
    
    if (status === 'paid') { statusColor = '#13ec6d'; statusText = 'Pago'; }
    else if (status === 'overdue') { statusColor = '#ef4444'; statusText = 'Atrasado'; cardBorderColor = '#ef4444'; }

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.card, borderColor: cardBorderColor, borderWidth: 1 }]} 
        onPress={() => {
          setEditingId(item.id); setTitle(item.title); setValue(String(item.value)); setDueDay(String(item.dueDay)); setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <TouchableOpacity 
            style={[styles.iconBox, { backgroundColor: status === 'overdue' ? '#fee2e2' : theme.iconBox }]}
            onPress={() => togglePayment(item)}
          >
            <MaterialIcons 
              name={status === 'paid' ? "check-circle" : "radio-button-unchecked"} 
              size={24} 
              color={status === 'paid' ? '#13ec6d' : (status === 'overdue' ? '#ef4444' : '#cbd5e1')} 
            />
          </TouchableOpacity>
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.cardDate, { color: theme.subtext }]}>Vence dia {item.dueDay}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.cardValue, { color: theme.text }]}>{renderValue(item.value)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.header} />
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Contas Fixas</Text>
          <View style={styles.headerRightActions}>
            <TouchableOpacity onPress={toggleVisibility} style={styles.btnEyeHeader}>
               <Ionicons name={isVisible ? "eye" : "eye-off"} size={24} color="#ffffffcc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAdd} onPress={() => { setEditingId(null); setTitle(''); setValue(''); setDueDay(''); setModalVisible(true); }}>
              <MaterialIcons name="add" size={28} color={theme.header} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Mensal Previsto</Text>
          <Text style={styles.totalValue}>{renderValue(totalFixed)}</Text>
        </View>
        <View style={styles.dateFilter}>
          <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.arrowBtn}><MaterialIcons name="chevron-left" size={24} color="#fff" /></TouchableOpacity>
          <Text style={styles.dateText}>{formatMonthYear(selectedDate)}</Text>
          <TouchableOpacity onPress={() => changeMonth('next')} style={styles.arrowBtn}><MaterialIcons name="chevron-right" size={24} color="#fff" /></TouchableOpacity>
        </View>
      </View>
      <View style={styles.content}>
        <FlatList data={bills} keyExtractor={item => item.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>Nenhuma conta cadastrada.</Text></View>} />
      </View>
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}><View style={styles.modalBackdrop} /></TouchableWithoutFeedback>
          <View style={[styles.modalContent, { backgroundColor: theme.modal }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#3870d8' : '#3870d8' }]}>{editingId ? 'Editar Conta' : 'Nova Conta'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} color={theme.subtext} /></TouchableOpacity>
            </View>
            <Text style={[styles.label, { color: theme.subtext }]}>Nome</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.input, color: theme.text }]} value={title} onChangeText={setTitle} placeholder="Ex: Aluguel" placeholderTextColor={isDark ? '#64748b' : '#94a3b8'} />
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <View style={{ flex: 1 }}><Text style={[styles.label, { color: theme.subtext }]}>Valor</Text><TextInput style={[styles.input, { backgroundColor: theme.input, color: theme.text }]} value={value} onChangeText={setValue} keyboardType="numeric" placeholder="0,00" placeholderTextColor={isDark ? '#64748b' : '#94a3b8'} /></View>
              <View style={{ flex: 1 }}><Text style={[styles.label, { color: theme.subtext }]}>Dia</Text><TextInput style={[styles.input, { backgroundColor: theme.input, color: theme.text }]} value={dueDay} onChangeText={setDueDay} keyboardType="numeric" placeholder="1-31" maxLength={2} placeholderTextColor={isDark ? '#64748b' : '#94a3b8'} /></View>
            </View>
            <TouchableOpacity style={styles.btnSave} onPress={handleSave}><Text style={styles.btnSaveText}>SALVAR</Text></TouchableOpacity>
            {editingId && (
              <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}>
                <MaterialIcons name="delete-outline" size={20} color="#ef4444" /><Text style={styles.btnDeleteText}>Excluir conta</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { padding: 20, paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
  headerTop: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 15 },
  headerTitle: { color: '#ffffffaa', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  headerRightActions: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnEyeHeader: { padding: 5 },
  btnAdd: { backgroundColor: '#fff', width: 35, height: 35, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  totalContainer: { alignItems: 'center', marginBottom: 15 },
  totalLabel: { color: '#e2e8f0', fontSize: 12, marginBottom: 2 },
  totalValue: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  dateFilter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, alignSelf: 'center' },
  dateText: { color: '#fff', fontSize: 16, fontWeight: 'bold', minWidth: 120, textAlign: 'center' },
  arrowBtn: { padding: 2 },
  content: { flex: 1, padding: 20 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#94a3b8', fontSize: 16 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 12, elevation: 2 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardDate: { fontSize: 12 },
  cardRight: { alignItems: 'flex-end', gap: 5 },
  cardValue: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  modalContent: { borderRadius: 20, padding: 25, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { marginBottom: 5, fontWeight: '600' },
  input: { padding: 12, borderRadius: 10, fontSize: 16, marginBottom: 15 },
  btnSave: { backgroundColor: '#3870d8', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnDelete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 5 },
  btnDeleteText: { color: '#ef4444', fontWeight: '600' }
});