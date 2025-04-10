import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { format, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react-native';

export default function TotalEarned() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Mock data for the graph
  const generateMonthData = (date: Date) => {
    return Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      amount: Math.floor(Math.random() * 1000) + 100,
    }));
  };

  // Mock data for top earners
  const topEarners = [
    { id: '1', name: 'Luxury Villa', earnings: 12500, bookings: 5 },
    { id: '2', name: 'Beach House', earnings: 8900, bookings: 4 },
    { id: '3', name: 'Mountain Cabin', earnings: 7500, bookings: 3 },
    { id: '4', name: 'City Apartment', earnings: 6200, bookings: 6 },
    { id: '5', name: 'Garden Studio', earnings: 4800, bookings: 4 },
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
        <Text style={styles.title}>Total Earnings</Text>
        <Text style={styles.subtitle}>
          Track your revenue and top performing assets
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
          <Text style={styles.statLabel}>Monthly Revenue</Text>
          <Text style={styles.statValue}>$45,678</Text>
          <Text style={styles.statChange}>+12.5% from last month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Bookings</Text>
          <Text style={styles.statValue}>89</Text>
          <Text style={styles.statChange}>+8.3% from last month</Text>
        </View>
      </View>

      <View style={styles.graphContainer}>
        <Text style={styles.graphTitle}>Daily Revenue</Text>
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

      <View style={styles.topEarnersContainer}>
        <Text style={styles.topEarnersTitle}>Top Earning Assets</Text>
        {topEarners.map((asset, index) => (
          <View key={asset.id} style={styles.earnerCard}>
            <View style={styles.earnerRank}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            </View>
            <View style={styles.earnerInfo}>
              <Text style={styles.earnerName}>{asset.name}</Text>
              <Text style={styles.earnerBookings}>
                {asset.bookings} bookings this month
              </Text>
            </View>
            <View style={styles.earnerEarnings}>
              <Text style={styles.earningAmount}>
                ${asset.earnings.toLocaleString()}
              </Text>
              <TrendingUp size={16} color="#34C759" />
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
    color: '#34C759',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    color: '#34C759',
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
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  topEarnersContainer: {
    padding: 20,
  },
  topEarnersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  earnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  earnerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5F9E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  earnerInfo: {
    flex: 1,
  },
  earnerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  earnerBookings: {
    fontSize: 12,
    color: '#666',
  },
  earnerEarnings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
});