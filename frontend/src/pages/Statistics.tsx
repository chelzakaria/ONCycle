import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LineChart } from '@tremor/react';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../dbClient';
import { DateRangePicker } from '../components/tremor/DatePicker';
import { Card } from '../components/tremor/Card';
import { TabGroup, TabList, Tab, TabPanels, TabPanel, BarChart, BarList } from '@tremor/react';

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
  start_station?: string;
  end_station?: string;
}

interface ChartDataPoint {
  date: string;
  [trainType: string]: string | number;
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

const timeFormatter = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes === 0 ? `${hours} hr` : `${hours} hr ${remainingMinutes} min`;
  }
};


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
  const [trips, setTrips] = useState<Trip[]>([]);

  // Memoized lookup for trips by date and train type
  const tripLookup = useMemo(() => {
    const lookup: { [date: string]: { [trainType: string]: Trip[] } } = {};
    trips.forEach(trip => {
      const date = formatDate(trip.date);
      if (!lookup[date]) lookup[date] = {};
      if (!lookup[date][trip.train_type]) lookup[date][trip.train_type] = [];
      lookup[date][trip.train_type].push(trip);
    });
    return lookup;
  }, [trips]);

  const averageDelayData = useMemo(() => chartData.map(row => {
    const avgRow: { [key: string]: string | number } = { date: row.date };
    categories.forEach(type => {
      const tripsForDateType = (tripLookup[row.date] && tripLookup[row.date][type]) || [];
      // Only consider trips with arrival_delay >= 5
      const delayedTrips = tripsForDateType.filter(trip => (trip.arrival_delay || 0) >= 5)
      const trainCount = delayedTrips.length;
      const totalDelay = delayedTrips.reduce((sum, trip) => sum + (trip.arrival_delay || 0), 0);
      avgRow[type] = trainCount > 0 ? Math.round(totalDelay / trainCount) : 0;
    });
    return avgRow;
  }), [chartData, categories, tripLookup]);

  useEffect(() => {
    async function fetchData(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const fromDate = formatDateForDB(dateRange.from);
        const toDate = formatDateForDB(dateRange.to);

        console.log('Querying date range:', { fromDate, toDate });

        // Use the train_delays view instead of trips table
        const { data: tripsData, error: dbError } = await supabase
          .from('train_delays')
          .select('*')
          .gte('date', fromDate)
          .lte('date', toDate)
          // .filter('arrival_delay', 'gte', 5) // Only include delays greater than 5 minutes
          .returns<Trip[]>();

        if (dbError) {
          console.error('Database error:', dbError);
          setError('Failed to fetch trip data');
          setLoading(false);
          return;
        }

        if (!tripsData || tripsData.length === 0) {
          console.log('No trips found for date range');
          setChartData([]);
          setCategories([]);
          setTrips([]);
          setLoading(false);
          return;
        }

        console.log('Raw trips data from view:', tripsData);
        console.log('Number of trips found:', tripsData.length);

        setTrips(tripsData);

        // No need to group by date+train_id since the view already gives us last sequence
        // trips already contains only the final sequence for each train per date

        // Get all unique dates in the range
        const dateSet = new Set<string>(tripsData.map((trip: Trip) => trip.date));
        const allDates: string[] = Array.from(dateSet).sort((a, b) =>
          new Date(a).getTime() - new Date(b).getTime()
        );

        // Get all train types present in the data
        const allTypes: string[] = ['TNR', 'TLR', 'TL', 'GV'];

        // Build a lookup for (date, train_type) => value
        const valueLookup: ValueLookup = {};
        tripsData.forEach((trip: Trip) => {
          const date = trip.date;
          const trainType = trip.train_type;
          if (!valueLookup[date]) {
            valueLookup[date] = {};
          }
          // Only consider delays >= 5
          const currentValue = valueLookup[date][trainType] || 0;
          const delayValue = (trip.arrival_delay && trip.arrival_delay >= 5) ? trip.arrival_delay : 0;
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
  const presets = [
    {
      label: "Today",
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      label: "Last 7 days",
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date(),
      },
    },
    {
      label: "Last 30 days",
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
      },
    },
    {
      label: "Last 3 months",
      dateRange: {
        from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        to: new Date(),
      },
    },
    {
      label: "Last 6 months",
      dateRange: {
        from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        to: new Date(),
      },
    },
    {
      label: "Month to date",
      dateRange: {
        from: new Date(new Date().setDate(1)),
        to: new Date(),
      },
    },
    {
      label: "Year to date",
      dateRange: {
        from: new Date(new Date().setFullYear(new Date().getFullYear(), 0, 1)),
        to: new Date(),
      },
    },
  ]


  // Debug: log average and total delay data
  console.log('Average Delay Data:', averageDelayData);
  console.log('Total Delay Data (chartData):', chartData);

  return (
    <>
      <div className="relative pr-8 w-full py-3 px-2" style={{ background: '#11161B', minHeight: 'calc(100vh - 75px)', marginTop: '75px' }}>
        <div className="flex items-center justify-between px-6  mb-3">
          <h3 className="text-tremor-title font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Train Delay History
            {/* <p className="text-tremor-content text-sm dark:text-dark-tremor-content">
              View historical train delay data for the last 6 months
            </p> */}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-tremor-default text-gray-300 dark:text-gray-400">Pick a date range:</span>
            <DateRangePicker
              toDate={new Date()}
              presets={presets}
              value={dateRange}
              onChange={handleDateRangeChange}
              id="date_1"
              className="w-60 bg-[#11161B] border-2 border-[#3B4A59] text-white"
            />
          </div>
        </div>
        <div className="w-full rounded-tremor-default border-2 border-[#3B4A59] bg-[#11161B] pb-8 pt-0 pr-6 py-4 ml-3 shadow-tremor-input md:h-200">
          <div className="mt-4">
            <TabGroup defaultIndex={0}>
              <TabList className="flex justify-center gap-2 border-b border-gray-700 bg-transparent pb-2">
                {['Total Delays', 'Average Delay', 'Delay Count'].map((tab) => (
                  <Tab
                    key={tab}
                    className="px-4 py-2 font-medium text-base rounded-none bg-transparent border-none shadow-none outline-none
                      ui-selected:text-blue-600 ui-selected:border-b-4 ui-selected:border-blue-600
                      ui-not-selected:text-gray-400 ui-not-selected:border-b-0
                      transition-all"
                  >
                    {tab}
                  </Tab>
                ))}
              </TabList>
              <TabPanels>
                {['Total Delays', 'Average Delay', 'Delay Percentage'].map((tab, _) => (
                  <TabPanel key={tab} className="p-0 pt-6">
                    {error && (
                      <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {error}
                      </div>
                    )}
                    {loading ? (
                      <div className="  flex items-center justify-center">
                        <div className="text-tremor-content dark:text-dark-tremor-content">
                          Loading train delay data...
                        </div>
                      </div>
                    ) : chartData.length > 0 ? (
                      tab === 'Delay Percentage' ? (
                        <BarChart
                          data={chartData.map(row => {
                            const result: { date: string;[key: string]: number | string } = { date: row.date };

                            // Calculate delay percentage for each train type
                            categories.forEach(type => {
                              const tripsForDateType = (tripLookup[row.date] && tripLookup[row.date][type]) || [];
                              const totalTrains = tripsForDateType.length;
                              // Only consider delays >= 5
                              const delayedTrains = tripsForDateType.filter(trip => (trip.arrival_delay || 0) >= 5).length;

                              result[`${type} Delay %`] = totalTrains > 0 ? Math.round((delayedTrains / totalTrains) * 100) : 0;
                            });

                            return result;
                          })}
                          index="date"
                          categories={categories.map(type => `${type} Delay %`)}
                          colors={['blue', 'violet', 'fuchsia', 'lime']}
                          yAxisWidth={60}
                          className="h-80"
                          showLegend={true}
                        />
                      ) : (
                        <LineChart
                          data={
                            tab === 'Average Delay' ? averageDelayData : chartData
                          }
                          index="date"
                          categories={categories}
                          colors={['blue', 'violet', 'fuchsia', 'lime']}
                          yAxisWidth={60}
                          className="h-80"
                          onValueChange={() => { }}
                          valueFormatter={timeFormatter}
                          showLegend={false}
                        />
                      )
                    ) : (
                      <div className="h-96 flex items-center justify-center">
                        <div className="text-tremor-content dark:text-dark-tremor-content">
                          No delay data available for selected date range
                        </div>
                      </div>
                    )}
                  </TabPanel>
                ))}
              </TabPanels>
            </TabGroup>

          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-28 w-full ml-5 pr-6">
          <Card className="flex-1 mt-4 rounded-tremor-default  !border-2 !border-[#3B4A59] !bg-[#11161B] shadow-tremor-input pb-8 pt-0 pr-6 py-4 dark:text-dark-tremor-content">
            <div className="flex items-center justify-between">
              <p className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Longest Delays
              </p>
              <p className="text-tremor-label font-medium uppercase text-tremor-content dark:text-dark-tremor-content">
                Durations
              </p>
            </div>
            <div className="mt-6">
              <BarList
                data={trips
                  .filter(trip => (trip.arrival_delay || 0) >= 5)
                  .sort((a, b) => (b.arrival_delay || 0) - (a.arrival_delay || 0))
                  .slice(0, 5)
                  .map(trip => {
                    const delay = trip.arrival_delay || 0;

                    return {
                      name: `${trip.start_station || 'Unknown'} → ${trip.end_station || 'Unknown'}`,
                      value: delay,
                    };
                  })}
                valueFormatter={(delay: number) => {
                  const hours = Math.floor(delay / 60);
                  const minutes = delay % 60;
                  return hours > 0 ? `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min` : `${minutes} min`;
                }}
              />
            </div>
          </Card>
          <Card className="flex-1 mt-4 rounded-tremor-default  !border-2 !border-[#3B4A59] !bg-[#11161B] shadow-tremor-input pb-8 pt-0 pr-6 py-4 dark:text-dark-tremor-content">
            <div className="flex items-center justify-between">
              <p className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Routes with Most Delays
              </p>
              <p className="text-tremor-label font-medium uppercase text-tremor-content dark:text-dark-tremor-content">
                Occurrences
              </p>
            </div>
            <div className="mt-6">
              {/* BarList for most frequent delayed routes */}
              <BarList
                data={(() => {
                  // Count occurrences of each route with delay >= 5
                  const routeCount: Record<string, number> = {};
                  trips
                    .filter(trip => (trip.arrival_delay || 0) >= 5)
                    .forEach(trip => {
                      const route = `${trip.start_station || 'Unknown'} → ${trip.end_station || 'Unknown'}`;
                      routeCount[route] = (routeCount[route] || 0) + 1;
                    });
                  // Convert to array and sort by count descending
                  return Object.entries(routeCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, value]) => ({ name, value }));
                })()}
              />
            </div>
          </Card>
        </div>

      </div >
    </>
  );
};

export default Statistics;