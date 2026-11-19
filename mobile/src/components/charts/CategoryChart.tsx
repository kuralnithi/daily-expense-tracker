import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { CategorySummary } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

interface CategoryChartProps {
  data: CategorySummary[];
}

const screenWidth = Dimensions.get('window').width;

export default function CategoryChart({ data }: CategoryChartProps) {
  const chartData = data.slice(0, 6).map((item) => ({
    name: item.category_name.length > 10
      ? item.category_name.substring(0, 10) + '...'
      : item.category_name,
    amount: Number(item.total),
    color: item.category_color,
    legendFontColor: COLORS.text,
    legendFontSize: 12,
  }));

  if (chartData.length === 0) {
    chartData.push({
      name: 'No Data',
      amount: 1,
      color: COLORS.border,
      legendFontColor: COLORS.muted,
      legendFontSize: 12,
    });
  }

  return (
    <View style={styles.container}>
      <PieChart
        data={chartData}
        width={screenWidth - 48}
        height={200}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: () => COLORS.text,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="8"
        absolute={false}
      />
      {data.length > 0 && (
        <View style={styles.legend}>
          {data.slice(0, 6).map((item) => (
            <View key={item.category_id} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: item.category_color }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                {item.category_name}
              </Text>
              <Text style={styles.legendAmount}>{formatCurrency(item.total)}</Text>
              <Text style={styles.legendPercent}>{item.percentage?.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  legend: {
    marginTop: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  legendAmount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  legendPercent: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    width: 40,
    textAlign: 'right',
  },
});
