import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, Dimensions, Platform, StatusBar, 
  TouchableOpacity, Modal, TouchableWithoutFeedback, Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'; 
import { MaterialIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const CHART_COLORS = ['#3870d8', '#13ec6d', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

// --- INTERFACES ---
interface Transaction {
  id: string;
  description: string;
  value: number; 
  type: 'income' | 'expense';
  date: string;
  time: string;
  rawName?: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface ExpenseGroup {
  rawName: string;
  value: number;
}

export default function SummaryScreen() {
  // --- ESTADOS DE DADOS ---
  const [balance, setBalance] = useState<number>(0);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [expensesList, setExpensesList] = useState<ExpenseGroup[]>([]); 
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  // --- ESTADOS DE UI ---
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // --- ESTADOS DE FILTRO DE DATA ---
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); 
  const [endDate, setEndDate] = useState<Date>(new Date());
  
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    applyDateFilter();
  }, [startDate, endDate, allTransactions]);

  // --- CARREGAMENTO ---
  async function loadData() {
    try {
      const jsonValue = await AsyncStorage.getItem('@myfinance:transactions');
      const list: Transaction[] = jsonValue != null ? JSON.parse(jsonValue) : [];
      setAllTransactions(list);
    } catch (e) {
      console.log(e);
    }
  }

  // --- LÓGICA DE DADOS ---
  const parseDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  function applyDateFilter() {
    // Se não tiver transações, zera tudo
    if (allTransactions.length === 0) {
        setBalance(0);
        setTotalExpense(0);
        setChartData([]);
        setExpensesList([]);
        return;
    }

    const filteredList = allTransactions.filter(item => {
      const itemDate = parseDate(item.date);
      const start = new Date(startDate); start.setHours(0,0,0,0);
      const end = new Date(endDate); end.setHours(23,59,59,999);
      return itemDate >= start && itemDate <= end;
    });

    processData(filteredList);
  }

  function processData(list: Transaction[]) {
    let incomeTotal = 0;
    let expenseTotal = 0;
    const expensesMap: { [key: string]: number } = {};

    list.forEach(item => {
      const val = Number(item.value);
      if (item.type === 'income') {
        incomeTotal += val;
      } else {
        expenseTotal += val;
        if (expensesMap[item.description]) {
          expensesMap[item.description] += val;
        } else {
          expensesMap[item.description] = val;
        }
      }
    });

    setBalance(incomeTotal - expenseTotal);
    setTotalExpense(expenseTotal);

    const sortedExpenses: ExpenseGroup[] = Object.keys(expensesMap)
      .map(key => ({ rawName: key, value: expensesMap[key] }))
      .sort((a, b) => b.value - a.value);

    setExpensesList(sortedExpenses);

    // Preparar Gráfico
    const top5 = sortedExpenses.slice(0, 5);
    const top5Total = top5.reduce((sum, item) => sum + item.value, 0);
    const othersValue = expenseTotal - top5Total;

    let chartConfigData: ChartData[] = top5.map((item, index) => ({
      name: item.rawName,
      value: item.value,
      color: CHART_COLORS[index % CHART_COLORS.length],
      legendFontColor: '#64748b',
      legendFontSize: 12
    }));

    if (othersValue > 0) {
      chartConfigData.push({
        name: 'Outros',
        value: othersValue,
        color: '#94a3b8',
        legendFontColor: '#64748b',
        legendFontSize: 12
      });
    }

    setChartData(chartConfigData);
  }

  // --- AÇÕES DO MODAL (+) ---
  function handleClearAll() {
    Alert.alert(
      "Resetar Aplicativo",
      "Isso apagará TODO o histórico de transações. Tem certeza?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Apagar Tudo", 
          style: "destructive", 
          onPress: async () => {
            await AsyncStorage.removeItem('@myfinance:transactions');
            setAllTransactions([]); // Limpa estado local
            setModalVisible(false); // Fecha modal
            Alert.alert("Sucesso", "Dados limpos.");
          }
        }
      ]
    );
  }

  // --- FILTROS DE DATA ---
  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      if (pickerMode === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const showDatepicker = (mode: 'start' | 'end') => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const setFilterThisMonth = () => {
    const now = new Date();
    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  };

  const setFilterLast30Days = () => {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 30);
    setStartDate(past);
    setEndDate(now);
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatCurrency = (val: number) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <SafeAreaView style={styles.container}>
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Resumo Financeiro</Text>
            {/* BOTÃO + */}
            <TouchableOpacity style={styles.btnAddHeader} onPress={() => setModalVisible(true)}>
                <MaterialIcons name="add" size={30} color="#3870d8" />
            </TouchableOpacity>
        </View>

        <Text style={styles.labelBalance}>Saldo no Período</Text>
        <Text style={styles.valueBalance}>{formatCurrency(balance)}</Text>
      </View>

      {/* --- BARRA DE FILTROS --- */}
      <View style={styles.filterBar}>
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={() => showDatepicker('start')} style={styles.dateBtn}>
            <MaterialIcons name="event" size={18} color="#3870d8" />
            <Text style={styles.dateText}>{formatDateDisplay(startDate)}</Text>
          </TouchableOpacity>
          <Text style={styles.dateSeparator}>até</Text>
          <TouchableOpacity onPress={() => showDatepicker('end')} style={styles.dateBtn}>
            <MaterialIcons name="event" size={18} color="#3870d8" />
            <Text style={styles.dateText}>{formatDateDisplay(endDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shortcutContainer}>
          <TouchableOpacity onPress={setFilterThisMonth} style={styles.shortcutBtn}>
            <Text style={styles.shortcutText}>Mês</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={setFilterLast30Days} style={styles.shortcutBtn}>
            <Text style={styles.shortcutText}>30d</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Picker Invisível */}
      {showPicker && (
        <DateTimePicker
          value={pickerMode === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()}
        />
      )}

      {/* --- CONTEÚDO --- */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Gastos do Período</Text>
        
        {chartData.length > 0 ? (
          <View style={styles.chartContainer}>
            <PieChart
              data={chartData}
              width={screenWidth} 
              height={240}
              chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
              accessor={"value"}
              backgroundColor={"transparent"}
              paddingLeft={"15"} 
              center={[10, 0]} 
              absolute={false}
              hasLegend={true}
            />
            <View style={styles.donutHole}>
              <Text style={styles.donutLabel}>TOTAL</Text>
              <Text style={styles.donutValue}>
                {totalExpense < 10000 ? formatCurrency(totalExpense) : `R$ ${(totalExpense/1000).toFixed(1)}k`}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Sem dados neste período.</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Ranking Detalhado</Text>
        
        <FlatList
          data={expensesList}
          keyExtractor={(item) => item.rawName}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item, index }) => (
            <View style={styles.itemCard}>
              <View style={[styles.rankBadge, { backgroundColor: index < 5 ? CHART_COLORS[index] : '#94a3b8' }]}>
                <Text style={styles.rankText}>{index + 1}º</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.rawName}</Text>
                <View style={styles.progressBarBackground}>
                  <View style={[
                    styles.progressBarFill, 
                    { 
                      width: `${(item.value / totalExpense) * 100}%`, 
                      backgroundColor: index < 5 ? CHART_COLORS[index] : '#94a3b8' 
                    }
                  ]} />
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemValue}>- {formatCurrency(item.value)}</Text>
                <Text style={styles.itemPercent}>
                    {totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(1) : 0}%
                </Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* --- MODAL LATERAL --- */}
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

          <View style={styles.sideMenu}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Opções</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.helperText}>Gerenciamento de dados.</Text>

            {/* ÁREA DE PERIGO (Excluir Tudo) */}
            <View style={styles.dangerZone}>
              <TouchableOpacity style={styles.btnDelete} onPress={handleClearAll}>
                <MaterialIcons name="delete-forever" size={24} color="#ef4444" />
                <Text style={styles.btnDeleteText}>Apagar todas as atividades</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  
  // Header Ajustado
  header: { 
      backgroundColor: '#3870d8', padding: 20, paddingBottom: 30, 
      borderBottomLeftRadius: 30, borderBottomRightRadius: 30, 
      alignItems: 'center', marginBottom: 10, elevation: 5 
  },
  headerTopRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      width: '100%', marginBottom: 10
  },
  headerTitle: { color: '#ffffffaa', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  btnAddHeader: {
    backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center'
  },
  labelBalance: { color: '#e2e8f0', fontSize: 12 },
  valueBalance: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  
  // Filtro
  filterBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 20, marginTop: -25,
    backgroundColor: '#fff', borderRadius: 15, padding: 10,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    marginBottom: 10,
  },
  dateSelector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 5 },
  dateText: { color: '#334155', fontWeight: '600', fontSize: 12 },
  dateSeparator: { color: '#94a3b8', fontSize: 12 },
  shortcutContainer: { flexDirection: 'row', gap: 5 },
  shortcutBtn: { backgroundColor: '#3870d8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  shortcutText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  content: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { color: '#334155', fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 5 },
  
  // Gráfico
  chartContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 10, position: 'relative', height: 240 },
  donutHole: { position: 'absolute', width: 100, height: 100, backgroundColor: '#fff', borderRadius: 50, left: (screenWidth / 4) - 44, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  donutLabel: { color: '#64748b', fontSize: 9, fontWeight: 'bold' },
  donutValue: { color: '#3870d8', fontSize: 14, fontWeight: 'bold' },
  emptyContainer: { height: 150, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { color: '#94a3b8' },
  
  // Lista
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  itemInfo: { flex: 1, marginRight: 10 },
  itemTitle: { color: '#334155', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  progressBarBackground: { height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, width: '100%' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  itemValue: { fontSize: 14, fontWeight: 'bold', color: '#ef4444' },
  itemPercent: { fontSize: 11, color: '#94a3b8', textAlign: 'right' },

  // MODAL LATERAL
  modalOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { flex: 1 },
  sideMenu: { width: '85%', backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 20, borderBottomLeftRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#3870d8' },
  helperText: { color: '#64748b', fontSize: 14, marginBottom: 20 },
  
  dangerZone: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 20 },
  btnDelete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10 },
  btnDeleteText: { color: '#ef4444', fontWeight: '600', fontSize: 14 }
});