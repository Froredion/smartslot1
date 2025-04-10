import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { format, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, AlertCircle, Clock } from 'lucide-react-native';

export default function AgentPayments() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Mock data for the graph
  const generateMonthData = (date: Date) => {
    return Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      amount: Math.floor(Math.random() * 300) + 50,
    }));
  };

  // Mock data for top performing agents
  const topAgents = [
    { id: '1', name: 'Alice Cooper', earnings: 2800, referrals: 12, conversion: 85, unpaid: 950 },
    { id: '2', name: 'Bob Martinez', earnings: 2100, referrals: 9, conversion: 78, unpaid: 780 },
    { id: '3', name: 'Carol White', earnings: 1900, referrals: 8, conversion: 75, unpaid: 650 },
    { id: '4', name: 'David Chen', earnings: 1500, referrals: 7, conversion: 71, unpaid: 420 },
    { id: '5', name: 'Eva Rodriguez', earnings: 1200, referrals: 5, conversion: 80, unpaid: 350 },
  ];

  // Mock data for overdue payments
  const overduePayments = [
    { id: '1', agent: 'Alice Cooper', amount: 950, daysOverdue: 15, bookings: 3 },
    { id: '2', agent: 'Bob Martinez', amount: 780, daysOverdue: 12, bookings: 2 },
    { id: '3', agent: 'Carol White', amount: 650, daysOverdue: 8, bookings: 2 },
    { id: '4', agent: 'David Chen', amount: 420, daysOverdue: 5, bookings: 1 },
    { id: '5', agent: 'Eva Rodriguez', amount: 350, daysOverdue: 3, bookings: 1 },
  ];

  const monthData = generateMonthData(currentMonth);
  const maxAmount = Math.max(...monthData.map(d => d.amount));
  const totalUnpaid = overduePayments.reduce((sum, payment) => sum + payment.amount, 0);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(current => 
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agent Payments</Text>
        <Text style={styles.subtitle}>
          Track referral earnings and manage agent payments
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
          <Text style={styles.statLabel}>Total Paid to Agents</Text>
          <Text style={styles.statValue}>$8,765</Text>
          <Text style={styles.statChange}>15 active agents</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Unpaid</Text>
          <Text style={[styles.statValue, { color: '#FF3B30' }]}>
            ${totalUnpaid.toLocaleString()}
          </Text>
          <Text style={[styles.statChange, { color: '#FF3B30' }]}>
            {overduePayments.length} pending payments
          </Text>
        </View>
      </View>

      <View style={styles.graphContainer}>
        <Text style={styles.graphTitle}>Daily Agent Payments</Text>
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

      <View style={styles.overdueContainer}>
        <View style={styles.sectionHeader}>
          <AlertCircle size={20} color="#FF3B30" />
          <Text style={styles.sectionTitle}>Overdue Payments</Text>
        </View>
        {overduePayments.map((payment) => (
          <View key={payment.id} style={styles.overdueCard}>
            <View style={styles.overdueHeader}>
              <View style={styles.overdueInfo}>
                <Text style={styles.overdueName}>{payment.agent}</Text>
                <Text style={styles.overdueBookings}>
                  {payment.bookings} unpaid booking{payment.bookings !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.overdueAmount}>
                <Text style={styles.overdueValue}>
                  ${payment.amount.toLocaleString()}
                </Text>
                <View style={styles.overdueDays}>
                  <Clock size={12} color="#FF3B30" />
                  <Text style={styles.overdueDaysText}>
                    {payment.daysOverdue} days overdue
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.payButton}>
              <Text style={styles.payButtonText}>Process Payment</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.agentsContainer}>
        <View style={styles.sectionHeader}>
          <Users size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Top Performing Agents</Text>
        </View>
        {topAgents.map((agent, index) => (
          <View key={agent.id} style={styles.agentCard}>
            <View style={styles.agentHeader}>
              <View style={styles.rankContainer}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{agent.name}</Text>
                <Text style={styles.agentStats}>
                  {agent.referrals} referrals • {agent.conversion}% conversion
                </Text>
              </View>
              <View style={styles.earningsContainer}>
                <Text style={styles.earningsLabel}>Earned</Text>
                <Text style={styles.earningsValue}>
                  ${agent.earnings.toLocaleString()}
                </Text>
                {agent.unpaid > 0 && (
                  <Text style={styles.unpaidText}>
                    ${agent.unpaid} unpaid
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${agent.conversion}%` }
                ]} 
              />
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
    color: '#007AFF',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  overdueContainer: {
    padding: 20,
  },
  overdueCard: {
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
  overdueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  overdueInfo: {
    flex: 1,
  },
  overdueName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  overdueBookings: {
    fontSize: 14,
    color: '#666',
  },
  overdueAmount: {
    alignItems: 'flex-end',
  },
  overdueValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 4,
  },
  overdueDays: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overdueDaysText: {
    fontSize: 12,
    color: '#FF3B30',
  },
  payButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  agentsContainer: {
    padding: 20,
  },
  agentCard: {
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
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  agentStats: {
    fontSize: 12,
    color: '#666',
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  unpaidText: {
    fontSize: 12,
    color: '#FF3B30',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});