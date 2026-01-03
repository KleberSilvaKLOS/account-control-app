import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, 
  Modal, TextInput, TouchableWithoutFeedback, Alert, Platform, StatusBar 
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Tipo de Investimento
interface Investment {
  id: string;
  name: string;      // Ex: Bitcoin, Tesouro Selic, CDB
  amount: number;    // Valor investido
  currentValue: number; // Valor atual (para calcular lucro)
  type: 'fixed' | 'variable' | 'crypto';
}

export default function InvestmentsScreen() {
  const [list, setList] = useState<Investment[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalCurrent, setTotalCurrent] = useState(0);

  // Modal e Inputs
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [type, setType] = useState<'fixed' | 'variable' | 'crypto'>('fixed');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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

  // Calcula rendimento
  const getProfit = (item: Investment) => {
    const diff = item.currentValue - item.amount;
    const percent = item.amount > 0 ? (diff / item.amount) * 100 : 0;
    return { diff, percent };
  };

  const renderItem = ({ item }: { item: Investment }) => {
    const { diff, percent } = getProfit(item);
    const isProfit = diff >= 0;

    return (
      <TouchableOpacity style={styles.card} onLongPress={() => handleDelete(item.id)}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBox, { backgroundColor: item.type === 'crypto' ? '#fef3c7' : '#e0e7ff' }]}>
            <FontAwesome5 
              name={item.type === 'crypto' ? 'bitcoin' : (item.type === 'variable' ? 'chart-line' : 'university')} 
              size={20} 
              color={item.type === 'crypto' ? '#d97706' : '#3870d8'} 
            />
          </View>
          <View>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>Investido: {formatCurrency(item.amount)}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.cardValue}>{formatCurrency(item.currentValue)}</Text>
          <Text style={[styles.profitText, { color: isProfit ? '#13ec6d' : '#ef4444' }]}>
            {isProfit ? '+' : ''}{percent.toFixed(1)}% ({isProfit ? '+' : ''}{formatCurrency(diff)})
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const totalYield = totalCurrent - totalInvested;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Investimentos</Text>
        <Text style={styles.labelTotal}>Patrimônio Total</Text>
        <Text style={styles.valueTotal}>{formatCurrency(totalCurrent)}</Text>
        
        <View style={styles.summaryRow}>
          <View style={styles.badge}>
             <Text style={styles.badgeLabel}>Rendimento</Text>
             <Text style={[styles.badgeValue, { color: totalYield >= 0 ? '#13ec6d' : '#ef4444' }]}>
               {totalYield >= 0 ? '+' : ''}{formatCurrency(totalYield)}
             </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btnAdd} onPress={() => setModalVisible(true)}>
          <MaterialIcons name="add" size={28} color="#3870d8" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <FlatList
          data={list}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum investimento cadastrado.</Text>}
        />
      </View>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => setModalVisible(false)}><View style={styles.modalBackdrop}/></TouchableWithoutFeedback>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Novo Aporte</Text>
                
                <Text style={styles.label}>Ativo (Ex: BTC, CDB...)</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} />

                <Text style={styles.label}>Valor Investido (R$)</Text>
                <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />

                <Text style={styles.label}>Valor Atual (R$) - Para calcular lucro</Text>
                <TextInput style={styles.input} value={currentValue} onChangeText={setCurrentValue} keyboardType="numeric" />

                <View style={styles.typeRow}>
                    <TouchableOpacity onPress={() => setType('fixed')} style={[styles.typeBtn, type === 'fixed' && styles.typeBtnActive]}><Text style={[styles.typeText, type === 'fixed' && styles.typeTextActive]}>Renda Fixa</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setType('variable')} style={[styles.typeBtn, type === 'variable' && styles.typeBtnActive]}><Text style={[styles.typeText, type === 'variable' && styles.typeTextActive]}>Variável</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setType('crypto')} style={[styles.typeBtn, type === 'crypto' && styles.typeBtnActive]}><Text style={[styles.typeText, type === 'crypto' && styles.typeTextActive]}>Cripto</Text></TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                    <Text style={styles.btnSaveText}>SALVAR</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { backgroundColor: '#3870d8', padding: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', position: 'relative' },
  headerTitle: { color: '#ffffffaa', fontSize: 12, textTransform: 'uppercase', marginBottom: 10 },
  labelTotal: { color: '#e2e8f0', fontSize: 14 },
  valueTotal: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  summaryRow: { marginTop: 15 },
  badge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  badgeLabel: { color: '#e2e8f0', fontSize: 10 },
  badgeValue: { fontSize: 14, fontWeight: 'bold' },
  btnAdd: { position: 'absolute', top: 20, right: 20, backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 20 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 50 },
  
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  cardSubtitle: { fontSize: 12, color: '#94a3b8' },
  cardRight: { alignItems: 'flex-end' },
  cardValue: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  profitText: { fontSize: 11, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#3870d8', marginBottom: 20 },
  label: { color: '#64748b', marginBottom: 5, fontSize: 12, fontWeight: 'bold' },
  input: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, fontSize: 16, marginBottom: 15 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#3870d8' },
  typeText: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
  typeTextActive: { color: '#fff' },
  btnSave: { backgroundColor: '#3870d8', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' }
});