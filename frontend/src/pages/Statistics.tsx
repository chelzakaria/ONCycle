import {
  RiAppleFill,
  RiGoogleFill,
  RiMastercardLine,
  RiVisaFill,
} from '@remixicon/react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LineChart } from '@tremor/react';
import { useEffect, useState } from 'react';
import { supabase } from '../dbClient';
import { DateRangePicker } from '../components/tremor/DatePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/tremor/Select';

// TypeScript interfaces
interface Trip {
  id?: number;
  date: string; // yyyy-mm-dd format
  train_id: string;
  train_type: string;
  sequence: number;
  arrival_delay: number | null;
  theorical_arrival_time?: string;
  created_at?: string;
}

interface ChartDataPoint {
  date: string;
  [trainType: string]: string | number; // date is string, train types are numbers
}

interface DateRange {
  from: Date;
  to: Date;
}

interface ValueLookup {
  [date: string]: {
    [trainType: string]: number;
  };
}

// Utility functions
export function cx(...args: (string | undefined | null | false)[]): string {
  return twMerge(clsx(...args));
}

export const focusInput = [
  'focus:ring-2',
  'focus:ring-tremor-brand-muted focus:dark:ring-dark-tremor-brand-muted',
  'focus:border-tremor-brand-subtle focus:dark:border-dark-tremor-brand-subtle',
];

export const hasErrorInput = [
  'ring-2',
  'border-red-500 dark:border-red-700',
  'ring-red-200 dark:ring-red-700/30',
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate().toString().padStart(2, '0');
  return `${month} ${day}`;
}

function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const Statistics: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 10)),
    to: new Date(),
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const fromDate = formatDateForDB(dateRange.from);
        const toDate = formatDateForDB(dateRange.to);

        console.log('Querying date range:', { fromDate, toDate });

        // Use the train_delays view instead of trips table
        const { data: trips, error: dbError } = await supabase
          .from('train_delays')
          .select('*')
          .gte('date', fromDate)
          .lte('date', toDate)
          .returns<Trip[]>();

        if (dbError) {
          console.error('Database error:', dbError);
          setError('Failed to fetch trip data');
          setLoading(false);
          return;
        }

        if (!trips || trips.length === 0) {
          console.log('No trips found for date range');
          setChartData([]);
          setCategories([]);
          setLoading(false);
          return;
        }

        console.log('Raw trips data from view:', trips);
        console.log('Number of trips found:', trips.length);

        // No need to group by date+train_id since the view already gives us last sequence
        // trips already contains only the final sequence for each train per date

        // Get all unique dates in the range
        const dateSet = new Set<string>(trips.map((trip: Trip) => trip.date));
        const allDates: string[] = Array.from(dateSet).sort((a, b) =>
          new Date(a).getTime() - new Date(b).getTime()
        );

        // Get all train types present in the data
        const allTypes: string[] = ['TNR', 'TLR', 'TL', 'GV'];

        // Build a lookup for (date, train_type) => value
        const valueLookup: ValueLookup = {};
        trips.forEach((trip: Trip) => {
          const date = trip.date;
          const trainType = trip.train_type;
          if (!valueLookup[date]) {
            valueLookup[date] = {};
          }
          const currentValue = valueLookup[date][trainType] || 0;
          const delayValue = trip.arrival_delay || 0;
          valueLookup[date][trainType] = currentValue + delayValue;
        });

        // Build chartRows with all dates and all train types (fill 0 if missing)
        const chartRows: ChartDataPoint[] = allDates.map((date: string) => {
          const row: ChartDataPoint = {
            date: formatDate(date),
          };

          allTypes.forEach((type: string) => {
            row[type] = valueLookup[date]?.[type] || 0;
          });

          return row;
        });

        console.log('Chart data for selected date range:', chartRows);
        console.log('Train types found:', allTypes);
        setChartData(chartRows);
        setCategories(allTypes);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dateRange]);

  const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setDateRange({
        from: range.from,
        to: range.to,
      });
    }
  };

  return (
    <>
      <div className="relative mt-20">
        <div className="rounded-tremor-default border border-tremor-border bg-tremor-background pb-20 shadow-tremor-input dark:border-dark-tremor-border dark:bg-dark-tremor-background dark:shadow-dark-tremor-input md:h-250">
          <div className="grid grid-cols-1 gap-4 border-b border-tremor-border p-6 dark:border-dark-tremor-border sm:grid-cols-2 md:grid-cols-4">
            <div className="w-full flex justify-end">
              <div className="w-full max-w-xs">
                <label
                  htmlFor="date_1"
                  className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong"
                >
                  Date Range
                </label>
                <DateRangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  id="date_1"
                  className="mt-2 border-tremor-border dark:border-dark-tremor-border"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-tremor-content dark:text-dark-tremor-content">
                Loading train delay data...
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <LineChart
              data={chartData}
              index="date"
              categories={categories}
              colors={['blue', 'violet', 'fuchsia', 'lime']}
              yAxisWidth={60}
              className="mt-6 hidden h-96 sm:block"
            />
          ) : (
            <div className="h-96 flex items-center justify-center">
              <div className="text-tremor-content dark:text-dark-tremor-content">
                No delay data available for selected date range
              </div>
            </div>
          )}

          {/* Mobile chart - only show if we have data */}
          {chartData.length > 0 && (
            <LineChart
              data={chartData}
              index="date"
              categories={categories.slice(0, 3)}
              colors={['blue', 'violet', 'fuchsia']}
              showYAxis={false}
              showLegend={false}
              startEndOnly={true}
              className="mt-6 h-72 sm:hidden"
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Statistics;