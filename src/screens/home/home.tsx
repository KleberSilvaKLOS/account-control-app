import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  Dimensions, StatusBar, Platform 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';

// --- CORES E DIMENSÕES ---
const screenWidth = Dimensions.get('window').width;
const CHART_COLORS = ['#3870d8', '#13ec6d', '#ef4444', '#f59e0b', '#8b5cf6'];

// --- INTERFACES SIMPLIFICADAS ---
interface Transaction {
  id: string;
  value: number;
  type: 'income' | 'expense';
  date: string; // formato dd/mm/aaaa
  description: string;
}

interface FixedBill {
  id: string;
  title: string;
  value: number;
  dueDay: number;
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  // --- ESTADOS ---
  const [balance, setBalance] = useState(0);
  const [monthExpense, setMonthExpense] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Estados de Contas Fixas
  const [fixedTotal, setFixedTotal] = useState(0);
  const [nextBill, setNextBill] = useState<FixedBill | null>(null);

  // Carrega dados toda vez que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  async function loadDashboardData() {
    try {
      // 1. CARREGAR TRANSAÇÕES (Para Saldo e Gráfico)
      const transJson = await AsyncStorage.getItem('@myfinance:transactions');
      const transactions: Transaction[] = transJson ? JSON.parse(transJson) : [];
      
      calculateBalanceAndChart(transactions);

      // 2. CARREGAR CONTAS FIXAS (Para o Widget inferior)
      const billsJson = await AsyncStorage.getItem('@myfinance:fixed_bills');
      const bills: FixedBill[] = billsJson ? JSON.parse(billsJson) : [];
      
      calculateFixedBills(bills);

    } catch (e) {
      console.log('Erro ao carregar home', e);
    }
  }

  // --- LÓGICA DE SALDO E GRÁFICO ---
  function calculateBalanceAndChart(list: Transaction[]) {
    let totalBal = 0;
    let currentMonthExpense = 0;
    const expensesMap: {[key: string]: number} = {};

    const now = new Date();
    const currentMonth = now.getMonth(); 
    const currentYear = now.getFullYear();

    list.forEach(item => {
      const val = Number(item.value);
      
      // Cálculo do Saldo Total (Geral)
      if (item.type === 'income') totalBal += val;
      else totalBal -= val;

      // Filtrar gastos DESTE MÊS para o gráfico
      const [day, month, year] = item.date.split('/').map(Number);
      if (item.type === 'expense' && (month - 1) === currentMonth && year === currentYear) {
        currentMonthExpense += val;
        
        // Agrupar categorias para o gráfico
        if (expensesMap[item.description]) expensesMap[item.description] += val;
        else expensesMap[item.description] = val;
      }
    });

    setBalance(totalBal);
    setMonthExpense(currentMonthExpense);

    // Preparar dados do gráfico (Top 3 + Outros)
    const sorted = Object.keys(expensesMap)
      .map(key => ({ name: key, value: expensesMap[key] }))
      .sort((a, b) => b.value - a.value);

    const top3 = sorted.slice(0, 3);
    const others = sorted.slice(3).reduce((sum, item) => sum + item.value, 0);

    const data = top3.map((item, index) => ({
      name: item.name,
      value: item.value,
      color: CHART_COLORS[index],
      legendFontColor: '#64748b',
      legendFontSize: 12
    }));

    if (others > 0) {
      data.push({
        name: 'Outros', value: others, color: '#94a3b8', legendFontColor: '#64748b', legendFontSize: 12
      });
    }

    setChartData(data);
  }

  // --- LÓGICA DE CONTAS FIXAS ---
  function calculateFixedBills(bills: FixedBill[]) {
    // Total Previsto
    const total = bills.reduce((acc, b) => acc + b.value, 0);
    setFixedTotal(total);

    // Encontrar Vencimento Próximo
    const todayDay = new Date().getDate();
    // Ordena por dia. Filtra apenas os que ainda não venceram este mês (dia >= hoje)
    // Se não tiver nenhum este mês, pega o primeiro do mês que vem (menor dia da lista)
    const upcoming = bills.filter(b => b.dueDay >= todayDay).sort((a, b) => a.dueDay - b.dueDay);
    
    if (upcoming.length > 0) {
      setNextBill(upcoming[0]);
    } else if (bills.length > 0) {
      // Se todos do mês já passaram, mostra o primeiro do mês que vem
      const nextMonth = [...bills].sort((a, b) => a.dueDay - b.dueDay);
      setNextBill(nextMonth[0]);
    } else {
      setNextBill(null);
    }
  }

  const formatCurrency = (val: number) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        
        {/* --- 1. HEADER (SALDO) --- */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, Kleber</Text>
          <Text style={styles.labelBalance}>Saldo Disponível</Text>
          <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
        </View>

        {/* --- 2. BOTÕES DE AÇÃO RÁPIDA --- */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Gastos')}>
            <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
              <MaterialIcons name="add" size={24} color="#13ec6d" />
            </View>
            <Text style={styles.actionText}>Nova Receita</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Gastos')}>
            <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
              <MaterialIcons name="remove" size={24} color="#ef4444" />
            </View>
            <Text style={styles.actionText}>Nova Despesa</Text>
          </TouchableOpacity>
        </View>

        {/* --- 3. GRÁFICO (Gastos do Mês) --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gastos do Mês</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Resumo')}>
              <Text style={styles.seeMore}>Ver detalhes</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {chartData.length > 0 ? (
              <View style={styles.chartRow}>
                <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                  <PieChart
                    data={chartData}
                    width={160}
                    height={160}
                    chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
                    accessor={"value"}
                    backgroundColor={"transparent"}
                    paddingLeft={"40"} // Ajuste para centralizar o donut visualmente
                    center={[0, 0]}
                    absolute={false}
                    hasLegend={false}
                  />
                  {/* Donut Hole */}
                  <View style={styles.donutHole}>
                     <Text style={styles.donutText}>Total</Text>
                  </View>
                </View>
                
                {/* Legenda Customizada Lateral */}
                <View style={styles.legendContainer}>
                  {chartData.map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                      <Text style={styles.legendText} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.legendValue}>{Math.round((item.value / monthExpense) * 100)}%</Text>
                    </View>
                  ))}
                  <View style={styles.divider} />
                  <Text style={styles.totalExpenseLabel}>Total gasto:</Text>
                  <Text style={styles.totalExpenseValue}>{formatCurrency(monthExpense)}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Sem gastos este mês.</Text>
              </View>
            )}
          </View>
        </View>

        {/* --- 4. WIDGET CONTAS FIXAS --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Contas Fixas</Text>
          
          <TouchableOpacity style={styles.cardDark} onPress={() => navigation.navigate('Fixas')}>
            <View style={styles.fixedHeader}>
              <View style={styles.iconBox}>
                <MaterialIcons name="receipt-long" size={24} color="#ef4444" />
              </View>
              <View>
                <Text style={styles.fixedLabel}>Total Previsto</Text>
                <Text style={styles.fixedValue}>{formatCurrency(fixedTotal)}</Text>
              </View>
            </View>

            <View style={styles.fixedDivider} />

            {nextBill ? (
              <View style={styles.nextBillRow}>
                <View>
                  <Text style={styles.nextBillLabel}>VENCIMENTO PRÓXIMO</Text>
                  <Text style={styles.nextBillTitle}>{nextBill.title}</Text>
                </View>
                <View style={styles.dateBadge}>
                   <Text style={styles.dateBadgeText}>Dia {nextBill.dueDay}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.nextBillLabel}>Nenhuma conta próxima.</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Fundo levemente cinza para destacar os cards brancos
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  
  // HEADER
  header: {
    backgroundColor: '#3870d8',
    padding: 25,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: { color: '#ffffffaa', fontSize: 14, marginBottom: 5 },
  labelBalance: { color: '#fff', fontSize: 16, fontWeight: '600' },
  balanceValue: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginTop: 5 },

  // AÇÕES RÁPIDAS
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -25, // Sobrepor o header
  },
  actionBtn: {
    backgroundColor: '#fff',
    flex: 0.48,
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  iconCircle: { width: 35, height: 35, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontWeight: 'bold', color: '#334155', fontSize: 13 },

  // SEÇÕES GERAIS
  sectionContainer: { marginTop: 25, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  seeMore: { color: '#13ec6d', fontWeight: 'bold', fontSize: 14 },

  // CARD GRÁFICO
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  chartRow: { flexDirection: 'row', alignItems: 'center' },
  donutHole: { 
    position: 'absolute', width: 70, height: 70, borderRadius: 35, 
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', left: 45 // Ajuste visual
  },
  donutText: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  
  legendContainer: { flex: 1, marginLeft: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' },
  legendColor: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { flex: 1, color: '#64748b', fontSize: 12 },
  legendValue: { fontWeight: 'bold', color: '#334155', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
  totalExpenseLabel: { color: '#94a3b8', fontSize: 12 },
  totalExpenseValue: { color: '#334155', fontWeight: 'bold', fontSize: 16 },
  
  emptyState: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#94a3b8' },

  // CARD ESCURO (Fixas) - Inspirado na imagem, mas adaptado para não ficar 100% preto
  cardDark: {
    backgroundColor: '#1e293b', // Azul quase preto
    borderRadius: 20,
    padding: 20,
    marginBottom: 20
  },
  fixedHeader: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: { width: 45, height: 45, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.15)', justifyContent: 'center', alignItems: 'center' },
  fixedLabel: { color: '#94a3b8', fontSize: 12 },
  fixedValue: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  fixedDivider: { height: 1, backgroundColor: '#334155', marginVertical: 15 },
  
  nextBillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextBillLabel: { color: '#ef4444', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  nextBillTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  dateBadge: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  dateBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});