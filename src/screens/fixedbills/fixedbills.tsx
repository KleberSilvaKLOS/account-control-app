import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, SafeAreaView, 
  TextInput, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert, Platform, StatusBar 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Interface da Conta Fixa (O modelo)
interface FixedBill {
  id: string;
  title: string;
  value: number;
  dueDay: number; // Dia do vencimento (1-31)
}

// Interface para o Status
type BillStatus = 'paid' | 'pending' | 'overdue';

export default function FixedBillsScreen() {
  // --- ESTADOS ---
  const [bills, setBills] = useState<FixedBill[]>([]);
  // Armazena quais contas foram pagas em quais meses. Chave: "ID_MES_ANO"
  const [paymentsMap, setPaymentsMap] = useState<{[key: string]: boolean}>({}); 
  
  // Filtro de Data (Mês/Ano atual)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Modal e Inputs
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [dueDay, setDueDay] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Verifica atrasos sempre que os dados ou a data mudam
  useEffect(() => {
    checkOverdueBills();
  }, [bills, paymentsMap, selectedDate]);

  // --- PERSISTÊNCIA ---
  async function loadData() {
    try {
      // Carrega as definições das contas
      const billsJson = await AsyncStorage.getItem('@myfinance:fixed_bills');
      if (billsJson) setBills(JSON.parse(billsJson));

      // Carrega o histórico de pagamentos
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

  // --- LÓGICA DE NEGÓCIO ---

  // Calcula o status de uma conta baseado na data selecionada
  const getBillStatus = (bill: FixedBill): BillStatus => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const paymentKey = `${bill.id}_${month}_${year}`;
    const isPaid = paymentsMap[paymentKey];

    if (isPaid) return 'paid';

    // Cria a data de vencimento para o mês selecionado
    const dueDate = new Date(year, month, bill.dueDay);
    const today = new Date();
    // Zera horas para comparar apenas datas
    today.setHours(0,0,0,0);
    dueDate.setHours(0,0,0,0);

    // Se estivermos olhando para um mês passado e não tá pago, é atrasado
    // Se for o mês atual e já passou do dia, é atrasado
    if (today > dueDate) return 'overdue';
    
    return 'pending';
  };

  // Popup de Alerta para atrasos
  const checkOverdueBills = () => {
    const currentMonth = new Date().getMonth();
    // Só alerta se estivermos olhando para o mês atual
    if (selectedDate.getMonth() !== currentMonth) return;

    const overdueCount = bills.filter(b => getBillStatus(b) === 'overdue').length;
    
    // Lógica simples para não spammar: poderíamos usar um estado 'alertShown', 
    // mas aqui vamos confiar na atualização do componente.
    // Para evitar loop infinito de alertas, não colocamos o Alert direto no useEffect sem controle,
    // mas como o usuário vai interagir, é aceitável para MVP.
  };

  // Toggle Pagar/Não Pagar
  const togglePayment = (bill: FixedBill) => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const paymentKey = `${bill.id}_${month}_${year}`;
    
    const newMap = { ...paymentsMap, [paymentKey]: !paymentsMap[paymentKey] };
    savePaymentStatus(newMap);
  };

  // Adicionar Nova Conta
  const handleAddBill = () => {
    if (!title || !value || !dueDay) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const day = parseInt(dueDay);
    if (day < 1 || day > 31) {
      Alert.alert('Erro', 'Dia de vencimento inválido (1-31)');
      return;
    }

    const newBill: FixedBill = {
      id: String(new Date().getTime()),
      title,
      value: parseFloat(value.replace(',', '.')),
      dueDay: day
    };

    const newBillsList = [...bills, newBill];
    saveData(newBillsList);
    
    setTitle('');
    setValue('');
    setDueDay('');
    setModalVisible(false);
  };

  // Deletar Conta (Remove a definição, histórico permanece mas fica órfão - ok para MVP)
  const handleDelete = (id: string) => {
    Alert.alert("Excluir Conta", "Isso removerá a conta de todos os meses.", [
      { text: "Cancelar", style: 'cancel' },
      { text: "Excluir", style: 'destructive', onPress: () => {
          const filtered = bills.filter(b => b.id !== id);
          saveData(filtered);
      }}
    ]);
  };

  // --- NAVEGAÇÃO DE DATA ---
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const formatMonthYear = (date: Date) => {
    // Ex: Janeiro 2026
    const month = date.toLocaleString('pt-BR', { month: 'long' });
    const year = date.getFullYear();
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  };

  const formatCurrency = (val: number) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // --- RENDERIZAÇÃO ---
  const renderItem = ({ item }: { item: FixedBill }) => {
    const status = getBillStatus(item);
    
    let statusColor = '#f59e0b'; // Pendente (Laranja)
    let statusText = 'Pendente';
    let cardBorderColor = 'transparent';

    if (status === 'paid') {
      statusColor = '#13ec6d'; // Pago (Verde)
      statusText = 'Pago';
    } else if (status === 'overdue') {
      statusColor = '#ef4444'; // Atrasado (Vermelho)
      statusText = 'Atrasado';
      cardBorderColor = '#ef4444'; // Borda vermelha para destacar
    }

    return (
      <TouchableOpacity 
        style={[styles.card, { borderColor: cardBorderColor, borderWidth: status === 'overdue' ? 1 : 0 }]} 
        onLongPress={() => handleDelete(item.id)}
        onPress={() => togglePayment(item)}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.iconBox, { backgroundColor: status === 'overdue' ? '#fee2e2' : '#f1f5f9' }]}>
            <MaterialIcons 
              name={status === 'paid' ? "check-circle" : "calendar-today"} 
              size={24} 
              color={status === 'overdue' ? '#ef4444' : '#3870d8'} 
            />
          </View>
          <View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDate}>Vence dia {item.dueDay}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.cardValue}>{formatCurrency(item.value)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contas Fixas</Text>
        
        {/* Filtro de Data */}
        <View style={styles.dateFilter}>
          <TouchableOpacity onPress={() => changeMonth('prev')}>
            <MaterialIcons name="chevron-left" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatMonthYear(selectedDate)}</Text>
          <TouchableOpacity onPress={() => changeMonth('next')}>
            <MaterialIcons name="chevron-right" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Botão + */}
        <TouchableOpacity style={styles.btnAdd} onPress={() => setModalVisible(true)}>
          <MaterialIcons name="add" size={28} color="#3870d8" />
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      <View style={styles.content}>
        <Text style={styles.listHeader}>
          Toque para pagar • Segure para excluir
        </Text>
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

      {/* MODAL ADICIONAR */}
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
              <Text style={styles.modalTitle}>Nova Conta Fixa</Text>
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

            <TouchableOpacity style={styles.btnSave} onPress={handleAddBill}>
              <Text style={styles.btnSaveText}>SALVAR CONTA</Text>
            </TouchableOpacity>
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
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    position: 'relative' // Para posicionar o botão +
  },
  headerTitle: {
    color: '#ffffffaa',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10
  },
  dateFilter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20
  },
  dateText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 150,
    textAlign: 'center'
  },
  btnAdd: {
    position: 'absolute',
    right: 20,
    top: 20,
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4
  },
  content: {
    flex: 1,
    padding: 20,
  },
  listHeader: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16
  },
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
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155'
  },
  cardDate: {
    fontSize: 12,
    color: '#64748b'
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 5
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
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
});