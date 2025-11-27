import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const MetricsCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4 rounded" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-20" />
    </CardContent>
  </Card>
);

export const TableRowSkeleton = ({ columns = 7 }: { columns?: number }) => (
  <tr className="border-b border-border">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-4">
        <Skeleton className="h-4 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

export const TableSkeleton = ({ rows = 5, columns = 7 }: { rows?: number; columns?: number }) => (
  <div className="w-full">
    <div className="border border-border rounded-md">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const MetricsGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
    {Array.from({ length: 5 }).map((_, i) => (
      <MetricsCardSkeleton key={i} />
    ))}
  </div>
);
