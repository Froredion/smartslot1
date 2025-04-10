import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, TrendingUp, AlertCircle, DollarSign } from 'lucide-react-native';
import { format, subMonths } from 'date-fns';

export default function Analytics() {
  const insets = useSafeAreaInsets();

  // Mock data for the graph
  const generateMockData = () => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), i);
      return {
        month: format(date, 'MMM'),
        earned: Math.floor(Math.random() * 10000) + 5000,
        unpaid: Math.floor(Math.random() * 3000) + 1000,
        agentPayments: Math.floor(Math.random() * 2000) + 500,
      };
    }).reverse();

    return months;
  };

  const data = generateMockData();
  const maxValue = Math.max(...data.map(d => Math.max(d.earned, d.unpaid, d.agentPayments)));

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics Overview</Text>
      </View>

      <View style={styles.graphContainer}>
        <Text style={styles.graphTitle}>Monthly Overview</Text>
        <View style={styles.graph}>
          <View style={styles.bars}>
            {data.map((month, index) => (
              <View key={index} style={styles.barGroup}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      styles.earnedBar,
                      { height: `${(month.earned / maxValue) * 100}%` }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.bar, 
                      styles.unpaidBar,
                      { height: `${(month.unpaid / maxValue) * 100}%` }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.bar, 
                      styles.agentBar,
                      { height: `${(month.agentPayments / maxValue) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.monthLabel}>{month.month}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.earnedBar]} />
            <Text style={styles.legendText}>Earned</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.unpaidBar]} />
            <Text style={styles.legendText}>Unpaid</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.agentBar]} />
            <Text style={styles.legendText}>Agent Payments</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <TouchableOpacity 
          style={styles.metricCard}
          onPress={() => router.push('/analytics/total-earned')}
        >
          <View style={styles.metricHeader}>
            <TrendingUp size={24} color="#007AFF" />
            <Text style={styles.metricTitle}>Total Earned</Text>
          </View>
          <Text style={styles.metricValue}>USD 45,678</Text>
          <Text style={styles.metricChange}>+12.5% from last month</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.metricCard}
          onPress={() => router.push('/analytics/unpaid')}
        >
          <View style={styles.metricHeader}>
            <AlertCircle size={24} color="#FF3B30" />
            <Text style={styles.metricTitle}>Unpaid Amount</Text>
          </View>
          <Text style={[styles.metricValue, { color: '#FF3B30' }]}>USD 12,345</Text>
          <Text style={styles.metricChange}>23 pending payments</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.metricCard}
          onPress={() => router.push('/analytics/agent-payments')}
        >
          <View style={styles.metricHeader}>
            <DollarSign size={24} color="#34C759" />
            <Text style={styles.metricTitle}>Agent Payments</Text>
          </View>
          <Text style={[styles.metricValue, { color: '#34C759' }]}>USD 8,765</Text>
          <Text style={styles.metricChange}>15 agents this month</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    marginBottom: 20,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    width: 30,
  },
  bar: {
    width: 8,
    marginHorizontal: 1,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  earnedBar: {
    backgroundColor: '#007AFF',
  },
  unpaidBar: {
    backgroundColor: '#FF3B30',
  },
  agentBar: {
    backgroundColor: '#34C759',
  },
  monthLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  metricsContainer: {
    padding: 20,
    gap: 16,
  },
  metricCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 14,
    color: '#666',
  },
});