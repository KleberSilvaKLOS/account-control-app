import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, 
  Modal, TextInput, TouchableWithoutFeedback, Alert, Platform, StatusBar 
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext'; // Importação do tema

interface Investment {
  id: string;
  name: string;      
  amount: number;    
  currentValue: number; 
  type: 'fixed' | 'variable' | 'crypto';
}

export default function InvestmentsScreen() {
  const { isDark } = useTheme(); // Hook do tema
  const [list, setList] = useState<Investment[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalCurrent, setTotalCurrent] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Modal e Inputs
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [type, setType] = useState<'fixed' | 'variable' | 'crypto'>('fixed');

  // Paleta de cores dinâmica
  const theme = {
    background: isDark ? '#0f172a' : '#ffffff',
    header: isDark ? '#1e293b' : '#3870d8',
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#334155',
    subtext: isDark ? '#94a3b8' : '#64748b',
    input: isDark ? '#334155' : '#f1f5f9',
    border: isDark ? '#334155' : '#f1f5f9',
    modal: isDark ? '#1e293b' : '#ffffff',
    typeBtn: isDark ? '#334155' : '#f1f5f9'
  };

  useFocusEffect(
    useCallback(() => {
      const loadSync = async () => {
        const saved = await AsyncStorage.getItem('@myfinance:visibility');
        if (saved !== null) setIsVisible(JSON.parse(saved));
        loadData();
      };
      loadSync();
    }, [])
  );

  const toggleVisibility = async () => {
    const newValue = !isVisible;
    setIsVisible(newValue);
    await AsyncStorage.setItem('@myfinance:visibility', JSON.stringify(newValue));
  };

  useEffect(() => {
    const invested = list.reduce((acc, item) => acc + item.amount, 0);
    const current = list.reduce((acc, item) => acc + item.currentValue, 0);
    setTotalInvested(invested);
    setTotalCurrent(current);
  }, [list]);

  async function loadData() {
    try {
      const json = await AsyncStorage.getItem('@myfinance:investments');
      if (json) setList(JSON.parse(json));
    } catch (e) { console.log(e); }
  }

  async function saveData(newList: Investment[]) {
    try {
      await AsyncStorage.setItem('@myfinance:investments', JSON.stringify(newList));
      setList(newList);
    } catch (e) { console.log(e); }
  }

  const handleSave = () => {
    if (!name || !amount || !currentValue) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    const numAmount = parseFloat(amount.replace(',', '.'));
    const numCurrent = parseFloat(currentValue.replace(',', '.'));
    const newInv: Investment = {
      id: String(new Date().getTime()),
      name,
      amount: numAmount,
      currentValue: numCurrent,
      type
    };
    const newList = [newInv, ...list];
    saveData(newList);
    setName(''); setAmount(''); setCurrentValue(''); setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Excluir", "Remover este investimento?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => {
          const newList = list.filter(i => i.id !== id);
          saveData(newList);
      }}
    ]);
  };

  const formatCurrency = (val: number) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const renderValue = (val: number) => isVisible ? formatCurrency(val) : '••••••';

  const getProfit = (item: Investment) => {
    const diff = item.currentValue - item.amount;
    const percent = item.amount > 0 ? (diff / item.amount) * 100 : 0;
    return { diff, percent };
  };

  const renderItem = ({ item }: { item: Investment }) => {
    const { diff, percent } = getProfit(item);
    const isProfit = diff >= 0;

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} 
        onLongPress={() => handleDelete(item.id)}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.iconBox, { backgroundColor: item.type === 'crypto' ? (isDark ? '#451a03' : '#fef3c7') : (isDark ? '#1e1b4b' : '#e0e7ff') }]}>
            <FontAwesome5 
              name={item.type === 'crypto' ? 'bitcoin' : (item.type === 'variable' ? 'chart-line' : 'university')} 
              size={20} 
              color={item.type === 'crypto' ? '#f59e0b' : '#3870d8'} 
            />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>Investido: {renderValue(item.amount)}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={[styles.cardValue, { color: theme.text }]}>{renderValue(item.currentValue)}</Text>
          <Text style={[styles.profitText, { color: isProfit ? '#13ec6d' : '#ef4444' }]}>
            {isVisible ? `${isProfit ? '+' : ''}${percent.toFixed(1)}%` : '••%'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const totalYield = totalCurrent - totalInvested;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.header} />
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <Text style={styles.headerTitle}>Meus Investimentos</Text>
        <Text style={styles.labelTotal}>Patrimônio Total</Text>
        <Text style={styles.valueTotal}>{renderValue(totalCurrent)}</Text>
        
        <View style={styles.summaryRow}>
          <View style={styles.badge}>
             <Text style={styles.badgeLabel}>Rendimento</Text>
             <Text style={[styles.badgeValue, { color: totalYield >= 0 ? '#13ec6d' : '#ef4444' }]}>
               {totalYield >= 0 ? '+' : ''}{renderValue(totalYield)}
             </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity onPress={toggleVisibility} style={styles.eyeBtn}>
            <Ionicons name={isVisible ? "eye" : "eye-off"} size={24} color="#ffffffaa" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAdd} onPress={() => setModalVisible(true)}>
            <MaterialIcons name="add" size={28} color={theme.header} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <FlatList
          data={list}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.subtext }]}>Nenhum investimento cadastrado.</Text>}
        />
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => setModalVisible(false)}><View style={styles.modalBackdrop}/></TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: theme.modal }]}>
                <Text style={[styles.modalTitle, { color: '#3870d8' }]}>Novo Aporte</Text>
                <Text style={[styles.label, { color: theme.subtext }]}>Ativo (Ex: BTC, CDB...)</Text>
                <TextInput style={[styles.input, { backgroundColor: theme.input, color: theme.text }]} value={name} onChangeText={setName} />
                <Text style={[styles.label, { color: theme.subtext }]}>Valor Investido (R$)</Text>
                <TextInput style={[styles.input, { backgroundColor: theme.input, color: theme.text }]} value={amount} onChangeText={setAmount} keyboardType="numeric" />
                <Text style={[styles.label, { color: theme.subtext }]}>Valor Atual (R$)</Text>
                <TextInput style={[styles.input, { backgroundColor: theme.input, color: theme.text }]} value={currentValue} onChangeText={setCurrentValue} keyboardType="numeric" />
                
                <View style={styles.typeRow}>
                    <TouchableOpacity onPress={() => setType('fixed')} style={[styles.typeBtn, { backgroundColor: theme.typeBtn }, type === 'fixed' && styles.typeBtnActive]}><Text style={[styles.typeText, type === 'fixed' && styles.typeTextActive]}>Fixa</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setType('variable')} style={[styles.typeBtn, { backgroundColor: theme.typeBtn }, type === 'variable' && styles.typeBtnActive]}><Text style={[styles.typeText, type === 'variable' && styles.typeTextActive]}>Variável</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setType('crypto')} style={[styles.typeBtn, { backgroundColor: theme.typeBtn }, type === 'crypto' && styles.typeBtnActive]}><Text style={[styles.typeText, type === 'crypto' && styles.typeTextActive]}>Cripto</Text></TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.btnSave} onPress={handleSave}><Text style={styles.btnSaveText}>SALVAR</Text></TouchableOpacity>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { padding: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', position: 'relative' },
  headerTitle: { color: '#ffffffaa', fontSize: 12, textTransform: 'uppercase', marginBottom: 10 },
  labelTotal: { color: '#e2e8f0', fontSize: 14 },
  valueTotal: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  summaryRow: { marginTop: 15 },
  badge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  badgeLabel: { color: '#e2e8f0', fontSize: 10 },
  badgeValue: { fontSize: 14, fontWeight: 'bold' },
  headerRightActions: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 15 },
  eyeBtn: { padding: 5 },
  btnAdd: { backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 20 },
  emptyText: { textAlign: 'center', marginTop: 50 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 12, elevation: 2, borderWidth: 1 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 12 },
  cardRight: { alignItems: 'flex-end' },
  cardValue: { fontSize: 16, fontWeight: 'bold' },
  profitText: { fontSize: 11, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  modalContent: { borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { marginBottom: 5, fontSize: 12, fontWeight: 'bold' },
  input: { padding: 12, borderRadius: 10, fontSize: 16, marginBottom: 15 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#3870d8' },
  typeText: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
  typeTextActive: { color: '#fff' },
  btnSave: { backgroundColor: '#3870d8', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' }
});