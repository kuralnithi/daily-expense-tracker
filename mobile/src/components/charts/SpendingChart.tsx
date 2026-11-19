import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { DailySummary } from '../../types';
import { COLORS } from '../../utils/constants';
import dayjs from 'dayjs';

interface SpendingChartProps {
  data: DailySummary[];
  month: number;
  year: number;
}

const screenWidth = Dimensions.get('window').width;

export default function SpendingChart({ data, month, year }: SpendingChartProps) {
  // Build chart data — only show last 15 days max for readability
  const daysToShow = data.slice(-15);

  const labels = daysToShow.map((d) => dayjs(d.date).format('DD'));
  const values = daysToShow.map((d) => Number(d.total_expenses) || 0);

  // Fallback if no data
  const hasData = values.some((v) => v > 0);
  const chartValues = hasData ? values : [0, 0, 0, 0, 0];
  const chartLabels = hasData ? labels : ['', '', '', '', ''];

  const chartData = {
    labels: chartLabels,
    datasets: [{ data: chartValues }],
  };

  return (
    <View style={styles.container}>
      <BarChart
        data={chartData}
        width={screenWidth - 48}
        height={180}
        yAxisLabel="₹"
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: COLORS.card,
          backgroundGradientFrom: COLORS.card,
          backgroundGradientTo: COLORS.card,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          labelColor: () => COLORS.muted,
          style: { borderRadius: 12 },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: COLORS.border,
            strokeWidth: 1,
          },
          barPercentage: 0.6,
        }}
        style={styles.chart}
        showValuesOnTopOfBars={false}
        withInnerLines={true}
        fromZero={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
  },
});
