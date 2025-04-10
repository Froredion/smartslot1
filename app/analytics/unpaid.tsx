import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { format, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react-native';

export default function UnpaidAmount() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Mock data for the graph
  const generateMonthData = (date: Date) => {
    return Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      amount: Math.floor(Math.random() * 500) + 100,
    }));
  };

  // Mock data for top unpaid clients
  const topUnpaidClients = [
    { id: '1', name: 'John Smith', amount: 2500, daysOverdue: 15, asset: 'Luxury Villa' },
    { id: '2', name: 'Sarah Johnson', amount: 1800, daysOverdue: 10, asset: 'Beach House' },
    { id: '3', name: 'Michael Brown', amount: 1500, daysOverdue: 8, asset: 'City Apartment' },
    { id: '4', name: 'Emily Davis', amount: 1200, daysOverdue: 5, asset: 'Mountain Cabin' },
    { id: '5', name: 'David Wilson', amount: 900, daysOverdue: 3, asset: 'Garden Studio' },
  ];

  const monthData = generateMonthData(currentMonth);
  const maxAmount = Math.max(...monthData.map(d => d.amount));

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(current => 
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Unpaid Amount</Text>
        <Text style={styles.subtitle}>
          Track outstanding payments and follow up with clients
        </Text>
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity 
          style={styles.monthButton} 
          onPress={() => navigateMonth('prev')}
        >
          <ChevronLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity 
          style={styles.monthButton} 
          onPress={() => navigateMonth('next')}
        >
          <ChevronRight size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Unpaid</Text>
          <Text style={[styles.statValue, { color: '#FF3B30' }]}>$12,345</Text>
          <Text style={[styles.statChange, { color: '#FF3B30' }]}>
            23 pending payments
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Average Overdue</Text>
          <Text style={[styles.statValue, { color: '#FF3B30' }]}>8 days</Text>
          <Text style={[styles.statChange, { color: '#FF3B30' }]}>
            +2 days from last month
          </Text>
        </View>
      </View>

      <View style={styles.graphContainer}>
        <Text style={styles.graphTitle}>Daily Unpaid Amount</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.graph}
        >
          <View style={styles.bars}>
            {monthData.map((day, index) => (
              <View key={index} style={styles.barGroup}>
                <View 
                  style={[
                    styles.bar,
                    { height: `${(day.amount / maxAmount) * 100}%` }
                  ]} 
                />
                <Text style={styles.barLabel}>{day.day}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.clientsContainer}>
        <Text style={styles.clientsTitle}>Top Unpaid Clients</Text>
        {topUnpaidClients.map((client) => (
          <View key={client.id} style={styles.clientCard}>
            <View style={styles.clientHeader}>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{client.name}</Text>
                <Text style={styles.clientAsset}>{client.asset}</Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Outstanding</Text>
                <Text style={styles.amountValue}>
                  ${client.amount.toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.overdueContainer}>
              <AlertCircle size={16} color="#FF3B30" />
              <Text style={styles.overdueText}>
                {client.daysOverdue} days overdue
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
  },
  graphContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  graph: {
    height: 200,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    paddingRight: 20,
  },
  barGroup: {
    alignItems: 'center',
    marginRight: 8,
  },
  bar: {
    width: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  clientsContainer: {
    padding: 20,
  },
  clientsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  clientCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  clientAsset: {
    fontSize: 14,
    color: '#666',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  overdueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  overdueText: {
    fontSize: 14,
    color: '#FF3B30',
  },
});