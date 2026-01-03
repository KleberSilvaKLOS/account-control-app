import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, Dimensions, Platform, StatusBar, 
  TouchableOpacity, Modal, TouchableWithoutFeedback, Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'; 
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext'; // Importação do tema

const screenWidth = Dimensions.get('window').width;
const CHART_COLORS = ['#3870d8', '#13ec6d', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

interface Transaction {
  id: string;
  description: string;
  value: number; 
  type: 'income' | 'expense';
  date: string;
  time: string;
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
  const { isDark } = useTheme(); // Hook do tema
  const [balance, setBalance] = useState<number>(0);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [expensesList, setExpensesList] = useState<ExpenseGroup[]>([]); 
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState(true);

  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); 
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');

  // Paleta de cores dinâmica
  const theme = {
    background: isDark ? '#0f172a' : '#ffffff',
    header: isDark ? '#1e293b' : '#3870d8',
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#334155',
    subtext: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#f1f5f9',
    filterBg: isDark ? '#1e293b' : '#ffffff',
    dateBtn: isDark ? '#334155' : '#f1f5f9'
  };

  useFocusEffect(
    useCallback(() => {
      const loadSyncData = async () => {
        const saved = await AsyncStorage.getItem('@myfinance:visibility');
        if (saved !== null) setIsVisible(JSON.parse(saved));
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
    applyDateFilter();
  }, [startDate, endDate, allTransactions, isDark]); // Adicionado isDark para atualizar o gráfico

  async function loadData() {
    try {
      const jsonValue = await AsyncStorage.getItem('@myfinance:transactions');
      const list: Transaction[] = jsonValue != null ? JSON.parse(jsonValue) : [];
      setAllTransactions(list);
    } catch (e) { console.log(e); }
  }

  const parseDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  function applyDateFilter() {
    if (allTransactions.length === 0) {
        setBalance(0); setTotalExpense(0); setChartData([]); setExpensesList([]);
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
    let incomeTotal = 0, expenseTotal = 0;
    const expensesMap: { [key: string]: number } = {};
    list.forEach(item => {
      const val = Number(item.value);
      if (item.type === 'income') incomeTotal += val;
      else {
        expenseTotal += val;
        expensesMap[item.description] = (expensesMap[item.description] || 0) + val;
      }
    });
    setBalance(incomeTotal - expenseTotal);
    setTotalExpense(expenseTotal);
    const sortedExpenses: ExpenseGroup[] = Object.keys(expensesMap)
      .map(key => ({ rawName: key, value: expensesMap[key] }))
      .sort((a, b) => b.value - a.value);
    setExpensesList(sortedExpenses);
    const top5 = sortedExpenses.slice(0, 5);
    const top5Total = top5.reduce((sum, item) => sum + item.value, 0);
    const othersValue = expenseTotal - top5Total;
    
    let chartConfigData: ChartData[] = top5.map((item, index) => ({
      name: item.rawName, 
      value: item.value, 
      color: CHART_COLORS[index % CHART_COLORS.length], 
      legendFontColor: theme.subtext, 
      legendFontSize: 12
    }));

    if (othersValue > 0) {
      chartConfigData.push({ name: 'Outros', value: othersValue, color: '#94a3b8', legendFontColor: theme.subtext, legendFontSize: 12 });
    }
    setChartData(chartConfigData);
  }

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) pickerMode === 'start' ? setStartDate(selectedDate) : setEndDate(selectedDate);
  };

  const formatCurrency = (val: number) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const renderValue = (val: number) => isVisible ? formatCurrency(val) : '••••••';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.header} />
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Resumo Financeiro</Text>
            <View style={styles.headerRightActions}>
              <TouchableOpacity onPress={toggleVisibility} style={styles.btnEyeHeader}>
                 <Ionicons name={isVisible ? "eye" : "eye-off"} size={24} color="#ffffffcc" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnAddHeader} onPress={() => setModalVisible(true)}>
                  <MaterialIcons name="settings" size={24} color={theme.header} />
              </TouchableOpacity>
            </View>
        </View>
        <Text style={styles.labelBalance}>Saldo no Período</Text>
        <Text style={styles.valueBalance}>{renderValue(balance)}</Text>
      </View>

      <View style={[styles.filterBar, { backgroundColor: theme.filterBg }]}>
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={() => {setPickerMode('start'); setShowPicker(true);}} style={[styles.dateBtn, {backgroundColor: theme.dateBtn}]}>
            <MaterialIcons name="event" size={18} color="#3870d8" />
            <Text style={[styles.dateText, {color: theme.text}]}>{startDate.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</Text>
          </TouchableOpacity>
          <Text style={[styles.dateSeparator, {color: theme.subtext}]}>até</Text>
          <TouchableOpacity onPress={() => {setPickerMode('end'); setShowPicker(true);}} style={[styles.dateBtn, {backgroundColor: theme.dateBtn}]}>
            <MaterialIcons name="event" size={18} color="#3870d8" />
            <Text style={[styles.dateText, {color: theme.text}]}>{endDate.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          onPress={() => {const now=new Date(); setStartDate(new Date(now.getFullYear(), now.getMonth(), 1)); setEndDate(now);}} 
          style={styles.shortcutBtn}
        >
          <Text style={styles.shortcutText}>Mês</Text>
        </TouchableOpacity>
      </View>

      {showPicker && <DateTimePicker value={pickerMode==='start'?startDate:endDate} mode="date" display="default" onChange={onChangeDate} maximumDate={new Date()}/>}

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>Gastos do Período</Text>
        {chartData.length > 0 ? (
          <View style={styles.chartContainer}>
            <PieChart 
              data={chartData} 
              width={screenWidth - 40} 
              height={220} 
              chartConfig={{ color: (o=1)=>`rgba(255,255,255,${o})` }} 
              accessor={"value"} 
              backgroundColor={"transparent"} 
              paddingLeft={"15"} 
              hasLegend={true} 
            />
            <View style={[styles.donutHole, {backgroundColor: theme.background}]}>
              <Text style={styles.donutLabel}>TOTAL</Text>
              <Text style={styles.donutValue}>{isVisible ? (totalExpense < 10000 ? formatCurrency(totalExpense) : `R$ ${(totalExpense/1000).toFixed(1)}k`) : '••••'}</Text>
            </View>
          </View>
        ) : <View style={[styles.emptyContainer, {backgroundColor: theme.card, borderColor: theme.border}]}>
              <Text style={{color: theme.subtext}}>Sem dados para este período.</Text>
            </View>}

        <Text style={[styles.sectionTitle, {color: theme.text}]}>Ranking Detalhado</Text>
        <FlatList 
          data={expensesList} 
          keyExtractor={(i)=>i.rawName} 
          renderItem={({item, index})=>(
            <View style={[styles.itemCard, {backgroundColor: theme.card, borderColor: theme.border}]}>
              <View style={[styles.rankBadge, {backgroundColor: index<5?CHART_COLORS[index]:'#94a3b8'}]}>
                <Text style={styles.rankText}>{index+1}º</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, {color: theme.text}]}>{item.rawName}</Text>
                <View style={[styles.progressBarBackground, {backgroundColor: theme.border}]}>
                  <View style={[styles.progressBarFill, {width: `${(item.value/totalExpense)*100}%`, backgroundColor: index<5?CHART_COLORS[index]:'#94a3b8'}]}/>
                </View>
              </View>
              <View style={{alignItems:'flex-end'}}>
                <Text style={styles.itemValue}>- {renderValue(item.value)}</Text>
                <Text style={styles.itemPercent}>{isVisible ? ((item.value/totalExpense)*100).toFixed(1)+'%' : '••%'}</Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* Modal de Opções */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={()=>setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={()=>setModalVisible(false)}><View style={styles.modalBackdrop}/></TouchableWithoutFeedback>
          <View style={[styles.sideMenu, {backgroundColor: theme.card}]}>
            <View style={[styles.modalHeader, {borderBottomColor: theme.border}]}>
              <Text style={[styles.modalTitle, {color: theme.text}]}>Opções</Text>
              <TouchableOpacity onPress={()=>setModalVisible(false)}><MaterialIcons name="close" size={24} color={theme.text}/></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.btnDelete} onPress={() => { Alert.alert("Aviso", "Deseja apagar tudo?", [{text:"Não"},{text:"Sim", onPress:() => {AsyncStorage.removeItem('@myfinance:transactions'); setAllTransactions([]); setModalVisible(false);}}])}}>
              <MaterialIcons name="delete-forever" size={24} color="#ef4444"/>
              <Text style={styles.btnDeleteText}>Apagar todos os dados</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { padding: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', marginBottom: 10, elevation: 5 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnEyeHeader: { padding: 5 },
  btnAddHeader: { backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#ffffffaa', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  labelBalance: { color: '#e2e8f0', fontSize: 12 },
  valueBalance: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: -25, borderRadius: 15, padding: 10, elevation: 4, marginBottom: 10 },
  dateSelector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 5 },
  dateText: { fontWeight: '600', fontSize: 12 },
  dateSeparator: { fontSize: 12 },
  shortcutBtn: { backgroundColor: '#3870d8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  shortcutText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 5 },
  chartContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 10, position: 'relative', height: 220 },
  donutHole: { position: 'absolute', width: 90, height: 90, borderRadius: 45, left: (screenWidth/2) - 138, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  donutLabel: { color: '#64748b', fontSize: 9, fontWeight: 'bold' },
  donutValue: { color: '#3870d8', fontSize: 13, fontWeight: 'bold' },
  emptyContainer: { height: 100, justifyContent: 'center', alignItems: 'center', borderRadius: 15, marginBottom: 20, borderWidth: 1 },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, elevation: 1 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  itemInfo: { flex: 1, marginRight: 10 },
  itemTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  progressBarBackground: { height: 4, borderRadius: 2, width: '100%' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  itemValue: { fontSize: 14, fontWeight: 'bold', color: '#ef4444' },
  itemPercent: { fontSize: 11, color: '#94a3b8', textAlign: 'right' },
  modalOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { flex: 1 },
  sideMenu: { width: '80%', padding: 25, borderTopLeftRadius: 20, borderBottomLeftRadius: 20, elevation: 10, marginLeft:'auto' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderBottomWidth: 1, paddingBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  btnDelete: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  btnDeleteText: { color: '#ef4444', fontWeight: '600', fontSize: 14 }
});