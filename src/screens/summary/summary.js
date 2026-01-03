import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Dimensions, Platform, StatusBar, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { MaterialIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const CHART_COLORS = ['#3870d8', '#13ec6d', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function SummaryScreen() {
  const [balance, setBalance] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [expensesList, setExpensesList] = useState([]); 
  
  // Estado para armazenar TODOS os dados (sem filtro)
  const [allTransactions, setAllTransactions] = useState([]);

  // Estados de Filtro de Data
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); // 1º dia do mês
  const [endDate, setEndDate] = useState(new Date()); // Hoje
  
  // Controle do Picker (Calendário)
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('start'); // 'start' ou 'end'

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Sempre que as datas ou os dados mudarem, reaplica o filtro
  useEffect(() => {
    applyDateFilter();
  }, [startDate, endDate, allTransactions]);

  async function loadData() {
    try {
      const jsonValue = await AsyncStorage.getItem('@myfinance:transactions');
      const list = jsonValue != null ? JSON.parse(jsonValue) : [];
      setAllTransactions(list); // Salva os dados brutos
    } catch (e) {
      console.log(e);
    }
  }

  // Função auxiliar para converter "DD/MM/AAAA" em objeto Date do JS
  const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
  };

  function applyDateFilter() {
    if (allTransactions.length === 0) return;

    // Filtra a lista baseada no intervalo
    const filteredList = allTransactions.filter(item => {
      const itemDate = parseDate(item.date);
      // Ajusta as horas para comparar apenas as datas (00:00:00 até 23:59:59)
      const start = new Date(startDate); start.setHours(0,0,0,0);
      const end = new Date(endDate); end.setHours(23,59,59,999);
      
      return itemDate >= start && itemDate <= end;
    });

    processData(filteredList);
  }

  function processData(list) {
    let incomeTotal = 0;
    let expenseTotal = 0;
    const expensesMap = {};

    list.forEach(item => {
      const val = parseFloat(item.value);
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

    const sortedExpenses = Object.keys(expensesMap)
      .map(key => ({ rawName: key, value: expensesMap[key] }))
      .sort((a, b) => b.value - a.value);

    setExpensesList(sortedExpenses);

    // Gráfico
    const top5 = sortedExpenses.slice(0, 5);
    const top5Total = top5.reduce((sum, item) => sum + item.value, 0);
    const othersValue = expenseTotal - top5Total;

    let chartConfigData = top5.map((item, index) => ({
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

  // Funções para manipular o DatePicker
  const onChangeDate = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      if (pickerMode === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const showDatepicker = (mode) => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  // Botões de Atalho Rápido
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

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatCurrency = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <SafeAreaView style={styles.container}>
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resumo Financeiro</Text>
        <Text style={styles.labelBalance}>Saldo no Período</Text>
        <Text style={styles.valueBalance}>{formatCurrency(balance)}</Text>
      </View>

      {/* --- BARRA DE FILTRO SUTIL --- */}
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

      {/* Date Picker Component (Invisível até ser chamado) */}
      {showPicker && (
        <DateTimePicker
          value={pickerMode === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()} // Não deixa selecionar futuro
        />
      )}

      <View style={styles.content}>
        
        {/* --- GRÁFICO --- */}
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

        {/* --- LISTA --- */}
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
                <Text style={styles.itemPercent}>{((item.value / totalExpense) * 100).toFixed(1)}%</Text>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { backgroundColor: '#3870d8', padding: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', marginBottom: 10, elevation: 5 },
  headerTitle: { color: '#ffffffaa', fontSize: 14, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  labelBalance: { color: '#e2e8f0', fontSize: 12 },
  valueBalance: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  
  // --- ESTILOS DO FILTRO ---
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: -25, // Sobe para ficar sobre o header azul
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
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
  
  // Gráfico e Lista (Mantidos iguais)
  chartContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 10, position: 'relative', height: 240 },
  donutHole: { position: 'absolute', width: 100, height: 100, backgroundColor: '#fff', borderRadius: 50, left: (screenWidth / 4) - 44, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  donutLabel: { color: '#64748b', fontSize: 9, fontWeight: 'bold' },
  donutValue: { color: '#3870d8', fontSize: 14, fontWeight: 'bold' },
  emptyContainer: { height: 150, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { color: '#94a3b8' },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  itemInfo: { flex: 1, marginRight: 10 },
  itemTitle: { color: '#334155', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  progressBarBackground: { height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, width: '100%' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  itemValue: { fontSize: 14, fontWeight: 'bold', color: '#ef4444' },
  itemPercent: { fontSize: 11, color: '#94a3b8', textAlign: 'right' }
});